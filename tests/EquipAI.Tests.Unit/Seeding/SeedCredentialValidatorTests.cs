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
            ["SEED_ADMIN_PASSWORD"] = "admin-secret",
            ["SEED_LEAD_PASSWORD"] = "lead-secret",
            ["SEED_TECH_PASSWORD"] = null,
            ["SEED_OPERATOR_PASSWORD"] = "operator-secret",
            ["SEED_VIEWER_PASSWORD"] = "viewer-secret"
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
            ["SEED_ADMIN_PASSWORD"] = "admin-secret",
            ["SEED_LEAD_PASSWORD"] = "lead-secret",
            ["SEED_TECH_PASSWORD"] = "tech-secret",
            ["SEED_OPERATOR_PASSWORD"] = "operator-secret",
            ["SEED_VIEWER_PASSWORD"] = "viewer-secret"
        };

        var act = () => SeedCredentialValidator.Validate(
            isProduction: true,
            credentials,
            includeTenant2Account: false);

        act.Should().NotThrow();
    }

    [Fact]
    public void 生产环境禁止使用公开的种子默认密码()
    {
        var credentials = new Dictionary<string, string?>
        {
            ["SEED_ADMIN_PASSWORD"] = "Admin@123",
            ["SEED_LEAD_PASSWORD"] = "lead-secret",
            ["SEED_TECH_PASSWORD"] = "tech-secret",
            ["SEED_OPERATOR_PASSWORD"] = "operator-secret",
            ["SEED_VIEWER_PASSWORD"] = "viewer-secret"
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
            ["SEED_ADMIN_PASSWORD"] = "admin-secret",
            ["SEED_LEAD_PASSWORD"] = "lead-secret",
            ["SEED_TECH_PASSWORD"] = "tech-secret",
            ["SEED_OPERATOR_PASSWORD"] = "operator-secret",
            ["SEED_VIEWER_PASSWORD"] = "viewer-secret",
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
