using EquipAI.Core.Entities;
using EquipAI.Core.Enums;

namespace EquipAI.Core.Interfaces;

/// <summary>
/// 设备上下文，提供评估时需要的设备全量指标数据
/// CombinedEvaluator 需要同时查看多个指标的值
/// </summary>
public class DeviceContext
{
    /// <summary>
    /// 指标名称到数值的映射
    /// </summary>
    public Dictionary<string, double> Metrics { get; } = new();

    /// <summary>
    /// 获取指定指标的值，不存在时返回 null
    /// </summary>
    public double? GetMetricValue(string metric)
    {
        return Metrics.TryGetValue(metric, out var value) ? value : null;
    }
}

/// <summary>
/// 告警规则评估器接口
/// 不同规则类型（阈值、组合等）实现此接口
/// </summary>
public interface IAlertRuleEvaluator
{
    /// <summary>
    /// 评估器对应的规则类型
    /// </summary>
    RuleType RuleType { get; }

    /// <summary>
    /// 评估告警规则是否触发
    /// </summary>
    /// <param name="value">当前指标值</param>
    /// <param name="rule">告警规则</param>
    /// <param name="context">设备上下文（CombinedEvaluator 使用）</param>
    /// <returns>true 表示触发告警</returns>
    bool Evaluate(double value, AlertRule rule, DeviceContext? context = null);
}
