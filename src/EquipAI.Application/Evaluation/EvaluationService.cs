using System.Text.Json;
using EquipAI.Core.Entities;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Evaluation;

/// <summary>
/// AI 诊断评估服务
/// 对比模拟器上报的标准答案（ground truth）与 analyses 表的 AI 实际诊断，计算命中率
///
/// 匹配逻辑：
/// 1. 按 runId 批次查询所有 ground truth 条目
/// 2. 对每条 ground truth，在故障注入后 10 分钟时间窗内查找同设备的 analysis 记录
/// 3. 若找到 analysis：检查 root_cause 是否包含 expected root cause 的关键词 → 命中/误诊
/// 4. 若无 analysis：记为漏报
/// </summary>
public class EvaluationService
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<EvaluationService> _logger;

    /// <summary>匹配时间窗（分钟）— 故障注入后 N 分钟内的 analysis 计为该故障的诊断</summary>
    private const int MatchWindowMinutes = 10;

    public EvaluationService(AppDbContext dbContext, ILogger<EvaluationService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// 接收模拟器上报的标准答案，批量写入数据库
    /// </summary>
    public async Task<int> IngestReportAsync(GroundTruthReport report, Guid tenantId, CancellationToken ct = default)
    {
        // 同一批次去重（避免模拟器重复上报）
        var existingRunId = await _dbContext.GroundTruthEntries
            .IgnoreQueryFilters()
            .AnyAsync(g => g.TenantId == tenantId && g.RunId == report.RunId, ct);

        if (existingRunId)
        {
            _logger.LogInformation("标准答案批次 {RunId} 已存在，跳过上报", report.RunId);
            return 0;
        }

        foreach (var evt in report.Events)
        {
            _dbContext.GroundTruthEntries.Add(new GroundTruthEntry
            {
                TenantId = tenantId,
                RunId = report.RunId,
                DeviceId = report.DeviceId,
                DeviceCode = report.DeviceCode,
                ScenarioName = report.ScenarioName,
                FaultType = evt.FaultType,
                ExpectedRootCause = evt.ExpectedRootCause,
                ExpectedSeverity = evt.ExpectedSeverity,
                AffectedMetrics = JsonSerializer.Serialize(evt.AffectedMetrics),
                InjectedAt = evt.InjectedAt,
            });
        }

        await _dbContext.SaveChangesAsync(ct);
        _logger.LogInformation("已接收标准答案批次 {RunId}（{Count} 条故障事件）", report.RunId, report.Events.Count);
        return report.Events.Count;
    }

    /// <summary>
    /// 计算指定批次的评估结果
    /// </summary>
    public async Task<EvaluationResult> EvaluateAsync(string? runId, Guid tenantId, CancellationToken ct = default)
    {
        // 后台评估可能没有 HttpContext，必须绕过全局过滤器后显式补回 tenantId。
        // 只按 runId 查询会让一个租户看到其他租户的设备故障和 AI 诊断结果。
        var truthQuery = _dbContext.GroundTruthEntries
            .IgnoreQueryFilters()
            .Where(g => g.TenantId == tenantId)
            .AsQueryable();
        if (!string.IsNullOrEmpty(runId))
            truthQuery = truthQuery.Where(g => g.RunId == runId);

        var truths = await truthQuery.OrderBy(g => g.InjectedAt).ToListAsync(ct);

        var result = new EvaluationResult { TotalFaults = truths.Count };

        foreach (var truth in truths)
        {
            var detail = await EvaluateSingleAsync(truth, ct);
            result.Details.Add(detail.Detail);
            result.ByFaultType = AggregateByFaultType(result.ByFaultType, detail);
        }

        result.MatchedCount = result.Details.Count(d => d.Matched == true);
        result.MismatchedCount = result.Details.Count(d => d.Matched == false);
        result.MissedCount = result.Details.Count(d => d.Matched == null);

        return result;
    }

    /// <summary>评估单条 ground truth 的匹配情况</summary>
    private async Task<(EvaluationDetail Detail, bool Hit)> EvaluateSingleAsync(GroundTruthEntry truth, CancellationToken ct)
    {
        // InjectedAt 从 JSON 反序列化得到，Kind 可能是 Unspecified；PostgreSQL timestamptz 要求 Utc
        var injectedUtc = DateTime.SpecifyKind(truth.InjectedAt, DateTimeKind.Utc);
        var windowEnd = injectedUtc.AddMinutes(MatchWindowMinutes);

        // 查找时间窗内同设备的 analysis 记录（IgnoreQueryFilters 避免后台无 HttpContext 问题）
        var analysis = await _dbContext.Analyses
            .IgnoreQueryFilters()
            .Where(a => a.TenantId == truth.TenantId
                     && a.DeviceId == truth.DeviceId
                     && a.CreatedAt >= injectedUtc
                     && a.CreatedAt <= windowEnd)
            .OrderByDescending(a => a.Confidence)
            .FirstOrDefaultAsync(ct);

        var detail = new EvaluationDetail
        {
            FaultType = truth.FaultType,
            ExpectedRootCause = truth.ExpectedRootCause,
            InjectedAt = injectedUtc,
        };

        if (analysis == null)
        {
            // 漏报：AI 无响应
            detail.Matched = null;
            return (detail, false);
        }

        detail.AiRootCause = analysis.RootCause;
        detail.AnalysisLevel = (int)analysis.Level;
        detail.Confidence = analysis.Confidence;

        // 命中判断：AI 诊断包含预期根因的核心关键词
        var hit = RootCauseMatches(truth.ExpectedRootCause, analysis.RootCause);
        detail.Matched = hit;
        return (detail, hit);
    }

    /// <summary>
    /// 判断 AI 诊断是否匹配预期根因
    /// 提取 expected root cause 的核心名词（如"轴承磨损"、"过载"），检查是否出现在 AI 诊断中
    /// </summary>
    private static bool RootCauseMatches(string expected, string? actual)
    {
        if (string.IsNullOrWhiteSpace(actual))
            return false;

        // 按故障类型的核心关键词匹配（与模拟器故障剧本的 expectedRootCause 对齐）
        var keywords = ExtractKeywords(expected);
        foreach (var kw in keywords)
        {
            if (actual.Contains(kw, StringComparison.OrdinalIgnoreCase))
                return true;
        }
        return false;
    }

    /// <summary>从预期根因文本中提取核心关键词用于匹配</summary>
    private static string[] ExtractKeywords(string expected)
    {
        // 故障类型 → 核心关键词映射（覆盖 6 种空压机故障的预期诊断）
        var keywordMap = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            ["轴承磨损"] = new[] { "轴承", "磨损" },
            ["润滑"] = new[] { "润滑", "油位", "油泵" },
            ["气阀泄漏"] = new[] { "泄漏", "阀片", "密封" },
            ["过载"] = new[] { "过载", "负载", "电流" },
            ["排气系统堵塞"] = new[] { "堵塞", "过滤器", "排气" },
            ["传感器漂移"] = new[] { "传感器", "漂移", "校准" },
        };

        foreach (var (key, words) in keywordMap)
        {
            if (expected.Contains(key, StringComparison.OrdinalIgnoreCase))
                return words;
        }

        // 兜底：用逗号分隔取第一段作为关键词
        return new[] { expected.Split('，', ':', '：')[0].Trim() };
    }

    private static List<FaultTypeStat> AggregateByFaultType(List<FaultTypeStat> stats, (EvaluationDetail Detail, bool Hit) item)
    {
        var faultType = item.Detail.FaultType;
        var stat = stats.FirstOrDefault(s => s.FaultType == faultType);
        if (stat == null)
        {
            stat = new FaultTypeStat { FaultType = faultType };
            stats.Add(stat);
        }
        stat.Total++;
        if (item.Hit) stat.Hit++;
        else stat.Missed++;
        return stats;
    }
}
