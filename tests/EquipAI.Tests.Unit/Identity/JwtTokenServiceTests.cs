using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Infrastructure.Identity;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace EquipAI.Tests.Unit.Identity;

/// <summary>
/// JwtTokenService 单元测试
/// 覆盖访问令牌生成（Claims 正确性）、刷新令牌格式、令牌解析（有效/无效）等核心场景
/// </summary>
public class JwtTokenServiceTests
{
    private readonly JwtTokenService _sut;

    /// <summary>
    /// 测试用 HMAC-SHA256 密钥，至少 32 字符以满足签名算法要求
    /// </summary>
    private readonly string _secret = new('x', 32);

    public JwtTokenServiceTests()
    {
        // 构建内存配置，模拟 appsettings 中的 Jwt 配置节
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = _secret,
                ["Jwt:Issuer"] = "TestIssuer",
                ["Jwt:Audience"] = "TestAudience"
            })
            .Build();

        _sut = new JwtTokenService(config);
    }

    /// <summary>
    /// 创建标准测试用户，各字段填充合理默认值
    /// </summary>
    private User MakeUser() => new()
    {
        Id = Guid.NewGuid(),
        TenantId = Guid.NewGuid(),
        Username = "testuser",
        Role = UserRole.SystemAdmin,
        TokenVersion = 1
    };

    /// <summary>
    /// 辅助方法：解析 JWT 字符串为声明字典，便于断言特定 Claim
    /// </summary>
    private static Dictionary<string, string> ParseClaims(string accessToken)
    {
        var handler = new JwtSecurityTokenHandler();
        var token = handler.ReadJwtToken(accessToken);
        return token.Claims.ToDictionary(c => c.Type, c => c.Value);
    }

    [Fact]
    public void GenerateAccessToken_应返回JWT格式字符串()
    {
        // Arrange
        var user = MakeUser();

        // Act
        var accessToken = _sut.GenerateAccessToken(user);

        // Assert — JWT 由三段 Base64Url 编码组成，以 '.' 分隔
        accessToken.Split('.').Length.Should().Be(3);
    }

    [Fact]
    public void GenerateAccessToken_应包含sub声明()
    {
        // Arrange
        var user = MakeUser();

        // Act
        var accessToken = _sut.GenerateAccessToken(user);
        var claims = ParseClaims(accessToken);

        // Assert — sub 声明应等于用户 ID
        claims.Should().ContainKey(JwtRegisteredClaimNames.Sub);
        claims[JwtRegisteredClaimNames.Sub].Should().Be(user.Id.ToString());
    }

    [Fact]
    public void GenerateAccessToken_应包含tenant_id声明()
    {
        // Arrange
        var user = MakeUser();

        // Act
        var accessToken = _sut.GenerateAccessToken(user);
        var claims = ParseClaims(accessToken);

        // Assert — tenant_id 声明应等于用户所属租户 ID
        claims.Should().ContainKey("tenant_id");
        claims["tenant_id"].Should().Be(user.TenantId.ToString());
    }

    [Fact]
    public void GenerateAccessToken_应包含role声明()
    {
        // Arrange
        var user = MakeUser();

        // Act
        var accessToken = _sut.GenerateAccessToken(user);
        var claims = ParseClaims(accessToken);

        // Assert — role 声明应等于用户角色名称
        claims.Should().ContainKey("role");
        claims["role"].Should().Be(user.Role.ToString());
    }

    [Fact]
    public void GenerateRefreshToken_应返回32位无连字符的十六进制字符串()
    {
        // Act
        var refreshToken = _sut.GenerateRefreshToken();

        // Assert — Guid.ToString("N") 生成 32 位十六进制字符，不含连字符
        refreshToken.Length.Should().Be(32);
        refreshToken.Should().NotContain("-");
        // 验证全部为十六进制字符
        refreshToken.All(c => "0123456789abcdef".Contains(c)).Should().BeTrue();
    }

    [Fact]
    public void GetPrincipalFromToken_有效令牌应返回已认证的ClaimsPrincipal()
    {
        // Arrange
        var user = MakeUser();
        var accessToken = _sut.GenerateAccessToken(user);

        // Act
        var principal = _sut.GetPrincipalFromToken(accessToken);

        // Assert — 有效令牌应解析出非空的已认证主体
        principal.Should().NotBeNull();
        principal!.Identity.Should().NotBeNull();
        principal.Identity!.IsAuthenticated.Should().BeTrue();
    }

    [Fact]
    public void GetPrincipalFromToken_无效令牌应返回null()
    {
        // Arrange — 构造一段格式上像 JWT 但签名无效的字符串
        const string invalidToken = "eyJhbGciOiJIUzI1NiJ9.invalid.payload";

        // Act
        var principal = _sut.GetPrincipalFromToken(invalidToken);

        // Assert — 无效令牌解析应返回 null，不抛异常
        principal.Should().BeNull();
    }

    [Fact]
    public void GenerateAccessToken_应包含token_version声明()
    {
        // Arrange
        var user = MakeUser();

        // Act
        var accessToken = _sut.GenerateAccessToken(user);
        var claims = ParseClaims(accessToken);

        // Assert — token_version 声明应等于用户的令牌版本号
        claims.Should().ContainKey("token_version");
        claims["token_version"].Should().Be(user.TokenVersion.ToString());
    }

    [Theory]
    [InlineData(true, "true")]
    [InlineData(false, "false")]
    public void GenerateAccessToken_应包含强制改密声明(bool mustChangePassword, string expected)
    {
        // Arrange：强制改密状态必须进入签名令牌，后端才能阻止绕过前端的业务请求。
        var user = MakeUser();
        user.MustChangePassword = mustChangePassword;

        // Act
        var claims = ParseClaims(_sut.GenerateAccessToken(user));

        // Assert
        claims.Should().ContainKey("must_change_password");
        claims["must_change_password"].Should().Be(expected);
    }

    // ========================================================================
    // 访问令牌有效期测试（默认 15 分钟，可配置，钳制 [10,1440]）
    // 安全回归：原实现硬编码 24h，登出/改密后旧令牌仍可用 24h，泄漏暴露面过大
    // ========================================================================

    /// <summary>
    /// 辅助方法：用指定配置构建 JwtTokenService
    /// </summary>
    private static JwtTokenService CreateWithConfig(int? accessTokenMinutes = null)
    {
        var dict = new Dictionary<string, string?>
        {
            ["Jwt:Secret"] = new string('x', 32),
            ["Jwt:Issuer"] = "TestIssuer",
            ["Jwt:Audience"] = "TestAudience",
        };
        if (accessTokenMinutes.HasValue)
        {
            dict["Jwt:AccessTokenMinutes"] = accessTokenMinutes.Value.ToString();
        }
        return new JwtTokenService(new ConfigurationBuilder().AddInMemoryCollection(dict).Build());
    }

    [Fact]
    public void AccessTokenMinutes_未配置时_应默认为15分钟()
    {
        var sut = CreateWithConfig(accessTokenMinutes: null);
        sut.AccessTokenMinutes.Should().Be(15,
            "因为未配置时应采用默认值 15 分钟（原 24h 过长，缩小令牌泄漏暴露面）");
    }

    [Theory]
    [InlineData(0, 10)]     // 低于下限 → 钳制到 10（保证前端 5min 预刷新窗口）
    [InlineData(5, 10)]     // 低于下限 → 钳制到 10
    [InlineData(30, 30)]    // 区间内 → 原值
    [InlineData(1440, 1440)]// 上限 → 原值（24h）
    [InlineData(9999, 1440)]// 超上限 → 钳制到 1440（防误配超长有效期）
    public void AccessTokenMinutes_应钳制到合法区间(int configured, int expected)
    {
        var sut = CreateWithConfig(accessTokenMinutes: configured);
        sut.AccessTokenMinutes.Should().Be(expected);
    }

    [Fact]
    public void GenerateAccessToken_过期时间应基于AccessTokenMinutes而非24小时()
    {
        // Arrange — 配置 20 分钟有效期
        var sut = CreateWithConfig(accessTokenMinutes: 20);
        var user = MakeUser();
        var before = DateTimeOffset.UtcNow;

        // Act
        var token = new JwtSecurityTokenHandler().ReadJwtToken(sut.GenerateAccessToken(user));
        var after = DateTimeOffset.UtcNow;

        // Assert — exp 应在 [19, 21] 分钟区间内，绝不可能是 24 小时
        var validFor = token.ValidTo - before;
        validFor.TotalMinutes.Should().BeGreaterThan(19);
        validFor.TotalMinutes.Should().BeLessThan(21);
        (after - before).TotalMinutes.Should().BeLessThan(1, "测试本身应在 1 分钟内完成");
    }
}
