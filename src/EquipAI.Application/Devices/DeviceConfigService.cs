using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.Application.Devices;

/// <summary>
/// 设备配置向导服务。
/// 封装模板查询和快速注册设备（含默认告警规则），使 Controller 不直接依赖 <c>AppDbContext</c>。
/// </summary>
/// <remarks>
/// 租户身份以 <c>ITenantContext</c>（JWT 权威）为准，禁止信任请求体里的 TenantId——
/// 历史缺陷曾用 request.TenantId 导致跨租户注入。
/// </remarks>
public class DeviceConfigService
{
    private readonly AppDbContext _dbContext;
    private readonly ITenantContext _tenantContext;

    public DeviceConfigService(AppDbContext dbContext, ITenantContext tenantContext)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 获取设备类型模板列表，支持按行业筛选。
    /// </summary>
    public async Task<List<object>> ListTemplatesAsync(string? industry = null, CancellationToken ct = default)
    {
        var query = _dbContext.DeviceTypeTemplates.AsQueryable();
        if (!string.IsNullOrEmpty(industry))
            query = query.Where(t => t.Industry == industry);

        return await query
            .Select(t => (object)new { t.Id, t.Name, t.Industry, t.Parameters, t.DefaultAlarmRules })
            .ToListAsync(ct);
    }

    /// <summary>
    /// 快速注册设备（向导模式），同时可创建默认告警规则。
    /// </summary>
    /// <returns>(DeviceId, DeviceCode, Name, Type, DuplicateCode) —— DuplicateCode=true 表示编码已存在。</returns>
    public async Task<(Guid DeviceId, string DeviceCode, string Name, string Type, bool DuplicateCode)> QuickRegisterAsync(
        QuickRegisterRequest request, CancellationToken ct = default)
    {
        // 租户身份以 JWT 为权威：设备及告警规则必须归属当前登录租户，禁止信任请求体里的 TenantId。
        var tenantId = _tenantContext.TenantId;

        // 检查设备编码是否重复（全局过滤器已自动限制当前租户范围）
        var exists = await _dbContext.Devices
            .AnyAsync(d => d.DeviceCode == request.DeviceCode, ct);
        if (exists)
            return (Guid.Empty, request.DeviceCode, "", "", true);

        var device = new Device
        {
            TenantId = tenantId,
            DeviceCode = request.DeviceCode,
            Name = request.Name ?? request.DeviceCode,
            Type = request.DeviceType ?? "通用设备",
            Status = DeviceStatus.Offline,
            HealthScore = 100m
        };
        _dbContext.Devices.Add(device);

        // 如果请求中包含默认告警规则，一并创建（同样归属当前租户）
        if (request.DefaultAlertRules is { Count: > 0 })
        {
            foreach (var rule in request.DefaultAlertRules)
            {
                _dbContext.AlertRules.Add(new AlertRule
                {
                    TenantId = tenantId,
                    DeviceId = device.Id,
                    Name = $"{device.Name} - {rule.Metric} 告警",
                    Metric = rule.Metric,
                    RuleType = RuleType.Threshold,
                    Operator = ">",
                    Threshold = rule.Threshold,
                    Severity = rule.Severity ?? AlertSeverity.High,
                    Enabled = true,
                    AutoCreateWorkorder = true
                });
            }
        }

        // 维护租户 CurrentDeviceCount（与 DeviceService.CreateDeviceAsync 一致）。
        var tenant = await _dbContext.UnfilteredSet<Tenant>()
            .FirstOrDefaultAsync(t => t.Id == tenantId, ct);
        if (tenant != null)
        {
            tenant.CurrentDeviceCount++;
        }

        await _dbContext.SaveChangesAsync(ct);
        return (device.Id, device.DeviceCode, device.Name, device.Type, false);
    }
}

/// <summary>
/// 快速注册设备请求。
/// </summary>
public record QuickRegisterRequest
{
    /// <summary>所属租户 ID（已忽略——以 JWT 为权威）</summary>
    public Guid TenantId { get; init; }

    /// <summary>设备编码（租户内唯一）</summary>
    public string DeviceCode { get; init; } = string.Empty;

    /// <summary>设备名称（可选，默认使用设备编码）</summary>
    public string? Name { get; init; }

    /// <summary>设备类型（可选，默认"通用设备"）</summary>
    public string? DeviceType { get; init; }

    /// <summary>默认告警规则列表（可选）</summary>
    public List<DefaultAlertRuleRequest>? DefaultAlertRules { get; init; }
}

/// <summary>
/// 默认告警规则请求。
/// </summary>
public record DefaultAlertRuleRequest
{
    /// <summary>监控指标名称（如 temperature、vibration）</summary>
    public string Metric { get; init; } = string.Empty;

    /// <summary>告警阈值</summary>
    public decimal Threshold { get; init; }

    /// <summary>告警严重级别（可选，默认 High）</summary>
    public AlertSeverity? Severity { get; init; }
}
