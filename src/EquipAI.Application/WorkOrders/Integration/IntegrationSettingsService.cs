using System.Diagnostics;
using System.Text.Json;
using EquipAI.Application.WorkOrders.DTOs;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders.Integration;

/// <summary>
/// 集成配置管理服务。
/// 管理租户级外部系统集成（Webhook/钉钉/飞书/EAM），配置存储在 <c>Tenant.Settings</c> JSONB 字段。
/// 使 Controller 不直接依赖 <c>AppDbContext</c>。
/// </summary>
public class IntegrationSettingsService
{
    /// <summary>支持的集成类型列表。</summary>
    public static readonly HashSet<string> SupportedTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "dingtalk", "feishu", "webhook", "eam"
    };

    private readonly AppDbContext _dbContext;
    private readonly ITenantContext _tenantContext;
    private readonly IEnumerable<IWorkOrderIntegration> _integrations;
    private readonly ILogger<IntegrationSettingsService> _logger;

    public IntegrationSettingsService(
        AppDbContext dbContext,
        ITenantContext tenantContext,
        IEnumerable<IWorkOrderIntegration> integrations,
        ILogger<IntegrationSettingsService> logger)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
        _integrations = integrations;
        _logger = logger;
    }

    /// <summary>
    /// 获取当前租户的所有集成配置。TenantFound=false 表示租户不存在。
    /// </summary>
    public async Task<(Dictionary<string, object>? Settings, bool TenantFound)> GetAllAsync(CancellationToken ct = default)
    {
        var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == _tenantContext.TenantId, ct);
        if (tenant == null)
            return (null, false);

        return (ParseIntegrationSettings(tenant.Settings), true);
    }

    /// <summary>
    /// 更新指定集成类型的配置（扁平合并）。
    /// 返回 (Updated, Error) —— Error 非 null 时为业务错误（类型不支持/租户不存在/JSON 格式错误）。
    /// </summary>
    public async Task<(bool Updated, string? Error)> UpdateAsync(string type, UpdateIntegrationRequest request, CancellationToken ct = default)
    {
        if (!SupportedTypes.Contains(type))
            return (false, $"不支持的集成类型: {type}，支持: {string.Join(", ", SupportedTypes)}");

        var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == _tenantContext.TenantId, ct);
        if (tenant == null)
            return (false, "租户不存在");

        // 解析现有 Settings JSON
        var settingsDoc = string.IsNullOrEmpty(tenant.Settings) || tenant.Settings == "{}"
            ? new Dictionary<string, object>()
            : JsonSerializer.Deserialize<Dictionary<string, object>>(tenant.Settings) ?? new();

        // 提取或初始化 integrations 节点
        Dictionary<string, object> integrations;
        if (settingsDoc.TryGetValue("integrations", out var integrationsObj)
            && integrationsObj is JsonElement { ValueKind: JsonValueKind.Object } je)
        {
            integrations = je.Deserialize<Dictionary<string, object>>() ?? new();
        }
        else
        {
            integrations = new Dictionary<string, object>();
        }

        // 合并配置：保留 enabled 字段，更新其他字段（扁平结构）
        var existingConfig = new Dictionary<string, object>();
        if (integrations.TryGetValue(type, out var existing) && existing is JsonElement { ValueKind: JsonValueKind.Object } existingJe)
        {
            foreach (var prop in existingJe.EnumerateObject())
            {
                existingConfig[prop.Name] = JsonSerializer.Deserialize<object>(prop.Value.GetRawText())!;
            }
        }

        existingConfig["enabled"] = request.Enabled;

        if (!string.IsNullOrEmpty(request.Config))
        {
            try
            {
                var newConfig = JsonSerializer.Deserialize<Dictionary<string, object>>(request.Config);
                if (newConfig != null)
                {
                    foreach (var kv in newConfig)
                        existingConfig[kv.Key] = kv.Value;
                }
            }
            catch (JsonException ex)
            {
                return (false, $"配置 JSON 格式错误: {ex.Message}");
            }
        }

        integrations[type] = existingConfig;
        settingsDoc["integrations"] = integrations;

        tenant.Settings = JsonSerializer.Serialize(settingsDoc);
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("集成配置已更新: Type={Type}, Enabled={Enabled}, TenantId={TenantId}",
            type, request.Enabled, _tenantContext.TenantId);

        return (true, null);
    }

    /// <summary>
    /// 测试指定集成类型的连接（发送一条测试消息）。
    /// 返回 (Result, NotFound) —— NotFound=true 时表示租户不存在（Result 为 null）。
    /// </summary>
    public async Task<(IntegrationTestResult? Result, bool NotFound)> TestAsync(string type, CancellationToken ct = default)
    {
        if (!SupportedTypes.Contains(type))
        {
            return (new IntegrationTestResult
            {
                Type = type,
                Success = false,
                Message = $"不支持的集成类型: {type}"
            }, false);
        }

        var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == _tenantContext.TenantId, ct);
        if (tenant == null)
            return (null, true);

        var integrationConfig = GetIntegrationConfig(tenant.Settings, type);
        if (integrationConfig == null)
        {
            return (new IntegrationTestResult
            {
                Type = type,
                Success = false,
                Message = "未找到该集成的配置，请先保存配置"
            }, false);
        }

        var integration = _integrations.FirstOrDefault(i => i.IntegrationType == type);
        if (integration == null)
        {
            return (new IntegrationTestResult
            {
                Type = type,
                Success = false,
                Message = "未注册的集成类型"
            }, false);
        }

        var sw = Stopwatch.StartNew();
        try
        {
            var testWorkOrderId = Guid.NewGuid();
            var result = await integration.PushCreatedAsync(
                _tenantContext.TenantId, testWorkOrderId,
                "[测试] 集成连接测试", "Low", integrationConfig);
            sw.Stop();

            return (new IntegrationTestResult
            {
                Type = type,
                Success = true,
                Message = "连接测试成功",
                DurationMs = sw.ElapsedMilliseconds,
                Details = result
            }, false);
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogWarning(ex, "集成连接测试失败: Type={Type}", type);

            return (new IntegrationTestResult
            {
                Type = type,
                Success = false,
                Message = $"连接测试失败: {ex.Message}",
                DurationMs = sw.ElapsedMilliseconds
            }, false);
        }
    }

    /// <summary>
    /// 解析租户 Settings 中的 integrations 节点。
    /// </summary>
    private Dictionary<string, object>? ParseIntegrationSettings(string? settings)
    {
        if (string.IsNullOrEmpty(settings) || settings == "{}")
            return new Dictionary<string, object>();

        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, object>>(settings);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "集成配置 JSON 解析失败，返回空字典");
            return new Dictionary<string, object>();
        }
    }

    /// <summary>
    /// 获取指定集成类型的配置 JSON 字符串。
    /// </summary>
    private static string? GetIntegrationConfig(string? settings, string type)
    {
        if (string.IsNullOrEmpty(settings)) return null;

        try
        {
            var json = JsonDocument.Parse(settings);
            if (json.RootElement.TryGetProperty("integrations", out var integrations)
                && integrations.TryGetProperty(type, out var config))
            {
                return config.GetRawText();
            }
        }
        catch { /* 忽略解析错误 */ }

        return null;
    }
}

/// <summary>
/// 更新集成配置请求。
/// </summary>
public class UpdateIntegrationRequest
{
    /// <summary>是否启用该集成</summary>
    public bool Enabled { get; set; }

    /// <summary>集成配置 JSON（各集成的具体参数，如 URL、密钥等）</summary>
    public string Config { get; set; } = "{}";
}
