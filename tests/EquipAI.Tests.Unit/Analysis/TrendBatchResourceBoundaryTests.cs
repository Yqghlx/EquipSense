using System.Data.Common;
using EquipAI.Application.Analysis;
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
/// 批量趋势分析资源边界回归测试。
/// </summary>
public sealed class TrendBatchResourceBoundaryTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private ServiceProvider _serviceProvider = null!;
    private TrendCommandInterceptor _interceptor = null!;
    private Guid _tenantId;

    public async Task InitializeAsync()
    {
        _tenantId = Guid.NewGuid();
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();
        _interceptor = new TrendCommandInterceptor();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options => options
            .UseSqlite(_connection)
            .AddInterceptors(_interceptor));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(_tenantId));
        services.AddLogging();
        _serviceProvider = services.BuildServiceProvider();

        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();

        var timestamp = DateTime.UtcNow.AddMinutes(-5);
        for (var index = 0; index < 501; index++)
        {
            await db.Database.ExecuteSqlRawAsync(
                "INSERT INTO device_telemetry (time, tenant_id, device_id, metric, value, quality, source) " +
                "VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6})",
                timestamp,
                _tenantId,
                Guid.NewGuid(),
                "temperature",
                50d,
                "good",
                "test");
        }

        _interceptor.Clear();
    }

    public async Task DisposeAsync()
    {
        await _serviceProvider.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task AnalyzeAllTrendsAsync_小时聚合结果应按设备指标排序后流式处理()
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var service = new TrendAnalysisService(
            db,
            scope.ServiceProvider.GetRequiredService<ILogger<TrendAnalysisService>>());

        var result = await service.AnalyzeAllTrendsAsync(_tenantId);

        result.Should().BeEmpty();
        _interceptor.SelectSql.Should().Contain(sql =>
                sql.Contains("GROUP BY", StringComparison.OrdinalIgnoreCase)
                && sql.Contains("ORDER BY", StringComparison.OrdinalIgnoreCase)
                && sql.Contains("device_telemetry", StringComparison.OrdinalIgnoreCase),
            "批量趋势结果应按设备和指标排序，应用层才能只保留当前组合的小时序列");
    }

    /// <summary>记录趋势分析查询 SQL。</summary>
    private sealed class TrendCommandInterceptor : DbCommandInterceptor
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

    /// <summary>固定租户上下文。</summary>
    private sealed class TestTenantContext(Guid tenantId) : ITenantContext
    {
        public Guid TenantId => tenantId;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.NewGuid();
    }
}
