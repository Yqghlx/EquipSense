namespace EquipAI.Application.Knowledge.DTOs;

/// <summary>
/// 编辑知识规则请求
/// </summary>
public class UpdateKnowledgeRuleRequest
{
    /// <summary>规则名称</summary>
    public string? Name { get; set; }

    /// <summary>适用设备类型</summary>
    public string? DeviceType { get; set; }

    /// <summary>触发条件（JSONB 格式）</summary>
    public string? Conditions { get; set; }

    /// <summary>结论描述</summary>
    public string? Conclusion { get; set; }

    /// <summary>推荐处理措施</summary>
    public string? RecommendedActions { get; set; }

    /// <summary>检查步骤</summary>
    public string? CheckSteps { get; set; }

    /// <summary>置信度权重（0-1）</summary>
    public decimal? ConfidenceWeight { get; set; }

    /// <summary>变更摘要（用于版本记录）</summary>
    public string? ChangeSummary { get; set; }
}
