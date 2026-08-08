using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.Application.WorkOrders;

/// <summary>
/// 技术人员画像管理服务。
/// 封装技术人员查询和创建/更新，使 Controller 不直接依赖 <c>AppDbContext</c>。
/// 多租户隔离由 AppDbContext 全局查询过滤器自动处理。
/// </summary>
public class TechnicianProfileService
{
    private readonly AppDbContext _dbContext;
    private readonly ITenantContext _tenantContext;

    public TechnicianProfileService(AppDbContext dbContext, ITenantContext tenantContext)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 获取技术人员列表。
    /// </summary>
    /// <param name="availableOnly">true 时仅返回可派工（IsAvailable）人员</param>
    /// <param name="ct">取消令牌</param>
    public async Task<List<object>> ListAsync(bool? availableOnly = null, CancellationToken ct = default)
    {
        var query = _dbContext.TechnicianProfiles.AsQueryable();

        if (availableOnly == true)
            query = query.Where(t => t.IsAvailable);

        return await query
            .OrderBy(t => t.ActiveWorkCount)
            .Select(t => (object)new
            {
                t.Id,
                t.UserId,
                t.Name,
                t.Skills,
                t.ActiveWorkCount,
                t.CompletedCount,
                t.AvgCompletionHours,
                t.IsAvailable
            })
            .ToListAsync(ct);
    }

    /// <summary>
    /// 创建或更新技术人员画像（按 UserId）。返回 (Id, Name, Skills)。
    /// </summary>
    public async Task<(Guid Id, string Name, string Skills)> UpsertAsync(Guid userId, UpsertTechnicianRequest request, CancellationToken ct = default)
    {
        // 全局过滤器自动按 TenantId 过滤，确保跨租户安全
        var profile = await _dbContext.TechnicianProfiles
            .FirstOrDefaultAsync(t => t.UserId == userId, ct);

        if (profile is null)
        {
            profile = new TechnicianProfile
            {
                TenantId = _tenantContext.TenantId,
                UserId = userId
            };
            _dbContext.TechnicianProfiles.Add(profile);
        }

        profile.Name = request.Name;
        profile.Skills = request.Skills;
        profile.IsAvailable = request.IsAvailable;

        await _dbContext.SaveChangesAsync(ct);
        return (profile.Id, profile.Name, profile.Skills);
    }
}

/// <summary>
/// 创建/更新技术人员请求。
/// </summary>
public record UpsertTechnicianRequest
{
    /// <summary>技术人员姓名</summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>擅长设备类型（JSON 数组，如 ["电机","CNC","注塑机"]）</summary>
    public string Skills { get; init; } = "[]";

    /// <summary>是否在线/可派工</summary>
    public bool IsAvailable { get; init; } = true;
}
