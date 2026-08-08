using System.Text.Json;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WebPush;

namespace EquipAI.Application.Notifications;

/// <summary>
/// Web Push 推送通知服务
/// 使用 VAPID 协议向浏览器推送通知
/// 支持指定用户推送和租户广播两种模式
/// </summary>
public class PushNotificationService : IPushNotificationService
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<PushNotificationService> _logger;
    private readonly string _vapidSubject;
    private readonly string? _vapidPublicKey;
    private readonly string? _vapidPrivateKey;

    public PushNotificationService(
        AppDbContext dbContext,
        IConfiguration configuration,
        ILogger<PushNotificationService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;

        _vapidSubject = configuration["Vapid:Subject"]
            ?? "mailto:admin@equipsense.com";
        // 关键修复：VAPID 密钥未配置时不再抛异常（构造时抛 InvalidOperationException 会被
        // ExceptionHandlingMiddleware 映射为 409，导致拉取本服务的任意请求 — 如 SLA 概览 —
        // 全部失败）。改为延迟到实际发送时降级：开发/测试/未启用 Web Push 的部署应能正常
        // 运行其他功能，仅推送功能不可用。
        _vapidPublicKey = configuration["Vapid:PublicKey"];
        _vapidPrivateKey = configuration["Vapid:PrivateKey"];
    }

    /// <inheritdoc />
    public async Task RegisterSubscriptionAsync(Guid tenantId, Guid userId,
        string endpoint, string p256dh, string auth, string? userAgent = null)
    {
        var existing = await _dbContext.PushSubscriptions
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.Endpoint == endpoint);

        if (existing != null)
        {
            existing.TenantId = tenantId;
            existing.UserId = userId;
            existing.P256dh = p256dh;
            existing.Auth = auth;
            existing.UserAgent = userAgent;
            existing.IsActive = true;
        }
        else
        {
            _dbContext.PushSubscriptions.Add(new Core.Entities.PushSubscription
            {
                TenantId = tenantId,
                UserId = userId,
                Endpoint = endpoint,
                P256dh = p256dh,
                Auth = auth,
                UserAgent = userAgent,
                IsActive = true,
            });
        }

        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("推送订阅已注册: UserId={UserId}, Endpoint={Endpoint}", userId, endpoint);
    }

    /// <inheritdoc />
    public async Task UnregisterSubscriptionAsync(Guid userId, string endpoint)
    {
        var sub = await _dbContext.PushSubscriptions
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Endpoint == endpoint);

        if (sub != null)
        {
            _dbContext.PushSubscriptions.Remove(sub);
            await _dbContext.SaveChangesAsync();
            _logger.LogInformation("推送订阅已注销: UserId={UserId}", userId);
        }
    }

    /// <inheritdoc />
    public async Task SendToUserAsync(Guid tenantId, Guid userId,
        string title, string body, string? url = null)
    {
        var subscriptions = await _dbContext.PushSubscriptions
            .IgnoreQueryFilters()
            .Where(s => s.TenantId == tenantId && s.UserId == userId && s.IsActive)
            .ToListAsync();

        var payload = JsonSerializer.Serialize(new { title, body, url });
        await SendPayloadToSubscriptions(subscriptions, payload);
    }

    /// <inheritdoc />
    public async Task SendToTenantAsync(Guid tenantId,
        string title, string body, string? url = null)
    {
        var subscriptions = await _dbContext.PushSubscriptions
            .IgnoreQueryFilters()
            .Where(s => s.TenantId == tenantId && s.IsActive)
            .ToListAsync();

        var payload = JsonSerializer.Serialize(new { title, body, url });
        await SendPayloadToSubscriptions(subscriptions, payload);
    }

    /// <summary>
    /// 向订阅列表批量发送推送载荷
    /// 自动清理无效订阅（410 Gone 响应）
    /// </summary>
    private async Task SendPayloadToSubscriptions(
        List<Core.Entities.PushSubscription> subscriptions, string payload)
    {
        // VAPID 未配置时降级：订阅管理仍可用，仅发送功能跳过
        if (string.IsNullOrEmpty(_vapidPublicKey) || string.IsNullOrEmpty(_vapidPrivateKey))
        {
            _logger.LogWarning("VAPID 未配置，浏览器推送通知功能不可用。请设置 Vapid:PublicKey / Vapid:PrivateKey 以启用");
            return;
        }

        var vapidDetails = new VapidDetails(_vapidSubject, _vapidPublicKey, _vapidPrivateKey);
        var webPushClient = new WebPushClient();

        foreach (var sub in subscriptions)
        {
            try
            {
                var pushSubscription = new WebPush.PushSubscription(
                    sub.Endpoint, sub.P256dh, sub.Auth);

                await webPushClient.SendNotificationAsync(pushSubscription, payload, vapidDetails);
            }
            catch (WebPushException ex)
            {
                if (ex.StatusCode == System.Net.HttpStatusCode.Gone)
                {
                    _logger.LogWarning("推送订阅已过期，自动清理: Endpoint={Endpoint}", sub.Endpoint);
                    _dbContext.PushSubscriptions.Remove(sub);
                    await _dbContext.SaveChangesAsync();
                }
                else
                {
                    _logger.LogError(ex, "推送通知发送失败: Endpoint={Endpoint}", sub.Endpoint);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "推送通知发送异常: Endpoint={Endpoint}", sub.Endpoint);
            }
        }
    }
}
