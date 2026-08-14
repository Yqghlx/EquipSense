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
/// SLA 服务资源边界回归测试。
/// SLA 扫描与概览是后台高频路径，不应把租户全部活动工单加载到应用内存后再计算。
/// </summary>
public sealed class SlaManagementResourceBoundaryTests : IAsyncLifetime
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
    public async Task GetSummaryAsync_应在数据库聚合而非加载全部活动工单()
    {
        var now = DateTime.UtcNow;
        AddTenant();
        _db.WorkOrders.AddRange(
            CreateWorkOrder(WorkOrderPriority.Critical, WorkOrderStatus.Assigned, now.AddMinutes(-30), "WO-ONTRACK"),
            CreateWorkOrder(WorkOrderPriority.High, WorkOrderStatus.InProgress, now.AddHours(-7), "WO-WARNING"),
            CreateWorkOrder(WorkOrderPriority.Medium, WorkOrderStatus.Assigned, now.AddHours(-30), "WO-OVERDUE"));
        await _db.SaveChangesAsync();

        var service = CreateService();
        _commandCounter.Reset();

        var summary = await service.GetSummaryAsync(_tenantId);

        summary.Total.Should().Be(3);
        summary.OnTrack.Should().Be(1);
        summary.Warning.Should().Be(1);
        summary.Overdue.Should().Be(1);
        _commandCounter.GetSelectsForTable("work_orders")
            .Should().NotBeEmpty()
            .And.Contain(sql => sql.Contains("GROUP BY", StringComparison.OrdinalIgnoreCase),
                "SLA 概览应先在数据库侧按优先级和状态聚合");
    }

    [Fact]
    public async Task CheckAndEscalateAsync_活动工单规模超过批次时应分页读取()
    {
        var now = DateTime.UtcNow;
        AddTenant();
        _db.WorkOrders.AddRange(Enumerable.Range(0, 501).Select(index =>
            CreateWorkOrder(
                WorkOrderPriority.High,
                WorkOrderStatus.Assigned,
                now.AddHours(-1),
                $"WO-{index:D4}")));
        await _db.SaveChangesAsync();

        var service = CreateService();
        _commandCounter.Reset();

        var escalated = await service.CheckAndEscalateAsync(_tenantId);

        escalated.Should().Be(0, "全部工单尚未超时，不应产生升级副作用");
        _commandCounter.GetSelectsForTable("work_orders")
            .Should().NotBeEmpty()
            .And.OnlyContain(sql => sql.Contains("LIMIT", StringComparison.OrdinalIgnoreCase),
                "SLA 扫描不应一次性读取租户全部活动工单");
    }

    private SlaManagementService CreateService() => new(
        _db,
        LoggerFactory.Create(_ => { }).CreateLogger<SlaManagementService>());

    private void AddTenant() => _db.Tenants.Add(new Tenant
    {
        Id = _tenantId,
        Name = "测试租户",
        Slug = "sla-resource-boundary",
    });

    private WorkOrder CreateWorkOrder(
        WorkOrderPriority priority,
        WorkOrderStatus status,
        DateTime createdAt,
        string code) => new()
        {
            TenantId = _tenantId,
            WorkOrderCode = code,
            Title = "资源边界测试工单",
            Type = WorkOrderType.Corrective,
            Status = status,
            Priority = priority,
            DeviceId = Guid.NewGuid(),
            CreatedAt = createdAt,
        };

    /// <summary>记录 SLA 路径发出的 SELECT，防止退化为无界实体读取。</summary>
    private sealed class WorkOrderCommandCounter : DbCommandInterceptor
    {
        private readonly object _gate = new();
        private List<string> _commands = [];

        public void Reset()
        {
            lock (_gate)
                _commands = [];
        }

        public IReadOnlyList<string> GetSelectsForTable(string table)
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
                _commands.Add(command.CommandText);
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
