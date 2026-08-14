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
using Xunit;

namespace EquipAI.Tests.Unit.Analysis;

/// <summary>
/// ML 基线统计资源边界回归测试。
/// </summary>
public sealed class MlBaselineResourceBoundaryTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private ServiceProvider _serviceProvider = null!;
    private BaselineCommandInterceptor _interceptor = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();
        _interceptor = new BaselineCommandInterceptor();

        var tenantId = Guid.NewGuid();
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options => options
            .UseSqlite(_connection)
            .AddInterceptors(_interceptor));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(tenantId));
        services.AddLogging();
        _serviceProvider = services.BuildServiceProvider();

        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();

        db.Tenants.Add(new Tenant
        {
            Id = tenantId,
            Name = "基线测试租户",
            Slug = $"baseline-{tenantId:N}",
            Plan = TenantPlan.Professional,
            Status = TenantStatus.Active,
            MaxDevices = 10,
        });
        await db.SaveChangesAsync();

        var deviceId = Guid.NewGuid();
        var baseTime = DateTime.UtcNow.AddHours(-1);
        for (var index = 0; index < 600; index++)
        {
            await db.Database.ExecuteSqlRawAsync(
                "INSERT INTO device_telemetry (time, tenant_id, device_id, metric, value, quality, source) " +
                "VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6})",
                DateTime.SpecifyKind(baseTime.AddSeconds(index), DateTimeKind.Utc),
                tenantId,
                deviceId,
                "temperature",
                50d + index * 0.1d,
                "good",
                "test");
        }

        _interceptor.Clear();
        TestDeviceId = deviceId;
    }

    public async Task DisposeAsync()
    {
        await _serviceProvider.DisposeAsync();
        await _connection.DisposeAsync();
    }

    private Guid TestDeviceId { get; set; }

    [Fact]
    public async Task GetBaselineStatsAsync_应由数据库聚合而不是加载全部遥测值()
    {
        using var scope = _serviceProvider.CreateScope();
        var service = new MlAnomalyDetectionService(
            scope.ServiceProvider.GetRequiredService<IServiceScopeFactory>(),
            scope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Logging.ILogger<MlAnomalyDetectionService>>());

        var result = await service.GetBaselineStatsAsync(TestDeviceId, "temperature");

        result.Should().NotBeNull();
        result!.SampleCount.Should().Be(600);
        _interceptor.SelectSql.Should().Contain(sql => sql.Contains("AVG", StringComparison.OrdinalIgnoreCase));
        _interceptor.SelectSql.Should().Contain(sql => sql.Contains("SUM", StringComparison.OrdinalIgnoreCase));
        _interceptor.SelectSql.Should().Contain(sql => sql.Contains("MIN", StringComparison.OrdinalIgnoreCase));
        _interceptor.SelectSql.Should().Contain(sql => sql.Contains("MAX", StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>记录基线查询 SQL，确保统计列在数据库侧计算。</summary>
    private sealed class BaselineCommandInterceptor : DbCommandInterceptor
    {
        private readonly object _syncRoot = new();
        private readonly List<string> _selectSql = [];

        public IReadOnlyList<string> SelectSql
        {
            get
            {
                lock (_syncRoot)
                {
                    return _selectSql.ToArray();
                }
            }
        }

        public void Clear()
        {
            lock (_syncRoot)
            {
                _selectSql.Clear();
            }
        }

        public override InterceptionResult<DbDataReader> ReaderExecuting(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result)
        {
            Record(command);
            return base.ReaderExecuting(command, eventData, result);
        }

        public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result,
            CancellationToken cancellationToken = default)
        {
            Record(command);
            return base.ReaderExecutingAsync(command, eventData, result, cancellationToken);
        }

        private void Record(DbCommand command)
        {
            if (!command.CommandText.TrimStart().StartsWith("SELECT", StringComparison.OrdinalIgnoreCase))
                return;

            lock (_syncRoot)
            {
                _selectSql.Add(command.CommandText);
            }
        }
    }

    /// <summary>固定租户上下文，复现 HTTP 请求中的全局租户过滤器。</summary>
    private sealed class TestTenantContext(Guid tenantId) : ITenantContext
    {
        public Guid TenantId => tenantId;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.NewGuid();
    }
}
