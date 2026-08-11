using System.Net.Http.Json;
using System.Text.Json;
using EquipAI.Application.DTOs.Gateway;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Services;

/// <summary>
/// 网关设备配置管理服务。
/// 封装网关设备配置的 CRUD、配置拉取、在线网关查找与连接测试回退，
/// 使 Controller 不直接依赖 <c>AppDbContext</c>。
/// </summary>
/// <remarks>
/// <c>PullConfig</c> 绕过租户过滤器（走网关密钥认证，无 JWT/ITenantContext），
/// 显式按 <c>(tenantId, gatewayId)</c> 双重限定——GatewayId 仅租户内唯一，
/// 单按 gatewayId 过滤会导致跨租户泄漏工业敏感信息（OPC UA 连接串等）。
/// </remarks>
public class GatewayDeviceConfigService
{
    private readonly AppDbContext _dbContext;
    private readonly ITenantContext _tenantContext;
    private readonly GatewayEndpointPolicy _endpointPolicy;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<GatewayDeviceConfigService> _logger;

    public GatewayDeviceConfigService(
        AppDbContext dbContext,
        ITenantContext tenantContext,
        GatewayEndpointPolicy endpointPolicy,
        IHttpClientFactory httpClientFactory,
        ILogger<GatewayDeviceConfigService> logger)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
        _endpointPolicy = endpointPolicy;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    /// <summary>
    /// 拉取指定网关下启用的设备配置（网关密钥认证，绕过租户过滤器，按 tenantId+gatewayId 限定）。
    /// </summary>
    public async Task<List<GatewayDevicePullDto>> PullConfigAsync(Guid tenantId, string gatewayId, CancellationToken ct = default)
    {
        var devices = await _dbContext.UnfilteredSet<GatewayDevice>()
            .Where(d => d.TenantId == tenantId && d.GatewayId == gatewayId && d.Enabled)
            .OrderBy(d => d.DeviceName)
            .ToListAsync(ct);

        return devices.Select(d => new GatewayDevicePullDto
        {
            DeviceId = d.Id.ToString(),
            Protocol = d.Protocol,
            ConnectionString = d.ConnectionConfig,
            DataPoints = ParseDataPoints(d.DataPoints),
            PollIntervalMs = d.PollIntervalMs,
        }).ToList();
    }

    /// <summary>
    /// 获取当前租户的网关设备配置列表（可选按网关标识筛选）。
    /// </summary>
    public async Task<List<GatewayDeviceDto>> ListAsync(string? gatewayId = null, CancellationToken ct = default)
    {
        var query = _dbContext.GatewayDevices.AsQueryable();

        if (!string.IsNullOrWhiteSpace(gatewayId))
            query = query.Where(d => d.GatewayId == gatewayId);

        var devices = await query
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync(ct);

        return devices.Select(MapToDto).ToList();
    }

    /// <summary>
    /// 创建网关设备配置。
    /// </summary>
    public async Task<GatewayDeviceDto> CreateAsync(CreateGatewayDeviceRequest request, string defaultGatewayId, CancellationToken ct = default)
    {
        var gatewayId = !string.IsNullOrWhiteSpace(request.GatewayId)
            ? request.GatewayId
            : defaultGatewayId;

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
        await _dbContext.SaveChangesAsync(ct);

        return MapToDto(entity);
    }

    /// <summary>
    /// 查找当前租户最近心跳的在线网关（用于连接测试代理）。无在线网关返回 null。
    /// </summary>
    public async Task<Gateway?> FindOnlineGatewayAsync(CancellationToken ct = default)
        => await _dbContext.UnfilteredSet<Gateway>()
            .Where(g => g.TenantId == _tenantContext.TenantId && g.Status == "online" && g.Enabled)
            .OrderByDescending(g => g.LastHeartbeatAt)
            .FirstOrDefaultAsync(ct);

    /// <summary>
    /// 代理连接测试到在线边缘网关。返回 (Result, Proxied) —— Proxied=false 表示无在线网关或代理失败（需回退校验）。
    /// </summary>
    public async Task<(TestConnectionResponse Result, bool Proxied)> ProxyTestConnectionAsync(string protocol, string connectionConfig, Gateway gateway, CancellationToken ct = default)
    {
        try
        {
            if (!await _endpointPolicy.IsResolvedEndpointAllowedAsync(gateway.Host, gateway.HealthPort, ct))
            {
                _logger.LogWarning("拒绝代理到未授权或危险网关地址：{GatewayId} {Host}:{Port}",
                    gateway.GatewayId, gateway.Host, gateway.HealthPort);
                return (new TestConnectionResponse(), false);
            }

            var httpClient = _httpClientFactory.CreateClient("GatewayProxy");
            var payload = new { protocol, connectionString = connectionConfig };
            using var request = new HttpRequestMessage(
                HttpMethod.Post,
                $"http://{gateway.Host}:{gateway.HealthPort}/test-connection")
            {
                Content = JsonContent.Create(payload),
            };
            _endpointPolicy.AddGatewayAuthHeader(request);
            using var response = await httpClient.SendAsync(request, ct);

            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
                return (new TestConnectionResponse
                {
                    Success = result.TryGetProperty("success", out var successEl) && successEl.GetBoolean(),
                    Message = result.TryGetProperty("message", out var msgEl) ? msgEl.GetString() ?? "连接测试完成" : "连接测试完成"
                }, true);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "代理连接测试到网关 {GatewayId} 失败，回退到配置校验", gateway.GatewayId);
        }

        return (new TestConnectionResponse(), false);
    }

    /// <summary>
    /// 纯 JSON 格式校验回退（无在线网关或代理失败时使用）。
    /// </summary>
    public Task<TestConnectionResponse> ValidateConnectionConfigAsync(string protocol, string connectionConfig)
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

                return Task.FromResult(new TestConnectionResponse
                {
                    Success = false,
                    Message = $"连接配置缺少必填字段：{requiredField}"
                });
            }

            return Task.FromResult(new TestConnectionResponse
            {
                Success = true,
                Message = $"配置格式校验通过（{protocol}），无在线网关可执行真实连接测试"
            });
        }
        catch (JsonException)
        {
            return Task.FromResult(new TestConnectionResponse
            {
                Success = false,
                Message = "连接配置 JSON 格式无效"
            });
        }
    }

    /// <summary>
    /// 更新网关设备配置（仅非空字段更新）。返回 null 表示配置不存在。
    /// </summary>
    public async Task<GatewayDeviceDto?> UpdateAsync(Guid id, UpdateGatewayDeviceRequest request, CancellationToken ct = default)
    {
        var entity = await _dbContext.GatewayDevices.FindAsync(new object?[] { id }, ct);
        if (entity == null)
            return null;

        if (request.DeviceName is not null) entity.DeviceName = request.DeviceName;
        if (request.ConnectionConfig is not null) entity.ConnectionConfig = request.ConnectionConfig;
        if (request.DataPoints is not null) entity.DataPoints = request.DataPoints;
        if (request.PollIntervalMs.HasValue) entity.PollIntervalMs = request.PollIntervalMs.Value;
        if (request.Enabled.HasValue) entity.Enabled = request.Enabled.Value;

        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("网关设备 {DeviceId} 配置已更新", id);
        return MapToDto(entity);
    }

    /// <summary>
    /// 删除网关设备配置。返回 false 表示配置不存在。
    /// </summary>
    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _dbContext.GatewayDevices.FindAsync(new object?[] { id }, ct);
        if (entity == null)
            return false;

        _dbContext.GatewayDevices.Remove(entity);
        await _dbContext.SaveChangesAsync(ct);
        return true;
    }

    /// <summary>
    /// 将 GatewayDevice 实体映射为 GatewayDeviceDto。
    /// </summary>
    internal static GatewayDeviceDto MapToDto(GatewayDevice entity)
        => new()
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

    /// <summary>
    /// 解析 DataPoints JSON 字符串为字典。
    /// </summary>
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
            _logger.LogWarning(ex, "DataPoints JSON 解析失败，返回空字典");
            return new Dictionary<string, string>();
        }
    }
}
