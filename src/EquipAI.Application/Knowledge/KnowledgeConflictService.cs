using System.Text.Json;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Knowledge;

/// <summary>
/// 知识规则冲突检测结果
/// </summary>
public class KnowledgeConflictResult
{
    /// <summary>冲突的规则 ID</summary>
    public Guid RuleId { get; set; }

    /// <summary>冲突的规则名称</summary>
    public string RuleName { get; set; } = string.Empty;

    /// <summary>重叠的指标名称列表</summary>
    public List<string> OverlappingMetrics { get; set; } = [];
}

/// <summary>
/// 知识规则冲突检测服务
/// 检测同设备类型下规则之间的指标重叠，避免冗余和矛盾规则
/// </summary>
public class KnowledgeConflictService
{
    /// <summary>
    /// 单次冲突检测从数据库读取的最大规则数，避免规则规模增长时一次性占用过多内存。
    /// </summary>
    private const int ConflictRuleBatchSize = 500;

    private readonly AppDbContext _db;
    private readonly ILogger<KnowledgeConflictService> _logger;

    public KnowledgeConflictService(
        AppDbContext db,
        ILogger<KnowledgeConflictService> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// 检测指定设备类型和条件下的知识规则冲突
    /// 比较新规则的指标名与已有正式规则是否重叠
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="deviceType">设备类型</param>
    /// <param name="conditionsJson">条件的 JSON 字符串</param>
    /// <param name="excludeRuleId">需要排除的规则 ID（编辑场景排除自身）</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>冲突结果列表</returns>
    public async Task<List<KnowledgeConflictResult>> DetectConflictsAsync(
        Guid tenantId,
        string deviceType,
        string conditionsJson,
        Guid? excludeRuleId,
        CancellationToken ct)
    {
        var newMetrics = ParseMetricNames(conditionsJson);
        if (newMetrics.Count == 0)
            return [];

        // 使用稳定主键游标分批读取，避免规则数量增长后形成无界查询结果集。
        var matchedRules = _db.KnowledgeRules
            .AsNoTracking()
            .Where(r => r.DeviceType == deviceType && r.Enabled)
            .Where(r => excludeRuleId == null || r.Id != excludeRuleId.Value);

        var conflicts = new List<KnowledgeConflictResult>();
        Guid? lastRuleId = null;

        while (true)
        {
            var batchQuery = matchedRules;
            if (lastRuleId.HasValue)
            {
                batchQuery = batchQuery.Where(r => r.Id > lastRuleId.Value);
            }

            var rules = await batchQuery
                .OrderBy(r => r.Id)
                .Take(ConflictRuleBatchSize)
                .Select(r => new { r.Id, r.Name, r.Conditions })
                .ToListAsync(ct);

            if (rules.Count == 0)
            {
                break;
            }

            foreach (var rule in rules)
            {
                var existingMetrics = ParseMetricNames(rule.Conditions);
                var overlap = newMetrics.Intersect(existingMetrics, StringComparer.OrdinalIgnoreCase).ToList();

                if (overlap.Count > 0)
                {
                    conflicts.Add(new KnowledgeConflictResult
                    {
                        RuleId = rule.Id,
                        RuleName = rule.Name,
                        OverlappingMetrics = overlap
                    });
                }
            }

            lastRuleId = rules[^1].Id;
            if (rules.Count < ConflictRuleBatchSize)
            {
                break;
            }
        }

        if (conflicts.Count > 0)
        {
            _logger.LogInformation("检测到 {Count} 条冲突规则，设备类型: {DeviceType}",
                conflicts.Count, deviceType);
        }

        return conflicts;
    }

    /// <summary>
    /// 从条件 JSON 数组中提取指标名称
    /// 支持格式：[{"metric":"temperature","operator":">","threshold":80}] 或单条条件对象
    /// </summary>
    /// <param name="conditionsJson">条件 JSON 字符串</param>
    /// <returns>指标名称列表</returns>
    public static List<string> ParseMetricNames(string? conditionsJson)
    {
        if (string.IsNullOrWhiteSpace(conditionsJson))
            return [];

        try
        {
            var doc = JsonDocument.Parse(conditionsJson);
            var root = doc.RootElement;

            // 如果是数组，遍历每个元素
            if (root.ValueKind == JsonValueKind.Array)
            {
                return root.EnumerateArray()
                    .Where(e => e.TryGetProperty("metric", out _))
                    .Select(e => e.GetProperty("metric").GetString() ?? "")
                    .Where(s => !string.IsNullOrEmpty(s))
                    .ToList();
            }

            // 如果是单个对象
            if (root.ValueKind == JsonValueKind.Object
                && root.TryGetProperty("metric", out var metricEl))
            {
                var name = metricEl.GetString();
                return string.IsNullOrEmpty(name) ? [] : [name];
            }

            return [];
        }
        catch (JsonException)
        {
            // JSON 解析失败不抛异常，返回空列表
            return [];
        }
    }
}
