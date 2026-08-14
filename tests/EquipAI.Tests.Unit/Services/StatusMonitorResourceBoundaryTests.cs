using System.Data.Common;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Tests.Unit.TestHelpers;
using EquipAI.WebAPI.Services;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace EquipAI.Tests.Unit.Services;

/// <summary>
/// 设备与网关状态监控资源边界回归测试。
/// 两个 30 秒后台任务都必须按稳定主键分页，避免高规模租户的离线对象一次性进入应用内存。
/// </summary>
public sealed class StatusMonitorResourceBoundaryTests : IAsyncLifetime
{
    private readonly StatusMonitorCommandCounter _commandCounter = new();
    private Mock<ISignalRNotificationService> _notifications = null!;
    private SqliteConnection _connection = null!;
    private ServiceProvider _sp = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();

        _notifications = new Mock<ISignalRNotificationService>();
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options => options
            .UseSqlite(_connection)
            .AddInterceptors(_commandCounter));
        services.AddScoped<ITenantContext>(_ => new BackgroundTenantContext());
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
    public async Task CheckDeviceStatusAsync_超时设备超过批次时应分页读取()
    {
        var tenantId = Guid.NewGuid();
        using (var seedScope = _sp.CreateScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Tenants.Add(MakeTenant(tenantId));
            db.Devices.AddRange(Enumerable.Range(0, 501).Select(_ => new Device
            {
                TenantId = tenantId,
                DeviceCode = $"D-{Guid.NewGuid():N}"[..12],
                Name = "资源边界测试设备",
                Type = "泵",
                Status = DeviceStatus.Online,
                LastSeenAt = DateTime.UtcNow.AddMinutes(-5),
            }));
            await db.SaveChangesAsync();
        }

        var monitor = new DeviceStatusMonitor(
            _sp.GetRequiredService<IServiceScopeFactory>(),
            new ConfigurationBuilder().Build(),
            new AlwaysAcquireLockProvider(),
            _sp.GetRequiredService<ILogger<DeviceStatusMonitor>>());
        _commandCounter.Reset();

        var affected = await monitor.CheckDeviceStatusAsync(CancellationToken.None);

        affected.Should().Be(501);
        _commandCounter.GetSelectsForTable("devices")
            .Should().NotBeEmpty()
            .And.OnlyContain(sql => sql.Contains("LIMIT", StringComparison.OrdinalIgnoreCase),
                "设备状态监控不应一次性读取全部超时设备");
    }

    [Fact]
    public async Task CheckHeartbeatsAsync_超时网关超过批次时应分页读取()
    {
        var tenantId = Guid.NewGuid();
        using (var seedScope = _sp.CreateScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Tenants.Add(MakeTenant(tenantId));
            db.Gateways.AddRange(Enumerable.Range(0, 501).Select(index => new Gateway
            {
                TenantId = tenantId,
                GatewayId = $"gateway-{index:D4}",
                Name = "资源边界测试网关",
                Host = "127.0.0.1",
                Status = "online",
                LastHeartbeatAt = DateTime.UtcNow.AddMinutes(-5),
            }));
            await db.SaveChangesAsync();
        }

        var monitor = new GatewayHeartbeatMonitor(
            _sp,
            new ConfigurationBuilder().Build(),
            new AlwaysAcquireLockProvider(),
            _sp.GetRequiredService<ILogger<GatewayHeartbeatMonitor>>());
        _commandCounter.Reset();

        await monitor.CheckHeartbeatsAsync(CancellationToken.None);

        _commandCounter.GetSelectsForTable("gateways")
            .Should().NotBeEmpty()
            .And.OnlyContain(sql => sql.Contains("LIMIT", StringComparison.OrdinalIgnoreCase),
                "网关心跳监控不应一次性读取全部超时网关");
    }

    [Fact]
    public async Task CheckDeviceStatusAsync_通知取消时应传播取消信号()
    {
        var tenantId = Guid.NewGuid();
        using (var seedScope = _sp.CreateScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Tenants.Add(MakeTenant(tenantId));
            db.Devices.Add(new Device
            {
                TenantId = tenantId,
                DeviceCode = "D-CANCEL-01",
                Name = "取消测试设备",
                Type = "泵",
                Status = DeviceStatus.Online,
                LastSeenAt = DateTime.UtcNow.AddMinutes(-5),
            });
            await db.SaveChangesAsync();
        }

        using var cancellation = new CancellationTokenSource();
        _notifications
            .Setup(n => n.SendDeviceOfflineAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns((Guid _, Guid _, string _, string _, CancellationToken token) =>
            {
                cancellation.Cancel();
                throw new OperationCanceledException(token);
            });

        var monitor = new DeviceStatusMonitor(
            _sp.GetRequiredService<IServiceScopeFactory>(),
            new ConfigurationBuilder().Build(),
            new AlwaysAcquireLockProvider(),
            _sp.GetRequiredService<ILogger<DeviceStatusMonitor>>());

        var act = () => monitor.CheckDeviceStatusAsync(cancellation.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [Fact]
    public async Task CheckHeartbeatsAsync_通知取消时应传播取消信号()
    {
        var tenantId = Guid.NewGuid();
        using (var seedScope = _sp.CreateScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Tenants.Add(MakeTenant(tenantId));
            db.Gateways.Add(new Gateway
            {
                TenantId = tenantId,
                GatewayId = "gateway-cancel-01",
                Name = "取消测试网关",
                Host = "127.0.0.1",
                Status = "online",
                LastHeartbeatAt = DateTime.UtcNow.AddMinutes(-5),
            });
            await db.SaveChangesAsync();
        }

        using var cancellation = new CancellationTokenSource();
        _notifications
            .Setup(n => n.SendGatewayOfflineAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns((Guid _, Guid _, string _, string _, CancellationToken token) =>
            {
                cancellation.Cancel();
                throw new OperationCanceledException(token);
            });

        var monitor = new GatewayHeartbeatMonitor(
            _sp,
            new ConfigurationBuilder().Build(),
            new AlwaysAcquireLockProvider(),
            _sp.GetRequiredService<ILogger<GatewayHeartbeatMonitor>>());

        var act = () => monitor.CheckHeartbeatsAsync(cancellation.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    private static Tenant MakeTenant(Guid id) => new()
    {
        Id = id,
        Name = $"T-{id:N}"[..10],
        Slug = $"s-{id:N}"[..10],
        Plan = TenantPlan.Professional,
        Status = TenantStatus.Active,
        MaxDevices = 1000,
    };

    /// <summary>复刻后台 HostedService 的空租户上下文。</summary>
    private sealed class BackgroundTenantContext : ITenantContext
    {
        public Guid TenantId => Guid.Empty;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }

    /// <summary>记录两个监控路径的 SELECT SQL，防止资源边界退化。</summary>
    private sealed class StatusMonitorCommandCounter : DbCommandInterceptor
    {
        private readonly object _gate = new();
        private List<string> _commands = [];

        public void Reset()
        {
            lock (_gate)
                _commands = [];
        }

        public IReadOnlyList<string> GetSelectsForTable(string table)
        {
            lock (_gate)
            {
                return _commands
                    .Where(sql => sql.Contains(table, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }
        }

        public override InterceptionResult<DbDataReader> ReaderExecuting(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result)
        {
            Record(command);
            return result;
        }

        public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result,
            CancellationToken cancellationToken = default)
        {
            Record(command);
            return ValueTask.FromResult(result);
        }

        private void Record(DbCommand command)
        {
            if (!command.CommandText.TrimStart().StartsWith("SELECT", StringComparison.OrdinalIgnoreCase))
                return;

            lock (_gate)
                _commands.Add(command.CommandText);
        }
    }
}
