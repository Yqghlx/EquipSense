using System.Text;
using EquipAI.Infrastructure.Middleware;
using FluentAssertions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moq;

namespace EquipAI.Tests.Unit.Middleware;

/// <summary>
/// WAF 规则快照 provider 的启动、失败回滚和热加载测试。
/// </summary>
public sealed class WafRuleProviderTests : IDisposable
{
    private readonly string _testDirectory = Path.Combine(
        Path.GetTempPath(),
        $"equipsense-waf-provider-{Guid.NewGuid():N}");

    public WafRuleProviderTests()
    {
        Directory.CreateDirectory(_testDirectory);
    }

    [Fact]
    public async Task StartAsync_生产规则文件缺失_应失败关闭()
    {
        var options = CreateOptions("missing.json");
        using var provider = CreateProvider(options, "Production");

        var act = () => provider.StartAsync(CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*规则文件*");
    }

    [Fact]
    public async Task StartAsync_开发规则文件缺失_只使用内置规则()
    {
        var options = CreateOptions("missing.json");
        options.RequireExternalRules = false;
        using var provider = CreateProvider(options, "Development");

        await provider.StartAsync(CancellationToken.None);

        provider.Current.Revision.Should().Be("builtin");
        provider.Current.Rules.Should().Contain(rule => rule.Id == "builtin-xss");
    }

    [Fact]
    public async Task ReloadNowAsync_合法文件_原子切换到新快照()
    {
        var path = WriteRules("first", "first-pattern");
        var options = CreateOptions(path);
        using var provider = CreateProvider(options, "Production");
        await provider.StartAsync(CancellationToken.None);

        WriteRules("second", "second-pattern");
        var result = await provider.ReloadNowAsync(CancellationToken.None);

        result.Should().BeTrue();
        provider.Current.Revision.Should().Be("second");
        provider.Current.Rules.Single(rule => rule.Id == "custom-rule")
            .IsMatch("second-pattern").Should().BeTrue();
    }

    [Fact]
    public async Task ReloadNowAsync_非法文件_保留上一有效快照()
    {
        var path = WriteRules("first", "first-pattern");
        var options = CreateOptions(path);
        using var provider = CreateProvider(options, "Production");
        await provider.StartAsync(CancellationToken.None);

        File.WriteAllText(path, "{ invalid-json", new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
        var result = await provider.ReloadNowAsync(CancellationToken.None);

        result.Should().BeFalse();
        provider.Current.Revision.Should().Be("first");
        provider.Current.Rules.Single(rule => rule.Id == "custom-rule")
            .IsMatch("first-pattern").Should().BeTrue();
    }

    [Fact]
    public async Task FileSystemWatcher_原子替换文件_应在防抖后加载新快照()
    {
        var path = WriteRules("first", "first-pattern");
        var options = CreateOptions(path);
        options.ReloadDebounceMilliseconds = 25;
        using var provider = CreateProvider(options, "Production");
        await provider.StartAsync(CancellationToken.None);

        var temporaryPath = path + ".tmp";
        File.WriteAllText(temporaryPath, CreateRulesJson("second", "second-pattern"), new UTF8Encoding(false));
        File.Move(temporaryPath, path, overwrite: true);

        await WaitUntilAsync(
            () => provider.Current.Revision == "second",
            TimeSpan.FromSeconds(3));

        provider.Current.Rules.Single(rule => rule.Id == "custom-rule")
            .IsMatch("second-pattern").Should().BeTrue();
    }

    [Fact]
    public void Dispose_重复调用_不应抛出异常()
    {
        using var provider = CreateProvider(CreateOptions("missing.json"), "Development");

        provider.Dispose();

        var act = () => provider.Dispose();

        act.Should().NotThrow();
    }

    [Fact]
    public async Task StopAsync_在Dispose后调用_不应抛出异常()
    {
        // WebApplicationFactory 释放宿主时可能再次调用 HostedService.StopAsync；停止路径必须容忍先发生的容器释放。
        var provider = CreateProvider(CreateOptions("missing.json"), "Development");
        provider.Dispose();

        var act = () => provider.StopAsync(CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    public void Dispose()
    {
        if (Directory.Exists(_testDirectory))
        {
            Directory.Delete(_testDirectory, recursive: true);
        }
    }

    private WafRuleProvider CreateProvider(WafRuleOptions options, string environmentName)
    {
        var environment = new Mock<IHostEnvironment>();
        environment.SetupGet(value => value.EnvironmentName).Returns(environmentName);

        return new WafRuleProvider(
            options,
            environment.Object,
            Mock.Of<ILogger<WafRuleProvider>>());
    }

    private WafRuleOptions CreateOptions(string fileName)
        => new()
        {
            Enabled = true,
            RulesPath = Path.IsPathFullyQualified(fileName)
                ? fileName
                : Path.Combine(_testDirectory, fileName),
            RequireExternalRules = true,
            ReloadDebounceMilliseconds = 250
        };

    private string WriteRules(string revision, string pattern)
    {
        var path = Path.Combine(_testDirectory, "rules.json");
        File.WriteAllText(path, CreateRulesJson(revision, pattern), new UTF8Encoding(false));
        return path;
    }

    private static string CreateRulesJson(string revision, string pattern)
        => $$"""
        {
          "schemaVersion": 1,
          "revision": "{{revision}}",
          "rules": [
            {
              "id": "custom-rule",
              "category": "sql-injection",
              "matchType": "contains",
              "pattern": "{{pattern}}",
              "description": "测试规则"
            }
          ]
        }
        """;

    private static async Task WaitUntilAsync(Func<bool> condition, TimeSpan timeout)
    {
        var deadline = DateTime.UtcNow + timeout;
        while (DateTime.UtcNow < deadline)
        {
            if (condition())
            {
                return;
            }

            await Task.Delay(25);
        }

        condition().Should().BeTrue("应在超时前完成 WAF 规则热加载");
    }
}
