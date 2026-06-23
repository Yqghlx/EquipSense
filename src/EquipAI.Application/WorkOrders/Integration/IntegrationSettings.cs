namespace EquipAI.Application.WorkOrders.Integration;

/// <summary>
/// 通用 Webhook 集成配置
/// </summary>
public class WebhookConfig
{
    public string Url { get; set; } = string.Empty;
    public string? Secret { get; set; }

    /// <summary>
    /// Body 模板（支持变量插值）
    /// 支持的变量格式：{{workOrder.code}}、{{workOrder.title}} 等
    /// </summary>
    public string? BodyTemplate { get; set; }

    /// <summary>
    /// 签名密钥（用于生成 X-EquipSense-Signature 头）
    /// 使用 HMAC-SHA256 算法对请求 Body 进行签名
    /// </summary>
    public string? SignatureSecret { get; set; }
}

/// <summary>
/// 钉钉集成配置
/// </summary>
public class DingTalkConfig
{
    public string WebhookUrl { get; set; } = string.Empty;
    public string? Secret { get; set; }
    public List<string> AtMobiles { get; set; } = [];

    /// <summary>前端基 URL（用于生成查看详情链接，如 https://equip.example.com）</summary>
    public string? BaseUrl { get; set; }
}

/// <summary>
/// 飞书集成配置
/// 支持两种模式：
/// 1. 简化模式：仅配置 WebhookUrl，直接通过自定义机器人 Webhook 发送消息卡片
/// 2. 应用模式：配置 AppId + AppSecret + ChatId，先获取 TenantAccessToken 再调用 API 发送到指定群聊
/// </summary>
public class FeishuConfig
{
    /// <summary>
    /// 是否启用飞书集成
    /// </summary>
    public bool Enabled { get; set; }

    /// <summary>
    /// 飞书应用 AppId（应用模式使用）
    /// </summary>
    public string? AppId { get; set; }

    /// <summary>
    /// 飞书应用 AppSecret（应用模式使用）
    /// </summary>
    public string? AppSecret { get; set; }

    /// <summary>
    /// 接收消息的群聊 ID（应用模式必需）
    /// 获取方式：飞书群设置 → 群机器人 → 查看群信息（chat_id 形如 oc_xxx）
    /// </summary>
    public string? ChatId { get; set; }

    /// <summary>
    /// 自定义机器人 Webhook URL（简化模式使用，优先级高于应用模式）
    /// </summary>
    public string? WebhookUrl { get; set; }
}

/// <summary>
/// EAM/CMMS 集成配置
/// 支持对接 Maximo、SAP PM 等企业资产管理系统
/// </summary>
public class EamConfig
{
    /// <summary>
    /// 是否启用 EAM 集成
    /// </summary>
    public bool Enabled { get; set; }

    /// <summary>
    /// EAM 系统类型（"maximo" | "sap" | "other"）
    /// </summary>
    public string? Type { get; set; }

    /// <summary>
    /// EAM REST API 端点地址
    /// </summary>
    public string? Endpoint { get; set; }

    /// <summary>
    /// API Key 认证密钥（Header 方式）
    /// </summary>
    public string? ApiKey { get; set; }

    /// <summary>
    /// 用户名认证（Basic Auth 方式）
    /// </summary>
    public string? Username { get; set; }

    /// <summary>
    /// 密码认证（Basic Auth 方式）
    /// </summary>
    public string? Password { get; set; }
}
