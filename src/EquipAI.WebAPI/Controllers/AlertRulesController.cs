using AutoMapper;
using EquipAI.Application.Alerts.DTOs;
using EquipAI.Application.DTOs.Common;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Middleware;
using EquipAI.WebAPI.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 告警规则管理控制器
/// </summary>
[ApiController]
[Route("api/v1/alert-rules")]
[Authorize]
public class AlertRulesController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IMapper _mapper;
    private readonly ITenantContext _tenantContext;

    public AlertRulesController(AppDbContext dbContext, IMapper mapper, ITenantContext tenantContext)
    {
        _dbContext = dbContext;
        _mapper = mapper;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    [RequirePermission("alert:read")]
    [ProducesResponseType(typeof(PagedResult<AlertRuleDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<AlertRuleDto>>> GetAlertRules([FromQuery] PagedQuery query)
    {
        var rules = _dbContext.AlertRules.AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            var keyword = $"%{query.Keyword}%";
            rules = rules.Where(r => EF.Functions.ILike(r.Name, keyword));
        }

        var (items, total) = await rules.ToPagedAsync(query);

        return Ok(new PagedResult<AlertRuleDto>
        {
            Items = _mapper.Map<List<AlertRuleDto>>(items)!,
            Total = total,
            Page = query.Page,
            PageSize = query.PageSize
        });
    }

    [HttpGet("{id:guid}")]
    [RequirePermission("alert:read")]
    [ProducesResponseType(typeof(AlertRuleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AlertRuleDto>> GetAlertRule(Guid id)
    {
        var rule = await _dbContext.AlertRules.FindAsync(id);
        if (rule == null)
            return NotFound(new { code = 404, message = "告警规则不存在" });

        return Ok(_mapper.Map<AlertRuleDto>(rule));
    }

    [HttpPost]
    [RequirePermission("alert:config")]
    [ProducesResponseType(typeof(AlertRuleDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<AlertRuleDto>> CreateAlertRule([FromBody] CreateAlertRuleRequest request)
    {
        var rule = _mapper.Map<AlertRule>(request)!;
        rule.TenantId = _tenantContext.TenantId;

        _dbContext.AlertRules.Add(rule);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAlertRule), new { id = rule.Id }, _mapper.Map<AlertRuleDto>(rule));
    }

    [HttpPut("{id:guid}")]
    [RequirePermission("alert:config")]
    [ProducesResponseType(typeof(AlertRuleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AlertRuleDto>> UpdateAlertRule(Guid id, [FromBody] UpdateAlertRuleRequest request)
    {
        var rule = await _dbContext.AlertRules.FindAsync(id)
            ?? throw new KeyNotFoundException($"告警规则 {id} 不存在");

        _mapper.Map(request, rule);
        await _dbContext.SaveChangesAsync();

        return Ok(_mapper.Map<AlertRuleDto>(rule));
    }

    [HttpDelete("{id:guid}")]
    [RequirePermission("alert:delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAlertRule(Guid id)
    {
        var rule = await _dbContext.AlertRules.FindAsync(id)
            ?? throw new KeyNotFoundException($"告警规则 {id} 不存在");

        _dbContext.AlertRules.Remove(rule);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// 启用/停用告警规则（运维场景：临时停用规则避免误报，改完再启用，无需删除重建）
    /// </summary>
    /// <param name="id">规则 ID</param>
    /// <returns>更新后的规则（含新启用状态）</returns>
    [HttpPut("{id:guid}/toggle")]
    [RequirePermission("alert:update")]
    [Audit("ToggleAlertRule", "AlertRule")]
    [ProducesResponseType(typeof(AlertRuleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AlertRuleDto>> ToggleAlertRule(Guid id)
    {
        var rule = await _dbContext.AlertRules.FindAsync(id);
        if (rule is null)
            return NotFound(new { code = 404, message = "告警规则不存在" });

        rule.Enabled = !rule.Enabled;
        await _dbContext.SaveChangesAsync();

        return Ok(_mapper.Map<AlertRuleDto>(rule));
    }
}
