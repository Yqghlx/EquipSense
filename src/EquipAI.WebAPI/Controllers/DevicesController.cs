using EquipAI.Application.DTOs.Common;
using EquipAI.Application.DTOs.Devices;
using EquipAI.Application.Interfaces;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 设备管理控制器，提供设备 CRUD 和筛选查询接口
/// 所有操作均在当前租户范围内进行
/// </summary>
[ApiController]
[Route("api/v1/devices")]
[Authorize]
public class DevicesController : ControllerBase
{
    private readonly IDeviceService _deviceService;
    private readonly ITenantContext _tenantContext;
    private readonly IMlAnomalyDetectionService _mlService;

    /// <summary>
    /// 初始化设备管理控制器
    /// </summary>
    /// <param name="deviceService">设备管理服务</param>
    /// <param name="tenantContext">租户上下文，用于获取当前请求的租户 ID</param>
    /// <param name="mlService">ML 异常检测服务</param>
    public DevicesController(
        IDeviceService deviceService,
        ITenantContext tenantContext,
        IMlAnomalyDetectionService mlService)
    {
        _deviceService = deviceService;
        _tenantContext = tenantContext;
        _mlService = mlService;
    }

    /// <summary>
    /// 分页查询设备列表，支持按状态和类型筛选
    /// </summary>
    /// <param name="query">分页查询参数</param>
    /// <param name="status">可选：按设备状态筛选（如 Online、Offline、Maintenance、Warning）</param>
    /// <param name="type">可选：按设备类型筛选（如 电机、泵、压缩机）</param>
    /// <returns>分页设备结果</returns>
    [HttpGet]
    [RequirePermission("device:read")]
    [OutputCache(PolicyName = "Devices")]
    [ProducesResponseType(typeof(PagedResult<DeviceDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<DeviceDto>>> GetDevices(
        [FromQuery] PagedQuery query,
        [FromQuery] string? status = null,
        [FromQuery] string? type = null)
    {
        var result = await _deviceService.GetDevicesAsync(query, _tenantContext.TenantId, status, type);
        return Ok(result);
    }

    /// <summary>
    /// 根据 ID 获取设备详情
    /// </summary>
    /// <param name="id">设备 ID</param>
    /// <returns>设备信息</returns>
    [HttpGet("{id:guid}")]
    [RequirePermission("device:read")]
    [ProducesResponseType(typeof(DeviceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DeviceDto>> GetDevice(Guid id)
    {
        var device = await _deviceService.GetDeviceByIdAsync(id, _tenantContext.TenantId);
        if (device == null)
        {
            return NotFound(new { code = 404, message = "设备不存在" });
        }
        return Ok(device);
    }

    /// <summary>
    /// 创建新设备
    /// </summary>
    /// <param name="request">创建设备请求</param>
    /// <returns>创建后的设备信息</returns>
    [HttpPost]
    [RequirePermission("device:create")]
    [ProducesResponseType(typeof(DeviceDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DeviceDto>> CreateDevice([FromBody] CreateDeviceRequest request)
    {
        var device = await _deviceService.CreateDeviceAsync(request, _tenantContext.TenantId);
        return CreatedAtAction(nameof(GetDevice), new { id = device.Id }, device);
    }

    /// <summary>
    /// 更新设备信息
    /// </summary>
    /// <param name="id">设备 ID</param>
    /// <param name="request">更新设备请求</param>
    /// <returns>更新后的设备信息</returns>
    [HttpPut("{id:guid}")]
    [RequirePermission("device:update")]
    [ProducesResponseType(typeof(DeviceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DeviceDto>> UpdateDevice(Guid id, [FromBody] UpdateDeviceRequest request)
    {
        var device = await _deviceService.UpdateDeviceAsync(id, _tenantContext.TenantId, request);
        return Ok(device);
    }

    /// <summary>
    /// 删除设备
    /// </summary>
    /// <param name="id">设备 ID</param>
    [HttpDelete("{id:guid}")]
    [RequirePermission("device:delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDevice(Guid id)
    {
        await _deviceService.DeleteDeviceAsync(id, _tenantContext.TenantId);
        return NoContent();
    }

    /// <summary>
    /// 获取设备指标的异常检测评分
    /// </summary>
    /// <param name="id">设备 ID</param>
    /// <param name="metric">指标名称</param>
    /// <param name="ct">取消令牌</param>
    [HttpGet("{id:guid}/anomaly-score")]
    [RequirePermission("device:read")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult> GetAnomalyScore(Guid id, [FromQuery] string metric, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(metric))
            return BadRequest(new { code = 400, message = "metric 参数不能为空" });

        // 获取最新一条遥测数据作为当前值
        var baselineStats = await _mlService.GetBaselineStatsAsync(id, metric, ct);
        if (baselineStats == null)
            return Ok(new { message = "样本数据不足，无法进行异常检测", sampleCount = 0 });

        // 使用均值作为当前值进行检测（简化实现）
        var result = await _mlService.DetectAsync(_tenantContext.TenantId, id, metric, baselineStats.Mean, ct);

        return Ok(new
        {
            metric,
            anomaly = result != null,
            result?.IsAnomaly,
            result?.AnomalyScore,
            result?.ExpectedValue,
            result?.Description,
            result?.SampleCount,
            baseline = new
            {
                baselineStats.Mean,
                baselineStats.StdDev,
                baselineStats.Min,
                baselineStats.Max,
                baselineStats.SampleCount,
                baselineStats.LastTrainingTime,
            },
        });
    }

    /// <summary>
    /// 获取设备指标的基线统计信息
    /// </summary>
    /// <param name="id">设备 ID</param>
    /// <param name="metric">指标名称</param>
    /// <param name="ct">取消令牌</param>
    [HttpGet("{id:guid}/baseline")]
    [RequirePermission("device:read")]
    [ProducesResponseType(typeof(BaselineStats), StatusCodes.Status200OK)]
    public async Task<ActionResult> GetBaseline(Guid id, [FromQuery] string metric, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(metric))
            return BadRequest(new { code = 400, message = "metric 参数不能为空" });

        var stats = await _mlService.GetBaselineStatsAsync(id, metric, ct);
        if (stats == null)
            return Ok(new { message = "样本数据不足", sampleCount = 0 });

        return Ok(stats);
    }
}
