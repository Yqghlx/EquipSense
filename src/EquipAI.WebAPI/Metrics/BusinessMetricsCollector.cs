using EquipAI.Application.Hosting;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Metrics;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Metrics;

/// <summary>
/// 业务指标采集后台服务 — 每 30 秒从数据库采集 Gauge 类型的业务指标
/// Counter/Histogram 类型由业务代码在操作时直接记录，无需定时采集
/// </summary>
public class BusinessMetricsCollector : LockedTimerService
{
    private readonly IServiceScopeFactory _scopeFactory;

    /// <summary>上一次采集到的标签集合，用于检测已消失的标签并将其归零</summary>
    private readonly HashSet<string> _lastAlertLabels = [];
    private readonly HashSet<string> _lastWorkOrderLabels = [];
    private readonly HashSet<string> _lastRuleLabels = [];

    public BusinessMetricsCollector(
        IServiceScopeFactory scopeFactory,
        IDistributedLockProvider lockProvider,
        ILogger<BusinessMetricsCollector> logger)
        : base(lockProvider, logger, lockResource: "business-metrics-collector", lockExpiry: TimeSpan.FromMinutes(5))
    {
        _scopeFactory = scopeFactory;
    }

    /// <summary>启动后等待 15 秒，让数据库迁移和种子数据先完成。</summary>
    protected override TimeSpan DefaultStartupDelay => TimeSpan.FromSeconds(15);

    /// <summary>每 30 秒采集一次业务指标。</summary>
    protected override TimeSpan DefaultInterval => TimeSpan.FromSeconds(30);

    /// <summary>基类回调：持锁后执行采集。</summary>
    protected override Task ExecuteWorkAsync(CancellationToken ct) => CollectAsync();

    private async Task CollectAsync()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 活跃告警数（按严重级别分组）
        // 注意：EF Core 无法翻译枚举 ToString()，先查到内存再分组
        var activeAlertsRaw = await db.Alerts
            .IgnoreQueryFilters()
            .Where(a => a.Status == AlertStatus.Active)
            .Select(a => new { a.Severity })
            .ToListAsync();

        var activeAlerts = activeAlertsRaw
            .GroupBy(a => a.Severity.ToString())
            .Select(g => new { Severity = g.Key, Count = g.Count() })
            .ToList();

        // 将上一次存在但本次不存在的标签归零
        var currentAlertLabels = activeAlerts.Select(g => g.Severity).ToHashSet();
        foreach (var old in _lastAlertLabels.Except(currentAlertLabels))
        {
            BusinessMetrics.ActiveAlerts.WithLabels(old).Set(0);
        }
        _lastAlertLabels.Clear();
        foreach (var group in activeAlerts)
        {
            BusinessMetrics.ActiveAlerts.WithLabels(group.Severity).Set(group.Count);
            _lastAlertLabels.Add(group.Severity);
        }

        // 工单数（按状态分组）
        // 注意：同上，EF Core 无法翻译枚举 ToString()，先查内存再分组
        var workOrdersRaw = await db.WorkOrders
            .IgnoreQueryFilters()
            .Select(w => new { w.Status })
            .ToListAsync();

        var workOrders = workOrdersRaw
            .GroupBy(w => w.Status.ToString())
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToList();

        var currentWoLabels = workOrders.Select(g => g.Status).ToHashSet();
        foreach (var old in _lastWorkOrderLabels.Except(currentWoLabels))
        {
            BusinessMetrics.WorkOrdersByStatus.WithLabels(old).Set(0);
        }
        _lastWorkOrderLabels.Clear();
        foreach (var group in workOrders)
        {
            BusinessMetrics.WorkOrdersByStatus.WithLabels(group.Status).Set(group.Count);
            _lastWorkOrderLabels.Add(group.Status);
        }

        // 知识规则数（按启用状态分组）
        var rules = await db.KnowledgeRules
            .IgnoreQueryFilters()
            .GroupBy(r => r.Enabled ? "enabled" : "disabled")
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        BusinessMetrics.KnowledgeRules.WithLabels("enabled").Set(0);
        BusinessMetrics.KnowledgeRules.WithLabels("disabled").Set(0);
        BusinessMetrics.KnowledgeRules.WithLabels("pending").Set(0);

        foreach (var group in rules)
        {
            BusinessMetrics.KnowledgeRules.WithLabels(group.Status).Set(group.Count);
        }

        var pendingRules = await db.PendingRules.IgnoreQueryFilters().CountAsync();
        BusinessMetrics.KnowledgeRules.WithLabels("pending").Set(pendingRules);
    }
}
