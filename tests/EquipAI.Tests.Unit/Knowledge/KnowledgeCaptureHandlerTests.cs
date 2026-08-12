using EquipAI.Application.Knowledge;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace EquipAI.Tests.Unit.Knowledge;

/// <summary>
/// KnowledgeCaptureHandler 单元测试
/// 验证工单状态变更事件处理器的知识沉淀和准确率追踪逻辑
/// 每个测试使用独立的 InMemory 数据库，避免租户过滤器冲突
/// </summary>
public class KnowledgeCaptureHandlerTests
{
    private readonly Guid _tenantId = Guid.NewGuid();

    /// <summary>
    /// 为每个测试创建独立的数据库和依赖项
    /// </summary>
    private (AppDbContext db, Mock<IRuleAccuracyTracker> tracker, KnowledgeCaptureHandler handler) CreateSut()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestCaptureHandler_{Guid.NewGuid()}")
            .Options;

        var db = new AppDbContext(options, new TestTenantContext(_tenantId));
        var tracker = new Mock<IRuleAccuracyTracker>();

        var serviceProviderMock = new Mock<IServiceProvider>();
        serviceProviderMock.Setup(sp => sp.GetService(typeof(AppDbContext))).Returns(db);
        serviceProviderMock.Setup(sp => sp.GetService(typeof(IRuleAccuracyTracker))).Returns(tracker.Object);

        var scopeMock = new Mock<IServiceScope>();
        scopeMock.SetupGet(s => s.ServiceProvider).Returns(serviceProviderMock.Object);

        var scopeFactoryMock = new Mock<IServiceScopeFactory>();
        scopeFactoryMock.Setup(f => f.CreateScope()).Returns(scopeMock.Object);

        var llmMock = new Mock<ILLMService>();
        var auditLogMock = new Mock<IAuditLogService>();
        var captureLogger = LoggerFactory.Create(_ => { }).CreateLogger<KnowledgeCaptureService>();
        var captureService = new KnowledgeCaptureService(
            scopeFactoryMock.Object, llmMock.Object, auditLogMock.Object, captureLogger);

        var handlerLogger = LoggerFactory.Create(_ => { }).CreateLogger<KnowledgeCaptureHandler>();
        var handler = new KnowledgeCaptureHandler(captureService, scopeFactoryMock.Object, handlerLogger);

        return (db, tracker, handler);
    }

    private WorkOrderStatusChangedEvent CreateClosedEvent(Guid woId) => new(
        EventId: Guid.NewGuid(), OccurredAt: DateTime.UtcNow, TenantId: _tenantId,
        WorkOrderId: woId, OldStatus: "InProgress", NewStatus: "Closed", OperatorId: null);

    private WorkOrderStatusChangedEvent CreateNonClosedEvent() => new(
        EventId: Guid.NewGuid(), OccurredAt: DateTime.UtcNow, TenantId: _tenantId,
        WorkOrderId: Guid.NewGuid(), OldStatus: "Pending", NewStatus: "InProgress", OperatorId: null);

    [Fact]
    public async Task HandleAsync_非Closed状态不应触发处理()
    {
        var (db, tracker, handler) = CreateSut();

        await handler.HandleAsync(CreateNonClosedEvent(), CancellationToken.None);

        var faultCases = await db.FaultCases.IgnoreQueryFilters().ToListAsync();
        faultCases.Should().BeEmpty();
    }

    [Fact]
    public async Task HandleAsync_Closed状态应创建故障案例()
    {
        var (db, tracker, handler) = CreateSut();

        var device = new Device
        {
            TenantId = _tenantId, Type = "电机",
            DeviceCode = "H-DEV-1", Name = "测试电机"
        };
        db.Devices.Add(device);

        var wo = new WorkOrder
        {
            TenantId = _tenantId, DeviceId = device.Id,
            Title = "电机异常振动", ActualHours = 2.0,
            RootCause = "轴承磨损", ExecutionReport = "更换轴承"
        };
        db.WorkOrders.Add(wo);
        await db.SaveChangesAsync();

        await handler.HandleAsync(CreateClosedEvent(wo.Id), CancellationToken.None);

        var faultCases = await db.FaultCases.IgnoreQueryFilters().ToListAsync();
        faultCases.Should().HaveCount(1);
        faultCases[0].SourceWorkorderId.Should().Be(wo.Id);
    }

    [Fact]
    public async Task HandleAsync_Closed且有Analysis和RuleId时应追踪准确率()
    {
        var (db, tracker, handler) = CreateSut();
        var ruleId = Guid.NewGuid();

        var device = new Device
        {
            TenantId = _tenantId, Type = "泵",
            DeviceCode = "H-DEV-2", Name = "测试泵"
        };
        db.Devices.Add(device);

        var analysis = new Core.Entities.Analysis
        {
            TenantId = _tenantId, AlertId = Guid.NewGuid(), RuleId = ruleId
        };
        db.Analyses.Add(analysis);

        var wo = new WorkOrder
        {
            TenantId = _tenantId, DeviceId = device.Id,
            Title = "泵体泄漏", ActualHours = 1.5,
            RootCause = "密封圈老化", Resolution = "更换密封圈",
            AnalysisId = analysis.Id
        };
        db.WorkOrders.Add(wo);
        await db.SaveChangesAsync();

        await handler.HandleAsync(CreateClosedEvent(wo.Id), CancellationToken.None);

        tracker.Verify(t => t.RecordAsync(ruleId, true, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task HandleAsync_RootCause为空时wasAccurate应为false()
    {
        var (db, tracker, handler) = CreateSut();
        var ruleId = Guid.NewGuid();

        var device = new Device
        {
            TenantId = _tenantId, Type = "压缩机",
            DeviceCode = "H-DEV-3", Name = "测试压缩机"
        };
        db.Devices.Add(device);

        var analysis = new Core.Entities.Analysis
        {
            TenantId = _tenantId, AlertId = Guid.NewGuid(), RuleId = ruleId
        };
        db.Analyses.Add(analysis);

        var wo = new WorkOrder
        {
            TenantId = _tenantId, DeviceId = device.Id,
            Title = "无根因工单", ActualHours = 1.0,
            RootCause = null, Resolution = "更换零件",
            AnalysisId = analysis.Id
        };
        db.WorkOrders.Add(wo);
        await db.SaveChangesAsync();

        await handler.HandleAsync(CreateClosedEvent(wo.Id), CancellationToken.None);

        tracker.Verify(t => t.RecordAsync(ruleId, false, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task HandleAsync_工单不存在时不应抛出异常()
    {
        var (db, tracker, handler) = CreateSut();

        var act = () => handler.HandleAsync(CreateClosedEvent(Guid.NewGuid()), CancellationToken.None);
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task HandleAsync_收到停机取消时应传播取消信号()
    {
        var (db, tracker, handler) = CreateSut();
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        var act = () => handler.HandleAsync(CreateClosedEvent(Guid.NewGuid()), cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [Fact]
    public async Task HandleAsync_工单无AnalysisId时不追踪准确率()
    {
        var (db, tracker, handler) = CreateSut();

        var device = new Device
        {
            TenantId = _tenantId, Type = "电机",
            DeviceCode = "H-DEV-4", Name = "无分析设备"
        };
        db.Devices.Add(device);

        var wo = new WorkOrder
        {
            TenantId = _tenantId, DeviceId = device.Id,
            Title = "无分析工单", ActualHours = 1.0
        };
        db.WorkOrders.Add(wo);
        await db.SaveChangesAsync();

        await handler.HandleAsync(CreateClosedEvent(wo.Id), CancellationToken.None);

        tracker.Verify(
            t => t.RecordAsync(It.IsAny<Guid>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode { get; } = "shared";
        public bool IsSystemAdmin { get; } = false;
        public Guid UserId { get; } = Guid.NewGuid();
    }
}
