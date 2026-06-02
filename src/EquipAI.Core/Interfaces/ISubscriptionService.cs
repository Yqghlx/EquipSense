namespace EquipAI.Core.Interfaces;

/// <summary>
/// 订阅管理服务 — 管理租户计划变更、试用期和配额
/// </summary>
public interface ISubscriptionService
{
    /// <summary>
    /// 获取租户当前订阅信息（计划、用量、配额）
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>订阅信息</returns>
    Task<SubscriptionInfo> GetSubscriptionAsync(Guid tenantId, CancellationToken ct = default);

    /// <summary>
    /// 变更租户计划（升级/降级），同时调整配额
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="newPlan">新计划名称（Trial/Basic/Professional/Enterprise）</param>
    /// <param name="ct">取消令牌</param>
    Task ChangePlanAsync(Guid tenantId, string newPlan, CancellationToken ct = default);

    /// <summary>
    /// 检查租户是否可以创建新资源（设备/用户）
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="resourceType">资源类型（device/user）</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>是否可以创建</returns>
    Task<bool> CanCreateResourceAsync(Guid tenantId, string resourceType, CancellationToken ct = default);
}

/// <summary>
/// 订阅信息 — 包含租户当前计划、用量和配额详情
/// </summary>
public class SubscriptionInfo
{
    /// <summary>
    /// 租户 ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 当前计划名称（如 Trial、Basic、Professional、Enterprise）
    /// </summary>
    public string Plan { get; set; } = string.Empty;

    /// <summary>
    /// 计划显示名称（如"试用版"、"基础版"、"专业版"、"企业版"）
    /// </summary>
    public string PlanDisplayName { get; set; } = string.Empty;

    /// <summary>
    /// 最大允许设备数
    /// </summary>
    public int MaxDevices { get; set; }

    /// <summary>
    /// 当前设备数
    /// </summary>
    public int CurrentDevices { get; set; }

    /// <summary>
    /// 最大允许用户数
    /// </summary>
    public int MaxUsers { get; set; }

    /// <summary>
    /// 当前用户数
    /// </summary>
    public int CurrentUsers { get; set; }

    /// <summary>
    /// 数据保留天数
    /// </summary>
    public int DataRetentionDays { get; set; }

    /// <summary>
    /// 是否为试用版
    /// </summary>
    public bool IsTrial { get; set; }

    /// <summary>
    /// 租户是否激活
    /// </summary>
    public bool IsActive { get; set; }
}
