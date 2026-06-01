namespace EquipAI.Core.Entities;

/// <summary>
/// 故障案例库
/// </summary>
public class FaultCase : BaseEntity
{
    /// <summary>
    /// 租户 ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 关联设备 ID（可选，案例可不绑定具体设备）
    /// </summary>
    public Guid? DeviceId { get; set; }

    /// <summary>
    /// 设备类型
    /// </summary>
    public string DeviceType { get; set; } = string.Empty;

    /// <summary>
    /// 故障发生时间
    /// </summary>
    public DateTime? FaultOccurredAt { get; set; }

    /// <summary>
    /// 故障描述
    /// </summary>
    public string FaultDescription { get; set; } = string.Empty;

    /// <summary>
    /// 故障现象/症状
    /// </summary>
    public string? Symptoms { get; set; }

    /// <summary>
    /// 根本原因分析
    /// </summary>
    public string RootCause { get; set; } = string.Empty;

    /// <summary>
    /// 解决方案/处理方法
    /// </summary>
    public string Solution { get; set; } = string.Empty;

    /// <summary>
    /// 维修耗时（分钟）
    /// </summary>
    public int? RepairDurationMinutes { get; set; }

    /// <summary>
    /// 使用零部件清单
    /// </summary>
    public string? PartsUsed { get; set; }

    /// <summary>
    /// 故障关联的传感器/指标数据（JSONB 格式）
    /// </summary>
    public string? FaultData { get; set; }

    /// <summary>
    /// 操作人/维修人员
    /// </summary>
    public string? Operator { get; set; }

    /// <summary>
    /// 是否经过专家验证
    /// </summary>
    public bool IsVerified { get; set; }

    /// <summary>
    /// 验证人用户 ID
    /// </summary>
    public Guid? VerifiedBy { get; set; }

    /// <summary>
    /// 来源工单 ID
    /// </summary>
    public Guid? SourceWorkorderId { get; set; }

    /// <summary>
    /// 标签（逗号分隔）
    /// </summary>
    public string? Tags { get; set; }
}
