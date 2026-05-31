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

        return rule.Operator switch
        {
            ">"  => value > threshold,
            ">=" => value >= threshold,
            "<"  => value < threshold,
            "<=" => value <= threshold,
            // 相等比较使用极小容差，仅容许 decimal→double 转换的精度损失
            "==" => Math.Abs(value - threshold) < 1e-9,
            // 未知操作符不触发告警，安全降级
            _    => false
        };
    }
}
