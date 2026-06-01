using EquipAI.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 设备配置向导控制器，提供模板查询和快速注册设备接口
/// </summary>
[ApiController]
[Route("api/v1/device-config")]
[Authorize]
public class DeviceConfigController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    /// <summary>
    /// 初始化设备配置向导控制器
    /// </summary>
    /// <param name="dbContext">数据库上下文</param>
    public DeviceConfigController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>
    /// 获取设备类型模板列表，支持按行业筛选
    /// </summary>
    /// <param name="industry">可选：按行业筛选（如 制造业、化工、电力）</param>
    /// <returns>模板列表</returns>
    [HttpGet("templates")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> GetTemplates([FromQuery] string? industry)
    {
        var query = _dbContext.DeviceTypeTemplates.AsQueryable();
        if (!string.IsNullOrEmpty(industry))
            query = query.Where(t => t.Industry == industry);

        var templates = await query
            .Select(t => new { t.Id, t.Name, t.Industry, t.Parameters, t.DefaultAlarmRules })
            .ToListAsync();
        return Ok(templates);
    }

    /// <summary>
    /// 快速注册设备（向导模式），同时可创建默认告警规则
    /// </summary>
    /// <param name="request">快速注册请求</param>
    /// <returns>创建后的设备信息</returns>
    [HttpPost("quick-register")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> QuickRegister([FromBody] QuickRegisterRequest request)
    {
        // 检查设备编码是否重复
        var exists = await _dbContext.Devices
            .AnyAsync(d => d.DeviceCode == request.DeviceCode);
        if (exists)
            return BadRequest(new { code = "DUPLICATE_CODE", message = $"设备编码 {request.DeviceCode} 已存在" });

        var device = new Core.Entities.Device
        {
            TenantId = request.TenantId,
            DeviceCode = request.DeviceCode,
            Name = request.Name ?? request.DeviceCode,
            Type = request.DeviceType ?? "通用设备",
            Status = Core.Enums.DeviceStatus.Offline,
            HealthScore = 100m
        };
        _dbContext.Devices.Add(device);

        // 如果请求中包含默认告警规则，一并创建
        if (request.DefaultAlertRules is { Count: > 0 })
        {
            foreach (var rule in request.DefaultAlertRules)
            {
                _dbContext.AlertRules.Add(new Core.Entities.AlertRule
                {
                    TenantId = request.TenantId,
                    DeviceId = device.Id,
                    Name = $"{device.Name} - {rule.Metric} 告警",
                    Metric = rule.Metric,
                    RuleType = Core.Enums.RuleType.Threshold,
                    Operator = ">",
                    Threshold = rule.Threshold,
                    Severity = rule.Severity ?? Core.Enums.AlertSeverity.High,
                    Enabled = true,
                    AutoCreateWorkorder = true
                });
            }
        }

        await _dbContext.SaveChangesAsync();
        return CreatedAtAction(nameof(GetTemplates), new { id = device.Id },
            new { device.Id, device.DeviceCode, device.Name, device.Type });
    }
}

/// <summary>
/// 快速注册设备请求
/// </summary>
public record QuickRegisterRequest
{
    /// <summary>
    /// 所属租户 ID
    /// </summary>
    public Guid TenantId { get; init; }

    /// <summary>
    /// 设备编码（租户内唯一）
    /// </summary>
    public string DeviceCode { get; init; } = string.Empty;

    /// <summary>
    /// 设备名称（可选，默认使用设备编码）
    /// </summary>
    public string? Name { get; init; }

    /// <summary>
    /// 设备类型（可选，默认"通用设备"）
    /// </summary>
    public string? DeviceType { get; init; }

    /// <summary>
    /// 默认告警规则列表（可选）
    /// </summary>
    public List<DefaultAlertRuleRequest>? DefaultAlertRules { get; init; }
}

/// <summary>
/// 默认告警规则请求
/// </summary>
public record DefaultAlertRuleRequest
{
    /// <summary>
    /// 监控指标名称（如 temperature、vibration）
    /// </summary>
    public string Metric { get; init; } = string.Empty;

    /// <summary>
    /// 告警阈值
    /// </summary>
    public decimal Threshold { get; init; }

    /// <summary>
    /// 告警严重级别（可选，默认 High）
    /// </summary>
    public Core.Enums.AlertSeverity? Severity { get; init; }
}
