using EquipAI.Core.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Text.Json;

namespace EquipAI.Infrastructure.Middleware;

/// <summary>
/// 用量限制中间件
/// 在创建资源的请求到达 Controller 前检查租户配额
/// 拦截 POST 请求，根据路径判断资源类型，调用 ISubscriptionService 检查配额
/// </summary>
public class UsageLimitMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<UsageLimitMiddleware> _logger;

    public UsageLimitMiddleware(RequestDelegate next, ILogger<UsageLimitMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    /// <summary>
    /// 处理请求：仅对 POST 创建请求进行配额检查
    /// </summary>
    /// <param name="context">当前 HTTP 上下文</param>
    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value;
        var method = context.Request.Method;

        // 仅拦截 POST 创建请求
        if (method != "POST")
        {
            await _next(context);
            return;
        }

        var resourceType = GetResourceType(path);
        if (resourceType == null)
        {
            await _next(context);
            return;
        }

        // 从 HttpContext.Items 获取租户上下文（由 TenantResolutionMiddleware 写入）
        if (!context.Items.TryGetValue(TenantResolutionMiddleware.TenantContextKey, out var tenantCtxObj)
            || tenantCtxObj is not ITenantContext tenantCtx
            || tenantCtx.TenantId == Guid.Empty)
        {
            await _next(context);
            return;
        }

        // 按需解析 ISubscriptionService，避免未注册时阻断整个管线
        var subscriptionService = context.RequestServices.GetService<ISubscriptionService>();
        if (subscriptionService == null)
        {
            await _next(context);
            return;
        }

        var canCreate = await subscriptionService.CanCreateResourceAsync(
            tenantCtx.TenantId, resourceType, context.RequestAborted);

        if (!canCreate)
        {
            _logger.LogWarning("租户 {TenantId} 超出 {ResourceType} 配额限制", tenantCtx.TenantId, resourceType);
            context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
            context.Response.ContentType = "application/json";
            var resourceTypeName = resourceType == "device" ? "设备" : "用户";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                code = 403,
                message = $"已超出{resourceTypeName}数量上限，请升级计划",
                details = (string?)null
            }, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
            return;
        }

        await _next(context);
    }

    /// <summary>
    /// 根据请求路径判断资源类型
    /// 目前支持：设备 (/api/v1/devices) 和 用户 (/api/v1/admin/users)
    /// </summary>
    /// <param name="path">请求路径</param>
    /// <returns>资源类型标识，或 null 表示无需配额检查</returns>
    private static string? GetResourceType(string? path)
    {
        if (path == null) return null;
        if (path.StartsWith("/api/v1/devices", StringComparison.OrdinalIgnoreCase))
            return "device";
        if (path.StartsWith("/api/v1/admin/users", StringComparison.OrdinalIgnoreCase))
            return "user";
        return null;
    }
}
