using System.Text;
using EquipAI.Infrastructure.Middleware;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Middleware;

/// <summary>
/// WAF 外部规则文件的结构、权限和正则安全边界测试。
/// </summary>
public sealed class WafRuleLoaderTests : IDisposable
{
    private readonly string _testDirectory = Path.Combine(
        Path.GetTempPath(),
        $"equipsense-waf-loader-{Guid.NewGuid():N}");

    public WafRuleLoaderTests()
    {
        Directory.CreateDirectory(_testDirectory);
    }

    [Fact]
    public void Load_合法文件_返回内置规则外部规则和小写摘要()
    {
        var path = WriteFile("rules.json", """
        {
          "schemaVersion": 1,
          "revision": "2026-08-13.1",
          "rules": [
            {
              "id": "custom-sqli-load-function",
              "category": "sql-injection",
              "matchType": "contains",
              "pattern": "load_file",
              "description": "拦截数据库文件读取函数"
            }
          ]
        }
        """);

        var snapshot = WafRuleLoader.Load(path, CreateOptions(), isProduction: false);

        snapshot.Revision.Should().Be("2026-08-13.1");
        snapshot.Sha256.Should().MatchRegex("^[0-9a-f]{64}$");
        snapshot.Rules.Should().Contain(rule => rule.Id == "custom-sqli-load-function");
        snapshot.Rules.Should().Contain(rule => rule.Id == "builtin-sql-injection");
        snapshot.Rules.Single(rule => rule.Id == "custom-sqli-load-function")
            .IsMatch("SELECT LOAD_FILE('/etc/passwd')").Should().BeTrue();
    }

    [Fact]
    public void Load_开发环境缺失文件_仅返回内置基线()
    {
        var options = CreateOptions();
        options.RulesPath = Path.Combine(_testDirectory, "missing.json");

        var snapshot = WafRuleLoader.Load(options.RulesPath, options, isProduction: false);

        snapshot.Revision.Should().Be("builtin");
        snapshot.Rules.Should().Contain(rule => rule.Id == "builtin-xss");
        snapshot.Rules.Should().NotContain(rule => rule.Id.StartsWith("custom-", StringComparison.Ordinal));
    }

    [Fact]
    public void Load_生产环境缺失文件_拒绝启动()
    {
        var path = Path.Combine(_testDirectory, "missing.json");

        var act = () => WafRuleLoader.Load(path, CreateOptions(), isProduction: true);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*规则文件*");
    }

    [Theory]
    [InlineData("duplicate-id.json", "规则 ID 重复")]
    [InlineData("invalid-schema.json", "schemaVersion")]
    [InlineData("unsafe-regex.json", "正则")]
    [InlineData("unknown-field.json", "未知")]
    public void Load_不安全文件_拒绝且不泄漏规则正文(string fileName, string expectedMessage)
    {
        var json = fileName switch
        {
            "duplicate-id.json" => CreateJsonWithTwoRules("same-id", "same-id"),
            "invalid-schema.json" => "{\"schemaVersion\":2,\"revision\":\"bad\",\"rules\":[]}",
            "unsafe-regex.json" => CreateRuleJson("unsafe-regex", "regex", "(?<=secret-pattern)"),
            "unknown-field.json" => "{\"schemaVersion\":1,\"revision\":\"bad\",\"rules\":[],\"unknown\":\"secret-pattern\"}",
            _ => throw new InvalidOperationException("测试 fixture 不存在")
        };
        var path = WriteFile(fileName, json);

        var act = () => WafRuleLoader.Load(path, CreateOptions(), isProduction: false);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage($"*{expectedMessage}*")
            .Which.Message.Should().NotContain("secret-pattern");
    }

    [Fact]
    public void Load_文件超过64KiB_拒绝()
    {
        var largeDescription = new string('x', 65 * 1024);
        var path = WriteFile("too-large.json", CreateRuleJson("too-large", "contains", "x", largeDescription));

        var act = () => WafRuleLoader.Load(path, CreateOptions(), isProduction: false);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*文件大小*");
    }

    [Fact]
    public void Load_外部规则碰撞内置ID_拒绝()
    {
        var path = WriteFile("builtin-collision.json", CreateRuleJson("builtin-sql-injection", "contains", "safe"));

        var act = () => WafRuleLoader.Load(path, CreateOptions(), isProduction: false);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*内置*ID*");
    }

    [Fact]
    public void Load_contains匹配不区分大小写()
    {
        var path = WriteFile("contains.json", CreateRuleJson("custom-command", "contains", "curl"));
        var snapshot = WafRuleLoader.Load(path, CreateOptions(), isProduction: false);

        snapshot.Rules.Single(rule => rule.Id == "custom-command")
            .IsMatch("CURL https://example.com").Should().BeTrue();
    }

    public void Dispose()
    {
        if (Directory.Exists(_testDirectory))
        {
            Directory.Delete(_testDirectory, recursive: true);
        }
    }

    private string WriteFile(string fileName, string content)
    {
        var path = Path.Combine(_testDirectory, fileName);
        File.WriteAllText(path, content, Encoding.UTF8);
        return path;
    }

    private static WafRuleOptions CreateOptions()
        => new()
        {
            Enabled = true,
            RequireExternalRules = false,
            ReloadDebounceMilliseconds = 250
        };

    private static string CreateRuleJson(
        string id,
        string matchType,
        string pattern,
        string description = "测试规则")
        => $$"""
        {
          "schemaVersion": 1,
          "revision": "test-revision",
          "rules": [
            {
              "id": "{{id}}",
              "category": "sql-injection",
              "matchType": "{{matchType}}",
              "pattern": "{{pattern}}",
              "description": "{{description}}"
            }
          ]
        }
        """;

    private static string CreateJsonWithTwoRules(string firstId, string secondId)
        => $$"""
        {
          "schemaVersion": 1,
          "revision": "duplicate",
          "rules": [
            { "id": "{{firstId}}", "category": "sql-injection", "matchType": "contains", "pattern": "one", "description": "one" },
            { "id": "{{secondId}}", "category": "sql-injection", "matchType": "contains", "pattern": "two", "description": "two" }
          ]
        }
        """;
}
