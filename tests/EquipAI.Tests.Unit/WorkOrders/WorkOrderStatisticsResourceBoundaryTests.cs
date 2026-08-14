using System.Data.Common;
using EquipAI.Application.WorkOrders;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;

namespace EquipAI.Tests.Unit.WorkOrders;

/// <summary>
/// 工单统计资源边界回归测试。
/// 工单统计只需要有限的分布、趋势和聚合指标，不应把统计周期内的原始工单行加载到应用内存。
/// </summary>
public sealed class WorkOrderStatisticsResourceBoundaryTests : IAsyncLifetime
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly WorkOrderCommandCounter _commandCounter = new();
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
    public async Task GetStatisticsAsync_统计周期内的工单应由数据库聚合()
    {
        var now = DateTime.UtcNow;
        var deviceId = Guid.NewGuid();
        _db.Tenants.Add(new Tenant
        {
            Id = _tenantId,
            Name = "测试租户",
            Slug = "work-order-resource-boundary",
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
        _db.WorkOrders.Add(new WorkOrder
        {
            TenantId = _tenantId,
            DeviceId = deviceId,
            WorkOrderCode = "WO-001",
            Title = "测试工单",
            Type = WorkOrderType.Corrective,
            Priority = WorkOrderPriority.High,
            Status = WorkOrderStatus.Closed,
            CreatedAt = now.AddDays(-1),
            CompletedAt = now,
            DueDate = now.AddHours(1),
        });
        await _db.SaveChangesAsync();

        var service = new WorkOrderStatisticsService(
            _db,
            LoggerFactory.Create(_ => { }).CreateLogger<WorkOrderStatisticsService>());

        _commandCounter.Reset();
        var result = await service.GetStatisticsAsync(_tenantId, 7);

        result.Total.Should().Be(1);
        result.ByStatus.Should().ContainSingle(item => item.Key == "Closed" && item.Value == 1);
        result.CreatedTrend.Sum(point => point.Count).Should().Be(1);
        result.CompletedTrend.Sum(point => point.Count).Should().Be(1);
        result.AvgCompletionHoursByPriority["High"].Should().BeApproximately(24, 0.1);
        result.SlaRateByPriority["High"].Should().Be(100);
        _commandCounter.GetCommandsForTable("work_orders")
            .Should().NotBeEmpty()
            .And.AllSatisfy(sql => sql.Should().Contain("GROUP BY", "工单统计不应读取统计周期内的原始工单行"));
    }

    /// <summary>记录 SELECT SQL，防止统计查询退化为原始实体全量读取。</summary>
    private sealed class WorkOrderCommandCounter : DbCommandInterceptor
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
