using EquipAI.Application.Devices;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.WebAPI.Controllers;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace EquipAI.Tests.Unit.Web;

/// <summary>
/// DeviceConfigController.QuickRegister 跨租户注入 + 配额漂移回归测试（锁定不变量）。
///
/// 起因：旧版 QuickRegister 用请求体里的 <c>request.TenantId</c> 作为设备及告警规则的归属租户，
/// 且创建后不维护租户 <c>CurrentDeviceCount</c>。两个缺陷叠加：
/// 1. <b>跨租户注入</b>：租户 A 用户（JWT=A）传 <c>TenantId=B</c>，即可在 B 名下创建设备 →
///    污染 B 的设备列表、触发 B 的告警、占用 B 的订阅配额（P0 越权）。
/// 2. <b>配额漂移/超卖</b>：本端点创建的设备不计入 <c>CurrentDeviceCount</c>，配额中间件
///    （<c>CurrentDeviceCount &lt; MaxDevices</c>）会错误放行 → 租户超卖额度。
/// 这与已有的跨租户注入系列同源：租户身份必须以 JWT 为权威，禁止信任请求体里的 TenantId。
///
/// 修复：注入 <c>ITenantContext</c>，用 <c>_tenantContext.TenantId</c>（JWT 权威）创建设备及告警规则
/// （忽略请求体 TenantId），并 <c>tenant.CurrentDeviceCount++</c>（与 DeviceService.CreateDeviceAsync 一致）。
///
/// 必须用 SQLite：InMemory 提供程序不强制全局过滤器，无法如实反映生产 PG 的"按当前租户范围"重复编码
/// 检查；SQLite 强制过滤器，且能验证计数维护的真实写库行为。
/// </summary>
public class DeviceConfigControllerTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private ServiceProvider _sp = null!;
    private readonly Guid _tenantA = Guid.NewGuid();
    private readonly Guid _tenantB = Guid.NewGuid();

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseSqlite(_connection));
        // 模拟租户 A 用户登录：JWT 权威固定为租户 A
        services.AddSingleton<ITenantContext>(new FixedTenantContext(_tenantA));
        _sp = services.BuildServiceProvider();

        using var seedScope = _sp.CreateScope();
        var db = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();

        // 种子：两个租户，设备计数均为 0（凸显计数维护断言）
        db.Add(new Tenant
        {
            Id = _tenantA, Name = "TA", Slug = "ta", Plan = TenantPlan.Basic,
            CurrentDeviceCount = 0, MaxDevices = 50
        });
        db.Add(new Tenant
        {
            Id = _tenantB, Name = "TB", Slug = "tb", Plan = TenantPlan.Basic,
            CurrentDeviceCount = 0, MaxDevices = 50
        });
        await db.SaveChangesAsync();
    }

    public async Task DisposeAsync()
    {
        await _sp.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task QuickRegister_请求体指定他租户TenantId_应以JWT租户为准且维护本租户计数()
    {
        // 场景：租户 A 用户（JWT=A）调用快速注册，请求体恶意指定 TenantId=B（跨租户注入）。
        // 期望：设备归属 JWT 租户 A（忽略请求体 B），并维护 A 的 CurrentDeviceCount。
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantContext = scope.ServiceProvider.GetRequiredService<ITenantContext>();
        var service = new DeviceConfigService(db, tenantContext);
        var controller = new DeviceConfigController(service);

        await controller.QuickRegister(new QuickRegisterRequest
        {
            TenantId = _tenantB,           // 恶意指定他租户（应被忽略）
            DeviceCode = "INJECT-001",
            Name = "注入测试设备",
            DeviceType = "电机"
        });

        // 核心断言 1：设备归属 JWT 租户 A，而非请求体的 B（防跨租户注入）
        var device = await db.UnfilteredSet<Device>().FirstOrDefaultAsync(d => d.DeviceCode == "INJECT-001");
        device.Should().NotBeNull("设备应被创建");
        device!.TenantId.Should().Be(_tenantA,
            "设备归属应以 JWT 租户为准，禁止信任请求体 TenantId（防跨租户注入）");
        device.TenantId.Should().NotBe(_tenantB, "租户 A 不得在租户 B 名下创建设备");

        // 核心断言 2：维护本租户计数（防配额漂移/超卖）
        var tA = await db.UnfilteredSet<Tenant>().FirstAsync(t => t.Id == _tenantA);
        var tB = await db.UnfilteredSet<Tenant>().FirstAsync(t => t.Id == _tenantB);
        tA.CurrentDeviceCount.Should().Be(1,
            "通过本端点创建设备应维护租户 A 的 CurrentDeviceCount，否则配额中间件超卖");
        tB.CurrentDeviceCount.Should().Be(0, "租户 B 的计数不应受影响");
    }

    /// <summary>测试用固定租户上下文（模拟 JWT 解析出的租户）</summary>
    private sealed class FixedTenantContext : ITenantContext
    {
        public FixedTenantContext(Guid tenantId) => TenantId = tenantId;
        public Guid TenantId { get; }
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
