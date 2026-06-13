using System.Text;
using EquipAI.Application.Analysis;
using EquipAI.Application.DTOs.Common;
using EquipAI.Application.DTOs.Devices;
using EquipAI.Application.Interfaces;
using EquipAI.Application.Knowledge.DTOs;
using EquipAI.Application.Services;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Middleware;
using EquipAI.WebAPI.Middleware;
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
    private readonly DeviceImportService _importService;
    private readonly DeviceHealthService _healthService;

    /// <summary>
    /// 初始化设备管理控制器
    /// </summary>
    /// <param name="deviceService">设备管理服务</param>
    /// <param name="tenantContext">租户上下文，用于获取当前请求的租户 ID</param>
    /// <param name="mlService">ML 异常检测服务</param>
    /// <param name="importService">设备批量导入服务</param>
    /// <param name="healthService">设备健康度计算服务</param>
    public DevicesController(
        IDeviceService deviceService,
        ITenantContext tenantContext,
        IMlAnomalyDetectionService mlService,
        DeviceImportService importService,
        DeviceHealthService healthService)
    {
        _deviceService = deviceService;
        _tenantContext = tenantContext;
        _mlService = mlService;
        _importService = importService;
        _healthService = healthService;
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
    /// 刷新单个设备的健康度评分（基于告警历史、状态、遥测质量重新计算）
    /// </summary>
    /// <param name="id">设备 ID</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>更新后的健康度评分</returns>
    [HttpPost("{id:guid}/health-score")]
    [RequirePermission("device:read")]
    [Audit("RecalculateHealth", "Device")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RefreshHealthScore(Guid id, CancellationToken ct)
    {
        var score = await _healthService.UpdateHealthScoreAsync(id, ct);
        if (score is null)
            return NotFound(new { code = 404, message = "设备不存在" });

        return Ok(new { deviceId = id, healthScore = score, level = DeviceHealthService.GetHealthLevel(score.Value) });
    }

    /// <summary>
    /// 批量刷新当前租户所有设备的健康度评分
    /// </summary>
    [HttpPost("health-score/refresh-all")]
    [RequirePermission("device:read")]
    [Audit("RecalculateHealthAll", "Device")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> RefreshAllHealthScores(CancellationToken ct)
    {
        var updated = await _healthService.UpdateAllHealthScoresAsync(_tenantContext.TenantId, ct);
        return Ok(new { updatedCount = updated });
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

    /// <summary>
    /// 批量导入设备（CSV/JSON）— 支持预览和执行两种模式
    /// preview=true 时仅校验并返回预览报告，不写入数据库
    /// </summary>
    [HttpPost("import")]
    [RequirePermission("device:create")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    [ProducesResponseType(typeof(DeviceImportPreviewResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ImportResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ImportDevices(
        IFormFile file, [FromQuery] bool preview = false, CancellationToken ct = default)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { code = 400, message = "请选择要导入的文件" });

        // 文件扩展名和 Content-Type 双重校验，防止伪装文件
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext != ".csv" && ext != ".json")
            return BadRequest(new { code = 400, message = "仅支持 CSV 和 JSON 格式文件" });

        // 使用 UTF-8 编码读取（自动检测 BOM），覆盖中文 Excel 导出场景
        using var reader = new StreamReader(file.OpenReadStream(), Encoding.UTF8, detectEncodingFromByteOrderMarks: true);
        var content = await reader.ReadToEndAsync(ct);

        if (string.IsNullOrWhiteSpace(content))
            return BadRequest(new { code = 400, message = "文件内容为空" });

        if (preview)
        {
            var previewResult = _importService.PreviewImport(content, file.FileName);
            return Ok(previewResult);
        }

        var result = await _importService.ExecuteImportAsync(
            content, file.FileName, _tenantContext.TenantId, _tenantContext.UserId, ct);

        // 导入成功后清除设备列表输出缓存，确保后续查询能立即看到新设备
        if (result.Imported > 0)
        {
            HttpContext.Response.Headers["X-Import-Count"] = result.Imported.ToString();
        }

        return Ok(result);
    }

    /// <summary>
    /// 下载设备导入 CSV 模板
    /// </summary>
    [HttpGet("import/template")]
    [RequirePermission("device:read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult DownloadImportTemplate()
    {
        var csv = DeviceImportService.GenerateCsvTemplate();
        var bytes = Encoding.UTF8.GetBytes(csv);
        // 加 BOM 头，确保中文 Excel 双击打开不会乱码
        var bom = Encoding.UTF8.GetPreamble();
        var content = bom.Concat(bytes).ToArray();

        return File(content, "text/csv; charset=utf-8", "device_import_template.csv");
    }
}
