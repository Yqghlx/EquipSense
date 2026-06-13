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
/// - 钉钉/飞书推送失败不影响主流程（仅日志记录）
/// - 仅 Critical/High 级别告警推送机器人（避免低级别告警刷屏）
/// - 站内通知始终持久化（所有级别）
/// </summary>
public class AlertNotificationService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<AlertNotificationService> _logger;

    private const string DateFormat = "yyyy-MM-dd HH:mm";

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
        // 1. 持久化站内通知（所有级别都记）
        await PersistInAppNotificationAsync(@event, alert, ct);

        // 2. 钉钉/飞书机器人推送（仅 Critical/High，避免低级别刷屏）
        if (!BotPushSeverities.Contains(@event.Severity))
            return;

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var configs = await GetIntegrationConfigsAsync(db, @event.TenantId, ct);

        foreach (var (type, enabled, config) in configs)
        {
            if (!enabled) continue;

            try
            {
                if (type == "dingtalk")
                    await PushDingTalkAsync(@event, alert, config, ct);
                else if (type == "feishu")
                    await PushFeishuAsync(@event, alert, config, ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "告警机器人推送失败: Type={Type}, AlertId={AlertId}", type, alert.Id);
            }
        }
    }

    /// <summary>持久化站内通知记录到 notifications 表</summary>
    private async Task PersistInAppNotificationAsync(AlertTriggeredEvent @event, Alert alert, CancellationToken ct)
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
                    Content = $"设备 {alert.DeviceId} 的指标 {@event.Metric} 当前值 {@event.Value}，触发 {@event.Severity} 级别告警。",
                    RelatedId = alert.Id,
                    Link = $"/alerts?alertId={alert.Id}",
                });
            }

            await db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "站内通知持久化失败: AlertId={AlertId}", alert.Id);
        }
    }

    /// <summary>钉钉机器人推送（加签 + ActionCard）</summary>
    private async Task PushDingTalkAsync(AlertTriggeredEvent @event, Alert alert, string config, CancellationToken ct)
    {
        var dingConfig = TryDeserialize<DingTalkConfig>(config);
        if (dingConfig is null || string.IsNullOrEmpty(dingConfig.WebhookUrl))
            return;

        var url = BuildDingTalkSignedUrl(dingConfig);
        var now = DateTime.UtcNow.ToString(DateFormat);
        var critical = @event.Severity.Equals("Critical", StringComparison.OrdinalIgnoreCase);
        var severityText = critical ? "🔴 严重" : "🟠 高级";

        var text =
            "## ⚠️ 设备告警通知\n\n" +
            $"- **级别**: {severityText}\n" +
            $"- **设备**: {alert.DeviceId}\n" +
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
        _logger.LogInformation("告警钉钉推送完成: AlertId={AlertId}, Status={Status}", alert.Id, resp.StatusCode);
    }

    /// <summary>飞书机器人推送（交互式卡片消息）</summary>
    private async Task PushFeishuAsync(AlertTriggeredEvent @event, Alert alert, string config, CancellationToken ct)
    {
        var feishuConfig = TryDeserialize<FeishuAlertConfig>(config);
        if (feishuConfig is null || string.IsNullOrEmpty(feishuConfig.WebhookUrl))
            return;

        var severityText = @event.Severity.Equals("Critical", StringComparison.OrdinalIgnoreCase) ? "🔴 严重" : "🟠 高级";
        var now = DateTime.UtcNow.ToString(DateFormat);
        var headerColor = @event.Severity.Equals("Critical", StringComparison.OrdinalIgnoreCase) ? "red" : "orange";

        // 飞书自定义机器人交互卡片格式
        var message = new
        {
            msg_type = "interactive",
            card = new
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
                    new { tag = "div", text = new { tag = "lark_md", content = $"**设备**: {alert.DeviceId}" } },
                    new { tag = "div", text = new { tag = "lark_md", content = $"**指标**: {@event.Metric}  当前值: {@event.Value}" } },
                    new { tag = "div", text = new { tag = "lark_md", content = $"**告警编码**: {alert.AlertCode}" } },
                    new { tag = "div", text = new { tag = "lark_md", content = $"**触发时间**: {now}" } },
                    new { tag = "hr" },
                    new { tag = "note", elements = new[] { new { tag = "plain_text", content = "请及时确认处理" } } },
                },
            },
        };

        var client = _httpClientFactory.CreateClient("AlertIntegration");
        var resp = await client.PostAsJsonAsync(feishuConfig.WebhookUrl, message, ct);
        _logger.LogInformation("告警飞书推送完成: AlertId={AlertId}, Status={Status}", alert.Id, resp.StatusCode);
    }

    /// <summary>读取租户的集成配置（复用工单集成的 tenant.Settings.integrations 格式）</summary>
    private static async Task<List<(string Type, bool Enabled, string Config)>> GetIntegrationConfigsAsync(
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
        catch (JsonException)
        {
            // 配置解析失败静默跳过
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

    private static T? TryDeserialize<T>(string json) where T : class
    {
        try { return JsonSerializer.Deserialize<T>(json); }
        catch { return null; }
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
        public string? WebhookUrl { get; set; }
    }
}
