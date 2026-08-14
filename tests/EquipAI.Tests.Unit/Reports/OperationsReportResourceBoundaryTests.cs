using System.Data.Common;
using EquipAI.Application.Analysis;
using EquipAI.Application.Reports;
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
using Moq;

namespace EquipAI.Tests.Unit.Reports;

/// <summary>
/// 运营报表资源边界回归测试。
///
/// 报表只输出统计结果和最低健康度排名，不应把告警、工单和全部设备实体加载到应用内存。
/// </summary>
public sealed class OperationsReportResourceBoundaryTests : IAsyncLifetime
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly ReportCommandCounter _commandCounter = new();
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
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(_tenantId));
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
    public async Task GenerateReportAsync_告警和工单统计应在数据库侧聚合()
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var now = new DateTime(2026, 1, 15, 10, 0, 0, DateTimeKind.Utc);

        db.Alerts.AddRange(
            new Alert
            {
                TenantId = _tenantId,
                AlertCode = "AL-1",
                DeviceId = Guid.NewGuid(),
                Metric = "temperature",
                Severity = AlertSeverity.High,
                Status = AlertStatus.Active,
                OccurredAt = now,
            },
            new Alert
            {
                TenantId = _tenantId,
                AlertCode = "AL-2",
                DeviceId = Guid.NewGuid(),
                Metric = "pressure",
                Severity = AlertSeverity.Critical,
                Status = AlertStatus.Resolved,
                OccurredAt = now,
            });
        db.WorkOrders.Add(new WorkOrder
        {
            TenantId = _tenantId,
            WorkOrderCode = "WO-1",
            Title = "测试工单",
            DeviceId = Guid.NewGuid(),
            Type = WorkOrderType.Corrective,
            Priority = WorkOrderPriority.Medium,
            Status = WorkOrderStatus.Closed,
            CreatedAt = now,
            CreatedBy = Guid.NewGuid(),
        });
        await db.SaveChangesAsync();

        var oeeService = new Mock<OeeService>(
            db,
            Mock.Of<ILogger<OeeService>>()).Object;
        var reportService = new OperationsReportService(
            db,
            oeeService,
            Mock.Of<ILogger<OperationsReportService>>());

        _commandCounter.Reset();
        var content = await reportService.GenerateReportAsync(
            _tenantId,
            new DateTime(2026, 1, 1),
            new DateTime(2026, 1, 31));

        content.Should().NotBeEmpty();
        _commandCounter.GetCommandsForTable("alerts")
            .Should().NotBeEmpty()
            .And.AllSatisfy(sql => sql.Should().Contain("GROUP BY", "告警统计和指标分布都应由数据库聚合"));
        _commandCounter.GetCommandsForTable("work_orders")
            .Should().NotBeEmpty()
            .And.AllSatisfy(sql => sql.Should().Contain("GROUP BY", "工单统计不应把窗口内实体全部加载到应用内存"));
        _commandCounter.GetCommandsForTable("devices")
            .Should().NotBeEmpty()
            .And.Contain(sql => sql.Contains("GROUP BY", StringComparison.OrdinalIgnoreCase),
                "设备概览应由数据库计算汇总指标")
            .And.Contain(sql => sql.Contains("LIMIT", StringComparison.OrdinalIgnoreCase),
                "设备排名只允许读取有限数量的设备");
    }

    /// <summary>按表记录 SELECT SQL，防止报表统计回退为原始实体全量读取。</summary>
    private sealed class ReportCommandCounter : DbCommandInterceptor
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

    private sealed class TestTenantContext(Guid tenantId) : ITenantContext
    {
        public Guid TenantId { get; } = tenantId;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
