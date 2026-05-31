using EquipAI.Core.Entities;

namespace EquipAI.Core.Interfaces;

/// <summary>
/// 根因分析服务接口
/// </summary>
public interface IAnalysisService
{
    /// <summary>
    /// 执行根因分析（自动选择分析级别）
    /// </summary>
    Task<Analysis> AnalyzeAsync(Guid tenantId, Guid alertId, Guid deviceId,
        string metric, double value, MetricBaseline? baseline, CancellationToken ct = default);
}
