using AutoMapper;
using EquipAI.Application.DTOs.Devices;
using EquipAI.Application.Mapping;
using EquipAI.Application.Services;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit;

namespace EquipAI.Tests.Unit.Services;

/// <summary>
/// DeviceService 跨租户隔离回归测试（锁定不变量）。
///
/// 起因与证伪：GetDeviceByIdAsync / UpdateDeviceAsync / DeleteDeviceAsync 用 <c>FindAsync(deviceId)</c>
/// 查找设备，且不显式校验 <c>device.TenantId == tenantId</c>。初判 EF Core 的 <c>FindAsync</c> 绕过
/// 全局租户过滤器 → P0 跨租户越权（租户 A 传 B 的 deviceId 即可读 / 改 / 删 B 的设备）。但决定性实验
/// （同租户命中 + 跨租户被挡）<b>证伪</b>了该假设：EF Core 的 <c>FindAsync</c> <b>会应用全局查询过滤器</b>
/// （查 DB 时带 TenantId 过滤），故跨租户 deviceId 在 context=A 下被挡 → 返回 null / 抛 KeyNotFound，
/// **无越权**。正向控制（同租户命中）排除了"FindAsync 永远返回 null"的假阳性。
///
/// 本测试的价值：把"FindAsync 受租户过滤器保护"锁定为回归不变量——若未来有人误把查找改成
/// <c>UnfilteredSet / IgnoreQueryFilters</c>（绕过过滤器），或 EF Core 行为变更，这些测试会立即捕获 P0。
///
/// 必须用 SQLite：InMemory 提供程序不强制全局过滤器，无法区分"FindAsync 受保护"与"InMemory 本就不应用
/// 过滤器"。SQLite 强制过滤器，才能如实反映生产 PG 的 FindAsync 行为。每个测试方法用独立 scope
/// （新 AppDbContext，无追踪），避免种子实体被变更追踪器缓存而掩盖 DB 查询路径。
/// </summary>
public class DeviceServiceTenantIsolationTests : IAsyncLifetime
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
        // 全局租户上下文固定为租户 A（模拟租户 A 用户登录），凸显"FindAsync 绕过过滤器找到 B 的设备"
        services.AddSingleton<ITenantContext>(new FixedTenantContext(_tenantA));
        services.AddSingleton<IMapper>(_ => new Mapper(new MapperConfiguration(c => c.AddProfile<MappingProfile>())));
        services.AddLogging();
        _sp = services.BuildServiceProvider();

        using var seedScope = _sp.CreateScope();
        var db = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();

        // 种子：租户 A/B 各一台设备（计数均为 1）。用 Add（不受过滤器影响）插入跨租户数据
        db.Add(new Tenant
        {
            Id = _tenantA, Name = "TA", Slug = "ta", Plan = TenantPlan.Basic,
            CurrentDeviceCount = 1, MaxDevices = 50
        });
        db.Add(new Tenant
        {
            Id = _tenantB, Name = "TB", Slug = "tb", Plan = TenantPlan.Basic,
            CurrentDeviceCount = 1, MaxDevices = 50
        });
        db.Add(new Device
        {
            Id = Guid.NewGuid(), TenantId = _tenantA, DeviceCode = "A-001",
            Name = "设备A", Type = "电机", Status = DeviceStatus.Offline
        });
        db.Add(new Device
        {
            Id = Guid.NewGuid(), TenantId = _tenantB, DeviceCode = "B-001",
            Name = "设备B", Type = "泵", Status = DeviceStatus.Offline
        });
        await db.SaveChangesAsync();
    }

    public async Task DisposeAsync()
    {
        await _sp.DisposeAsync();
        await _connection.DisposeAsync();
    }

    /// <summary>从种子取出两台设备的 Id（用 UnfilteredSet 绕过过滤器读取跨租户设备）</summary>
    private async Task<(Guid deviceAId, Guid deviceBId)> GetDeviceIdsAsync()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var deviceAId = await db.UnfilteredSet<Device>().Where(d => d.TenantId == _tenantA).Select(d => d.Id).FirstAsync();
        var deviceBId = await db.UnfilteredSet<Device>().Where(d => d.TenantId == _tenantB).Select(d => d.Id).FirstAsync();
        return (deviceAId, deviceBId);
    }

    private DeviceService CreateServiceWithFreshScope()
    {
        var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var mapper = scope.ServiceProvider.GetRequiredService<IMapper>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<DeviceService>>();
        return new DeviceService(db, mapper, logger);
    }

    [Fact]
    public async Task DeleteDeviceAsync_他租户设备ID_应拒绝且不应错乱本租户计数()
    {
        var (_, deviceBId) = await GetDeviceIdsAsync();
        var sut = CreateServiceWithFreshScope();

        // 租户 A 用户（context=A）试图删除租户 B 的设备
        var act = async () => await sut.DeleteDeviceAsync(deviceBId, _tenantA);

        // FindAsync 受全局租户过滤器保护，跨租户 deviceId 查不到 → 抛 KeyNotFound（404，不泄露存在性）
        await act.Should().ThrowAsync<KeyNotFoundException>(
            "租户 A 不应能删除租户 B 的设备；本测试锁定该不变量，防止未来误改成 UnfilteredSet 查找而引入 P0");

        // 租户 B 的设备应仍存在
        using var assertScope = _sp.CreateScope();
        var assertDb = assertScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var stillExists = await assertDb.UnfilteredSet<Device>().AnyAsync(d => d.Id == deviceBId);
        stillExists.Should().BeTrue("租户 B 的设备绝不能被其他租户删除");

        // 双方计数都不应错乱（旧 bug：租户 A 计数被错误 --）
        var tA = await assertDb.UnfilteredSet<Tenant>().FirstAsync(t => t.Id == _tenantA);
        var tB = await assertDb.UnfilteredSet<Tenant>().FirstAsync(t => t.Id == _tenantB);
        tA.CurrentDeviceCount.Should().Be(1, "删除被拒绝，租户 A 计数不应变动");
        tB.CurrentDeviceCount.Should().Be(1, "删除被拒绝，租户 B 计数不应变动");
    }

    [Fact]
    public async Task GetDeviceByIdAsync_他租户设备ID_应返回null()
    {
        var (_, deviceBId) = await GetDeviceIdsAsync();
        var sut = CreateServiceWithFreshScope();

        // 租户 A 用户查询租户 B 的设备 → 应返回 null（对 A 而言"不存在"）
        var result = await sut.GetDeviceByIdAsync(deviceBId, _tenantA);

        result.Should().BeNull("租户 A 不应能读取租户 B 的设备详情（含位置/序列号等敏感字段）");
    }

    [Fact]
    public async Task GetDeviceByIdAsync_同租户设备ID_应返回设备()
    {
        // 正向控制：确认 FindAsync 在本租户下能正常查到设备，从而证明上面的跨租户返回 null
        // 是受全局租户过滤器保护（而非 FindAsync 因别的原因永远返回 null 的假阳性）。
        // 即：FindAsync 应用了全局查询过滤器——同租户命中、跨租户被挡。
        var (deviceAId, _) = await GetDeviceIdsAsync();
        var sut = CreateServiceWithFreshScope();

        var result = await sut.GetDeviceByIdAsync(deviceAId, _tenantA);

        result.Should().NotBeNull("同租户设备应能正常查询（证明 FindAsync 工作正常，非永远返回 null）");
        result!.DeviceCode.Should().Be("A-001");
    }

    [Fact]
    public async Task UpdateDeviceAsync_他租户设备ID_应拒绝()
    {
        var (_, deviceBId) = await GetDeviceIdsAsync();
        var sut = CreateServiceWithFreshScope();

        var act = async () => await sut.UpdateDeviceAsync(deviceBId, _tenantA, new UpdateDeviceRequest { Name = "被篡改" });

        await act.Should().ThrowAsync<KeyNotFoundException>(
            "租户 A 不应能修改租户 B 的设备");
    }

    private sealed class FixedTenantContext : ITenantContext
    {
        public FixedTenantContext(Guid tenantId) => TenantId = tenantId;
        public Guid TenantId { get; }
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
