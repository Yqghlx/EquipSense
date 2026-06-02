namespace EquipAI.Application.DTOs.Gateway;

/// <summary>
/// 网关设备响应 DTO
/// </summary>
public class GatewayDeviceDto
{
    /// <summary>
    /// 网关设备配置唯一标识
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// 网关标识（对应 EdgeGateway 的 GatewayOptions.Id）
    /// </summary>
    public string GatewayId { get; set; } = string.Empty;

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
    public int PollIntervalMs { get; set; }

    /// <summary>
    /// 是否启用
    /// </summary>
    public bool Enabled { get; set; }

    /// <summary>
    /// 创建时间（UTC）
    /// </summary>
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// 创建网关设备配置请求
/// </summary>
public class CreateGatewayDeviceRequest
{
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
    /// 轮询间隔（毫秒），默认 3000
    /// </summary>
    public int PollIntervalMs { get; set; } = 3000;

    /// <summary>
    /// 关联的设备 ID（可选，创建后关联）
    /// </summary>
    public Guid? DeviceId { get; set; }
}

/// <summary>
/// 测试连接请求
/// </summary>
public class TestConnectionRequest
{
    /// <summary>
    /// 协议类型：opcua / modbus-tcp / modbus-rtu
    /// </summary>
    public string Protocol { get; set; } = string.Empty;

    /// <summary>
    /// 连接参数（JSONB）
    /// </summary>
    public string ConnectionConfig { get; set; } = "{}";
}

/// <summary>
/// 测试连接响应
/// </summary>
public class TestConnectionResponse
{
    /// <summary>
    /// 连接是否成功
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// 结果消息（成功或失败原因）
    /// </summary>
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// EdgeGateway 拉取配置的响应项
/// </summary>
public class GatewayDevicePullDto
{
    /// <summary>
    /// 网关设备配置 ID（字符串格式）
    /// </summary>
    public string DeviceId { get; set; } = string.Empty;

    /// <summary>
    /// 协议类型：opcua / modbus-tcp / modbus-rtu
    /// </summary>
    public string Protocol { get; set; } = string.Empty;

    /// <summary>
    /// 连接字符串（兼容 EdgeGateway 旧格式）
    /// </summary>
    public string ConnectionString { get; set; } = string.Empty;

    /// <summary>
    /// 采集点位映射 — key=指标名, value=点位地址
    /// </summary>
    public Dictionary<string, string> DataPoints { get; set; } = new();

    /// <summary>
    /// 轮询间隔（毫秒）
    /// </summary>
    public int PollIntervalMs { get; set; }

    /// <summary>
    /// 设备类型（可选）
    /// </summary>
    public string? DeviceType { get; set; }
}
