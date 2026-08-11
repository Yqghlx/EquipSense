using EquipAI.WebAPI.Extensions;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace EquipAI.Tests.Unit.Web;

/// <summary>
/// JWT 认证令牌来源的安全回归测试。
/// </summary>
public sealed class JwtAuthenticationTokenSourceTests
{
    [Fact]
    public async Task SignalR同时携带Cookie和QueryString时_应优先使用HttpOnlyCookie()
    {
        var options = BuildJwtOptions();
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Path = "/hubs/industrial";
        httpContext.Request.QueryString = new QueryString("?access_token=query-token");
        httpContext.Request.Headers.Cookie = "access_token=cookie-token";
        var messageContext = new MessageReceivedContext(
            httpContext,
            new AuthenticationScheme(
                JwtBearerDefaults.AuthenticationScheme,
                JwtBearerDefaults.AuthenticationScheme,
                typeof(JwtBearerHandler)),
            options);

        await options.Events!.OnMessageReceived!(messageContext);

        messageContext.Token.Should().Be("cookie-token");
    }

    [Fact]
    public async Task SignalR未携带Cookie时_仍允许使用QueryString兼容非浏览器客户端()
    {
        var options = BuildJwtOptions();
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Path = "/hubs/industrial";
        httpContext.Request.QueryString = new QueryString("?access_token=query-token");
        var messageContext = new MessageReceivedContext(
            httpContext,
            new AuthenticationScheme(
                JwtBearerDefaults.AuthenticationScheme,
                JwtBearerDefaults.AuthenticationScheme,
                typeof(JwtBearerHandler)),
            options);

        await options.Events!.OnMessageReceived!(messageContext);

        messageContext.Token.Should().Be("query-token");
    }

    private static JwtBearerOptions BuildJwtOptions()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddJwtAuthentication(new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "unit-test-secret-with-at-least-32-characters",
            })
            .Build());

        using var provider = services.BuildServiceProvider();
        return provider
            .GetRequiredService<IOptionsMonitor<JwtBearerOptions>>()
            .Get(JwtBearerDefaults.AuthenticationScheme);
    }
}
