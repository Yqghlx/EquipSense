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
        await tracker.RecordAsync(ruleId, wasAccurate: true);

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
        await tracker.RecordAsync(ruleId, wasAccurate: true);
        await tracker.RecordAsync(ruleId, wasAccurate: true);
        await tracker.RecordAsync(ruleId, wasAccurate: false);

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

        var act = () => tracker.RecordAsync(Guid.NewGuid(), wasAccurate: true);

        await act.Should().ThrowAsync<KeyNotFoundException>();
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
