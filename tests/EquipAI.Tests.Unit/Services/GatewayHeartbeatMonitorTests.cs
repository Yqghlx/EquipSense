using EquipAI.Core.Entities;
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

namespace EquipAI.Tests.Unit.Services;

/// <summary>
/// GatewayHeartbeatMonitor 单元测试 — 验证心跳超时标记 offline + 网关离线通知推送。
///
/// 关键不变量：网关是数据采集入口，离线=该网关下所有设备数据断（P0 工业事件）。原实现只改 Status+日志，
/// 运维完全不知情（直到手动查看网关列表）。修复后标记 offline 时推送 OnGatewayOffline 通知
/// （SignalR + 持久化 + Web Push 三路，与设备离线 #232 对称）。
///
/// 用 SQLite 而非 InMemory：InMemory 不强制 EF Core 全局查询过滤器，行为不稳定（见 #209）。
/// </summary>
public class GatewayHeartbeatMonitorTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private ServiceProvider _sp = null!;
    private Mock<ISignalRNotificationService> _signalRMock = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();

        _signalRMock = new Mock<ISignalRNotificationService>();
        _signalRMock.Setup(x => x.SendGatewayOfflineAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseSqlite(_connection));
        services.AddScoped<ITenantContext>(_ => new BackgroundTenantContext());
        services.AddScoped<ISignalRNotificationService>(_ => _signalRMock.Object);
        services.AddLogging();
        _sp = services.BuildServiceProvider();

        using (var scope = _sp.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Database.EnsureCreatedAsync();
        }
    }

    public async Task DisposeAsync()
    {
        await _sp.DisposeAsync();
        await _connection.DisposeAsync();
    }

    private GatewayHeartbeatMonitor CreateMonitor()
        => new(
            _sp,
            new ConfigurationBuilder().Build(),  // 空 config，HeartbeatTimeoutSeconds 用默认 90s
            new AlwaysAcquireLockProvider(),
            _sp.GetRequiredService<ILogger<GatewayHeartbeatMonitor>>());

    [Fact]
    public async Task 心跳超时的在线网关_应标记Offline并推送离线通知()
    {
        var tenantId = Guid.NewGuid();
        var expiredId = Guid.NewGuid();
        var healthyId = Guid.NewGuid();
        var alreadyOfflineId = Guid.NewGuid();

        using (var scope = _sp.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            // 超时网关：online + 心跳 120s 前（>默认阈值 90s）
            db.Gateways.Add(new Gateway { Id = expiredId, TenantId = tenantId, GatewayId = "gw-1", Name = "超时网关", Status = "online", LastHeartbeatAt = DateTime.UtcNow.AddSeconds(-120) });
            // 健康网关：online + 刚心跳，不应处理
            db.Gateways.Add(new Gateway { Id = healthyId, TenantId = tenantId, GatewayId = "gw-2", Name = "正常网关", Status = "online", LastHeartbeatAt = DateTime.UtcNow });
            // 已离线网关：offline，不应重复处理/通知
            db.Gateways.Add(new Gateway { Id = alreadyOfflineId, TenantId = tenantId, GatewayId = "gw-3", Name = "已离线", Status = "offline", LastHeartbeatAt = DateTime.UtcNow.AddSeconds(-300) });
            await db.SaveChangesAsync();
        }

        var monitor = CreateMonitor();
        await monitor.CheckHeartbeatsAsync();

        using (var scope = _sp.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var expired = await db.UnfilteredSet<Gateway>().FirstAsync(g => g.Id == expiredId);
            expired.Status.Should().Be("offline", "超时在线网关应被标记 offline");

            var healthy = await db.UnfilteredSet<Gateway>().FirstAsync(g => g.Id == healthyId);
            healthy.Status.Should().Be("online", "健康网关不应被处理");

            var alreadyOffline = await db.UnfilteredSet<Gateway>().FirstAsync(g => g.Id == alreadyOfflineId);
            alreadyOffline.Status.Should().Be("offline");
        }

        // 关键不变量：超时网关标记 offline 时应推送离线通知（原实现零通知，运维不知情）。
        // 用 Invocations 逐参数断言而非 Moq.Verify(具体参数)：后者表达式树对闭包捕获的 Guid 局部变量
        // 的值评估在多测试全量运行下不稳定（filter 单跑通过、全量却失败，且返回 0 次与已观察到的实体
        // 状态变更自相矛盾）；直接比对 Invocations.Arguments 规避该边角问题，且断言更精确。
        var invocations = _signalRMock.Invocations
            .Where(i => i.Method.Name == nameof(ISignalRNotificationService.SendGatewayOfflineAsync))
            .ToList();
        invocations.Count.Should().Be(1, "超时网关应触发 1 次离线通知");
        var args = invocations[0].Arguments;
        args[0].Should().Be(tenantId, "tenantId 参数");
        args[1].Should().Be(expiredId, "gatewayId 参数");
        args[2].Should().Be("gw-1", "gatewayCode 参数");
        args[3].Should().Be("超时网关", "gatewayName 参数");
        // 健康网关与已离线网关不应触发通知
        _signalRMock.Verify(x => x.SendGatewayOfflineAsync(
            It.IsAny<Guid>(), healthyId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        _signalRMock.Verify(x => x.SendGatewayOfflineAsync(
            It.IsAny<Guid>(), alreadyOfflineId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task 网关在查询后恢复心跳_不应被误标记离线或发送离线通知()
    {
        var tenantId = Guid.NewGuid();
        var gatewayId = Guid.NewGuid();
        var staleAt = DateTime.UtcNow.AddMinutes(-5);
        var refreshedAt = DateTime.UtcNow;

        using (var seedScope = _sp.CreateScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Gateways.Add(new Gateway
            {
                Id = gatewayId,
                TenantId = tenantId,
                GatewayId = "gw-race",
                Name = "竞态网关",
                Status = "online",
                LastHeartbeatAt = staleAt,
            });
            await db.SaveChangesAsync();

            // 模拟查询过期网关后、状态更新前收到心跳：触发器刷新时间并取消过期更新。
            await using var triggerCommand = db.Database.GetDbConnection().CreateCommand();
            triggerCommand.CommandText = $"""
                CREATE TRIGGER simulate_gateway_refresh_race
                BEFORE UPDATE OF Status ON gateways
                WHEN NEW.Status = 'offline'
                BEGIN
                    UPDATE gateways SET LastHeartbeatAt = '{refreshedAt:O}' WHERE Id = OLD.Id;
                    SELECT RAISE(IGNORE);
                END;
                """;
            await triggerCommand.ExecuteNonQueryAsync();
        }

        await CreateMonitor().CheckHeartbeatsAsync();

        var invocations = _signalRMock.Invocations
            .Where(i => i.Method.Name == nameof(ISignalRNotificationService.SendGatewayOfflineAsync))
            .ToList();
        invocations.Should().BeEmpty("恢复心跳的网关不应收到错误的离线通知");

        using var assertScope = _sp.CreateScope();
        var assertDb = assertScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var gateway = await assertDb.UnfilteredSet<Gateway>().SingleAsync(g => g.Id == gatewayId);
        gateway.Status.Should().Be("online");
        gateway.LastHeartbeatAt.Should().BeAfter(staleAt);
    }

    /// <summary>
    /// 后台 scope 的租户上下文 — 无 HTTP 上下文时 DI 回退分支，TenantId=Guid.Empty
    /// </summary>
    private class BackgroundTenantContext : ITenantContext
    {
        public Guid TenantId => Guid.Empty;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
