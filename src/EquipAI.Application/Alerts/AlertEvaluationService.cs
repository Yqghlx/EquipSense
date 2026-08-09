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
            .ToListAsync(cancellationToken);

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

            // 通过聚合器判断告警处理策略（防风暴）。窗口按 设备+规则+指标 维度，
            // 避免同指标的多条规则（分层阈值）共享窗口互相吞并。
            var (shouldCreate, shouldUpdate, silenced) = await _aggregator.EvaluateAsync(
                deviceId, rule.Id, metric, cancellationToken);

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
                // 防重启重复告警：AlertAggregator 是进程内内存态（Singleton），后端重启后窗口计数归零，
                // 持续越限的设备会被误判为"首次"而进入创建分支。若此时 DB 已有同设备同指标同规则的
                // 活跃告警，直接创建会产生重复 Active 告警 → 重复 SignalR 推送 + 重复自动建单，淹没用户。
                // 兜底：创建前按 设备+指标+规则 精确查 DB（不按指标粗查，避免吸收同指标不同规则的告警），
                // 存在则降级为更新（不发布新事件，因用户此前已被通知）。
                var hasActive = await dbContext.Alerts
                    .IgnoreQueryFilters()
                    .AnyAsync(a => a.TenantId == tenantId && a.DeviceId == deviceId
                                && a.Metric == metric && a.RuleId == rule.Id
                                && a.Status == AlertStatus.Active, cancellationToken);

                if (hasActive)
                {
                    _logger.LogDebug("已存在活跃告警，降级为更新避免重复（聚合器可能因重启重置计数）: 设备={DeviceId}, 指标={Metric}", deviceId, metric);
                    await UpdateExistingAlertAsync(dbContext, tenantId, deviceId, rule.Id, metric, value, cancellationToken);
                }
                else
                {
                    var alert = await CreateAlertAsync(dbContext, tenantId, deviceId, rule, metric, value, context, cancellationToken);
                    if (alert != null)
                    {
                        // 发布告警触发事件，供 SignalR 推送、工单创建等下游模块消费
                        var evt = new AlertTriggeredEvent(
                            Guid.NewGuid(), DateTime.UtcNow, tenantId,
                            alert.Id, deviceId, rule.Id,
                            metric, value, rule.Severity.ToString());
                        await _eventBus.PublishAsync(evt, cancellationToken);
                    }
                }
            }
            else if (shouldUpdate)
            {
                var updated = await UpdateExistingAlertAsync(dbContext, tenantId, deviceId, rule.Id, metric, value, cancellationToken);
                if (!updated)
                {
                    // 防丢失：shouldUpdate 但无活跃告警可更新——常见于指标在阈值附近震荡：首次越限创建告警 →
                    // 短暂回落触发 TryAutoResolveAsync 自动恢复（Active→Resolved）→ 再次越限时聚合器窗口计数仍 >1
                    // （shouldUpdate），但已无 Active 告警可更新。若不兜底创建，该复发越限会被静默丢弃——
                    // 运维此前收到"已恢复"通知后误以为问题解决，实际复发却不再告警/通知。对在阈值附近波动的
                    // 工业指标（温度/振动/压力）是严重监控盲区。降级为创建新告警 + 发布事件（复发是新事件，需重新通知）。
                    // 仍受聚合器防风暴约束（窗口内至多创建/更新 3 次，超过即静默），不会因震荡产生告警风暴。
                    var alert = await CreateAlertAsync(dbContext, tenantId, deviceId, rule, metric, value, context, cancellationToken);
                    if (alert != null)
                    {
                        await _eventBus.PublishAsync(new AlertTriggeredEvent(
                            Guid.NewGuid(), DateTime.UtcNow, tenantId,
                            alert.Id, deviceId, rule.Id,
                            metric, value, rule.Severity.ToString()), cancellationToken);
                    }
                    BusinessMetrics.AlertsEvaluated.WithLabels("triggered", rule.Severity.ToString()).Inc();
                }
            }
        }
    }

    /// <summary>
    /// 创建新告警实例
    /// 告警编码格式：ALT-{设备编码}-{指标}-{时间戳}
    /// </summary>
    private async Task<Alert?> CreateAlertAsync(AppDbContext dbContext, Guid tenantId,
        Guid deviceId, AlertRule rule, string metric, double value, DeviceContext context,
        CancellationToken cancellationToken)
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
        await dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("告警已创建: {AlertCode}", alertCode);
        return alert;
    }

    /// <summary>
    /// 更新已有活跃告警的值和时间戳（聚合防风暴场景下的第 2-3 次）
    /// </summary>
    /// <param name="ruleId">按规则精确匹配，避免同指标不同规则的告警被互相更新（吞并）</param>
    /// <returns>true 表示找到并更新了活跃告警；false 表示无活跃告警可更新（调用方应降级为创建新告警）</returns>
    private async Task<bool> UpdateExistingAlertAsync(AppDbContext dbContext, Guid tenantId,
        Guid deviceId, Guid ruleId, string metric, double value, CancellationToken cancellationToken)
    {
        // IgnoreQueryFilters: 同 CreateAlertAsync，后台处理器需绕过全局租户过滤器
        // 按 设备+规则+指标 精确匹配（与聚合器窗口键维度一致），不得仅按 设备+指标，
        // 否则同指标的第二条规则触发会更新第一条规则的告警、把严重告警吞并进告警级告警。
        var existingAlert = await dbContext.Alerts
            .IgnoreQueryFilters()
            .Where(a => a.TenantId == tenantId && a.DeviceId == deviceId
                     && a.RuleId == ruleId
                     && a.Metric == metric && a.Status == AlertStatus.Active)
            .OrderByDescending(a => a.OccurredAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (existingAlert == null)
            return false;

        existingAlert.Value = (decimal)value;
        existingAlert.OccurredAt = DateTime.UtcNow;
        existingAlert.TriggerCount += 1;

        await dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogDebug("告警已更新: {AlertCode}（新值: {Value}）", existingAlert.AlertCode, value);
        return true;
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
    ///
    /// 关键修复：原消息 "指标 oil_temperature 当前值 95.00 > 阈值 90.0" 是机器语言：
    ///   1. metric 是英文内部名，客户看不懂
    ///   2. ">" 是编程符号，工业现场用户不直观
    ///   3. 没有显示超出幅度，客户不知道严重程度
    ///
    /// 改进后的消息：将规则名（中文人类可读）作为前缀，翻译操作符为中文，
    /// 显示超出/低于的幅度，让现场运维一眼看出问题严重性。
    /// </summary>
    private static string GenerateMessage(string metric, double value, AlertRule rule)
    {
        if (rule.RuleType == RuleType.Threshold && rule.Operator != null && rule.Threshold != null)
        {
            var threshold = rule.Threshold.Value;
            var opText = TranslateOperator(rule.Operator);
            var diff = Math.Abs((decimal)value - threshold);

            // 显示超出/低于的幅度，让客户直观判断严重性
            // 例：阈值 90，实际 95.5 → "（超出 5.50）"；阈值 0.5，实际 0.3 → "（低 0.20）"
            var isLower = rule.Operator is "<" or "lt" or "<=" or "lte";
            var diffText = isLower ? $"（低 {diff:F2}）" : $"（超出 {diff:F2}）";

            return $"「{rule.Name}」指标 {metric} 当前 {value:F2}，已{opText}阈值 {threshold}{diffText}";
        }
        return $"「{rule.Name}」指标 {metric} 触发，当前值 {value:F2}";
    }

    /// <summary>
    /// 将编程操作符翻译为中文动作描述
    /// 支持符号（>, <）和关键词（gt, lt）两种形式
    /// </summary>
    private static string TranslateOperator(string op) => op switch
    {
        ">" or "gt" => "超过",
        "<" or "lt" => "低于",
        ">=" or "gte" => "达到或超过",
        "<=" or "lte" => "降至或低于",
        "==" or "eq" => "等于",
        "!=" or "ne" => "不等于",
        _ => op
    };
}
