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
    /// 租户时区（IANA 时区 ID，如 "Asia/Shanghai" / "America/New_York"）
    ///
    /// 用于 Dashboard 趋势聚合按本地日期分组（避免 UTC 跨日错位）
    /// 默认 "UTC"，新租户注册时可由前端选择
    /// v1.4 加入，详见 DashboardStatsService.GetAlertTrendAsync / GetWorkOrderTrendAsync
    /// </summary>
    public string TimeZone { get; set; } = "UTC";

    /// <summary>
    /// 是否启用
    /// </summary>
    public bool IsActive { get; set; } = true;

    // --- SaaS 字段 ---

    /// <summary>
    /// 租户状态（Trial/Active/Expired/Frozen/Closed）
    /// </summary>
    public TenantStatus Status { get; set; } = TenantStatus.Trial;

    /// <summary>
    /// 当前设备数量（由应用层维护，避免每次 COUNT 查询）
    /// </summary>
    public int CurrentDeviceCount { get; set; }

    /// <summary>
    /// 当前用户数量（由应用层维护，避免每次 COUNT 查询）
    /// </summary>
    public int CurrentUserCount { get; set; }

    /// <summary>
    /// 试用期截止时间（注册时设置为当前时间 +14 天）
    /// </summary>
    public DateTime? TrialEndsAt { get; set; }

    /// <summary>
    /// 订阅到期时间（付费套餐到期日）
    /// </summary>
    public DateTime? SubscriptionEndsAt { get; set; }

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
