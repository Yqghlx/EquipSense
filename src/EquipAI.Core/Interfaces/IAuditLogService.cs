using EquipAI.Core.Models;

namespace EquipAI.Core.Interfaces;

/// <summary>
/// 审计日志服务接口 — 提供敏感操作的记录和查询能力
/// </summary>
public interface IAuditLogService
{
    /// <summary>
    /// 记录审计日志（显式指定租户 ID）
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="action">操作类型（如 Create、Update、Delete）</param>
    /// <param name="resourceType">资源类型（如 Device、AlertRule）</param>
    /// <param name="resourceId">资源 ID</param>
    /// <param name="description">操作描述</param>
    /// <param name="ct">取消令牌</param>
    Task LogAsync(Guid tenantId, string action, string resourceType, string? resourceId = null,
        string? description = null, CancellationToken ct = default);

    /// <summary>
    /// 从当前请求上下文中自动提取租户 ID 并记录审计日志
    /// </summary>
    /// <param name="action">操作类型</param>
    /// <param name="resourceType">资源类型</param>
    /// <param name="resourceId">资源 ID</param>
    /// <param name="description">操作描述</param>
    /// <param name="ct">取消令牌</param>
    Task LogFromContextAsync(string action, string resourceType, string? resourceId = null,
        string? description = null, CancellationToken ct = default);

    /// <summary>
    /// 分页查询审计日志
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="page">页码（从 1 开始）</param>
    /// <param name="pageSize">每页条数</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>分页结果</returns>
    Task<PagedResult<AuditLogDto>> GetAuditLogsAsync(Guid tenantId, int page = 1, int pageSize = 20,
        CancellationToken ct = default);
}

/// <summary>
/// 审计日志 DTO — 用于查询结果展示
/// </summary>
public class AuditLogDto
{
    /// <summary>
    /// 日志 ID
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// 所属租户 ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 操作用户 ID
    /// </summary>
    public Guid? UserId { get; set; }

    /// <summary>
    /// 操作类型
    /// </summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// 资源类型
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
    /// HTTP 方法
    /// </summary>
    public string? HttpMethod { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; }
}
