using EquipAI.Application.Analysis;
using FluentAssertions;
using Xunit;

namespace EquipAI.Tests.Unit.Analysis;

public class DataQualityServiceTests
{
    private readonly DataQualityService _service;

    public DataQualityServiceTests()
    {
        _service = new DataQualityService();
    }

    [Fact]
    public async Task CalculateScoreAsync_WithNoData_ReturnsDefaultValue()
    {
        // 无数据时返回保守默认值 0.5
        var score = await _service.CalculateScoreAsync(
            Guid.NewGuid(), Guid.NewGuid(), "temperature");

        score.Should().Be(0.5);
    }

    [Fact]
    public async Task CalculateScoreAsync_ReturnsValueBetweenZeroAndOne()
    {
        var score = await _service.CalculateScoreAsync(
            Guid.NewGuid(), Guid.NewGuid(), "temperature");

        score.Should().BeInRange(0.0, 1.0);
    }
}
