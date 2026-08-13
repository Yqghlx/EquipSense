using System.Net;
using EquipAI.Core.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace EquipAI.Infrastructure.Middleware;

/// <summary>
/// 全局异常处理中间件，捕获未处理的异常并转换为标准化的 HTTP 响应
/// 响应格式统一为：{ code, message, details }
/// 4xx 错误记录为 Warning 级别，5xx 错误记录为 Error 级别
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    /// <summary>
    /// 初始化异常处理中间件
    /// </summary>
    /// <param name="next">管道中的下一个中间件</param>
    /// <param name="logger">日志记录器</param>
    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    /// <summary>
    /// 处理 HTTP 请求，捕获管道中抛出的异常并统一处理
    /// </summary>
    /// <param name="context">当前 HTTP 上下文</param>
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    /// <summary>
    /// 根据异常类型映射为对应的 HTTP 状态码和错误响应
    /// </summary>
    /// <param name="context">HTTP 上下文</param>
    /// <param name="exception">捕获的异常</param>
    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, message) = exception switch
        {
            // 403：用户已认证，但不具备执行当前业务操作的权限
            ForbiddenAccessException forbidden => (HttpStatusCode.Forbidden, forbidden.Message),
            // 401：未授权访问（如未登录或令牌无效）
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, "未授权的访问"),
            // 404：资源不存在
            KeyNotFoundException => (HttpStatusCode.NotFound, "请求的资源不存在"),
            // 403：租户资源配额已用尽
            ResourceQuotaExceededException quota => (HttpStatusCode.Forbidden, quota.Message),
            // 409：业务冲突（如重复创建、状态不允许的操作）
            InvalidOperationException => (HttpStatusCode.Conflict, "操作冲突"),
            // 400：请求参数错误
            ArgumentException => (HttpStatusCode.BadRequest, "请求参数无效"),
            // 500：未知的服务器内部错误
            _ => (HttpStatusCode.InternalServerError, "服务器内部错误")
        };

        var logLevel = (int)statusCode >= 500 ? LogLevel.Error : LogLevel.Warning;
        _logger.Log(logLevel, exception, "请求处理异常：{StatusCode} - {Message}，路径：{Path}",
            (int)statusCode, message, context.Request.Path);

        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/json";

        var response = new
        {
            code = (int)statusCode,
            message,
            details = (string?)null
        };

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
