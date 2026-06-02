using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders.Integration;

/// <summary>
/// 钉钉自定义机器人集成
/// 使用钉钉自定义机器人 Webhook 推送工单通知
/// 支持加签安全模式（Secret 签名验证）
/// 消息格式：Markdown 卡片（标题 + 工单详情）
/// </summary>
public class DingTalkIntegration : IWorkOrderIntegration
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<DingTalkIntegration> _logger;

    public string IntegrationType => "dingtalk";

    public DingTalkIntegration(ILogger<DingTalkIntegration> logger)
    {
        _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
        _logger = logger;
    }

    public async Task<string?> PushCreatedAsync(Guid tenantId, Guid workOrderId, string title, string priority, string config, CancellationToken ct = default)
    {
        var dingConfig = DeserializeConfig(config);
        if (dingConfig == null || string.IsNullOrEmpty(dingConfig.WebhookUrl))
        {
            _logger.LogWarning("钉钉配置无效，跳过推送");
            return null;
        }

        var url = BuildSignedUrl(dingConfig);
        var message = BuildMarkdownMessage(
            $"【新工单】{title}",
            $"### 新工单通知\n\n" +
            $"- **工单 ID**: {workOrderId}\n" +
            $"- **标题**: {title}\n" +
            $"- **优先级**: {priority}\n" +
            $"- **时间**: {DateTime.UtcNow:yyyy-MM-dd HH:mm}\n\n" +
            $"请及时处理",
            dingConfig.AtMobiles);

        return await SendDingTalkAsync(url, message, ct);
    }

    public async Task PushStatusChangedAsync(Guid tenantId, Guid workOrderId, string status, string? externalId, string config, CancellationToken ct = default)
    {
        var dingConfig = DeserializeConfig(config);
        if (dingConfig == null || string.IsNullOrEmpty(dingConfig.WebhookUrl)) return;

        var url = BuildSignedUrl(dingConfig);
        var statusText = status switch
        {
            "Assigned" => "已派工",
            "InProgress" => "执行中",
            "Completed" => "已完成",
            "Closed" => "已关闭",
            _ => status
        };

        var message = BuildMarkdownMessage(
            $"【工单状态更新】{statusText}",
            $"### 工单状态更新\n\n" +
            $"- **工单 ID**: {workOrderId}\n" +
            $"- **当前状态**: {statusText}\n" +
            $"- **更新时间**: {DateTime.UtcNow:yyyy-MM-dd HH:mm}",
            dingConfig.AtMobiles);

        await SendDingTalkAsync(url, message, ct);
    }

    /// <summary>
    /// 构建加签后的 Webhook URL
    /// 钉钉加签算法：HmacSHA256(timestamp + "\n" + secret) → Base64 → URL 编码
    /// </summary>
    private static string BuildSignedUrl(DingTalkConfig config)
    {
        var url = config.WebhookUrl;
        if (string.IsNullOrEmpty(config.Secret)) return url;

        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var stringToSign = $"{timestamp}\n{config.Secret}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(config.Secret));
        var signBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(stringToSign));
        var sign = Convert.ToBase64String(signBytes);
        var encodedSign = Uri.EscapeDataString(sign);

        var separator = url.Contains('?') ? "&" : "?";
        return $"{url}{separator}timestamp={timestamp}&sign={encodedSign}";
    }

    private static object BuildMarkdownMessage(string title, string text, List<string> atMobiles)
    {
        return new
        {
            msgtype = "markdown",
            markdown = new { title, text },
            at = new { atMobiles, isAtAll = false }
        };
    }

    /// <summary>
    /// 发送钉钉消息，失败时仅记录日志不抛出异常
    /// </summary>
    private async Task<string?> SendDingTalkAsync(string url, object message, CancellationToken ct)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync(url, message, ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            _logger.LogInformation("钉钉推送完成: Status={Status}, Body={Body}", response.StatusCode, body);
            return response.IsSuccessStatusCode ? body : null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "钉钉推送失败: URL={Url}", url);
            return null;
        }
    }

    /// <summary>
    /// 反序列化配置 JSON，失败时返回 null
    /// </summary>
    private static DingTalkConfig? DeserializeConfig(string config)
    {
        try { return JsonSerializer.Deserialize<DingTalkConfig>(config); }
        catch { return null; }
    }
}
