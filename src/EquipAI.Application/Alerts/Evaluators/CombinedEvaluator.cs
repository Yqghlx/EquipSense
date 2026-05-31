using System.Text.Json;
using System.Text.Json.Serialization;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;

namespace EquipAI.Application.Alerts.Evaluators;

/// <summary>
/// 组合条件评估器，判断多个指标是否同时满足各自条件
/// Conditions JSONB 格式：[{"metric":"temperature","operator":">","threshold":80}, ...]
/// 所有条件必须同时满足（AND 逻辑）
/// </summary>
public class CombinedEvaluator : IAlertRuleEvaluator
{
    public RuleType RuleType => RuleType.Combined;

    public bool Evaluate(double value, AlertRule rule, DeviceContext? context = null)
    {
        // 设备上下文和组合条件缺一不可，否则无法评估
        if (context == null || string.IsNullOrEmpty(rule.Conditions))
            return false;

        var conditions = JsonSerializer.Deserialize<List<ConditionItem>>(rule.Conditions);
        if (conditions == null || conditions.Count == 0)
            return false;

        // AND 逻辑：所有条件必须同时满足
        return conditions.All(c => EvaluateCondition(c, context));
    }

    /// <summary>
    /// 评估单个条件是否满足
    /// </summary>
    private static bool EvaluateCondition(ConditionItem condition, DeviceContext context)
    {
        var metricValue = context.GetMetricValue(condition.Metric);
        // 指标不存在时条件不满足，安全降级
        if (metricValue == null)
            return false;

        return condition.Operator switch
        {
            ">"  => metricValue > condition.Threshold,
            ">=" => metricValue >= condition.Threshold,
            "<"  => metricValue < condition.Threshold,
            "<=" => metricValue <= condition.Threshold,
            // 相等比较使用极小容差，仅容许浮点精度损失
            "==" => Math.Abs(metricValue.Value - condition.Threshold) < 0.001,
            // 未知操作符不触发告警，安全降级
            _    => false
        };
    }

    /// <summary>
    /// 组合条件项的内部反序列化模型
    /// JSON 属性名使用小驼峰，匹配数据库 JSONB 存储格式
    /// </summary>
    private class ConditionItem
    {
        [JsonPropertyName("metric")]
        public string Metric { get; set; } = string.Empty;

        [JsonPropertyName("operator")]
        public string Operator { get; set; } = string.Empty;

        [JsonPropertyName("threshold")]
        public double Threshold { get; set; }
    }
}
