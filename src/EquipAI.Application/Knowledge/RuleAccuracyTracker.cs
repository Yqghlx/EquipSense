using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Knowledge;

/// <summary>
/// 规则准确率追踪器
/// 准确率算法：AccuracyRate = SuccessCount / TotalMatchCount
/// </summary>
public class RuleAccuracyTracker : IRuleAccuracyTracker
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RuleAccuracyTracker> _logger;

    public RuleAccuracyTracker(
        IServiceScopeFactory scopeFactory,
        ILogger<RuleAccuracyTracker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task RecordAsync(Guid ruleId, bool wasAccurate, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 本服务由后台事件处理器（KnowledgeCaptureHandler.TrackRuleAccuracyAsync）调用，运行在独立 scope 中、
        // 无 HttpContext，ITenantContext 走回退 → TenantId == Guid.Empty。FindAsync 沿用默认全局租户过滤器
        // （已实测对未追踪实体同样应用）→ 恒查不到真实租户规则 → 抛 KeyNotFoundException 被外层吞掉 →
        // 规则准确率追踪永久失效。ruleId 为全局唯一 UUID 主键，IgnoreQueryFilters + 按 Id 直接定位即可。
        var rule = await db.KnowledgeRules
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(r => r.Id == ruleId, ct);
        if (rule is null)
            throw new KeyNotFoundException($"规则不存在: {ruleId}");

        // 反推历史总匹配次数：TotalMatchCount = SuccessCount / AccuracyRate
        // 必须在修改 SuccessCount 之前计算，确保 oldTotal 反映的是历史值
        // 首次记录时 AccuracyRate 为 null 或 0，总匹配数为 0（之前没有匹配过）
        var oldTotal = rule.AccuracyRate.HasValue && rule.AccuracyRate.Value > 0
            ? (int)Math.Round(rule.SuccessCount / (double)rule.AccuracyRate.Value)
            : 0;

        if (wasAccurate)
        {
            rule.SuccessCount++;
        }

        var newTotal = oldTotal + 1;
        rule.AccuracyRate = (decimal)rule.SuccessCount / newTotal;

        await db.SaveChangesAsync(ct);

        _logger.LogInformation("规则准确率更新: RuleId={RuleId}, SuccessCount={SuccessCount}, AccuracyRate={AccuracyRate:P}",
            ruleId, rule.SuccessCount, rule.AccuracyRate);
    }
}
