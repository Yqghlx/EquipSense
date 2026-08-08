using EquipAI.Application.DTOs.Common;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Controllers.Knowledge;

/// <summary>
/// 故障案例查询控制器
/// 提供故障案例分页查询（按设备类型、关键词检索）
/// 路由前缀保持 api/v1/knowledge 以兼容前端
/// </summary>
[ApiController]
[Route("api/v1/knowledge")]
[Authorize]
public class FaultCasesController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    /// <summary>
    /// 初始化故障案例查询控制器
    /// </summary>
    public FaultCasesController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>
    /// 分页获取故障案例列表
    /// 支持按设备类型和关键词筛选
    /// </summary>
    /// <param name="query">分页查询参数</param>
    /// <param name="deviceType">可选：按设备类型筛选</param>
    /// <returns>分页故障案例结果</returns>
    [HttpGet("cases")]
    [RequirePermission("knowledge:read")]
    [ProducesResponseType(typeof(PagedResult<FaultCaseResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<FaultCaseResponse>>> GetCases(
        [FromQuery] PagedQuery query,
        [FromQuery] string? deviceType = null)
    {
        var cases = _dbContext.FaultCases.AsQueryable();

        if (!string.IsNullOrWhiteSpace(deviceType))
            cases = cases.Where(c => c.DeviceType == deviceType);

        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            var keyword = $"%{query.Keyword}%";
            cases = cases.Where(c =>
                EF.Functions.ILike(c.FaultDescription, keyword) ||
                EF.Functions.ILike(c.RootCause, keyword));
        }

        var (items, total) = await cases.ToPagedAsync(query);

        return Ok(new PagedResult<FaultCaseResponse>
        {
            Items = items.Select(KnowledgeMapper.MapToFaultCaseResponse).ToList(),
            Total = total,
            Page = query.Page,
            PageSize = query.PageSize
        });
    }
}
