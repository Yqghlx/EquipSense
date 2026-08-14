using System.Data.Common;
using EquipAI.Application.Alerts;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit;

namespace EquipAI.Tests.Unit.Alerts;

/// <summary>
/// 告警通知扇出资源边界回归测试。
/// </summary>
public sealed class AlertNotificationFanoutResourceBoundaryTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private ServiceProvider _serviceProvider = null!;
    private FanoutCommandInterceptor _interceptor = null!;
    private Guid _tenantId;

    public async Task InitializeAsync()
    {
        _tenantId = Guid.NewGuid();
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();
        _interceptor = new FanoutCommandInterceptor();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options => options
            .UseSqlite(_connection)
            .AddInterceptors(_interceptor));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(_tenantId));
        services.AddScoped<EquipAI.Application.Notifications.NotificationPreferenceService>();
        services.AddLogging();
        services.AddHttpClient("AlertIntegration");
        _serviceProvider = services.BuildServiceProvider();

        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();

        db.Tenants.Add(new Tenant
        {
            Id = _tenantId,
            Name = "告警扇出测试租户",
            Slug = $"fanout-{_tenantId:N}",
            Plan = TenantPlan.Professional,
            Status = TenantStatus.Active,
            MaxDevices = 10,
        });

        for (var index = 0; index < 501; index++)
        {
            db.Users.Add(new User
            {
                TenantId = _tenantId,
                Role = UserRole.Technician,
                Username = $"fanout-{index}",
                PasswordHash = "test-hash",
                DisplayName = $"技术员-{index}",
            });
        }

        await db.SaveChangesAsync();
        _interceptor.Clear();
    }

    public async Task DisposeAsync()
    {
        await _serviceProvider.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task DispatchAsync_告警通知扇出应按收件人批次提交()
    {
        var service = new AlertNotificationService(
            _serviceProvider.GetRequiredService<IServiceScopeFactory>(),
            _serviceProvider.GetRequiredService<IHttpClientFactory>(),
            _serviceProvider.GetRequiredService<ILogger<AlertNotificationService>>());
        var alertId = Guid.NewGuid();
        var deviceId = Guid.NewGuid();
        var @event = new AlertTriggeredEvent(
            Guid.NewGuid(),
            DateTime.UtcNow,
            _tenantId,
            alertId,
            deviceId,
            null,
            "temperature",
            95d,
            "Low");
        var alert = new Alert
        {
            Id = alertId,
            TenantId = _tenantId,
            DeviceId = deviceId,
            Metric = "temperature",
            Message = "测试告警",
            AlertCode = "ALT-FANOUT",
            Severity = AlertSeverity.Normal,
            Status = AlertStatus.Active,
            OccurredAt = DateTime.UtcNow,
        };

        await service.DispatchAsync(@event, alert);

        using var verifyScope = _serviceProvider.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<AppDbContext>();
        (await verifyDb.Notifications.IgnoreQueryFilters()
            .CountAsync(notification => notification.TenantId == _tenantId && notification.RelatedId == alertId))
            .Should().Be(501);

        var recipientQueries = _interceptor.SelectSql
            .Where(sql => sql.Contains("\"role\"", StringComparison.OrdinalIgnoreCase)
                && sql.Contains("users", StringComparison.OrdinalIgnoreCase))
            .ToList();
        recipientQueries.Should().HaveCountGreaterThanOrEqualTo(2,
            "501 个收件人必须分成至少两批读取");
        recipientQueries.Should().OnlyContain(sql =>
            sql.Contains("LIMIT", StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>记录收件人查询 SQL。</summary>
    private sealed class FanoutCommandInterceptor : DbCommandInterceptor
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
