using System.ComponentModel.DataAnnotations;

namespace EquipAI.Application.DTOs.Devices;

/// <summary>
/// 创建设备请求 DTO
/// </summary>
public class CreateDeviceRequest
{
    /// <summary>
    /// 设备编码（租户内唯一）
    /// </summary>
    [Required(ErrorMessage = "设备编码不能为空")]
    [StringLength(50, ErrorMessage = "设备编码长度不能超过 50 个字符")]
    public string DeviceCode { get; set; } = string.Empty;

    /// <summary>
    /// 设备名称
    /// </summary>
    [Required(ErrorMessage = "设备名称不能为空")]
    [StringLength(200, ErrorMessage = "设备名称长度不能超过 200 个字符")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 设备类型（如 "电机"、"泵"、"压缩机"）
    /// </summary>
    [Required(ErrorMessage = "设备类型不能为空")]
    [StringLength(100, ErrorMessage = "设备类型长度不能超过 100 个字符")]
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
    /// 设备关键等级（默认 normal）
    /// </summary>
    public string Criticality { get; set; } = "normal";

    /// <summary>
    /// 序列号（资产追踪、质保凭证）
    /// </summary>
    [StringLength(100, ErrorMessage = "序列号长度不能超过 100 个字符")]
    public string? SerialNumber { get; set; }

    /// <summary>
    /// 安装日期（质保起算、生命周期管理）
    /// </summary>
    public DateOnly? InstallDate { get; set; }

    /// <summary>
    /// 绑定的网关编码（采集架构归属，对应 Gateway.GatewayCode）
    /// </summary>
    [StringLength(100, ErrorMessage = "网关编码长度不能超过 100 个字符")]
    public string? GatewayId { get; set; }

    /// <summary>
    /// 每小时停机成本（元，用于 ROI 核算与维修优先级排序）
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "停机成本不能为负数")]
    public decimal? DowntimeCostPerHour { get; set; }
}
