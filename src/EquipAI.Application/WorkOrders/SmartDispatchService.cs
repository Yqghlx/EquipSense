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

        // 查询当前租户下所有可用的技术人员（绕过租户过滤器以确保数据完整）
        var technicians = await db.UnfilteredSet<TechnicianProfile>()
            .Where(t => t.TenantId == tenantId && t.IsAvailable)
            .ToListAsync(ct);

        if (technicians.Count == 0)
        {
            _logger.LogWarning("租户 {TenantId} 无可用技术人员", tenantId);
            return [];
        }

        // 计算每位技术人员的综合评分并排序
        var recommendations = technicians
            .Select(t =>
            {
                var skills = ParseSkills(t.Skills);
                // 技能匹配：擅长设备类型得 1.0 分，否则降为 0.3（通用技术人员）
                var skillScore = !string.IsNullOrEmpty(deviceType) && skills.Contains(deviceType) ? 1.0 : 0.3;
                // 负载分数：当前工单越少越好，归一化到 0-1
                var loadScore = Math.Max(0, 1.0 - (double)t.ActiveWorkCount / MaxLoad);
                // 加权综合评分
                var totalScore = SkillWeight * skillScore + LoadWeight * loadScore;

                return new DispatchRecommendationDto
                {
                    TechnicianUserId = t.UserId,
                    Name = t.Name,
                    SkillScore = Math.Round(skillScore, 3),
                    LoadScore = Math.Round(loadScore, 3),
                    TotalScore = Math.Round(totalScore, 3),
                    ActiveWorkCount = t.ActiveWorkCount,
                    Reason = !string.IsNullOrEmpty(deviceType) && skills.Contains(deviceType)
                        ? $"擅长{deviceType}，当前负载 {t.ActiveWorkCount}/{MaxLoad}"
                        : $"通用技术人员，当前负载 {t.ActiveWorkCount}/{MaxLoad}"
                };
            })
            .OrderByDescending(r => r.TotalScore)
            .Take(topN)
            .ToList();

        _logger.LogInformation(
            "工单 {WorkOrderId} 推荐了 {Count} 名技术人员（设备类型: {DeviceType}）",
            workOrderId, recommendations.Count, deviceType);

        return recommendations;
    }

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
