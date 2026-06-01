using EquipAI.Application.Telemetry;
using EquipAI.Application.Telemetry.DTOs;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 遥测数据控制器
/// 提供 HTTP 上报通道（MQTT 备用）和遥测数据查询接口
/// </summary>
[ApiController]
[Route("api/v1/telemetry")]
[Authorize]
public class TelemetryController : ControllerBase
{
    private readonly ITelemetryService _telemetryService;
    private readonly AppDbContext _dbContext;
    private readonly ITenantContext _tenantContext;
    private readonly TelemetryQueryService _queryService;

    public TelemetryController(
        ITelemetryService telemetryService,
        AppDbContext dbContext,
        ITenantContext tenantContext,
        TelemetryQueryService queryService)
    {
        _telemetryService = telemetryService;
        _dbContext = dbContext;
        _tenantContext = tenantContext;
        _queryService = queryService;
    }

    /// <summary>
    /// HTTP 上报遥测数据
    /// </summary>
    [HttpPost]
    [RequirePermission("device:read")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadTelemetry([FromBody] TelemetryUploadRequest request)
    {
        Guid deviceId;
        if (Guid.TryParse(request.DeviceId, out var uuid))
        {
            deviceId = uuid;
        }
        else
        {
            var device = await _dbContext.Devices
                .FirstOrDefaultAsync(d => d.DeviceCode == request.DeviceId);
            if (device == null)
            {
                return BadRequest(new { code = 400, message = $"设备编码 '{request.DeviceId}' 不存在" });
            }
            deviceId = device.Id;
        }

        foreach (var (metric, value) in request.Metrics)
        {
            await _telemetryService.EnqueueAsync(
                _tenantContext.TenantId, deviceId,
                metric, value,
                request.Timestamp, request.Quality, "http");
        }

        return Accepted(new { message = "遥测数据已接收", count = request.Metrics.Count });
    }

    /// <summary>
    /// 查询设备遥测数据
    /// 传入 metric 时返回历史时序数据（用于图表），不传时返回所有指标最新值
    /// </summary>
    /// <param name="deviceId">设备 ID</param>
    /// <param name="metric">指标名称（可选），如 temperature、pressure</param>
    /// <param name="startTime">查询起始时间（可选，默认最近 1 小时）</param>
    /// <param name="endTime">查询结束时间（可选，默认当前时间）</param>
    [HttpGet("{deviceId:guid}")]
    [RequirePermission("device:read")]
    [ProducesResponseType(typeof(List<TelemetryDataPoint>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Dictionary<string, double>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTelemetry(
        Guid deviceId,
        [FromQuery] string? metric,
        [FromQuery] DateTime? startTime,
        [FromQuery] DateTime? endTime)
    {
        var end = endTime ?? DateTime.UtcNow;
        var start = startTime ?? end.AddHours(-1);

        // 未指定指标时，返回所有指标的最新值
        if (string.IsNullOrEmpty(metric))
        {
            var latest = await _queryService.GetLatestAsync(deviceId);
            return Ok(latest);
        }

        // 指定了指标时，返回历史时序数据
        var data = await _queryService.QueryAsync(deviceId, metric, start, end);
        return Ok(data);
    }
}
