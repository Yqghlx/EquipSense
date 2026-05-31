using EquipAI.Application.Analysis;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace EquipAI.Tests.Unit.Analysis;

public class RootCauseAnalysisEngineTests
{
    private readonly Mock<ILLMService> _mockLLMService;
    private readonly Mock<IDataQualityService> _mockDataQuality;
    private readonly RootCauseAnalysisEngine _engine;

    public RootCauseAnalysisEngineTests()
    {
        _mockLLMService = new Mock<ILLMService>();
        _mockDataQuality = new Mock<IDataQualityService>();
        _engine = new RootCauseAnalysisEngine(_mockLLMService.Object, _mockDataQuality.Object);
    }

    private static MetricBaseline CreateBaseline(double avg = 50, double stdDev = 5, int count = 200)
    {
        return new MetricBaseline { AvgValue = avg, StdDev = stdDev, SampleCount = count };
    }

    [Fact]
    public async Task AnalyzeAsync_WithBaselineAndHighQuality_UsesL3()
    {
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
