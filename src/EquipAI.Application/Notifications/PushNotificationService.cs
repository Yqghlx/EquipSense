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
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<PushNotificationService> _logger;
    private readonly string _vapidSubject;
    private readonly string? _vapidPublicKey;
    private readonly string? _vapidPrivateKey;

    public PushNotificationService(
        AppDbContext dbContext,
        ITenantContext tenantContext,
        IConfiguration configuration,
        ILogger<PushNotificationService> logger)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
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
        EnsureSelfServiceScope(tenantId, userId);

        var existing = await _dbContext.PushSubscriptions
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.Endpoint == endpoint);

        if (existing != null)
        {
            if (existing.TenantId != tenantId)
            {
                throw new InvalidOperationException("推送 endpoint 已属于其他租户，不能重复注册");
            }

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
        EnsureSelfServiceScope(_tenantContext.TenantId, userId);

        var sub = await _dbContext.PushSubscriptions
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.TenantId == _tenantContext.TenantId
                                   && s.UserId == userId
                                   && s.Endpoint == endpoint);

        if (sub != null)
        {
            _dbContext.PushSubscriptions.Remove(sub);
            await _dbContext.SaveChangesAsync();
            _logger.LogInformation("推送订阅已注销: UserId={UserId}", userId);
        }
    }

    /// <summary>
    /// 校验自助订阅操作只能作用于当前认证用户和当前租户。
    ///
    /// 为什么：注册和注销接口接收应用层参数，不能只依赖控制器当前实现传入上下文值；
    /// 一旦出现新的调用方或参数映射错误，严格拒绝身份缺失/不匹配可以避免跨租户写入和代替其他用户删除订阅。
    /// 后台发送方法使用显式目标租户和用户，不复用此校验。
    /// </summary>
    private void EnsureSelfServiceScope(Guid tenantId, Guid userId)
    {
        if (tenantId == Guid.Empty
            || _tenantContext.TenantId == Guid.Empty
            || tenantId != _tenantContext.TenantId)
        {
            _logger.LogWarning(
                "推送订阅操作被拒绝：租户上下文不匹配，RequestedTenantId={RequestedTenantId}, CurrentTenantId={CurrentTenantId}",
                tenantId,
                _tenantContext.TenantId);
            throw new UnauthorizedAccessException("只能操作当前租户的推送订阅");
        }

        if (userId == Guid.Empty
            || _tenantContext.UserId == Guid.Empty
            || userId != _tenantContext.UserId)
        {
            _logger.LogWarning(
                "推送订阅操作被拒绝：用户上下文不匹配，RequestedUserId={RequestedUserId}, CurrentUserId={CurrentUserId}",
                userId,
                _tenantContext.UserId);
            throw new UnauthorizedAccessException("只能操作当前用户的推送订阅");
        }
    }

    /// <inheritdoc />
    public async Task SendToUserAsync(Guid tenantId, Guid userId,
        string title, string body, string? url = null)
    {
        await SendToUsersAsync(tenantId, [userId], title, body, url);
    }

    /// <inheritdoc />
    public async Task SendToUsersAsync(Guid tenantId, IReadOnlyCollection<Guid> userIds,
        string title, string body, string? url = null, CancellationToken cancellationToken = default)
    {
        var selectedUserIds = userIds
            .Where(userId => userId != Guid.Empty)
            .Distinct()
            .ToArray();

        if (tenantId == Guid.Empty || selectedUserIds.Length == 0)
            return;

        cancellationToken.ThrowIfCancellationRequested();

        var subscriptions = await _dbContext.PushSubscriptions
            .IgnoreQueryFilters()
            .Where(subscription => subscription.TenantId == tenantId
                && selectedUserIds.Contains(subscription.UserId)
                && subscription.IsActive)
            .ToListAsync(cancellationToken);

        var payload = JsonSerializer.Serialize(new { title, body, url });
        await SendPayloadToSubscriptions(subscriptions, payload, cancellationToken);
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
        await SendPayloadToSubscriptions(subscriptions, payload, CancellationToken.None);
    }

    /// <summary>
    /// 向订阅列表批量发送推送载荷
    /// 自动清理无效订阅（410 Gone 响应）
    /// </summary>
    private async Task SendPayloadToSubscriptions(
        List<Core.Entities.PushSubscription> subscriptions,
        string payload,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

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
            cancellationToken.ThrowIfCancellationRequested();

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
                    await _dbContext.SaveChangesAsync(cancellationToken);
                }
                else
                {
                    _logger.LogError(ex, "推送通知发送失败: Endpoint={Endpoint}", sub.Endpoint);
                }
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "推送通知发送异常: Endpoint={Endpoint}", sub.Endpoint);
            }
        }
    }
}
