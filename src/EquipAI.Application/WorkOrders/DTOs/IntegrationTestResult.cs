namespace EquipAI.Application.WorkOrders.DTOs;

/// <summary>
/// 集成测试连接结果
/// </summary>
public class IntegrationTestResult
{
    /// <summary>
    /// 集成类型
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// 测试是否成功
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// 结果消息（成功时为"连接成功"，失败时为错误描述）
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// 响应耗时（毫秒）
    /// </summary>
    public long DurationMs { get; set; }

    /// <summary>
    /// 外部系统返回的详细信息（可选）
    /// </summary>
    public string? Details { get; set; }
}
