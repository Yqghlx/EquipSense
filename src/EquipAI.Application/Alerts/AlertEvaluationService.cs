using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Metrics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Alerts;

/// <summary>
/// 告警评估服务，协调规则查询、评估器调用和告警创建
/// 处理流程：
/// 1. 根据租户、指标、设备类型查询匹配的启用规则
/// 2. 调用对应类型的评估器判断是否触发
/// 3. 通过聚合器判断是创建、更新还是静默（防风暴）
/// 4. 创建/更新告警并发布 AlertTriggeredEvent
/// </summary>
public class AlertEvaluationService : IAlertEvaluationService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IEventBus _eventBus;
    private readonly IAlertAggregator _aggregator;
    private readonly IEnumerable<IAlertRuleEvaluator> _evaluators;
    private readonly ILogger<AlertEvaluationService> _logger;

    public AlertEvaluationService(
        IServiceScopeFactory scopeFactory,
        IEventBus eventBus,
        IAlertAggregator aggregator,
        IEnumerable<IAlertRuleEvaluator> evaluators,
        ILogger<AlertEvaluationService> logger)
    {
        _scopeFactory = scopeFactory;
        _eventBus = eventBus;
        _aggregator = aggregator;
        _evaluators = evaluators;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task EvaluateForDeviceAsync(Guid tenantId, Guid deviceId, string deviceType,
        string metric, double value, DeviceContext context, CancellationToken cancellationToken = default)
    {
        // 使用独立作用域获取 DbContext，避免长生命周期导致的连接泄漏
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 查询当前设备当前指标的基线数据，供 BaselineEvaluator 使用
        // 使用 IgnoreQueryFilters 绕过全局租户过滤器（后台事件处理器无 HttpContext）
        var baseline = await dbContext.Set<Core.Entities.MetricBaseline>()
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(b =>
                b.TenantId == tenantId &&
                b.DeviceId == deviceId &&
                b.Metric == metric, cancellationToken);

        if (baseline != null)
        {
            context.Baseline = baseline;
        }

        // 查询匹配的告警规则：
        // - 同租户、已启用、指标匹配
        // - 设备 ID 为空（通用规则）或等于当前设备
        // - 设备类型为空（通用规则）或等于当前设备类型
        // 使用 IgnoreQueryFilters 绕过全局租户过滤器（后台事件处理器无 HttpContext）

        // 调用方（TelemetryEventHandler）未提供设备类型时，从数据库查询，否则按 DeviceType 过滤的规则永远匹配不到
        if (string.IsNullOrEmpty(deviceType))
        {
            deviceType = await dbContext.Devices
                .IgnoreQueryFilters()
                .Where(d => d.Id == deviceId)
                .Select(d => d.Type)
                .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;
        }

        var rules = await dbContext.AlertRules
            .IgnoreQueryFilters()
            .Where(r => r.TenantId == tenantId && r.Enabled && r.Metric == metric)
            .Where(r => r.DeviceId == null || r.DeviceId == deviceId)
            .Where(r => r.DeviceType == null || r.DeviceType == deviceType)
            .ToListAsync();

        if (rules.Count == 0)
            return;

        foreach (var rule in rules)
        {
            // 根据规则类型选择对应的评估器
            var evaluator = _evaluators.FirstOrDefault(e => e.RuleType == rule.RuleType);
            if (evaluator == null)
                continue;

            var sw = System.Diagnostics.Stopwatch.StartNew();
            var triggered = evaluator.Evaluate(value, rule, context);
            sw.Stop();
            BusinessMetrics.AlertEvaluationDuration.Observe(sw.Elapsed.TotalMilliseconds);

            if (!triggered)
            {
                // 指标回到阈值内：检查是否有该设备该指标该规则的 Active 告警，自动恢复
                // 设计目的：避免 Active 告警无限累积。运维若已介入处置，告警状态会被改成 Acknowledged，
                // 不会被这里自动 Resolve（只处理 Status=Active 的告警）。
                await TryAutoResolveAsync(dbContext, tenantId, deviceId, metric, rule.Id, cancellationToken);
                continue;
            }

            _logger.LogInformation("告警规则 {RuleName} 已触发（设备: {DeviceId}, 指标: {Metric}, 值: {Value}）",
                rule.Name, deviceId, metric, value);

            // 通过聚合器判断告警处理策略（防风暴）
            var (shouldCreate, shouldUpdate, silenced) = _aggregator.Evaluate(deviceId, metric);

            if (silenced)
            {
                BusinessMetrics.AlertsEvaluated.WithLabels("suppressed", rule.Severity.ToString()).Inc();
                _logger.LogDebug("告警已静默（设备: {DeviceId}, 指标: {Metric}）", deviceId, metric);
                continue;
            }

            if (shouldCreate)
            {
                BusinessMetrics.AlertsEvaluated.WithLabels("triggered", rule.Severity.ToString()).Inc();
            }
            else if (shouldUpdate)
            {
                BusinessMetrics.AlertsEvaluated.WithLabels("updated", rule.Severity.ToString()).Inc();
            }

            if (shouldCreate)
            {
                var alert = await CreateAlertAsync(dbContext, tenantId, deviceId, rule, metric, value, context);
                if (alert != null)
                {
                    // 发布告警触发事件，供 SignalR 推送、工单创建等下游模块消费
                    var evt = new AlertTriggeredEvent(
                        Guid.NewGuid(), DateTime.UtcNow, tenantId,
                        alert.Id, deviceId, rule.Id,
                        metric, value, rule.Severity.ToString());
                    await _eventBus.PublishAsync(evt);
                }
            }
            else if (shouldUpdate)
            {
                await UpdateExistingAlertAsync(dbContext, tenantId, deviceId, metric, value);
            }
        }
    }

    /// <summary>
    /// 创建新告警实例
    /// 告警编码格式：ALT-{设备编码}-{指标}-{时间戳}
    /// </summary>
    private async Task<Alert?> CreateAlertAsync(AppDbContext dbContext, Guid tenantId,
        Guid deviceId, AlertRule rule, string metric, double value, DeviceContext context)
    {
        // IgnoreQueryFilters: 后台事件处理器无 HttpContext，全局租户过滤器会让 FindAsync 返回 null
        var device = await dbContext.Devices
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(d => d.Id == deviceId);
        var deviceCode = device?.DeviceCode ?? deviceId.ToString("N")[..8];

        var alertCode = $"ALT-{deviceCode}-{metric}-{DateTime.UtcNow:yyyyMMddHHmmss}";

        var alert = new Alert
        {
            TenantId = tenantId,
            AlertCode = alertCode,
            RuleId = rule.Id,
            DeviceId = deviceId,
            Severity = rule.Severity,
            Status = AlertStatus.Active,
            Metric = metric,
            Value = (decimal)value,
            Threshold = rule.Threshold,
            Message = GenerateMessage(metric, value, rule),
            DataSnapshot = System.Text.Json.JsonSerializer.Serialize(context.Metrics),
            OccurredAt = DateTime.UtcNow,
            TriggerCount = 1,
            WindowStartAt = DateTime.UtcNow
        };

        dbContext.Alerts.Add(alert);
        await dbContext.SaveChangesAsync();

        _logger.LogInformation("告警已创建: {AlertCode}", alertCode);
        return alert;
    }

    /// <summary>
    /// 更新已有活跃告警的值和时间戳（聚合防风暴场景下的第 2-3 次）
    /// </summary>
    private async Task UpdateExistingAlertAsync(AppDbContext dbContext, Guid tenantId,
        Guid deviceId, string metric, double value)
    {
        // IgnoreQueryFilters: 同 CreateAlertAsync，后台处理器需绕过全局租户过滤器
        var existingAlert = await dbContext.Alerts
            .IgnoreQueryFilters()
            .Where(a => a.TenantId == tenantId && a.DeviceId == deviceId
                     && a.Metric == metric && a.Status == AlertStatus.Active)
            .OrderByDescending(a => a.OccurredAt)
            .FirstOrDefaultAsync();

        if (existingAlert == null)
            return;

        existingAlert.Value = (decimal)value;
        existingAlert.OccurredAt = DateTime.UtcNow;
        existingAlert.TriggerCount += 1;

        await dbContext.SaveChangesAsync();

        _logger.LogDebug("告警已更新: {AlertCode}（新值: {Value}）", existingAlert.AlertCode, value);
    }

    /// <summary>
    /// 自动恢复：当指标回到阈值内（评估未触发）时，把对应规则的 Active 告警标记为 Resolved。
    ///
    /// 设计权衡：
    /// - 只处理 Status=Active 的告警。Acknowledged 状态表示运维已介入，保留供后续追溯。
    /// - 用 RuleId 精确匹配，避免误恢复其他规则的告警。
    /// - 自动 Resolve 后发布 AlertTriggeredEvent？不需要 — 这里没有"新事件"，
    ///   SignalR 推送通过 AlertStatusChanged 事件（如果需要）由调用方处理。
    ///   目前先简单做 DB 更新 + 日志，前端通过轮询或下次跳转刷新看到状态变化。
    /// </summary>
    private async Task TryAutoResolveAsync(
        AppDbContext dbContext, Guid tenantId, Guid deviceId, string metric, Guid ruleId,
        CancellationToken ct)
    {
        // 查找该规则触发的、仍 Active 的告警（按 AlertId 倒序取最新一条，避免一次 Resolve 多条历史告警）
        // IgnoreQueryFilters: 后台事件处理器无 HttpContext
        var activeAlert = await dbContext.Alerts
            .IgnoreQueryFilters()
            .Where(a => a.TenantId == tenantId
                && a.DeviceId == deviceId
                && a.Metric == metric
                && a.RuleId == ruleId
                && a.Status == AlertStatus.Active)
            .OrderByDescending(a => a.OccurredAt)
            .FirstOrDefaultAsync(ct);

        if (activeAlert == null)
            return;

        activeAlert.Status = AlertStatus.Resolved;
        activeAlert.ResolvedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(ct);

        _logger.LogInformation(
            "告警已自动恢复（指标回到阈值内）: AlertId={AlertId}, DeviceId={DeviceId}, Metric={Metric}",
            activeAlert.Id, deviceId, metric);
    }

    /// <summary>
    /// 生成告警消息文本
    /// 阈值类型显示操作符和阈值，组合类型显示规则名称
    /// </summary>
    private static string GenerateMessage(string metric, double value, AlertRule rule)
    {
        if (rule.RuleType == RuleType.Threshold && rule.Operator != null && rule.Threshold != null)
        {
            return $"指标 {metric} 当前值 {value:F2} {rule.Operator} 阈值 {rule.Threshold}";
        }
        return $"指标 {metric} 触发告警规则「{rule.Name}」，当前值: {value:F2}";
    }
}
