using EquipAI.Application.Interfaces;
using EquipAI.Application.Telemetry;
using EquipAI.Application.Telemetry.DTOs;
using EquipAI.Core.Extensions;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Validation;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
    private readonly IDeviceService _deviceService;
    private readonly ITenantContext _tenantContext;
    private readonly TelemetryQueryService _queryService;

    public TelemetryController(
        ITelemetryService telemetryService,
        IDeviceService deviceService,
        ITenantContext tenantContext,
        TelemetryQueryService queryService)
    {
        _telemetryService = telemetryService;
        _deviceService = deviceService;
        _tenantContext = tenantContext;
        _queryService = queryService;
    }

    /// <summary>
    /// HTTP 上报遥测数据
    /// </summary>
    [HttpPost]
    [RequirePermission("device:read")]
    [RequestSizeLimit(TelemetryInputValidator.MaxPayloadBytes)]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadTelemetry([FromBody] TelemetryUploadRequest? request)
    {
        var validationError = ValidateUploadRequest(request);
        if (validationError is not null)
            return BadRequest(new { code = 400, message = validationError });

        // ValidateUploadRequest 已经保证 request 非空；这里保留显式判空，
        // 让未来修改校验逻辑时仍不会把异常输入带入业务流程。
        if (request is null)
            return BadRequest(new { code = 400, message = "遥测请求体不能为空" });

        var deviceIdentifier = request.DeviceId.Trim();
        var quality = request.Quality.Trim();
        var timestamp = request.Timestamp.ToSafeUtc();

        Guid deviceId;
        if (Guid.TryParse(deviceIdentifier, out var uuid))
        {
            deviceId = uuid;
        }
        else
        {
            // 设备编码解析下沉到 Application 层（IDeviceService），避免 Controller 直接依赖 AppDbContext
            var resolvedId = await _deviceService.GetDeviceIdByCodeAsync(deviceIdentifier);
            if (resolvedId is null)
            {
                return BadRequest(new { code = 400, message = $"设备编码 '{deviceIdentifier}' 不存在" });
            }
            deviceId = resolvedId.Value;
        }

        foreach (var (metric, value) in request.Metrics)
        {
            await _telemetryService.EnqueueAsync(
                _tenantContext.TenantId, deviceId,
                metric, value,
                timestamp, quality, "http");
        }

        return Accepted(new { message = "遥测数据已接收", count = request.Metrics.Count });
    }

    /// <summary>
    /// 校验 HTTP 遥测上报的边界。
    ///
    /// 设备网关可能因为网络重试、固件缺陷或配置错误发送损坏数据；在入队前拒绝，
    /// 能避免异常数据进入异步管线后才以数据库错误、告警噪音或队列堆积的形式暴露。
    /// 时间戳不限制历史跨度，因为边缘网关支持断网缓存后补传，业务上允许迟到数据。
    /// </summary>
    private static string? ValidateUploadRequest(TelemetryUploadRequest? request)
    {
        if (request is null)
            return "遥测请求体不能为空";

        return TelemetryInputValidator.ValidateUpload(
            request.DeviceId,
            request.Metrics,
            request.Timestamp,
            request.Quality);
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
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetTelemetry(
        Guid deviceId,
        [FromQuery] string? metric,
        [FromQuery] DateTime? startTime,
        [FromQuery] DateTime? endTime)
    {
        // query string 反序列化的 DateTime Kind=Unspecified，查 timestamptz 列会崩，统一转 Utc
        var end = (endTime ?? DateTime.UtcNow).ToSafeUtc();
        var start = (startTime ?? end.AddHours(-1)).ToSafeUtc();

        // 未指定指标时，返回所有指标的最新值
        if (string.IsNullOrEmpty(metric))
        {
            var latest = await _queryService.GetLatestAsync(deviceId, HttpContext.RequestAborted);
            return Ok(latest);
        }

        // 指定了指标时，返回历史时序数据
        var rangeError = TelemetryQueryService.ValidateHistoryRange(start, end);
        if (rangeError is not null)
        {
            return BadRequest(new { code = 400, message = rangeError });
        }

        var data = await _queryService.QueryAsync(
            deviceId, metric, start, end, HttpContext.RequestAborted);
        return Ok(data);
    }
}
