using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Tests.Unit.TestHelpers;
using EquipAI.WebAPI.Services;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace EquipAI.Tests.Unit.Services;

/// <summary>
/// 设备在线状态监控后台服务（DeviceStatusMonitor）回归测试。
///
/// 背景：DeviceStatusMonitor 周期性把"LastSeenAt 超过阈值仍为 Online"的设备降级为 Offline，
/// 是 Dashboard 在线设备数 / 设备可用率 / OEE 的真实状态来源。但它在后台 HostedService scope 运行，
/// 该 scope 无 HttpContext → ITenantContext 回退为 Guid.Empty（见 ServiceCollectionExtensions 后台回退分支：
/// new TenantContext(Guid.Empty, "Shared", false, Guid.Empty)）。全局查询过滤器随之变成
/// WHERE TenantId = Guid.Empty，只命中系统租户（无真实设备）→ ExecuteUpdateAsync 永远影响 0 行 →
/// 设备一旦收到遥测变 Online（TelemetryEventHandler 已正确用 IgnoreQueryFilters 写入）就永远变不回 Offline，
/// 哪怕断网数天。结果：Dashboard 在线数 / 可用率 / OEE 永久虚高，客户运维看到的产线状态是假的。
///
/// 对称遗漏：Online 写入路径（TelemetryEventHandler）用了 IgnoreQueryFilters，Offline 写入路径（本服务）遗漏。
/// 修复：本服务是跨租户的全局运维巡检（只按 Status + LastSeenAt 改状态，不读取也不返回任何租户私有数据），
/// 应用 IgnoreQueryFilters，与 Online 写入对称。InMemory 提供程序不强制过滤器会掩盖此 bug，
/// 必须用 SQLite + Guid.Empty 上下文复刻后台路径。
/// </summary>
public class DeviceStatusMonitorTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private ServiceProvider _sp = null!;
    private Mock<ISignalRNotificationService> _notifications = null!;

    public async Task InitializeAsync()
    {
        _notifications = new Mock<ISignalRNotificationService>();
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseSqlite(_connection));
        // 复刻后台 HostedService scope：ITenantContext 回退为空租户（Guid.Empty）
        services.AddScoped<ITenantContext>(_ => new BackgroundTenantContext());
        // 注册通知服务 mock：DeviceStatusMonitor 在检查 scope 内解析它，推送设备离线通知
        services.AddScoped<ISignalRNotificationService>(_ => _notifications.Object);
        services.AddLogging();
        _sp = services.BuildServiceProvider();

        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        await _sp.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task CheckDeviceStatusAsync_真实租户的超时在线设备_应被标记为离线()
    {
        // 真实客户租户（非系统租户 Guid.Empty）
        var tenantA = Guid.NewGuid();
        var deviceA = Guid.NewGuid(); // 超时：应降级 Offline
        var deviceB = Guid.NewGuid(); // 阈值内：应保持 Online

        using (var seedScope = _sp.CreateScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Tenants.Add(MakeTenant(tenantA));
            // A：Online 但 LastSeenAt = 5 分钟前（远超 90s 默认阈值）→ 应被标记 Offline
            db.Devices.Add(MakeDevice(deviceA, tenantA, DeviceStatus.Online, DateTime.UtcNow.AddMinutes(-5)));
            // B：Online 且 LastSeenAt = 刚刚（在阈值内）→ 应保持 Online
            db.Devices.Add(MakeDevice(deviceB, tenantA, DeviceStatus.Online, DateTime.UtcNow));
            await db.SaveChangesAsync();
        }

        // OfflineTimeoutSeconds 未配置 → 取默认 90s
        var config = new ConfigurationBuilder().Build();
        var monitor = new DeviceStatusMonitor(
            _sp.GetRequiredService<IServiceScopeFactory>(),
            config,
            new AlwaysAcquireLockProvider(),
            _sp.GetRequiredService<ILogger<DeviceStatusMonitor>>());

        var affected = await monitor.CheckDeviceStatusAsync(CancellationToken.None);

        // 仅 A 被标记，B 因仍在阈值内保持 Online
        affected.Should().Be(1, "只有 1 台超时（5 分钟无遥测）的在线设备应被降级为 Offline");

        using var assertScope = _sp.CreateScope();
        var assertDb = assertScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var dA = await assertDb.Devices.IgnoreQueryFilters().FirstAsync(d => d.Id == deviceA);
        var dB = await assertDb.Devices.IgnoreQueryFilters().FirstAsync(d => d.Id == deviceB);

        dA.Status.Should().Be(DeviceStatus.Offline,
            "超时在线设备必须被降级为 Offline，否则 Dashboard 在线数/可用率/OEE 永久虚高");
        dB.Status.Should().Be(DeviceStatus.Online, "阈值内的在线设备不应被误标记");
    }

    [Fact]
    public async Task CheckDeviceStatusAsync_跨多个租户的超时设备_都应被标记离线()
    {
        // 多租户场景：后台巡检必须覆盖所有租户，Guid.Empty 过滤器不得吞掉任何租户的设备
        var tenantA = Guid.NewGuid();
        var tenantB = Guid.NewGuid();

        using (var seedScope = _sp.CreateScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Tenants.Add(MakeTenant(tenantA));
            db.Tenants.Add(MakeTenant(tenantB));
            db.Devices.Add(MakeDevice(Guid.NewGuid(), tenantA, DeviceStatus.Online, DateTime.UtcNow.AddMinutes(-10)));
            db.Devices.Add(MakeDevice(Guid.NewGuid(), tenantB, DeviceStatus.Online, DateTime.UtcNow.AddMinutes(-10)));
            await db.SaveChangesAsync();
        }

        var config = new ConfigurationBuilder().Build();
        var monitor = new DeviceStatusMonitor(
            _sp.GetRequiredService<IServiceScopeFactory>(),
            config,
            new AlwaysAcquireLockProvider(),
            _sp.GetRequiredService<ILogger<DeviceStatusMonitor>>());

        var affected = await monitor.CheckDeviceStatusAsync(CancellationToken.None);

        affected.Should().Be(2, "跨租户的全局巡检必须覆盖所有租户，后台 scope 的 Guid.Empty 过滤器不得吞掉真实租户设备");
    }

    [Fact]
    public async Task CheckDeviceStatusAsync_超时设备离线_应推送离线通知给运维()
    {
        // 设备离线（通信中断/故障）是工业监控基本告警。原实现只改状态不发通知，运维完全不知情；
        // 且设备离线不产生遥测故不触发阈值告警 → 必须有独立离线通知（SignalR + 持久化 + Web Push）。
        var tenantA = Guid.NewGuid();
        var deviceOffline = Guid.NewGuid(); // 超时应被标记 Offline 并通知
        var deviceOnline = Guid.NewGuid();  // 阈值内保持 Online，不应通知

        using (var seedScope = _sp.CreateScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Tenants.Add(MakeTenant(tenantA));
            db.Devices.Add(MakeDevice(deviceOffline, tenantA, DeviceStatus.Online, DateTime.UtcNow.AddMinutes(-5)));
            db.Devices.Add(MakeDevice(deviceOnline, tenantA, DeviceStatus.Online, DateTime.UtcNow));
            await db.SaveChangesAsync();
        }

        var config = new ConfigurationBuilder().Build();
        var monitor = new DeviceStatusMonitor(
            _sp.GetRequiredService<IServiceScopeFactory>(),
            config,
            new AlwaysAcquireLockProvider(),
            _sp.GetRequiredService<ILogger<DeviceStatusMonitor>>());

        await monitor.CheckDeviceStatusAsync(CancellationToken.None);

        // 验证：超时设备被标记 Offline 后，应按租户推送离线通知（含设备标识），阈值内设备不通知
        _notifications.Verify(
            n => n.SendDeviceOfflineAsync(tenantA, deviceOffline, It.IsAny<string>(), It.IsAny<string>()),
            Times.Once, "设备离线必须推送通知给运维，否则通信中断无人知晓（设备离线不触发阈值告警）");
        _notifications.Verify(
            n => n.SendDeviceOfflineAsync(tenantA, deviceOnline, It.IsAny<string>(), It.IsAny<string>()),
            Times.Never, "阈值内的在线设备不应被误判离线，不应推送离线通知");
    }

    /// <summary>构造租户（最小必填字段）</summary>
    private static Tenant MakeTenant(Guid id) => new()
    {
        Id = id, Name = $"T-{id:N}".Substring(0, 10), Slug = $"s-{id:N}".Substring(0, 10),
        Plan = TenantPlan.Professional, Status = TenantStatus.Active, MaxDevices = 10
    };

    /// <summary>构造设备（状态与最近活跃时间由参数指定）</summary>
    private static Device MakeDevice(Guid id, Guid tenantId, DeviceStatus status, DateTime? lastSeenAt) => new()
    {
        Id = id, TenantId = tenantId, DeviceCode = $"D-{id:N}".Substring(0, 12),
        Name = "测试设备", Type = "泵", Status = status, LastSeenAt = lastSeenAt
    };

    /// <summary>复刻后台 HostedService 中 ITenantContext 的 DI 回退：空租户上下文。</summary>
    private sealed class BackgroundTenantContext : ITenantContext
    {
        public Guid TenantId => Guid.Empty;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
