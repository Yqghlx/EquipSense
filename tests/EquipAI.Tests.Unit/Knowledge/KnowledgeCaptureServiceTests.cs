using EquipAI.Application.Knowledge;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace EquipAI.Tests.Unit.Knowledge;

public class KnowledgeCaptureServiceTests
{
    private readonly Mock<IServiceScopeFactory> _scopeFactoryMock;
    private readonly Mock<ILLMService> _llmServiceMock;
    private readonly AppDbContext _db;
    private readonly Guid _tenantId;
    private readonly KnowledgeCaptureService _sut;

    public KnowledgeCaptureServiceTests()
    {
        // 使用固定的租户 ID，确保测试数据与全局过滤器一致
        _tenantId = Guid.NewGuid();

        // 创建 InMemory 数据库
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestKnowledgeCapture_{Guid.NewGuid()}")
            .Options;

        _db = new AppDbContext(options, new TestTenantContext(_tenantId));

        // Mock IServiceScopeFactory，使其返回包含 AppDbContext 的 scope
        var serviceProviderMock = new Mock<IServiceProvider>();
        serviceProviderMock
            .Setup(sp => sp.GetService(typeof(AppDbContext)))
            .Returns(_db);

        var scopeMock = new Mock<IServiceScope>();
        scopeMock.SetupGet(s => s.ServiceProvider).Returns(serviceProviderMock.Object);

        _scopeFactoryMock = new Mock<IServiceScopeFactory>();
        _scopeFactoryMock
            .Setup(f => f.CreateScope())
            .Returns(scopeMock.Object);

        _llmServiceMock = new Mock<ILLMService>();

        var logger = LoggerFactory.Create(_ => { }).CreateLogger<KnowledgeCaptureService>();
        _sut = new KnowledgeCaptureService(_scopeFactoryMock.Object, _llmServiceMock.Object, logger);
    }

    [Fact]
    public async Task ProcessWorkOrderClosedAsync_应创建故障案例()
    {
        // Arrange
        var device = new Device
        {
            TenantId = _tenantId,
            Type = "电机",
            DeviceCode = "DEV-001",
            Name = "1号电机"
        };
        _db.Devices.Add(device);

        var wo = new WorkOrder
        {
            TenantId = _tenantId,
            DeviceId = device.Id,
            Title = "电机异常振动",
            ActualHours = 2.0,
            RootCause = "轴承磨损",
            ExecutionReport = "更换轴承",
            RequiredParts = """["轴承6205"]"""
        };
        _db.WorkOrders.Add(wo);
        await _db.SaveChangesAsync();

        // Act
        await _sut.ProcessWorkOrderClosedAsync(_tenantId, wo.Id, CancellationToken.None);

        // Assert
        var faultCases = await _db.FaultCases.IgnoreQueryFilters().ToListAsync();
        faultCases.Should().HaveCount(1);
        var fc = faultCases[0];
        fc.DeviceId.Should().Be(device.Id);
        fc.DeviceType.Should().Be("电机");
        fc.FaultDescription.Should().Be("电机异常振动");
        fc.RootCause.Should().Be("轴承磨损");
        fc.Solution.Should().Be("更换轴承");
        fc.RepairDurationMinutes.Should().Be(120);
        fc.PartsUsed.Should().Be("""["轴承6205"]""");
        fc.SourceWorkorderId.Should().Be(wo.Id);
        fc.IsVerified.Should().BeFalse();
    }

    [Fact]
    public async Task ProcessWorkOrderClosedAsync_工单时长不足应跳过()
    {
        // Arrange
        var device = new Device
        {
            TenantId = _tenantId,
            Type = "泵",
            DeviceCode = "DEV-002",
            Name = "2号泵"
        };
        _db.Devices.Add(device);

        var wo = new WorkOrder
        {
            TenantId = _tenantId,
            DeviceId = device.Id,
            Title = "轻微异响",
            ActualHours = 0.2 // 低于 0.5 小时阈值
        };
        _db.WorkOrders.Add(wo);
        await _db.SaveChangesAsync();

        // Act
        await _sut.ProcessWorkOrderClosedAsync(_tenantId, wo.Id, CancellationToken.None);

        // Assert
        var faultCases = await _db.FaultCases.IgnoreQueryFilters().ToListAsync();
        faultCases.Should().BeEmpty();
    }

    [Fact]
    public async Task ProcessWorkOrderClosedAsync_工单不存在应直接返回()
    {
        // Act — 不应抛异常，仅记录警告日志
        var act = () => _sut.ProcessWorkOrderClosedAsync(_tenantId, Guid.NewGuid(), CancellationToken.None);

        // Assert
        await act.Should().NotThrowAsync();
        var faultCases = await _db.FaultCases.IgnoreQueryFilters().ToListAsync();
        faultCases.Should().BeEmpty();
    }

    [Fact]
    public async Task ProcessWorkOrderClosedAsync_高置信度时应生成候选规则()
    {
        // Arrange
        var device = new Device
        {
            TenantId = _tenantId,
            Type = "压缩机",
            DeviceCode = "DEV-003",
            Name = "3号压缩机"
        };
        _db.Devices.Add(device);

        var analysis = new Core.Entities.Analysis
        {
            TenantId = _tenantId,
            DeviceId = device.Id,
            AlertId = Guid.NewGuid(),
            Confidence = 0.9 // 高于 0.8 阈值
        };
        _db.Analyses.Add(analysis);

        var wo = new WorkOrder
        {
            TenantId = _tenantId,
            DeviceId = device.Id,
            Title = "压缩机温度过高",
            ActualHours = 3.0,
            RootCause = "冷却液不足",
            ExecutionReport = "补充冷却液",
            AnalysisId = analysis.Id
        };
        _db.WorkOrders.Add(wo);
        await _db.SaveChangesAsync();

        // Mock LLM 返回有效 JSON
        _llmServiceMock
            .Setup(llm => llm.AnalyzeAsync(It.IsAny<LLMRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new LLMResponse(
                """{"conditions":[{"metric":"temperature","operator":">","threshold":85}],"conclusion":"冷却液不足导致温度过高","recommendedActions":["检查冷却液位","补充冷却液"],"checkSteps":["检查冷却液位","检查散热器"]}""",
                0.9,
                true,
                null));

        // Act
        await _sut.ProcessWorkOrderClosedAsync(_tenantId, wo.Id, CancellationToken.None);

        // Assert
        var pendingRules = await _db.PendingRules.IgnoreQueryFilters().ToListAsync();
        pendingRules.Should().HaveCount(1);
        var rule = pendingRules[0];
        rule.DeviceType.Should().Be("压缩机");
        rule.Conclusion.Should().Be("冷却液不足导致温度过高");
        rule.ReviewStatus.Should().Be(ReviewStatus.Pending);
        rule.SourceWorkorderId.Should().Be(wo.Id);
        rule.Confidence.Should().Be(0.9m);
    }

    [Fact]
    public async Task ProcessWorkOrderClosedAsync_LLM失败时不应创建候选规则()
    {
        // Arrange
        var device = new Device
        {
            TenantId = _tenantId,
            Type = "电机",
            DeviceCode = "DEV-004",
            Name = "4号电机"
        };
        _db.Devices.Add(device);

        var analysis = new Core.Entities.Analysis
        {
            TenantId = _tenantId,
            DeviceId = device.Id,
            AlertId = Guid.NewGuid(),
            Confidence = 0.95
        };
        _db.Analyses.Add(analysis);

        var wo = new WorkOrder
        {
            TenantId = _tenantId,
            DeviceId = device.Id,
            Title = "电机过热",
            ActualHours = 1.5,
            AnalysisId = analysis.Id
        };
        _db.WorkOrders.Add(wo);
        await _db.SaveChangesAsync();

        // Mock LLM 返回失败
        _llmServiceMock
            .Setup(llm => llm.AnalyzeAsync(It.IsAny<LLMRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new LLMResponse(string.Empty, null, false, "服务不可用"));

        // Act
        await _sut.ProcessWorkOrderClosedAsync(_tenantId, wo.Id, CancellationToken.None);

        // Assert — 故障案例应创建，但不应有候选规则
        var faultCases = await _db.FaultCases.IgnoreQueryFilters().ToListAsync();
        faultCases.Should().HaveCount(1);

        var pendingRules = await _db.PendingRules.IgnoreQueryFilters().ToListAsync();
        pendingRules.Should().BeEmpty();
    }

    [Fact]
    public async Task ApproveRuleAsync_应创建正式规则并更新候选状态()
    {
        // Arrange
        var pending = new PendingRule
        {
            TenantId = _tenantId,
            DeviceType = "电机",
            Name = "测试规则",
            Conditions = """[{"metric":"temp","operator":">","threshold":80}]""",
            Conclusion = "温度过高",
            ReviewStatus = ReviewStatus.Pending
        };
        _db.PendingRules.Add(pending);
        await _db.SaveChangesAsync();

        var reviewerId = Guid.NewGuid();

        // Act
        await _sut.ApproveRuleAsync(pending.Id, reviewerId, "通过验证", CancellationToken.None);

        // Assert
        var knowledgeRules = await _db.KnowledgeRules.IgnoreQueryFilters().ToListAsync();
        knowledgeRules.Should().HaveCount(1);
        var rule = knowledgeRules[0];
        rule.DeviceType.Should().Be("电机");
        rule.Name.Should().Be("测试规则");
        rule.Source.Should().Be("ai_generated");
        rule.Enabled.Should().BeTrue();

        // 验证候选规则状态已更新
        var updatedPending = await _db.PendingRules.IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.Id == pending.Id);
        updatedPending.Should().NotBeNull();
        updatedPending!.ReviewStatus.Should().Be(ReviewStatus.Approved);
        updatedPending.ReviewedBy.Should().Be(reviewerId);
        updatedPending.ReviewComment.Should().Be("通过验证");
        updatedPending.ReviewedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task ApproveRuleAsync_已审核规则应抛出异常()
    {
        // Arrange
        var pending = new PendingRule
        {
            TenantId = _tenantId,
            DeviceType = "泵",
            Name = "已审核规则",
            Conditions = "[]",
            Conclusion = "测试",
            ReviewStatus = ReviewStatus.Approved // 已批准
        };
        _db.PendingRules.Add(pending);
        await _db.SaveChangesAsync();

        // Act
        var act = () => _sut.ApproveRuleAsync(pending.Id, Guid.NewGuid(), null, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*已审核*");
    }

    [Fact]
    public async Task RejectRuleAsync_应更新候选规则状态为驳回()
    {
        // Arrange
        var pending = new PendingRule
        {
            TenantId = _tenantId,
            DeviceType = "压缩机",
            Name = "待驳回规则",
            Conditions = "[]",
            Conclusion = "测试",
            ReviewStatus = ReviewStatus.Pending
        };
        _db.PendingRules.Add(pending);
        await _db.SaveChangesAsync();

        var reviewerId = Guid.NewGuid();

        // Act
        await _sut.RejectRuleAsync(pending.Id, reviewerId, "规则不准确", CancellationToken.None);

        // Assert
        var updatedPending = await _db.PendingRules.IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.Id == pending.Id);
        updatedPending.Should().NotBeNull();
        updatedPending!.ReviewStatus.Should().Be(ReviewStatus.Rejected);
        updatedPending.ReviewedBy.Should().Be(reviewerId);
        updatedPending.ReviewComment.Should().Be("规则不准确");
        updatedPending.ReviewedAt.Should().NotBeNull();

        // 驳回时不应创建正式规则
        var knowledgeRules = await _db.KnowledgeRules.IgnoreQueryFilters().ToListAsync();
        knowledgeRules.Should().BeEmpty();
    }

    [Fact]
    public async Task ApproveRuleAsync_不存在的候选规则应抛出异常()
    {
        // Act
        var act = () => _sut.ApproveRuleAsync(Guid.NewGuid(), Guid.NewGuid(), null, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    /// <summary>
    /// 测试用租户上下文，使用指定的租户 ID
    /// </summary>
    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId)
        {
            TenantId = tenantId;
        }

        public Guid TenantId { get; }
        public string IsolationMode { get; } = "shared";
        public bool IsSystemAdmin { get; } = false;
        public Guid UserId { get; } = Guid.NewGuid();
    }
}
