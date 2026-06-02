using System.Net.Http.Json;
using System.Text.Json;
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders.Integration;

/// <summary>
/// 通用 Webhook 集成
/// 工单创建/状态变更时发送 POST 请求到配置的 URL
/// 集成失败时记录日志但不影响主流程（fire-and-forget 容错策略）
/// </summary>
public class WebhookIntegration : IWorkOrderIntegration
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<WebhookIntegration> _logger;

    public string IntegrationType => "webhook";

    public WebhookIntegration(ILogger<WebhookIntegration> logger)
    {
        _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
        _logger = logger;
    }

    public async Task<string?> PushCreatedAsync(Guid tenantId, Guid workOrderId, string title, string priority, string config, CancellationToken ct = default)
    {
        var webhookConfig = DeserializeConfig<WebhookConfig>(config);
        if (webhookConfig == null || string.IsNullOrEmpty(webhookConfig.Url))
        {
            _logger.LogWarning("Webhook 配置无效，跳过推送");
            return null;
        }

        var payload = new
        {
            workOrderId,
            title,
            priority,
            status = "created",
            tenantId,
            timestamp = DateTime.UtcNow
        };

        return await SendWebhookAsync(webhookConfig, payload, ct);
    }

    public async Task PushStatusChangedAsync(Guid tenantId, Guid workOrderId, string status, string? externalId, string config, CancellationToken ct = default)
    {
        var webhookConfig = DeserializeConfig<WebhookConfig>(config);
        if (webhookConfig == null || string.IsNullOrEmpty(webhookConfig.Url)) return;

        var payload = new
        {
            workOrderId,
            externalId,
            status,
            tenantId,
            timestamp = DateTime.UtcNow
        };

        await SendWebhookAsync(webhookConfig, payload, ct);
    }

    /// <summary>
    /// 发送 Webhook 请求，失败时仅记录日志不抛出异常
    /// </summary>
    private async Task<string?> SendWebhookAsync(WebhookConfig config, object payload, CancellationToken ct)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Post, config.Url)
            {
                Content = JsonContent.Create(payload)
            };

            if (!string.IsNullOrEmpty(config.Secret))
            {
                request.Headers.Add("X-Webhook-Secret", config.Secret);
            }

            var response = await _httpClient.SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            _logger.LogInformation("Webhook 推送完成: URL={Url}, Status={Status}, Body={Body}",
                config.Url, response.StatusCode, responseBody);

            return response.IsSuccessStatusCode ? responseBody : null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Webhook 推送失败: URL={Url}", config.Url);
            return null;
        }
    }

    /// <summary>
    /// 反序列化配置 JSON，失败时返回 null
    /// </summary>
    private static T? DeserializeConfig<T>(string config) where T : class
    {
        try { return JsonSerializer.Deserialize<T>(config); }
        catch { return null; }
    }
}
