using EquipAI.Application.Analysis;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace EquipAI.Tests.Unit.Analysis;

public class RootCauseAnalysisEngineTests
{
    private readonly Mock<ILLMService> _mockLLMService;
    private readonly Mock<IDataQualityService> _mockDataQuality;
    private readonly Mock<IRuleEngineAnalysisService> _mockRuleEngine;
    private readonly Mock<IMlAnomalyDetectionService> _mockMlService;
    private readonly RootCauseAnalysisEngine _engine;

    public RootCauseAnalysisEngineTests()
    {
        _mockLLMService = new Mock<ILLMService>();
        _mockDataQuality = new Mock<IDataQualityService>();
        _mockRuleEngine = new Mock<IRuleEngineAnalysisService>();
        _mockMlService = new Mock<IMlAnomalyDetectionService>();

        // 默认行为：L4 和 L2 都返回 null，让降级链继续
        _mockMlService.Setup(m => m.DetectAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<double>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((MlAnomalyResult?)null);
        _mockRuleEngine.Setup(r => r.MatchRuleAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<double>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RuleMatchResult?)null);

        _engine = new RootCauseAnalysisEngine(
            _mockLLMService.Object,
            _mockDataQuality.Object,
            _mockRuleEngine.Object,
            _mockMlService.Object,
            Mock.Of<ILogger<RootCauseAnalysisEngine>>());
    }

    private static MetricBaseline CreateBaseline(double avg = 50, double stdDev = 5, int count = 200)
    {
        return new MetricBaseline { AvgValue = avg, StdDev = stdDev, SampleCount = count };
    }

    [Fact]
    public async Task AnalyzeAsync_WithMlAnomaly_UsesL4()
    {
        // L4 检测到异常 → 应该使用 L4
        _mockDataQuality.Setup(d => d.CalculateScoreAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(0.8);
        _mockMlService.Setup(m => m.DetectAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<double>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new MlAnomalyResult(true, 0.85, 50.0, "ML 检测到异常"));

        var result = await _engine.AnalyzeAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "temperature", 75.0, CreateBaseline());

        result.Level.Should().Be(AnalysisLevel.L4);
        result.Status.Should().Be(AnalysisStatus.Completed);
        result.Confidence.Should().BeGreaterThan(0);
        // L4 成功后不应调用 L2、L3、L1
        _mockRuleEngine.Verify(r => r.MatchRuleAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<double>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockLLMService.Verify(l => l.AnalyzeAsync(It.IsAny<LLMRequest>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task AnalyzeAsync_MlNoAnomaly_RuleMatch_UsesL2()
    {
        // L4 未检测到异常，L2 规则匹配 → 应该使用 L2
        _mockDataQuality.Setup(d => d.CalculateScoreAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(0.8);
        _mockMlService.Setup(m => m.DetectAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<double>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new MlAnomalyResult(false, 0.1, 50.0, "ML 检测正常"));
        _mockRuleEngine.Setup(r => r.MatchRuleAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<double>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RuleMatchResult(Guid.NewGuid(), "温度过高规则", "设备温度异常", "检查散热", null, 0.8));

        var result = await _engine.AnalyzeAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "temperature", 75.0, CreateBaseline());

        result.Level.Should().Be(AnalysisLevel.L2);
        result.RuleId.Should().NotBeNull();
        _mockLLMService.Verify(l => l.AnalyzeAsync(It.IsAny<LLMRequest>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task AnalyzeAsync_WithBaselineAndHighQuality_UsesL3()
    {
        // L4 返回 null，L2 返回 null → 降级到 L3 统计分析
        var baseline = CreateBaseline();
        _mockDataQuality.Setup(d => d.CalculateScoreAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(0.8);

        var result = await _engine.AnalyzeAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "temperature", 75.0, baseline);

        result.Level.Should().Be(AnalysisLevel.L3);
        result.Status.Should().Be(AnalysisStatus.Completed);
        result.Confidence.Should().BeGreaterThan(0);
        _mockLLMService.Verify(l => l.AnalyzeAsync(It.IsAny<LLMRequest>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task AnalyzeAsync_WithBaselineButLowQuality_UsesL1()
    {
        // L4、L2 都无结果，数据质量低 → 降级到 L1
        var baseline = CreateBaseline();
        _mockDataQuality.Setup(d => d.CalculateScoreAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(0.4);
        _mockLLMService.Setup(l => l.AnalyzeAsync(It.IsAny<LLMRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new LLMResponse("根因：设备过热", 0.7, true, null));

        var result = await _engine.AnalyzeAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "temperature", 75.0, baseline);

        result.Level.Should().Be(AnalysisLevel.L1);
        _mockLLMService.Verify(l => l.AnalyzeAsync(It.IsAny<LLMRequest>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AnalyzeAsync_WithoutBaseline_UsesL1()
    {
        // L4、L2 都无结果，无基线 → 降级到 L1
        _mockDataQuality.Setup(d => d.CalculateScoreAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(0.9);
        _mockLLMService.Setup(l => l.AnalyzeAsync(It.IsAny<LLMRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new LLMResponse("根因：未知", 0.5, true, null));

        var result = await _engine.AnalyzeAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "temperature", 75.0, null);

        result.Level.Should().Be(AnalysisLevel.L1);
    }

    [Fact]
    public async Task AnalyzeAsync_LLMFailure_ReturnsFailedStatus()
    {
        // L4、L2 都无结果，降级到 L1 但 LLM 失败
        _mockDataQuality.Setup(d => d.CalculateScoreAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(0.5);
        _mockLLMService.Setup(l => l.AnalyzeAsync(It.IsAny<LLMRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new LLMResponse("", null, false, "超时"));

        var result = await _engine.AnalyzeAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "temperature", 75.0, null);

        result.Status.Should().Be(AnalysisStatus.Failed);
        result.Level.Should().Be(AnalysisLevel.L1);
    }

    [Fact]
    public async Task AnalyzeAsync_SetsProcessingTime()
    {
        _mockDataQuality.Setup(d => d.CalculateScoreAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(0.5);
        _mockLLMService.Setup(l => l.AnalyzeAsync(It.IsAny<LLMRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new LLMResponse("分析结果", 0.6, true, null));

        var result = await _engine.AnalyzeAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "temperature", 75.0, null);

        result.ProcessingTimeMs.Should().BeGreaterOrEqualTo(0);
    }
}
