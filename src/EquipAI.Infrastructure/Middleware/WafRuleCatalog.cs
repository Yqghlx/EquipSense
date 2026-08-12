using System.Collections.Immutable;
using System.Text.RegularExpressions;

namespace EquipAI.Infrastructure.Middleware;

/// <summary>
/// WAF 内置安全基线目录。
/// 外部规则只能追加，不能替换这里的规则。
/// </summary>
public static partial class WafRuleCatalog
{
    /// <summary>
    /// 创建内置规则的不可变集合。
    /// </summary>
    public static ImmutableArray<WafCompiledRule> CreateBuiltInRules()
        =>
        [
            new WafCompiledRule(
                "builtin-sql-injection",
                "sql-injection",
                "内置 SQL 注入检测",
                SqlInjectionPattern().IsMatch),
            new WafCompiledRule(
                "builtin-path-traversal",
                "path-traversal",
                "内置路径遍历检测",
                PathTraversalPattern().IsMatch),
            new WafCompiledRule(
                "builtin-command-injection",
                "command-injection",
                "内置命令注入检测",
                CommandInjectionPattern().IsMatch),
            new WafCompiledRule(
                "builtin-xss",
                "xss",
                "内置跨站脚本检测",
                InputSanitizationMiddleware.ContainsMaliciousContent)
        ];

    /// <summary>
    /// 保留已有静态 WAF 基线检测语义，供兼容入口和单元测试使用。
    /// </summary>
    public static bool IsBuiltInMalicious(string input)
    {
        if (string.IsNullOrEmpty(input))
        {
            return false;
        }

        return SqlInjectionPattern().IsMatch(input)
            || PathTraversalPattern().IsMatch(input)
            || CommandInjectionPattern().IsMatch(input)
            || InputSanitizationMiddleware.ContainsMaliciousContent(input);
    }

    /// <summary>
    /// SQL 注入检测：联合查询、布尔盲注、注释截断、破坏性语句和时间盲注。
    /// </summary>
    [GeneratedRegex(
        @"union\s+select|or\s+1\s*=\s*1|and\s+1\s*=\s*1|--\s|;\s*drop\s+|;\s*delete\s+from|;\s*update\s+\w+\s+set|xp_cmdshell|information_schema|sleep\s*\(|benchmark\s*\(",
        RegexOptions.IgnoreCase | RegexOptions.Compiled)]
    private static partial Regex SqlInjectionPattern();

    /// <summary>
    /// 路径遍历和敏感文件访问检测。
    /// </summary>
    [GeneratedRegex(
        @"\.\./|\.\.\\|%2e%2e|/etc/passwd|/etc/shadow|/proc/self",
        RegexOptions.IgnoreCase | RegexOptions.Compiled)]
    private static partial Regex PathTraversalPattern();

    /// <summary>
    /// 管道、命令替换和常见下载/执行命令检测。
    /// </summary>
    [GeneratedRegex(
        @"\|\||;\s*(curl|wget|nc|bash|sh|cat|ls|rm|chmod|wget)\b|`[^`]*`|\$\([^)]*\)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled)]
    private static partial Regex CommandInjectionPattern();
}
