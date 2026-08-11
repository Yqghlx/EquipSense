using System.Reflection;
using EquipAI.Application.DTOs.Auth;
using EquipAI.WebAPI.Controllers;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Xunit;

namespace EquipAI.Tests.Unit.Web;

/// <summary>
/// 认证端点安全标注回归测试。
/// </summary>
public sealed class AuthEndpointSecurityTests
{
    /// <summary>
    /// 刷新令牌会触发 Redis 会话读取、轮换和写入，必须使用认证专用限流策略，
    /// 防止攻击者通过大量失效或重放令牌消耗认证基础设施资源。
    /// </summary>
    [Fact]
    public void 刷新令牌端点_必须使用认证限流策略()
    {
        var method = typeof(AuthController).GetMethod(
            nameof(AuthController.Refresh),
            BindingFlags.Public | BindingFlags.Instance);

        method.Should().NotBeNull();

        var attribute = method!.GetCustomAttribute<EnableRateLimitingAttribute>();
        attribute.Should().NotBeNull(
            "刷新令牌接口属于高成本认证操作，必须通过 auth 限流策略保护");
        attribute!.PolicyName.Should().Be("auth");
    }

    /// <summary>
    /// 刷新令牌端点必须在 OpenAPI 中声明成功响应模型，避免客户端根据不完整契约生成错误代码。
    /// </summary>
    [Fact]
    public void 刷新令牌端点_必须声明认证响应成功模型()
    {
        var method = typeof(AuthController).GetMethod(
            nameof(AuthController.Refresh),
            BindingFlags.Public | BindingFlags.Instance);

        method.Should().NotBeNull();

        var response = method!
            .GetCustomAttributes<ProducesResponseTypeAttribute>()
            .SingleOrDefault(attribute => attribute.StatusCode == StatusCodes.Status200OK);

        response.Should().NotBeNull(
            "刷新成功响应必须出现在 Swagger/OpenAPI 契约中");
        response!.Type.Should().Be(typeof(AuthResponse));
    }
}
