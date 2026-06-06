namespace EquipAI.Application.Knowledge.DTOs;

/// <summary>
/// 批量审核请求
/// </summary>
public class BatchReviewRequest
{
    /// <summary>候选规则 ID 列表</summary>
    public List<Guid> Ids { get; set; } = [];

    /// <summary>审核意见</summary>
    public string? Comment { get; set; }
}

/// <summary>
/// 批量审核结果
/// </summary>
public class BatchReviewResult
{
    /// <summary>成功处理数量</summary>
    public int SuccessCount { get; set; }

    /// <summary>失败数量</summary>
    public int FailCount { get; set; }

    /// <summary>失败详情列表</summary>
    public List<BatchReviewError> Errors { get; set; } = [];
}

/// <summary>
/// 批量审核失败项
/// </summary>
public class BatchReviewError
{
    /// <summary>候选规则 ID</summary>
    public Guid Id { get; set; }

    /// <summary>失败原因</summary>
    public string Reason { get; set; } = string.Empty;
}

/// <summary>
/// 冲突检测请求
/// </summary>
public class ConflictCheckRequest
{
    /// <summary>设备类型</summary>
    public string DeviceType { get; set; } = string.Empty;

    /// <summary>条件 JSON</summary>
    public string Conditions { get; set; } = "[]";

    /// <summary>排除的规则 ID（编辑场景排除自身）</summary>
    public Guid? ExcludeRuleId { get; set; }
}
