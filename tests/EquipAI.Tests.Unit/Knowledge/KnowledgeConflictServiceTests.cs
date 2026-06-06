using EquipAI.Application.Knowledge;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace EquipAI.Tests.Unit.Knowledge;

public class KnowledgeConflictServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly KnowledgeConflictService _service;
    private readonly Guid _tenantId;

    public KnowledgeConflictServiceTests()
    {
        _tenantId = Guid.NewGuid();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"KnowledgeConflict_{Guid.NewGuid()}")
            .Options;

        _db = new AppDbContext(options, new TestTenantContext(_tenantId));
        var logger = LoggerFactory.Create(_ => { }).CreateLogger<KnowledgeConflictService>();
        _service = new KnowledgeConflictService(_db, logger);
    }

    public void Dispose()
    {
        _db.Dispose();
    }

    // =========================================================================
    // ParseMetricNames
    // =========================================================================

    [Fact]
    public void ParseMetricNames_数组条件_应返回指标名列表()
    {
        var json = "[{\"metric\":\"temperature\",\"operator\":\">\",\"threshold\":80},{\"metric\":\"vibration\",\"operator\":\">\",\"threshold\":5}]";
        var result = KnowledgeConflictService.ParseMetricNames(json);

        result.Should().HaveCount(2);
        result.Should().Contain("temperature");
        result.Should().Contain("vibration");
    }

    [Fact]
    public void ParseMetricNames_单对象条件_应返回单个指标名()
    {
        var json = "{\"metric\":\"pressure\",\"operator\":\">\",\"threshold\":100}";
        var result = KnowledgeConflictService.ParseMetricNames(json);

        result.Should().ContainSingle("pressure");
    }

    [Fact]
    public void ParseMetricNames_空字符串_应返回空列表()
    {
        KnowledgeConflictService.ParseMetricNames("").Should().BeEmpty();
    }

    [Fact]
    public void ParseMetricNames_null_应返回空列表()
    {
        KnowledgeConflictService.ParseMetricNames(null).Should().BeEmpty();
    }

    [Fact]
    public void ParseMetricNames_无效JSON_应返回空列表不抛异常()
    {
        KnowledgeConflictService.ParseMetricNames("not valid json {{{").Should().BeEmpty();
    }

    // =========================================================================
    // DetectConflictsAsync
    // =========================================================================

    [Fact]
    public async Task DetectConflictsAsync_无已有规则_应返回空列表()
    {
        var result = await _service.DetectConflictsAsync(
            _tenantId, "pump",
            "[{\"metric\":\"temperature\",\"operator\":\">\",\"threshold\":80}]",
            null, CancellationToken.None);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task DetectConflictsAsync_有重叠指标_应返回冲突()
    {
        var existingRule = new KnowledgeRule
        {
            TenantId = _tenantId,
            DeviceType = "pump",
            Name = "水泵温度告警规则",
            Conditions = "[{\"metric\":\"temperature\",\"operator\":\">\",\"threshold\":90}]",
            Conclusion = "温度过高",
            Source = "expert",
            Enabled = true
        };
        _db.KnowledgeRules.Add(existingRule);
        await _db.SaveChangesAsync();

        var result = await _service.DetectConflictsAsync(
            _tenantId, "pump",
            "[{\"metric\":\"temperature\",\"operator\":\">\",\"threshold\":80}]",
            null, CancellationToken.None);

        result.Should().HaveCount(1);
        result[0].RuleId.Should().Be(existingRule.Id);
        result[0].RuleName.Should().Be("水泵温度告警规则");
        result[0].OverlappingMetrics.Should().Contain("temperature");
    }

    [Fact]
    public async Task DetectConflictsAsync_排除指定规则_应排除自身()
    {
        var rule = new KnowledgeRule
        {
            TenantId = _tenantId,
            DeviceType = "motor",
            Name = "电机振动规则",
            Conditions = "[{\"metric\":\"vibration\",\"operator\":\">\",\"threshold\":5}]",
            Conclusion = "振动过大",
            Source = "expert",
            Enabled = true
        };
        _db.KnowledgeRules.Add(rule);
        await _db.SaveChangesAsync();

        var result = await _service.DetectConflictsAsync(
            _tenantId, "motor",
            "[{\"metric\":\"vibration\",\"operator\":\">\",\"threshold\":6}]",
            rule.Id,
            CancellationToken.None);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task DetectConflictsAsync_无重叠指标_应返回空列表()
    {
        var rule = new KnowledgeRule
        {
            TenantId = _tenantId,
            DeviceType = "pump",
            Name = "水泵压力规则",
            Conditions = "[{\"metric\":\"pressure\",\"operator\":\">\",\"threshold\":100}]",
            Conclusion = "压力过大",
            Source = "expert",
            Enabled = true
        };
        _db.KnowledgeRules.Add(rule);
        await _db.SaveChangesAsync();

        var result = await _service.DetectConflictsAsync(
            _tenantId, "pump",
            "[{\"metric\":\"temperature\",\"operator\":\">\",\"threshold\":80}]",
            null, CancellationToken.None);

        result.Should().BeEmpty();
    }

    /// <summary>
    /// 测试用租户上下文
    /// </summary>
    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode { get; } = "shared";
        public bool IsSystemAdmin { get; } = false;
        public Guid UserId { get; } = Guid.NewGuid();
    }
}
