using EquipAI.Application.Notifications.DTOs;
using EquipAI.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 推送订阅管理 API
/// 提供浏览器推送订阅的注册、注销和 VAPID 公钥获取
/// </summary>
[ApiController]
[Route("api/v1/push")]
[Authorize]
public class PushSubscriptionsController : ControllerBase
{
    private readonly IPushNotificationService _pushService;
    private readonly ITenantContext _tenantContext;
    private readonly IConfiguration _configuration;

    public PushSubscriptionsController(
        IPushNotificationService pushService,
        ITenantContext tenantContext,
        IConfiguration configuration)
    {
        _pushService = pushService;
        _tenantContext = tenantContext;
        _configuration = configuration;
    }

    /// <summary>
    /// 获取 VAPID 公钥
    /// GET /api/v1/push/vapid-public-key
    /// </summary>
    [HttpGet("vapid-public-key")]
    [AllowAnonymous]
    public ActionResult<string> GetVapidPublicKey()
    {
        var publicKey = _configuration["Vapid:PublicKey"];
        if (string.IsNullOrEmpty(publicKey))
        {
            return StatusCode(503, new { code = "PUSH_NOT_CONFIGURED", message = "推送服务未配置" });
        }

        return Ok(new { publicKey });
    }

    /// <summary>
    /// 注册推送订阅
    /// POST /api/v1/push/subscribe
    /// </summary>
    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe([FromBody] RegisterPushSubscriptionRequest request)
    {
        var userId = _tenantContext.UserId;
        var tenantId = _tenantContext.TenantId;
        var userAgent = Request.Headers.UserAgent.ToString();

        await _pushService.RegisterSubscriptionAsync(
            tenantId, userId,
            request.Endpoint, request.P256dh, request.Auth,
            userAgent);

        return Ok(new { message = "推送订阅注册成功" });
    }

    /// <summary>
    /// 注销推送订阅
    /// DELETE /api/v1/push/subscribe
    /// </summary>
    [HttpDelete("subscribe")]
    public async Task<IActionResult> Unsubscribe([FromBody] UnregisterPushSubscriptionRequest request)
    {
        var userId = _tenantContext.UserId;

        await _pushService.UnregisterSubscriptionAsync(userId, request.Endpoint);

        return Ok(new { message = "推送订阅注销成功" });
    }
}

/// <summary>
/// 注销推送订阅请求
/// </summary>
public record UnregisterPushSubscriptionRequest
{
    /// <summary>推送端点 URL</summary>
    public string Endpoint { get; init; } = string.Empty;
}
