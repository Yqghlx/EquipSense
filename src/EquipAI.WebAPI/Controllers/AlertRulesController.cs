using EquipAI.Application.Alerts;
using EquipAI.Application.Alerts.DTOs;
using EquipAI.Application.DTOs.Common;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Middleware;
using EquipAI.WebAPI.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 告警规则管理控制器
/// </summary>
[ApiController]
[Route("api/v1/alert-rules")]
[Authorize]
public class AlertRulesController : ControllerBase
{
    private readonly AlertRuleService _service;

    public AlertRulesController(AlertRuleService service)
    {
        _service = service;
    }

    [HttpGet]
    [RequirePermission("alert:read")]
    [ProducesResponseType(typeof(PagedResult<AlertRuleDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<AlertRuleDto>>> GetAlertRules([FromQuery] PagedQuery query, CancellationToken ct = default)
        => Ok(await _service.ListAsync(query, ct));

    [HttpGet("{id:guid}")]
    [RequirePermission("alert:read")]
    [ProducesResponseType(typeof(AlertRuleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AlertRuleDto>> GetAlertRule(Guid id, CancellationToken ct = default)
    {
        var rule = await _service.GetAsync(id, ct);
        if (rule == null)
            return NotFound(new { code = 404, message = "告警规则不存在" });
        return Ok(rule);
    }

    [HttpPost]
    [RequirePermission("alert:config")]
    [ProducesResponseType(typeof(AlertRuleDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<AlertRuleDto>> CreateAlertRule([FromBody] CreateAlertRuleRequest request, CancellationToken ct = default)
    {
        var rule = await _service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetAlertRule), new { id = rule.Id }, rule);
    }

    [HttpPut("{id:guid}")]
    [RequirePermission("alert:config")]
    [ProducesResponseType(typeof(AlertRuleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AlertRuleDto>> UpdateAlertRule(Guid id, [FromBody] UpdateAlertRuleRequest request, CancellationToken ct = default)
        => Ok(await _service.UpdateAsync(id, request, ct));

    [HttpDelete("{id:guid}")]
    [RequirePermission("alert:delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAlertRule(Guid id, CancellationToken ct = default)
    {
        await _service.DeleteAsync(id, ct);
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
    public async Task<ActionResult<AlertRuleDto>> ToggleAlertRule(Guid id, CancellationToken ct = default)
    {
        var rule = await _service.ToggleAsync(id, ct);
        if (rule is null)
            return NotFound(new { code = 404, message = "告警规则不存在" });
        return Ok(rule);
    }
}
