using EquipAI.Application.Analysis;
using EquipAI.Application.Dashboard;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Middleware;
using EquipAI.WebAPI.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 仪表盘统计控制器 — 提供前端仪表盘所需的所有聚合数据
/// </summary>
[ApiController]
[Route("api/v1/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly DashboardStatsService _statsService;
    private readonly OeeService _oeeService;
    private readonly ITenantContext _tenantContext;

    public DashboardController(
        DashboardStatsService statsService,
        OeeService oeeService,
        ITenantContext tenantContext)
    {
        _statsService = statsService;
        _oeeService = oeeService;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 获取仪表盘统计数据
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStats>> GetStats(CancellationToken ct)
    {
        var stats = await _statsService.GetStatsAsync(_tenantContext.TenantId, ct);
        return Ok(stats);
    }

    /// <summary>
    /// 获取设备综合效率（OEE）— 可用率 × 性能 × 质量
    /// </summary>
    [HttpGet("oee")]
    public async Task<ActionResult<OeeResult>> GetOee(CancellationToken ct)
    {
        var oee = await _oeeService.CalculateAsync(_tenantContext.TenantId, ct);
        return Ok(oee);
    }
}
