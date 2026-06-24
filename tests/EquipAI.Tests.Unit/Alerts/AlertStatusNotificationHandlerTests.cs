using EquipAI.Application.Alerts.Handlers;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace EquipAI.Tests.Unit.Alerts;

/// <summary>
/// AlertStatusNotificationHandler 单元测试
/// 验证告警确认/解决事件被正确转换为 SignalR 推送（与 WorkOrderNotificationHandler 对称的实时推送链路）
/// </summary>
public class AlertStatusNotificationHandlerTests
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly Guid _alertId = Guid.NewGuid();

    private (AlertStatusNotificationHandler handler, Mock<ISignalRNotificationService> signalRMock) CreateSut()
    {
        var signalRMock = new Mock<ISignalRNotificationService>();
        var logger = LoggerFactory.Create(_ => { }).CreateLogger<AlertStatusNotificationHandler>();
        var handler = new AlertStatusNotificationHandler(signalRMock.Object, logger);
        return (handler, signalRMock);
    }

    /// <summary>
    /// 回归 #256：收到 AlertAcknowledgedEvent 应调用 SendAlertAcknowledgedAsync（轻量 SignalR 推送），
    /// 让告警中心其他在线用户实时看到该告警已被确认接管。
    /// </summary>
    [Fact]
    public async Task HandleAsync_告警确认事件应调用SendAlertAcknowledgedAsync()
    {
        var (handler, signalRMock) = CreateSut();
        var evt = new AlertAcknowledgedEvent(
            EventId: Guid.NewGuid(), OccurredAt: DateTime.UtcNow, TenantId: _tenantId,
            AlertId: _alertId, AcknowledgedBy: Guid.NewGuid(), Note: "已查看");

        await handler.HandleAsync(evt, CancellationToken.None);

        // 用 Invocations 逐参数断言（参考 moq-verify-closure-arg-flaky：闭包捕获 Guid 的 Verify 不稳定）
        var invocations = signalRMock.Invocations
            .Where(i => i.Method.Name == nameof(ISignalRNotificationService.SendAlertAcknowledgedAsync))
            .ToList();
        invocations.Should().HaveCount(1, "告警确认事件应触发 1 次 SendAlertAcknowledgedAsync");
        invocations[0].Arguments[0].Should().Be(_tenantId, "tenantId 参数应为告警所属租户");
        invocations[0].Arguments[1].Should().Be(_alertId, "alertId 参数应为被确认的告警");
    }

    /// <summary>
    /// 回归 #256：收到 AlertResolvedEvent 应调用 SendAlertResolvedAsync（复活既有死代码，三路推送）。
    /// 此前 SendAlertResolvedAsync 接口/实现/前端监听齐备但全仓零调用。
    /// </summary>
    [Fact]
    public async Task HandleAsync_告警解决事件应调用SendAlertResolvedAsync()
    {
        var (handler, signalRMock) = CreateSut();
        var evt = new AlertResolvedEvent(
            EventId: Guid.NewGuid(), OccurredAt: DateTime.UtcNow, TenantId: _tenantId,
            AlertId: _alertId, ResolvedBy: Guid.NewGuid(), Resolution: "已更换轴承");

        await handler.HandleAsync(evt, CancellationToken.None);

        var invocations = signalRMock.Invocations
            .Where(i => i.Method.Name == nameof(ISignalRNotificationService.SendAlertResolvedAsync))
            .ToList();
        invocations.Should().HaveCount(1, "告警解决事件应触发 1 次 SendAlertResolvedAsync");
        invocations[0].Arguments[0].Should().Be(_tenantId);
        invocations[0].Arguments[1].Should().Be(_alertId);
    }

    /// <summary>
    /// SignalR 推送失败不应抛出异常（不得阻塞事件管线其他告警处理器：根因分析、自动建单等）
    /// </summary>
    [Fact]
    public async Task HandleAsync_SignalR推送失败应吞异常不污染事件管线()
    {
        var signalRMock = new Mock<ISignalRNotificationService>();
        signalRMock
            .Setup(s => s.SendAlertAcknowledgedAsync(It.IsAny<Guid>(), It.IsAny<Guid>()))
            .ThrowsAsync(new InvalidOperationException("SignalR 连接异常"));
        var logger = LoggerFactory.Create(_ => { }).CreateLogger<AlertStatusNotificationHandler>();
        var handler = new AlertStatusNotificationHandler(signalRMock.Object, logger);

        var evt = new AlertAcknowledgedEvent(
            Guid.NewGuid(), DateTime.UtcNow, _tenantId, _alertId, Guid.NewGuid(), null);

        // 推送失败仅记录日志，不得抛出——否则阻断同一事件链路上的其他处理器（根因分析、自动建单）
        var act = () => handler.HandleAsync(evt, CancellationToken.None);
        await act.Should().NotThrowAsync();
    }
}
