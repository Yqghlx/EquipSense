using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 智能派工 API — 提供技术人员推荐、技术人员画像管理能力
/// </summary>
[ApiController]
[Route("api/v1/dispatch")]
[Authorize]
public class DispatchController : ControllerBase
{
    private readonly ISmartDispatchService _dispatchService;
    private readonly ITenantContext _tenantContext;
    private readonly AppDbContext _dbContext;

    public DispatchController(
        ISmartDispatchService dispatchService,
        ITenantContext tenantContext,
        AppDbContext dbContext)
    {
        _dispatchService = dispatchService;
        _tenantContext = tenantContext;
        _dbContext = dbContext;
    }

    /// <summary>
    /// 为工单推荐技术人员 — 基于技能匹配 + 负载均衡综合评分
    /// </summary>
    /// <param name="workOrderId">工单 ID</param>
    /// <param name="topN">返回前 N 名推荐（默认 5）</param>
    [HttpGet("{workOrderId:guid}/recommendations")]
    [ProducesResponseType(typeof(List<DispatchRecommendationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<DispatchRecommendationDto>>> GetRecommendations(
        Guid workOrderId, [FromQuery] int topN = 5)
    {
        var recommendations = await _dispatchService.RecommendAsync(
            _tenantContext.TenantId, workOrderId, topN, HttpContext.RequestAborted);
        return Ok(recommendations);
    }

    /// <summary>
    /// 获取技术人员列表 — 全局过滤器自动按租户隔离
    /// </summary>
    /// <param name="availableOnly">是否只返回可派工人员</param>
    [HttpGet("technicians")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> GetTechnicians([FromQuery] bool? availableOnly)
    {
        // 全局查询过滤器已自动按 TenantId 过滤，无需手动添加租户条件
        var query = _dbContext.TechnicianProfiles.AsQueryable();

        if (availableOnly == true)
            query = query.Where(t => t.IsAvailable);

        var technicians = await query
            .OrderBy(t => t.ActiveWorkCount)
            .Select(t => new
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
            .ToListAsync();

        return Ok(technicians);
    }

    /// <summary>
    /// 创建或更新技术人员画像 — 全局过滤器确保只能操作当前租户的数据
    /// </summary>
    /// <param name="userId">用户 ID</param>
    /// <param name="request">技术人员画像数据</param>
    [HttpPut("technicians/{userId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> UpsertTechnician(
        Guid userId, [FromBody] UpsertTechnicianRequest request)
    {
        // 全局过滤器自动按 TenantId 过滤，确保跨租户安全
        var profile = await _dbContext.TechnicianProfiles
            .FirstOrDefaultAsync(t => t.UserId == userId);

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

        await _dbContext.SaveChangesAsync();
        return Ok(new { profile.Id, profile.Name, profile.Skills });
    }
}

/// <summary>
/// 创建/更新技术人员请求
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
