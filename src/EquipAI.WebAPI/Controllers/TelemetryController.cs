using EquipAI.Application.Telemetry.DTOs;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 遥测数据 HTTP 接入控制器（MQTT 的备用通道）
/// </summary>
[ApiController]
[Route("api/v1/telemetry")]
[Authorize]
public class TelemetryController : ControllerBase
{
    private readonly ITelemetryService _telemetryService;
    private readonly AppDbContext _dbContext;
    private readonly ITenantContext _tenantContext;

    public TelemetryController(
        ITelemetryService telemetryService,
        AppDbContext dbContext,
        ITenantContext tenantContext)
    {
        _telemetryService = telemetryService;
        _dbContext = dbContext;
        _tenantContext = tenantContext;
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
}
