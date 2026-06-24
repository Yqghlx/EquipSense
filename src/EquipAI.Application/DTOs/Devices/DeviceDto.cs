namespace EquipAI.Application.DTOs.Devices;

/// <summary>
/// 设备信息 DTO，用于 API 响应中的设备数据
/// </summary>
public class DeviceDto
{
    /// <summary>
    /// 设备唯一标识
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// 设备编码（租户内唯一）
    /// </summary>
    public string DeviceCode { get; set; } = string.Empty;

    /// <summary>
    /// 设备名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 设备类型（如 "电机"、"泵"、"压缩机"）
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// 制造商
    /// </summary>
    public string? Manufacturer { get; set; }

    /// <summary>
    /// 型号
    /// </summary>
    public string? Model { get; set; }

    /// <summary>
    /// 设备在线状态名称（如 Online、Offline、Maintenance、Warning）
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// 设备关键等级名称（如 Critical、High、Normal、Low）
    /// </summary>
    public string Criticality { get; set; } = string.Empty;

    /// <summary>
    /// 健康评分（0-100）
    /// </summary>
    public decimal HealthScore { get; set; }

    /// <summary>
    /// 创建时间（UTC）
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 最后更新时间（UTC）
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// 序列号
    /// </summary>
    public string? SerialNumber { get; set; }

    /// <summary>
    /// 安装日期
    /// </summary>
    public DateOnly? InstallDate { get; set; }

    /// <summary>
    /// 绑定的网关编码
    /// </summary>
    public string? GatewayId { get; set; }

    /// <summary>
    /// 每小时停机成本（元）
    /// </summary>
    public decimal? DowntimeCostPerHour { get; set; }

    /// <summary>
    /// 最后一次上报数据时间（UTC，运维判断设备是否失联）
    /// </summary>
    public DateTime? LastSeenAt { get; set; }
}
