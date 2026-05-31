namespace EquipAI.Core.Interfaces;

/// <summary>
/// 数据质量评估服务，计算遥测数据的质量评分（0.0 - 1.0）
/// 5 维度加权：完整性 30%、准确性 25%、时效性 15%、一致性 15%、有效性 15%
/// </summary>
public interface IDataQualityService
{
    /// <summary>
    /// 计算指定设备指标的数据质量评分
    /// </summary>
    Task<double> CalculateScoreAsync(Guid tenantId, Guid deviceId, string metric, CancellationToken ct = default);
}
