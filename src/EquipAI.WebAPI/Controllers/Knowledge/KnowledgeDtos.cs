using EquipAI.Core.Enums;

namespace EquipAI.WebAPI.Controllers.Knowledge;

/// <summary>
/// 知识库模块共享请求/响应 DTO
/// 原 KnowledgeController（858 行）拆分为 3 个 Controller 后，DTO 集中于此供复用。
/// 注意：UpdateKnowledgeRuleRequest / ConflictCheckRequest / BatchReviewRequest 已在
/// EquipAI.Application.Knowledge.DTOs 命名空间下定义，此处不重复。
/// </summary>
#region 请求 DTO

/// <summary>
/// 创建知识规则请求
/// </summary>
public class CreateKnowledgeRuleRequest
{
    /// <summary>适用设备类型</summary>
    public string DeviceType { get; set; } = string.Empty;

    /// <summary>规则名称</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>触发条件（JSONB 格式）</summary>
    public string Conditions { get; set; } = "[]";

    /// <summary>结论描述</summary>
    public string Conclusion { get; set; } = string.Empty;

    /// <summary>推荐处理措施（可选）</summary>
    public string? RecommendedActions { get; set; }

    /// <summary>检查步骤（可选）</summary>
    public string? CheckSteps { get; set; }

    /// <summary>置信度权重（可选，默认 0.5）</summary>
    public decimal? ConfidenceWeight { get; set; }
}

/// <summary>
/// 审核请求（批准/驳回时使用）
/// </summary>
public class ReviewRequest
{
    /// <summary>审核意见</summary>
    public string? Comment { get; set; }
}

/// <summary>
/// 创建候选规则请求
/// </summary>
public class CreatePendingRuleRequest
{
    /// <summary>规则名称</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>触发条件</summary>
    public object? Conditions { get; set; }

    /// <summary>推荐处理措施</summary>
    public string? Recommendation { get; set; }

    /// <summary>置信度（0-1）</summary>
    public decimal? Confidence { get; set; }

    /// <summary>来源</summary>
    public string? Source { get; set; }
}

/// <summary>
/// 编辑后批准请求
/// </summary>
public class ApproveWithEditRequest
{
    /// <summary>调整后的触发条件</summary>
    public string? AdjustedConditions { get; set; }

    /// <summary>调整后的结论描述</summary>
    public string? AdjustedConclusion { get; set; }

    /// <summary>调整后的规则名称</summary>
    public string? AdjustedName { get; set; }

    /// <summary>审核意见</summary>
    public string? Comment { get; set; }
}

#endregion

#region 响应 DTO

/// <summary>
/// 正式知识规则响应
/// </summary>
public class KnowledgeRuleResponse
{
    public Guid Id { get; set; }
    public string DeviceType { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Conditions { get; set; } = string.Empty;
    public string Conclusion { get; set; } = string.Empty;
    public string? RecommendedActions { get; set; }
    public string? CheckSteps { get; set; }
    public decimal ConfidenceWeight { get; set; }
    public string Source { get; set; } = string.Empty;
    public decimal? AccuracyRate { get; set; }
    public int SuccessCount { get; set; }
    public bool Enabled { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }

    /// <summary>当前版本号</summary>
    public int Version { get; set; }
}

/// <summary>
/// 候选规则响应
/// </summary>
public class PendingRuleResponse
{
    public Guid Id { get; set; }
    public string DeviceType { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Conditions { get; set; } = string.Empty;
    public string Conclusion { get; set; } = string.Empty;
    public string? RecommendedActions { get; set; }
    public string? CheckSteps { get; set; }
    public Guid? SourceWorkorderId { get; set; }
    public Guid? SourceCaseId { get; set; }
    public Guid? SourceAlertId { get; set; }
    public Guid? SourceAnalysisId { get; set; }
    public decimal? Confidence { get; set; }
    public string ReviewStatus { get; set; } = string.Empty;
    public Guid? ReviewedBy { get; set; }
    public string? ReviewComment { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// 故障案例响应
/// </summary>
public class FaultCaseResponse
{
    public Guid Id { get; set; }
    public Guid? DeviceId { get; set; }
    public string DeviceType { get; set; } = string.Empty;
    public DateTime? FaultOccurredAt { get; set; }
    public string FaultDescription { get; set; } = string.Empty;
    public string? Symptoms { get; set; }
    public string RootCause { get; set; } = string.Empty;
    public string Solution { get; set; } = string.Empty;
    public int? RepairDurationMinutes { get; set; }
    public string? PartsUsed { get; set; }
    public string? FaultData { get; set; }
    public string? Operator { get; set; }
    public bool IsVerified { get; set; }
    public Guid? SourceWorkorderId { get; set; }
    public string? Tags { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// 批量导入响应
/// </summary>
public class BatchImportResponse
{
    /// <summary>成功导入数量</summary>
    public int Imported { get; set; }

    /// <summary>失败数量</summary>
    public int Failed { get; set; }

    /// <summary>失败详情</summary>
    public List<string> Errors { get; set; } = [];
}

#endregion

/// <summary>
/// 知识库实体 → 响应 DTO 映射方法（3 个 Controller 共用）
/// </summary>
internal static class KnowledgeMapper
{
    internal static KnowledgeRuleResponse MapToRuleResponse(Core.Entities.KnowledgeRule rule) => new()
    {
        Id = rule.Id,
        DeviceType = rule.DeviceType,
        Name = rule.Name,
        Conditions = rule.Conditions,
        Conclusion = rule.Conclusion,
        RecommendedActions = rule.RecommendedActions,
        CheckSteps = rule.CheckSteps,
        ConfidenceWeight = rule.ConfidenceWeight,
        Source = rule.Source,
        AccuracyRate = rule.AccuracyRate,
        SuccessCount = rule.SuccessCount,
        Enabled = rule.Enabled,
        CreatedBy = rule.CreatedBy,
        CreatedAt = rule.CreatedAt,
        Version = rule.Version
    };

    internal static PendingRuleResponse MapToPendingRuleResponse(Core.Entities.PendingRule rule) => new()
    {
        Id = rule.Id,
        DeviceType = rule.DeviceType,
        Name = rule.Name,
        Conditions = rule.Conditions,
        Conclusion = rule.Conclusion,
        RecommendedActions = rule.RecommendedActions,
        CheckSteps = rule.CheckSteps,
        SourceWorkorderId = rule.SourceWorkorderId,
        SourceCaseId = rule.SourceCaseId,
        SourceAlertId = rule.SourceAlertId,
        SourceAnalysisId = rule.SourceAnalysisId,
        Confidence = rule.Confidence,
        ReviewStatus = rule.ReviewStatus.ToString(),
        ReviewedBy = rule.ReviewedBy,
        ReviewComment = rule.ReviewComment,
        ReviewedAt = rule.ReviewedAt,
        CreatedAt = rule.CreatedAt
    };

    internal static FaultCaseResponse MapToFaultCaseResponse(Core.Entities.FaultCase c) => new()
    {
        Id = c.Id,
        DeviceId = c.DeviceId,
        DeviceType = c.DeviceType,
        FaultOccurredAt = c.FaultOccurredAt,
        FaultDescription = c.FaultDescription,
        Symptoms = c.Symptoms,
        RootCause = c.RootCause,
        Solution = c.Solution,
        RepairDurationMinutes = c.RepairDurationMinutes,
        PartsUsed = c.PartsUsed,
        FaultData = c.FaultData,
        Operator = c.Operator,
        IsVerified = c.IsVerified,
        SourceWorkorderId = c.SourceWorkorderId,
        Tags = c.Tags,
        CreatedAt = c.CreatedAt
    };
}
