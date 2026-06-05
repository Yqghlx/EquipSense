using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;

namespace EquipAI.Application.Alerts.Evaluators;

/// <summary>
/// 阈值评估器，判断单个指标是否超过静态阈值
/// 支持操作符：>、>=、<、<=、==
/// </summary>
public class ThresholdEvaluator : IAlertRuleEvaluator
{
    /// <inheritdoc />
    public RuleType RuleType => RuleType.Threshold;

    /// <inheritdoc />
    public bool Evaluate(double value, AlertRule rule, DeviceContext? context = null)
    {
        // 阈值和操作符缺一不可，否则无法评估
        if (rule.Threshold == null || rule.Operator == null)
            return false;

        var threshold = (double)rule.Threshold;

        // 同时支持符号操作符（>、>=）和文本操作符（GT、GTE），
        // API 创建规则时传入文本格式（GT），而 UI 可能传入符号格式（>）
        return rule.Operator.ToUpperInvariant() switch
        {
            ">" or "GT"  => value > threshold,
            ">=" or "GTE" => value >= threshold,
            "<" or "LT"  => value < threshold,
            "<=" or "LTE" => value <= threshold,
            "==" or "EQ" => Math.Abs(value - threshold) < 1e-9,
            // 未知操作符不触发告警，安全降级
            _    => false
        };
    }
}
