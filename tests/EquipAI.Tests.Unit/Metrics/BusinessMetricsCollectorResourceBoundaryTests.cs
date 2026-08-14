using System.Data.Common;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Tests.Unit.TestHelpers;
using EquipAI.WebAPI.Metrics;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace EquipAI.Tests.Unit.Metrics;

/// <summary>
/// 业务指标采集资源边界回归测试。
/// 每 30 秒执行一次的采集任务只能接收有限的分组摘要，不应把所有告警和工单原始行加载到应用内存。
/// </summary>
public sealed class BusinessMetricsCollectorResourceBoundaryTests : IAsyncLifetime
{
    private readonly SelectCommandCounter _commandCounter = new();
    private SqliteConnection _connection = null!;
    private ServiceProvider _serviceProvider = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options => options
            .UseSqlite(_connection)
            .AddInterceptors(_commandCounter));
        services.AddScoped<ITenantContext>(_ => new BackgroundTenantContext());
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
    public async Task 采集业务指标应由数据库按标签聚合而不是读取原始告警和工单()
    {
        var tenantId = Guid.NewGuid();
        var deviceId = Guid.NewGuid();

        using (var scope = _serviceProvider.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Alerts.Add(new Alert
            {
                TenantId = tenantId,
                DeviceId = deviceId,
                AlertCode = "ALT-METRICS-001",
                Metric = "temperature",
                Severity = AlertSeverity.High,
                Status = AlertStatus.Active,
                Value = 90,
                OccurredAt = DateTime.UtcNow,
            });
            db.WorkOrders.Add(new WorkOrder
            {
                TenantId = tenantId,
                DeviceId = deviceId,
                WorkOrderCode = "WO-METRICS-001",
                Title = "指标采集测试工单",
                Type = WorkOrderType.Corrective,
                Status = WorkOrderStatus.InProgress,
                Priority = WorkOrderPriority.High,
                CreatedAt = DateTime.UtcNow,
            });
            await db.SaveChangesAsync();
        }

        var collector = new TestableBusinessMetricsCollector(
            _serviceProvider.GetRequiredService<IServiceScopeFactory>());

        _commandCounter.Reset();
        await collector.RunOnceAsync();

        _commandCounter.GetCommandsForTable("alerts")
            .Should().NotBeEmpty()
            .And.AllSatisfy(sql => sql.Should().Contain("GROUP BY", "活跃告警指标不应读取全部告警原始行"));
        _commandCounter.GetCommandsForTable("work_orders")
            .Should().NotBeEmpty()
            .And.AllSatisfy(sql => sql.Should().Contain("GROUP BY", "工单指标不应读取全部工单原始行"));
    }

    [Fact]
    public async Task 采集任务应传播停机取消令牌()
    {
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();

        var collector = new TestableBusinessMetricsCollector(
            _serviceProvider.GetRequiredService<IServiceScopeFactory>());

        var act = () => collector.RunOnceAsync(cancellation.Token);

        await act.Should().ThrowAsync<OperationCanceledException>(
            "后台服务停机时不应继续执行不带取消的数据库查询");
    }

    /// <summary>公开后台任务的单次执行入口，测试真实采集逻辑而不启动周期循环。</summary>
    private sealed class TestableBusinessMetricsCollector : BusinessMetricsCollector
    {
        public TestableBusinessMetricsCollector(IServiceScopeFactory scopeFactory)
            : base(
                scopeFactory,
                new AlwaysAcquireLockProvider(),
                NullLogger<BusinessMetricsCollector>.Instance)
        {
        }

        public Task RunOnceAsync(CancellationToken ct = default) => ExecuteWorkAsync(ct);
    }

    /// <summary>记录采集任务涉及的 SELECT SQL，防止未来退化为原始行读取。</summary>
    private sealed class SelectCommandCounter : DbCommandInterceptor
    {
        private readonly object _gate = new();
        private List<string> _commands = [];

        public void Reset()
        {
            lock (_gate)
            {
                _commands = [];
            }
        }

        public IReadOnlyList<string> GetCommandsForTable(string table)
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
            {
                _commands.Add(command.CommandText);
            }
        }
    }

    private sealed class BackgroundTenantContext : ITenantContext
    {
        public Guid TenantId => Guid.Empty;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
