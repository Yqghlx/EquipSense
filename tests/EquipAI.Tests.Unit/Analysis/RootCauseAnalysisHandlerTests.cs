using EquipAI.Application.Analysis.Handlers;
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

namespace EquipAI.Tests.Unit.Analysis;

/// <summary>
/// RootCauseAnalysisHandler 单元测试
/// 验证告警触发后的根因分析、结果持久化、事件发布和候选规则自动生成
/// </summary>
public class RootCauseAnalysisHandlerTests
{
    private readonly Guid _tenantId = Guid.NewGuid();

    /// <summary>
    /// 创建测试依赖项：独立数据库 + Mock 服务
    /// </summary>
    private (AppDbContext db, Mock<IAnalysisService> analysisMock, Mock<IEventBus> eventBusMock, Mock<ISignalRNotificationService> signalRMock, RootCauseAnalysisHandler handler) CreateSut()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestRCAHandler_{Guid.NewGuid()}")
            .Options;

        var db = new AppDbContext(options, new TestTenantContext(_tenantId));
        var analysisMock = new Mock<IAnalysisService>();
        var eventBusMock = new Mock<IEventBus>();

        eventBusMock
            .Setup(e => e.PublishAsync(It.IsAny<AnalysisCompletedEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var signalRMock = new Mock<ISignalRNotificationService>();

        var spMock = new Mock<IServiceProvider>();
        spMock.Setup(sp => sp.GetService(typeof(AppDbContext))).Returns(db);
        spMock.Setup(sp => sp.GetService(typeof(ISignalRNotificationService))).Returns(signalRMock.Object);

        var scopeMock = new Mock<IServiceScope>();
        scopeMock.SetupGet(s => s.ServiceProvider).Returns(spMock.Object);

        var scopeFactoryMock = new Mock<IServiceScopeFactory>();
        scopeFactoryMock.Setup(f => f.CreateScope()).Returns(scopeMock.Object);

        var logger = LoggerFactory.Create(_ => { }).CreateLogger<RootCauseAnalysisHandler>();
        var handler = new RootCauseAnalysisHandler(
            logger, analysisMock.Object, eventBusMock.Object, scopeFactoryMock.Object);

        return (db, analysisMock, eventBusMock, signalRMock, handler);
    }

    private Core.Entities.Analysis MakeAnalysis(double confidence, string? rootCause = "测试根因")
    {
        return new Core.Entities.Analysis
        {
            TenantId = _tenantId,
            AlertId = Guid.NewGuid(),
            Confidence = confidence,
            RootCause = rootCause,
            Suggestion = "检查设备",
            Level = AnalysisLevel.L3
        };
    }

    private AlertTriggeredEvent MakeAlertEvent(Guid? deviceId = null, string metric = "temperature")
    {
        return new AlertTriggeredEvent(
            EventId: Guid.NewGuid(), OccurredAt: DateTime.UtcNow, TenantId: _tenantId,
            AlertId: Guid.NewGuid(), DeviceId: deviceId ?? Guid.NewGuid(),
            RuleId: Guid.NewGuid(), Metric: metric, Value: 100.0, Severity: "High");
    }

    private void SetupAnalysis(Mock<IAnalysisService> mock, Core.Entities.Analysis analysis)
    {
        mock.Setup(a => a.AnalyzeAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<string>(), It.IsAny<double>(), It.IsAny<MetricBaseline?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(analysis);
    }

    [Fact]
    public async Task HandleAsync_应调用AnalysisService执行分析()
    {
        var (db, analysisMock, _, _, handler) = CreateSut();
        SetupAnalysis(analysisMock, MakeAnalysis(0.8));

        var evt = MakeAlertEvent();
        await handler.HandleAsync(evt, CancellationToken.None);

        analysisMock.Verify(a => a.AnalyzeAsync(
            _tenantId, evt.AlertId, evt.DeviceId, evt.Metric, evt.Value,
            It.IsAny<MetricBaseline?>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task HandleAsync_应持久化分析结果到数据库()
    {
        var (db, analysisMock, _, _, handler) = CreateSut();
        var analysis = MakeAnalysis(0.85);
        SetupAnalysis(analysisMock, analysis);

        await handler.HandleAsync(MakeAlertEvent(), CancellationToken.None);

        var saved = await db.Analyses.IgnoreQueryFilters().ToListAsync();
        saved.Should().ContainSingle(a => a.AlertId == analysis.AlertId);
        saved[0].Confidence.Should().Be(0.85);
    }

    [Fact]
    public async Task HandleAsync_应发布AnalysisCompletedEvent()
    {
        var (db, analysisMock, eventBusMock, _, handler) = CreateSut();
        SetupAnalysis(analysisMock, MakeAnalysis(0.8));

        await handler.HandleAsync(MakeAlertEvent(), CancellationToken.None);

        eventBusMock.Verify(
            e => e.PublishAsync(It.IsAny<AnalysisCompletedEvent>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAsync_高置信度应生成候选规则()
    {
        var (db, analysisMock, _, _, handler) = CreateSut();

        var device = new Device
        {
            TenantId = _tenantId, Type = "电机",
            DeviceCode = "RCA-DEV-1", Name = "测试电机"
        };
        db.Devices.Add(device);
        await db.SaveChangesAsync();

        SetupAnalysis(analysisMock, MakeAnalysis(0.85, "轴承磨损"));

        await handler.HandleAsync(MakeAlertEvent(deviceId: device.Id), CancellationToken.None);

        var pendingRules = await db.PendingRules.IgnoreQueryFilters().ToListAsync();
        pendingRules.Should().ContainSingle();
        pendingRules[0].Confidence.Should().Be(0.85m);
        pendingRules[0].ReviewStatus.Should().Be(ReviewStatus.Pending);
    }

    [Fact]
    public async Task HandleAsync_高置信度生成候选规则后应推送让审核页实时刷新()
    {
        var (db, analysisMock, _, signalRMock, handler) = CreateSut();

        var device = new Device
        {
            TenantId = _tenantId, Type = "电机",
            DeviceCode = "RCA-PUSH-1", Name = "推送测试电机"
        };
        db.Devices.Add(device);
        await db.SaveChangesAsync();

        SetupAnalysis(analysisMock, MakeAnalysis(0.85, "轴承磨损"));

        await handler.HandleAsync(MakeAlertEvent(deviceId: device.Id), CancellationToken.None);

        // 推送候选规则产生事件，让停留在知识库审核页的专家实时看到新候选（回归 #251）。
        // 用 Invocations 逐参数断言（避 Moq Verify 闭包捕获 Guid 的间歇失败）。
        var invocations = signalRMock.Invocations
            .Where(i => i.Method.Name == nameof(ISignalRNotificationService.SendPendingRuleCreatedAsync))
            .ToList();
        invocations.Should().HaveCount(1, "高置信度生成候选规则后应推送 1 次候选规则产生事件");
        invocations[0].Arguments[0].Should().Be(_tenantId, "tenantId 参数应为告警所属租户");
    }

    /// <summary>
    /// 安全边界：事件租户与设备租户不一致时，候选规则不能写入其他租户设备类型。
    ///
    /// Why：后台候选规则生成必须绕过 HTTP 租户过滤器，但设备类型仍要按事件租户限定；
    /// 否则错误事件会把其他租户的设备类型泄露到当前租户知识库，影响后续规则审核和诊断。
    /// </summary>
    [Fact]
    public async Task HandleAsync_事件租户与设备租户不一致_候选规则不应泄露设备类型()
    {
        var (db, analysisMock, _, _, handler) = CreateSut();
        var otherTenantId = Guid.NewGuid();
        var device = new Device
        {
            TenantId = otherTenantId,
            Type = "租户A机密设备类型",
            DeviceCode = "OTHER-TENANT-RCA",
            Name = "其他租户设备",
        };
        db.Devices.Add(device);
        await db.SaveChangesAsync();

        SetupAnalysis(analysisMock, MakeAnalysis(0.85, "跨租户测试根因"));
        await handler.HandleAsync(MakeAlertEvent(deviceId: device.Id), CancellationToken.None);

        var pendingRule = await db.PendingRules
            .IgnoreQueryFilters()
            .SingleAsync();
        pendingRule.TenantId.Should().Be(_tenantId);
        pendingRule.DeviceType.Should().Be("通用",
            "跨租户设备类型不可进入当前租户候选规则");
        pendingRule.DeviceType.Should().NotBe("租户A机密设备类型");
    }

    /// <summary>
    /// 后台正向路径：当前上下文租户与事件租户不同，但设备属于事件租户时应保留正确设备类型。
    /// </summary>
    [Fact]
    public async Task HandleAsync_后台事件租户与当前上下文不同_合法设备类型应正常写入候选规则()
    {
        var (db, analysisMock, _, _, handler) = CreateSut();
        var eventTenantId = Guid.NewGuid();
        var device = new Device
        {
            TenantId = eventTenantId,
            Type = "事件租户电机",
            DeviceCode = "EVENT-TENANT-RCA",
            Name = "事件租户设备",
        };
        db.Devices.Add(device);
        await db.SaveChangesAsync();

        var analysis = MakeAnalysis(0.85, "合法后台根因");
        analysis.TenantId = eventTenantId;
        SetupAnalysis(analysisMock, analysis);
        var evt = new AlertTriggeredEvent(
            EventId: Guid.NewGuid(),
            OccurredAt: DateTime.UtcNow,
            TenantId: eventTenantId,
            AlertId: Guid.NewGuid(),
            DeviceId: device.Id,
            RuleId: Guid.NewGuid(),
            Metric: "temperature",
            Value: 100.0,
            Severity: "High");

        await handler.HandleAsync(evt, CancellationToken.None);

        var pendingRule = await db.PendingRules
            .IgnoreQueryFilters()
            .SingleAsync();
        pendingRule.TenantId.Should().Be(eventTenantId);
        pendingRule.DeviceType.Should().Be("事件租户电机",
            "后台处理应使用事件租户设备类型，而非当前 HTTP 上下文租户");
    }

    [Fact]
    public async Task HandleAsync_低置信度不应生成候选规则()
    {
        var (db, analysisMock, _, _, handler) = CreateSut();
        SetupAnalysis(analysisMock, MakeAnalysis(0.5, "不确定"));

        await handler.HandleAsync(MakeAlertEvent(), CancellationToken.None);

        var pendingRules = await db.PendingRules.IgnoreQueryFilters().ToListAsync();
        pendingRules.Should().BeEmpty();
    }

    [Fact]
    public async Task HandleAsync_根因为空不应生成候选规则()
    {
        var (db, analysisMock, _, _, handler) = CreateSut();
        SetupAnalysis(analysisMock, MakeAnalysis(0.8, rootCause: null));

        await handler.HandleAsync(MakeAlertEvent(), CancellationToken.None);

        var pendingRules = await db.PendingRules.IgnoreQueryFilters().ToListAsync();
        pendingRules.Should().BeEmpty();
    }

    [Fact]
    public async Task HandleAsync_AnalysisService异常不应抛出()
    {
        var (db, analysisMock, _, _, handler) = CreateSut();
        analysisMock.Setup(a => a.AnalyzeAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<string>(), It.IsAny<double>(), It.IsAny<MetricBaseline?>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("分析服务异常"));

        var act = () => handler.HandleAsync(MakeAlertEvent(), CancellationToken.None);
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task HandleAsync_分析阶段收到停机取消时应传播取消信号()
    {
        var (db, analysisMock, _, _, handler) = CreateSut();
        using var cts = new CancellationTokenSource();
        analysisMock.Setup(a => a.AnalyzeAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<string>(), It.IsAny<double>(), It.IsAny<MetricBaseline?>(),
                It.IsAny<CancellationToken>()))
            .Callback(() => cts.Cancel())
            .ThrowsAsync(new OperationCanceledException());

        var act = () => handler.HandleAsync(MakeAlertEvent(), cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [Fact]
    public async Task HandleAsync_有基线数据时应传递给AnalysisService()
    {
        var (db, analysisMock, _, _, handler) = CreateSut();

        var deviceId = Guid.NewGuid();
        db.MetricBaselines.Add(new MetricBaseline
        {
            // 必须设置与事件一致的 TenantId：处理器按事件租户显式过滤基线
            // （后台无 HttpContext，需 IgnoreQueryFilters + 显式 TenantId 限定）
            TenantId = _tenantId, DeviceId = deviceId, Metric = "temperature",
            AvgValue = 45.0, StdDev = 5.0, SampleCount = 100,
            PeriodStart = DateTime.UtcNow.AddDays(-7), PeriodEnd = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        SetupAnalysis(analysisMock, MakeAnalysis(0.8));

        await handler.HandleAsync(MakeAlertEvent(deviceId: deviceId, metric: "temperature"), CancellationToken.None);

        analysisMock.Verify(a => a.AnalyzeAsync(
            It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
            It.IsAny<string>(), It.IsAny<double>(),
            It.IsAny<MetricBaseline>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task HandleAsync_无基线数据时baseline参数应为null()
    {
        var (db, analysisMock, _, _, handler) = CreateSut();
        SetupAnalysis(analysisMock, MakeAnalysis(0.6));

        await handler.HandleAsync(MakeAlertEvent(), CancellationToken.None);

        analysisMock.Verify(a => a.AnalyzeAsync(
            It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
            It.IsAny<string>(), It.IsAny<double>(),
            It.Is<MetricBaseline?>(b => b == null),
            It.IsAny<CancellationToken>()), Times.Once);
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
