using System.Text.Json;
using EquipAI.Application.Knowledge.DTOs;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Knowledge;

/// <summary>
/// 知识规则版本管理服务
/// 负责版本快照的创建、查询和回滚操作
/// </summary>
public class KnowledgeVersionService
{
    private readonly AppDbContext _dbContext;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<KnowledgeVersionService> _logger;

    public KnowledgeVersionService(
        AppDbContext dbContext,
        IAuditLogService auditLogService,
        ILogger<KnowledgeVersionService> logger)
    {
        _dbContext = dbContext;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    /// <summary>
    /// 创建版本快照 — 在规则编辑前调用，保存当前状态
    /// </summary>
    public async Task<KnowledgeRuleVersion> CreateVersionSnapshotAsync(
        KnowledgeRule rule, Guid? changedBy, string? changeSummary, CancellationToken ct)
    {
        var snapshot = new KnowledgeRuleVersion
        {
            TenantId = rule.TenantId,
            RuleId = rule.Id,
            Version = rule.Version,
            Snapshot = SerializeRuleSnapshot(rule),
            ChangedBy = changedBy,
            ChangeSummary = changeSummary
        };

        _dbContext.KnowledgeRuleVersions.Add(snapshot);
        _logger.LogInformation(
            "创建规则版本快照: RuleId={RuleId}, Version={Version}", rule.Id, rule.Version);
        return snapshot;
    }

    /// <summary>
    /// 获取规则的全部版本历史（按版本号降序排列）
    /// </summary>
    public async Task<List<KnowledgeRuleVersionDto>> GetVersionHistoryAsync(
        Guid ruleId, CancellationToken ct)
    {
        return await _dbContext.KnowledgeRuleVersions
            .Where(v => v.RuleId == ruleId)
            .OrderByDescending(v => v.Version)
            .Select(v => new KnowledgeRuleVersionDto
            {
                Id = v.Id,
                RuleId = v.RuleId,
                Version = v.Version,
                Snapshot = v.Snapshot,
                ChangedBy = v.ChangedBy,
                ChangeSummary = v.ChangeSummary,
                CreatedAt = v.CreatedAt
            })
            .ToListAsync(ct);
    }

    /// <summary>
    /// 回滚规则到指定版本
    /// </summary>
    public async Task<KnowledgeRule> RollbackToVersionAsync(
        Guid ruleId, int targetVersion, Guid? changedBy, CancellationToken ct)
    {
        var rule = await _dbContext.KnowledgeRules.FindAsync([ruleId], ct);
        if (rule is null)
            throw new KeyNotFoundException($"规则不存在: {ruleId}");

        var targetSnapshot = await _dbContext.KnowledgeRuleVersions
            .FirstOrDefaultAsync(
                v => v.RuleId == ruleId && v.Version == targetVersion, ct);
        if (targetSnapshot is null)
            throw new KeyNotFoundException($"版本不存在: RuleId={ruleId}, Version={targetVersion}");

        // 先保存当前状态为快照
        await CreateVersionSnapshotAsync(
            rule, changedBy, $"回滚至版本 {targetVersion}", ct);

        // 从快照恢复规则内容
        RestoreRuleFromSnapshot(rule, targetSnapshot.Snapshot);
        rule.Version++;

        await _dbContext.SaveChangesAsync(ct);

        await _auditLogService.LogFromContextAsync(
            "KnowledgeRuleRolledBack", "KnowledgeRule", ruleId.ToString(),
            $"规则「{rule.Name}」回滚至版本 {targetVersion}，当前版本 {rule.Version}", ct);

        _logger.LogInformation(
            "规则已回滚: RuleId={RuleId}, TargetVersion={TargetVersion}, NewVersion={NewVersion}",
            ruleId, targetVersion, rule.Version);

        return rule;
    }

    /// <summary>
    /// 将规则对象序列化为 JSON 快照字符串
    /// </summary>
    private static string SerializeRuleSnapshot(KnowledgeRule rule)
    {
        return JsonSerializer.Serialize(new
        {
            rule.DeviceType,
            rule.Name,
            rule.Conditions,
            rule.Conclusion,
            rule.RecommendedActions,
            rule.CheckSteps,
            rule.ConfidenceWeight,
            rule.Source,
            rule.AccuracyRate,
            rule.SuccessCount,
            rule.Enabled,
            rule.CreatedBy,
            rule.Version
        }, new JsonSerializerOptions { WriteIndented = false });
    }

    /// <summary>
    /// 从 JSON 快照恢复规则的核心字段
    /// </summary>
    private static void RestoreRuleFromSnapshot(KnowledgeRule rule, string snapshot)
    {
        var doc = JsonDocument.Parse(snapshot);
        var root = doc.RootElement;

        rule.DeviceType = root.TryGetProperty("DeviceType", out var dt) ? dt.GetString() ?? rule.DeviceType : rule.DeviceType;
        rule.Name = root.TryGetProperty("Name", out var n) ? n.GetString() ?? rule.Name : rule.Name;
        rule.Conditions = root.TryGetProperty("Conditions", out var c) ? c.GetRawText() : rule.Conditions;
        rule.Conclusion = root.TryGetProperty("Conclusion", out var cl) ? cl.GetString() ?? rule.Conclusion : rule.Conclusion;
        rule.RecommendedActions = root.TryGetProperty("RecommendedActions", out var ra) ? ra.GetString() : rule.RecommendedActions;
        rule.CheckSteps = root.TryGetProperty("CheckSteps", out var cs) ? cs.GetString() : rule.CheckSteps;
        rule.ConfidenceWeight = root.TryGetProperty("ConfidenceWeight", out var cw) ? cw.GetDecimal() : rule.ConfidenceWeight;
        rule.Enabled = root.TryGetProperty("Enabled", out var en) ? en.GetBoolean() : rule.Enabled;
    }
}
