using EquipAI.Core.Enums;

namespace EquipAI.Core.Entities;

/// <summary>
/// 账单记录实体 — 记录租户每次订阅变更或续费产生的账单
/// </summary>
public class BillingRecord : BaseEntity
{
    /// <summary>
    /// 所属租户 ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 套餐等级（快照，记录变更时的套餐）
    /// </summary>
    public TenantPlan Plan { get; set; }

    /// <summary>
    /// 账单金额（元）
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>
    /// 计费周期起始时间
    /// </summary>
    public DateTime PeriodStart { get; set; }

    /// <summary>
    /// 计费周期结束时间
    /// </summary>
    public DateTime PeriodEnd { get; set; }

    /// <summary>
    /// 账单状态：Pending（待支付）、Paid（已支付）、Cancelled（已取消）
    /// </summary>
    public BillingStatus Status { get; set; } = BillingStatus.Pending;

    /// <summary>
    /// 支付方式：Manual（手动标记）、Online（在线支付）、System（系统自动）
    /// </summary>
    public string PaymentMethod { get; set; } = "System";

    /// <summary>
    /// 备注（如"试用转正式"、"套餐升级"等）
    /// </summary>
    public string? Remark { get; set; }
}
