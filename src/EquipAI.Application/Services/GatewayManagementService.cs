using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Services;

/// <summary>
/// 网关管理服务。
/// 封装网关注册/心跳、列表查询、实体获取，使 Controller 不直接依赖 <c>AppDbContext</c>。
/// 网关注册不走 JWT（使用 X-Gateway-Auth-Key 头认证），故查询用 <c>UnfilteredSet</c> 绕过租户过滤器，
/// 手动按 <c>(TenantId, GatewayId)</c> 双重限定。
/// </summary>
public class GatewayManagementService
{
    private readonly AppDbContext _dbContext;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<GatewayManagementService> _logger;

    public GatewayManagementService(
        AppDbContext dbContext,
        ITenantContext tenantContext,
        ILogger<GatewayManagementService> logger)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
        _logger = logger;
    }

    /// <summary>
    /// 网关注册或心跳刷新（首次注册插入，已存在则更新心跳）。
    /// 绕过租户过滤器按 (TenantId, GatewayId) 查找（网关认证不走 JWT）。
    /// </summary>
    public async Task<GatewayDto> RegisterOrUpdateAsync(RegisterGatewayRequest request, CancellationToken ct = default)
    {
        var existing = await _dbContext.UnfilteredSet<Gateway>()
            .FirstOrDefaultAsync(g => g.TenantId == request.TenantId && g.GatewayId == request.GatewayId, ct);

        if (existing == null)
        {
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
            await _dbContext.SaveChangesAsync(ct);
            _logger.LogInformation("网关注册成功：{GatewayId}（{Name}）", gateway.GatewayId, gateway.Name);
            return ToDto(gateway);
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

        await _dbContext.SaveChangesAsync(ct);
        return ToDto(existing);
    }

    /// <summary>
    /// 获取当前租户的网关列表（附带每个网关的设备数量）。
    /// </summary>
    public async Task<List<GatewayDto>> ListAsync(CancellationToken ct = default)
    {
        var gateways = await _dbContext.UnfilteredSet<Gateway>()
            .Where(g => g.TenantId == _tenantContext.TenantId)
            .OrderByDescending(g => g.LastHeartbeatAt)
            .ToListAsync(ct);

        var deviceCounts = await _dbContext.GatewayDevices
            .Where(d => d.TenantId == _tenantContext.TenantId)
            .GroupBy(d => d.GatewayId)
            .Select(g => new { GatewayId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.GatewayId, x => x.Count, ct);

        return gateways.Select(g =>
        {
            var dto = ToDto(g);
            dto.DeviceCount = deviceCounts.GetValueOrDefault(g.GatewayId, 0);
            return dto;
        }).ToList();
    }

    /// <summary>
    /// 获取当前租户下指定网关的实体（状态代理用）。返回 null 表示网关不存在。
    /// </summary>
    public async Task<Gateway?> GetEntityAsync(string gatewayId, CancellationToken ct = default)
        => await _dbContext.UnfilteredSet<Gateway>()
            .FirstOrDefaultAsync(g => g.TenantId == _tenantContext.TenantId && g.GatewayId == gatewayId, ct);

    /** 实体转 DTO */
    internal static GatewayDto ToDto(Gateway g) => new()
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

/// <summary>网关信息 DTO。</summary>
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

/// <summary>网关注册/心跳请求。</summary>
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
