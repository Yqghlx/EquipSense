using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders.Integration;

/// <summary>
/// 通用 Webhook 集成
/// 工单创建/状态变更时发送 POST 请求到配置的 URL
/// 支持变量插值模板和 HMAC-SHA256 签名头
/// 集成失败时记录日志但不影响主流程（fire-and-forget 容错策略）
/// </summary>
public class WebhookIntegration : IWorkOrderIntegration
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<WebhookIntegration> _logger;

    /// <summary>
    /// 变量插值正则表达式，匹配 {{object.property}} 格式
    /// </summary>
    private static readonly Regex VariablePattern = new(
        @"\{\{(\w+)\.(\w+)\}\}",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public string IntegrationType => "webhook";

    public WebhookIntegration(IHttpClientFactory httpClientFactory, ILogger<WebhookIntegration> logger)
    {
        _httpClientFactory = httpClientFactory;
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

        // 构建变量字典，用于模板插值
        var variables = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["workOrder.code"] = workOrderId.ToString(),
            ["workOrder.title"] = title,
            ["workOrder.status"] = "created",
            ["workOrder.priority"] = priority,
            ["workOrder.deviceName"] = string.Empty,
            ["workOrder.description"] = string.Empty,
            ["workOrder.assignedTo"] = string.Empty,
            ["workOrder.createdAt"] = DateTime.UtcNow.ToString("O")
        };

        string body;
        if (!string.IsNullOrEmpty(webhookConfig.BodyTemplate))
        {
            // 使用自定义模板进行变量插值
            body = InterpolateVariables(webhookConfig.BodyTemplate, variables);
        }
        else
        {
            // 无模板时使用默认 JSON payload
            var payload = new
            {
                workOrderId,
                title,
                priority,
                status = "created",
                tenantId,
                timestamp = DateTime.UtcNow
            };
            body = JsonSerializer.Serialize(payload);
        }

        return await SendWebhookAsync(webhookConfig, body, ct);
    }

    public async Task<bool> PushStatusChangedAsync(Guid tenantId, Guid workOrderId, string status, string? externalId, string config, CancellationToken ct = default)
    {
        var webhookConfig = DeserializeConfig<WebhookConfig>(config);
        if (webhookConfig == null || string.IsNullOrEmpty(webhookConfig.Url)) return false;

        var payload = new
        {
            workOrderId,
            externalId,
            status,
            tenantId,
            timestamp = DateTime.UtcNow
        };

        var body = JsonSerializer.Serialize(payload);
        var responseBody = await SendWebhookAsync(webhookConfig, body, ct);
        return responseBody is not null;
    }

    /// <summary>
    /// 变量插值：将模板中的 {{object.property}} 替换为实际值
    /// 未匹配的占位符保留原样，不静默丢弃
    /// </summary>
    /// <param name="template">模板字符串</param>
    /// <param name="variables">变量字典（键为 "object.property" 格式）</param>
    /// <returns>插值后的字符串</returns>
    internal static string InterpolateVariables(string template, Dictionary<string, string> variables)
    {
        return VariablePattern.Replace(template, match =>
        {
            // 拼接 object.property 格式的键，用于查找变量字典
            var key = $"{match.Groups[1].Value}.{match.Groups[2].Value}";
            return variables.TryGetValue(key, out var value) ? value : match.Value;
        });
    }

    /// <summary>
    /// 计算 HMAC-SHA256 签名
    /// 格式：sha256={hexString}
    /// </summary>
    /// <param name="body">请求体内容</param>
    /// <param name="secret">签名密钥</param>
    /// <returns>签名字符串</returns>
    internal static string ComputeSignature(string body, string secret)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(body));
        return $"sha256={Convert.ToHexString(hashBytes).ToLowerInvariant()}";
    }

    /// <summary>
    /// 发送 Webhook 请求，失败时仅记录日志不抛出异常
    /// </summary>
    private async Task<string?> SendWebhookAsync(WebhookConfig config, string body, CancellationToken ct)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Post, config.Url)
            {
                Content = new StringContent(body, Encoding.UTF8, "application/json")
            };

            // 保留原有的 Secret 头逻辑
            if (!string.IsNullOrEmpty(config.Secret))
            {
                request.Headers.Add("X-Webhook-Secret", config.Secret);
            }

            // 如果配置了签名密钥，添加 X-EquipSense-Signature 头
            if (!string.IsNullOrEmpty(config.SignatureSecret))
            {
                var signature = ComputeSignature(body, config.SignatureSecret);
                request.Headers.Add("X-EquipSense-Signature", signature);
            }

            var response = await _httpClientFactory.CreateClient("WorkOrderIntegration").SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            _logger.LogInformation("Webhook 推送完成: Host={Host}, Status={Status}",
                GetTargetHost(config.Url), response.StatusCode);

            return response.IsSuccessStatusCode ? responseBody : null;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // 普通网络故障可以降级，但宿主停机或消息处理超时取消必须传播给集成路由。
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Webhook 推送失败: Host={Host}", GetTargetHost(config.Url));
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

    /// <summary>
    /// 仅提取目标主机用于日志，避免记录 Webhook 查询串中的 token 或签名。
    /// </summary>
    private static string GetTargetHost(string? rawUrl)
        => Uri.TryCreate(rawUrl, UriKind.Absolute, out var uri) ? uri.Host : "unknown";
}
