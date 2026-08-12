using EquipAI.Application.Notifications;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Xunit;

namespace EquipAI.Tests.Unit.Notifications;

/// <summary>
/// 通知偏好服务单元测试。
/// 重点验证安全默认值、用户筛选和邮件通道不可用策略，避免设置保存后在分发链路中被忽略。
/// </summary>
public sealed class NotificationPreferenceServiceTests : IAsyncDisposable
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly Guid _otherTenantId = Guid.NewGuid();
    private readonly AppDbContext _db;
    private readonly NotificationPreferenceService _service;

    public NotificationPreferenceServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestNotificationPreference_{Guid.NewGuid()}")
            .Options;

        _db = new AppDbContext(options, new TestTenantContext(_tenantId));
        var logger = LoggerFactory.Create(_ => { }).CreateLogger<NotificationPreferenceService>();
        _service = new NotificationPreferenceService(_db, logger);
    }

    /// <summary>
    /// 空配置和历史配置都应使用安全默认值：实时与浏览器推送开启，邮件关闭。
    /// </summary>
    [Fact]
    public async Task GetEnabledUserIdsAsync_空配置默认开启实时和推送但关闭邮件()
    {
        var defaultUser = CreateUser(_tenantId, "default-user", "{}");
        var legacyEmailUser = CreateUser(
            _tenantId,
            "legacy-email-user",
            "{\"alert\":{\"email\":true}}");
        await SeedAsync(defaultUser, legacyEmailUser);

        var candidates = new[] { defaultUser.Id, legacyEmailUser.Id };

        (await _service.GetEnabledUserIdsAsync(_tenantId, candidates, "alert", "signalr"))
            .Should().BeEquivalentTo(candidates);
        (await _service.GetEnabledUserIdsAsync(_tenantId, candidates, "alert", "push"))
            .Should().BeEquivalentTo(candidates);
        (await _service.GetEnabledUserIdsAsync(_tenantId, candidates, "alert", "email"))
            .Should().BeEmpty();
    }

    /// <summary>
    /// 显式关闭某个渠道时，只应筛选出仍开启该渠道的用户。
    /// </summary>
    [Fact]
    public async Task GetEnabledUserIdsAsync_应尊重不同通知类型的显式关闭配置()
    {
        var signalrDisabled = CreateUser(
            _tenantId,
            "signalr-disabled",
            "{\"alert\":{\"signalr\":false}}");
        var pushDisabled = CreateUser(
            _tenantId,
            "push-disabled",
            "{\"workorder\":{\"push\":false}}");
        var enabled = CreateUser(_tenantId, "enabled", "{}");
        await SeedAsync(signalrDisabled, pushDisabled, enabled);

        (await _service.GetEnabledUserIdsAsync(
                _tenantId,
                new[] { signalrDisabled.Id, enabled.Id },
                "alert",
                "signalr"))
            .Should().BeEquivalentTo([enabled.Id]);

        (await _service.GetEnabledUserIdsAsync(
                _tenantId,
                new[] { pushDisabled.Id, enabled.Id },
                "workorder",
                "push"))
            .Should().BeEquivalentTo([enabled.Id]);
    }

    /// <summary>
    /// 用户筛选必须同时满足租户、活动状态和候选 ID 条件，不能让空 ID 进入组名或推送收件人。
    /// </summary>
    [Fact]
    public async Task GetEnabledUserIdsAsync_应排除停用用户其他租户和空用户Id()
    {
        var active = CreateUser(_tenantId, "active", "{}");
        var inactive = CreateUser(_tenantId, "inactive", "{}", isActive: false);
        var otherTenant = CreateUser(_otherTenantId, "other-tenant", "{}");
        await SeedAsync(active, inactive, otherTenant);

        var result = await _service.GetEnabledUserIdsAsync(
            _tenantId,
            new[] { active.Id, inactive.Id, otherTenant.Id, Guid.Empty },
            "alert",
            "signalr");

        result.Should().BeEquivalentTo([active.Id]);
    }

    /// <summary>
    /// 损坏的 JSON 不应阻断通知分发，并应回退到默认渠道状态。
    /// </summary>
    [Fact]
    public async Task IsEnabledAsync_损坏配置应回退到安全默认值()
    {
        var user = CreateUser(_tenantId, "corrupted", "{not-json");
        await SeedAsync(user);

        (await _service.IsEnabledAsync(user.Id, "alert", "signalr")).Should().BeTrue();
        (await _service.IsEnabledAsync(user.Id, "alert", "push")).Should().BeTrue();
        (await _service.IsEnabledAsync(user.Id, "alert", "email")).Should().BeFalse();
    }

    /// <summary>
    /// 邮件通道尚未接入告警投递，更新接口必须强制保存为不可用，避免前端显示虚假的成功状态。
    /// </summary>
    [Fact]
    public async Task UpdateAsync_应将邮件通道规范化为关闭()
    {
        var user = CreateUser(_tenantId, "update-user", "{}");
        await SeedAsync(user);

        var result = await _service.UpdateAsync(
            user.Id,
            new NotificationPreferences
            {
                Alert = new ChannelPreference { SignalR = false, Push = true, Email = true },
                WorkOrder = new ChannelPreference { SignalR = true, Push = false, Email = true },
                System = new ChannelPreference { SignalR = false, Push = false, Email = true },
            });

        result.Alert.Email.Should().BeFalse();
        result.WorkOrder.Email.Should().BeFalse();
        result.System.Email.Should().BeFalse();

        var persisted = await _service.GetAsync(user.Id);
        persisted.Alert.SignalR.Should().BeFalse();
        persisted.Alert.Email.Should().BeFalse();
        persisted.WorkOrder.Push.Should().BeFalse();
        persisted.WorkOrder.Email.Should().BeFalse();
        persisted.System.Email.Should().BeFalse();
    }

    private User CreateUser(Guid tenantId, string username, string notificationPrefs, bool isActive = true)
    {
        return new User
        {
            TenantId = tenantId,
            Username = username,
            PasswordHash = "test-password-hash",
            Role = UserRole.Technician,
            NotificationPrefs = notificationPrefs,
            IsActive = isActive,
        };
    }

    private async Task SeedAsync(params User[] users)
    {
        await _db.Users.AddRangeAsync(users);
        await _db.SaveChangesAsync();
    }

    public async ValueTask DisposeAsync() => await _db.DisposeAsync();

    private sealed class TestTenantContext(Guid tenantId) : ITenantContext
    {
        public Guid TenantId { get; } = tenantId;
        public string IsolationMode { get; } = "shared";
        public bool IsSystemAdmin { get; } = false;
        public Guid UserId { get; } = Guid.NewGuid();
    }
}
