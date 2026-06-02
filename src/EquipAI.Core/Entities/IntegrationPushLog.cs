namespace EquipAI.Core.Entities;

/// <summary>
/// 集成推送日志 — 记录每次外部集成调用的完整信息
/// 用于排查推送失败、统计集成调用成功率、支持重试机制的可观测性
/// </summary>
public class IntegrationPushLog : BaseEntity
{
    /// <summary>
    /// 租户 ID（多租户隔离）
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 关联的工单 ID
    /// </summary>
    public Guid WorkOrderId { get; set; }

    /// <summary>
    /// 集成类型标识（如 "webhook"、"dingtalk"、"feishu"、"eam"）
    /// </summary>
    public string IntegrationType { get; set; } = string.Empty;

    /// <summary>
    /// 推送方向："Created"（工单创建）/ "StatusChanged"（状态变更）
    /// </summary>
    public string Direction { get; set; } = string.Empty;

    /// <summary>
    /// 推送状态："Pending"（待推送）/ "Success"（成功）/ "Failed"（失败）
    /// </summary>
    public string Status { get; set; } = "Pending";

    /// <summary>
    /// 重试次数（最多 3 次）
    /// </summary>
    public int RetryCount { get; set; }

    /// <summary>
    /// 外部系统返回的 HTTP 状态码（如 200、400、503）
    /// </summary>
    public int? HttpStatusCode { get; set; }

    /// <summary>
    /// 外部系统返回的实体 ID（如钉钉消息 ID、Maximo 工单号）
    /// </summary>
    public string? ExternalId { get; set; }

    /// <summary>
    /// 失败时的错误信息
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// 本次推送耗时（毫秒）
    /// </summary>
    public long? DurationMs { get; set; }
}
