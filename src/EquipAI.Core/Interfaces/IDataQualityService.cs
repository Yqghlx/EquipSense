using EquipAI.Core.Models;

namespace EquipAI.Core.Interfaces;

/// <summary>
/// 数据质量评估服务，计算遥测数据的质量评分（0.0 - 1.0）
/// 5 维度加权：完整性 30%、准确性 25%、时效性 15%、一致性 15%、有效性 15%
/// </summary>
public interface IDataQualityService
{
    /// <summary>
    /// 计算指定设备指标的数据质量评分（0.0 - 1.0）
    /// 样本数不足（少于 5 个）时返回 null
    /// </summary>
    Task<double?> CalculateScoreAsync(Guid tenantId, Guid deviceId, string metric, CancellationToken ct = default);

    /// <summary>
    /// 计算指定设备指标的完整数据质量报告，包含各维度明细
    /// 样本数不足（少于 5 个）时返回 null
    /// </summary>
    Task<DataQualityReport?> CalculateReportAsync(Guid tenantId, Guid deviceId, string metric, CancellationToken ct = default);

    /// <summary>
    /// 获取设备所有指标的数据质量概览
    /// </summary>
    Task<List<DataQualityReport>> CalculateOverviewAsync(Guid tenantId, Guid deviceId, CancellationToken ct = default);
}
