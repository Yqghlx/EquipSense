using System.Text.Json;
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

        // 查询设备类型，用于匹配规则的 DeviceType 字段
        // IgnoreQueryFilters: 后台事件处理器无 HttpContext，全局租户过滤器会让查询返回 null
        var deviceType = await db.Devices
            .IgnoreQueryFilters()
            .Where(d => d.Id == deviceId)
            .Select(d => d.Type)
            .FirstOrDefaultAsync(ct);

        // 查询所有启用的规则：同租户 + 系统租户（通用规则），且设备类型匹配或为通配符
        var rules = await db.UnfilteredSet<Core.Entities.KnowledgeRule>()
            .Where(r => (r.TenantId == tenantId || r.TenantId == Guid.Empty)
                && r.Enabled
                && (r.DeviceType == deviceType || r.DeviceType == "*"))
            .ToListAsync(ct);

        _logger.LogDebug("查到 {Count} 条候选规则（设备类型={DeviceType}，指标={Metric}）",
            rules.Count, deviceType, metric);

        foreach (var rule in rules)
        {
            if (TryMatchConditions(rule.Conditions, metric, value))
            {
                _logger.LogInformation("规则匹配成功: {RuleName} (RuleId={RuleId})", rule.Name, rule.Id);

                return new RuleMatchResult(
                    RuleId: rule.Id,
                    RuleName: rule.Name,
                    Conclusion: rule.Conclusion,
                    RecommendedActions: rule.RecommendedActions,
                    CheckSteps: rule.CheckSteps,
                    ConfidenceWeight: (double)rule.ConfidenceWeight);
            }
        }

        _logger.LogDebug("未找到匹配规则（设备={DeviceId}，指标={Metric}，值={Value}）",
            deviceId, metric, value);
        return null;
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

            foreach (var cond in conditions)
            {
                // 只评估与目标指标相关的条件
                if (!string.Equals(cond.Metric, targetMetric, StringComparison.OrdinalIgnoreCase))
                    continue;

                // 条件不满足时立即返回 false
                if (!EvaluateCondition(targetValue, cond.Operator, cond.Threshold))
                    return false;
            }

            return true;
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
