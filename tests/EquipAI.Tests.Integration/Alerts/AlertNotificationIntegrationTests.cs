using EquipAI.Application.Alerts;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Infrastructure.Data;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace EquipAI.Tests.Integration.Alerts;

/// <summary>
/// 告警通知与邮件任务的关系型数据库集成测试。
/// </summary>
[Collection("SharedFactory")]
public sealed class AlertNotificationIntegrationTests
{
    private readonly CustomWebApplicationFactory _factory;

    public AlertNotificationIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Alert_Notification_And_Email_Delivery_Should_Be_Visible_After_One_Save()
    {
        await _factory.CreateClientWithSeedAsync();
        var tenantId = Guid.Empty;
        var alertId = Guid.NewGuid();
        var deviceId = Guid.NewGuid();
        var leadId = Guid.Empty;

        using (var seedScope = _factory.Services.CreateScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
            var lead = await db.UnfilteredSet<User>()
                .SingleAsync(user => user.Username == "lead");
            tenantId = lead.TenantId;
            leadId = lead.Id;
            lead.Email = "integration-lead@example.com";
            lead.NotificationPrefs = "{\"alert\":{\"email\":true}}";

            // 保持测试数据只属于当前租户，避免把其他租户设备信息带入通知内容。
            db.Devices.Add(new Device
            {
                Id = deviceId,
                TenantId = tenantId,
                DeviceCode = $"INTEGRATION-{Guid.NewGuid():N}",
                Name = "集成测试设备",
                Type = "泵",
            });
            await db.SaveChangesAsync();
        }

        using (var dispatchScope = _factory.Services.CreateScope())
        {
            var service = dispatchScope.ServiceProvider.GetRequiredService<AlertNotificationService>();
            var alert = new Alert
            {
                Id = alertId,
                TenantId = tenantId,
                DeviceId = deviceId,
                Severity = AlertSeverity.High,
                Status = AlertStatus.Active,
                Metric = "oil_temperature",
                AlertCode = "INTEGRATION-EMAIL",
                Message = "集成测试告警",
                OccurredAt = DateTime.UtcNow,
            };
            var @event = new AlertTriggeredEvent(
                EventId: Guid.NewGuid(),
                OccurredAt: DateTime.UtcNow,
                TenantId: tenantId,
                AlertId: alertId,
                DeviceId: deviceId,
                RuleId: null,
                Metric: "oil_temperature",
                Value: 95,
                Severity: "High");

            await service.DispatchAsync(@event, alert);
        }

        using var assertScope = _factory.Services.CreateScope();
        var assertDb = assertScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var notifications = await assertDb.UnfilteredSet<Notification>()
            .Where(item => item.TenantId == tenantId && item.RelatedId == alertId)
            .ToListAsync();
        var deliveries = await assertDb.UnfilteredSet<EmailNotificationDelivery>()
            .Where(item => item.TenantId == tenantId)
            .Join(
                assertDb.UnfilteredSet<Notification>(),
                delivery => delivery.NotificationId,
                notification => notification.Id,
                (delivery, notification) => new { delivery, notification })
            .Where(item => item.notification.RelatedId == alertId)
            .ToListAsync();

        notifications.Should().Contain(item => item.UserId == leadId);
        deliveries.Should().ContainSingle();
        deliveries[0].delivery.UserId.Should().Be(leadId);
        deliveries[0].delivery.Status.Should().Be(EmailDeliveryStatus.Pending);
        deliveries[0].delivery.NotificationId.Should().Be(
            notifications.Single(item => item.UserId == leadId).Id);
    }
}
