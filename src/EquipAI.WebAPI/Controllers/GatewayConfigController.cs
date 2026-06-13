using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using EquipAI.Application.DTOs.Gateway;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 网关配置管理控制器，提供网关设备配置的 CRUD、测试连接和配置拉取接口
/// </summary>
[ApiController]
[Route("api/v1/gateway")]
public class GatewayConfigController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly ITenantContext _tenantContext;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GatewayConfigController> _logger;

    /// <summary>
    /// 初始化网关配置管理控制器
    /// </summary>
    /// <param name="dbContext">数据库上下文</param>
    /// <param name="tenantContext">租户上下文</param>
    /// <param name="configuration">应用配置，用于读取 Gateway:AuthKey 等配置项</param>
    public GatewayConfigController(
        AppDbContext dbContext,
        ITenantContext tenantContext,
        IConfiguration configuration,
        ILogger<GatewayConfigController> logger)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// 代理获取边缘网关实时状态 — 请求网关 /status 端点并转发响应
    /// </summary>
    /// <returns>网关运行状态 JSON</returns>
    [HttpGet("status")]
    [Authorize]
    [RequirePermission("device:read")]
    public async Task<ActionResult> GetGatewayStatus()
    {
        // 从配置获取网关健康端点地址
        var gatewayHealthPort = _configuration["Gateway:HealthPort"] ?? "8081";
        var gatewayHost = _configuration["Gateway:Host"] ?? "localhost";

        try
        {
            using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };
            var response = await httpClient.GetAsync($"http://{gatewayHost}:{gatewayHealthPort}/status");

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                return Content(content, "application/json");
            }

            return Ok(new
            {
                status = "unreachable",
                message = $"网关状态端点返回 {(int)response.StatusCode}",
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "无法连接网关状态端点: {Host}:{Port}", gatewayHost, gatewayHealthPort);
            return Ok(new
            {
                status = "offline",
                message = "网关离线或未启动",
            });
        }
    }

    /// <summary>
    /// EdgeGateway 拉取配置 — 根据网关标识获取该网关下所有启用的设备配置
    /// 使用 X-Gateway-Auth-Key 请求头认证，无需 JWT
    /// </summary>
    /// <param name="gatewayId">网关标识（对应 EdgeGateway 的 GatewayOptions.Id）</param>
    /// <returns>该网关下的设备配置列表</returns>
    [HttpGet("config")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<GatewayDevicePullDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<GatewayDevicePullDto>>> PullConfig([FromQuery] string gatewayId)
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

        if (string.IsNullOrWhiteSpace(gatewayId))
            return BadRequest(new { code = 400, message = "gatewayId 参数不能为空" });

        // 查询该网关下所有启用的设备配置（绕过租户过滤器，因为网关认证不经过 JWT）
        var devices = await _dbContext.UnfilteredSet<GatewayDevice>()
            .Where(d => d.GatewayId == gatewayId && d.Enabled)
            .OrderBy(d => d.DeviceName)
            .ToListAsync();

        // 转换为 EdgeGateway 可直接使用的拉取 DTO
        var result = devices.Select(d => new GatewayDevicePullDto
        {
            DeviceId = d.Id.ToString(),
            Protocol = d.Protocol,
            ConnectionString = d.ConnectionConfig,
            DataPoints = ParseDataPoints(d.DataPoints),
            PollIntervalMs = d.PollIntervalMs,
        }).ToList();

        return Ok(result);
    }

    /// <summary>
    /// 获取当前租户的网关设备配置列表
    /// </summary>
    /// <param name="gatewayId">可选：按网关标识筛选</param>
    /// <returns>网关设备配置列表</returns>
    [HttpGet("devices")]
    [Authorize]
    [RequirePermission("device:read")]
    [ProducesResponseType(typeof(List<GatewayDeviceDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<GatewayDeviceDto>>> GetDevices([FromQuery] string? gatewayId)
    {
        var query = _dbContext.GatewayDevices.AsQueryable();

        if (!string.IsNullOrWhiteSpace(gatewayId))
            query = query.Where(d => d.GatewayId == gatewayId);

        var devices = await query
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();

        var result = devices.Select(MapToDto).ToList();
        return Ok(result);
    }

    /// <summary>
    /// 创建网关设备配置
    /// </summary>
    /// <param name="request">创建网关设备请求</param>
    /// <returns>创建后的网关设备配置</returns>
    [HttpPost("devices")]
    [Authorize]
    [RequirePermission("device:create")]
    [ProducesResponseType(typeof(GatewayDeviceDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<GatewayDeviceDto>> CreateDevice([FromBody] CreateGatewayDeviceRequest request)
    {
        // 参数校验
        if (string.IsNullOrWhiteSpace(request.DeviceName))
            return BadRequest(new { code = 400, message = "设备名称不能为空" });
        if (string.IsNullOrWhiteSpace(request.Protocol))
            return BadRequest(new { code = 400, message = "协议类型不能为空" });

        // 优先使用请求中指定的网关 ID，否则使用默认值
        var gatewayId = !string.IsNullOrWhiteSpace(request.GatewayId)
            ? request.GatewayId
            : _configuration["Gateway:DefaultGatewayId"] ?? "gateway-001";

        var entity = new GatewayDevice
        {
            TenantId = _tenantContext.TenantId,
            GatewayId = gatewayId,
            DeviceId = request.DeviceId,
            DeviceName = request.DeviceName,
            Protocol = request.Protocol.ToLowerInvariant(),
            ConnectionConfig = request.ConnectionConfig,
            DataPoints = request.DataPoints,
            PollIntervalMs = request.PollIntervalMs,
            Enabled = true,
        };

        _dbContext.GatewayDevices.Add(entity);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetDevices), new { }, MapToDto(entity));
    }

    /// <summary>
    /// 测试设备连接 — 代理到在线边缘网关执行真实协议连接测试。
    /// 无在线网关时回退到 JSON 格式校验。
    /// </summary>
    /// <param name="request">测试连接请求</param>
    /// <returns>测试连接结果</returns>
    [HttpPost("devices/test-connection")]
    [Authorize]
    [RequirePermission("device:create")]
    [ProducesResponseType(typeof(TestConnectionResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TestConnectionResponse>> TestConnection([FromBody] TestConnectionRequest request)
    {
        // 参数校验
        if (string.IsNullOrWhiteSpace(request.Protocol))
            return BadRequest(new { code = 400, message = "协议类型不能为空" });

        var protocol = request.Protocol.ToLowerInvariant();
        var supportedProtocols = new[] { "opcua", "modbus-tcp", "modbus-rtu" };
        if (!supportedProtocols.Contains(protocol))
        {
            return Ok(new TestConnectionResponse
            {
                Success = false,
                Message = $"不支持的协议类型：{request.Protocol}，支持：{string.Join("、", supportedProtocols)}"
            });
        }

        // 尝试代理到当前租户的在线边缘网关
        var onlineGateway = await _dbContext.UnfilteredSet<Gateway>()
            .Where(g => g.TenantId == _tenantContext.TenantId && g.Status == "online" && g.Enabled)
            .OrderByDescending(g => g.LastHeartbeatAt)
            .FirstOrDefaultAsync();

        if (onlineGateway != null)
        {
            try
            {
                using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(15) };
                var payload = new { protocol, connectionString = request.ConnectionConfig };
                var response = await httpClient.PostAsJsonAsync(
                    $"http://{onlineGateway.Host}:{onlineGateway.HealthPort}/test-connection",
                    payload);

                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<JsonElement>();
                    return Ok(new TestConnectionResponse
                    {
                        Success = result.TryGetProperty("success", out var successEl) && successEl.GetBoolean(),
                        Message = result.TryGetProperty("message", out var msgEl) ? msgEl.GetString() ?? "连接测试完成" : "连接测试完成"
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "代理连接测试到网关 {GatewayId} 失败，回退到配置校验", onlineGateway.GatewayId);
            }
        }

        // 回退：JSON 格式校验
        return await TestConnectionValidationAsync(protocol, request.ConnectionConfig);
    }

    /// <summary>
    /// 纯 JSON 格式校验回退（无在线网关时使用）
    /// </summary>
    private async Task<ActionResult<TestConnectionResponse>> TestConnectionValidationAsync(string protocol, string connectionConfig)
    {
        try
        {
            var configDoc = JsonDocument.Parse(connectionConfig);
            var hasRequiredField = protocol switch
            {
                "opcua" => configDoc.RootElement.TryGetProperty("endpointUrl", out _),
                "modbus-tcp" => configDoc.RootElement.TryGetProperty("host", out _),
                "modbus-rtu" => configDoc.RootElement.TryGetProperty("portName", out _) || configDoc.RootElement.TryGetProperty("port", out _),
                _ => false
            };

            if (!hasRequiredField)
            {
                var requiredField = protocol switch
                {
                    "opcua" => "endpointUrl",
                    "modbus-tcp" => "host",
                    "modbus-rtu" => "portName 或 port",
                    _ => "unknown"
                };

                return Ok(new TestConnectionResponse
                {
                    Success = false,
                    Message = $"连接配置缺少必填字段：{requiredField}"
                });
            }

            return Ok(new TestConnectionResponse
            {
                Success = true,
                Message = $"配置格式校验通过（{protocol}），无在线网关可执行真实连接测试"
            });
        }
        catch (JsonException)
        {
            return Ok(new TestConnectionResponse
            {
                Success = false,
                Message = "连接配置 JSON 格式无效"
            });
        }
    }

    /// <summary>
    /// 更新网关设备配置
    /// </summary>
    /// <param name="id">网关设备配置 ID</param>
    /// <param name="request">更新请求（仅非空字段会被更新）</param>
    /// <returns>更新后的网关设备配置</returns>
    [HttpPut("devices/{id:guid}")]
    [Authorize]
    [RequirePermission("device:update")]
    [ProducesResponseType(typeof(GatewayDeviceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<GatewayDeviceDto>> UpdateDevice(Guid id, [FromBody] UpdateGatewayDeviceRequest request)
    {
        var entity = await _dbContext.GatewayDevices.FindAsync(id);
        if (entity == null)
            return NotFound(new { code = 404, message = "网关设备配置不存在" });

        if (request.DeviceName is not null) entity.DeviceName = request.DeviceName;
        if (request.ConnectionConfig is not null) entity.ConnectionConfig = request.ConnectionConfig;
        if (request.DataPoints is not null) entity.DataPoints = request.DataPoints;
        if (request.PollIntervalMs.HasValue) entity.PollIntervalMs = request.PollIntervalMs.Value;
        if (request.Enabled.HasValue) entity.Enabled = request.Enabled.Value;

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("网关设备 {DeviceId} 配置已更新", id);
        return Ok(MapToDto(entity));
    }

    /// <summary>
    /// 删除网关设备配置
    /// </summary>
    /// <param name="id">网关设备配置 ID</param>
    [HttpDelete("devices/{id:guid}")]
    [Authorize]
    [RequirePermission("device:delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDevice(Guid id)
    {
        var entity = await _dbContext.GatewayDevices.FindAsync(id);
        if (entity == null)
            return NotFound(new { code = 404, message = "网关设备配置不存在" });

        _dbContext.GatewayDevices.Remove(entity);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// 将 GatewayDevice 实体映射为 GatewayDeviceDto
    /// </summary>
    /// <param name="entity">网关设备实体</param>
    /// <returns>网关设备 DTO</returns>
    private static GatewayDeviceDto MapToDto(GatewayDevice entity)
    {
        return new GatewayDeviceDto
        {
            Id = entity.Id,
            GatewayId = entity.GatewayId,
            DeviceId = entity.DeviceId,
            DeviceName = entity.DeviceName,
            Protocol = entity.Protocol,
            ConnectionConfig = entity.ConnectionConfig,
            DataPoints = entity.DataPoints,
            PollIntervalMs = entity.PollIntervalMs,
            Enabled = entity.Enabled,
            CreatedAt = entity.CreatedAt,
        };
    }

    /// <summary>
    /// 解析 DataPoints JSON 字符串为字典
    /// </summary>
    /// <param name="dataPointsJson">JSON 格式的数据点映射</param>
    /// <returns>指标名到点位地址的映射字典</returns>
    private Dictionary<string, string> ParseDataPoints(string dataPointsJson)
    {
        if (string.IsNullOrEmpty(dataPointsJson) || dataPointsJson == "{}")
            return new Dictionary<string, string>();

        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, string>>(dataPointsJson)
                   ?? new Dictionary<string, string>();
        }
        catch (Exception ex)
        {
            // DataPoints JSON 解析失败，返回空字典
            _logger.LogWarning(ex, "DataPoints JSON 解析失败，返回空字典");
            return new Dictionary<string, string>();
        }
    }
}
