using System.Security.Cryptography;
using System.Text;
using EquipAI.Application.DTOs.Gateway;
using EquipAI.Application.Services;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 网关配置管理控制器，提供网关设备配置的 CRUD、测试连接和配置拉取接口
/// </summary>
[ApiController]
[Route("api/v1/gateway")]
public class GatewayConfigController : ControllerBase
{
    private readonly GatewayDeviceConfigService _service;
    private readonly GatewayEndpointPolicy _endpointPolicy;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GatewayConfigController> _logger;

    public GatewayConfigController(
        GatewayDeviceConfigService service,
        GatewayEndpointPolicy endpointPolicy,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<GatewayConfigController> logger)
    {
        _service = service;
        _endpointPolicy = endpointPolicy;
        _httpClientFactory = httpClientFactory;
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
    public async Task<ActionResult> GetGatewayStatus(CancellationToken ct = default)
    {
        // 从配置获取网关健康端点地址
        var gatewayHealthPort = _configuration["Gateway:HealthPort"] ?? "8081";
        var gatewayHost = _configuration["Gateway:Host"] ?? "edgegateway";

        if (!int.TryParse(gatewayHealthPort, out var parsedPort)
            || !await _endpointPolicy.IsResolvedEndpointAllowedAsync(gatewayHost, parsedPort, ct))
        {
            _logger.LogWarning("拒绝代理到未授权或危险网关地址：{Host}:{Port}", gatewayHost, gatewayHealthPort);
            return Ok(new
            {
                status = "unreachable",
                message = "网关地址未通过安全策略校验",
            });
        }

        try
        {
            var httpClient = _httpClientFactory.CreateClient("GatewayProxy");
            var response = await httpClient.GetAsync($"http://{gatewayHost}:{parsedPort}/status", ct);

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
    /// EdgeGateway 拉取配置 — 根据租户 + 网关标识获取该网关下所有启用的设备配置
    /// 使用 X-Gateway-Auth-Key 请求头认证，无需 JWT
    /// </summary>
    /// <param name="gatewayId">网关标识（对应 EdgeGateway 的 GatewayOptions.Id）</param>
    /// <param name="tenantId">网关所属租户 ID（与心跳/注册一致，由 EdgeGateway 配置提供）</param>
    /// <returns>该网关下的设备配置列表</returns>
    [HttpGet("config")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<GatewayDevicePullDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<GatewayDevicePullDto>>> PullConfig(
        [FromQuery] string gatewayId, [FromQuery] Guid? tenantId, CancellationToken ct = default)
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

        // 安全修复：必须按 (TenantId, GatewayId) 双重限定——GatewayId 仅租户内唯一，
        // 单按 gatewayId 过滤会跨租户泄漏工业敏感信息（OPC UA 连接串等）。tenantId 必填，缺失即拒绝。
        if (tenantId is null || tenantId == Guid.Empty)
            return BadRequest(new { code = 400, message = "tenantId 参数不能为空" });

        var result = await _service.PullConfigAsync(tenantId.Value, gatewayId, ct);
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
    public async Task<ActionResult<List<GatewayDeviceDto>>> GetDevices([FromQuery] string? gatewayId, CancellationToken ct = default)
        => Ok(await _service.ListAsync(gatewayId, ct));

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
    public async Task<ActionResult<GatewayDeviceDto>> CreateDevice([FromBody] CreateGatewayDeviceRequest request, CancellationToken ct = default)
    {
        // 参数校验
        if (string.IsNullOrWhiteSpace(request.DeviceName))
            return BadRequest(new { code = 400, message = "设备名称不能为空" });
        if (string.IsNullOrWhiteSpace(request.Protocol))
            return BadRequest(new { code = 400, message = "协议类型不能为空" });

        var defaultGatewayId = _configuration["Gateway:DefaultGatewayId"] ?? "gateway-001";
        var dto = await _service.CreateAsync(request, defaultGatewayId, ct);
        return CreatedAtAction(nameof(GetDevices), new { }, dto);
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
    public async Task<ActionResult<TestConnectionResponse>> TestConnection([FromBody] TestConnectionRequest request, CancellationToken ct = default)
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
        var onlineGateway = await _service.FindOnlineGatewayAsync(ct);
        if (onlineGateway != null)
        {
            var (result, proxied) = await _service.ProxyTestConnectionAsync(protocol, request.ConnectionConfig, onlineGateway, ct);
            if (proxied)
                return Ok(result);
        }

        // 回退：JSON 格式校验
        return Ok(await _service.ValidateConnectionConfigAsync(protocol, request.ConnectionConfig));
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
    public async Task<ActionResult<GatewayDeviceDto>> UpdateDevice(Guid id, [FromBody] UpdateGatewayDeviceRequest request, CancellationToken ct = default)
    {
        var dto = await _service.UpdateAsync(id, request, ct);
        if (dto is null)
            return NotFound(new { code = 404, message = "网关设备配置不存在" });
        return Ok(dto);
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
    public async Task<IActionResult> DeleteDevice(Guid id, CancellationToken ct = default)
    {
        var deleted = await _service.DeleteAsync(id, ct);
        if (!deleted)
            return NotFound(new { code = 404, message = "网关设备配置不存在" });
        return NoContent();
    }
}
