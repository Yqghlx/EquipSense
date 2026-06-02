namespace EquipAI.Application.WorkOrders.DTOs;

/// <summary>
/// 集成配置 DTO，用于返回租户的外部集成配置信息
/// </summary>
public class IntegrationConfigDto
{
    /// <summary>
    /// 集成类型标识（如 "webhook"、"dingtalk"）
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// 是否启用
    /// </summary>
    public bool Enabled { get; set; }

    /// <summary>
    /// 集成配置 JSON（具体的连接参数，如 URL、Token 等）
    /// </summary>
    public string Config { get; set; } = "{}";
}
