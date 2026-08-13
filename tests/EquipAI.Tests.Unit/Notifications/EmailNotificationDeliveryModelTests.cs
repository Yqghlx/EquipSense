using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace EquipAI.Tests.Unit.Notifications;

/// <summary>
/// 邮件投递队列实体和 EF 映射回归测试。
/// </summary>
public sealed class EmailNotificationDeliveryModelTests
{
    [Fact]
    public async Task 邮件投递任务应保存默认待处理状态并保留租户与用户绑定()
    {
        var tenantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"EmailDeliveryModel_{Guid.NewGuid():N}")
            .Options;

        await using var db = new AppDbContext(options, new FixedTenantContext(tenantId));
        db.EmailNotificationDeliveries.Add(new EmailNotificationDelivery
        {
            TenantId = tenantId,
            UserId = userId,
            NotificationId = notificationId,
            AvailableAt = DateTime.UtcNow,
        });

        await db.SaveChangesAsync();

        var saved = await db.EmailNotificationDeliveries.SingleAsync();
        saved.Status.Should().Be(EmailDeliveryStatus.Pending);
        saved.TenantId.Should().Be(tenantId);
        saved.UserId.Should().Be(userId);
        saved.NotificationId.Should().Be(notificationId);
        saved.AttemptCount.Should().Be(0);
    }

    [Fact]
    public void 邮件投递任务应为通知ID建立唯一索引并限制错误长度()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"EmailDeliveryModel_{Guid.NewGuid():N}")
            .Options;
        using var db = new AppDbContext(options, new FixedTenantContext(Guid.NewGuid()));

        var entity = db.Model.FindEntityType(typeof(EmailNotificationDelivery));
        entity.Should().NotBeNull();
        entity!.FindProperty(nameof(EmailNotificationDelivery.LastError))!
            .GetMaxLength().Should().Be(2000);
        entity.GetIndexes()
            .Count(index => index.IsUnique
                && index.Properties.Count == 1
                && index.Properties[0].Name == nameof(EmailNotificationDelivery.NotificationId))
            .Should().Be(1);
    }

    /// <summary>
    /// 固定租户上下文，保证模型测试不依赖 HTTP 请求。
    /// </summary>
    private sealed class FixedTenantContext(Guid tenantId) : ITenantContext
    {
        public Guid TenantId { get; } = tenantId;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.NewGuid();
    }
}
