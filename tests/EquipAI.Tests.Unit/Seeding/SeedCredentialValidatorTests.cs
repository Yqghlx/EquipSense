using EquipAI.Infrastructure.Seeding;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Seeding;

/// <summary>
/// 生产种子账户凭据校验测试。
/// </summary>
public class SeedCredentialValidatorTests
{
    [Fact]
    public void 生产环境缺少任一种子密码时必须拒绝启动()
    {
        var credentials = new Dictionary<string, string?>
        {
            ["SEED_ADMIN_PASSWORD"] = "admin-secret-strong",
            ["SEED_LEAD_PASSWORD"] = "lead-secret-strong",
            ["SEED_TECH_PASSWORD"] = null,
            ["SEED_OPERATOR_PASSWORD"] = "operator-secret-strong",
            ["SEED_VIEWER_PASSWORD"] = "viewer-secret-strong"
        };

        var act = () => SeedCredentialValidator.Validate(
            isProduction: true,
            credentials,
            includeTenant2Account: false);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*SEED_TECH_PASSWORD*");
    }

    [Fact]
    public void 生产环境配置完整凭据时允许启动()
    {
        var credentials = new Dictionary<string, string?>
        {
            ["SEED_ADMIN_PASSWORD"] = "admin-secret-strong",
            ["SEED_LEAD_PASSWORD"] = "lead-secret-strong",
            ["SEED_TECH_PASSWORD"] = "tech-secret-strong",
            ["SEED_OPERATOR_PASSWORD"] = "operator-secret-strong",
            ["SEED_VIEWER_PASSWORD"] = "viewer-secret-strong"
        };

        var act = () => SeedCredentialValidator.Validate(
            isProduction: true,
            credentials,
            includeTenant2Account: false);

        act.Should().NotThrow();
    }

    [Fact]
    public void 生产环境禁止不同种子账户复用同一密码()
    {
        var credentials = new Dictionary<string, string?>
        {
            ["SEED_ADMIN_PASSWORD"] = "shared-seed-secret",
            ["SEED_LEAD_PASSWORD"] = "shared-seed-secret",
            ["SEED_TECH_PASSWORD"] = "tech-secret-strong",
            ["SEED_OPERATOR_PASSWORD"] = "operator-secret-strong",
            ["SEED_VIEWER_PASSWORD"] = "viewer-secret-strong"
        };

        var act = () => SeedCredentialValidator.Validate(
            isProduction: true,
            credentials,
            includeTenant2Account: false);

        var exception = act.Should().Throw<InvalidOperationException>().Which;
        exception.Message.Should().Contain("SEED_LEAD_PASSWORD");
        exception.Message.Should().Contain("SEED_ADMIN_PASSWORD");
        exception.Message.Should().NotContain("shared-seed-secret");
    }

    [Fact]
    public void 生产环境禁止使用公开的种子默认密码()
    {
        var credentials = new Dictionary<string, string?>
        {
            ["SEED_ADMIN_PASSWORD"] = "Admin@123",
            ["SEED_LEAD_PASSWORD"] = "lead-secret-strong",
            ["SEED_TECH_PASSWORD"] = "tech-secret-strong",
            ["SEED_OPERATOR_PASSWORD"] = "operator-secret-strong",
            ["SEED_VIEWER_PASSWORD"] = "viewer-secret-strong"
        };

        var act = () => SeedCredentialValidator.Validate(
            isProduction: true,
            credentials,
            includeTenant2Account: false);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*SEED_ADMIN_PASSWORD*");
    }

    [Fact]
    public void 生产环境禁止使用占位凭据()
    {
        var credentials = new Dictionary<string, string?>
        {
            ["SEED_ADMIN_PASSWORD"] = "PLEASE_CHANGE_ADMIN_PASSWORD",
            ["SEED_LEAD_PASSWORD"] = "lead-secret-strong",
            ["SEED_TECH_PASSWORD"] = "tech-secret-strong",
            ["SEED_OPERATOR_PASSWORD"] = "operator-secret-strong",
            ["SEED_VIEWER_PASSWORD"] = "viewer-secret-strong"
        };

        var act = () => SeedCredentialValidator.Validate(
            isProduction: true,
            credentials,
            includeTenant2Account: false);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*SEED_ADMIN_PASSWORD*");
    }

    [Fact]
    public void 生产环境禁止使用过短的种子密码()
    {
        var credentials = new Dictionary<string, string?>
        {
            ["SEED_ADMIN_PASSWORD"] = "short-password",
            ["SEED_LEAD_PASSWORD"] = "lead-secret-strong",
            ["SEED_TECH_PASSWORD"] = "tech-secret-strong",
            ["SEED_OPERATOR_PASSWORD"] = "operator-secret-strong",
            ["SEED_VIEWER_PASSWORD"] = "viewer-secret-strong"
        };

        var act = () => SeedCredentialValidator.Validate(
            isProduction: true,
            credentials,
            includeTenant2Account: false);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*SEED_ADMIN_PASSWORD*");
    }

    [Fact]
    public void 启用第二租户测试账户时必须额外配置密码()
    {
        var credentials = new Dictionary<string, string?>
        {
            ["SEED_ADMIN_PASSWORD"] = "admin-secret-strong",
            ["SEED_LEAD_PASSWORD"] = "lead-secret-strong",
            ["SEED_TECH_PASSWORD"] = "tech-secret-strong",
            ["SEED_OPERATOR_PASSWORD"] = "operator-secret-strong",
            ["SEED_VIEWER_PASSWORD"] = "viewer-secret-strong",
            ["SEED_TENANT2_PASSWORD"] = null
        };

        var act = () => SeedCredentialValidator.Validate(
            isProduction: true,
            credentials,
            includeTenant2Account: true);

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*SEED_TENANT2_PASSWORD*");
    }

    [Fact]
    public void 非生产环境允许使用开发默认值()
    {
        var act = () => SeedCredentialValidator.Validate(
            isProduction: false,
            new Dictionary<string, string?>(),
            includeTenant2Account: false);

        act.Should().NotThrow();
    }
}
