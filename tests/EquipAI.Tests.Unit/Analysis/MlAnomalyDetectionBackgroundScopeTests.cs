using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace EquipAI.Tests.Unit.Analysis;

/// <summary>
/// L4 ML 异常检测（MlAnomalyDetectionService.DetectAsync）后台 scope 遥测查询回归测试。
///
/// 生产链路：告警 → RootCauseAnalysisHandler（后台事件处理器）→ RootCauseAnalysisEngine.AnalyzeAsync
/// → MlAnomalyDetectionService.DetectAsync。该服务注册为 Singleton，通过 IServiceScopeFactory 在独立
/// scope（无 HttpContext）中解析 DbContext，ITenantContext 走回退 → TenantId == Guid.Empty。
/// DetectAsync 查 DeviceTelemetry 若沿用默认全局租户过滤器，恒查不到真实租户遥测 → 样本恒不足 50 →
/// 返回 null → L4 ML 异常检测永不触发，四级降级链最高级沦为死代码。
///
/// 本测试直接验证 DetectAsync 依赖的遥测查询在后台 scope 的行为：
/// - 默认过滤器（修复前的写法）：查到 0 条 —— 复刻 bug
/// - IgnoreQueryFilters + 显式 tenantId（修复后的写法）：查到全部 —— 证明修复
///
/// 不调用 DetectAsync 端到端：SrCnn 依赖 Intel MKL（仅 x64），arm64 下 DetectAsync 会吞掉 SrCnn 初始化
/// 异常恒返回 null，无法跨平台断言。查询层验证与 SrCnn 无关，可在任意平台运行。GetBaselineStatsAsync
/// 由 DevicesController（HTTP 上下文，真实租户）调用，默认过滤器在该路径正确，不在测试范围。
/// </summary>
public class MlAnomalyDetectionBackgroundScopeTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private ServiceProvider _sp = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseSqlite(_connection));
        // 复刻后台 scope：ITenantContext 回退为空租户
        services.AddScoped<ITenantContext>(_ => new BackgroundTenantContext());
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
    public async Task 后台scope_默认过滤器查不到真实租户遥测_修复后IgnoreQueryFilters可查到()
    {
        var tenantId = Guid.NewGuid();
        var deviceId = Guid.NewGuid();

        // seed 真实租户 + 设备 + 100 条遥测（> MinSampleCount=50）
        using (var seedScope = _sp.CreateScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Tenants.Add(new Tenant
            {
                Id = tenantId, Name = "T", Slug = "t", Plan = TenantPlan.Professional,
                Status = TenantStatus.Active, MaxDevices = 10
            });
            db.Devices.Add(new Device
            {
                Id = deviceId, TenantId = tenantId, Type = "电机",
                DeviceCode = "M-1", Name = "电机", Status = DeviceStatus.Online
            });
            await db.SaveChangesAsync();

            var baseTime = DateTime.UtcNow.AddDays(-1);
            for (var i = 0; i < 100; i++)
            {
                var t = DateTime.SpecifyKind(baseTime.AddMinutes(i), DateTimeKind.Utc);
                await db.Database.ExecuteSqlRawAsync(
                    "INSERT INTO device_telemetry (time, tenant_id, device_id, metric, value, quality, source) " +
                    "VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6})",
                    t, tenantId, deviceId, "temperature", 50.0 + i * 0.1, "good", "test");
            }
        }

        // 后台 scope（Guid.Empty 租户上下文）查询，复刻 DetectAsync 的查询条件
        using (var queryScope = _sp.CreateScope())
        {
            var db = queryScope.ServiceProvider.GetRequiredService<AppDbContext>();
            var cutoff = DateTime.UtcNow.AddDays(-7);

            // 复刻【修复前】的写法：默认全局租户过滤器。后台 scope 下过滤器为 TenantId==Guid.Empty，
            // 查不到真实租户的遥测 → DetectAsync 样本恒 0 → L4 死代码。此即 bug。
            var defaultFilterCount = await db.DeviceTelemetry
                .Where(t => t.DeviceId == deviceId && t.Metric == "temperature" && t.Time >= cutoff)
                .CountAsync();

            // 复刻【修复后】的写法：IgnoreQueryFilters + 显式 tenantId。
            var fixedCount = await db.DeviceTelemetry
                .IgnoreQueryFilters()
                .Where(t => t.TenantId == tenantId && t.DeviceId == deviceId && t.Metric == "temperature" && t.Time >= cutoff)
                .CountAsync();

            defaultFilterCount.Should().Be(0,
                "后台 scope 默认过滤器为 TenantId==Guid.Empty，必查不到真实租户遥测——这正是 L4 死代码的根因");
            fixedCount.Should().Be(100,
                "IgnoreQueryFilters + 显式 tenantId 必须能查到全部历史遥测，DetectAsync 才能拿到 ≥50 样本进入 ML 检测");
        }
    }

    /// <summary>复刻后台事件处理器中 ITenantContext 的 DI 回退：空租户上下文。</summary>
    private sealed class BackgroundTenantContext : ITenantContext
    {
        public Guid TenantId => Guid.Empty;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
