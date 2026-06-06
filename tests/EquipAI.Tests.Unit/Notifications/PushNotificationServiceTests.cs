using EquipAI.Application.Notifications;
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

    public PushNotificationServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestPushNotify_{Guid.NewGuid()}")
            .Options;

        _db = new AppDbContext(options, new TestTenantContext(_tenantId));

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Vapid:Subject"] = "mailto:test@test.com",
                ["Vapid:PublicKey"] = "BEl62iUYgUivxIkv69yViEuiBIa-IVkj8qCtlBm9zk4BFq7J--Lc4xJYflBFHNmPaCPACEBJ5TdGJKt8MHHlQY",
                ["Vapid:PrivateKey"] = "U7OAC8LsS5nPfNnOGou66fHJrE6oPxNPHVxu8IeOxE"
            })
            .Build();

        var logger = LoggerFactory.Create(_ => { }).CreateLogger<PushNotificationService>();
        Service = new PushNotificationService(_db, config, logger);
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
