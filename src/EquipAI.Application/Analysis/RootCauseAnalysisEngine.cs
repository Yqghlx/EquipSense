using System.Diagnostics;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using AnalysisEntity = EquipAI.Core.Entities.Analysis;
using MetricBaselineEntity = EquipAI.Core.Entities.MetricBaseline;

namespace EquipAI.Application.Analysis;

/// <summary>
/// 根因分析引擎，实现 L3→L1 自动降级分析链
/// L3 统计分析：有基线数据且数据质量 ≥ 0.6 时，基于历史统计基线计算偏离度
/// L1 LLM 诊断：兜底方案，调用大语言模型分析告警上下文
/// </summary>
public class RootCauseAnalysisEngine : IAnalysisService
{
    private readonly ILLMService _llmService;
    private readonly IDataQualityService _dataQualityService;

    /// <summary>
    /// 数据质量阈值：≥ 此值时使用统计基线分析（L3），否则降级到 LLM 诊断（L1）
    /// </summary>
    private const double DataQualityThreshold = 0.6;

    /// <summary>
    /// 基线最低样本数阈值：样本数不足时统计结论不可靠，降级到 LLM 诊断
    /// </summary>
    private const int MinSampleCount = 100;

    public RootCauseAnalysisEngine(ILLMService llmService, IDataQualityService dataQualityService)
    {
        _llmService = llmService;
        _dataQualityService = dataQualityService;
    }

    /// <inheritdoc />
    public async Task<AnalysisEntity> AnalyzeAsync(Guid tenantId, Guid alertId, Guid deviceId,
        string metric, double value, MetricBaselineEntity? baseline, CancellationToken ct = default)
    {
        var startTime = Stopwatch.GetTimestamp();

        // 计算数据质量评分，样本不足时默认为 0（触发 L1 降级）
        var dataQualityNullable = await _dataQualityService.CalculateScoreAsync(tenantId, deviceId, metric, ct);
        var dataQuality = dataQualityNullable ?? 0.0;

        string rootCause;
        string suggestion;
        double confidence;
        AnalysisLevel level;
        AnalysisStatus status = AnalysisStatus.Completed;
        string? rawResponse = null;

        // 降级决策：有足够基线数据且数据质量达标时使用 L3 统计分析，否则降级到 L1
        if (baseline != null && (baseline.SampleCount ?? 0) >= MinSampleCount && dataQuality >= DataQualityThreshold)
        {
            // L3 统计分析：基于历史基线计算偏离度
            level = AnalysisLevel.L3;
            (rootCause, suggestion, confidence) = StatisticalAnalysis(value, baseline, metric, dataQuality);
        }
        else
        {
            // L1 LLM 诊断：兜底方案
            level = AnalysisLevel.L1;
            var result = await LLMDiagnosisAsync(deviceId, metric, value, baseline, ct);

            if (result.Success)
            {
                rootCause = result.RootCause;
                suggestion = result.Suggestion;
                confidence = result.Confidence ?? 0.5;
                rawResponse = result.RawContent;
            }
            else
            {
                status = AnalysisStatus.Failed;
                rootCause = $"LLM 分析失败：{result.ErrorMessage}";
                suggestion = "请人工排查";
                confidence = 0.0;
                rawResponse = null;
            }
        }

        var elapsed = Stopwatch.GetElapsedTime(startTime);

        return new AnalysisEntity
        {
            TenantId = tenantId,
            AlertId = alertId,
            DeviceId = deviceId,
            Level = level,
            Status = status,
            Confidence = confidence,
            DataQualityScore = dataQuality,
            RootCause = rootCause,
            Suggestion = suggestion,
            RawResponse = rawResponse,
            ProcessingTimeMs = (long)elapsed.TotalMilliseconds,
            CompletedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// L3 统计分析：基于历史基线计算偏离度并生成诊断
    /// 使用 Z-Score（偏离标准差的倍数）量化异常程度，据此生成诊断文本和置信度
    /// </summary>
    private static (string rootCause, string suggestion, double confidence) StatisticalAnalysis(
        double value, MetricBaselineEntity baseline, string metric, double dataQuality)
    {
        var avg = baseline.AvgValue ?? 0;
        var stdDev = baseline.StdDev ?? 1;
        // 避免除零：标准差为 0 时使用极小值
        if (stdDev == 0) stdDev = 0.001;

        var deviation = Math.Abs(value - avg) / stdDev;

        var rootCause = deviation switch
        {
            > 5 => $"指标 {metric} 当前值 {value:F2} 严重偏离历史基线（均值 {avg:F2}，{deviation:F1}σ）",
            > 3 => $"指标 {metric} 当前值 {value:F2} 显著偏离历史基线（均值 {avg:F2}，{deviation:F1}σ）",
            _ => $"指标 {metric} 当前值 {value:F2} 偏离历史基线（均值 {avg:F2}，{deviation:F1}σ）"
        };

        var suggestion = deviation switch
        {
            > 5 => "建议立即停机检查，排查严重异常原因",
            > 3 => "建议尽快排查异常原因，必要时安排维护",
            _ => "建议持续观察，如持续偏离则安排检查"
        };

        // 置信度 = 数据质量权重 × 0.8 + 基础置信度 0.2，上限 1.0
        var confidence = Math.Min(1.0, dataQuality * 0.8 + 0.2);

        return (rootCause, suggestion, confidence);
    }

    /// <summary>
    /// L1 LLM 诊断：将告警上下文发送给大语言模型进行根因分析
    /// 请求 LLM 以 JSON 格式返回结构化的根因、建议和置信度
    /// </summary>
    private async Task<(bool Success, string RootCause, string Suggestion, double? Confidence, string? RawContent, string? ErrorMessage)>
        LLMDiagnosisAsync(Guid deviceId, string metric, double value, MetricBaselineEntity? baseline, CancellationToken ct)
    {
        var systemPrompt = @"你是工业设备故障诊断专家。根据提供的设备遥测数据和告警信息，分析可能的根因并给出建议措施。
请以 JSON 格式响应：
{
  ""rootCause"": ""根因描述"",
  ""suggestion"": ""建议措施"",
  ""confidence"": 0.0到1.0的置信度
}";

        var baselineInfo = baseline != null
            ? $"\n历史基线：均值={baseline.AvgValue:F2}, 标准差={baseline.StdDev:F2}, 样本数={baseline.SampleCount}"
            : "\n历史基线：无可用数据";

        var userPrompt = $"设备ID: {deviceId}\n异常指标: {metric}\n当前值: {value}{baselineInfo}\n\n请分析可能的根因并给出建议。";

        var response = await _llmService.AnalyzeAsync(new LLMRequest(systemPrompt, userPrompt), ct);

        if (!response.Success)
        {
            return (false, "", "", null, null, response.ErrorMessage);
        }

        // 尝试解析 JSON 响应，提取结构化字段
        try
        {
            var json = System.Text.Json.JsonDocument.Parse(response.Content);
            var root = json.RootElement;

            var rootCause = root.TryGetProperty("rootCause", out var rc) ? rc.GetString() ?? "" : response.Content;
            var suggestion = root.TryGetProperty("suggestion", out var sg) ? sg.GetString() ?? "" : "";
            var confidence = root.TryGetProperty("confidence", out var cf) ? cf.GetDouble() : 0.5;

            return (true, rootCause, suggestion, confidence, response.Content, null);
        }
        catch
        {
            // JSON 解析失败，使用原始内容作为根因，降低置信度
            return (true, response.Content, "请结合人工判断", 0.3, response.Content, null);
        }
    }
}
