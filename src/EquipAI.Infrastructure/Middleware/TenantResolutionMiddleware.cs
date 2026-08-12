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
/// 解析规则：
/// 1) JWT "tenant_id" Claim —— 所有用户的权威租户归属（登录时签发，不可伪造）
/// 2) X-Tenant-Id 请求头 —— 仅系统管理员可用，用于跨租户运维（如切换到某租户排查问题）；
///    普通用户发送该头将被忽略并记安全告警，绝不允许通过请求头改写租户。
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
        var userId = Guid.Empty;

        // 优先级 1：从 JWT Claims 中提取 tenant_id 和 role
        var tenantIdClaim = context.User.FindFirst("tenant_id");
        if (tenantIdClaim != null && Guid.TryParse(tenantIdClaim.Value, out var parsedTenantId))
        {
            tenantId = parsedTenantId;
        }

        // 检查是否为系统管理员角色
        var roleClaim = context.User.FindFirst("role");

        // 从 JWT Claims 中提取用户 ID。JwtBearer 的声明映射配置可能被宿主关闭，
        // 因此不能只依赖映射后的 NameIdentifier，必须兼容 JWT 标准 sub 声明。
        var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)
            ?? context.User.FindFirst("sub");
        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var parsedUserId))
        {
            userId = parsedUserId;
        }
        if (roleClaim != null)
        {
            isSystemAdmin = roleClaim.Value == UserRole.SystemAdmin.ToString();
        }

        // 优先级 2：X-Tenant-Id 请求头 —— 仅系统管理员可用。
        // 安全约束：普通用户的租户归属完全由 JWT tenant_id 决定，绝不允许通过请求头改写。
        // 否则任何持有"无 tenant_id 令牌"（未来平台级账号或令牌签发缺陷）的用户即可越权访问任意租户。
        // 将该权限显式收敛到系统管理员，使安全属性不再依赖"所有令牌都含 tenant_id"这一偶然前提。
        var headerTenantId = context.Request.Headers["X-Tenant-Id"].FirstOrDefault();
        if (!string.IsNullOrEmpty(headerTenantId) && Guid.TryParse(headerTenantId, out var headerParsed))
        {
            if (isSystemAdmin)
            {
                // 管理员：用请求头覆盖租户上下文，实现跨租户管理（合法运维场景）
                tenantId = headerParsed;
                _logger.LogDebug(
                    "系统管理员 {UserId} 通过 X-Tenant-Id 切换到租户 {TenantId}",
                    userId, headerParsed);
            }
            else
            {
                // 普通用户尝试通过请求头改写租户：疑似越权探测，忽略并记安全告警供运维排查
                _logger.LogWarning(
                    "非管理员用户 {UserId} 尝试通过 X-Tenant-Id 请求头改写租户（疑似越权），已忽略",
                    userId);
            }
        }

        // 仅在认证用户且存在租户标识时创建租户上下文
        // 未认证用户（如登录接口）不需要租户上下文
        if (context.User.Identity?.IsAuthenticated == true && tenantId != Guid.Empty)
        {
            var tenantContext = new TenantContext(
                tenantId,
                TenantIsolationMode.Shared.ToString(),
                isSystemAdmin,
                userId
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
