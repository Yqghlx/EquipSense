using AutoMapper;
using EquipAI.Application.Alerts.DTOs;
using EquipAI.Application.Services;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.WebAPI.Controllers;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace EquipAI.Tests.Unit.Alerts;

/// <summary>
/// AlertsController 单元测试
/// 重点验证：
/// 1. 告警确认/解决操作的审计字段（AcknowledgedBy/ResolvedBy）记录操作用户 ID 而非租户 ID（回归 #254）
/// 2. 告警确认/解决后发布集成事件以实时推送其他在线用户（回归 #256，与工单状态变更推送对称）
/// </summary>
public class AlertsControllerTests
{
    private readonly Guid _tenantId = Guid.NewGuid();
    // 故意与租户 ID 不同，便于断言区分「写成了用户 ID」还是「误写成了租户 ID」
    private readonly Guid _userId = Guid.NewGuid();

    /// <summary>
    /// 构造测试用 DbContext + AlertsController，并 seed 一个 Active 告警
    /// </summary>
    private static async Task<(AppDbContext db, AlertsController controller, Mock<IEventBus> eventBus)> CreateSutAsync(
        Guid tenantId, Guid userId, Alert alert)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"AlertCtrl_{Guid.NewGuid()}")
            .Options;
        var db = new AppDbContext(options, new FixedTenantContext(tenantId, userId));
        db.Alerts.Add(alert);
        await db.SaveChangesAsync();

        // Acknowledge/Resolve 末尾调用 _mapper.Map&lt;AlertDto&gt;，mock 返回空 DTO 即可
        var mapperMock = new Mock<IMapper>();
        mapperMock.Setup(m => m.Map<AlertDto>(It.IsAny<Alert>())).Returns(new AlertDto());
        // DataExportService 仅在导出端点使用，确认/解决路径不调用它，传入真实实例即可（构造仅需 db）
        var exportService = new DataExportService(db);

        // IEventBus：确认/解决后发布 AlertAcknowledgedEvent/AlertResolvedEvent，mock 接收不实际派发
        var eventBus = new Mock<IEventBus>();
        eventBus
            .Setup(e => e.PublishAsync(It.IsAny<IIntegrationEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var controller = new AlertsController(db, mapperMock.Object, new FixedTenantContext(tenantId, userId), exportService, eventBus.Object);
        return (db, controller, eventBus);
    }

    /// <summary>
    /// 构造一个 Active 状态的告警（满足 Acknowledge/Resolve 的前置状态校验）
    /// </summary>
    private Alert MakeAlert(Guid id, Guid tenantId) => new()
    {
        Id = id,
        TenantId = tenantId,
        AlertCode = "AL-TEST-001",
        DeviceId = Guid.NewGuid(),
        Severity = AlertSeverity.High,
        Status = AlertStatus.Active,
        Metric = "temperature",
        Value = 95m
    };

    [Fact]
    public async Task AcknowledgeAlert_应记录操作用户ID而非租户ID()
    {
        var alertId = Guid.NewGuid();
        var (db, controller, _) = await CreateSutAsync(_tenantId, _userId, MakeAlert(alertId, _tenantId));

        await controller.AcknowledgeAlert(alertId, null);

        var updated = await db.Alerts.FindAsync(alertId);
        updated.Should().NotBeNull();
        // 确认人必须记录操作用户 ID。原实现写 _tenantContext.TenantId（全租户共享同一 GUID），
        // 致审计「谁确认了这条 Critical 告警」无法回答——与 WorkOrdersController 一致地用 UserId
        updated!.AcknowledgedBy.Should().Be(_userId, "确认人应记录操作用户 ID");
        updated.AcknowledgedBy.Should().NotBe(_tenantId, "记录租户 ID 会使全租户所有确认操作归因到同一 GUID，审计追溯失效");
    }

    [Fact]
    public async Task ResolveAlert_应记录操作用户ID而非租户ID()
    {
        var alertId = Guid.NewGuid();
        var (db, controller, _) = await CreateSutAsync(_tenantId, _userId, MakeAlert(alertId, _tenantId));

        await controller.ResolveAlert(alertId, new ResolveAlertRequest { Resolution = "已更换传感器" });

        var updated = await db.Alerts.FindAsync(alertId);
        updated.Should().NotBeNull();
        // 解决人必须记录操作用户 ID（与 Acknowledge 对称）
        updated!.ResolvedBy.Should().Be(_userId, "解决人应记录操作用户 ID");
        updated.ResolvedBy.Should().NotBe(_tenantId, "记录租户 ID 会使全租户所有解决操作归因到同一 GUID，审计追溯失效");
    }

    /// <summary>
    /// 回归 #256：Acknowledge 原只改 DB 返回、无实时推送，与工单状态变更推送（#231-#251）不对称。
    /// 修复后须发布 AlertAcknowledgedEvent → AlertStatusNotificationHandler → OnAlertAcknowledged，
    /// 让告警中心其他在线用户实时看到该告警已被确认接管（避免多人重复确认/重复派工）。
    /// </summary>
    [Fact]
    public async Task AcknowledgeAlert_应发布告警确认事件以实时推送其他用户()
    {
        var alertId = Guid.NewGuid();
        var (_, controller, eventBus) = await CreateSutAsync(_tenantId, _userId, MakeAlert(alertId, _tenantId));

        await controller.AcknowledgeAlert(alertId, null);

        // 用 Invocations 逐参数断言（参考 moq-verify-closure-arg-flaky：闭包捕获 Guid 的 Verify 不稳定）
        var invocations = eventBus.Invocations
            .Where(i => i.Method.Name == nameof(IEventBus.PublishAsync))
            .Where(i => i.Arguments[0] is AlertAcknowledgedEvent)
            .ToList();
        invocations.Should().HaveCount(1, "确认告警应发布 1 次 AlertAcknowledgedEvent");
        var evt = (AlertAcknowledgedEvent)invocations[0].Arguments[0];
        evt.AlertId.Should().Be(alertId);
        evt.TenantId.Should().Be(_tenantId);
        evt.AcknowledgedBy.Should().Be(_userId, "事件须携带操作用户 ID（非租户 ID）供审计追溯");
    }

    /// <summary>
    /// 回归 #256：Resolve 的 SendAlertResolvedAsync（接口 + 实现 + 前端监听）此前全仓零调用（死代码）。
    /// 修复后 Controller 须发布 AlertResolvedEvent → 复活 SendAlertResolvedAsync 三路推送。
    /// </summary>
    [Fact]
    public async Task ResolveAlert_应发布告警解决事件以实时推送其他用户()
    {
        var alertId = Guid.NewGuid();
        var (_, controller, eventBus) = await CreateSutAsync(_tenantId, _userId, MakeAlert(alertId, _tenantId));

        await controller.ResolveAlert(alertId, new ResolveAlertRequest { Resolution = "已更换传感器" });

        var invocations = eventBus.Invocations
            .Where(i => i.Method.Name == nameof(IEventBus.PublishAsync))
            .Where(i => i.Arguments[0] is AlertResolvedEvent)
            .ToList();
        invocations.Should().HaveCount(1, "解决告警应发布 1 次 AlertResolvedEvent");
        var evt = (AlertResolvedEvent)invocations[0].Arguments[0];
        evt.AlertId.Should().Be(alertId);
        evt.TenantId.Should().Be(_tenantId);
        evt.ResolvedBy.Should().Be(_userId);
        evt.Resolution.Should().Be("已更换传感器");
    }

    /// <summary>
    /// 固定 TenantId/UserId 的测试替身（UserId 可控，区别于 WorkOrderServiceTests 的随机 UserId）
    /// </summary>
    private class FixedTenantContext : ITenantContext
    {
        public FixedTenantContext(Guid tenantId, Guid userId)
        {
            TenantId = tenantId;
            UserId = userId;
        }
        public Guid TenantId { get; }
        public string IsolationMode { get; } = "shared";
        public bool IsSystemAdmin { get; } = false;
        public Guid UserId { get; }
    }
}
