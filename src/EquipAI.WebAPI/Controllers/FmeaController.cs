using System.ComponentModel.DataAnnotations;
using EquipAI.Application.DTOs.Common;
using EquipAI.Application.Fmea;
using EquipAI.Application.Fmea.DTOs;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// FMEA 故障模式库控制器（Phase 5 新增）
/// </summary>
[ApiController]
[Route("api/v1/fmea")]
[Authorize]
public class FmeaController : ControllerBase
{
    private readonly FmeaService _fmeaService;

    public FmeaController(FmeaService fmeaService)
    {
        _fmeaService = fmeaService;
    }

    /// <summary>
    /// 分页查询 FMEA 条目
    /// </summary>
    [HttpGet]
    [RequirePermission("knowledge:read")]
    [ProducesResponseType(typeof(PagedResult<FmeaEntryResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<FmeaEntryResponse>>> GetEntries(
        [FromQuery, Range(1, PagedQuery.MaxPage, ErrorMessage = "页码必须在 1 到 1000000 之间")] int page = 1,
        [FromQuery, Range(1, PagedQuery.MaxPageSize, ErrorMessage = "每页条数必须在 1 到 100 之间")] int pageSize = 20,
        [FromQuery] string? deviceType = null,
        [FromQuery] bool? isEnabled = null)
    {
        var (items, total) = await _fmeaService.GetEntriesAsync(page, pageSize, deviceType, isEnabled);
        return Ok(new PagedResult<FmeaEntryResponse>
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize,
        });
    }

    /// <summary>
    /// 获取 FMEA 表单可关联的知识规则摘要。
    /// </summary>
    [HttpGet("knowledge-rules")]
    [RequirePermission("knowledge:read")]
    [ProducesResponseType(typeof(List<FmeaKnowledgeRuleOptionResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<FmeaKnowledgeRuleOptionResponse>>> GetKnowledgeRuleOptions(
        [FromQuery] string? deviceType = null,
        [FromQuery] Guid? selectedRuleId = null,
        CancellationToken ct = default)
    {
        return Ok(await _fmeaService.GetKnowledgeRuleOptionsAsync(deviceType, selectedRuleId, ct));
    }

    /// <summary>
    /// 创建 FMEA 条目
    /// </summary>
    [HttpPost]
    [RequirePermission("knowledge:create")]
    [ProducesResponseType(typeof(FmeaEntryResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<FmeaEntryResponse>> Create([FromBody] CreateFmeaEntryRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var entry = await _fmeaService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = entry.Id }, entry);
        }
        catch (FmeaValidationException exception)
        {
            return BadRequest(new { code = exception.Code, message = exception.Message });
        }
    }

    /// <summary>
    /// 获取 FMEA 条目详情
    /// </summary>
    [HttpGet("{id:guid}")]
    [RequirePermission("knowledge:read")]
    [ProducesResponseType(typeof(FmeaEntryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FmeaEntryResponse>> GetById(Guid id)
    {
        var entry = await _fmeaService.GetByIdAsync(id);
        if (entry is null) return NotFound();
        return Ok(entry);
    }

    /// <summary>
    /// 更新 FMEA 条目
    /// </summary>
    [HttpPut("{id:guid}")]
    [RequirePermission("knowledge:update")]
    [ProducesResponseType(typeof(FmeaEntryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FmeaEntryResponse>> Update(Guid id, [FromBody] UpdateFmeaEntryRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var entry = await _fmeaService.UpdateAsync(id, request);
            if (entry is null) return NotFound();
            return Ok(entry);
        }
        catch (FmeaValidationException exception)
        {
            return BadRequest(new { code = exception.Code, message = exception.Message });
        }
    }

    /// <summary>
    /// 删除 FMEA 条目
    /// </summary>
    [HttpDelete("{id:guid}")]
    [RequirePermission("knowledge:delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _fmeaService.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }

    /// <summary>
    /// 切换 FMEA 条目启用/禁用状态
    /// </summary>
    [HttpPut("{id:guid}/toggle")]
    [RequirePermission("knowledge:update")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleEnabled(Guid id)
    {
        var toggled = await _fmeaService.ToggleEnabledAsync(id);
        if (!toggled) return NotFound();
        return Ok();
    }
}
