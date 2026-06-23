using EquipAI.Application.Knowledge;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit;

namespace EquipAI.Tests.Unit.Knowledge;

/// <summary>
/// 规则准确率追踪（RuleAccuracyTracker.RecordAsync）后台 scope 查询回归测试。
///
/// 生产链路：工单关闭 → <c>WorkOrderStatusChangedEvent</c> → <c>KnowledgeCaptureHandler</c>
/// .TrackRuleAccuracyAsync（后台事件处理器，无 HttpContext）→ <c>RuleAccuracyTracker.RecordAsync</c>。
/// 后台 scope 中 <c>ITenantContext</c> 走 DI 回退 → <c>TenantId == Guid.Empty</c>。
/// RecordAsync 用 <c>db.KnowledgeRules.FindAsync([ruleId])</c> 沿用默认全局租户过滤器
/// （已实测 FindAsync 对未追踪实体同样应用过滤器）→ 恒查不到真实租户规则 → 抛 KeyNotFoundException →
/// 被外层 try/catch 吞掉 → 规则准确率追踪静默永久失效。
///
/// ruleId 为全局唯一 UUID 主键，应 <c>IgnoreQueryFilters</c> + 按 Id 直接定位（无需租户限定）。
/// InMemory provider 不强制过滤器，既有 RuleAccuracyTrackerTests 用 InMemory + 真实租户上下文掩盖了此 bug，
/// 必须用 SQLite + Guid.Empty 上下文复刻生产后台路径。
/// </summary>
public class RuleAccuracyTrackerBackgroundScopeTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private ServiceProvider _sp = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseSqlite(_connection));
        // 复刻后台 scope：ITenantContext 回退为空租户
        services.AddScoped<ITenantContext>(_ => new BackgroundTenantContext());
        services.AddLogging();
        services.AddScoped<IRuleAccuracyTracker, RuleAccuracyTracker>();
        _sp = services.BuildServiceProvider();

        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        await _sp.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task 后台scope_RecordAsync应按规则Id更新准确率不抛异常()
    {
        var tenantId = Guid.NewGuid();
        var ruleId = Guid.NewGuid();

        // seed 真实租户 + 知识规则（真实 tenantId）
        using (var seedScope = _sp.CreateScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Tenants.Add(new Tenant
            {
                Id = tenantId, Name = "T", Slug = "t", Plan = TenantPlan.Professional,
                Status = TenantStatus.Active, MaxDevices = 10
            });
            db.KnowledgeRules.Add(new KnowledgeRule
            {
                Id = ruleId, TenantId = tenantId, Name = "电机过热规则",
                DeviceType = "电机", Conditions = "[]", Conclusion = "轴承磨损", SuccessCount = 0
            });
            await db.SaveChangesAsync();
        }

        // 从 DI 解析服务：其内部 _scopeFactory 创建后台 scope（Guid.Empty 租户上下文）
        using (var scope = _sp.CreateScope())
        {
            var tracker = scope.ServiceProvider.GetRequiredService<IRuleAccuracyTracker>();

            // 修复前：FindAsync 受 Guid.Empty 过滤查不到真实租户规则 → 抛 KeyNotFoundException。
            // 修复后：IgnoreQueryFilters 按 UUID 主键定位成功，更新准确率。
            var act = async () => await tracker.RecordAsync(ruleId, wasAccurate: true);
            await act.Should().NotThrowAsync("后台 scope 必须能按规则 UUID 主键定位并更新，不受 Guid.Empty 过滤影响");
        }

        // 验证准确率确实写入
        using var assertScope = _sp.CreateScope();
        var assertDb = assertScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var rule = await assertDb.KnowledgeRules
            .IgnoreQueryFilters()
            .FirstAsync(r => r.Id == ruleId);
        rule.SuccessCount.Should().Be(1, "准确记录后 SuccessCount 应递增");
        rule.AccuracyRate.Should().Be(1.0m, "首次准确记录准确率应为 100%");
    }

    /// <summary>复刻后台事件处理器中 ITenantContext 的 DI 回退：空租户上下文。</summary>
    private sealed class BackgroundTenantContext : ITenantContext
    {
        public Guid TenantId => Guid.Empty;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
