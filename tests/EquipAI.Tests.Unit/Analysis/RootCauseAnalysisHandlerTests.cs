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
    private (AppDbContext db, Mock<IAnalysisService> analysisMock, Mock<IEventBus> eventBusMock, RootCauseAnalysisHandler handler) CreateSut()
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

        var spMock = new Mock<IServiceProvider>();
        spMock.Setup(sp => sp.GetService(typeof(AppDbContext))).Returns(db);

        var scopeMock = new Mock<IServiceScope>();
        scopeMock.SetupGet(s => s.ServiceProvider).Returns(spMock.Object);

        var scopeFactoryMock = new Mock<IServiceScopeFactory>();
        scopeFactoryMock.Setup(f => f.CreateScope()).Returns(scopeMock.Object);

        var logger = LoggerFactory.Create(_ => { }).CreateLogger<RootCauseAnalysisHandler>();
        var handler = new RootCauseAnalysisHandler(
            logger, analysisMock.Object, eventBusMock.Object, scopeFactoryMock.Object);

        return (db, analysisMock, eventBusMock, handler);
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
        var (db, analysisMock, _, handler) = CreateSut();
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
        var (db, analysisMock, _, handler) = CreateSut();
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
        var (db, analysisMock, eventBusMock, handler) = CreateSut();
        SetupAnalysis(analysisMock, MakeAnalysis(0.8));

        await handler.HandleAsync(MakeAlertEvent(), CancellationToken.None);

        eventBusMock.Verify(
            e => e.PublishAsync(It.IsAny<AnalysisCompletedEvent>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleAsync_高置信度应生成候选规则()
    {
        var (db, analysisMock, _, handler) = CreateSut();

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
    public async Task HandleAsync_低置信度不应生成候选规则()
    {
        var (db, analysisMock, _, handler) = CreateSut();
        SetupAnalysis(analysisMock, MakeAnalysis(0.5, "不确定"));

        await handler.HandleAsync(MakeAlertEvent(), CancellationToken.None);

        var pendingRules = await db.PendingRules.IgnoreQueryFilters().ToListAsync();
        pendingRules.Should().BeEmpty();
    }

    [Fact]
    public async Task HandleAsync_根因为空不应生成候选规则()
    {
        var (db, analysisMock, _, handler) = CreateSut();
        SetupAnalysis(analysisMock, MakeAnalysis(0.8, rootCause: null));

        await handler.HandleAsync(MakeAlertEvent(), CancellationToken.None);

        var pendingRules = await db.PendingRules.IgnoreQueryFilters().ToListAsync();
        pendingRules.Should().BeEmpty();
    }

    [Fact]
    public async Task HandleAsync_AnalysisService异常不应抛出()
    {
        var (db, analysisMock, _, handler) = CreateSut();
        analysisMock.Setup(a => a.AnalyzeAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<string>(), It.IsAny<double>(), It.IsAny<MetricBaseline?>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("分析服务异常"));

        var act = () => handler.HandleAsync(MakeAlertEvent(), CancellationToken.None);
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task HandleAsync_有基线数据时应传递给AnalysisService()
    {
        var (db, analysisMock, _, handler) = CreateSut();

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
        var (db, analysisMock, _, handler) = CreateSut();
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
