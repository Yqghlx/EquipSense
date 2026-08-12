using EquipAI.Application.Notifications;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Xunit;

namespace EquipAI.Tests.Unit.Notifications;

/// <summary>
/// PushNotificationService 单元测试
/// 测试订阅注册/注销逻辑（推送发送需要真实 VAPID 密钥和网络连接，不做测试）
/// </summary>
public class PushNotificationServiceTests : IAsyncDisposable
{
    private readonly AppDbContext _db;
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly TestTenantContext _tenantContext;

    public PushNotificationServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestPushNotify_{Guid.NewGuid()}")
            .Options;

        _tenantContext = new TestTenantContext(_tenantId);
        _db = new AppDbContext(options, _tenantContext);

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Vapid:Subject"] = "mailto:test@test.com",
            })
            .Build();

        var logger = LoggerFactory.Create(_ => { }).CreateLogger<PushNotificationService>();
        Service = new PushNotificationService(_db, _tenantContext, config, logger);
    }

    private PushNotificationService Service { get; }

    [Fact]
    public async Task RegisterSubscriptionAsync_应保存订阅到数据库()
    {
        var userId = Guid.NewGuid();

        await Service.RegisterSubscriptionAsync(
            _tenantId, userId,
            "https://fcm.googleapis.com/fcm/send/test123",
            "p256dh-key", "auth-key", "Mozilla/5.0");

        var subs = await _db.PushSubscriptions.IgnoreQueryFilters().ToListAsync();
        subs.Should().ContainSingle();
        subs[0].UserId.Should().Be(userId);
        subs[0].TenantId.Should().Be(_tenantId);
        subs[0].IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task UnregisterSubscriptionAsync_应删除订阅()
    {
        var userId = Guid.NewGuid();
        var endpoint = "https://fcm.googleapis.com/fcm/send/unreg";

        await Service.RegisterSubscriptionAsync(_tenantId, userId, endpoint, "p256dh", "auth");
        await Service.UnregisterSubscriptionAsync(userId, endpoint);

        var subs = await _db.PushSubscriptions.IgnoreQueryFilters().ToListAsync();
        subs.Should().BeEmpty();
    }

    [Fact]
    public async Task SendToUserAsync_无订阅不应抛出异常()
    {
        var act = () => Service.SendToUserAsync(_tenantId, Guid.NewGuid(), "标题", "内容");
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task SendToUsersAsync_空用户集合不应查询数据库或发送()
    {
        var subscription = new PushSubscription
        {
            TenantId = _tenantId,
            UserId = Guid.NewGuid(),
            Endpoint = "https://fcm.googleapis.com/fcm/send/empty-users",
            P256dh = "p256dh",
            Auth = "auth",
        };
        _db.PushSubscriptions.Add(subscription);
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        await Service.SendToUsersAsync(_tenantId, Array.Empty<Guid>(), "标题", "内容");

        _db.ChangeTracker.Entries<PushSubscription>().Should().BeEmpty();
    }

    [Fact]
    public async Task SendToUsersAsync_应只加载指定租户指定用户的活动订阅()
    {
        var selectedUserId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var otherTenantId = Guid.NewGuid();
        var selectedSubscription = new PushSubscription
        {
            TenantId = _tenantId,
            UserId = selectedUserId,
            Endpoint = "https://fcm.googleapis.com/fcm/send/selected",
            P256dh = "p256dh",
            Auth = "auth",
        };
        var otherUserSubscription = new PushSubscription
        {
            TenantId = _tenantId,
            UserId = otherUserId,
            Endpoint = "https://fcm.googleapis.com/fcm/send/other-user",
            P256dh = "p256dh",
            Auth = "auth",
        };
        var inactiveSubscription = new PushSubscription
        {
            TenantId = _tenantId,
            UserId = selectedUserId,
            Endpoint = "https://fcm.googleapis.com/fcm/send/inactive",
            P256dh = "p256dh",
            Auth = "auth",
            IsActive = false,
        };
        var otherTenantSubscription = new PushSubscription
        {
            TenantId = otherTenantId,
            UserId = selectedUserId,
            Endpoint = "https://fcm.googleapis.com/fcm/send/other-tenant",
            P256dh = "p256dh",
            Auth = "auth",
        };
        _db.PushSubscriptions.AddRange(
            selectedSubscription,
            otherUserSubscription,
            inactiveSubscription,
            otherTenantSubscription);
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        await Service.SendToUsersAsync(_tenantId, [selectedUserId], "标题", "内容");

        _db.ChangeTracker.Entries<PushSubscription>()
            .Select(entry => entry.Entity.Id)
            .Should().BeEquivalentTo([selectedSubscription.Id]);
    }

    [Fact]
    public async Task SendToUsersAsync_未配置Vapid时应安全降级不抛出异常()
    {
        var userId = Guid.NewGuid();
        _db.PushSubscriptions.Add(new PushSubscription
        {
            TenantId = _tenantId,
            UserId = userId,
            Endpoint = "https://fcm.googleapis.com/fcm/send/no-vapid",
            P256dh = "p256dh",
            Auth = "auth",
        });
        await _db.SaveChangesAsync();

        var act = () => Service.SendToUsersAsync(_tenantId, [userId], "标题", "内容");

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task RegisterSubscriptionAsync_重复endpoint应更新而非重复创建()
    {
        var endpoint = "https://fcm.googleapis.com/fcm/send/dup";
        var user1 = Guid.NewGuid();
        var user2 = Guid.NewGuid();

        await Service.RegisterSubscriptionAsync(_tenantId, user1, endpoint, "key1", "auth1");
        await Service.RegisterSubscriptionAsync(_tenantId, user2, endpoint, "key2", "auth2");

        var subs = await _db.PushSubscriptions.IgnoreQueryFilters().ToListAsync();
        subs.Should().ContainSingle();
        subs[0].UserId.Should().Be(user2);
        subs[0].P256dh.Should().Be("key2");
    }

    [Fact]
    public async Task UnregisterSubscriptionAsync_不存在的订阅不应抛出异常()
    {
        var act = () => Service.UnregisterSubscriptionAsync(Guid.NewGuid(), "https://not-exist");
        await act.Should().NotThrowAsync();
    }

    /// <summary>
    /// 安全边界：当前租户不能注销其他租户的订阅。
    ///
    /// Why：后台/应用层查询使用 IgnoreQueryFilters 后，必须补回租户条件；否则只要拿到用户 ID 和 endpoint，
    /// 就可以删除其他租户的浏览器推送订阅，导致对方失去关键告警通知。
    /// </summary>
    [Fact]
    public async Task UnregisterSubscriptionAsync_其他租户订阅不应被删除()
    {
        var otherTenantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var endpoint = "https://fcm.googleapis.com/fcm/send/other-tenant-unreg";
        _db.PushSubscriptions.Add(new PushSubscription
        {
            TenantId = otherTenantId,
            UserId = userId,
            Endpoint = endpoint,
            P256dh = "p256dh",
            Auth = "auth",
        });
        await _db.SaveChangesAsync();

        await Service.UnregisterSubscriptionAsync(userId, endpoint);

        var remaining = await _db.PushSubscriptions
            .IgnoreQueryFilters()
            .SingleAsync(s => s.Endpoint == endpoint);
        remaining.TenantId.Should().Be(otherTenantId);
        remaining.UserId.Should().Be(userId);
    }

    /// <summary>
    /// 安全边界：全局唯一 endpoint 已属于其他租户时，不能被当前租户接管。
    /// </summary>
    [Fact]
    public async Task RegisterSubscriptionAsync_其他租户endpoint不应被接管()
    {
        var otherTenantId = Guid.NewGuid();
        var originalUserId = Guid.NewGuid();
        var newUserId = Guid.NewGuid();
        var endpoint = "https://fcm.googleapis.com/fcm/send/other-tenant-register";
        _db.PushSubscriptions.Add(new PushSubscription
        {
            TenantId = otherTenantId,
            UserId = originalUserId,
            Endpoint = endpoint,
            P256dh = "original-key",
            Auth = "original-auth",
        });
        await _db.SaveChangesAsync();

        var act = () => Service.RegisterSubscriptionAsync(
            _tenantId,
            newUserId,
            endpoint,
            "new-key",
            "new-auth");

        await act.Should().ThrowAsync<InvalidOperationException>();
        var unchanged = await _db.PushSubscriptions
            .IgnoreQueryFilters()
            .SingleAsync(s => s.Endpoint == endpoint);
        unchanged.TenantId.Should().Be(otherTenantId);
        unchanged.UserId.Should().Be(originalUserId);
        unchanged.P256dh.Should().Be("original-key");
    }

    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode { get; } = "shared";
        public bool IsSystemAdmin { get; } = false;
        public Guid UserId { get; } = Guid.NewGuid();
    }

    public async ValueTask DisposeAsync() => await _db.DisposeAsync();
}
