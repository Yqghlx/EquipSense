using System.Data;
using System.Data.Common;
using EquipAI.Application.Alerts;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Tests.Unit.TestHelpers;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Tests.Unit.Analysis;

/// <summary>
/// 基线计算资源边界回归测试。
/// 基线候选可能随设备和指标数量增长，计算过程不能把所有聚合行加载到应用内存后逐行写库。
/// </summary>
public sealed class BaselineCalculationResourceBoundaryTests : IAsyncLifetime
{
    private readonly BaselineCommandInterceptor _commandInterceptor = new();
    private SqliteConnection _connection = null!;
    private ServiceProvider _serviceProvider = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options => options
            .UseSqlite(_connection)
            .AddInterceptors(_commandInterceptor));
        services.AddScoped<ITenantContext>(_ => new BackgroundTenantContext());
        services.AddLogging();
        _serviceProvider = services.BuildServiceProvider();

        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        await _serviceProvider.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task CalculateBaselinesAsync_应由数据库集合Upsert而不是加载全部聚合结果()
    {
        var service = new BaselineCalculationService(
            _serviceProvider.GetRequiredService<IServiceScopeFactory>(),
            new AlwaysAcquireLockProvider(),
            _serviceProvider.GetRequiredService<ILogger<BaselineCalculationService>>());
        _commandInterceptor.Reset();

        await service.CalculateBaselinesAsync(CancellationToken.None);

        _commandInterceptor.ReaderCount.Should().Be(0,
            "基线候选应在数据库内直接进入 Upsert，应用层不应读取全量聚合结果");
        _commandInterceptor.NonQuerySql.Should().ContainSingle();
        var sql = _commandInterceptor.NonQuerySql.Single().ToUpperInvariant();
        sql.Should().Contain("INSERT INTO METRIC_BASELINES");
        sql.Should().Contain("SELECT");
        sql.Should().Contain("GROUP BY");
        sql.Should().Contain("ON CONFLICT");
    }

    /// <summary>复刻后台任务无 HTTP 上下文时的空租户上下文。</summary>
    private sealed class BackgroundTenantContext : ITenantContext
    {
        public Guid TenantId => Guid.Empty;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }

    /// <summary>
    /// 让 SQLite 测试上下文只验证数据库边界，不执行 PostgreSQL/TimescaleDB 专用 SQL。
    /// 返回空聚合结果会使旧实现提前结束；新实现必须发出一条集合 Upsert 命令，因此能区分两种实现。
    /// </summary>
    private sealed class BaselineCommandInterceptor : DbCommandInterceptor
    {
        private readonly object _gate = new();
        private List<string> _nonQuerySql = [];
        private int _readerCount;

        public int ReaderCount => Volatile.Read(ref _readerCount);

        public IReadOnlyList<string> NonQuerySql
        {
            get
            {
                lock (_gate)
                    return _nonQuerySql.ToArray();
            }
        }

        public void Reset()
        {
            Interlocked.Exchange(ref _readerCount, 0);
            lock (_gate)
                _nonQuerySql = [];
        }

        public override InterceptionResult<DbDataReader> ReaderExecuting(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result)
        {
            Interlocked.Increment(ref _readerCount);
            return InterceptionResult<DbDataReader>.SuppressWithResult(CreateEmptyReader());
        }

        public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result,
            CancellationToken cancellationToken = default)
        {
            Interlocked.Increment(ref _readerCount);
            return ValueTask.FromResult(
                InterceptionResult<DbDataReader>.SuppressWithResult(CreateEmptyReader()));
        }

        public override InterceptionResult<int> NonQueryExecuting(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<int> result)
        {
            RecordNonQuery(command);
            return InterceptionResult<int>.SuppressWithResult(1);
        }

        public override ValueTask<InterceptionResult<int>> NonQueryExecutingAsync(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<int> result,
            CancellationToken cancellationToken = default)
        {
            RecordNonQuery(command);
            return ValueTask.FromResult(InterceptionResult<int>.SuppressWithResult(1));
        }

        private void RecordNonQuery(DbCommand command)
        {
            lock (_gate)
                _nonQuerySql.Add(command.CommandText);
        }

        private static DbDataReader CreateEmptyReader()
        {
            var table = new DataTable();
            table.Columns.Add("TenantId", typeof(Guid));
            table.Columns.Add("DeviceId", typeof(Guid));
            table.Columns.Add("Metric", typeof(string));
            table.Columns.Add("PeriodStart", typeof(DateTime));
            table.Columns.Add("PeriodEnd", typeof(DateTime));
            table.Columns.Add("AvgValue", typeof(double));
            table.Columns.Add("StdDev", typeof(double));
            table.Columns.Add("MinValue", typeof(double));
            table.Columns.Add("MaxValue", typeof(double));
            table.Columns.Add("P95Value", typeof(double));
            table.Columns.Add("SampleCount", typeof(int));
            return table.CreateDataReader();
        }
    }
}
