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

    /// <summary>各优先级的 SLA 时限（小时）</summary>
    private static readonly Dictionary<WorkOrderPriority, int> SlaHours = new()
    {
        { WorkOrderPriority.Critical, 4 },
        { WorkOrderPriority.High, 8 },
        { WorkOrderPriority.Medium, 24 },
        { WorkOrderPriority.Low, 72 },
    };

    /// <summary>即将超时阈值（剩余时间 < SLA 的 20%）</summary>
    private const double WarningThreshold = 0.2;

    public SlaManagementService(AppDbContext db, ILogger<SlaManagementService> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// 获取工单的 SLA 状态
    /// </summary>
    public static SlaStatus GetSlaStatus(Core.Entities.WorkOrder workOrder)
    {
        // 已关闭/已取消的工单不需要 SLA
        if (workOrder.Status is WorkOrderStatus.Closed or WorkOrderStatus.Cancelled)
            return SlaStatus.Completed;

        var slaHours = SlaHours.GetValueOrDefault(workOrder.Priority, 24);
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
        var slaHours = SlaHours.GetValueOrDefault(workOrder.Priority, 24);
        return workOrder.CreatedAt.AddHours(slaHours);
    }

    /// <summary>
    /// 扫描超时工单，自动升级优先级
    /// </summary>
    public async Task<int> CheckAndEscalateAsync(Guid tenantId, CancellationToken ct = default)
    {
        var activeStatuses = new List<WorkOrderStatus>
        {
            WorkOrderStatus.PendingDispatch,
            WorkOrderStatus.Assigned,
            WorkOrderStatus.InProgress,
            WorkOrderStatus.SubmittedForApproval,
        };

        var workOrders = await _db.WorkOrders
            .Where(w => w.TenantId == tenantId && activeStatuses.Contains(w.Status))
            .ToListAsync(ct);

        var escalated = 0;
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
                    wo.Priority = wo.Priority - 1;
                    escalated++;
                    _logger.LogInformation("工单 {Code} SLA 超时，优先级升级为 {Priority}", wo.WorkOrderCode, wo.Priority);
                }
            }
        }

        if (escalated > 0)
        {
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("SLA 检查完成: {Count} 个工单已自动升级", escalated);
        }

        return escalated;
    }

    /// <summary>
    /// 获取 SLA 统计概览
    /// </summary>
    public async Task<SlaSummary> GetSummaryAsync(Guid tenantId, CancellationToken ct = default)
    {
        var activeStatuses = new List<WorkOrderStatus>
        {
            WorkOrderStatus.PendingDispatch,
            WorkOrderStatus.Assigned,
            WorkOrderStatus.InProgress,
            WorkOrderStatus.SubmittedForApproval,
        };

        var workOrders = await _db.WorkOrders
            .Where(w => w.TenantId == tenantId && activeStatuses.Contains(w.Status))
            .ToListAsync(ct);

        var summary = new SlaSummary();
        foreach (var wo in workOrders)
        {
            var status = GetSlaStatus(wo);
            switch (status)
            {
                case SlaStatus.OnTrack:
                    summary.OnTrack++;
                    break;
                case SlaStatus.Warning:
                    summary.Warning++;
                    break;
                case SlaStatus.Overdue:
                    summary.Overdue++;
                    break;
            }
        }
        summary.Total = workOrders.Count;
        return summary;
    }
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
