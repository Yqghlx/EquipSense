using System.Security.Claims;
using EquipAI.Core.Constants;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Tenant;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace EquipAI.Infrastructure.Middleware;

/// <summary>
/// 租户解析中间件，从 JWT 令牌或请求头中提取租户信息
/// 优先级：1) JWT "tenant_id" Claim  2) X-Tenant-Id 请求头
/// 解析结果存储在 HttpContext.Items["TenantContext"] 中，供后续服务和 EF Core 全局过滤器使用
/// </summary>
public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantResolutionMiddleware> _logger;

    /// <summary>
    /// HttpContext.Items 中存储租户上下文的键名
    /// </summary>
    public const string TenantContextKey = "TenantContext";

    /// <summary>
    /// 初始化租户解析中间件
    /// </summary>
    /// <param name="next">管道中的下一个中间件</param>
    /// <param name="logger">日志记录器</param>
    public TenantResolutionMiddleware(RequestDelegate next, ILogger<TenantResolutionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    /// <summary>
    /// 处理 HTTP 请求，解析租户上下文并注入到 HttpContext.Items
    /// </summary>
    /// <param name="context">当前 HTTP 上下文</param>
    public async Task InvokeAsync(HttpContext context)
    {
        var tenantId = Guid.Empty;
        var isSystemAdmin = false;

        // 优先级 1：从 JWT Claims 中提取 tenant_id 和 role
        var tenantIdClaim = context.User.FindFirst("tenant_id");
        if (tenantIdClaim != null && Guid.TryParse(tenantIdClaim.Value, out var parsedTenantId))
        {
            tenantId = parsedTenantId;
        }

        // 检查是否为系统管理员角色
        var roleClaim = context.User.FindFirst("role");
        if (roleClaim != null)
        {
            isSystemAdmin = roleClaim.Value == UserRole.SystemAdmin.ToString();
        }

        // 优先级 2：若 JWT 中无 tenant_id，则尝试从请求头获取
        if (tenantId == Guid.Empty)
        {
            var headerTenantId = context.Request.Headers["X-Tenant-Id"].FirstOrDefault();
            if (!string.IsNullOrEmpty(headerTenantId) && Guid.TryParse(headerTenantId, out var headerParsed))
            {
                tenantId = headerParsed;
            }
        }

        // 仅在认证用户且存在租户标识时创建租户上下文
        // 未认证用户（如登录接口）不需要租户上下文
        if (context.User.Identity?.IsAuthenticated == true && tenantId != Guid.Empty)
        {
            var tenantContext = new TenantContext(
                tenantId,
                TenantIsolationMode.Shared.ToString(),
                isSystemAdmin
            );

            context.Items[TenantContextKey] = tenantContext;

            _logger.LogDebug(
                "租户上下文已解析：TenantId={TenantId}, IsSystemAdmin={IsSystemAdmin}",
                tenantContext.TenantId,
                tenantContext.IsSystemAdmin
            );
        }

        await _next(context);
    }
}
