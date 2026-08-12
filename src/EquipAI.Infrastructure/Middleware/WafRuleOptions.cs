namespace EquipAI.Infrastructure.Middleware;

/// <summary>
/// WAF 规则文件加载与热更新配置。
/// </summary>
public sealed class WafRuleOptions
{
    /// <summary>
    /// 配置节名称。
    /// </summary>
    public const string SectionName = "Security:Waf";

    /// <summary>
    /// 是否启用 WAF。
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// 外部规则文件路径。
    /// </summary>
    public string RulesPath { get; set; } = string.Empty;

    /// <summary>
    /// 生产环境是否必须加载外部规则文件。
    /// </summary>
    public bool RequireExternalRules { get; set; }

    /// <summary>
    /// 文件系统事件防抖时间（毫秒）。
    /// </summary>
    public int ReloadDebounceMilliseconds { get; set; } = 250;
}
