namespace EquipAI.Core.Entities;

/// <summary>
/// 网关实体
///
/// 记录已注册的边缘网关信息，支持多网关部署。
/// EdgeGateway 启动时通过心跳自动注册，后端据此跟踪在线状态。
/// </summary>
public class Gateway : BaseEntity
{
    /// <summary>
    /// 业务标识（如 "gateway-factory-a-01"），对应 EdgeGateway 的 GatewayOptions.Id
    /// </summary>
    public string GatewayId { get; set; } = string.Empty;

    /// <summary>
    /// 所属租户 ID（Day 1 多租户隔离）
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 显示名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 可选描述信息
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 网关对外可访问的地址（用于后端代理健康请求）
    /// </summary>
    public string Host { get; set; } = string.Empty;

    /// <summary>
    /// 健康端点端口（默认 8081）
    /// </summary>
    public int HealthPort { get; set; } = 8081;

    /// <summary>
    /// 在线状态：online / offline
    /// </summary>
    public string Status { get; set; } = "offline";

    /// <summary>
    /// 最后心跳时间（UTC）
    /// </summary>
    public DateTime? LastHeartbeatAt { get; set; }

    /// <summary>
    /// 网关上报的运行时长（秒）
    /// </summary>
    public int? UptimeSeconds { get; set; }

    /// <summary>
    /// 网关软件版本
    /// </summary>
    public string? Version { get; set; }

    /// <summary>
    /// 是否启用（管理员可禁用网关）
    /// </summary>
    public bool Enabled { get; set; } = true;
}
