namespace EquipAI.EdgeGateway;

/// <summary>
/// 网关全局配置选项，映射自 appsettings.json 的 "Gateway" 节。
/// </summary>
public class GatewayOptions
{
    /// <summary>
    /// 配置节名称。
    /// </summary>
    public const string SectionName = "Gateway";

    /// <summary>
    /// 网关唯一标识。
    /// </summary>
    public string Id { get; set; } = "gateway-001";

    /// <summary>
    /// 所属租户 ID（与后端 JWT 中的 tenant_id 对应）。
    /// </summary>
    public string TenantId { get; set; } = string.Empty;

    /// <summary>
    /// 后端 API 地址。
    /// </summary>
    public string BackendUrl { get; set; } = "http://localhost:8080";

    /// <summary>
    /// MQTT Broker 地址（格式：host:port）。
    /// </summary>
    public string MqttBroker { get; set; } = "localhost:1883";

    /// <summary>
    /// MQTT 用户名（可选）。
    /// </summary>
    public string? MqttUsername { get; set; }

    /// <summary>
    /// MQTT 密码（可选）。
    /// </summary>
    public string? MqttPassword { get; set; }

    /// <summary>
    /// 数据上传间隔（秒），默认 5 秒。
    /// </summary>
    public int UploadIntervalSeconds { get; set; } = 5;

    /// <summary>
    /// 内存环形队列容量，默认 10000 条。
    /// </summary>
    public int BufferSize { get; set; } = 10000;

    /// <summary>
    /// 网关认证密钥（与后端 GATEWAY_AUTH_KEY 对应）。
    /// </summary>
    public string AuthKey { get; set; } = string.Empty;
}
