using System.Collections.Immutable;

namespace EquipAI.Infrastructure.Middleware;

/// <summary>
/// 外部规则文件中的单条规则定义。
/// </summary>
public sealed record WafRuleDefinition(
    string? Id,
    string? Category,
    string? MatchType,
    string? Pattern,
    string? Description);

/// <summary>
/// 已完成校验和编译、可安全用于请求匹配的规则。
/// </summary>
public sealed record WafCompiledRule(
    string Id,
    string Category,
    string Description,
    Func<string, bool> IsMatch);

/// <summary>
/// WAF 当前生效的不可变规则快照。
/// </summary>
public sealed record WafRuleSnapshot(
    string Revision,
    string Sha256,
    ImmutableArray<WafCompiledRule> Rules,
    DateTimeOffset LoadedAtUtc);

/// <summary>
/// WAF 命中结果，只包含可安全写入审计日志的标识信息。
/// </summary>
public sealed record WafDetection(string RuleId, string Category, string Source);
