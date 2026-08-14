using System.Data.Common;
using EquipAI.Application.Alerts;
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

namespace EquipAI.Tests.Unit.Alerts;

/// <summary>
/// 告警规则评估资源边界回归测试。
/// </summary>
public sealed class AlertEvaluationResourceBoundaryTests : IAsyncLifetime
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly Guid _deviceId = Guid.NewGuid();
    private readonly RuleQueryInterceptor _queryInterceptor = new();
    private readonly Mock<IAlertRuleEvaluator> _evaluatorMock = new();
    private readonly Mock<IAlertAggregator> _aggregatorMock = new();
    private readonly Mock<IEventBus> _eventBusMock = new();
    private SqliteConnection _connection = null!;
    private ServiceProvider _serviceProvider = null!;

    /// <inheritdoc />
    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();

        _evaluatorMock.SetupGet(evaluator => evaluator.RuleType).Returns(RuleType.Threshold);
        _evaluatorMock.Setup(evaluator => evaluator.Evaluate(
                It.IsAny<double>(), It.IsAny<AlertRule>(), It.IsAny<DeviceContext>()))
            .Returns(false);

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options => options
            .UseSqlite(_connection)
            .AddInterceptors(_queryInterceptor));
        services.AddSingleton<ITenantContext>(new TestTenantContext(_tenantId));
        services.AddSingleton(_eventBusMock.Object);
        services.AddSingleton(_aggregatorMock.Object);
        services.AddSingleton(_evaluatorMock.Object);
        services.AddLogging();
        services.AddScoped<AlertEvaluationService>();
        _serviceProvider = services.BuildServiceProvider();

        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();

        db.Tenants.Add(new Tenant
        {
            Id = _tenantId,
            Name = "告警评估资源边界租户",
            Slug = $"alert-evaluation-{_tenantId:N}"[..24],
            Plan = TenantPlan.Professional,
            MaxDevices = 5000,
            MaxUsers = 5000,
        });
        db.Devices.Add(new Device
        {
            Id = _deviceId,
            TenantId = _tenantId,
            DeviceCode = "ALERT-RESOURCE-DEVICE",
            Name = "告警评估资源边界设备",
            Type = "电机",
            Status = DeviceStatus.Offline,
        });
        db.AlertRules.AddRange(Enumerable.Range(0, 501).Select(index => new AlertRule
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantId,
            Name = $"资源边界规则-{index:D4}",
            Metric = "temperature",
            RuleType = RuleType.Threshold,
            Severity = AlertSeverity.High,
            Operator = ">",
            Threshold = 90m,
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
    /// 超过单批大小的规则应由数据库分批返回，且 501 条规则不能因分页边界漏评估。
    /// </summary>
    [Fact]
    public async Task 规则评估_超过单批大小时应限制每批查询并完整评估()
    {
        _queryInterceptor.Reset();

        using var scope = _serviceProvider.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<AlertEvaluationService>();

        await service.EvaluateForDeviceAsync(
            _tenantId,
            _deviceId,
            "电机",
            "temperature",
            50d,
            new DeviceContext());

        _evaluatorMock.Verify(
            evaluator => evaluator.Evaluate(
                It.IsAny<double>(), It.IsAny<AlertRule>(), It.IsAny<DeviceContext>()),
            Times.Exactly(501));

        var ruleSelects = _queryInterceptor.GetRuleSelects();
        ruleSelects.Should().HaveCount(2, "501 条规则应跨越 500 条批次边界并触发两次数据库读取");
        ruleSelects.Should().OnlyContain(sql => sql.Contains("LIMIT", StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// 记录规则查询 SQL，验证规则表读取存在数据库侧行数上限。
    /// </summary>
    private sealed class RuleQueryInterceptor : DbCommandInterceptor
    {
        private readonly object _gate = new();
        private List<string> _commands = [];

        /// <summary>
        /// 清除建表和种子阶段产生的 SQL 记录。
        /// </summary>
        public void Reset()
        {
            lock (_gate)
            {
                _commands = [];
            }
        }

        /// <summary>
        /// 获取告警规则表的查询命令。
        /// </summary>
        public IReadOnlyList<string> GetRuleSelects()
        {
            lock (_gate)
            {
                return _commands
                    .Where(sql => sql.Contains("alert_rules", StringComparison.OrdinalIgnoreCase))
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

        /// <summary>
        /// 仅记录查询命令，忽略建表、插入和更新命令。
        /// </summary>
        private void Record(DbCommand command)
        {
            var sql = command.CommandText.TrimStart();
            if (!sql.StartsWith("SELECT", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            lock (_gate)
            {
                _commands.Add(command.CommandText);
            }
        }
    }

    /// <summary>
    /// 固定测试租户上下文。
    /// </summary>
    private sealed class TestTenantContext(Guid tenantId) : ITenantContext
    {
        /// <summary>
        /// 当前租户 ID。
        /// </summary>
        public Guid TenantId { get; } = tenantId;

        /// <summary>
        /// 当前租户隔离模式。
        /// </summary>
        public string IsolationMode => "Shared";

        /// <summary>
        /// 是否为系统管理员。
        /// </summary>
        public bool IsSystemAdmin => false;

        /// <summary>
        /// 当前用户 ID。
        /// </summary>
        public Guid UserId => Guid.Empty;
    }
}
