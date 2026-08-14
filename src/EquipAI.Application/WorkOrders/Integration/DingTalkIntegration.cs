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
/// 支持加签安全模式（HmacSHA256 签名验证）
/// 消息格式：ActionCard 卡片（支持在钉钉内直接查看工单详情）
/// </summary>
public class DingTalkIntegration : IWorkOrderIntegration
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<DingTalkIntegration> _logger;

    /// <summary>日期格式化常量</summary>
    private const string DateFormat = "yyyy-MM-dd HH:mm";

    public string IntegrationType => "dingtalk";

    public DingTalkIntegration(IHttpClientFactory httpClientFactory, ILogger<DingTalkIntegration> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    /// <summary>
    /// 推送工单创建通知
    /// 使用 ActionCard 消息格式，支持在钉钉内直接跳转查看工单详情
    /// </summary>
    public async Task<string?> PushCreatedAsync(
        Guid tenantId, Guid workOrderId, string title, string priority,
        string config, CancellationToken ct = default)
    {
        var dingConfig = DeserializeConfig(config);
        if (dingConfig == null || string.IsNullOrEmpty(dingConfig.WebhookUrl))
        {
            _logger.LogWarning("钉钉配置无效，跳过推送");
            return null;
        }

        var url = BuildSignedUrl(dingConfig);
        var now = DateTime.UtcNow.ToString(DateFormat);

        // 构建 ActionCard 正文 Markdown
        var text =
            "## 新工单通知\n\n" +
            $"- **工单编号**: {workOrderId}\n" +
            $"- **标题**: {title}\n" +
            $"- **优先级**: {priority}\n" +
            $"- **创建时间**: {now}\n\n" +
            "请及时处理";

        var message = BuildActionCardMessage(
            $"新工单：{title}",
            text,
            dingConfig.BaseUrl,
            workOrderId,
            dingConfig.AtMobiles);

        return await SendDingTalkAsync(url, message, ct);
    }

    /// <summary>
    /// 推送工单状态变更通知
    /// 使用 ActionCard 消息格式，支持在钉钉内直接跳转查看工单详情
    /// </summary>
    public async Task<bool> PushStatusChangedAsync(
        Guid tenantId, Guid workOrderId, string status, string? externalId,
        string config, CancellationToken ct = default)
    {
        var dingConfig = DeserializeConfig(config);
        if (dingConfig == null || string.IsNullOrEmpty(dingConfig.WebhookUrl))
            return false;

        var url = BuildSignedUrl(dingConfig);
        var now = DateTime.UtcNow.ToString(DateFormat);

        var statusText = status switch
        {
            "Assigned" => "已派工",
            "InProgress" => "执行中",
            "Completed" => "已完成",
            "Closed" => "已关闭",
            _ => status
        };

        var text =
            "## 工单状态变更\n\n" +
            $"- **工单编号**: {workOrderId}\n" +
            $"- **当前状态**: {statusText}\n" +
            $"- **更新时间**: {now}";

        var message = BuildActionCardMessage(
            $"工单状态变更：{statusText}",
            text,
            dingConfig.BaseUrl,
            workOrderId,
            dingConfig.AtMobiles);

        var responseBody = await SendDingTalkAsync(url, message, ct);
        return responseBody is not null;
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

    /// <summary>
    /// 构建 ActionCard 消息体
    /// 当 BaseUrl 已配置时，添加"查看详情"按钮；否则不添加按钮
    /// </summary>
    private static object BuildActionCardMessage(
        string title, string text, string? baseUrl, Guid workOrderId, List<string> atMobiles)
    {
        // 根据 BaseUrl 是否配置决定是否添加按钮
        object? btns = null;
        if (!string.IsNullOrEmpty(baseUrl))
        {
            // 拼接查看详情链接，确保 baseUrl 末尾无多余斜杠
            var cleanBaseUrl = baseUrl.TrimEnd('/');
            btns = new[]
            {
                new { title = "查看详情", actionURL = $"{cleanBaseUrl}/work-orders/{workOrderId}" }
            };
        }

        return new
        {
            msgtype = "actionCard",
            actionCard = new
            {
                title,
                text,
                btnOrientation = "1", // 按钮竖直排列
                btns
            },
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
            var response = await _httpClientFactory.CreateClient("WorkOrderIntegration").PostAsJsonAsync(url, message, ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("钉钉推送失败: Host={Host}, Status={Status}",
                    GetTargetHost(url), response.StatusCode);
                return null;
            }

            // 钉钉业务错误可能使用 HTTP 200 返回，必须校验 errcode，
            // 否则路由器会误记为成功并跳过重试，造成工单通知静默丢失。
            if (!IsDingTalkSuccessResponse(body))
            {
                _logger.LogWarning("钉钉推送业务失败: Host={Host}, Status={Status}",
                    GetTargetHost(url), response.StatusCode);
                return null;
            }

            _logger.LogInformation("钉钉推送完成: Host={Host}, Status={Status}",
                GetTargetHost(url), response.StatusCode);
            return body;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // 普通网络故障可以降级，但宿主停机或消息处理超时取消必须传播给集成路由。
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "钉钉推送失败: Host={Host}", GetTargetHost(url));
            return null;
        }
    }

    /// <summary>
    /// 判断钉钉响应是否真正表示推送成功。
    /// 钉钉机器人可能以 HTTP 200 返回非零 errcode，不能只看 HTTP 状态码。
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
        catch (InvalidOperationException)
        {
            return false;
        }
    }

    /// <summary>
    /// 反序列化配置 JSON，失败时返回 null
    /// </summary>
    private static DingTalkConfig? DeserializeConfig(string config)
    {
        try { return JsonSerializer.Deserialize<DingTalkConfig>(config, IntegrationJsonOptions.Default); }
        catch { return null; }
    }

    /// <summary>
    /// 仅提取目标主机用于日志，避免记录带签名的完整 Webhook URL。
    /// </summary>
    private static string GetTargetHost(string? rawUrl)
        => Uri.TryCreate(rawUrl, UriKind.Absolute, out var uri) ? uri.Host : "unknown";
}
