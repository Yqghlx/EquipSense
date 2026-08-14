using System.Data.Common;
using EquipAI.Application.Analysis;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit;

namespace EquipAI.Tests.Unit.Analysis;

/// <summary>
/// 数据质量评估（DataQualityService）后台 scope 遥测查询回归测试。
///
/// 生产链路：告警 → RootCauseAnalysisHandler（后台事件处理器）→ RootCauseAnalysisEngine.AnalyzeAsync
/// → DataQualityService.CalculateScoreAsync。该服务注册为 Singleton，通过 IServiceScopeFactory 创建独立
/// scope（无 HttpContext）解析 DbContext，ITenantContext 走回退 → TenantId == Guid.Empty。
/// DeviceTelemetry 查询若沿用默认全局租户过滤器，后台 scope 下恒为 TenantId == Guid.Empty → 查不到真实
/// 租户数据（HasNoKey 实体同样被过滤器作用）→ 样本恒不足 → 返回 null。
///
/// AnalyzeAsync 中 dataQuality = null ?? 0.0，故数据质量评分恒为 0，导致：
/// 1) L3 统计分析分支要求 dataQuality &gt;= 0.6，永远不成立 —— 即便基线查询已修好，L3 仍二次卡死；
/// 2) Analysis 记录的 DataQualityScore 永久存 0，质量仪表盘失真。
///
/// InMemory provider 不强制查询过滤器，必须用 SQLite 复刻生产行为。
/// </summary>
public class DataQualityBackgroundScopeTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private ServiceProvider _sp = null!;
    private readonly TelemetrySelectCommandCounter _selectCommandCounter = new();

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o
            .UseSqlite(_connection)
            .AddInterceptors(_selectCommandCounter));
        // 复刻后台 scope：ITenantContext 回退为空租户
        services.AddScoped<ITenantContext>(_ => new BackgroundTenantContext());
        services.AddMemoryCache();
        services.AddLogging();
        // 与生产一致：DataQualityService 注册为 Singleton，内部通过 _scopeFactory 创建后台 scope
        services.AddSingleton<DataQualityService>();
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
    public async Task 后台scope_CalculateScoreAsync应按事件租户返回真实评分()
    {
        var tenantId = Guid.NewGuid();
        var deviceId = Guid.NewGuid();

        // seed 真实租户 + 设备 + 最近 30 分钟内的 10 条温度遥测（> MinSampleCount=5）
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

            var baseTime = DateTime.UtcNow.AddMinutes(-30);
            for (var i = 0; i < 10; i++)
            {
                var t = DateTime.SpecifyKind(baseTime.AddMinutes(i * 2), DateTimeKind.Utc);
                await db.Database.ExecuteSqlRawAsync(
                    "INSERT INTO device_telemetry (time, tenant_id, device_id, metric, value, quality, source) " +
                    "VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6})",
                    t, tenantId, deviceId, "temperature", 50.0 + i * 0.5, "good", "test");
            }
        }

        // 从 DI 解析单例服务：其内部 _scopeFactory 创建后台 scope（Guid.Empty 租户上下文）
        var service = _sp.GetRequiredService<DataQualityService>();
        var score = await service.CalculateScoreAsync(tenantId, deviceId, "temperature", CancellationToken.None);

        // 修复后：能查到真实租户遥测（10 条），返回有效评分 > 0。修复前：默认过滤器查 0 条 → 返回 null。
        score.Should().NotBeNull("后台 scope 必须能按事件租户查到遥测并计算数据质量评分");
        score.Should().BeGreaterThan(0, "10 条正常遥测应产生正向数据质量评分");
    }

    /// <summary>
    /// 高频设备的质量评估应限制应用层统计样本，但保留完整样本总数。
    /// </summary>
    [Fact]
    public async Task 高频遥测质量评估_统计样本应限制在一万条且报告保留完整计数()
    {
        var tenantId = Guid.NewGuid();
        var deviceId = Guid.NewGuid();

        using (var seedScope = _sp.CreateScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Database.ExecuteSqlRawAsync(
                """
                WITH RECURSIVE numbers(n) AS (
                    SELECT 1
                    UNION ALL
                    SELECT n + 1 FROM numbers WHERE n < 10005
                )
                INSERT INTO device_telemetry (time, tenant_id, device_id, metric, value, quality, source)
                SELECT datetime('now', '-' || (n % 3600) || ' seconds'), {0}, {1}, {2}, 50.0, 'good', 'test'
                FROM numbers
                """,
                tenantId,
                deviceId,
                "temperature");
        }

        _selectCommandCounter.Reset();
        var service = _sp.GetRequiredService<DataQualityService>();
        var report = await service.CalculateReportAsync(tenantId, deviceId, "temperature");

        report.Should().NotBeNull();
        report!.SampleCount.Should().Be(10005, "报告的完整性维度仍应基于时间窗口内的完整样本总数");
        _selectCommandCounter.HasLimitedTelemetryQuery.Should().BeTrue(
            "质量统计只能将最近一万条遥测加载到应用层，避免高频设备造成内存峰值");
    }

    /// <summary>记录质量评估查询，锁定高频遥测统计必须带数据库 LIMIT。</summary>
    private sealed class TelemetrySelectCommandCounter : DbCommandInterceptor
    {
        private int _limitedTelemetryQueryCount;

        public bool HasLimitedTelemetryQuery => Volatile.Read(ref _limitedTelemetryQueryCount) > 0;

        public void Reset() => Interlocked.Exchange(ref _limitedTelemetryQueryCount, 0);

        public override InterceptionResult<DbDataReader> ReaderExecuting(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result)
        {
            CountLimitedTelemetryQuery(command);
            return result;
        }

        public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result,
            CancellationToken cancellationToken = default)
        {
            CountLimitedTelemetryQuery(command);
            return ValueTask.FromResult(result);
        }

        private void CountLimitedTelemetryQuery(DbCommand command)
        {
            var sql = command.CommandText;
            if (sql.Contains("device_telemetry", StringComparison.OrdinalIgnoreCase)
                && sql.Contains("LIMIT", StringComparison.OrdinalIgnoreCase))
            {
                Interlocked.Increment(ref _limitedTelemetryQueryCount);
            }
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
