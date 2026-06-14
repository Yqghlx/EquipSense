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
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
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
    /// 创建 FMEA 条目
    /// </summary>
    [HttpPost]
    [RequirePermission("knowledge:create")]
    [ProducesResponseType(typeof(FmeaEntryResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<FmeaEntryResponse>> Create([FromBody] CreateFmeaEntryRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var entry = await _fmeaService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = entry.Id }, entry);
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
        var (items, _) = await _fmeaService.GetEntriesAsync(1, 1);
        var entry = items.FirstOrDefault(e => e.Id == id);
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

        var entry = await _fmeaService.UpdateAsync(id, request);
        if (entry is null) return NotFound();
        return Ok(entry);
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
