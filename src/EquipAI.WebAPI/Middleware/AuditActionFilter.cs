using System.Diagnostics.CodeAnalysis;
using System.Text.Json;
using EquipAI.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;

namespace EquipAI.WebAPI.Middleware;

/// <summary>
/// 全局审计日志 Action Filter
///
/// 自动拦截所有非 GET 写操作（POST/PUT/PATCH/DELETE），在响应后记录审计日志：
/// - 资源类型：优先取 [Audit] 特性，否则从 Controller 名推断（DevicesController → Device）
/// - 动作类型：优先取 [Audit] 特性，否则从 HTTP 方法推断（POST→Create, PUT→Update, DELETE→Delete）
/// - 资源 ID：三步回退 — 路由 id → 方法参数 *Id → 创建操作从响应 DTO 反射 Id（修复创建类审计 resourceId 缺失）
/// - 描述：包含 HTTP 状态码，便于区分成功/失败
///
/// 标注 [SkipAudit] 可跳过特定操作（如高频心跳、登录刷新）
/// </summary>
public sealed class AuditActionFilter : IAsyncActionFilter, IOrderedFilter
{
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<AuditActionFilter> _logger;

    // Filter 应在权限校验之后、响应返回之前执行，保证只审计通过权限的请求
    // AuthorizationMiddleware 默认 Order=0，此处放负值确保在其后
    public int Order => -100;

    public AuditActionFilter(IAuditLogService auditLogService, ILogger<AuditActionFilter> logger)
    {
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var executedContext = await next();

        try
        {
            // 只审计写操作（非 GET），且只在 Action 是 Controller 方法时处理
            if (!ShouldAudit(context, executedContext))
                return;

            var (action, resourceType) = ResolveActionAndResource(context);
            if (resourceType is null)
                return;

            var resourceId = ResolveResourceId(context, executedContext);
            var statusCode = executedContext.HttpContext.Response.StatusCode;
            var isSuccess = statusCode is >= 200 and < 400;

            var description = $"{action} {resourceType}"
                              + (resourceId is not null ? $" ({resourceId})" : string.Empty)
                              + (isSuccess ? " — 成功" : $" — 失败[{statusCode}]");

            await _auditLogService.LogFromContextAsync(
                action: action,
                resourceType: resourceType,
                resourceId: resourceId,
                description: description,
                ct: executedContext.HttpContext.RequestAborted);
        }
        catch (Exception ex)
        {
            // 审计失败绝不影响业务响应
            _logger.LogWarning(ex, "审计日志记录异常: {Path}", context.HttpContext.Request.Path);
        }
    }

    /// <summary>判断是否需要审计：非 GET + 非 SkipAudit + 非 AuthController 的登录探活类</summary>
    private static bool ShouldAudit(ActionExecutingContext context, ActionExecutedContext executedContext)
    {
        var method = context.HttpContext.Request.Method;
        if (method.Equals("GET", StringComparison.OrdinalIgnoreCase) ||
            method.Equals("HEAD", StringComparison.OrdinalIgnoreCase) ||
            method.Equals("OPTIONS", StringComparison.OrdinalIgnoreCase))
            return false;

        if (context.ActionDescriptor is not ControllerActionDescriptor cad)
            return false;

        // 显式跳过
        if (HasAttribute<SkipAuditAttribute>(cad))
            return false;

        return true;
    }

    /// <summary>解析动作和资源类型：[Audit] 特性优先，否则自动推断</summary>
    private static (string Action, string? ResourceType) ResolveActionAndResource(ActionExecutingContext context)
    {
        if (context.ActionDescriptor is not ControllerActionDescriptor cad)
            return (context.HttpContext.Request.Method, null);

        // 1. 显式 [Audit] 特性覆盖
        var attr = GetAttribute<AuditAttribute>(cad);
        if (attr is not null)
            return (attr.Action, attr.ResourceType);

        // 2. 自动推断：HTTP 方法 → 动作
        var method = context.HttpContext.Request.Method.ToUpperInvariant();
        var action = method switch
        {
            "POST" => "Create",
            "PUT" or "PATCH" => "Update",
            "DELETE" => "Delete",
            _ => method,
        };

        // 3. 自动推断：Controller 名 → 资源类型（去复数 s）
        //    DevicesController → Device, WorkOrdersController → WorkOrder, AlertsController → Alert
        var controllerName = cad.ControllerTypeInfo.Name;
        var resourceType = InferResourceType(controllerName);

        return (action, resourceType);
    }

    /// <summary>从 Controller 类名推断资源类型（DevicesController → Device）</summary>
    private static string? InferResourceType(string controllerName)
    {
        if (controllerName.EndsWith("Controller", StringComparison.OrdinalIgnoreCase))
            controllerName = controllerName[..^"Controller".Length];

        // 去掉复数（简单规则：以 s 结尾且长度 > 1）
        if (controllerName.Length > 1 && controllerName.EndsWith('s'))
            controllerName = controllerName[..^1];

        return controllerName.Length > 0 ? controllerName : null;
    }

    /// <summary>
    /// 解析资源 ID，三步回退：
    /// 1. 路由 id（Update/Delete/{id} 等带主键的端点）
    /// 2. 方法参数 *Id 命名的 Guid（如 deviceId、workOrderId）
    /// 3. 创建操作（POST）：从响应结果（ObjectResult.Value 的 DTO）反射 Id 字段
    ///
    /// 第 3 步修复创建类审计的 resourceId 缺失：POST /resources 既无路由 id，方法参数又是
    /// [FromBody] request（不以 Id 结尾），传统两步取不到。创建类端点（CreateDevice/CreateAlertRule/
    /// CreateWorkOrder 等）的响应体含新资源 DTO（Id 已生成），反射提取以追溯具体创建了哪个资源，
    /// 否则审计只记"Create Device — 成功"而无 resourceId，无法定位是哪台设备/工单/规则。
    /// </summary>
    private static string? ResolveResourceId(ActionExecutingContext context, ActionExecutedContext executedContext)
    {
        var httpRoute = context.HttpContext.GetRouteData().Values;

        // 1. 路由 id（Update/Delete 等带主键的端点）
        if (httpRoute.TryGetValue("id", out var id) && id is not null)
            return id.ToString();

        // 2. 方法参数 *Id 命名的 Guid
        foreach (var (key, value) in context.ActionArguments)
        {
            if (key.EndsWith("Id", StringComparison.OrdinalIgnoreCase) && value is not null)
                return value.ToString();
        }

        // 3. 创建操作（POST）：从响应结果反射新资源 Id
        if (executedContext.Result is ObjectResult { Value: { } resultValue })
        {
            var idProp = resultValue.GetType().GetProperty("Id");
            if (idProp?.GetValue(resultValue) is { } createdId)
                return createdId.ToString();
        }

        return null;
    }

    private static bool HasAttribute<T>(ControllerActionDescriptor cad) where T : Attribute
        => GetAttribute<T>(cad) is not null;

    [return: MaybeNull]
    private static T? GetAttribute<T>(ControllerActionDescriptor cad) where T : Attribute
    {
        // 方法级优先
        if (Attribute.IsDefined(cad.MethodInfo, typeof(T)))
            return (T?)Attribute.GetCustomAttribute(cad.MethodInfo, typeof(T));
        // 再查类级
        if (Attribute.IsDefined(cad.ControllerTypeInfo, typeof(T)))
            return (T?)Attribute.GetCustomAttribute(cad.ControllerTypeInfo, typeof(T));
        return null;
    }
}
