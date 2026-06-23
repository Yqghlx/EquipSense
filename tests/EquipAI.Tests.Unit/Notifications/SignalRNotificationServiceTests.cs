using EquipAI.Core.Entities;
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
        var clientsMock = new Mock<IHubClients>();
        clientsMock.Setup(x => x.Group(It.IsAny<string>())).Returns(proxyMock.Object);
        var hubContextMock = new Mock<IHubContext<IndustrialHub>>();
        hubContextMock.Setup(x => x.Clients).Returns(clientsMock.Object);
        return hubContextMock;
    }

    private SignalRNotificationService CreateService(
        Mock<IHubContext<IndustrialHub>> hubContext, Mock<IPushNotificationService> pushMock)
        => new(hubContext.Object, pushMock.Object, _db, Mock.Of<ILogger<SignalRNotificationService>>());

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
    public async Task SendAlertTriggeredAsync_SignalR失败时_应仍持久化站内通知()
    {
        // SignalR 失败后，站内通知仍须持久化——离线用户登录后才能看到告警记录，
        // 不能因实时推送通道故障就丢掉持久化通知（持久化是离线兜底，与实时推送正交）。
        var pushMock = new Mock<IPushNotificationService>();
        var (hub, _) = CreateFailingHub();
        var sut = CreateService(hub, pushMock);

        var alertId = Guid.NewGuid();
        await sut.SendAlertTriggeredAsync(_tenantId, alertId, "ALERT-001", Guid.NewGuid(), "temp", 95.0, "Critical");

        var notification = await _db.Notifications.FirstOrDefaultAsync(n => n.RelatedId == alertId);
        notification.Should().NotBeNull("SignalR 失败后站内通知仍应持久化，让离线用户登录后能看到告警");
        notification!.Type.Should().Be("alert");
        notification.RelatedId.Should().Be(alertId);
        notification.TenantId.Should().Be(_tenantId);
    }

    [Fact]
    public async Task SendAlertTriggeredAsync_SignalR失败时_应仍调用WebPush()
    {
        // Web Push 是独立通知通道（离线推送），须独立于 SignalR 执行，
        // 否则 SignalR 故障时在线 Web（SignalR）与离线推送（Web Push）同时失效，客户完全收不到告警。
        var pushMock = new Mock<IPushNotificationService>();
        var (hub, _) = CreateFailingHub();
        var sut = CreateService(hub, pushMock);

        await sut.SendAlertTriggeredAsync(_tenantId, Guid.NewGuid(), "ALERT-001", Guid.NewGuid(), "temp", 95.0, "Critical");

        pushMock.Verify(
            x => x.SendToTenantAsync(_tenantId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()),
            Times.Once,
            "Web Push 应独立于 SignalR 执行，SignalR 失败不得跳过 Web Push");
    }

    [Fact]
    public async Task SendAlertTriggeredAsync_SignalR正常时_应推送并持久化()
    {
        // 对照测试：SignalR 正常时所有通道都应工作（证明隔离逻辑不破坏正常路径）。
        var pushMock = new Mock<IPushNotificationService>();
        var (hub, proxy) = CreateHealthyHub();
        var sut = CreateService(hub, pushMock);

        var alertId = Guid.NewGuid();
        await sut.SendAlertTriggeredAsync(_tenantId, alertId, "ALERT-001", Guid.NewGuid(), "temp", 95.0, "Critical");

        proxy.Verify(
            x => x.SendCoreAsync("OnAlertTriggered", It.IsAny<object[]>(), It.IsAny<CancellationToken>()),
            Times.Once,
            "SignalR 正常时应推送告警到租户组");
        pushMock.Verify(
            x => x.SendToTenantAsync(_tenantId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()),
            Times.Once);
        (await _db.Notifications.CountAsync(n => n.RelatedId == alertId)).Should().Be(1);
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

        var alertId = Guid.NewGuid();
        var act = async () => await sut.SendAlertResolvedAsync(_tenantId, alertId);
        await act.Should().NotThrowAsync("告警解除的 SignalR 单点失败不得拖垮持久化与 Web Push");

        var notification = await _db.Notifications.FirstOrDefaultAsync(n => n.RelatedId == alertId);
        notification.Should().NotBeNull("SignalR 失败后站内告警解除通知仍应持久化");
        pushMock.Verify(
            x => x.SendToTenantAsync(_tenantId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()),
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

        var workOrderId = Guid.NewGuid();
        var act = async () => await sut.SendWorkOrderEscalatedAsync(
            _tenantId, workOrderId, "WO-001", "空压机过热", "High", "Critical");
        await act.Should().NotThrowAsync("SLA 升级的 SignalR 单点失败不得拖垮持久化与 Web Push");

        var notification = await _db.Notifications.FirstOrDefaultAsync(n => n.RelatedId == workOrderId);
        notification.Should().NotBeNull("SignalR 失败后 SLA 升级站内通知仍应持久化，主管登录后能看到");
        notification!.Type.Should().Be("workorder_escalated");
        pushMock.Verify(
            x => x.SendToTenantAsync(_tenantId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()),
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

        var deviceId = Guid.NewGuid();
        var act = async () => await sut.SendDeviceOfflineAsync(_tenantId, deviceId, "DEV-001", "1号空压机");
        await act.Should().NotThrowAsync("设备离线的 SignalR 单点失败不得拖垮持久化与 Web Push");

        var notification = await _db.Notifications.FirstOrDefaultAsync(n => n.RelatedId == deviceId);
        notification.Should().NotBeNull("SignalR 失败后设备离线站内通知仍应持久化，运维登录后能看到");
        notification!.Type.Should().Be("device_offline");
        pushMock.Verify(
            x => x.SendToTenantAsync(_tenantId, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()),
            Times.Once);
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
