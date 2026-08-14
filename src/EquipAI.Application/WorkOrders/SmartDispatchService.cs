using System.Text.Json;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders;

/// <summary>
/// 智能派工服务
/// 推荐算法：综合评分 = 技能匹配权重(0.6) × 技能分 + 负载权重(0.4) × 负载分
/// </summary>
public class SmartDispatchService : ISmartDispatchService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SmartDispatchService> _logger;

    /// <summary>技能匹配权重</summary>
    private const double SkillWeight = 0.6;

    /// <summary>负载均衡权重</summary>
    private const double LoadWeight = 0.4;

    /// <summary>最大负载工单数（用于归一化负载分数）</summary>
    private const int MaxLoad = 10;

    /// <summary>单次读取的技术人员候选上限，避免大租户派工请求一次性 materialize 全部画像。</summary>
    private const int CandidateBatchSize = 500;

    /// <summary>单次派工最多返回的推荐数量，防止调用方通过参数放大响应和排序成本。</summary>
    private const int MaxRecommendations = 50;

    public SmartDispatchService(IServiceScopeFactory scopeFactory, ILogger<SmartDispatchService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<List<DispatchRecommendationDto>> RecommendAsync(
        Guid tenantId, Guid workOrderId, int topN = 5, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 查询工单信息，获取关联设备 ID
        // 使用 UnfilteredSet 避免 InMemoryDatabase 下全局租户过滤器的缓存问题
        var workOrder = await db.UnfilteredSet<WorkOrder>()
            .Where(wo => wo.Id == workOrderId && wo.TenantId == tenantId)
            .Select(wo => new { wo.Id, wo.DeviceId, wo.Title })
            .FirstOrDefaultAsync(ct);

        if (workOrder is null)
            throw new KeyNotFoundException($"工单不存在: {workOrderId}");

        // 查询设备类型，用于技能匹配
        var deviceType = await db.UnfilteredSet<Device>()
            .Where(d => d.Id == workOrder.DeviceId && d.TenantId == tenantId)
            .Select(d => d.Type)
            .FirstOrDefaultAsync(ct);

        var requestedTopN = Math.Clamp(topN, 0, MaxRecommendations);
        if (requestedTopN == 0)
        {
            return [];
        }

        // 查询当前租户下可用的技术人员（绕过租户过滤器以确保后台作用域数据完整）。
        // 技能匹配保存在 JSON 字段中，无法安全地完全下推到数据库；因此按稳定主键分批读取，
        // 在应用层只维护 Top-N 候选，避免技术人员数量增长后把整个租户画像加载进内存。
        IQueryable<TechnicianProfile> candidateQuery = db.UnfilteredSet<TechnicianProfile>()
            .Where(t => t.TenantId == tenantId && t.IsAvailable)
            .OrderBy(t => t.Id);

        var recommendations = new List<DispatchRecommendationDto>(requestedTopN);
        Guid? lastCandidateId = null;
        while (true)
        {
            var batchQuery = candidateQuery;
            if (lastCandidateId.HasValue)
            {
                batchQuery = batchQuery.Where(candidate => candidate.Id > lastCandidateId.Value);
            }

            var candidates = await batchQuery
                .Take(CandidateBatchSize)
                .Select(t => new TechnicianCandidate(
                    t.Id,
                    t.UserId,
                    t.Name,
                    t.Skills,
                    t.ActiveWorkCount))
                .ToListAsync(ct);
            if (candidates.Count == 0)
            {
                break;
            }

            foreach (var technician in candidates)
            {
                var skills = ParseSkills(technician.Skills);
                // 技能匹配：擅长设备类型得 1.0 分，否则降为 0.3（通用技术人员）。
                var skillScore = !string.IsNullOrEmpty(deviceType) && skills.Contains(deviceType) ? 1.0 : 0.3;
                // 负载分数：当前工单越少越好，归一化到 0-1。
                var loadScore = Math.Max(0, 1.0 - (double)technician.ActiveWorkCount / MaxLoad);
                // 加权综合评分。
                var totalScore = SkillWeight * skillScore + LoadWeight * loadScore;

                recommendations.Add(new DispatchRecommendationDto
                {
                    TechnicianUserId = technician.UserId,
                    Name = technician.Name,
                    SkillScore = Math.Round(skillScore, 3),
                    LoadScore = Math.Round(loadScore, 3),
                    TotalScore = Math.Round(totalScore, 3),
                    ActiveWorkCount = technician.ActiveWorkCount,
                    Reason = !string.IsNullOrEmpty(deviceType) && skills.Contains(deviceType)
                        ? $"擅长{deviceType}，当前负载 {technician.ActiveWorkCount}/{MaxLoad}"
                        : $"通用技术人员，当前负载 {technician.ActiveWorkCount}/{MaxLoad}"
                });

                // 候选列表最多比 Top-N 多一条，排序成本固定，不随租户规模增长。
                if (recommendations.Count > requestedTopN)
                {
                    recommendations = recommendations
                        .OrderByDescending(recommendation => recommendation.TotalScore)
                        .ThenBy(recommendation => recommendation.TechnicianUserId)
                        .Take(requestedTopN)
                        .ToList();
                }
            }

            lastCandidateId = candidates[^1].Id;
            if (candidates.Count < CandidateBatchSize)
            {
                break;
            }
        }

        if (recommendations.Count == 0)
        {
            _logger.LogWarning("租户 {TenantId} 无可用技术人员", tenantId);
            return [];
        }

        recommendations = recommendations
            .OrderByDescending(r => r.TotalScore)
            .ThenBy(r => r.TechnicianUserId)
            .Take(requestedTopN)
            .ToList();

        _logger.LogInformation(
            "工单 {WorkOrderId} 推荐了 {Count} 名技术人员（设备类型: {DeviceType}）",
            workOrderId, recommendations.Count, deviceType);

        return recommendations;
    }

    /// <summary>数据库批量投影，避免分页过程中跟踪完整技术人员实体。</summary>
    private sealed record TechnicianCandidate(
        Guid Id,
        Guid UserId,
        string Name,
        string Skills,
        int ActiveWorkCount);

    /// <summary>
    /// 解析技术人员技能 JSON 数组
    /// </summary>
    private List<string> ParseSkills(string skillsJson)
    {
        try
        {
            return JsonSerializer.Deserialize<List<string>>(skillsJson) ?? [];
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "技能 JSON 解析失败，返回空列表");
            return [];
        }
    }
}
