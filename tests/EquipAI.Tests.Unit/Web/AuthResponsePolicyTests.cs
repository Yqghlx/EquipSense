using EquipAI.Application.DTOs.Auth;
using EquipAI.WebAPI.Security;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Moq;

namespace EquipAI.Tests.Unit.Web;

/// <summary>
/// 认证响应令牌暴露策略测试，确保生产浏览器路径不会把 JWT 放回响应体。
/// </summary>
public sealed class AuthResponsePolicyTests
{
    private static AuthResponsePolicy CreatePolicy(string environmentName, string? machineApiKey = null)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Auth:MachineApiKey"] = machineApiKey,
            })
            .Build();
        var environment = new Mock<IHostEnvironment>();
        environment.SetupGet(value => value.EnvironmentName).Returns(environmentName);
        return new AuthResponsePolicy(configuration, environment.Object);
    }

    [Fact]
    public void Production_未携带机器密钥时应清除响应体令牌()
    {
        var policy = CreatePolicy("Production");
        var response = new AuthResponse
        {
            AccessToken = "access-token",
            RefreshToken = "refresh-token",
        };

        policy.ShouldExposeTokens(null).Should().BeFalse();
        policy.PrepareForResponse(response, null);

        response.AccessToken.Should().BeEmpty();
        response.RefreshToken.Should().BeEmpty();
    }

    [Fact]
    public void Production_只有独立机器密钥匹配时才暴露令牌()
    {
        const string machineApiKey = "machine-api-key-that-is-longer-than-32-characters";
        var policy = CreatePolicy("Production", machineApiKey);

        policy.ShouldExposeTokens("wrong-machine-key").Should().BeFalse();
        policy.ShouldExposeTokens(machineApiKey).Should().BeTrue();
    }

    [Fact]
    public void 非Production环境也不能在没有机器密钥时暴露令牌()
    {
        var policy = CreatePolicy("Staging");

        policy.ShouldExposeTokens(null).Should().BeFalse();
    }

    [Theory]
    [InlineData("Development")]
    [InlineData("Testing")]
    public void 开发和测试环境保留现有令牌响应契约(string environmentName)
    {
        var policy = CreatePolicy(environmentName);

        policy.ShouldExposeTokens(null).Should().BeTrue();
    }
}
