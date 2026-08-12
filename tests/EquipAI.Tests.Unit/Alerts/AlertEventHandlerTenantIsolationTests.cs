using EquipAI.Application.Alerts;
using EquipAI.Application.Alerts.Handlers;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace EquipAI.Tests.Unit.Alerts;

/// <summary>
/// AlertEventHandler 后台事件租户边界测试。
/// </summary>
public class AlertEventHandlerTenantIsolationTests : IAsyncDisposable
{
    private readonly ServiceProvider _serviceProvider;

    public AlertEventHandlerTenantIsolationTests()
    {
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options =>
            options.UseInMemoryDatabase($"AlertEventHandlerTenantTest_{Guid.NewGuid()}"));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(Guid.Empty));
        services.AddHttpClient("AlertIntegration");
        services.AddLogging();
        _serviceProvider = services.BuildServiceProvider();
    }

    public async ValueTask DisposeAsync()
    {
        await _serviceProvider.DisposeAsync();
    }

    /// <summary>
    /// 告警事件携带的租户与 AlertId 对应告警租户不一致时，不得推送或创建通知。
    ///
    /// Why：后台处理器必须绕过 HTTP 租户过滤器，但 AlertId 仍必须和事件 TenantId 成对校验，
    /// 否则错误事件可以把其他租户的告警编码推送给当前租户，甚至写入当前租户的站内通知。
    /// </summary>
    [Fact]
    public async Task HandleAsync_事件租户与告警租户不一致_不应推送或创建通知()
    {
        var db = _serviceProvider.GetRequiredService<AppDbContext>();
        var alertTenantId = Guid.NewGuid();
        var eventTenantId = Guid.NewGuid();
        var alertId = Guid.NewGuid();
        var deviceId = Guid.NewGuid();

        db.Alerts.Add(new Alert
        {
            Id = alertId,
            TenantId = alertTenantId,
            DeviceId = deviceId,
            AlertCode = "SECRET-TENANT-A-ALERT",
            Severity = AlertSeverity.Critical,
            Status = AlertStatus.Active,
            Metric = "temperature",
            Value = 95m,
            OccurredAt = DateTime.UtcNow,
        });
        db.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            TenantId = eventTenantId,
            Username = "event-tenant-admin",
            DisplayName = "事件租户管理员",
            PasswordHash = "x",
            Role = UserRole.SystemAdmin,
        });
        await db.SaveChangesAsync();
        (await db.Alerts.IgnoreQueryFilters().CountAsync(a => a.Id == alertId))
            .Should().Be(1, "测试必须先确认跨租户告警已写入数据库");

        var signalRMock = new Mock<ISignalRNotificationService>();
        var scopeServiceProviderMock = new Mock<IServiceProvider>();
        scopeServiceProviderMock
            .Setup(provider => provider.GetService(typeof(AppDbContext)))
            .Returns(db);
        var scopeMock = new Mock<IServiceScope>();
        scopeMock.SetupGet(scope => scope.ServiceProvider)
            .Returns(scopeServiceProviderMock.Object);
        var scopeFactoryMock = new Mock<IServiceScopeFactory>();
        scopeFactoryMock.Setup(factory => factory.CreateScope())
            .Returns(scopeMock.Object);
        var alertNotificationService = new AlertNotificationService(
            scopeFactoryMock.Object,
            _serviceProvider.GetRequiredService<IHttpClientFactory>(),
            Mock.Of<ILogger<AlertNotificationService>>());
        var handler = new AlertEventHandler(
            _serviceProvider.GetRequiredService<ILogger<AlertEventHandler>>(),
            signalRMock.Object,
            alertNotificationService,
            scopeFactoryMock.Object);

        var @event = new AlertTriggeredEvent(
            EventId: Guid.NewGuid(),
            OccurredAt: DateTime.UtcNow,
            TenantId: eventTenantId,
            AlertId: alertId,
            DeviceId: deviceId,
            RuleId: null,
            Metric: "temperature",
            Value: 95.0,
            Severity: "Critical");

        await handler.HandleAsync(@event);

        signalRMock.Verify(
            x => x.SendAlertTriggeredAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(),
                It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<double>(),
                It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "事件租户不能读取并推送其他租户告警编码");
        (await db.Notifications.IgnoreQueryFilters().ToListAsync())
            .Should().BeEmpty("跨租户告警事件不能创建当前租户站内通知");
    }

    /// <summary>
    /// 测试用租户上下文，模拟后台消费者没有 HTTP 上下文的默认状态。
    /// </summary>
    private sealed class TestTenantContext(Guid tenantId) : ITenantContext
    {
        public Guid TenantId { get; } = tenantId;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
