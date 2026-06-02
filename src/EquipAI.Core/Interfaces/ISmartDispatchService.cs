namespace EquipAI.Core.Interfaces;

/// <summary>
/// 智能派工服务 — 基于技能匹配 + 负载均衡推荐最佳技术人员
/// </summary>
public interface ISmartDispatchService
{
    /// <summary>
    /// 为指定工单推荐技术人员列表（按综合评分降序）
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="workOrderId">工单 ID</param>
    /// <param name="topN">返回前 N 名推荐（默认 5）</param>
    /// <param name="ct">取消令牌</param>
    Task<List<DispatchRecommendationDto>> RecommendAsync(
        Guid tenantId, Guid workOrderId, int topN = 5, CancellationToken ct = default);
}

/// <summary>
/// 派工推荐结果
/// </summary>
public record DispatchRecommendationDto
{
    /// <summary>推荐技术人员用户 ID</summary>
    public Guid TechnicianUserId { get; init; }

    /// <summary>技术人员姓名</summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>技能匹配分数（0-1）</summary>
    public double SkillScore { get; init; }

    /// <summary>负载分数（0-1，越高表示越空闲）</summary>
    public double LoadScore { get; init; }

    /// <summary>综合评分（0-1）</summary>
    public double TotalScore { get; init; }

    /// <summary>当前进行中工单数</summary>
    public int ActiveWorkCount { get; init; }

    /// <summary>推荐理由</summary>
    public string Reason { get; init; } = string.Empty;
}
