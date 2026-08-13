using System.Collections.Immutable;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace EquipAI.Infrastructure.Middleware;

/// <summary>
/// 负责读取、校验、编译和摘要化 WAF 外部规则文件。
/// </summary>
public static class WafRuleLoader
{
    private const int MaxFileBytes = 64 * 1024;
    private const int MaxRules = 128;
    private const int MaxIdLength = 64;
    private const int MaxPatternLength = 256;
    private const int MaxDescriptionLength = 256;

    private static readonly Regex RuleIdPattern = new(
        "^[a-z0-9._-]{1,64}$",
        RegexOptions.CultureInvariant | RegexOptions.Compiled,
        TimeSpan.FromMilliseconds(50));

    private static readonly HashSet<string> Categories =
    [
        "sql-injection",
        "path-traversal",
        "command-injection",
        "xss"
    ];

    private static readonly string[] UnsupportedRegexTokens =
    [
        "(?=", "(?!", "(?<=", "(?<!", "(?<", "(?(", "(?>", "(*",
        "\\1", "\\2", "\\3", "\\k<"
    ];

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow
    };

    /// <summary>
    /// 加载规则快照。开发环境缺少外部文件时只返回内置基线，生产环境则失败关闭。
    /// </summary>
    public static WafRuleSnapshot Load(string path, WafRuleOptions options, bool isProduction)
    {
        ArgumentNullException.ThrowIfNull(options);

        var builtInRules = WafRuleCatalog.CreateBuiltInRules();
        if (string.IsNullOrWhiteSpace(path))
        {
            if (!isProduction && !options.RequireExternalRules)
            {
                return CreateBuiltInSnapshot(builtInRules);
            }

            throw new InvalidOperationException("WAF 规则文件路径不能为空");
        }

        if (!File.Exists(path))
        {
            if (!isProduction && !options.RequireExternalRules)
            {
                return CreateBuiltInSnapshot(builtInRules);
            }

            throw new InvalidOperationException("WAF 规则文件不存在");
        }

        ValidatePath(path, isProduction);

        byte[] content;
        try
        {
            var fileInfo = new FileInfo(path);
            if (fileInfo.Length > MaxFileBytes)
            {
                throw new InvalidOperationException("WAF 规则文件大小超过 64KiB 限制");
            }

            content = File.ReadAllBytes(path);
        }
        catch (InvalidOperationException)
        {
            throw;
        }
        catch (Exception exception) when (exception is IOException or UnauthorizedAccessException)
        {
            throw new InvalidOperationException("WAF 规则文件读取失败");
        }

        if (content.Length > MaxFileBytes)
        {
            throw new InvalidOperationException("WAF 规则文件大小超过 64KiB 限制");
        }

        WafRuleFileDocument? document;
        try
        {
            // 规则文件可能由带 BOM 的 UTF-8 编辑器或运维工具生成。
            // 摘要仍基于原始字节，只有 JSON 解析视图剥离 BOM，避免同一文件的完整性标识被改变。
            var jsonContent = content.AsSpan();
            var utf8Preamble = Encoding.UTF8.GetPreamble();
            if (jsonContent.StartsWith(utf8Preamble))
            {
                jsonContent = jsonContent[utf8Preamble.Length..];
            }

            document = JsonSerializer.Deserialize<WafRuleFileDocument>(jsonContent, JsonOptions);
        }
        catch (JsonException)
        {
            throw new InvalidOperationException("WAF 规则 JSON 格式或未知字段不合法");
        }

        if (document is null)
        {
            throw new InvalidOperationException("WAF 规则文件不能为空");
        }

        ValidateDocument(document);

        var externalRules = document.Rules!
            .Select(CompileRule)
            .ToImmutableArray();
        var builtInIds = builtInRules.Select(rule => rule.Id).ToHashSet(StringComparer.Ordinal);
        var duplicateIds = externalRules
            .GroupBy(rule => rule.Id, StringComparer.Ordinal)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToArray();
        if (duplicateIds.Length > 0)
        {
            throw new InvalidOperationException("WAF 规则 ID 重复");
        }

        if (externalRules.Any(rule => builtInIds.Contains(rule.Id)))
        {
            throw new InvalidOperationException("WAF 外部规则不得与内置规则 ID 碰撞");
        }

        var rules = builtInRules.AddRange(externalRules);
        var sha256 = Convert.ToHexString(SHA256.HashData(content)).ToLowerInvariant();
        return new WafRuleSnapshot(
            document.Revision!,
            sha256,
            rules,
            DateTimeOffset.UtcNow);
    }

    private static WafRuleSnapshot CreateBuiltInSnapshot(ImmutableArray<WafCompiledRule> rules)
    {
        var digest = Convert.ToHexString(
                SHA256.HashData(Encoding.UTF8.GetBytes("equipsense-waf-builtins-v1")))
            .ToLowerInvariant();
        return new WafRuleSnapshot("builtin", digest, rules, DateTimeOffset.UtcNow);
    }

    private static void ValidatePath(string path, bool isProduction)
    {
        if (isProduction && !Path.IsPathFullyQualified(path))
        {
            throw new InvalidOperationException("生产环境 WAF 规则路径必须是绝对路径");
        }

        var attributes = File.GetAttributes(path);
        if ((attributes & FileAttributes.ReparsePoint) != 0
            || new FileInfo(path).LinkTarget is not null)
        {
            throw new InvalidOperationException("WAF 规则文件必须是普通文件，不能使用符号链接");
        }

        if (!isProduction || OperatingSystem.IsWindows())
        {
            return;
        }

        try
        {
            var fileMode = File.GetUnixFileMode(path);
            var unsafeFileBits = UnixFileMode.GroupWrite | UnixFileMode.OtherWrite;
            if ((fileMode & unsafeFileBits) != 0)
            {
                throw new InvalidOperationException("WAF 规则文件权限不安全");
            }

            var parent = Directory.GetParent(path)?.FullName;
            if (parent is not null)
            {
                var parentMode = File.GetUnixFileMode(parent);
                if ((parentMode & unsafeFileBits) != 0)
                {
                    throw new InvalidOperationException("WAF 规则目录权限不安全");
                }
            }
        }
        catch (PlatformNotSupportedException)
        {
            throw new InvalidOperationException("生产环境无法验证 WAF 规则文件权限");
        }
    }

    private static void ValidateDocument(WafRuleFileDocument document)
    {
        if (document.SchemaVersion != 1)
        {
            throw new InvalidOperationException("WAF 规则 schemaVersion 只能为 1");
        }

        if (string.IsNullOrWhiteSpace(document.Revision)
            || document.Revision.Length > 64
            || document.Revision.Any(char.IsControl)
            || document.Revision.Any(character => character > 0x7e || character < 0x20))
        {
            throw new InvalidOperationException("WAF 规则 revision 不合法");
        }

        if (document.Rules is null || document.Rules.Count > MaxRules)
        {
            throw new InvalidOperationException("WAF 规则数量超过 128 条限制或字段缺失");
        }

        foreach (var rule in document.Rules)
        {
            ValidateDefinition(rule);
        }
    }

    private static void ValidateDefinition(WafRuleDefinition rule)
    {
        if (string.IsNullOrWhiteSpace(rule.Id)
            || rule.Id.Length > MaxIdLength
            || !RuleIdPattern.IsMatch(rule.Id))
        {
            throw new InvalidOperationException("WAF 规则 ID 不合法");
        }

        if (string.IsNullOrWhiteSpace(rule.Category) || !Categories.Contains(rule.Category))
        {
            throw new InvalidOperationException("WAF 规则分类不合法");
        }

        if (rule.MatchType is not ("contains" or "regex"))
        {
            throw new InvalidOperationException("WAF 规则匹配类型不合法");
        }

        if (string.IsNullOrWhiteSpace(rule.Pattern)
            || rule.Pattern.EnumerateRunes().Count() > MaxPatternLength)
        {
            throw new InvalidOperationException("WAF 规则 pattern 不合法或超过长度限制");
        }

        if (string.IsNullOrWhiteSpace(rule.Description)
            || rule.Description.Length > MaxDescriptionLength
            || rule.Description.Any(char.IsControl))
        {
            throw new InvalidOperationException("WAF 规则描述不合法");
        }

        if (rule.MatchType == "regex")
        {
            if (UnsupportedRegexTokens.Any(token => rule.Pattern.Contains(token, StringComparison.Ordinal)))
            {
                throw new InvalidOperationException("WAF 规则正则包含不受支持的安全构造");
            }

            try
            {
                _ = new Regex(
                    rule.Pattern,
                    RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.NonBacktracking,
                    TimeSpan.FromMilliseconds(50));
            }
            catch (ArgumentException)
            {
                throw new InvalidOperationException("WAF 规则正则编译失败");
            }
        }
    }

    private static WafCompiledRule CompileRule(WafRuleDefinition rule)
    {
        if (rule.MatchType == "contains")
        {
            var pattern = rule.Pattern!;
            return new WafCompiledRule(
                rule.Id!,
                rule.Category!,
                rule.Description!,
                input => input.Contains(pattern, StringComparison.OrdinalIgnoreCase));
        }

        var regex = new Regex(
            rule.Pattern!,
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.NonBacktracking,
            TimeSpan.FromMilliseconds(50));
        return new WafCompiledRule(rule.Id!, rule.Category!, rule.Description!, regex.IsMatch);
    }

    private sealed class WafRuleFileDocument
    {
        public int SchemaVersion { get; init; }

        public string? Revision { get; init; }

        public List<WafRuleDefinition>? Rules { get; init; }
    }
}
