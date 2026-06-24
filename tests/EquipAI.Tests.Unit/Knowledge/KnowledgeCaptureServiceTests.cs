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
    private readonly Mock<IServiceProvider> _serviceProviderMock;
    private readonly Mock<ISignalRNotificationService> _signalRMock;
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

        // Mock IServiceScopeFactory，使其返回包含 AppDbContext + ISignalRNotificationService 的 scope
        _serviceProviderMock = new Mock<IServiceProvider>();
        _serviceProviderMock
            .Setup(sp => sp.GetService(typeof(AppDbContext)))
            .Returns(_db);
        _signalRMock = new Mock<ISignalRNotificationService>();
        _serviceProviderMock
            .Setup(sp => sp.GetService(typeof(ISignalRNotificationService)))
            .Returns(_signalRMock.Object);

        var scopeMock = new Mock<IServiceScope>();
        scopeMock.SetupGet(s => s.ServiceProvider).Returns(_serviceProviderMock.Object);

        _scopeFactoryMock = new Mock<IServiceScopeFactory>();
        _scopeFactoryMock
            .Setup(f => f.CreateScope())
            .Returns(scopeMock.Object);

        _llmServiceMock = new Mock<ILLMService>();

        var auditLogMock = new Mock<IAuditLogService>();
        var logger = LoggerFactory.Create(_ => { }).CreateLogger<KnowledgeCaptureService>();
        _sut = new KnowledgeCaptureService(_scopeFactoryMock.Object, _llmServiceMock.Object, auditLogMock.Object, logger);
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
    public async Task ProcessWorkOrderClosedAsync_应从关联告警和指派技术员填充案例核心检索字段()
    {
        // Arrange：关联告警（含指标快照）+ 指派技术员，验证 Symptoms/FaultData/Operator/Tags 四字段被填充。
        // 回归 #259：原创建点从不填这四字段 → 知识库故障案例核心检索维度（症状检索/指标回放/维修人追溯/分类）永远空白。
        var device = new Device
        {
            TenantId = _tenantId,
            Type = "电机",
            DeviceCode = "DEV-001",
            Name = "1号电机"
        };
        _db.Devices.Add(device);

        var alert = new Alert
        {
            TenantId = _tenantId,
            DeviceId = device.Id,
            AlertCode = "ALT-DEV001-temperature-20260101",
            Metric = "temperature",
            Severity = AlertSeverity.Critical,
            // #258 复活的 DataSnapshot 字段：告警触发时刻全量指标快照，此处作为 FaultCase.FaultData 的数据源
            DataSnapshot = """{"temperature":95.3,"pressure":1.2}"""
        };
        _db.Alerts.Add(alert);

        var technician = new User
        {
            TenantId = _tenantId,
            Username = "zhangsan",
            DisplayName = "张三"
        };
        _db.Users.Add(technician);

        var wo = new WorkOrder
        {
            TenantId = _tenantId,
            DeviceId = device.Id,
            Title = "电机过热停机",
            ActualHours = 2.0,
            AlertId = alert.Id,
            AssignedTo = technician.Id,
            Priority = WorkOrderPriority.High
        };
        _db.WorkOrders.Add(wo);
        await _db.SaveChangesAsync();

        // Act
        await _sut.ProcessWorkOrderClosedAsync(_tenantId, wo.Id, CancellationToken.None);

        // Assert：四字段从关联链填充
        var fc = (await _db.FaultCases.IgnoreQueryFilters().ToListAsync()).Single();
        fc.FaultData.Should().Be("""{"temperature":95.3,"pressure":1.2}""");
        fc.Symptoms.Should().Contain("temperature");
        fc.Operator.Should().Be("张三");
        fc.Tags.Should().Be("电机,High");
    }

    [Fact]
    public async Task ProcessWorkOrderClosedAsync_无关联告警和指派时核心字段应为空但标签仍生成()
    {
        // Arrange：手动建单（无关联告警、无指派技术员）—— FaultData/Symptoms/Operator 应优雅留空，
        // 但 Tags 由设备类型+优先级派生（数据源恒在），仍应生成。
        var device = new Device
        {
            TenantId = _tenantId,
            Type = "水泵",
            DeviceCode = "PUMP-001",
            Name = "1号水泵"
        };
        _db.Devices.Add(device);

        var wo = new WorkOrder
        {
            TenantId = _tenantId,
            DeviceId = device.Id,
            Title = "水泵定期检修",
            ActualHours = 1.5,
            Priority = WorkOrderPriority.Medium
        };
        _db.WorkOrders.Add(wo);
        await _db.SaveChangesAsync();

        // Act
        await _sut.ProcessWorkOrderClosedAsync(_tenantId, wo.Id, CancellationToken.None);

        // Assert
        var fc = (await _db.FaultCases.IgnoreQueryFilters().ToListAsync()).Single();
        fc.FaultData.Should().BeNull();
        fc.Symptoms.Should().BeNull();
        fc.Operator.Should().BeNull();
        fc.Tags.Should().Be("水泵,Medium");
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
    public async Task ProcessWorkOrderClosedAsync_高置信度生成候选规则后应推送让审核页实时刷新()
    {
        // Arrange — 高置信度工单关闭会经 LLM 生成候选规则，应推送通知知识库审核页实时刷新
        var device = new Device
        {
            TenantId = _tenantId, Type = "压缩机",
            DeviceCode = "DEV-PUSH", Name = "推送测试压缩机"
        };
        _db.Devices.Add(device);

        var analysis = new Core.Entities.Analysis
        {
            TenantId = _tenantId, DeviceId = device.Id,
            AlertId = Guid.NewGuid(), Confidence = 0.9
        };
        _db.Analyses.Add(analysis);

        var wo = new WorkOrder
        {
            TenantId = _tenantId, DeviceId = device.Id,
            Title = "温度过高", ActualHours = 3.0,
            RootCause = "冷却液不足", ExecutionReport = "补充冷却液",
            AnalysisId = analysis.Id
        };
        _db.WorkOrders.Add(wo);
        await _db.SaveChangesAsync();

        _llmServiceMock
            .Setup(llm => llm.AnalyzeAsync(It.IsAny<LLMRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new LLMResponse(
                """{"conditions":[],"conclusion":"冷却液不足","recommendedActions":["补充冷却液"]}""",
                0.9, true, null));

        // Act
        await _sut.ProcessWorkOrderClosedAsync(_tenantId, wo.Id, CancellationToken.None);

        // Assert — 推送候选规则产生事件（回归 #251）。Invocations 逐参数断言避 Moq Verify 闭包 flaky。
        var invocations = _signalRMock.Invocations
            .Where(i => i.Method.Name == nameof(ISignalRNotificationService.SendPendingRuleCreatedAsync))
            .ToList();
        invocations.Should().HaveCount(1, "高置信度生成候选规则后应推送 1 次候选规则产生事件");
        invocations[0].Arguments[0].Should().Be(_tenantId, "tenantId 参数应为工单所属租户");
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

    /// <summary>
    /// 回归 #257：ApproveRuleAsync 把 PendingRule 转 KnowledgeRule 时须复制 Confidence → ConfidenceWeight。
    /// 原实现创建 KnowledgeRule 时漏设 ConfidenceWeight（默认 0.5），丢弃 AI 分析置信度——而
    /// RootCauseAnalysisEngine.cs:85 直接用 ConfidenceWeight 作为根因分析的最终置信度，致 AI 高置信度
    /// 规则（0.85）与低置信度（0.5）在根因分析中权重相同，AI 置信度优势未体现（产品核心卖点受损）。
    /// </summary>
    [Fact]
    public async Task ApproveRuleAsync_应将候选规则置信度复制到正式规则权重()
    {
        // Arrange
        var pending = new PendingRule
        {
            TenantId = _tenantId,
            DeviceType = "电机",
            Name = "高温规则",
            Conditions = """[{"metric":"temp","operator":">","threshold":80}]""",
            Conclusion = "温度过高",
            Confidence = 0.85m, // AI 分析置信度（高置信度候选规则）
            ReviewStatus = ReviewStatus.Pending
        };
        _db.PendingRules.Add(pending);
        await _db.SaveChangesAsync();

        // Act
        await _sut.ApproveRuleAsync(pending.Id, Guid.NewGuid(), "通过验证", CancellationToken.None);

        // Assert
        var rule = await _db.KnowledgeRules.IgnoreQueryFilters().FirstAsync();
        // 必须复制 AI 置信度，而非用默认 0.5——下游 RootCauseAnalysisEngine 用此值作根因分析置信度
        rule.ConfidenceWeight.Should().Be(0.85m, "批准时应将候选规则的 AI 置信度复制到正式规则权重");
        rule.ConfidenceWeight.Should().NotBe(0.5m, "默认 0.5 会丢弃 AI 置信度，致高/低置信规则在根因分析中权重相同");
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

    [Fact]
    public async Task ProcessWorkOrderClosedAsync_低置信度不应生成候选规则但创建故障案例()
    {
        var device = new Device
        {
            TenantId = _tenantId, Type = "电机",
            DeviceCode = "DEV-LC", Name = "低置信度电机"
        };
        _db.Devices.Add(device);

        var analysis = new Core.Entities.Analysis
        {
            TenantId = _tenantId, DeviceId = device.Id,
            AlertId = Guid.NewGuid(), Confidence = 0.5
        };
        _db.Analyses.Add(analysis);

        var wo = new WorkOrder
        {
            TenantId = _tenantId, DeviceId = device.Id,
            Title = "低置信度工单", ActualHours = 2.0,
            RootCause = "磨损", ExecutionReport = "更换零件",
            AnalysisId = analysis.Id
        };
        _db.WorkOrders.Add(wo);
        await _db.SaveChangesAsync();

        await _sut.ProcessWorkOrderClosedAsync(_tenantId, wo.Id, CancellationToken.None);

        var faultCases = await _db.FaultCases.IgnoreQueryFilters().ToListAsync();
        faultCases.Should().HaveCount(1);

        var pendingRules = await _db.PendingRules.IgnoreQueryFilters().ToListAsync();
        pendingRules.Should().BeEmpty();
    }

    [Fact]
    public async Task ProcessWorkOrderClosedAsync_LLM返回无效JSON不应创建候选规则()
    {
        var device = new Device
        {
            TenantId = _tenantId, Type = "泵",
            DeviceCode = "DEV-BADJSON", Name = "无效JSON泵"
        };
        _db.Devices.Add(device);

        var analysis = new Core.Entities.Analysis
        {
            TenantId = _tenantId, DeviceId = device.Id,
            AlertId = Guid.NewGuid(), Confidence = 0.9
        };
        _db.Analyses.Add(analysis);

        var wo = new WorkOrder
        {
            TenantId = _tenantId, DeviceId = device.Id,
            Title = "LLM无效JSON工单", ActualHours = 1.5,
            RootCause = "原因", ExecutionReport = "报告",
            AnalysisId = analysis.Id
        };
        _db.WorkOrders.Add(wo);
        await _db.SaveChangesAsync();

        _llmServiceMock
            .Setup(llm => llm.AnalyzeAsync(It.IsAny<LLMRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new LLMResponse("this is not json", 0.9, true, null));

        await _sut.ProcessWorkOrderClosedAsync(_tenantId, wo.Id, CancellationToken.None);

        var faultCases = await _db.FaultCases.IgnoreQueryFilters().ToListAsync();
        faultCases.Should().HaveCount(1);

        var pendingRules = await _db.PendingRules.IgnoreQueryFilters().ToListAsync();
        pendingRules.Should().BeEmpty();
    }

    [Fact]
    public async Task ProcessWorkOrderClosedAsync_无关联分析只创建故障案例()
    {
        var device = new Device
        {
            TenantId = _tenantId, Type = "电机",
            DeviceCode = "DEV-NOA", Name = "无分析电机"
        };
        _db.Devices.Add(device);

        var wo = new WorkOrder
        {
            TenantId = _tenantId, DeviceId = device.Id,
            Title = "无分析工单", ActualHours = 1.5,
            RootCause = "原因", ExecutionReport = "报告"
        };
        _db.WorkOrders.Add(wo);
        await _db.SaveChangesAsync();

        await _sut.ProcessWorkOrderClosedAsync(_tenantId, wo.Id, CancellationToken.None);

        var faultCases = await _db.FaultCases.IgnoreQueryFilters().ToListAsync();
        faultCases.Should().HaveCount(1);

        var pendingRules = await _db.PendingRules.IgnoreQueryFilters().ToListAsync();
        pendingRules.Should().BeEmpty();
    }

    [Fact]
    public async Task ProcessWorkOrderClosedAsync_设备不存在时DeviceType应为未知()
    {
        var wo = new WorkOrder
        {
            TenantId = _tenantId, DeviceId = Guid.NewGuid(),
            Title = "无设备工单", ActualHours = 2.0,
            RootCause = "原因", ExecutionReport = "报告"
        };
        _db.WorkOrders.Add(wo);
        await _db.SaveChangesAsync();

        await _sut.ProcessWorkOrderClosedAsync(_tenantId, wo.Id, CancellationToken.None);

        var faultCases = await _db.FaultCases.IgnoreQueryFilters().ToListAsync();
        faultCases.Should().HaveCount(1);
        faultCases[0].DeviceType.Should().Be("未知");
    }

    [Fact]
    public async Task ProcessWorkOrderClosedAsync_RootCause为空应使用默认值未记录()
    {
        var device = new Device
        {
            TenantId = _tenantId, Type = "电机",
            DeviceCode = "DEV-NRC", Name = "无根因电机"
        };
        _db.Devices.Add(device);

        var wo = new WorkOrder
        {
            TenantId = _tenantId, DeviceId = device.Id,
            Title = "无根因工单", ActualHours = 1.5,
            RootCause = null, ExecutionReport = null
        };
        _db.WorkOrders.Add(wo);
        await _db.SaveChangesAsync();

        await _sut.ProcessWorkOrderClosedAsync(_tenantId, wo.Id, CancellationToken.None);

        var faultCases = await _db.FaultCases.IgnoreQueryFilters().ToListAsync();
        faultCases.Should().HaveCount(1);
        faultCases[0].RootCause.Should().Be("未记录");
        faultCases[0].Solution.Should().Be("未记录");
    }

    [Fact]
    public async Task RejectRuleAsync_不存在的候选规则应抛出异常()
    {
        var act = () => _sut.RejectRuleAsync(Guid.NewGuid(), Guid.NewGuid(), "不存在", CancellationToken.None);
        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task BatchApproveAsync_应批量批准候选规则()
    {
        // Arrange
        var pending1 = new PendingRule
        {
            TenantId = _tenantId, DeviceType = "电机", Name = "批量规则1",
            Conditions = "[]", Conclusion = "测试", ReviewStatus = ReviewStatus.Pending
        };
        var pending2 = new PendingRule
        {
            TenantId = _tenantId, DeviceType = "泵", Name = "批量规则2",
            Conditions = "[]", Conclusion = "测试", ReviewStatus = ReviewStatus.Pending
        };
        _db.PendingRules.AddRange(pending1, pending2);
        await _db.SaveChangesAsync();

        var reviewerId = Guid.NewGuid();

        // Act
        var result = await _sut.BatchApproveAsync(
            [pending1.Id, pending2.Id], reviewerId, "批量批准", CancellationToken.None);

        // Assert
        result.SuccessCount.Should().Be(2);
        result.FailCount.Should().Be(0);

        var rules = await _db.KnowledgeRules.IgnoreQueryFilters().ToListAsync();
        rules.Should().HaveCount(2);
    }

    [Fact]
    public async Task BatchApproveAsync_部分失败应返回混合结果()
    {
        // Arrange
        var pending = new PendingRule
        {
            TenantId = _tenantId, DeviceType = "电机", Name = "存在规则",
            Conditions = "[]", Conclusion = "测试", ReviewStatus = ReviewStatus.Pending
        };
        _db.PendingRules.Add(pending);
        await _db.SaveChangesAsync();

        var notExistId = Guid.NewGuid();

        // Act
        var result = await _sut.BatchApproveAsync(
            [pending.Id, notExistId], Guid.NewGuid(), null, CancellationToken.None);

        // Assert
        result.SuccessCount.Should().Be(1);
        result.FailCount.Should().Be(1);
        result.Errors.Should().HaveCount(1);
        result.Errors[0].Id.Should().Be(notExistId);
    }

    [Fact]
    public async Task BatchRejectAsync_应批量驳回候选规则()
    {
        // Arrange
        var pending1 = new PendingRule
        {
            TenantId = _tenantId, DeviceType = "电机", Name = "批量驳回1",
            Conditions = "[]", Conclusion = "测试", ReviewStatus = ReviewStatus.Pending
        };
        var pending2 = new PendingRule
        {
            TenantId = _tenantId, DeviceType = "泵", Name = "批量驳回2",
            Conditions = "[]", Conclusion = "测试", ReviewStatus = ReviewStatus.Pending
        };
        _db.PendingRules.AddRange(pending1, pending2);
        await _db.SaveChangesAsync();

        var reviewerId = Guid.NewGuid();

        // Act
        var result = await _sut.BatchRejectAsync(
            [pending1.Id, pending2.Id], reviewerId, "批量驳回", CancellationToken.None);

        // Assert
        result.SuccessCount.Should().Be(2);
        result.FailCount.Should().Be(0);

        // 不应创建正式规则
        var rules = await _db.KnowledgeRules.IgnoreQueryFilters().ToListAsync();
        rules.Should().BeEmpty();

        // 候选规则状态应为 Rejected
        var updated = await _db.PendingRules.IgnoreQueryFilters().ToListAsync();
        updated.Should().OnlyContain(p => p.ReviewStatus == ReviewStatus.Rejected);
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
