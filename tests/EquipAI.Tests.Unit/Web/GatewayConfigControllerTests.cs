using EquipAI.Application.DTOs.Gateway;
using EquipAI.Application.Services;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.WebAPI.Controllers;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace EquipAI.Tests.Unit.Web;

/// <summary>
/// GatewayConfigController 单元测试
///
/// 重点回归：PullConfig 的跨租户泄漏。
/// GatewayId 仅【租户内】唯一（GatewayConfiguration: HasIndex(TenantId,GatewayId).IsUnique()），
/// CreateDevice 默认 gatewayId="gateway-001"，多租户共用同一 Id 是常态。旧版 PullConfig 仅按
/// gatewayId 过滤，持有共享 AuthKey 的任意网关会拿到所有租户同 Id 网关下的设备配置
/// （含 OPC UA 连接串等工业敏感信息）。修复后必须按 (TenantId, GatewayId) 双重限定。
/// </summary>
public class GatewayConfigControllerTests
{
    private const string AuthKey = "test-secret-key";

    /// <summary>构造 InMemory AppDbContext 并可选预填数据</summary>
    private static async Task<AppDbContext> CreateDbAsync(Func<AppDbContext, Task>? seed = null)
    {
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(Guid.NewGuid().ToString()));
        // AppDbContext 构造依赖 ITenantContext（本端点不使用它，给默认值即可）
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(Guid.Empty));
        var sp = services.BuildServiceProvider();
        var db = sp.GetRequiredService<AppDbContext>();
        if (seed is not null)
            await seed(db);
        return db;
    }

    /// <summary>构造带 AuthKey 配置的控制器，HttpContext 预置认证头</summary>
    private static GatewayConfigController CreateController(AppDbContext db, bool withAuthHeader = true)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Gateway:AuthKey"] = AuthKey,
            })
            .Build();

        var httpContext = new DefaultHttpContext();
        if (withAuthHeader)
            httpContext.Request.Headers["X-Gateway-Auth-Key"] = AuthKey;

        // GatewayDeviceConfigService 持有 db/ITenantContext/logger —— 设备配置查询下沉到服务
        var endpointPolicy = new GatewayEndpointPolicy(config);
        var service = new GatewayDeviceConfigService(
            db,
            Mock.Of<ITenantContext>(),
            endpointPolicy,
            Mock.Of<IHttpClientFactory>(),
            NullLogger<GatewayDeviceConfigService>.Instance);
        return new GatewayConfigController(
            service,
            endpointPolicy,
            Mock.Of<IHttpClientFactory>(),
            config,
            NullLogger<GatewayConfigController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext },
        };
    }

    /// <summary>构造一条网关设备配置</summary>
    private static GatewayDevice CreateDevice(Guid tenantId, string gatewayId, string deviceName, string connection) => new()
    {
        Id = Guid.NewGuid(),
        TenantId = tenantId,
        GatewayId = gatewayId,
        DeviceName = deviceName,
        Protocol = "opcua",
        ConnectionConfig = connection,
        DataPoints = "{}",
        PollIntervalMs = 3000,
        Enabled = true,
    };

    [Fact]
    public async Task PullConfig_两租户同GatewayId_只返回调用方租户设备_不得跨租户泄漏()
    {
        // 场景：租户 A 和租户 B 都用默认网关 Id "gateway-001"（CreateDevice 的默认值，多租户共用）。
        // 旧版仅按 gatewayId 过滤会同时返回两租户设备 → 跨租户泄漏连接串。
        var tenantA = Guid.NewGuid();
        var tenantB = Guid.NewGuid();
        const string sharedGatewayId = "gateway-001";
        var deviceA = CreateDevice(tenantA, sharedGatewayId, "A车间PLC", "{\"endpointUrl\":\"opc.tcp://10.0.0.1\"}");
        var deviceB = CreateDevice(tenantB, sharedGatewayId, "B车间PLC", "{\"endpointUrl\":\"opc.tcp://10.0.0.2\"}");

        var db = await CreateDbAsync(async ctx =>
        {
            await ctx.Set<GatewayDevice>().AddRangeAsync(deviceA, deviceB);
            await ctx.SaveChangesAsync();
        });

        var controller = CreateController(db);

        // 租户 A 的网关拉取自己的配置
        var result = await controller.PullConfig(sharedGatewayId, tenantA);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var devices = ok.Value.Should().BeAssignableTo<List<GatewayDevicePullDto>>().Subject;

        // 关键断言：只返回租户 A 的 1 个设备，不得包含租户 B 的设备
        devices.Should().HaveCount(1);
        devices[0].DeviceId.Should().Be(deviceA.Id.ToString());
        devices.Should().NotContain(d => d.DeviceId == deviceB.Id.ToString(),
            "不得跨租户返回租户 B 的设备配置（含工业连接串）");
    }

    [Fact]
    public async Task PullConfig_缺tenantId_返回400_强制网关携带租户标识()
    {
        var db = await CreateDbAsync();
        var controller = CreateController(db);

        var result = await controller.PullConfig("gateway-001", tenantId: null);

        result.Result.Should().BeOfType<BadRequestObjectResult>(
            "tenantId 必填：缺失会导致回退到仅按 gatewayId 过滤，重演跨租户泄漏");
    }

    [Fact]
    public async Task PullConfig_AuthKey错误_返回401()
    {
        var db = await CreateDbAsync();
        // 不带认证头
        var controller = CreateController(db, withAuthHeader: false);

        var result = await controller.PullConfig("gateway-001", Guid.NewGuid());

        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task PullConfig_同租户多设备_全部返回且按名称排序()
    {
        var tenant = Guid.NewGuid();
        var d1 = CreateDevice(tenant, "gw-1", "Zeta-PLC", "{}");
        var d2 = CreateDevice(tenant, "gw-1", "Alpha-PLC", "{}");

        var db = await CreateDbAsync(async ctx =>
        {
            await ctx.Set<GatewayDevice>().AddRangeAsync(d1, d2);
            await ctx.SaveChangesAsync();
        });
        var controller = CreateController(db);

        var result = await controller.PullConfig("gw-1", tenant);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var devices = ok.Value.Should().BeAssignableTo<List<GatewayDevicePullDto>>().Subject;
        devices.Should().HaveCount(2);
    }

    /// <summary>测试用租户上下文</summary>
    private sealed class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode => "Database";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
