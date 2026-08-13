using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Messaging;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace EquipAI.Tests.Unit.Notifications;

/// <summary>
/// 邮件队列租约和状态更新测试。
/// 使用 SQLite 验证生产关系型数据库需要的 ExecuteUpdate 原子条件。
/// </summary>
public sealed class EmailNotificationDeliveryStoreTests : IAsyncLifetime
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private SqliteConnection _connection = null!;
    private AppDbContext _db = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        await _connection.OpenAsync();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;
        _db = new AppDbContext(options, new FixedTenantContext(_tenantId));
        await _db.Database.EnsureCreatedAsync();
    }

    [Fact]
    public async Task 同一任务只能被一个竞争者领取()
    {
        var delivery = await AddDeliveryAsync();
        var store = new EmailNotificationDeliveryStore(_db);
        var now = DateTime.UtcNow;

        var first = await store.TryClaimAsync(_tenantId, delivery.Id, now, TimeSpan.FromMinutes(1));
        var second = await store.TryClaimAsync(_tenantId, delivery.Id, now, TimeSpan.FromMinutes(1));

        first.Should().NotBeNull();
        second.Should().BeNull();
        (await _db.EmailNotificationDeliveries.AsNoTracking().SingleAsync()).AttemptCount.Should().Be(1);
    }

    [Fact]
    public async Task 旧租约不能覆盖新租约的发送结果()
    {
        var delivery = await AddDeliveryAsync();
        var store = new EmailNotificationDeliveryStore(_db);
        var lease = await store.TryClaimAsync(_tenantId, delivery.Id, DateTime.UtcNow, TimeSpan.Zero);
        lease.Should().NotBeNull();

        var staleResult = await store.MarkSentAsync(
            _tenantId,
            delivery.Id,
            Guid.NewGuid(),
            DateTime.UtcNow);

        staleResult.Should().BeFalse();
        (await _db.EmailNotificationDeliveries.AsNoTracking().SingleAsync()).Status
            .Should().Be(EmailDeliveryStatus.Pending);
    }

    [Fact]
    public async Task 只有当前租约持有者可以在SMTP发送前续租()
    {
        var delivery = await AddDeliveryAsync();
        var store = new EmailNotificationDeliveryStore(_db);
        var now = DateTime.UtcNow;
        var lease = await store.TryClaimAsync(_tenantId, delivery.Id, now, TimeSpan.FromSeconds(1));
        lease.Should().NotBeNull();

        var staleRenewed = await store.TryRenewLeaseAsync(
            _tenantId,
            delivery.Id,
            Guid.NewGuid(),
            now.AddSeconds(1),
            TimeSpan.FromMinutes(1));
        var renewed = await store.TryRenewLeaseAsync(
            _tenantId,
            delivery.Id,
            lease!.LockToken,
            now.AddSeconds(1),
            TimeSpan.FromMinutes(1));

        staleRenewed.Should().BeFalse();
        renewed.Should().BeTrue();
        (await _db.EmailNotificationDeliveries.AsNoTracking().SingleAsync()).LockedUntil
            .Should().BeCloseTo(now.AddSeconds(61), TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task 错误租户不能领取或更新邮件任务()
    {
        var delivery = await AddDeliveryAsync();
        var store = new EmailNotificationDeliveryStore(_db);
        var otherTenantId = Guid.NewGuid();

        var lease = await store.TryClaimAsync(
            otherTenantId,
            delivery.Id,
            DateTime.UtcNow,
            TimeSpan.FromMinutes(1));

        lease.Should().BeNull();
        var updated = await store.MarkSentAsync(
            otherTenantId,
            delivery.Id,
            Guid.NewGuid(),
            DateTime.UtcNow);

        updated.Should().BeFalse();
        (await _db.EmailNotificationDeliveries.AsNoTracking().SingleAsync()).Status
            .Should().Be(EmailDeliveryStatus.Pending);
    }

    [Fact]
    public async Task 失败状态应截断错误并支持死信状态()
    {
        var delivery = await AddDeliveryAsync();
        var store = new EmailNotificationDeliveryStore(_db);
        var lease = await store.TryClaimAsync(_tenantId, delivery.Id, DateTime.UtcNow, TimeSpan.FromMinutes(1));
        lease.Should().NotBeNull();

        var result = await store.MarkFailedAsync(
            _tenantId,
            delivery.Id,
            lease!.LockToken,
            DateTime.UtcNow.AddMinutes(5),
            new string('错', 2500),
            deadLetter: true);

        result.Should().BeTrue();
        var saved = await _db.EmailNotificationDeliveries.AsNoTracking().SingleAsync();
        saved.Status.Should().Be(EmailDeliveryStatus.DeadLetter);
        saved.LastError.Should().HaveLength(2000);
        saved.LockToken.Should().BeNull();
    }

    private async Task<EmailNotificationDelivery> AddDeliveryAsync()
    {
        var delivery = new EmailNotificationDelivery
        {
            TenantId = _tenantId,
            UserId = Guid.NewGuid(),
            NotificationId = Guid.NewGuid(),
            AvailableAt = DateTime.UtcNow.AddSeconds(-1),
        };
        _db.EmailNotificationDeliveries.Add(delivery);
        await _db.SaveChangesAsync();
        return delivery;
    }

    public async Task DisposeAsync()
    {
        await _db.DisposeAsync();
        await _connection.DisposeAsync();
    }

    private sealed class FixedTenantContext(Guid tenantId) : ITenantContext
    {
        public Guid TenantId { get; } = tenantId;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.NewGuid();
    }
}
