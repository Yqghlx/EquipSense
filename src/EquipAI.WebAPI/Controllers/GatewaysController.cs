using System.Security.Cryptography;
using System.Text;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 网关管理控制器，提供网关注册/心跳、列表查询和状态代理接口
/// </summary>
[ApiController]
[Route("api/v1/gateways")]
public class GatewaysController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly ITenantContext _tenantContext;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GatewaysController> _logger;

    public GatewaysController(
        AppDbContext dbContext,
        ITenantContext tenantContext,
        IConfiguration configuration,
        ILogger<GatewaysController> logger)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// 网关注册/心跳 — EdgeGateway 定期调用以注册自身或刷新心跳
    /// 使用 X-Gateway-Auth-Key 请求头认证，无需 JWT
    /// </summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(GatewayDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<GatewayDto>> Register([FromBody] RegisterGatewayRequest request)
    {
        // 校验网关认证密钥
        var authKey = _configuration["Gateway:AuthKey"];
        if (string.IsNullOrEmpty(authKey))
            return StatusCode(500, new { code = 500, message = "网关认证密钥未配置" });

        var requestAuthKey = Request.Headers["X-Gateway-Auth-Key"].FirstOrDefault();
        if (string.IsNullOrEmpty(requestAuthKey) || !CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(requestAuthKey),
                Encoding.UTF8.GetBytes(authKey)))
        {
            return Unauthorized(new { code = 401, message = "网关认证密钥无效" });
        }

        if (string.IsNullOrWhiteSpace(request.GatewayId))
            return BadRequest(new { code = 400, message = "GatewayId 不能为空" });

        // 绕过租户过滤器查找已有网关（网关认证不走 JWT）
        var existing = await _dbContext.UnfilteredSet<Gateway>()
            .FirstOrDefaultAsync(g => g.TenantId == request.TenantId && g.GatewayId == request.GatewayId);

        if (existing == null)
        {
            // 首次注册
            var gateway = new Gateway
            {
                GatewayId = request.GatewayId,
                TenantId = request.TenantId,
                Name = request.Name ?? request.GatewayId,
                Description = request.Description,
                Host = request.Host ?? "localhost",
                HealthPort = request.HealthPort ?? 8081,
                Status = "online",
                LastHeartbeatAt = DateTime.UtcNow,
                UptimeSeconds = request.UptimeSeconds,
                Version = request.Version,
                Enabled = true,
            };
            _dbContext.Set<Gateway>().Add(gateway);
            await _dbContext.SaveChangesAsync();
            _logger.LogInformation("网关注册成功：{GatewayId}（{Name}）", gateway.GatewayId, gateway.Name);
            return Ok(ToDto(gateway));
        }

        // 更新心跳
        existing.Status = "online";
        existing.LastHeartbeatAt = DateTime.UtcNow;
        existing.UptimeSeconds = request.UptimeSeconds ?? existing.UptimeSeconds;
        existing.Version = request.Version ?? existing.Version;

        // 心跳时可选更新地址信息
        if (!string.IsNullOrEmpty(request.Host)) existing.Host = request.Host;
        if (request.HealthPort.HasValue) existing.HealthPort = request.HealthPort.Value;
        if (!string.IsNullOrEmpty(request.Name)) existing.Name = request.Name;
        if (request.Description != null) existing.Description = request.Description;

        await _dbContext.SaveChangesAsync();
        return Ok(ToDto(existing));
    }

    /// <summary>
    /// 获取当前租户的网关列表
    /// </summary>
    [HttpGet]
    [Authorize]
    [RequirePermission("device:read")]
    [ProducesResponseType(typeof(List<GatewayDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<GatewayDto>>> List()
    {
        var gateways = await _dbContext.UnfilteredSet<Gateway>()
            .Where(g => g.TenantId == _tenantContext.TenantId)
            .OrderByDescending(g => g.LastHeartbeatAt)
            .ToListAsync();

        // 附带每个网关的设备数量
        var deviceCounts = await _dbContext.GatewayDevices
            .Where(d => d.TenantId == _tenantContext.TenantId)
            .GroupBy(d => d.GatewayId)
            .Select(g => new { GatewayId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.GatewayId, x => x.Count);

        var result = gateways.Select(g =>
        {
            var dto = ToDto(g);
            dto.DeviceCount = deviceCounts.GetValueOrDefault(g.GatewayId, 0);
            return dto;
        }).ToList();

        return Ok(result);
    }

    /// <summary>
    /// 代理指定网关的实时状态 — 从数据库读取网关地址后代理到网关 /status 端点
    /// </summary>
    [HttpGet("{gatewayId}/status")]
    [Authorize]
    [RequirePermission("device:read")]
    public async Task<ActionResult> GetStatus(string gatewayId)
    {
        var gateway = await _dbContext.UnfilteredSet<Gateway>()
            .FirstOrDefaultAsync(g => g.TenantId == _tenantContext.TenantId && g.GatewayId == gatewayId);

        if (gateway == null)
            return NotFound(new { code = 404, message = "网关不存在" });

        if (!gateway.Enabled)
            return Ok(new { status = "disabled", message = "网关已被禁用" });

        try
        {
            using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };
            var response = await httpClient.GetAsync($"http://{gateway.Host}:{gateway.HealthPort}/status");

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                return Content(content, "application/json");
            }

            return Ok(new
            {
                status = "unreachable",
                gateway.Status,
                gateway.GatewayId,
                gateway.Name,
                gateway.LastHeartbeatAt,
                message = $"网关返回 HTTP {(int)response.StatusCode}",
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "无法连接网关状态端点: {Host}:{Port}", gateway.Host, gateway.HealthPort);
            return Ok(new
            {
                status = "offline",
                gateway.GatewayId,
                gateway.Name,
                gateway.LastHeartbeatAt,
                message = "网关离线或网络不通",
            });
        }
    }

    /** 实体转 DTO */
    private static GatewayDto ToDto(Gateway g) => new()
    {
        Id = g.Id,
        GatewayId = g.GatewayId,
        TenantId = g.TenantId,
        Name = g.Name,
        Description = g.Description,
        Host = g.Host,
        HealthPort = g.HealthPort,
        Status = g.Status,
        LastHeartbeatAt = g.LastHeartbeatAt,
        UptimeSeconds = g.UptimeSeconds,
        Version = g.Version,
        Enabled = g.Enabled,
        CreatedAt = g.CreatedAt,
    };
}

// ============================================================================
// DTO 定义
// ============================================================================

/// <summary>网关信息 DTO</summary>
public class GatewayDto
{
    public Guid Id { get; set; }
    public string GatewayId { get; set; } = string.Empty;
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Host { get; set; } = string.Empty;
    public int HealthPort { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? LastHeartbeatAt { get; set; }
    public int? UptimeSeconds { get; set; }
    public string? Version { get; set; }
    public bool Enabled { get; set; }
    public DateTime CreatedAt { get; set; }
    /// <summary>关联的网关设备数量（仅列表查询时填充）</summary>
    public int DeviceCount { get; set; }
}

/// <summary>网关注册/心跳请求</summary>
public class RegisterGatewayRequest
{
    public string GatewayId { get; set; } = string.Empty;
    public Guid TenantId { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Host { get; set; }
    public int? HealthPort { get; set; }
    public int? UptimeSeconds { get; set; }
    public string? Version { get; set; }
}
