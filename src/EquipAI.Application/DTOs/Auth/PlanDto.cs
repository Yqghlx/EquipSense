namespace EquipAI.Application.DTOs.Auth;

/// <summary>
/// 套餐信息 DTO，用于注册页面展示可选套餐
/// </summary>
public class PlanDto
{
    /// <summary>套餐标识（对应 TenantPlan 枚举名称）</summary>
    public string PlanId { get; set; } = string.Empty;

    /// <summary>显示名称</summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>描述</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>最大设备数（0 = 不限）</summary>
    public int MaxDevices { get; set; }

    /// <summary>最大用户数（0 = 不限）</summary>
    public int MaxUsers { get; set; }

    /// <summary>数据保留天数</summary>
    public int DataRetentionDays { get; set; }

    /// <summary>月度价格（元），0 = 免费</summary>
    public decimal MonthlyPrice { get; set; }

    /// <summary>是否免费</summary>
    public bool IsFree { get; set; }
}
