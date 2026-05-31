using EquipAI.Application.Interfaces;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Text.Json;

namespace EquipAI.WebAPI.Middleware;

/// <summary>
/// 权限校验中间件，检查当前用户角色是否具备端点所需的权限
/// 放置在 WebAPI 层而非 Infrastructure 层，因为需要引用 Application 层的 IRbacService 接口
/// （Infrastructure 不依赖 Application，避免循环引用）
/// </summary>
public class PermissionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<PermissionMiddleware> _logger;

    /// <summary>
    /// 初始化权限校验中间件
    /// </summary>
    /// <param name="next">管道中的下一个中间件</param>
    /// <param name="logger">日志记录器</param>
    public PermissionMiddleware(RequestDelegate next, ILogger<PermissionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    /// <summary>
    /// 处理 HTTP 请求，检查端点是否标注了 RequirePermissionAttribute
    /// 若有则从 JWT Claims 中提取角色，通过 IRbacService 校验权限
    /// </summary>
    /// <param name="context">当前 HTTP 上下文</param>
    public async Task InvokeAsync(HttpContext context)
    {
        // 获取当前端点的元数据，查找权限要求标记
        var endpoint = context.GetEndpoint();
        if (endpoint == null)
        {
            await _next(context);
            return;
        }

        // 收集所有权限要求（支持 Controller 级别和 Action 级别叠加）
        var requiredPermissions = endpoint.Metadata
            .GetOrderedMetadata<RequirePermissionAttribute>();

        if (requiredPermissions.Count == 0)
        {
            // 无权限要求，直接放行
            await _next(context);
            return;
        }

        // 从 JWT Claims 中提取用户角色
        var roleClaim = context.User.FindFirst("role");
        if (roleClaim == null)
        {
            _logger.LogWarning("请求缺少角色声明，拒绝访问：{Path}", context.Request.Path);
            await WriteUnauthorizedResponse(context, "缺少身份认证信息");
            return;
        }

        var role = roleClaim.Value;

        // 通过 DI 容器获取 RBAC 权限校验服务
        // 采用 GetRequiredService 而非构造函数注入，因为中间件生命周期为 Singleton
        // 而 IRbacService 可能为 Scoped
        var rbacService = context.RequestServices.GetService(typeof(IRbacService)) as IRbacService;
        if (rbacService == null)
        {
            _logger.LogError("IRbacService 未注册到 DI 容器，无法进行权限校验");
            await WriteForbiddenResponse(context, "权限校验服务不可用");
            return;
        }

        // 逐项校验所需权限，任一不满足即拒绝
        foreach (var permissionAttr in requiredPermissions)
        {
            if (!rbacService.HasPermission(role, permissionAttr.Permission))
            {
                _logger.LogWarning(
                    "权限不足：角色 {Role} 缺少权限 {Permission}，路径：{Path}",
                    role, permissionAttr.Permission, context.Request.Path
                );
                await WriteForbiddenResponse(context, $"权限不足：缺少 {permissionAttr.Permission} 权限");
                return;
            }
        }

        // 所有权限校验通过，继续执行后续管道
        await _next(context);
    }

    /// <summary>
    /// 写入 401 未授权响应
    /// </summary>
    private static async Task WriteUnauthorizedResponse(HttpContext context, string message)
    {
        context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
        context.Response.ContentType = "application/json";

        var response = new
        {
            code = 401,
            message,
            details = (string?)null
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
    }

    /// <summary>
    /// 写入 403 禁止访问响应
    /// </summary>
    private static async Task WriteForbiddenResponse(HttpContext context, string message)
    {
        context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
        context.Response.ContentType = "application/json";

        var response = new
        {
            code = 403,
            message,
            details = (string?)null
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
    }
}
