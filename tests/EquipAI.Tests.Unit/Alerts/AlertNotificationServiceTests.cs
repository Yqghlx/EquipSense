using EquipAI.Application.Alerts;
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
/// AlertNotificationService 单元测试
/// 验证告警多渠道通知的关键行为：
/// - Critical/High 告警触发机器人推送
/// - Low/Normal 告警不推送机器人（但仍持久化站内通知）
/// - 站内通知按运维角色分发（SystemAdmin/MaintenanceLead/Technician）
/// - 集成配置未配置时不报错
/// </summary>
public class AlertNotificationServiceTests
{
    private static async Task<(AppDbContext db, AlertNotificationService svc)> CreateAsync(
        Func<AppDbContext, Task>? seed = null)
    {
        var dbName = Guid.NewGuid().ToString();
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(dbName));
        services.AddLogging();
        services.AddHttpClient("AlertIntegration");
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(Guid.Empty));
        var sp = services.BuildServiceProvider();
        var db = sp.GetRequiredService<AppDbContext>();

        if (seed is not null)
            await seed(db);

        var svc = new AlertNotificationService(
            sp.GetRequiredService<IServiceScopeFactory>(),
            sp.GetRequiredService<IHttpClientFactory>(),
            Mock.Of<ILogger<AlertNotificationService>>());
        return (db, svc);
    }

    private static AlertTriggeredEvent MakeEvent(Guid alertId, Guid tenantId, string severity = "Critical") => new(
        EventId: Guid.NewGuid(),
        OccurredAt: DateTime.UtcNow,
        TenantId: tenantId,
        AlertId: alertId,
        DeviceId: Guid.NewGuid(),
        RuleId: null,
        Metric: "oil_temperature",
        Value: 95.0,
        Severity: severity);

    private static Alert MakeAlert(Guid id, Guid tenantId) => new()
    {
        Id = id,
        TenantId = tenantId,
        DeviceId = Guid.NewGuid(),
        Severity = AlertSeverity.Critical,
        Status = AlertStatus.Active,
        Metric = "oil_temperature",
        Message = "test",
        AlertCode = "ALT-001",
        OccurredAt = DateTime.UtcNow,
    };

    [Fact]
    public async Task Should_Persist_InApp_Notification_For_Operations_Roles()
    {
        var tenantId = Guid.Empty;
        var alertId = Guid.NewGuid();
        var (db, svc) = await CreateAsync(async ctx =>
        {
            // 3 个运维角色用户 + 1 个观察者（不应收到）
            await ctx.Users.AddRangeAsync(
                new User { Id = Guid.NewGuid(), TenantId = tenantId, Role = UserRole.SystemAdmin, Username = "a", DisplayName = "A", PasswordHash = "x" },
                new User { Id = Guid.NewGuid(), TenantId = tenantId, Role = UserRole.MaintenanceLead, Username = "b", DisplayName = "B", PasswordHash = "x" },
                new User { Id = Guid.NewGuid(), TenantId = tenantId, Role = UserRole.Technician, Username = "c", DisplayName = "C", PasswordHash = "x" },
                new User { Id = Guid.NewGuid(), TenantId = tenantId, Role = UserRole.Viewer, Username = "d", DisplayName = "D", PasswordHash = "x" }
            );
            await ctx.SaveChangesAsync();
        });

        await svc.DispatchAsync(MakeEvent(alertId, tenantId), MakeAlert(alertId, tenantId));

        var notifications = await db.Notifications.ToListAsync();
        notifications.Should().HaveCount(3, "仅 SystemAdmin/MaintenanceLead/Technician 应收到告警通知");
        notifications.All(n => n.Type == "alert").Should().BeTrue();
        notifications.All(n => n.RelatedId == alertId).Should().BeTrue();
    }

    [Theory]
    [InlineData("Low")]
    [InlineData("Normal")]
    public async Task Low_Severity_Should_Still_Persist_InApp_Notification(string severity)
    {
        var alertId = Guid.NewGuid();
        var tenantId = Guid.Empty;
        var (db, svc) = await CreateAsync(async ctx =>
        {
            await ctx.Users.AddAsync(new User
            {
                Id = Guid.NewGuid(), TenantId = tenantId, Role = UserRole.SystemAdmin,
                Username = "a", DisplayName = "A", PasswordHash = "x",
            });
            await ctx.SaveChangesAsync();
        });

        await svc.DispatchAsync(MakeEvent(alertId, tenantId, severity), MakeAlert(alertId, tenantId));

        var notifications = await db.Notifications.ToListAsync();
        // 低级别仍应持久化站内通知（机器人不推送是另一回事）
        notifications.Should().HaveCount(1);
    }

    [Fact]
    public async Task No_Integration_Config_Should_Not_Throw()
    {
        var alertId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var (db, svc) = await CreateAsync();

        // 租户无 integrations 配置，不应抛异常（机器人推送被跳过）
        var act = async () => await svc.DispatchAsync(MakeEvent(alertId, tenantId, "Critical"), MakeAlert(alertId, tenantId));
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task Notification_Content_Should_Include_Metric_And_Value()
    {
        var alertId = Guid.NewGuid();
        var tenantId = Guid.Empty;
        var (db, svc) = await CreateAsync(async ctx =>
        {
            await ctx.Users.AddAsync(new User
            {
                Id = Guid.NewGuid(), TenantId = tenantId, Role = UserRole.SystemAdmin,
                Username = "a", DisplayName = "A", PasswordHash = "x",
            });
            await ctx.SaveChangesAsync();
        });

        await svc.DispatchAsync(MakeEvent(alertId, tenantId, "High"), MakeAlert(alertId, tenantId));

        var n = await db.Notifications.FirstAsync();
        n.Content.Should().Contain("oil_temperature");
        n.Content.Should().Contain("95");
        n.Title.Should().Contain("oil_temperature");
    }

    private sealed class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode => "Database";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
