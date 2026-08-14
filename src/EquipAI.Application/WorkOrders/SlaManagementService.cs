using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders;

/// <summary>
/// 工单 SLA 管理服务（Phase 5 新增）
///
/// 按优先级设置 SLA 时限：
/// - Critical: 4 小时
/// - High: 8 小时
/// - Medium: 24 小时
/// - Low: 72 小时
///
/// 功能：
/// 1. 计算工单的 SLA 状态（正常/即将超时/已超时）
/// 2. 扫描超时工单，自动升级优先级 + 通知主管
/// </summary>
public class SlaManagementService
{
    private readonly AppDbContext _db;
    private readonly ILogger<SlaManagementService> _logger;
    private readonly ISignalRNotificationService? _notifications;

    /// <summary>即将超时阈值（剩余时间 < SLA 的 20%）</summary>
    private const double WarningThreshold = 0.2;
    private const int ScanBatchSize = 500;

    private static readonly WorkOrderStatus[] ActiveStatuses =
    [
        WorkOrderStatus.PendingDispatch,
        WorkOrderStatus.Assigned,
        WorkOrderStatus.InProgress,
        WorkOrderStatus.SubmittedForApproval,
    ];

    public SlaManagementService(AppDbContext db, ILogger<SlaManagementService> logger)
    {
        _db = db;
        _logger = logger;
        _notifications = null;  // 兼容老调用点（无通知能力）
    }

    /// <summary>
    /// 注入通知服务的构造函数（生产环境推荐使用）
    /// </summary>
    public SlaManagementService(
        AppDbContext db,
        ILogger<SlaManagementService> logger,
        ISignalRNotificationService notifications)
    {
        _db = db;
        _logger = logger;
        _notifications = notifications;
    }

    /// <summary>
    /// 获取工单的 SLA 状态
    /// </summary>
    public static SlaStatus GetSlaStatus(Core.Entities.WorkOrder workOrder)
    {
        // 已关闭/已取消的工单不需要 SLA
        if (workOrder.Status is WorkOrderStatus.Closed or WorkOrderStatus.Cancelled)
            return SlaStatus.Completed;

        // 关键修复：原代码本类内独立定义了 SlaHours 字典（Critical=4h），
        // 与 SlaTracker.SlaHours（Critical=2h）不一致，导致前端倒计时显示
        // "已逾期"但后端判定"未超时"的矛盾。改为引用 SlaTracker 作为单一来源。
        var slaHours = SlaTracker.GetHours(workOrder.Priority);
        var slaDeadline = workOrder.CreatedAt.AddHours(slaHours);
        var now = DateTime.UtcNow;

        if (now > slaDeadline)
            return SlaStatus.Overdue;

        var remaining = (slaDeadline - now).TotalHours;
        if (remaining < slaHours * WarningThreshold)
            return SlaStatus.Warning;

        return SlaStatus.OnTrack;
    }

    /// <summary>
    /// 计算工单的 SLA 截止时间
    /// </summary>
    public static DateTime GetSlaDeadline(Core.Entities.WorkOrder workOrder)
    {
        var slaHours = SlaTracker.GetHours(workOrder.Priority);
        return workOrder.CreatedAt.AddHours(slaHours);
    }

    /// <summary>
    /// 扫描超时工单，自动升级优先级
    /// </summary>
    public async Task<int> CheckAndEscalateAsync(Guid tenantId, CancellationToken ct = default)
    {
        // IgnoreQueryFilters + 显式 tenantId：本方法可由后台 SlaEscalationHostedService 调用（无 HttpContext，
        // 全局过滤器解析为 Guid.Empty，默认查询与 tenantId 求交集恒为空 → 后台扫描查不到任何工单）。
        // HTTP（SlaController）路径下 IgnoreQueryFilters + 显式 tenantId 与默认过滤器等价，行为不变。
        var escalated = 0;
        var lastId = Guid.Empty;
        while (true)
        {
            ct.ThrowIfCancellationRequested();

            var workOrders = await _db.WorkOrders
                .IgnoreQueryFilters()
                .Where(w => w.TenantId == tenantId
                         && ActiveStatuses.Contains(w.Status)
                         && w.Id > lastId)
                .OrderBy(w => w.Id)
                .Take(ScanBatchSize)
                .ToListAsync(ct);

            if (workOrders.Count == 0)
                break;

            var escalatedWos = new List<(Core.Entities.WorkOrder Wo, WorkOrderPriority OldPriority)>();
            foreach (var wo in workOrders)
            {
                var status = GetSlaStatus(wo);
                if (status == SlaStatus.Overdue)
                {
                    // 自动升级优先级（Low→Medium→High→Critical，最高不再升）
                    // 注意：枚举顺序是 Critical=0 < High < Medium < Low=3，
                    // 升级方向 = Priority 值减小。所以判断条件是 "> Critical" 且升级用 -1。
                    // 原代码 "< Critical" 永远 false（因 Critical 是最小值），自动升级实际失效。
                    if (wo.Priority > WorkOrderPriority.Critical)
                    {
                        var oldPriority = wo.Priority;
                        wo.Priority = wo.Priority - 1;
                        escalated++;
                        escalatedWos.Add((wo, oldPriority));
                        _logger.LogInformation("工单 {Code} SLA 超时，优先级升级为 {Priority}", wo.WorkOrderCode, wo.Priority);
                    }
                }
            }

            if (escalatedWos.Count > 0)
            {
                await _db.SaveChangesAsync(ct);
                _logger.LogInformation("SLA 检查批次完成: {Count} 个工单已自动升级", escalatedWos.Count);

                // 关键修复：升级后必须通知主管（原代码只升级不通知，主管完全不知情，
                // 工单继续无人处理）。逐条推送 SignalR + 持久化 + Web Push。
                if (_notifications != null)
                {
                    foreach (var (wo, oldPriority) in escalatedWos)
                    {
                        try
                        {
                            await _notifications.SendWorkOrderEscalatedAsync(
                                tenantId, wo.Id, wo.WorkOrderCode, wo.Title,
                                oldPriority.ToString(), wo.Priority.ToString(), ct);
                        }
                        catch (OperationCanceledException) when (ct.IsCancellationRequested)
                        {
                            // 普通通知故障可以隔离，但宿主停机取消必须继续传播，避免后台服务拖延退出。
                            throw;
                        }
                        catch (Exception ex)
                        {
                            // 单条通知失败不应阻塞整体流程（其他工单仍需处理）
                            _logger.LogError(ex, "SLA 升级通知推送失败，工单 {Code}", wo.WorkOrderCode);
                        }
                    }
                }
            }

            lastId = workOrders[^1].Id;
            _db.ChangeTracker.Clear();

            if (workOrders.Count < ScanBatchSize)
                break;
        }

        return escalated;
    }

    /// <summary>
    /// 获取 SLA 统计概览
    /// </summary>
    public async Task<SlaSummary> GetSummaryAsync(Guid tenantId, CancellationToken ct = default)
    {
        // IgnoreQueryFilters + 显式 tenantId：同 CheckAndEscalateAsync，后台扫描需绕过 Guid.Empty 过滤器
        var summaryRows = await _db.WorkOrders
            .IgnoreQueryFilters()
            .Where(w => w.TenantId == tenantId && ActiveStatuses.Contains(w.Status))
            .GroupBy(w => new { w.Priority, w.Status })
            .Select(g => new SlaSummaryGroup(g.Key.Priority, g.Key.Status, g.Count()))
            .ToListAsync(ct);

        var now = DateTime.UtcNow;
        var summary = new SlaSummary();
        foreach (var row in summaryRows)
        {
            // 按优先级和状态分组后，仍需按时间阈值分类。对于同一分组内跨越阈值的工单，
            // 继续使用数据库 COUNT 查询拆分边界，避免重新加载原始工单。
            var slaHours = SlaTracker.GetHours(row.Priority);
            var deadline = now.AddHours(-slaHours);
            var warningBoundary = now.AddHours(-slaHours * (1 - WarningThreshold));

            var overdueCount = await CountBeforeAsync(tenantId, row.Priority, row.Status, deadline, ct);
            var warningCount = await CountBetweenAsync(
                tenantId,
                row.Priority,
                row.Status,
                deadline,
                warningBoundary,
                ct);
            var onTrackCount = row.Count - overdueCount - warningCount;

            if (onTrackCount > 0)
            {
                summary.OnTrack += onTrackCount;
            }
            summary.Warning += warningCount;
            summary.Overdue += overdueCount;
        }
        summary.Total = summary.OnTrack + summary.Warning + summary.Overdue;
        return summary;
    }

    /// <summary>按优先级、活动状态统计已超过 SLA 截止时间的工单数量。</summary>
    private Task<int> CountBeforeAsync(
        Guid tenantId,
        WorkOrderPriority priority,
        WorkOrderStatus status,
        DateTime deadline,
        CancellationToken ct)
        => _db.WorkOrders
            .IgnoreQueryFilters()
            .Where(w => w.TenantId == tenantId
                     && w.Priority == priority
                     && w.Status == status
                     && w.CreatedAt < deadline)
            .CountAsync(ct);

    /// <summary>按优先级、活动状态和创建时间半开区间统计临近超时工单数量。</summary>
    private Task<int> CountBetweenAsync(
        Guid tenantId,
        WorkOrderPriority priority,
        WorkOrderStatus status,
        DateTime fromInclusive,
        DateTime toExclusive,
        CancellationToken ct)
        => _db.WorkOrders
            .IgnoreQueryFilters()
            .Where(w => w.TenantId == tenantId
                     && w.Priority == priority
                     && w.Status == status
                     && w.CreatedAt >= fromInclusive
                     && w.CreatedAt < toExclusive)
            .CountAsync(ct);

    /// <summary>数据库返回的优先级/状态分组摘要。</summary>
    private readonly record struct SlaSummaryGroup(
        WorkOrderPriority Priority,
        WorkOrderStatus Status,
        int Count);
}

/// <summary>SLA 状态枚举</summary>
public enum SlaStatus
{
    /// <summary>正常</summary>
    OnTrack,
    /// <summary>即将超时（剩余 < 20%）</summary>
    Warning,
    /// <summary>已超时</summary>
    Overdue,
    /// <summary>已完成（关闭/取消）</summary>
    Completed,
}

/// <summary>SLA 统计概览</summary>
public sealed class SlaSummary
{
    public int Total { get; set; }
    public int OnTrack { get; set; }
    public int Warning { get; set; }
    public int Overdue { get; set; }
}
