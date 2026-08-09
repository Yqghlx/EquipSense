using EquipAI.Application.Security;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Security;

/// <summary>
/// MFA 一次性恢复码生成与消费测试。
/// </summary>
public class MfaRecoveryCodeServiceTests
{
    [Fact]
    public void 生成恢复码应为八个可打印且互不重复的码()
    {
        var result = MfaRecoveryCodeService.Generate();

        result.Codes.Should().HaveCount(8);
        result.Codes.Should().OnlyHaveUniqueItems();
        result.Codes.Should().AllSatisfy(code =>
        {
            code.Should().MatchRegex("^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$");
        });
        result.SerializedHashes.Should().NotContain(result.Codes[0]);
    }

    [Fact]
    public void 正确恢复码只能成功消费一次()
    {
        var result = MfaRecoveryCodeService.Generate();

        var consumed = MfaRecoveryCodeService.TryConsume(
            result.SerializedHashes,
            result.Codes[0],
            out var remaining);
        var replayed = MfaRecoveryCodeService.TryConsume(
            remaining,
            result.Codes[0],
            out _);

        consumed.Should().BeTrue();
        replayed.Should().BeFalse();
        remaining.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void 恢复码输入允许忽略大小写和分隔符()
    {
        var result = MfaRecoveryCodeService.Generate();
        var normalizedInput = result.Codes[0].Replace("-", string.Empty).ToLowerInvariant();

        var consumed = MfaRecoveryCodeService.TryConsume(
            result.SerializedHashes,
            normalizedInput,
            out _);

        consumed.Should().BeTrue();
    }

    [Fact]
    public void 损坏的恢复码存储应安全失败()
    {
        var consumed = MfaRecoveryCodeService.TryConsume(
            "not-json",
            "ABCD-EFGH-JKLM-NPQR",
            out var remaining);

        consumed.Should().BeFalse();
        remaining.Should().Be("not-json");
    }

    [Fact]
    public void 恢复码摘要为空时应安全失败()
    {
        var consumed = MfaRecoveryCodeService.TryConsume(
            "[null,\"not-hex\"]",
            "ABCD-EFGH-JKLM-NPQR",
            out var remaining);

        consumed.Should().BeFalse();
        remaining.Should().Be("[null,\"not-hex\"]");
    }
}
