using EquipAI.Application.Knowledge;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Tests.Unit.Knowledge;

public class RuleAccuracyTrackerTests : IAsyncDisposable
{
    private readonly ServiceProvider _sp;
    private readonly Guid _tenantId = Guid.NewGuid();

    public RuleAccuracyTrackerTests()
    {
        var dbName = $"AccuracyTest_{Guid.NewGuid()}";
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(dbName));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(_tenantId));
        services.AddLogging();
        services.AddScoped<IRuleAccuracyTracker, RuleAccuracyTracker>();
        _sp = services.BuildServiceProvider();
    }

    [Fact]
    public async Task RecordAsync_首次准确记录应为100()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var ruleId = Guid.NewGuid();
        db.KnowledgeRules.Add(new KnowledgeRule
        {
            Id = ruleId,
            TenantId = _tenantId,
            Name = "测试规则",
            DeviceType = "电机",
            Conditions = "[]",
            Conclusion = "测试",
            SuccessCount = 0
        });
        await db.SaveChangesAsync();

        var tracker = scope.ServiceProvider.GetRequiredService<IRuleAccuracyTracker>();
        await tracker.RecordAsync(_tenantId, ruleId, wasAccurate: true);

        // tracker 内部通过独立 scope 的 DbContext 保存，需用 AsNoTracking 避免本地缓存
        var rule = await db.KnowledgeRules.AsNoTracking().FirstAsync(r => r.Id == ruleId);
        rule.SuccessCount.Should().Be(1);
        rule.AccuracyRate.Should().Be(1.0m);
    }

    [Fact]
    public async Task RecordAsync_混合记录应计算正确率()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var ruleId = Guid.NewGuid();
        db.KnowledgeRules.Add(new KnowledgeRule
        {
            Id = ruleId,
            TenantId = _tenantId,
            Name = "测试规则",
            DeviceType = "电机",
            Conditions = "[]",
            Conclusion = "测试",
            SuccessCount = 0
        });
        await db.SaveChangesAsync();

        var tracker = scope.ServiceProvider.GetRequiredService<IRuleAccuracyTracker>();
        await tracker.RecordAsync(_tenantId, ruleId, wasAccurate: true);
        await tracker.RecordAsync(_tenantId, ruleId, wasAccurate: true);
        await tracker.RecordAsync(_tenantId, ruleId, wasAccurate: false);

        // tracker 内部通过独立 scope 的 DbContext 保存，需用 AsNoTracking 避免本地缓存
        var rule = await db.KnowledgeRules.AsNoTracking().FirstAsync(r => r.Id == ruleId);
        rule.SuccessCount.Should().Be(2);
        // 准确率 = 2次准确 / 3次总匹配 = 0.6667
        rule.AccuracyRate.Should().BeApproximately(0.6667m, 0.01m);
    }

    [Fact]
    public async Task RecordAsync_规则不存在应抛出KeyNotFoundException()
    {
        using var scope = _sp.CreateScope();
        var tracker = scope.ServiceProvider.GetRequiredService<IRuleAccuracyTracker>();

        var act = () => tracker.RecordAsync(_tenantId, Guid.NewGuid(), wasAccurate: true);

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    /// <summary>
    /// 安全边界：当前租户不能更新其他租户同 ID 规则的准确率统计。
    ///
    /// Why：规则 UUID 虽然全局唯一，但后台事件中的 ruleId 仍必须和事件租户绑定；
    /// 仅按 UUID 使用 IgnoreQueryFilters 会让错误事件修改其他租户的知识规则。
    /// </summary>
    [Fact]
    public async Task RecordAsync_其他租户规则不应被当前租户更新()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var otherTenantId = Guid.NewGuid();
        var ruleId = Guid.NewGuid();
        db.KnowledgeRules.Add(new KnowledgeRule
        {
            Id = ruleId,
            TenantId = otherTenantId,
            Name = "其他租户规则",
            DeviceType = "电机",
            Conditions = "[]",
            Conclusion = "测试",
            SuccessCount = 0,
        });
        await db.SaveChangesAsync();

        var tracker = scope.ServiceProvider.GetRequiredService<IRuleAccuracyTracker>();
        var act = () => tracker.RecordAsync(_tenantId, ruleId, wasAccurate: true);
        await act.Should().ThrowAsync<KeyNotFoundException>(
            "当前租户不能定位其他租户规则");

        var rule = await db.KnowledgeRules
            .IgnoreQueryFilters()
            .AsNoTracking()
            .SingleAsync(r => r.Id == ruleId);
        rule.SuccessCount.Should().Be(0,
            "当前租户不能更新其他租户规则的准确率");
        rule.AccuracyRate.Should().BeNull();
    }

    [Fact]
    public async Task RecordAsync_连续不准确记录SuccessCount应为0()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var ruleId = Guid.NewGuid();
        db.KnowledgeRules.Add(new KnowledgeRule
        {
            Id = ruleId, TenantId = _tenantId, Name = "连续不准确",
            DeviceType = "电机", Conditions = "[]", Conclusion = "测试", SuccessCount = 0
        });
        await db.SaveChangesAsync();

        var tracker = scope.ServiceProvider.GetRequiredService<IRuleAccuracyTracker>();
        await tracker.RecordAsync(_tenantId, ruleId, wasAccurate: false);
        await tracker.RecordAsync(_tenantId, ruleId, wasAccurate: false);
        await tracker.RecordAsync(_tenantId, ruleId, wasAccurate: false);

        var rule = await db.KnowledgeRules.AsNoTracking().FirstAsync(r => r.Id == ruleId);
        rule.SuccessCount.Should().Be(0);
        rule.AccuracyRate.Should().Be(0.0m);
    }

    [Fact]
    public async Task RecordAsync_从已有历史反推应累加TotalMatches()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var ruleId = Guid.NewGuid();
        db.KnowledgeRules.Add(new KnowledgeRule
        {
            Id = ruleId, TenantId = _tenantId, Name = "累加测试",
            DeviceType = "电机", Conditions = "[]", Conclusion = "测试",
            SuccessCount = 3, AccuracyRate = 0.75m
        });
        await db.SaveChangesAsync();

        var tracker = scope.ServiceProvider.GetRequiredService<IRuleAccuracyTracker>();
        await tracker.RecordAsync(_tenantId, ruleId, wasAccurate: true);

        var rule = await db.KnowledgeRules.AsNoTracking().FirstAsync(r => r.Id == ruleId);
        // 原有 3次准确/0.75准确率 = 4次总计，再加1次准确 = 4次准确/5次总计 = 0.8
        rule.SuccessCount.Should().Be(4);
        rule.AccuracyRate.Should().Be(0.8m);
    }

    [Fact]
    public async Task RecordAsync_全部准确时AccuracyRate应为1()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var ruleId = Guid.NewGuid();
        db.KnowledgeRules.Add(new KnowledgeRule
        {
            Id = ruleId, TenantId = _tenantId, Name = "全准确",
            DeviceType = "电机", Conditions = "[]", Conclusion = "测试", SuccessCount = 0
        });
        await db.SaveChangesAsync();

        var tracker = scope.ServiceProvider.GetRequiredService<IRuleAccuracyTracker>();
        await tracker.RecordAsync(_tenantId, ruleId, wasAccurate: true);
        await tracker.RecordAsync(_tenantId, ruleId, wasAccurate: true);

        var rule = await db.KnowledgeRules.AsNoTracking().FirstAsync(r => r.Id == ruleId);
        rule.AccuracyRate.Should().Be(1.0m);
    }

    /// <summary>
    /// 测试用租户上下文，使用指定的租户 ID
    /// </summary>
    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }

    public async ValueTask DisposeAsync() => await _sp.DisposeAsync();
}
