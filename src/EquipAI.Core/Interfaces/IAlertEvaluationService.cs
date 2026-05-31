namespace EquipAI.Core.Interfaces;

/// <summary>
/// 告警评估服务接口，协调规则查询、评估器调用和告警创建
/// </summary>
public interface IAlertEvaluationService
{
    /// <summary>
    /// 对指定设备的指标数据进行告警规则评估
    /// 查询匹配的告警规则，调用对应评估器，处理触发结果
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="deviceId">设备 ID</param>
    /// <param name="deviceType">设备类型</param>
    /// <param name="metric">指标名称</param>
    /// <param name="value">指标值</param>
    /// <param name="context">设备全量指标上下文</param>
    Task EvaluateForDeviceAsync(Guid tenantId, Guid deviceId, string deviceType,
        string metric, double value, DeviceContext context, CancellationToken cancellationToken = default);
}
