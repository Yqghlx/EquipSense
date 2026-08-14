using System.Data.Common;
using AutoMapper;
using EquipAI.Application.Mapping;
using EquipAI.Application.Services;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Tests.Unit.Services;

/// <summary>
/// 设备删除关联清理的资源边界回归测试。
/// 删除设备不能把该设备的全部告警、网关关联和规则实体一次性加载到应用内存。
/// </summary>
public sealed class DeviceServiceResourceBoundaryTests : IAsyncLifetime
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly Guid _deviceId = Guid.NewGuid();
    private readonly DeleteCommandCounter _commandCounter = new();
    private SqliteConnection _connection = null!;
    private ServiceProvider _serviceProvider = null!;

    /// <inheritdoc />
    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options => options
            .UseSqlite(_connection)
            .AddInterceptors(_commandCounter));
        services.AddSingleton<ITenantContext>(new TestTenantContext(_tenantId));
        services.AddSingleton<IMapper>(_ => new Mapper(new MapperConfiguration(
            configuration => configuration.AddProfile<MappingProfile>(),
            Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance)));
        services.AddSingleton<IAuditLogService, NoopAuditLogService>();
        services.AddLogging();
        services.AddScoped<DeviceService>();
        _serviceProvider = services.BuildServiceProvider();

        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();

        db.Tenants.Add(new Tenant
        {
            Id = _tenantId,
            Name = "资源边界测试租户",
            Slug = $"resource-{_tenantId:N}"[..16],
            Plan = TenantPlan.Professional,
            CurrentDeviceCount = 1,
            MaxDevices = 5000,
        });
        db.Devices.Add(new Device
        {
            Id = _deviceId,
            TenantId = _tenantId,
            DeviceCode = "RESOURCE-DEVICE",
            Name = "资源边界测试设备",
            Type = "电机",
            Status = DeviceStatus.Offline,
        });
        db.Alerts.AddRange(Enumerable.Range(0, 501).Select(index => new Alert
        {
            TenantId = _tenantId,
            DeviceId = _deviceId,
            AlertCode = $"RESOURCE-ALERT-{index:D4}",
            Metric = "temperature",
            Severity = AlertSeverity.High,
            Status = AlertStatus.Active,
            Value = 100,
            OccurredAt = DateTime.UtcNow.AddMinutes(-index),
        }));
        db.GatewayDevices.AddRange(Enumerable.Range(0, 501).Select(index => new GatewayDevice
        {
            TenantId = _tenantId,
            GatewayId = $"resource-gateway-{index:D4}",
            DeviceId = _deviceId,
            DeviceName = "资源边界测试设备",
            Protocol = "mqtt",
        }));
        db.AlertRules.AddRange(Enumerable.Range(0, 501).Select(index => new AlertRule
        {
            TenantId = _tenantId,
            DeviceId = _deviceId,
            Name = $"资源边界规则-{index:D4}",
            Metric = "temperature",
            RuleType = RuleType.Threshold,
            Enabled = true,
        }));
        await db.SaveChangesAsync();
    }

    /// <inheritdoc />
    public async Task DisposeAsync()
    {
        await _serviceProvider.DisposeAsync();
        await _connection.DisposeAsync();
    }

    /// <summary>
    /// 删除关联数据应使用数据库批量语句，避免 501 条关联进入应用内存后再逐条处理。
    /// </summary>
    [Fact]
    public async Task DeleteDeviceAsync_大量关联数据应在数据库侧批量清理()
    {
        using (var scope = _serviceProvider.CreateScope())
        {
            _commandCounter.Reset();
            var service = scope.ServiceProvider.GetRequiredService<DeviceService>();

            await service.DeleteDeviceAsync(_deviceId, _tenantId);
        }

        _commandCounter.GetSelectsForTable("alerts")
            .Should().BeEmpty("活跃告警应由数据库批量更新，不能把整批告警加载到应用内存");
        _commandCounter.GetSelectsForTable("gateway_devices")
            .Should().BeEmpty("网关关联应由数据库批量删除，不能把整批关联加载到应用内存");
        _commandCounter.GetSelectsForTable("alert_rules")
            .Should().BeEmpty("设备规则应由数据库批量删除，不能把整批规则加载到应用内存");

        using var assertScope = _serviceProvider.CreateScope();
        var db = assertScope.ServiceProvider.GetRequiredService<AppDbContext>();
        (await db.Alerts.CountAsync(alert => alert.DeviceId == _deviceId
                && alert.Status == AlertStatus.Resolved
                && alert.Resolution == "设备已删除，自动归档活跃告警"))
            .Should().Be(501);
        (await db.GatewayDevices.CountAsync(link => link.DeviceId == _deviceId)).Should().Be(0);
        (await db.AlertRules.CountAsync(rule => rule.DeviceId == _deviceId)).Should().Be(0);
        (await db.Devices.AnyAsync(device => device.Id == _deviceId)).Should().BeFalse();
    }

    /// <summary>记录删除操作期间的 SELECT，防止关联清理退化为实体全量读取。</summary>
    private sealed class DeleteCommandCounter : DbCommandInterceptor
    {
        private readonly object _gate = new();
        private List<string> _commands = [];

        /// <summary>清空本次操作之前的建表和种子 SQL 记录。</summary>
        public void Reset()
        {
            lock (_gate)
            {
                _commands = [];
            }
        }

        /// <summary>获取包含指定表名的 SELECT SQL。</summary>
        public IReadOnlyList<string> GetSelectsForTable(string table)
        {
            lock (_gate)
            {
                return _commands
                    .Where(sql => sql.Contains(table, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }
        }

        /// <inheritdoc />
        public override InterceptionResult<DbDataReader> ReaderExecuting(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result)
        {
            Record(command);
            return result;
        }

        /// <inheritdoc />
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
            {
                return;
            }

            lock (_gate)
            {
                _commands.Add(command.CommandText);
            }
        }
    }

    /// <summary>固定当前租户，模拟生产请求上下文。</summary>
    private sealed class TestTenantContext(Guid tenantId) : ITenantContext
    {
        public Guid TenantId { get; } = tenantId;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }

    /// <summary>删除测试不关注审计落库，只满足服务依赖。</summary>
    private sealed class NoopAuditLogService : IAuditLogService
    {
        public Task LogAsync(
            Guid tenantId,
            string action,
            string resourceType,
            string? resourceId = null,
            string? description = null,
            CancellationToken ct = default) => Task.CompletedTask;

        public Task LogFromContextAsync(
            string action,
            string resourceType,
            string? resourceId = null,
            string? description = null,
            CancellationToken ct = default) => Task.CompletedTask;

        public Task<PagedResult<AuditLogDto>> GetAuditLogsAsync(
            Guid tenantId,
            int page = 1,
            int pageSize = 20,
            CancellationToken ct = default,
            string? action = null,
            string? resourceType = null) =>
            throw new NotSupportedException("资源边界测试不读取审计日志");
    }
}
