using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;

namespace EquipAI.Application.Alerts.Evaluators;

/// <summary>
/// 基线评估器（L3 告警）
/// 基于历史统计数据的均值±N倍标准差判断是否偏离正常范围
/// 需满足以下条件才能触发：
/// - 基线数据存在且样本数 >= 100
/// - 标准差不为 0（常量指标不适用）
/// - 规则配置了标准差倍数
/// - 当前值偏离均值超过 N 倍标准差
/// </summary>
public class BaselineEvaluator : IAlertRuleEvaluator
{
    /// <inheritdoc />
    public RuleType RuleType => RuleType.Baseline;

    /// <inheritdoc />
    public bool Evaluate(double value, AlertRule rule, DeviceContext? context = null)
    {
        // 无上下文或无基线数据 → 不触发
        if (context?.Baseline == null)
            return false;

        var baseline = context.Baseline;

        // 样本数不足 → 数据不具备统计意义，不启用基线
        if (baseline.SampleCount is null || baseline.SampleCount < 100)
            return false;

        // 标准差为 null 或 0 → 常量指标，基线不适用，避免除零
        if (baseline.StdDev is null or 0)
            return false;

        // 未配置标准差倍数 → 规则不完整
        if (rule.BaselineStddevMultiplier == null)
            return false;

        // 计算偏离度（当前值与均值之差的绝对值 / 标准差）
        var deviation = Math.Abs(value - (baseline.AvgValue ?? 0)) / baseline.StdDev.Value;

        return deviation > (double)rule.BaselineStddevMultiplier;
    }
}
