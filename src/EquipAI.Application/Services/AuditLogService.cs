using EquipAI.Application.DTOs.Common;
using EquipAI.Core.Models;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Services;

/// <summary>
/// 审计日志服务实现 — 记录系统敏感操作，支持从 HTTP 上下文自动提取请求信息
/// 使用 IServiceScopeFactory 创建独立作用域访问 DbContext，避免与业务 DbContext 产生事务冲突
/// </summary>
public class AuditLogService : IAuditLogService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AuditLogService> _logger;
    private readonly IServiceProvider _sp;

    public AuditLogService(
        IServiceScopeFactory scopeFactory,
        ILogger<AuditLogService> logger,
        IServiceProvider sp)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _sp = sp;
    }

    /// <inheritdoc />
    public async Task LogAsync(Guid tenantId, string action, string resourceType,
        string? resourceId = null, string? description = null, CancellationToken ct = default)
    {
        // 创建独立作用域获取 DbContext，避免与业务操作的 DbContext 共享事务
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var tenantContext = _sp.GetService<ITenantContext>();
        var httpContextAccessor = _sp.GetService<IHttpContextAccessor>();
        var httpContext = httpContextAccessor?.HttpContext;

        var auditLog = new AuditLog
        {
            TenantId = tenantId,
            UserId = tenantContext?.UserId,
            Action = action,
            ResourceType = resourceType,
            ResourceId = resourceId,
            Description = description ?? $"{action} {resourceType}",
            IpAddress = httpContext?.Connection.RemoteIpAddress?.ToString(),
            RequestPath = httpContext?.Request.Path,
            HttpMethod = httpContext?.Request.Method,
            UserAgent = httpContext?.Request.Headers.UserAgent.ToString()
        };

        // 审计日志直接通过 DbSet 写入，Add 操作不受查询过滤器影响
        db.Set<AuditLog>().Add(auditLog);

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            // 审计日志写入失败不应中断业务流程，仅记录警告
            _logger.LogWarning(ex, "审计日志写入失败: Action={Action}, Resource={ResourceType}",
                action, resourceType);
        }
    }

    /// <inheritdoc />
    public async Task LogFromContextAsync(string action, string resourceType,
        string? resourceId = null, string? description = null, CancellationToken ct = default)
    {
        var tenantContext = _sp.GetService<ITenantContext>();
        var tenantId = tenantContext?.TenantId ?? Guid.Empty;
        await LogAsync(tenantId, action, resourceType, resourceId, description, ct);
    }

    /// <inheritdoc />
    public async Task<PagedResult<AuditLogDto>> GetAuditLogsAsync(Guid tenantId, int page = 1,
        int pageSize = 20, CancellationToken ct = default, string? action = null,
        string? resourceType = null)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var query = db.UnfilteredSet<AuditLog>()
            .Where(a => a.TenantId == tenantId);

        // 必须在 Count/Skip/Take 之前应用筛选，否则分页总数和页内容都会失真，
        // 合规审计人员可能无法翻到后续页面中的匹配记录。
        if (!string.IsNullOrWhiteSpace(action))
        {
            var actionFilter = action.Trim().ToLowerInvariant();
            query = query.Where(a => a.Action.ToLower() == actionFilter);
        }

        if (!string.IsNullOrWhiteSpace(resourceType))
        {
            var resourceTypeFilter = resourceType.Trim().ToLowerInvariant();
            query = query.Where(a => a.ResourceType.ToLower() == resourceTypeFilter);
        }

        query = query.OrderByDescending(a => a.CreatedAt);

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditLogDto
            {
                Id = a.Id,
                TenantId = a.TenantId,
                UserId = a.UserId,
                Action = a.Action,
                ResourceType = a.ResourceType,
                ResourceId = a.ResourceId,
                Description = a.Description,
                IpAddress = a.IpAddress,
                RequestPath = a.RequestPath,
                HttpMethod = a.HttpMethod,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync(ct);

        return new PagedResult<AuditLogDto>
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }
}
