using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Middleware;
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
    private readonly ITenantContext _tenantContext;

    /// <summary>
    /// 初始化设备配置向导控制器
    /// </summary>
    /// <param name="dbContext">数据库上下文</param>
    /// <param name="tenantContext">租户上下文（JWT 权威）：设备及告警规则必须归属当前登录租户，禁止信任请求体里的 TenantId</param>
    public DeviceConfigController(AppDbContext dbContext, ITenantContext tenantContext)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
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
    [RequirePermission("device:create")]
    [HttpPost("quick-register")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> QuickRegister([FromBody] QuickRegisterRequest request)
    {
        // 租户身份以 JWT 为权威：设备及告警规则必须归属当前登录租户，禁止信任请求体里的 TenantId。
        // 历史缺陷：原代码用 request.TenantId，租户 A 传 B 的 TenantId 即可在 B 名下创建设备 →
        // 跨租户注入（污染 B 的设备列表 / 触发 B 的告警 / 占用 B 的配额），同时因不维护计数还会超卖。
        var tenantId = _tenantContext.TenantId;

        // 检查设备编码是否重复（全局过滤器已自动限制当前租户范围）
        var exists = await _dbContext.Devices
            .AnyAsync(d => d.DeviceCode == request.DeviceCode);
        if (exists)
            return BadRequest(new { code = "DUPLICATE_CODE", message = $"设备编码 {request.DeviceCode} 已存在" });

        var device = new Core.Entities.Device
        {
            TenantId = tenantId,
            DeviceCode = request.DeviceCode,
            Name = request.Name ?? request.DeviceCode,
            Type = request.DeviceType ?? "通用设备",
            Status = Core.Enums.DeviceStatus.Offline,
            HealthScore = 100m
        };
        _dbContext.Devices.Add(device);

        // 如果请求中包含默认告警规则，一并创建（同样归属当前租户）
        if (request.DefaultAlertRules is { Count: > 0 })
        {
            foreach (var rule in request.DefaultAlertRules)
            {
                _dbContext.AlertRules.Add(new Core.Entities.AlertRule
                {
                    TenantId = tenantId,
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

        // 维护租户 CurrentDeviceCount（与 DeviceService.CreateDeviceAsync 一致）。
        // 遗漏此步会导致配额漂移：通过本端点创建的设备不计入 CurrentDeviceCount →
        // 中间件配额检查（CurrentDeviceCount < MaxDevices）错误放行 → 超卖。
        var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == tenantId);
        if (tenant != null)
        {
            tenant.CurrentDeviceCount++;
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
