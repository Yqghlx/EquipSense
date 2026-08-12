using System.Diagnostics;
using System.Text.Json;
using EquipAI.Application.Services;
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
    private const string ConfiguredMarker = "[已配置]";
    private const string NotConfiguredMarker = "[未配置]";
    private const string RedactedEndpointSuffix = "/…";

    /// <summary>支持的集成类型列表。</summary>
    public static readonly HashSet<string> SupportedTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "dingtalk", "feishu", "webhook", "eam"
    };

    private readonly AppDbContext _dbContext;
    private readonly ITenantContext _tenantContext;
    private readonly IEnumerable<IWorkOrderIntegration> _integrations;
    private readonly OutboundEndpointPolicy _outboundEndpointPolicy;
    private readonly ILogger<IntegrationSettingsService> _logger;

    public IntegrationSettingsService(
        AppDbContext dbContext,
        ITenantContext tenantContext,
        IEnumerable<IWorkOrderIntegration> integrations,
        OutboundEndpointPolicy outboundEndpointPolicy,
        ILogger<IntegrationSettingsService> logger)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
        _integrations = integrations;
        _outboundEndpointPolicy = outboundEndpointPolicy;
        _logger = logger;
    }

    /// <summary>
    /// 获取当前租户的集成配置摘要。凭证和 URL 均已脱敏，TenantFound=false 表示租户不存在。
    /// </summary>
    public async Task<(Dictionary<string, object>? Settings, bool TenantFound)> GetAllAsync(CancellationToken ct = default)
    {
        var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == _tenantContext.TenantId, ct);
        if (tenant == null)
            return (null, false);

        return (BuildSafeIntegrationSettings(tenant.Settings), true);
    }

    /// <summary>
    /// 更新指定集成类型的配置（扁平合并）。空的凭证/端点字段以及脱敏占位符不会覆盖已有服务端值。
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
                    {
                        // GET 接口只返回脱敏摘要，前端再次保存时不能把摘要或空输入写回真实凭证/端点。
                        if (ShouldPreserveExistingValue(kv.Key, kv.Value))
                            continue;

                        existingConfig[kv.Key] = kv.Value;
                    }
                }
            }
            catch (JsonException ex)
            {
                return (false, $"配置 JSON 格式错误: {ex.Message}");
            }
        }

        integrations[type] = existingConfig;

        var endpointValidation = ValidateEndpointConfiguration(type, existingConfig);
        if (!endpointValidation.Allowed)
            return (false, endpointValidation.Reason);

        settingsDoc["integrations"] = integrations;

        tenant.Settings = JsonSerializer.Serialize(settingsDoc);
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("集成配置已更新: Type={Type}, Enabled={Enabled}, TenantId={TenantId}",
            type, request.Enabled, _tenantContext.TenantId);

        return (true, null);
    }

    /// <summary>
    /// 判断更新值是否只是脱敏占位符或空输入。对于已有的凭证和服务端端点，保留原值避免配置被误清空。
    /// </summary>
    private static bool ShouldPreserveExistingValue(
        string propertyName,
        object? newValue)
    {
        var isSensitive = IsSensitiveProperty(propertyName);
        var isEndpoint = IsEndpointProperty(propertyName);
        if (!isSensitive && !isEndpoint)
            return false;

        var text = newValue switch
        {
            JsonElement { ValueKind: JsonValueKind.String } element => element.GetString(),
            string value => value,
            _ => null,
        };

        if (string.IsNullOrWhiteSpace(text))
            return true;

        if (isSensitive && (text is ConfiguredMarker or NotConfiguredMarker))
            return true;

        if (isEndpoint && text.EndsWith(RedactedEndpointSuffix, StringComparison.Ordinal))
            return true;

        // 只有真实的新值才允许创建新的凭证/端点配置。
        return false;
    }

    /// <summary>
    /// 在保存配置前校验所有会被服务端主动请求的 URL。
    /// </summary>
    private (bool Allowed, string Reason) ValidateEndpointConfiguration(
        string type,
        IReadOnlyDictionary<string, object> configuration)
    {
        var urlProperty = type.ToLowerInvariant() switch
        {
            "webhook" => "url",
            "dingtalk" => "webhookUrl",
            "feishu" => "webhookUrl",
            "eam" => "endpoint",
            _ => null,
        };

        if (urlProperty is null
            || !configuration.TryGetValue(urlProperty, out var rawValue)
            || rawValue is null)
        {
            return (true, string.Empty);
        }

        var rawUrl = rawValue switch
        {
            JsonElement element when element.ValueKind == JsonValueKind.String => element.GetString(),
            string text => text,
            _ => null,
        };

        if (string.IsNullOrWhiteSpace(rawUrl))
            return (true, string.Empty);

        return _outboundEndpointPolicy.ValidateConfiguredUri(rawUrl);
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
            var succeeded = result is not null;

            return (new IntegrationTestResult
            {
                Type = type,
                Success = succeeded,
                Message = succeeded ? "连接测试成功" : "连接测试失败：外部系统未返回成功响应",
                DurationMs = sw.ElapsedMilliseconds,
                Details = result
            }, false);
        }
        catch (Exception ex)
        {
            // 请求方或宿主正在取消时必须继续传播取消信号，不能伪装成普通集成失败，
            // 否则停机期间会继续占用外部连接并让消息处理器误判为已完成。
            if (ct.IsCancellationRequested && ex is OperationCanceledException)
                throw;

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
    /// 构建可返回给管理端的集成配置摘要。
    ///
    /// 集成配置中通常包含机器人签名密钥、API Key、Basic Auth 密码以及 URL 中的访问令牌。
    /// 这些值只允许留在服务端用于发起集成请求，不能随着管理 API 返回到浏览器或日志链路。
    /// 同时只返回 integrations 节点，避免把 Tenant.Settings 中未来新增的其他敏感配置一并暴露。
    /// </summary>
    private Dictionary<string, object> BuildSafeIntegrationSettings(string? settings)
    {
        var safeIntegrations = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);

        if (!string.IsNullOrWhiteSpace(settings) && settings != "{}")
        {
            try
            {
                using var document = JsonDocument.Parse(settings);
                if (document.RootElement.ValueKind == JsonValueKind.Object
                    && document.RootElement.TryGetProperty("integrations", out var integrations)
                    && integrations.ValueKind == JsonValueKind.Object)
                {
                    foreach (var integration in integrations.EnumerateObject())
                    {
                        safeIntegrations[integration.Name] =
                            SanitizeJsonValue(integration.Value, null) ?? new Dictionary<string, object?>();
                    }
                }
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "集成配置 JSON 解析失败，返回空摘要");
            }
        }

        return new Dictionary<string, object>
        {
            ["integrations"] = safeIntegrations,
        };
    }

    /// <summary>
    /// 递归脱敏 JSON 值。属性名匹配凭证字段时只返回是否已配置；URL 只保留协议、主机和端口。
    /// </summary>
    private static object? SanitizeJsonValue(JsonElement value, string? propertyName)
    {
        if (IsSensitiveProperty(propertyName))
        {
            return HasConfiguredValue(value) ? ConfiguredMarker : NotConfiguredMarker;
        }

        if (IsEndpointProperty(propertyName))
        {
            return value.ValueKind == JsonValueKind.String
                ? RedactEndpoint(value.GetString())
                : ConfiguredMarker;
        }

        return value.ValueKind switch
        {
            JsonValueKind.Object => SanitizeObject(value),
            JsonValueKind.Array => value.EnumerateArray()
                .Select(item => SanitizeJsonValue(item, null))
                .ToList(),
            JsonValueKind.String => value.GetString(),
            JsonValueKind.Number => value.TryGetInt64(out var integer) ? integer : value.GetDouble(),
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.Null => null,
            _ => "[已隐藏]",
        };
    }

    /// <summary>
    /// 递归转换对象并允许重复 JSON 属性以后者覆盖，避免异常配置导致管理接口返回 500。
    /// </summary>
    private static Dictionary<string, object?> SanitizeObject(JsonElement value)
    {
        var result = new Dictionary<string, object?>(StringComparer.Ordinal);
        foreach (var property in value.EnumerateObject())
            result[property.Name] = SanitizeJsonValue(property.Value, property.Name);

        return result;
    }

    /// <summary>
    /// 判断属性名是否代表凭证。归一化后同时覆盖 camelCase、snake_case 和 HTTP Header 写法。
    /// </summary>
    private static bool IsSensitiveProperty(string? propertyName)
    {
        if (string.IsNullOrWhiteSpace(propertyName))
            return false;

        var normalized = new string(propertyName
            .Where(char.IsLetterOrDigit)
            .ToArray())
            .ToLowerInvariant();

        return normalized.Contains("secret", StringComparison.Ordinal)
            || normalized.Contains("password", StringComparison.Ordinal)
            || normalized.Contains("apikey", StringComparison.Ordinal)
            || normalized.Contains("accesskey", StringComparison.Ordinal)
            || normalized.Contains("token", StringComparison.Ordinal)
            || normalized.Contains("privatekey", StringComparison.Ordinal)
            || normalized.Contains("credential", StringComparison.Ordinal)
            || normalized.Contains("authorization", StringComparison.Ordinal);
    }

    /// <summary>
    /// 判断属性名是否可能包含访问令牌的 URL 或服务端请求端点。
    /// </summary>
    private static bool IsEndpointProperty(string? propertyName)
    {
        if (string.IsNullOrWhiteSpace(propertyName))
            return false;

        var normalized = new string(propertyName
            .Where(char.IsLetterOrDigit)
            .ToArray())
            .ToLowerInvariant();

        return normalized.EndsWith("url", StringComparison.Ordinal)
            || normalized.EndsWith("uri", StringComparison.Ordinal)
            || normalized.EndsWith("endpoint", StringComparison.Ordinal);
    }

    /// <summary>
    /// 将 URL 脱敏为 origin 摘要，避免泄露查询参数或路径中的机器人令牌。
    /// </summary>
    private static string RedactEndpoint(string? rawEndpoint)
    {
        if (string.IsNullOrWhiteSpace(rawEndpoint))
            return NotConfiguredMarker;

        if (!Uri.TryCreate(rawEndpoint, UriKind.Absolute, out var uri)
            || string.IsNullOrWhiteSpace(uri.Host))
        {
            return ConfiguredMarker;
        }

        var port = uri.IsDefaultPort ? string.Empty : $":{uri.Port}";
        return $"{uri.Scheme}://{uri.Host}{port}{RedactedEndpointSuffix}";
    }

    /// <summary>
    /// 判断凭证值是否实际存在，便于前端区分“已配置”和“未配置”。
    /// </summary>
    private static bool HasConfiguredValue(JsonElement value)
    {
        return value.ValueKind switch
        {
            JsonValueKind.String => !string.IsNullOrWhiteSpace(value.GetString()),
            JsonValueKind.Null or JsonValueKind.Undefined => false,
            _ => true,
        };
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
