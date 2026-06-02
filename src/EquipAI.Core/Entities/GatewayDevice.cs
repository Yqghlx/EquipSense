namespace EquipAI.Core.Entities;

/// <summary>
/// 网关设备配置 — 描述边缘网关上的一台设备连接参数
/// 存储在后端数据库，EdgeGateway 启动时通过 API 拉取
/// </summary>
public class GatewayDevice : BaseEntity
{
    /// <summary>
    /// 网关标识（对应 EdgeGateway 的 GatewayOptions.Id）
    /// </summary>
    public string GatewayId { get; set; } = string.Empty;

    /// <summary>
    /// 租户 ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 关联的设备 ID（可选，创建后关联）
    /// </summary>
    public Guid? DeviceId { get; set; }

    /// <summary>
    /// 设备显示名称
    /// </summary>
    public string DeviceName { get; set; } = string.Empty;

    /// <summary>
    /// 协议类型：opcua / modbus-tcp / modbus-rtu
    /// </summary>
    public string Protocol { get; set; } = string.Empty;

    /// <summary>
    /// 连接参数（JSONB）— OPC UA 地址、Modbus IP:Port 或串口配置
    /// </summary>
    public string ConnectionConfig { get; set; } = "{}";

    /// <summary>
    /// 采集点位映射（JSONB）— key=指标名, value=点位地址
    /// </summary>
    public string DataPoints { get; set; } = "{}";

    /// <summary>
    /// 轮询间隔（毫秒）
    /// </summary>
    public int PollIntervalMs { get; set; } = 3000;

    /// <summary>
    /// 是否启用
    /// </summary>
    public bool Enabled { get; set; } = true;
}
