using EquipAI.Application.Analysis;
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

namespace EquipAI.Tests.Unit.Analysis;

/// <summary>
/// 设备健康度定时重算后台服务（DeviceHealthRecalculationHostedService）回归测试。
///
/// 背景：DeviceHealthService.UpdateAllHealthScoresAsync 注释自述"用于定时任务"，但此前全仓无任何定时调用者
/// （仅手动端点），devices.health_score 默认 100 永不自动重算 → DeviceDetailPage/报表恒显示"健康"无视
/// 告警与离线。本服务补齐"每 10 分钟遍历活跃租户重算"的定时调用者。
///
/// 同时覆盖后台 scope 租户过滤器 bug：DeviceHealthService 的设备/遥测查询原用默认全局过滤器，后台 scope
/// （Guid.Empty）下与 tenantId 求交集恒为空 → 查不到设备，重算形同空跑。已改 IgnoreQueryFilters
/// （deviceId/Id 全局唯一）。InMemory 不强制过滤器会掩盖此 bug，必须用 SQLite + Guid.Empty 上下文复刻后台路径。
/// </summary>
public class DeviceHealthRecalculationHostedServiceTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private ServiceProvider _sp = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseSqlite(_connection));
        // 复刻后台 HostedService scope：ITenantContext 回退为空租户（Guid.Empty）
        services.AddScoped<ITenantContext>(_ => new BackgroundTenantContext());
        services.AddLogging();
        services.AddScoped<DeviceHealthService>();
        services.AddSingleton<DeviceHealthRecalculationHostedService>();
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
    public async Task RunRecalculationAsync_应遍历活跃租户重算健康度并跳过过期租户()
    {
        var tenantA = Guid.NewGuid(); // 活跃
        var tenantB = Guid.NewGuid(); // 活跃
        var tenantC = Guid.NewGuid(); // Expired，应跳过

        // 活跃租户 A：离线设备 + 1 条近期 Critical Active 告警 → 健康度应明显下降
        // 活跃租户 B：在线设备、无告警、无遥测 → 健康度因无遥测质量分为中性 70 而略低于 100
        // 过期租户 C：离线设备 + Critical 告警，但应被跳过 → 健康度保持默认 100
        var deviceA = Guid.NewGuid();
        var deviceB = Guid.NewGuid();
        var deviceC = Guid.NewGuid();

        using (var seedScope = _sp.CreateScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Tenants.Add(MakeTenant(tenantA, TenantStatus.Active));
            db.Tenants.Add(MakeTenant(tenantB, TenantStatus.Active));
            db.Tenants.Add(MakeTenant(tenantC, TenantStatus.Expired));

            db.Devices.Add(MakeDevice(deviceA, tenantA, DeviceStatus.Offline));
            db.Devices.Add(MakeDevice(deviceB, tenantB, DeviceStatus.Online));
            db.Devices.Add(MakeDevice(deviceC, tenantC, DeviceStatus.Offline));

            // A 设备一条近期 Critical 活跃告警（OccurredAt = 现在，落在 7 天窗口内）
            db.Alerts.Add(MakeAlert(tenantA, deviceA, AlertSeverity.Critical, AlertStatus.Active));
            // C 设备一条 Critical 告警（过期租户，应被整体跳过）
            db.Alerts.Add(MakeAlert(tenantC, deviceC, AlertSeverity.Critical, AlertStatus.Active));
            await db.SaveChangesAsync();
        }

        // 解析 HostedService（其 _scopeFactory 创建后台 scope，Guid.Empty 租户上下文）
        var hosted = _sp.GetRequiredService<DeviceHealthRecalculationHostedService>();
        var updated = await hosted.RunRecalculationAsync(CancellationToken.None);

        // 仅 2 个活跃租户的设备被重算（Expired 租户跳过）
        updated.Should().Be(2, "仅 2 个活跃租户各 1 台设备被重算，Expired 租户被跳过");

        using var assertScope = _sp.CreateScope();
        var assertDb = assertScope.ServiceProvider.GetRequiredService<AppDbContext>();

        var dA = await assertDb.Devices.IgnoreQueryFilters().FirstAsync(d => d.Id == deviceA);
        var dB = await assertDb.Devices.IgnoreQueryFilters().FirstAsync(d => d.Id == deviceB);
        var dC = await assertDb.Devices.IgnoreQueryFilters().FirstAsync(d => d.Id == deviceC);

        // A：离线(状态分50) + Critical活跃告警(扣30) → 远低于 100；且低于无告警的 B
        dA.HealthScore.Should().BeLessThan(100m, "离线 + Critical 活跃告警应使健康度下降，而非保持默认 100");
        dA.HealthScore.Should().BeLessThan(dB.HealthScore, "有 Critical 告警的设备健康度应低于无告警设备");

        // B：在线 + 无告警，但无遥测质量分取中性 70 → 略低于 100（证明也被重算，非保持默认）
        dB.HealthScore.Should().BeLessThan(100m, "无遥测设备质量分取中性 70，健康度应略低于完美 100（证明已重算）");

        // C：Expired 租户被跳过，健康度保持默认 100（未被重算）
        dC.HealthScore.Should().Be(100m, "Expired 租户被跳过，健康度不应变更");
    }

    /// <summary>构造租户（最小必填字段）</summary>
    private static Tenant MakeTenant(Guid id, TenantStatus status) => new()
    {
        Id = id, Name = $"T-{id:N}".Substring(0, 10), Slug = $"s-{id:N}".Substring(0, 10),
        Plan = TenantPlan.Professional, Status = status, MaxDevices = 10
    };

    /// <summary>构造设备（HealthScore 默认 100，状态由参数指定）</summary>
    private static Device MakeDevice(Guid id, Guid tenantId, DeviceStatus status) => new()
    {
        Id = id, TenantId = tenantId, DeviceCode = $"D-{id:N}".Substring(0, 12),
        Name = "测试设备", Type = "泵", Status = status
    };

    /// <summary>构造告警（OccurredAt = 当前，落在 7 天评估窗口内）</summary>
    private static Alert MakeAlert(Guid tenantId, Guid deviceId, AlertSeverity severity, AlertStatus status) => new()
    {
        TenantId = tenantId, AlertCode = $"AL-{Guid.NewGuid():N}".Substring(0, 14),
        DeviceId = deviceId, Severity = severity, Status = status,
        Metric = "temperature", Value = 95m, OccurredAt = DateTime.UtcNow
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
