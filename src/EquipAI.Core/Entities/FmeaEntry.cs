namespace EquipAI.Core.Entities;

/// <summary>
/// FMEA 故障模式库（Phase 5 新增）
/// 存储结构化的故障模式与影响分析数据，符合 ISO 14224 标准
/// </summary>
public class FmeaEntry : BaseEntity
{
    /// <summary>
    /// 租户 ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 适用设备类型（如"离心泵"、"空压机"、"电机"）
    /// </summary>
    public string DeviceType { get; set; } = string.Empty;

    /// <summary>
    /// 故障模式名称（如"轴承磨损"、"电机过载"、"密封泄漏"）
    /// </summary>
    public string FailureMode { get; set; } = string.Empty;

    /// <summary>
    /// 故障原因（如"润滑不足"、"负载过大"、"材料疲劳"）
    /// </summary>
    public string Cause { get; set; } = string.Empty;

    /// <summary>
    /// 故障影响（如"设备停机"、"生产效率下降 30%"、"安全隐患"）
    /// </summary>
    public string Effect { get; set; } = string.Empty;

    /// <summary>
    /// 检测方式（如"电流 > 180A 持续 5 分钟"、"振动 > 7mm/s"）
    /// </summary>
    public string Detection { get; set; } = string.Empty;

    /// <summary>
    /// 建议措施（如"检查轴承温度"、"减小负载"、"更换密封件"）
    /// </summary>
    public string RecommendedAction { get; set; } = string.Empty;

    /// <summary>
    /// 严重度（1-10，10 最严重）
    /// </summary>
    public int Severity { get; set; }

    /// <summary>
    /// 发生频率（1-10，10 最频繁）
    /// </summary>
    public int Occurrence { get; set; }

    /// <summary>
    /// 可检测性（1-10，10 最难检测）
    /// </summary>
    public int Detectability { get; set; }

    /// <summary>
    /// 风险优先级数 RPN = Severity × Occurrence × Detectability
    /// </summary>
    public int Rpn { get; set; }

    /// <summary>
    /// 关联的知识规则 ID（可选，关联到现有 knowledge_rules）
    /// </summary>
    public Guid? KnowledgeRuleId { get; set; }

    /// <summary>
    /// 创建者
    /// </summary>
    public Guid CreatedBy { get; set; }

    /// <summary>
    /// 是否启用
    /// </summary>
    public bool IsEnabled { get; set; } = true;

    /// <summary>
    /// 更新时间
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
