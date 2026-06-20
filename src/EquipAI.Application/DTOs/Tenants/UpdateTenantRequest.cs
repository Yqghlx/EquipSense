namespace EquipAI.Application.DTOs.Tenants;

/// <summary>
/// 更新租户请求 DTO（仅允许修改部分字段）
/// </summary>
public class UpdateTenantRequest
{
    /// <summary>
    /// 租户名称
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// 最大允许设备数
    /// </summary>
    public int? MaxDevices { get; set; }

    /// <summary>
    /// 最大允许用户数
    /// </summary>
    public int? MaxUsers { get; set; }

    /// <summary>
    /// 套餐等级
    /// </summary>
    public string? Plan { get; set; }

    /// <summary>
    /// 租户时区（IANA 时区 ID，如 "Asia/Shanghai"）
    /// v1.4 加入：影响 Dashboard 趋势聚合的本地日期分组
    /// </summary>
    public string? TimeZone { get; set; }
}
