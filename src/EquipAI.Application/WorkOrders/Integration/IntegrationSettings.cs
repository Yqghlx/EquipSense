namespace EquipAI.Application.WorkOrders.Integration;

/// <summary>
/// 通用 Webhook 集成配置
/// </summary>
public class WebhookConfig
{
    public string Url { get; set; } = string.Empty;
    public string? Secret { get; set; }
}

/// <summary>
/// 钉钉集成配置
/// </summary>
public class DingTalkConfig
{
    public string WebhookUrl { get; set; } = string.Empty;
    public string? Secret { get; set; }
    public List<string> AtMobiles { get; set; } = [];
}
