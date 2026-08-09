using System.Text.Json;
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

public class KnowledgeVersionServiceTests
{
    private readonly AppDbContext _db;
    private readonly KnowledgeVersionService _sut;
    private readonly Mock<IAuditLogService> _auditLogMock;
    private readonly Guid _tenantId;

    public KnowledgeVersionServiceTests()
    {
        // 使用固定的租户 ID，确保测试数据与全局过滤器一致
        _tenantId = Guid.NewGuid();

        // 创建 InMemory 数据库
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestKnowledgeVersion_{Guid.NewGuid()}")
            .Options;

        _db = new AppDbContext(options, new TestTenantContext(_tenantId));

        _auditLogMock = new Mock<IAuditLogService>();
        var logger = LoggerFactory.Create(_ => { }).CreateLogger<KnowledgeVersionService>();
        _sut = new KnowledgeVersionService(_db, _auditLogMock.Object, logger);
    }

    [Fact]
    public async Task CreateVersionSnapshotAsync_应创建快照并序列化所有字段()
    {
        // Arrange
        var rule = new KnowledgeRule
        {
            TenantId = _tenantId,
            DeviceType = "电机",
            Name = "温度过高规则",
            Conditions = """[{"metric":"temperature","operator":">","threshold":80}]""",
            Conclusion = "电机温度过高",
            RecommendedActions = "检查散热系统",
            CheckSteps = "1. 检查温度传感器\n2. 检查散热风扇",
            ConfidenceWeight = 0.8m,
            Source = "expert",
            AccuracyRate = 0.95m,
            SuccessCount = 10,
            Enabled = true,
            CreatedBy = "admin",
            Version = 1
        };

        var changedBy = Guid.NewGuid();

        // Act
        var snapshot = await _sut.CreateVersionSnapshotAsync(
            rule, changedBy, "初始版本", CancellationToken.None);

        // Assert
        snapshot.Should().NotBeNull();
        snapshot.RuleId.Should().Be(rule.Id);
        snapshot.Version.Should().Be(1);
        snapshot.ChangedBy.Should().Be(changedBy);
        snapshot.ChangeSummary.Should().Be("初始版本");
        snapshot.TenantId.Should().Be(_tenantId);

        // 验证快照 JSON 包含所有关键字段
        var snapshotJson = JsonDocument.Parse(snapshot.Snapshot);
        var root = snapshotJson.RootElement;
        root.GetProperty("DeviceType").GetString().Should().Be("电机");
        root.GetProperty("Name").GetString().Should().Be("温度过高规则");
        root.GetProperty("Conditions").GetRawText().Should().Contain("temperature");
        root.GetProperty("Conclusion").GetString().Should().Be("电机温度过高");
        root.GetProperty("RecommendedActions").GetString().Should().Be("检查散热系统");
        root.GetProperty("CheckSteps").GetString().Should().Contain("温度传感器");
        root.GetProperty("ConfidenceWeight").GetDecimal().Should().Be(0.8m);
        root.GetProperty("Source").GetString().Should().Be("expert");
        root.GetProperty("AccuracyRate").GetDecimal().Should().Be(0.95m);
        root.GetProperty("SuccessCount").GetInt32().Should().Be(10);
        root.GetProperty("Enabled").GetBoolean().Should().BeTrue();
        root.GetProperty("CreatedBy").GetString().Should().Be("admin");
        root.GetProperty("Version").GetInt32().Should().Be(1);
    }

    [Fact]
    public async Task CreateVersionSnapshotAsync_收到已取消令牌时_应立即取消()
    {
        var rule = new KnowledgeRule
        {
            TenantId = _tenantId,
            DeviceType = "电机",
            Name = "取消测试",
            Conditions = "[]",
            Conclusion = "结论",
            Version = 1
        };

        var act = () => _sut.CreateVersionSnapshotAsync(
            rule,
            changedBy: null,
            changeSummary: "取消测试",
            new CancellationToken(canceled: true));

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [Fact]
    public async Task GetVersionHistoryAsync_当规则有多个版本时_应按版本号降序返回()
    {
        // Arrange
        var ruleId = Guid.NewGuid();
        var versions = new List<KnowledgeRuleVersion>
        {
            new()
            {
                TenantId = _tenantId, RuleId = ruleId, Version = 1,
                Snapshot = """{"Name":"v1"}""", ChangeSummary = "初始版本"
            },
            new()
            {
                TenantId = _tenantId, RuleId = ruleId, Version = 2,
                Snapshot = """{"Name":"v2"}""", ChangeSummary = "修改阈值"
            },
            new()
            {
                TenantId = _tenantId, RuleId = ruleId, Version = 3,
                Snapshot = """{"Name":"v3"}""", ChangeSummary = "添加条件"
            }
        };

        _db.KnowledgeRuleVersions.AddRange(versions);
        await _db.SaveChangesAsync();

        // Act
        var result = await _sut.GetVersionHistoryAsync(ruleId, CancellationToken.None);

        // Assert
        result.Should().HaveCount(3);
        result[0].Version.Should().Be(3);
        result[1].Version.Should().Be(2);
        result[2].Version.Should().Be(1);
        result[0].ChangeSummary.Should().Be("添加条件");
        result[1].ChangeSummary.Should().Be("修改阈值");
        result[2].ChangeSummary.Should().Be("初始版本");
    }

    [Fact]
    public async Task RollbackToVersionAsync_当目标版本存在时_应恢复规则内容并递增版本号()
    {
        // Arrange
        var rule = new KnowledgeRule
        {
            TenantId = _tenantId,
            DeviceType = "泵",
            Name = "当前版本规则",
            Conditions = """[{"metric":"pressure","operator":">","threshold":100}]""",
            Conclusion = "当前结论",
            ConfidenceWeight = 0.5m,
            Enabled = true,
            Version = 3
        };
        _db.KnowledgeRules.Add(rule);

        // 创建版本 2 的快照（回滚目标）
        var versionSnapshot = new KnowledgeRuleVersion
        {
            TenantId = _tenantId,
            RuleId = rule.Id,
            Version = 2,
            Snapshot = JsonSerializer.Serialize(new
            {
                DeviceType = "泵",
                Name = "历史版本规则",
                Conditions = """[{"metric":"pressure","operator":">","threshold":80}]""",
                Conclusion = "历史结论",
                RecommendedActions = (string?)null,
                CheckSteps = (string?)null,
                ConfidenceWeight = 0.9m,
                Source = "expert",
                AccuracyRate = (decimal?)null,
                SuccessCount = 0,
                Enabled = true,
                CreatedBy = (string?)null,
                Version = 2
            })
        };
        _db.KnowledgeRuleVersions.Add(versionSnapshot);
        await _db.SaveChangesAsync();

        var changedBy = Guid.NewGuid();

        // Act
        var result = await _sut.RollbackToVersionAsync(
            rule.Id, 2, changedBy, CancellationToken.None);

        // Assert
        result.Name.Should().Be("历史版本规则");
        result.Conclusion.Should().Be("历史结论");
        result.ConfidenceWeight.Should().Be(0.9m);
        result.Version.Should().Be(4); // 3 -> 4（回滚前版本号+1）

        // 验证回滚前保存了当前状态为快照
        var snapshots = await _db.KnowledgeRuleVersions
            .IgnoreQueryFilters()
            .Where(v => v.RuleId == rule.Id)
            .ToListAsync();
        snapshots.Should().HaveCount(2);
        var rollbackSnapshot = snapshots.First(s => s.Version == 3);
        rollbackSnapshot.ChangeSummary.Should().Be("回滚至版本 2");

        // 验证审计日志已记录
        _auditLogMock.Verify(
            a => a.LogFromContextAsync(
                "KnowledgeRuleRolledBack", "KnowledgeRule",
                rule.Id.ToString(),
                It.Is<string>(desc => desc.Contains("回滚至版本 2")),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RollbackToVersionAsync_当目标版本不存在时_应抛出KeyNotFoundException()
    {
        // Arrange
        var rule = new KnowledgeRule
        {
            TenantId = _tenantId,
            DeviceType = "电机",
            Name = "测试规则",
            Conditions = "[]",
            Conclusion = "结论",
            Version = 2
        };
        _db.KnowledgeRules.Add(rule);
        await _db.SaveChangesAsync();

        // Act
        var act = () => _sut.RollbackToVersionAsync(
            rule.Id, 999, null, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("*版本不存在*");
    }

    [Fact]
    public async Task RollbackToVersionAsync_回滚前应保存当前状态为快照()
    {
        // Arrange
        var rule = new KnowledgeRule
        {
            TenantId = _tenantId,
            DeviceType = "压缩机",
            Name = "回滚前状态",
            Conditions = """[{"metric":"temp","operator":">","threshold":90}]""",
            Conclusion = "当前结论",
            Version = 2
        };
        _db.KnowledgeRules.Add(rule);

        var v1Snapshot = new KnowledgeRuleVersion
        {
            TenantId = _tenantId,
            RuleId = rule.Id,
            Version = 1,
            Snapshot = JsonSerializer.Serialize(new
            {
                DeviceType = "压缩机",
                Name = "原始规则",
                Conditions = """[{"metric":"temp","operator":">","threshold":80}]""",
                Conclusion = "原始结论",
                RecommendedActions = (string?)null,
                CheckSteps = (string?)null,
                ConfidenceWeight = 0.7m,
                Source = "imported",
                AccuracyRate = (decimal?)null,
                SuccessCount = 0,
                Enabled = true,
                CreatedBy = (string?)null,
                Version = 1
            })
        };
        _db.KnowledgeRuleVersions.Add(v1Snapshot);
        await _db.SaveChangesAsync();

        var changedBy = Guid.NewGuid();

        // Act
        await _sut.RollbackToVersionAsync(rule.Id, 1, changedBy, CancellationToken.None);

        // Assert — 回滚前应保存当前版本(2)的快照
        var allSnapshots = await _db.KnowledgeRuleVersions
            .IgnoreQueryFilters()
            .Where(v => v.RuleId == rule.Id)
            .OrderBy(v => v.Version)
            .ToListAsync();

        allSnapshots.Should().HaveCount(2);

        // 版本 1 是预置的原始快照
        allSnapshots[0].Version.Should().Be(1);

        // 版本 2 是回滚前自动创建的当前状态快照
        allSnapshots[1].Version.Should().Be(2);
        allSnapshots[1].ChangedBy.Should().Be(changedBy);
        allSnapshots[1].ChangeSummary.Should().Be("回滚至版本 1");

        // 验证快照内容是回滚前的规则状态
        var preRollbackJson = JsonDocument.Parse(allSnapshots[1].Snapshot);
        preRollbackJson.RootElement.GetProperty("Name").GetString().Should().Be("回滚前状态");
        preRollbackJson.RootElement.GetProperty("Conclusion").GetString().Should().Be("当前结论");
    }

    [Fact]
    public async Task RollbackToVersionAsync_规则不存在应抛出KeyNotFoundException()
    {
        var act = () => _sut.RollbackToVersionAsync(Guid.NewGuid(), 1, null, CancellationToken.None);
        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task CreateVersionSnapshotAsync_生成的Snapshot应为合法JSON()
    {
        var rule = new KnowledgeRule
        {
            TenantId = _tenantId, DeviceType = "电机", Name = "JSON校验",
            Conditions = "[]", Conclusion = "结论", Version = 1
        };

        var snapshot = await _sut.CreateVersionSnapshotAsync(rule, Guid.NewGuid(), "JSON验证", CancellationToken.None);

        var act = () => JsonDocument.Parse(snapshot.Snapshot);
        act.Should().NotThrow("Snapshot 应为合法 JSON");
    }

    [Fact]
    public async Task GetVersionHistoryAsync_无版本历史应返回空列表()
    {
        var result = await _sut.GetVersionHistoryAsync(Guid.NewGuid(), CancellationToken.None);
        result.Should().BeEmpty();
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
