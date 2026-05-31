namespace EquipAI.Application.DTOs.Devices;

/// <summary>
/// 更新设备请求 DTO（仅允许修改部分字段）
/// </summary>
public class UpdateDeviceRequest
{
    /// <summary>
    /// 设备名称
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// 制造商
    /// </summary>
    public string? Manufacturer { get; set; }

    /// <summary>
    /// 型号
    /// </summary>
    public string? Model { get; set; }

    /// <summary>
    /// 设备关键等级
    /// </summary>
    public string? Criticality { get; set; }
}
