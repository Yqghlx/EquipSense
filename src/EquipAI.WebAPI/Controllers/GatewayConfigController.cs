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

    /// <summary>
    /// 初始化网关配置管理控制器
    /// </summary>
    /// <param name="dbContext">数据库上下文</param>
    /// <param name="tenantContext">租户上下文</param>
    /// <param name="configuration">应用配置，用于读取 Gateway:AuthKey 等配置项</param>
    public GatewayConfigController(
        AppDbContext dbContext,
        ITenantContext tenantContext,
        IConfiguration configuration)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
        _configuration = configuration;
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

        // 获取默认网关 ID
        var defaultGatewayId = _configuration["Gateway:DefaultGatewayId"] ?? "gateway-001";

        var entity = new GatewayDevice
        {
            TenantId = _tenantContext.TenantId,
            GatewayId = defaultGatewayId,
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
    /// 测试设备连接 — 验证协议和连接参数是否可达
    /// 当前为模拟实现，Phase 2 接入真实协议后将调用对应适配器
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

        // Phase 1 模拟连接测试：解析配置格式并返回成功
        // Phase 2 将调用真实的协议适配器进行连接测试
        try
        {
            var configDoc = JsonDocument.Parse(request.ConnectionConfig);
            var hasRequiredField = protocol switch
            {
                "opcua" => configDoc.RootElement.TryGetProperty("endpointUrl", out _),
                "modbus-tcp" => configDoc.RootElement.TryGetProperty("host", out _),
                "modbus-rtu" => configDoc.RootElement.TryGetProperty("portName", out _),
                _ => false
            };

            if (!hasRequiredField)
            {
                var requiredField = protocol switch
                {
                    "opcua" => "endpointUrl",
                    "modbus-tcp" => "host",
                    "modbus-rtu" => "portName",
                    _ => "unknown"
                };

                return Ok(new TestConnectionResponse
                {
                    Success = false,
                    Message = $"连接配置缺少必填字段：{requiredField}"
                });
            }

            // 模拟连接成功（Phase 1 使用模拟服务器，始终返回成功）
            await Task.Delay(100); // 模拟网络延迟
            return Ok(new TestConnectionResponse
            {
                Success = true,
                Message = $"连接测试成功（{protocol} 模拟模式）"
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
    private static Dictionary<string, string> ParseDataPoints(string dataPointsJson)
    {
        if (string.IsNullOrEmpty(dataPointsJson) || dataPointsJson == "{}")
            return new Dictionary<string, string>();

        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, string>>(dataPointsJson)
                   ?? new Dictionary<string, string>();
        }
        catch
        {
            return new Dictionary<string, string>();
        }
    }
}
