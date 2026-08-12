using EquipAI.Application.Notifications;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.WebAPI.Hubs;
using EquipAI.WebAPI.Services;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace EquipAI.Tests.Unit.Notifications;

/// <summary>
/// SignalRNotificationService 单元测试
/// 核心回归场景（#236）：告警多渠道通知的冗余隔离——
/// SignalR 实时推送单点失败（Hub 不可用/序列化异常/底层 WebSocket 错误）不得拖垮
/// 站内通知持久化、Web Push，乃至上游 AlertEventHandler 的 DispatchAsync（钉钉/飞书）。
/// 工业现场 Critical 告警客户依赖多渠道冗余，任一通道单点故障导致全渠道静默会让客户完全错过故障。
/// </summary>
public class SignalRNotificationServiceTests : IAsyncDisposable
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly AppDbContext _db;

    public SignalRNotificationServiceTests()
    {
        // 唯一数据库名避免测试间相互干扰；TestTenantContext 使全局租户过滤器与本租户数据匹配
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestSignalR_{Guid.NewGuid()}")
            .Options;
        _db = new AppDbContext(options, new TestTenantContext(_tenantId));
    }

    /// <summary>构造一个 SignalR 推送会抛异常的 IHubContext（模拟 Hub 不可用）</summary>
    private static (Mock<IHubContext<IndustrialHub>> Hub, Mock<IClientProxy> Proxy) CreateFailingHub()
    {
        var proxyMock = new Mock<IClientProxy>();
        proxyMock
            .Setup(x => x.SendCoreAsync(It.IsAny<string>(), It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("SignalR Hub 不可用：连接/序列化/WebSocket 错误"));
        return (BuildHub(proxyMock), proxyMock);
    }

    /// <summary>构造一个正常工作的 IHubContext（SendCoreAsync 默认返回 Task.CompletedTask）</summary>
    private static (Mock<IHubContext<IndustrialHub>> Hub, Mock<IClientProxy> Proxy) CreateHealthyHub()
    {
        var proxyMock = new Mock<IClientProxy>();
        return (BuildHub(proxyMock), proxyMock);
    }

    /// <summary>装配 IHubContext → IHubClients.Group → IClientProxy 的 mock 链</summary>
    private static Mock<IHubContext<IndustrialHub>> BuildHub(Mock<IClientProxy> proxyMock)
    {
        var clientsMock = BuildClients(proxyMock);
        var hubContextMock = new Mock<IHubContext<IndustrialHub>>();
        hubContextMock.Setup(x => x.Clients).Returns(clientsMock.Object);
        return hubContextMock;
    }

    /// <summary>构造可检查租户内用户组调用的 Hub mock。</summary>
    private static (
        Mock<IHubContext<IndustrialHub>> Hub,
        Mock<IClientProxy> Proxy,
        Mock<IHubClients> Clients) CreateHealthyHubWithClients()
    {
        var proxyMock = new Mock<IClientProxy>();
        var clientsMock = BuildClients(proxyMock);
        var hubContextMock = new Mock<IHubContext<IndustrialHub>>();
        hubContextMock.Setup(x => x.Clients).Returns(clientsMock.Object);
        return (hubContextMock, proxyMock, clientsMock);
    }

    /// <summary>配置租户广播和租户内用户组两种 SignalR 客户端入口。</summary>
    private static Mock<IHubClients> BuildClients(Mock<IClientProxy> proxyMock)
    {
        var clientsMock = new Mock<IHubClients>();
        clientsMock.Setup(x => x.Group(It.IsAny<string>())).Returns(proxyMock.Object);
        clientsMock.Setup(x => x.Groups(It.IsAny<IReadOnlyList<string>>())).Returns(proxyMock.Object);
        return clientsMock;
    }

    private SignalRNotificationService CreateService(
        Mock<IHubContext<IndustrialHub>> hubContext, Mock<IPushNotificationService> pushMock)
        => new(
            hubContext.Object,
            pushMock.Object,
            _db,
            Mock.Of<ILogger<SignalRNotificationService>>(),
            new NotificationPreferenceService(
                _db,
                new TestTenantContext(_tenantId),
                Mock.Of<ILogger<NotificationPreferenceService>>()));

    /// <summary>为通知收件人测试创建指定租户的用户。</summary>
    private async Task<List<User>> SeedUsersAsync(params (UserRole Role, bool IsActive)[] definitions)
    {
        var users = definitions.Select((definition, index) => new User
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantId,
            Username = $"notification-user-{index}-{Guid.NewGuid():N}",
            PasswordHash = "test-hash",
            Role = definition.Role,
            IsActive = definition.IsActive,
        }).ToList();

        _db.Users.AddRange(users);
        await _db.SaveChangesAsync();
        return users;
    }

    /// <summary>为渠道偏好测试创建带有原始 JSON 配置的租户用户。</summary>
    private async Task<List<User>> SeedUsersWithPreferencesAsync(
        params (UserRole Role, bool IsActive, string NotificationPrefs)[] definitions)
    {
        var users = definitions.Select((definition, index) => new User
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantId,
            Username = $"preference-user-{index}-{Guid.NewGuid():N}",
            PasswordHash = "test-hash",
            Role = definition.Role,
            IsActive = definition.IsActive,
            NotificationPrefs = definition.NotificationPrefs,
        }).ToList();

        _db.Users.AddRange(users);
        await _db.SaveChangesAsync();
        return users;
    }

    [Fact]
    public async Task SendAlertTriggeredAsync_SignalR失败时_不应向上抛出异常()
    {
        // 回归 #236：SignalR Hub 推送单点失败不得向上抛出，
        // 否则拖垮后续站内通知持久化、Web Push，乃至上游 AlertEventHandler 的 DispatchAsync（钉钉/飞书）。
        var pushMock = new Mock<IPushNotificationService>();
        var (hub, _) = CreateFailingHub();
        var sut = CreateService(hub, pushMock);

        var act = async () => await sut.SendAlertTriggeredAsync(
            _tenantId, Guid.NewGuid(), "ALERT-001", Guid.NewGuid(), "temp", 95.0, "Critical");

        await act.Should().NotThrowAsync("SignalR 单点失败不得拖垮站内通知与 Web Push");
    }

    [Fact]
    public async Task SendAlertTriggeredAsync_SignalR失败时_不应写入GuidEmpty孤儿通知()
    {
        // 告警触发的角色分发由 AlertNotificationService 负责；SignalR 服务只负责实时推送和 Web Push，
        // 不应再额外写入无法被任何用户查询到的 Guid.Empty 通知。
        var pushMock = new Mock<IPushNotificationService>();
        var (hub, _) = CreateFailingHub();
        var sut = CreateService(hub, pushMock);

        var alertId = Guid.NewGuid();
        await sut.SendAlertTriggeredAsync(_tenantId, alertId, "ALERT-001", Guid.NewGuid(), "temp", 95.0, "Critical");

        (await _db.Notifications.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task SendAlertTriggeredAsync_SignalR失败时_应仍调用WebPush()
    {
        // Web Push 是独立通知通道（离线推送），须独立于 SignalR 执行，
        // 否则 SignalR 故障时在线 Web（SignalR）与离线推送（Web Push）同时失效，客户完全收不到告警。
        var pushMock = new Mock<IPushNotificationService>();
        var (hub, _) = CreateFailingHub();
        var sut = CreateService(hub, pushMock);
        var user = (await SeedUsersAsync((UserRole.MaintenanceLead, true)))[0];

        await sut.SendAlertTriggeredAsync(_tenantId, Guid.NewGuid(), "ALERT-001", Guid.NewGuid(), "temp", 95.0, "Critical");

        pushMock.Verify(
            x => x.SendToUsersAsync(
                _tenantId,
                It.Is<IReadOnlyCollection<Guid>>(ids => ids.SequenceEqual(new[] { user.Id })),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Once,
            "Web Push 应独立于 SignalR 执行，SignalR 失败不得跳过 Web Push");
    }

    [Fact]
    public async Task SendAlertTriggeredAsync_底层SignalR取消时应继续传播取消信号()
    {
        var proxyMock = new Mock<IClientProxy>();
        proxyMock
            .Setup(x => x.SendCoreAsync(It.IsAny<string>(), It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException());
        var hub = BuildHub(proxyMock);
        var sut = CreateService(hub, new Mock<IPushNotificationService>());
        await SeedUsersAsync((UserRole.MaintenanceLead, true));

        var act = () => sut.SendAlertTriggeredAsync(
            _tenantId, Guid.NewGuid(), "ALERT-001", Guid.NewGuid(), "temp", 95.0, "Critical");

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [Fact]
    public async Task SendAlertTriggeredAsync_SignalR正常时_只推送实时事件()
    {
        // 对照测试：SignalR 正常时应推送实时事件，但不应重复创建告警站内通知。
        var pushMock = new Mock<IPushNotificationService>();
        var (hub, proxy) = CreateHealthyHub();
        var sut = CreateService(hub, pushMock);
        await SeedUsersAsync((UserRole.MaintenanceLead, true));

        var alertId = Guid.NewGuid();
        await sut.SendAlertTriggeredAsync(_tenantId, alertId, "ALERT-001", Guid.NewGuid(), "temp", 95.0, "Critical");

        proxy.Verify(
            x => x.SendCoreAsync("OnAlertTriggered", It.IsAny<object[]>(), It.IsAny<CancellationToken>()),
            Times.Once,
            "SignalR 正常时应推送告警到租户组");
        pushMock.Verify(
            x => x.SendToUsersAsync(
                _tenantId,
                It.IsAny<IReadOnlyCollection<Guid>>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
        (await _db.Notifications.CountAsync(n => n.RelatedId == alertId)).Should().Be(0);
    }

    [Fact]
    public async Task SendTelemetryUpdateAsync_应把取消令牌传给SignalR()
    {
        var pushMock = new Mock<IPushNotificationService>();
        var (hub, proxy) = CreateHealthyHub();
        var sut = CreateService(hub, pushMock);
        using var cancellation = new CancellationTokenSource();

        await sut.SendTelemetryUpdateAsync(
            _tenantId, Guid.NewGuid(), "temperature", 42.0, cancellation.Token);

        proxy.Verify(
            x => x.SendCoreAsync(
                "OnTelemetryUpdate",
                It.IsAny<object[]>(),
                cancellation.Token),
            Times.Once,
            "后台停机时 SignalR 推送必须接收同一个取消令牌");
    }

    [Fact]
    public async Task SendAlertResolvedAsync_应只为活动运维角色创建用户通知()
    {
        var users = await SeedUsersAsync(
            (UserRole.SystemAdmin, true),
            (UserRole.MaintenanceLead, true),
            (UserRole.Technician, true),
            (UserRole.MaintenanceLead, false),
            (UserRole.Operator, true),
            (UserRole.Viewer, true));
        var pushMock = new Mock<IPushNotificationService>();
        var (hub, _) = CreateHealthyHub();
        var sut = CreateService(hub, pushMock);
        var alertId = Guid.NewGuid();

        await sut.SendAlertResolvedAsync(_tenantId, alertId);

        var notifications = await _db.Notifications
            .Where(n => n.RelatedId == alertId)
            .ToListAsync();
        notifications.Should().HaveCount(3);
        notifications.Should().OnlyContain(n => n.UserId != Guid.Empty);
        notifications.Select(n => n.UserId).Should().BeEquivalentTo(
            users.Where(u => u.IsActive && u.Role is UserRole.SystemAdmin or UserRole.MaintenanceLead or UserRole.Technician)
                .Select(u => u.Id));
    }

    [Fact]
    public async Task SendWorkOrderEscalatedAsync_应只为活动主管创建用户通知()
    {
        var users = await SeedUsersAsync(
            (UserRole.SystemAdmin, true),
            (UserRole.MaintenanceLead, true),
            (UserRole.MaintenanceLead, false),
            (UserRole.Technician, true));
        var pushMock = new Mock<IPushNotificationService>();
        var (hub, _) = CreateHealthyHub();
        var sut = CreateService(hub, pushMock);
        var workOrderId = Guid.NewGuid();

        await sut.SendWorkOrderEscalatedAsync(
            _tenantId, workOrderId, "WO-001", "空压机过热", "High", "Critical");

        var notifications = await _db.Notifications
            .Where(n => n.RelatedId == workOrderId)
            .ToListAsync();
        notifications.Should().HaveCount(2);
        notifications.Should().OnlyContain(n => n.UserId != Guid.Empty);
        notifications.Select(n => n.UserId).Should().BeEquivalentTo(
            users.Where(u => u.IsActive && u.Role is UserRole.SystemAdmin or UserRole.MaintenanceLead)
                .Select(u => u.Id));
    }

    [Fact]
    public async Task SendDeviceOfflineAsync_应只为活动运维角色创建用户通知()
    {
        var users = await SeedUsersAsync(
            (UserRole.SystemAdmin, true),
            (UserRole.MaintenanceLead, true),
            (UserRole.Technician, true),
            (UserRole.Technician, false),
            (UserRole.Operator, true));
        var pushMock = new Mock<IPushNotificationService>();
        var (hub, _) = CreateHealthyHub();
        var sut = CreateService(hub, pushMock);
        var deviceId = Guid.NewGuid();

        await sut.SendDeviceOfflineAsync(_tenantId, deviceId, "DEV-001", "1号空压机");

        var notifications = await _db.Notifications
            .Where(n => n.RelatedId == deviceId)
            .ToListAsync();
        notifications.Should().HaveCount(3);
        notifications.Should().OnlyContain(n => n.UserId != Guid.Empty);
        notifications.Select(n => n.UserId).Should().BeEquivalentTo(
            users.Where(u => u.IsActive && u.Role is UserRole.SystemAdmin or UserRole.MaintenanceLead or UserRole.Technician)
                .Select(u => u.Id));
    }

    [Fact]
    public async Task SendGatewayOfflineAsync_应只为活动运维角色创建用户通知()
    {
        var users = await SeedUsersAsync(
            (UserRole.SystemAdmin, true),
            (UserRole.MaintenanceLead, true),
            (UserRole.Technician, true),
            (UserRole.SystemAdmin, false),
            (UserRole.Operator, true));
        var pushMock = new Mock<IPushNotificationService>();
        var (hub, _) = CreateHealthyHub();
        var sut = CreateService(hub, pushMock);
        var gatewayId = Guid.NewGuid();

        await sut.SendGatewayOfflineAsync(_tenantId, gatewayId, "GW-001", "1号采集网关");

        var notifications = await _db.Notifications
            .Where(n => n.RelatedId == gatewayId)
            .ToListAsync();
        notifications.Should().HaveCount(3);
        notifications.Should().OnlyContain(n => n.UserId != Guid.Empty);
        notifications.Select(n => n.UserId).Should().BeEquivalentTo(
            users.Where(u => u.IsActive && u.Role is UserRole.SystemAdmin or UserRole.MaintenanceLead or UserRole.Technician)
                .Select(u => u.Id));
    }

    [Fact]
    public async Task SendAlertResolvedAsync_SignalR失败时_应仍持久化与WebPush()
    {
        // 对称回归 #237：SendAlertResolvedAsync 与 SendAlertTriggeredAsync 同构（SignalR + 持久化 + Web Push），
        // 须同样隔离 SignalR 单点失败，否则告警解除通知在 Hub 故障时持久化与 Web Push 全丢，
        // 客户以为告警仍在处理（实际已解除），信息长期不同步。
        var pushMock = new Mock<IPushNotificationService>();
        var (hub, _) = CreateFailingHub();
        var sut = CreateService(hub, pushMock);

        await SeedUsersAsync((UserRole.MaintenanceLead, true));
        var alertId = Guid.NewGuid();
        var act = async () => await sut.SendAlertResolvedAsync(_tenantId, alertId);
        await act.Should().NotThrowAsync("告警解除的 SignalR 单点失败不得拖垮持久化与 Web Push");

        var notification = await _db.Notifications.FirstOrDefaultAsync(n => n.RelatedId == alertId);
        notification.Should().NotBeNull("SignalR 失败后站内告警解除通知仍应持久化");
        pushMock.Verify(
            x => x.SendToUsersAsync(
                _tenantId,
                It.IsAny<IReadOnlyCollection<Guid>>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Once, "Web Push 应独立于 SignalR 执行");
    }

    [Fact]
    public async Task SendWorkOrderEscalatedAsync_SignalR失败时_应仍持久化与WebPush()
    {
        // 对称回归 #237：SLA 超时升级须通知主管，主管未必在线看 Web，恰恰依赖持久化 + Web Push 兜底。
        // SignalR 单点失败拖垮它们 = 主管完全不知 SLA 超时（#184/#231 专门补的升级通知形同虚设）。
        var pushMock = new Mock<IPushNotificationService>();
        var (hub, _) = CreateFailingHub();
        var sut = CreateService(hub, pushMock);

        await SeedUsersAsync((UserRole.MaintenanceLead, true));
        var workOrderId = Guid.NewGuid();
        var act = async () => await sut.SendWorkOrderEscalatedAsync(
            _tenantId, workOrderId, "WO-001", "空压机过热", "High", "Critical");
        await act.Should().NotThrowAsync("SLA 升级的 SignalR 单点失败不得拖垮持久化与 Web Push");

        var notification = await _db.Notifications.FirstOrDefaultAsync(n => n.RelatedId == workOrderId);
        notification.Should().NotBeNull("SignalR 失败后 SLA 升级站内通知仍应持久化，主管登录后能看到");
        notification!.Type.Should().Be("workorder_escalated");
        pushMock.Verify(
            x => x.SendToUsersAsync(
                _tenantId,
                It.IsAny<IReadOnlyCollection<Guid>>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task SendDeviceOfflineAsync_SignalR失败时_应仍持久化与WebPush()
    {
        // 对称回归 #237：设备离线须通知运维，运维未必在线看 Web，恰恰依赖持久化 + Web Push 兜底。
        // SignalR 单点失败拖垮它们 = 运维完全错过通信中断（#232 专门补的离线通知形同虚设）。
        var pushMock = new Mock<IPushNotificationService>();
        var (hub, _) = CreateFailingHub();
        var sut = CreateService(hub, pushMock);

        await SeedUsersAsync((UserRole.Technician, true));
        var deviceId = Guid.NewGuid();
        var act = async () => await sut.SendDeviceOfflineAsync(_tenantId, deviceId, "DEV-001", "1号空压机");
        await act.Should().NotThrowAsync("设备离线的 SignalR 单点失败不得拖垮持久化与 Web Push");

        var notification = await _db.Notifications.FirstOrDefaultAsync(n => n.RelatedId == deviceId);
        notification.Should().NotBeNull("SignalR 失败后设备离线站内通知仍应持久化，运维登录后能看到");
        notification!.Type.Should().Be("device_offline");
        pushMock.Verify(
            x => x.SendToUsersAsync(
                _tenantId,
                It.IsAny<IReadOnlyCollection<Guid>>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task SendAlertResolvedAsync_应只向开启告警实时通知的用户组发送()
    {
        var users = await SeedUsersWithPreferencesAsync(
            (UserRole.MaintenanceLead, true, "{\"alert\":{\"signalr\":false}}"),
            (UserRole.MaintenanceLead, true, "{}"));
        var pushMock = new Mock<IPushNotificationService>();
        var (hub, _, clients) = CreateHealthyHubWithClients();
        var sut = CreateService(hub, pushMock);

        await sut.SendAlertResolvedAsync(_tenantId, Guid.NewGuid());

        var enabledUserId = users[1].Id;
        clients.Verify(
            x => x.Groups(It.Is<IReadOnlyList<string>>(groups =>
                groups.SequenceEqual(new[] { $"tenant:{_tenantId}:user:{enabledUserId}" }))),
            Times.Once,
            "告警实时消息只能发送给开启告警 SignalR 的用户组");
    }

    [Fact]
    public async Task SendWorkOrderEscalatedAsync_应只向开启工单推送的主管发送()
    {
        var users = await SeedUsersWithPreferencesAsync(
            (UserRole.MaintenanceLead, true, "{\"workorder\":{\"push\":false}}"),
            (UserRole.SystemAdmin, true, "{}"));
        var pushMock = new Mock<IPushNotificationService>();
        var (hub, _) = CreateHealthyHub();
        var sut = CreateService(hub, pushMock);

        await sut.SendWorkOrderEscalatedAsync(
            _tenantId, Guid.NewGuid(), "WO-PREF-001", "空压机过热", "High", "Critical");

        var enabledUserId = users[1].Id;
        pushMock.Verify(
            x => x.SendToUsersAsync(
                _tenantId,
                It.Is<IReadOnlyCollection<Guid>>(ids => ids.SequenceEqual(new[] { enabledUserId })),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Once,
            "工单升级 Push 只能发送给开启工单 Push 的主管");
    }

    [Fact]
    public async Task SendAlertResolvedAsync_无渠道收件人时仍应持久化站内历史()
    {
        var user = (await SeedUsersWithPreferencesAsync(
            (UserRole.MaintenanceLead, true, "{\"alert\":{\"signalr\":false,\"push\":false}}")))[0];
        var pushMock = new Mock<IPushNotificationService>();
        var (hub, _, clients) = CreateHealthyHubWithClients();
        var sut = CreateService(hub, pushMock);
        var alertId = Guid.NewGuid();

        await sut.SendAlertResolvedAsync(_tenantId, alertId);

        clients.Verify(x => x.Groups(It.IsAny<IReadOnlyList<string>>()), Times.Never);
        pushMock.Verify(
            x => x.SendToUsersAsync(
                It.IsAny<Guid>(),
                It.IsAny<IReadOnlyCollection<Guid>>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        var notification = await _db.Notifications.SingleAsync(n => n.RelatedId == alertId);
        notification.UserId.Should().Be(user.Id);
    }

    public async ValueTask DisposeAsync() => await _db.DisposeAsync();

    /// <summary>测试用租户上下文：使全局租户过滤器与本租户写入的数据匹配</summary>
    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
