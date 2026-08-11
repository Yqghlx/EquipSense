using System.Security.Cryptography;
using System.Text;
using EquipAI.Application.Services;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 网关管理控制器，提供网关注册/心跳、列表查询和状态代理接口
/// </summary>
[ApiController]
[Route("api/v1/gateways")]
public class GatewaysController : ControllerBase
{
    private readonly GatewayManagementService _service;
    private readonly GatewayEndpointPolicy _endpointPolicy;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GatewaysController> _logger;

    public GatewaysController(
        GatewayManagementService service,
        GatewayEndpointPolicy endpointPolicy,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<GatewaysController> logger)
    {
        _service = service;
        _endpointPolicy = endpointPolicy;
        _httpClientFactory = httpClientFactory;
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
    public async Task<ActionResult<GatewayDto>> Register([FromBody] RegisterGatewayRequest request, CancellationToken ct = default)
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

        if (!_endpointPolicy.IsGatewayIdentityAllowed(request.TenantId, request.GatewayId, out var identityReason))
        {
            _logger.LogWarning("拒绝未绑定的网关身份：GatewayId={GatewayId}, TenantId={TenantId}, Reason={Reason}",
                request.GatewayId, request.TenantId, identityReason);
            return Unauthorized(new { code = 401, message = "网关身份未通过服务端绑定校验" });
        }

        var host = string.IsNullOrWhiteSpace(request.Host) ? "edgegateway" : request.Host;
        if (!_endpointPolicy.IsAllowed(host, request.HealthPort ?? 8081, out var endpointReason))
            return BadRequest(new { code = 400, message = $"网关地址不在允许范围内：{endpointReason}" });

        var dto = await _service.RegisterOrUpdateAsync(request, ct);
        return Ok(dto);
    }

    /// <summary>
    /// 获取当前租户的网关列表
    /// </summary>
    [HttpGet]
    [Authorize]
    [RequirePermission("device:read")]
    [ProducesResponseType(typeof(List<GatewayDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<GatewayDto>>> List(CancellationToken ct = default)
        => Ok(await _service.ListAsync(ct));

    /// <summary>
    /// 代理指定网关的实时状态 — 从数据库读取网关地址后代理到网关 /status 端点
    /// </summary>
    [HttpGet("{gatewayId}/status")]
    [Authorize]
    [RequirePermission("device:read")]
    public async Task<ActionResult> GetStatus(string gatewayId, CancellationToken ct = default)
    {
        var gateway = await _service.GetEntityAsync(gatewayId, ct);
        if (gateway == null)
            return NotFound(new { code = 404, message = "网关不存在" });

        if (!gateway.Enabled)
            return Ok(new { status = "disabled", message = "网关已被禁用" });

        if (!await _endpointPolicy.IsResolvedEndpointAllowedAsync(gateway.Host, gateway.HealthPort, ct))
        {
            _logger.LogWarning("拒绝代理到未授权或危险网关地址：{GatewayId} {Host}:{Port}",
                gateway.GatewayId, gateway.Host, gateway.HealthPort);
            return Ok(new { status = "unreachable", message = "网关地址未通过安全策略校验" });
        }

        try
        {
            var httpClient = _httpClientFactory.CreateClient("GatewayProxy");
            using var request = new HttpRequestMessage(
                HttpMethod.Get,
                $"http://{gateway.Host}:{gateway.HealthPort}/status");
            _endpointPolicy.AddGatewayAuthHeader(request);
            using var response = await httpClient.SendAsync(request, ct);

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
}
