namespace EquipAI.Core.Entities;

/// <summary>
/// 审计日志实体 — 记录系统中的敏感操作（登录、权限变更、数据修改等）
/// </summary>
public class AuditLog : BaseEntity
{
    /// <summary>
    /// 所属租户 ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 操作用户 ID（系统操作时为 null）
    /// </summary>
    public Guid? UserId { get; set; }

    /// <summary>
    /// 操作类型（如 Create、Update、Delete、Login）
    /// </summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// 资源类型（如 Device、AlertRule、User）
    /// </summary>
    public string ResourceType { get; set; } = string.Empty;

    /// <summary>
    /// 资源 ID
    /// </summary>
    public string? ResourceId { get; set; }

    /// <summary>
    /// 操作描述
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// 客户端 IP 地址
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// 请求路径
    /// </summary>
    public string? RequestPath { get; set; }

    /// <summary>
    /// HTTP 方法（GET/POST/PUT/DELETE）
    /// </summary>
    public string? HttpMethod { get; set; }

    /// <summary>
    /// 客户端 User-Agent
    /// </summary>
    public string? UserAgent { get; set; }
}
