using System.Data.Common;
using EquipAI.Application.Analysis;
using EquipAI.Application.Dashboard;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;

namespace EquipAI.Tests.Unit.Dashboard;

/// <summary>
/// 仪表盘资源边界回归测试。
/// 仪表盘只需要各状态计数和七天趋势，不应把租户窗口内的告警、工单原始行加载到应用内存。
/// </summary>
public sealed class DashboardStatsResourceBoundaryTests : IAsyncLifetime
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly DashboardCommandCounter _commandCounter = new();
    private SqliteConnection _connection = null!;
    private AppDbContext _db = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .AddInterceptors(_commandCounter)
            .Options;
        _db = new AppDbContext(options, new TestTenantContext(_tenantId));
        await _db.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        await _db.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task GetStatsAsync_统计和趋势应在数据库侧聚合()
    {
        var now = DateTime.UtcNow;
        var deviceId = Guid.NewGuid();
        _db.Tenants.Add(new Tenant
        {
            Id = _tenantId,
            Name = "测试租户",
            Slug = "dashboard-resource-boundary",
        });
        _db.Devices.Add(new Device
        {
            Id = deviceId,
            TenantId = _tenantId,
            DeviceCode = "DEV-001",
            Name = "测试设备",
            Type = "pump",
            Status = DeviceStatus.Online,
        });
        _db.Alerts.Add(new Alert
        {
            TenantId = _tenantId,
            DeviceId = deviceId,
            AlertCode = "AL-001",
            Metric = "temperature",
            Severity = AlertSeverity.High,
            Status = AlertStatus.Active,
            OccurredAt = now,
        });
        _db.WorkOrders.Add(new WorkOrder
        {
            TenantId = _tenantId,
            DeviceId = deviceId,
            WorkOrderCode = "WO-001",
            Title = "测试工单",
            Type = WorkOrderType.Corrective,
            Priority = WorkOrderPriority.Medium,
            Status = WorkOrderStatus.PendingDispatch,
            CreatedAt = now,
        });
        await _db.SaveChangesAsync();

        var service = new DashboardStatsService(
            _db,
            LoggerFactory.Create(_ => { }).CreateLogger<DashboardStatsService>());

        _commandCounter.Reset();
        var result = await service.GetStatsAsync(_tenantId);

        result.ActiveAlerts.Should().Be(1);
        result.PendingWorkOrders.Should().Be(1);
        _commandCounter.GetCommandsForTable("Devices")
            .Should().NotBeEmpty()
            .And.AllSatisfy(sql => sql.Should().Contain("COUNT", "设备统计应由数据库计算计数"));
        _commandCounter.GetCommandsForTable("Alerts")
            .Should().NotBeEmpty()
            .And.AllSatisfy(sql => sql.Should().Contain("COUNT", "告警统计和趋势不应加载原始告警行"));
        _commandCounter.GetCommandsForTable("work_orders")
            .Should().NotBeEmpty()
            .And.AllSatisfy(sql => sql.Should().Contain("COUNT", "工单统计和趋势不应加载原始工单行"));

        var oeeService = new OeeService(
            _db,
            LoggerFactory.Create(_ => { }).CreateLogger<OeeService>());
        _commandCounter.Reset();
        await oeeService.CalculateAsync(_tenantId);
        _commandCounter.GetCommandsForTable("Devices")
            .Should().NotBeEmpty()
            .And.AllSatisfy(sql => sql.Should().Contain("COUNT", "OEE 设备可用率应由数据库聚合"));
    }

    /// <summary>记录 SELECT SQL，防止统计查询退化为原始实体全量读取。</summary>
    private sealed class DashboardCommandCounter : DbCommandInterceptor
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
