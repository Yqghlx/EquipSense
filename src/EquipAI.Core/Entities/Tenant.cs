using EquipAI.Core.Enums;

namespace EquipAI.Core.Entities;

/// <summary>
/// 租户实体，实现 Day 1 多租户设计的顶层隔离单元
/// </summary>
public class Tenant : BaseEntity
{
    /// <summary>
    /// 租户名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 租户标识（URL Slug），用于子域名路由
    /// </summary>
    public string Slug { get; set; } = string.Empty;

    /// <summary>
    /// 租户套餐等级
    /// </summary>
    public TenantPlan Plan { get; set; } = TenantPlan.Basic;

    /// <summary>
    /// 数据隔离模式
    /// </summary>
    public TenantIsolationMode IsolationMode { get; set; } = TenantIsolationMode.Shared;

    /// <summary>
    /// 最大允许设备数
    /// </summary>
    public int MaxDevices { get; set; } = 50;

    /// <summary>
    /// 最大允许用户数
    /// </summary>
    public int MaxUsers { get; set; } = 20;

    /// <summary>
    /// 数据保留天数（时序数据）
    /// </summary>
    public int DataRetentionDays { get; set; } = 90;

    /// <summary>
    /// 工单运行模式
    /// </summary>
    public WorkOrderMode WorkOrderMode { get; set; } = WorkOrderMode.Independent;

    /// <summary>
    /// 租户扩展设置（JSONB），存储通知、主题等个性化配置
    /// </summary>
    public string Settings { get; set; } = "{}";

    /// <summary>
    /// 是否启用
    /// </summary>
    public bool IsActive { get; set; } = true;

    // 导航属性

    /// <summary>
    /// 租户下的所有用户
    /// </summary>
    public ICollection<User> Users { get; set; } = new List<User>();

    /// <summary>
    /// 租户下的所有设备
    /// </summary>
    public ICollection<Device> Devices { get; set; } = new List<Device>();

    /// <summary>
    /// 租户自定义的设备类型模板（行业预置模板归属系统租户）
    /// </summary>
    public ICollection<DeviceTypeTemplate> DeviceTypeTemplates { get; set; } = new List<DeviceTypeTemplate>();
}
