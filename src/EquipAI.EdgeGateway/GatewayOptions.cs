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
    /// 是否强制后端 API 使用 HTTPS。开启后若 <see cref="BackendUrl"/> 非 https，网关启动即失败。
    /// 生产环境必须开启（AuthKey 经 X-Gateway-Auth-Key 头传输，HTTP 明文会泄露密钥）。
    /// 默认 false 仅为兼容现有开发配置；Docker 生产环境通过 Gateway__RequireHttps=true 启用。
    /// </summary>
    public bool RequireHttps { get; set; }

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
    /// 是否通过 TLS 连接 MQTT Broker。
    /// </summary>
    public bool MqttUseTls { get; set; }

    /// <summary>
    /// 是否允许不受信任的服务端证书，仅用于开发环境。
    /// </summary>
    public bool MqttAllowUntrustedCertificates { get; set; }

    /// <summary>
    /// 可选的 MQTT Broker CA 证书路径，未配置时使用系统信任链。
    /// </summary>
    public string? MqttCaCertificatePath { get; set; }

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

    /// <summary>
    /// OPC UA 安全模式：None（无加密）、Sign（仅签名）、SignAndEncrypt（签名+加密）。
    /// 默认 None 用于开发环境，生产环境建议 SignAndEncrypt。
    /// </summary>
    public string OpcUaSecurityMode { get; set; } = "None";

    /// <summary>
    /// OPC UA 客户端证书路径（PFX 格式），用于 Sign/SignAndEncrypt 模式下的客户端认证。
    /// 为空时使用 SDK 自动生成的自签名证书。
    /// </summary>
    public string? OpcUaClientCertificatePath { get; set; }

    /// <summary>
    /// OPC UA 客户端证书密码（可选，PFX 文件加密密码）。
    /// </summary>
    public string? OpcUaClientCertificatePassword { get; set; }

    /// <summary>
    /// 受信任的服务器证书目录路径。目录中存放的 .der 证书会被自动加载到信任列表。
    /// 为空时使用默认路径 certificates/trusted。
    /// </summary>
    public string? OpcUaTrustedCertificatesPath { get; set; }

    /// <summary>
    /// 网关对外可访问的地址（后端用于代理健康请求），Docker 部署时为容器名或 IP
    /// </summary>
    public string Host { get; set; } = "localhost";

    /// <summary>
    /// 健康端点端口（默认 8081）
    /// </summary>
    public int HealthPort { get; set; } = 8081;

    /// <summary>
    /// 网关软件版本
    /// </summary>
    public string Version { get; set; } = "1.0.0";

    /// <summary>
    /// 心跳间隔（秒），默认 30 秒
    /// </summary>
    public int HeartbeatIntervalSeconds { get; set; } = 30;
}
