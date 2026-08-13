using Microsoft.Extensions.Configuration;

namespace EquipAI.Infrastructure.Middleware;

/// <summary>
/// WAF 配置的环境级启动门禁。
/// </summary>
public static class WafRuleConfiguration
{
    /// <summary>
    /// 从应用配置读取 WAF 选项并执行生产环境校验。
    /// </summary>
    public static WafRuleOptions ValidateForEnvironment(
        IConfiguration configuration,
        string environmentName)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        var options = configuration
            .GetSection(WafRuleOptions.SectionName)
            .Get<WafRuleOptions>() ?? new WafRuleOptions();
        var isProduction = string.Equals(
            environmentName,
            "Production",
            StringComparison.OrdinalIgnoreCase);

        if (options.ReloadDebounceMilliseconds is < 50 or > 5000)
        {
            throw new InvalidOperationException("WAF 规则热加载防抖时间必须位于 50 到 5000 毫秒之间");
        }

        if (!isProduction)
        {
            return options;
        }

        if (!options.Enabled)
        {
            throw new InvalidOperationException("生产环境必须启用 WAF");
        }

        if (!options.RequireExternalRules)
        {
            throw new InvalidOperationException("生产环境 RequireExternalRules 必须为 true");
        }

        if (string.IsNullOrWhiteSpace(options.RulesPath))
        {
            throw new InvalidOperationException("生产环境 WAF RulesPath 不能为空");
        }

        if (!Path.IsPathFullyQualified(options.RulesPath))
        {
            throw new InvalidOperationException("生产环境 WAF RulesPath 必须是绝对路径");
        }

        return options;
    }
}
