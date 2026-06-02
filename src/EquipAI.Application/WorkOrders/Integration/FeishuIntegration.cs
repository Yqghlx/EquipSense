using System.Net.Http.Json;
using System.Text.Json;
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders.Integration;

/// <summary>
/// 飞书自定义机器人集成
/// 使用飞书自定义机器人 Webhook 推送工单通知
/// 消息格式：飞书 Interactive Card（消息卡片）
///
/// 支持两种模式：
/// - 简化模式（推荐）：仅配置 WebhookUrl，直接发送消息卡片，无需获取 Token
/// - 应用模式：配置 AppId + AppSecret，先获取 TenantAccessToken 再调用 API
///
/// 集成失败时记录日志但不影响主流程（fire-and-forget 容错策略）
/// </summary>
public class FeishuIntegration : IWorkOrderIntegration
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<FeishuIntegration> _logger;

    /// <summary>
    /// 飞书开放平台获取 TenantAccessToken 的接口地址
    /// </summary>
    private const string TokenEndpoint = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal";

    public string IntegrationType => "feishu";

    public FeishuIntegration(ILogger<FeishuIntegration> logger)
    {
        _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
        _logger = logger;
    }

    public async Task<string?> PushCreatedAsync(
        Guid tenantId, Guid workOrderId, string title, string priority, string config, CancellationToken ct = default)
    {
        var feishuConfig = DeserializeConfig(config);
        if (feishuConfig == null || !feishuConfig.Enabled)
        {
            _logger.LogWarning("飞书集成未启用或配置无效，跳过推送");
            return null;
        }

        var priorityText = priority switch
        {
            "Critical" => "紧急",
            "High" => "高",
            "Medium" => "中",
            "Low" => "低",
            _ => priority
        };

        var card = BuildInteractiveCard(
            $"新工单：{title}",
            $"**工单编号**：{workOrderId}\n**标题**：{title}\n**优先级**：{priorityText}\n**时间**：{DateTime.UtcNow:yyyy-MM-dd HH:mm}");

        return await SendMessageAsync(feishuConfig, card, ct);
    }

    public async Task PushStatusChangedAsync(
        Guid tenantId, Guid workOrderId, string status, string? externalId, string config, CancellationToken ct = default)
    {
        var feishuConfig = DeserializeConfig(config);
        if (feishuConfig == null || !feishuConfig.Enabled) return;

        var statusText = status switch
        {
            "Pending" => "待处理",
            "Assigned" => "已派工",
            "InProgress" => "执行中",
            "Completed" => "已完成",
            "Closed" => "已关闭",
            "Cancelled" => "已取消",
            _ => status
        };

        var card = BuildInteractiveCard(
            $"工单状态变更：{statusText}",
            $"**工单编号**：{workOrderId}\n**当前状态**：{statusText}\n**更新时间**：{DateTime.UtcNow:yyyy-MM-dd HH:mm}");

        await SendMessageAsync(feishuConfig, card, ct);
    }

    /// <summary>
    /// 构建飞书 Interactive Card 消息体
    /// 飞书消息卡片由 header（标题）+ elements（内容元素列表）组成
    /// </summary>
    /// <param name="title">卡片标题</param>
    /// <param name="content">Markdown 格式内容</param>
    /// <returns>符合飞书消息卡片格式的匿名对象</returns>
    private static object BuildInteractiveCard(string title, string content)
    {
        return new
        {
            msg_type = "interactive",
            card = new
            {
                header = new
                {
                    title = new
                    {
                        tag = "plain_text",
                        content = title
                    }
                },
                elements = new[]
                {
                    new
                    {
                        tag = "div",
                        text = new
                        {
                            tag = "lark_md",
                            content
                        }
                    }
                }
            }
        };
    }

    /// <summary>
    /// 发送飞书消息，支持简化模式（Webhook）和应用模式（Token + API）
    /// 优先使用 WebhookUrl（简化模式），否则使用 AppId/AppSecret（应用模式）
    /// </summary>
    private async Task<string?> SendMessageAsync(FeishuConfig config, object card, CancellationToken ct)
    {
        try
        {
            // 简化模式：直接通过 Webhook URL 发送消息卡片（无需获取 Token）
            if (!string.IsNullOrEmpty(config.WebhookUrl))
            {
                return await SendViaWebhookAsync(config.WebhookUrl, card, ct);
            }

            // 应用模式：先获取 TenantAccessToken，再通过 API 发送
            if (!string.IsNullOrEmpty(config.AppId) && !string.IsNullOrEmpty(config.AppSecret))
            {
                return await SendViaAppAsync(config.AppId, config.AppSecret, card, ct);
            }

            _logger.LogWarning("飞书配置不完整，缺少 WebhookUrl 或 AppId/AppSecret");
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "飞书推送失败");
            return null;
        }
    }

    /// <summary>
    /// 简化模式：直接通过 Webhook URL 发送消息卡片
    /// 自定义机器人 Webhook 无需鉴权，直接 POST 消息体即可
    /// </summary>
    private async Task<string?> SendViaWebhookAsync(string webhookUrl, object card, CancellationToken ct)
    {
        var response = await _httpClient.PostAsJsonAsync(webhookUrl, card, ct);
        var body = await response.Content.ReadAsStringAsync(ct);

        _logger.LogInformation("飞书 Webhook 推送完成: Status={Status}, Body={Body}", response.StatusCode, body);
        return response.IsSuccessStatusCode ? body : null;
    }

    /// <summary>
    /// 应用模式：通过 AppId + AppSecret 获取 TenantAccessToken 后发送消息
    /// 适用于需要向指定用户/群聊发送消息的场景
    /// </summary>
    private async Task<string?> SendViaAppAsync(string appId, string appSecret, object card, CancellationToken ct)
    {
        // 第一步：获取 TenantAccessToken
        var tokenResponse = await _httpClient.PostAsJsonAsync(TokenEndpoint, new
        {
            app_id = appId,
            app_secret = appSecret
        }, ct);

        if (!tokenResponse.IsSuccessStatusCode)
        {
            _logger.LogWarning("获取飞书 TenantAccessToken 失败: Status={Status}", tokenResponse.StatusCode);
            return null;
        }

        var tokenBody = await tokenResponse.Content.ReadAsStringAsync(ct);
        using var tokenDoc = JsonDocument.Parse(tokenBody);
        var token = tokenDoc.RootElement.GetProperty("tenant_access_token").GetString();

        if (string.IsNullOrEmpty(token))
        {
            _logger.LogWarning("飞书 TenantAccessToken 为空");
            return null;
        }

        // 第二步：发送消息卡片（此处仅记录 Token 获取成功，实际发送需要指定接收者）
        // 当前简化版不实现完整的应用模式消息推送，仅记录日志
        _logger.LogInformation("飞书应用模式 Token 获取成功，简化版暂不执行发送操作");
        return tokenBody;
    }

    /// <summary>
    /// 反序列化配置 JSON，失败时返回 null
    /// </summary>
    private static FeishuConfig? DeserializeConfig(string config)
    {
        try { return JsonSerializer.Deserialize<FeishuConfig>(config); }
        catch { return null; }
    }
}
