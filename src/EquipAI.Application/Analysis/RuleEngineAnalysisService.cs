using System.Text.Json;
using EquipAI.Core.Constants;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Analysis;

/// <summary>
/// L2 规则引擎诊断服务
/// 从 knowledge_rules 表查找匹配规则：条件 JSON 中的指标名和阈值与当前告警数据比对
/// 条件格式：[{"metric":"temperature","operator":">","threshold":80}]
/// 支持操作符：>, >=, <, <=, ==, !=
/// 匹配逻辑：所有条件 AND 组合，全部满足时返回匹配结果
/// </summary>
public class RuleEngineAnalysisService : IRuleEngineAnalysisService
{
    /// <summary>
    /// 单次诊断最多带回的 FMEA 条目数，避免低质量或重复配置导致分析响应无限膨胀。
    /// </summary>
    private const int MaxFmeaMatches = 3;

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RuleEngineAnalysisService> _logger;

    public RuleEngineAnalysisService(
        IServiceScopeFactory scopeFactory,
        ILogger<RuleEngineAnalysisService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<RuleMatchResult?> MatchRuleAsync(
        Guid tenantId, Guid deviceId, string metric, double value, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 查询设备类型，用于匹配规则的 DeviceType 字段。
        // 后台事件处理器无 HttpContext，需要绕过全局租户过滤器；但设备 ID 仍必须与事件租户绑定，
        // 否则跨租户设备会把错误的类型带入当前租户规则匹配。
        var deviceType = await db.Devices
            .IgnoreQueryFilters()
            .Where(d => d.Id == deviceId && d.TenantId == tenantId)
            .Select(d => d.Type)
            .FirstOrDefaultAsync(ct);
        if (deviceType is null)
        {
            _logger.LogWarning(
                "规则匹配跳过未知或跨租户设备: TenantId={TenantId}, DeviceId={DeviceId}",
                tenantId,
                deviceId);
            return null;
        }

        // 查询所有启用的规则：同租户 + 系统租户（通用规则），且设备类型匹配或为通配符
        var rules = await db.UnfilteredSet<Core.Entities.KnowledgeRule>()
            .AsNoTracking()
            .Where(r => (r.TenantId == tenantId || r.TenantId == Guid.Empty)
                && r.Enabled
                && (r.DeviceType == deviceType || r.DeviceType == "*"))
            .ToListAsync(ct);

        _logger.LogDebug("查到 {Count} 条候选规则（设备类型={DeviceType}，指标={Metric}）",
            rules.Count, deviceType, metric);

        // 数据库未承诺查询顺序；明确排序后，同一告警在重启、主从切换或执行计划变化时仍得到一致诊断。
        // 租户自定义规则优先于系统规则，随后偏好精确设备类型，再以置信度、创建时间和 ID 消除并列。
        foreach (var rule in rules
            .OrderByDescending(r => r.TenantId == tenantId)
            .ThenByDescending(r => r.DeviceType == deviceType)
            .ThenByDescending(r => r.ConfidenceWeight)
            .ThenByDescending(r => r.CreatedAt)
            .ThenBy(r => r.Id))
        {
            if (TryMatchConditions(rule.Conditions, metric, value))
            {
                _logger.LogInformation("规则匹配成功: {RuleName} (RuleId={RuleId})", rule.Name, rule.Id);
                var fmeaMatches = await GetFmeaMatchesAsync(db, tenantId, rule.Id, ct);

                return new RuleMatchResult(
                    RuleId: rule.Id,
                    RuleName: rule.Name,
                    Conclusion: rule.Conclusion,
                    RecommendedActions: rule.RecommendedActions,
                    CheckSteps: rule.CheckSteps,
                    ConfidenceWeight: (double)rule.ConfidenceWeight,
                    FmeaMatches: fmeaMatches);
            }
        }

        _logger.LogDebug("未找到匹配规则（设备={DeviceId}，指标={Metric}，值={Value}）",
            deviceId, metric, value);
        return null;
    }

    /// <summary>
    /// 查询与已命中知识规则关联的 FMEA 条目。
    /// 当前租户条目优先于系统共享条目，随后按 RPN 降序排列；这样客户自定义的维护经验不会被
    /// 同一规则下的系统通用建议覆盖，同时高风险模式会优先呈现给维修人员。
    /// </summary>
    private static async Task<IReadOnlyList<FmeaMatchResult>> GetFmeaMatchesAsync(
        AppDbContext db,
        Guid tenantId,
        Guid ruleId,
        CancellationToken ct)
    {
        var entries = await db.UnfilteredSet<Core.Entities.FmeaEntry>()
            .AsNoTracking()
            .Where(e => e.KnowledgeRuleId == ruleId
                && e.IsEnabled
                && (e.TenantId == tenantId || e.TenantId == SystemConstants.SystemTenantId))
            .ToListAsync(ct);

        return entries
            .OrderByDescending(e => e.TenantId == tenantId)
            .ThenByDescending(e => e.Rpn)
            .ThenBy(e => e.Id)
            .Take(MaxFmeaMatches)
            .Select(e => new FmeaMatchResult(
                e.Id,
                e.FailureMode,
                e.Cause,
                e.Effect,
                e.Detection,
                e.RecommendedAction,
                e.Rpn))
            .ToList();
    }

    /// <summary>
    /// 解析条件 JSON 并评估是否匹配当前指标值
    /// 条件格式：[{"metric":"temperature","operator":">","threshold":80}]
    /// 所有条件 AND 组合：每个条件中的 metric 必须与目标指标匹配，且值的比较结果必须为 true
    /// </summary>
    private bool TryMatchConditions(string conditionsJson, string targetMetric, double targetValue)
    {
        try
        {
            var conditions = JsonSerializer.Deserialize<List<ConditionItem>>(conditionsJson, ConditionJsonOptions);
            if (conditions is null || conditions.Count == 0) return false;

            // 跟踪是否有至少一个条件与目标指标相关
            // 若规则的所有条件都不涉及目标指标（如电流告警遇到油温规则），该规则不应匹配
            var hasRelevantCondition = false;

            foreach (var cond in conditions)
            {
                // 只评估与目标指标相关的条件
                if (!string.Equals(cond.Metric, targetMetric, StringComparison.OrdinalIgnoreCase))
                    continue;

                hasRelevantCondition = true;

                // 条件不满足时立即返回 false
                if (!EvaluateCondition(targetValue, cond.Operator, cond.Threshold))
                    return false;
            }

            // 没有任何相关条件时不匹配（此前错误返回 true 导致无关规则误匹配）
            return hasRelevantCondition;
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "规则条件 JSON 解析失败: {Json}", conditionsJson);
            return false;
        }
    }

    /// <summary>
    /// 单条条件的数值比较评估
    /// 支持六种比较操作符：>, >=, <, <=, ==, !=
    /// 相等性判断使用 0.001 容差，避免浮点精度问题
    /// </summary>
    private static bool EvaluateCondition(double value, string op, double threshold)
    {
        return op switch
        {
            ">" => value > threshold,
            ">=" => value >= threshold,
            "<" => value < threshold,
            "<=" => value <= threshold,
            "==" => Math.Abs(value - threshold) < 0.001,
            "!=" => Math.Abs(value - threshold) >= 0.001,
            _ => false
        };
    }

    /// <summary>
    /// 条件 JSON 反序列化时的序列化选项，使用 camelCase 且不区分属性名大小写
    /// 确保能正确映射 JSON 中的 "metric"、"operator"、"threshold" 到 C# 属性
    /// </summary>
    private static readonly JsonSerializerOptions ConditionJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    /// <summary>
    /// 条件 JSON 反序列化模型
    /// </summary>
    private class ConditionItem
    {
        /// <summary>
        /// 指标名称（如 temperature、vibration）
        /// </summary>
        public string Metric { get; set; } = string.Empty;

        /// <summary>
        /// 比较操作符（>, >=, <, <=, ==, !=）
        /// </summary>
        public string Operator { get; set; } = ">";

        /// <summary>
        /// 阈值
        /// </summary>
        public double Threshold { get; set; }
    }
}
