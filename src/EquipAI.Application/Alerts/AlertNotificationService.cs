using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Alerts;

/// <summary>
/// 告警多渠道通知服务
///
/// 在告警触发时，根据租户的集成配置（tenant.Settings.integrations），
/// 向钉钉、飞书机器人主动推送告警卡片，并持久化站内通知记录。
///
/// 配置格式（与工单集成共享 tenant.Settings.integrations）：
/// {
///   "integrations": {
///     "dingtalk": { "enabled": true, "webhookUrl": "...", "secret": "...", "atMobiles": [] },
///     "feishu":   { "enabled": true, "webhookUrl": "..." }
///   }
/// }
///
/// 设计要点：
/// - 钉钉/飞书推送失败不影响主流程，但每个渠道最多重试 3 次并记录最终失败
/// - 仅 Critical/High 级别告警推送机器人（避免低级别告警刷屏）
/// - 站内通知始终持久化（所有级别）
/// </summary>
public class AlertNotificationService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<AlertNotificationService> _logger;

    private const string DateFormat = "yyyy-MM-dd HH:mm";

    /// <summary>
    /// 告警机器人单次通知的最大尝试次数。
    /// 告警事件仍需快速交给消息总线确认，因此只做有限重试，不在事件处理器内无限等待。
    /// </summary>
    private const int MaxRobotPushAttempts = 3;

    /// <summary>
    /// 告警机器人失败后的退避间隔，避免短暂网络抖动时连续轰炸外部平台。
    /// </summary>
    private static readonly TimeSpan[] RobotRetryDelays =
    [
        TimeSpan.FromSeconds(1),
        TimeSpan.FromSeconds(2),
    ];

    /// <summary>触发机器人推送的最低告警级别（Critical/High）</summary>
    private static readonly HashSet<string> BotPushSeverities = new(StringComparer.OrdinalIgnoreCase)
    {
        "Critical", "High",
    };

    public AlertNotificationService(
        IServiceScopeFactory scopeFactory,
        IHttpClientFactory httpClientFactory,
        ILogger<AlertNotificationService> logger)
    {
        _scopeFactory = scopeFactory;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    /// <summary>
    /// 处理告警通知分发：持久化站内通知 + 钉钉/飞书机器人推送（仅 Critical/High）
    /// </summary>
    public async Task DispatchAsync(
        AlertTriggeredEvent @event, Alert alert, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 查询设备友好标识（编码+名称），站内通知内容与机器人卡片共用——
        // 关键修复：历史站内通知 Content 直接拼 alert.DeviceId（原始 UUID），运维在通知列表看到的是
        // 不可读的 GUID，而同一告警的钉钉/飞书卡片却显示友好标识，体验不一致且不专业。
        // 此处统一查询一次 deviceLabel，站内通知与机器人推送共用，消除重复查询。
        // 后台事件处理器无 HttpContext，须绕过全局租户过滤器；但仍必须校验事件租户，
        // 防止错误或伪造的设备 ID 把其他租户的编码/名称带入通知。
        var deviceLabel = await db.UnfilteredSet<Core.Entities.Device>()
            .Where(d => d.Id == @event.DeviceId && d.TenantId == @event.TenantId)
            .Select(d => d.DeviceCode + (string.IsNullOrEmpty(d.Name) ? "" : $"（{d.Name}）"))
            .FirstOrDefaultAsync(ct) ?? @event.DeviceId.ToString();

        // 1. 持久化站内通知（所有级别都记，内容含设备友好标识而非 UUID）
        await PersistInAppNotificationAsync(@event, alert, deviceLabel, ct);

        // 2. 钉钉/飞书机器人推送（仅 Critical/High，避免低级别刷屏）
        if (!BotPushSeverities.Contains(@event.Severity))
            return;

        var configs = await GetIntegrationConfigsAsync(db, @event.TenantId, ct);

        foreach (var (type, enabled, config) in configs)
        {
            if (!enabled) continue;

            try
            {
                if (type == "dingtalk")
                {
                    await PushRobotWithRetryAsync(
                        "钉钉", alert.Id,
                        () => PushDingTalkAsync(@event, alert, deviceLabel, config!, ct),
                        ct);
                }
                else if (type == "feishu")
                {
                    await PushRobotWithRetryAsync(
                        "飞书", alert.Id,
                        () => PushFeishuAsync(@event, alert, deviceLabel, config!, ct),
                        ct);
                }
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                // 机器人单次推送失败可以隔离，但停机或消息处理超时取消必须传播，避免告警事件被错误确认。
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "告警机器人推送失败: Type={Type}, AlertId={AlertId}", type, alert.Id);
            }
        }
    }

    /// <summary>
    /// 执行告警机器人有限重试。
    /// 适配器返回 false 表示外部平台明确返回失败；普通异常同样重试，取消信号则立即传播。
    /// </summary>
    private async Task PushRobotWithRetryAsync(
        string integrationType,
        Guid alertId,
        Func<Task<bool>> pushFunc,
        CancellationToken ct)
    {
        Exception? lastException = null;

        for (var attempt = 0; attempt < MaxRobotPushAttempts; attempt++)
        {
            try
            {
                if (await pushFunc())
                    return;

                _logger.LogWarning(
                    "告警机器人推送返回失败（第 {Attempt}/{Max} 次）: Type={Type}, AlertId={AlertId}",
                    attempt + 1, MaxRobotPushAttempts, integrationType, alertId);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                // 宿主停机或消息处理超时取消必须交给消息总线处理，不能转换成普通推送失败。
                throw;
            }
            catch (Exception ex)
            {
                lastException = ex;
                _logger.LogWarning(ex,
                    "告警机器人推送异常（第 {Attempt}/{Max} 次）: Type={Type}, AlertId={AlertId}",
                    attempt + 1, MaxRobotPushAttempts, integrationType, alertId);
            }

            if (attempt < MaxRobotPushAttempts - 1)
                await Task.Delay(RobotRetryDelays[attempt], ct);
        }

        _logger.LogError(
            lastException,
            "告警机器人推送最终失败: Type={Type}, AlertId={AlertId}, 重试 {Max} 次后仍失败",
            integrationType, alertId, MaxRobotPushAttempts);
    }

    /// <summary>持久化站内通知记录到 notifications 表</summary>
    /// <param name="deviceLabel">设备友好标识（编码+名称），由 DispatchAsync 统一查询后传入，避免重复查询</param>
    private async Task PersistInAppNotificationAsync(
        AlertTriggeredEvent @event, Alert alert, string deviceLabel, CancellationToken ct)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var severityText = @event.Severity switch
            {
                "Critical" => "严重",
                "High" => "高级",
                "Normal" => "一般",
                _ => "低",
            };

            // 给租户内所有运维相关用户发通知（维保主管 + 技术员 + 系统管理员）
            var recipientIds = await db.UnfilteredSet<User>()
                .Where(u => u.TenantId == @event.TenantId
                            && u.IsActive
                            && (u.Role == UserRole.SystemAdmin
                                || u.Role == UserRole.MaintenanceLead
                                || u.Role == UserRole.Technician))
                .Select(u => u.Id)
                .ToListAsync(ct);

            foreach (var userId in recipientIds)
            {
                db.Notifications.Add(new Notification
                {
                    TenantId = @event.TenantId,
                    UserId = userId,
                    Type = "alert",
                    Title = $"[{severityText}] 设备告警：{@event.Metric} 异常",
                    Content = $"设备 {deviceLabel} 的指标 {@event.Metric} 当前值 {@event.Value}，触发 {@event.Severity} 级别告警。",
                    RelatedId = alert.Id,
                    Link = $"/alerts?alertId={alert.Id}",
                });
            }

            await db.SaveChangesAsync(ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // 站内通知写入是告警通知链的一部分，取消时必须交由上层消息总线重试，不能静默降级。
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "站内通知持久化失败: AlertId={AlertId}", alert.Id);
        }
    }

    /// <summary>钉钉机器人推送（加签 + ActionCard）</summary>
    private async Task<bool> PushDingTalkAsync(AlertTriggeredEvent @event, Alert alert, string deviceLabel, string config, CancellationToken ct)
    {
        var dingConfig = TryDeserialize<DingTalkConfig>(config);
        if (dingConfig is null || string.IsNullOrEmpty(dingConfig.WebhookUrl))
            return false;

        var url = BuildDingTalkSignedUrl(dingConfig);
        var now = DateTime.UtcNow.ToString(DateFormat);
        var critical = @event.Severity.Equals("Critical", StringComparison.OrdinalIgnoreCase);
        var severityText = critical ? "🔴 严重" : "🟠 高级";

        var text =
            "## ⚠️ 设备告警通知\n\n" +
            $"- **级别**: {severityText}\n" +
            $"- **设备**: {deviceLabel}\n" +
            $"- **指标**: {@event.Metric}\n" +
            $"- **当前值**: {@event.Value}\n" +
            $"- **告警编码**: {alert.AlertCode}\n" +
            $"- **触发时间**: {now}\n\n" +
            "请及时确认处理";

        var message = new
        {
            msgtype = "actionCard",
            actionCard = new
            {
                title = $"设备告警：{@event.Metric} 异常",
                text,
                btnOrientation = "1",
            },
            at = new { atMobiles = dingConfig.AtMobiles ?? new List<string>(), isAtAll = critical },
        };

        var client = _httpClientFactory.CreateClient("AlertIntegration");
        var resp = await client.PostAsJsonAsync(url, message, ct);
        var responseBody = await resp.Content.ReadAsStringAsync(ct);
        if (!resp.IsSuccessStatusCode || !IsDingTalkSuccessResponse(responseBody))
        {
            _logger.LogWarning("告警钉钉推送失败: AlertId={AlertId}, Status={Status}",
                alert.Id, resp.StatusCode);
            return false;
        }

        _logger.LogInformation("告警钉钉推送完成: AlertId={AlertId}, Status={Status}", alert.Id, resp.StatusCode);
        return true;
    }

    /// <summary>飞书机器人推送（交互式卡片消息）</summary>
    /// <remarks>
    /// 支持两种接入方式（自动判断）：
    /// 1. 应用机器人：配置 appId + appSecret + chatId，走 im/v1/messages API（需开通 im:message 权限）
    /// 2. 自定义机器人 Webhook：配置 webhookUrl，直接 POST（更简单，无需应用审批）
    /// </remarks>
    private async Task<bool> PushFeishuAsync(AlertTriggeredEvent @event, Alert alert, string deviceLabel, string config, CancellationToken ct)
    {
        var feishuConfig = TryDeserialize<FeishuAlertConfig>(config);
        if (feishuConfig is null)
            return false;

        var severityText = @event.Severity.Equals("Critical", StringComparison.OrdinalIgnoreCase) ? "🔴 严重" : "🟠 高级";
        var now = DateTime.UtcNow.ToString(DateFormat);
        var headerColor = @event.Severity.Equals("Critical", StringComparison.OrdinalIgnoreCase) ? "red" : "orange";

        // 飞书交互卡片内容（两种接入方式共用）
        var card = new
        {
            config = new { wide_screen_mode = true },
            header = new
            {
                title = new { tag = "plain_text", content = "⚠️ 设备告警通知" },
                template = headerColor,
            },
            elements = new object[]
            {
                new { tag = "div", text = new { tag = "lark_md", content = $"**级别**: {severityText}" } },
                new { tag = "div", text = new { tag = "lark_md", content = $"**设备**: {deviceLabel}" } },
                new { tag = "div", text = new { tag = "lark_md", content = $"**指标**: {@event.Metric}  当前值: {@event.Value}" } },
                new { tag = "div", text = new { tag = "lark_md", content = $"**告警编码**: {alert.AlertCode}" } },
                new { tag = "div", text = new { tag = "lark_md", content = $"**触发时间**: {now}" } },
                new { tag = "hr" },
                new { tag = "note", elements = new[] { new { tag = "plain_text", content = "请及时确认处理" } } },
            },
        };

        var client = _httpClientFactory.CreateClient("AlertIntegration");

        // 方式一：应用机器人（appId + appSecret + chatId）
        if (!string.IsNullOrEmpty(feishuConfig.AppId) && !string.IsNullOrEmpty(feishuConfig.ChatId))
        {
            return await PushFeishuViaAppAsync(client, feishuConfig, card, alert.Id, ct);
        }

        // 方式二：自定义机器人 Webhook
        if (!string.IsNullOrEmpty(feishuConfig.WebhookUrl))
        {
            var message = new { msg_type = "interactive", card };
            var resp = await client.PostAsJsonAsync(feishuConfig.WebhookUrl, message, ct);
            var responseBody = await resp.Content.ReadAsStringAsync(ct);
            if (!resp.IsSuccessStatusCode || !IsFeishuSuccessResponse(responseBody))
            {
                _logger.LogWarning("告警飞书推送失败（Webhook）: AlertId={AlertId}, Status={Status}",
                    alert.Id, resp.StatusCode);
                return false;
            }

            _logger.LogInformation("告警飞书推送完成（Webhook）: AlertId={AlertId}, Status={Status}", alert.Id, resp.StatusCode);
            return true;
        }

        return false;
    }

    /// <summary>飞书应用机器人推送：先获取 tenant_access_token，再调 im/v1/messages 发送卡片</summary>
    private async Task<bool> PushFeishuViaAppAsync(HttpClient client, FeishuAlertConfig config, object card, Guid alertId, CancellationToken ct)
    {
        // 1. 获取 tenant_access_token
        var tokenReq = new
        {
            app_id = config.AppId,
            app_secret = config.AppSecret,
        };
        var tokenResp = await client.PostAsJsonAsync("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", tokenReq, ct);
        if (!tokenResp.IsSuccessStatusCode)
        {
            _logger.LogWarning("飞书应用 token 获取失败: Status={Status}", tokenResp.StatusCode);
            return false;
        }

        var tokenJson = await tokenResp.Content.ReadFromJsonAsync<JsonElement>(ct);
        if (tokenJson.TryGetProperty("tenant_access_token", out var tokenEl)
            && !string.IsNullOrWhiteSpace(tokenEl.GetString()))
        {
            var accessToken = tokenEl.GetString()!;
            // 2. 发送交互卡片到指定群
            var messageReq = new
            {
                receive_id = config.ChatId,
                msg_type = "interactive",
                content = JsonSerializer.Serialize(card),  // content 必须是字符串化的 JSON
            };
            var msgReq = new HttpRequestMessage(HttpMethod.Post, "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id")
            {
                Headers = { { "Authorization", $"Bearer {accessToken}" } },
                Content = JsonContent.Create(messageReq),
            };
            var msgResp = await client.SendAsync(msgReq, ct);
            var msgBody = await msgResp.Content.ReadAsStringAsync(ct);
            if (!msgResp.IsSuccessStatusCode || !IsFeishuSuccessResponse(msgBody))
            {
                _logger.LogWarning("告警飞书推送失败（App）: AlertId={AlertId}, Status={Status}",
                    alertId, msgResp.StatusCode);
                return false;
            }

            _logger.LogInformation("告警飞书推送完成（App）: AlertId={AlertId}, Status={Status}",
                alertId, msgResp.StatusCode);
            return true;
        }

        _logger.LogWarning("飞书应用 token 响应异常，未继续发送消息");
        return false;
    }

    /// <summary>读取租户的集成配置（复用工单集成的 tenant.Settings.integrations 格式）</summary>
    private async Task<List<(string Type, bool Enabled, string Config)>> GetIntegrationConfigsAsync(
        AppDbContext db, Guid tenantId, CancellationToken ct)
    {
        var result = new List<(string, bool, string)>();
        var tenant = await db.UnfilteredSet<Tenant>().FirstOrDefaultAsync(t => t.Id == tenantId, ct);
        if (tenant is null || string.IsNullOrEmpty(tenant.Settings))
            return result;

        try
        {
            var json = JsonDocument.Parse(tenant.Settings);
            if (!json.RootElement.TryGetProperty("integrations", out var integrations))
                return result;

            foreach (var prop in integrations.EnumerateObject())
            {
                var enabled = prop.Value.TryGetProperty("enabled", out var e) && e.GetBoolean();
                result.Add((prop.Name, enabled, prop.Value.GetRawText()));
            }
        }
        catch (JsonException ex)
        {
            // 配置解析失败会导致该租户的所有集成通知静默失效，必须留痕以便排查
            _logger.LogWarning(ex, "租户集成配置解析失败，将跳过所有集成通知");
        }
        return result;
    }

    /// <summary>构建钉钉加签 URL（HmacSHA256）</summary>
    private static string BuildDingTalkSignedUrl(DingTalkConfig config)
    {
        var url = config.WebhookUrl;
        if (string.IsNullOrEmpty(config.Secret)) return url;

        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var stringToSign = $"{timestamp}\n{config.Secret}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(config.Secret));
        var sign = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(stringToSign)));
        var separator = url.Contains('?') ? "&" : "?";
        return $"{url}{separator}timestamp={timestamp}&sign={Uri.EscapeDataString(sign)}";
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private static T? TryDeserialize<T>(string json) where T : class
    {
        try { return JsonSerializer.Deserialize<T>(json, JsonOptions); }
        catch { return null; }
    }

    /// <summary>
    /// 判断钉钉响应是否真正成功。
    /// 钉钉部分业务错误会以 HTTP 200 + errcode 非 0 返回，不能只看 HTTP 状态码。
    /// </summary>
    private static bool IsDingTalkSuccessResponse(string responseBody)
    {
        try
        {
            using var document = JsonDocument.Parse(responseBody);
            return document.RootElement.TryGetProperty("errcode", out var errorCode)
                && errorCode.TryGetInt32(out var code)
                && code == 0;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    /// <summary>
    /// 判断飞书响应是否包含明确的业务错误码。
    /// 自定义 Webhook 可能返回纯文本，因此缺少 code 时沿用 HTTP 成功语义。
    /// </summary>
    private static bool IsFeishuSuccessResponse(string responseBody)
    {
        if (string.IsNullOrWhiteSpace(responseBody))
            return true;

        try
        {
            using var document = JsonDocument.Parse(responseBody);
            if (!document.RootElement.TryGetProperty("code", out var code))
                return true;
            return code.TryGetInt32(out var value) && value == 0;
        }
        catch (JsonException)
        {
            return true;
        }
    }

    // 嵌套配置类（告警推送用，与工单集成配置字段兼容）
    private sealed class DingTalkConfig
    {
        public string WebhookUrl { get; set; } = string.Empty;
        public string? Secret { get; set; }
        public List<string> AtMobiles { get; set; } = [];
    }

    private sealed class FeishuAlertConfig
    {
        /// <summary>自定义机器人 Webhook URL（方式二，简单接入）</summary>
        public string? WebhookUrl { get; set; }

        /// <summary>飞书应用 App ID（方式一，应用机器人）</summary>
        public string? AppId { get; set; }

        /// <summary>飞书应用 App Secret（方式一）</summary>
        public string? AppSecret { get; set; }

        /// <summary>目标群聊 chat_id（方式一，应用机器人发消息的目标群）</summary>
        public string? ChatId { get; set; }
    }
}
