namespace EquipAI.Infrastructure.Middleware;

/// <summary>
/// 提供当前 WAF 不可变规则快照。
/// </summary>
public interface IWafRuleProvider
{
    /// <summary>
    /// 当前生效的规则快照。
    /// </summary>
    WafRuleSnapshot Current { get; }
}
