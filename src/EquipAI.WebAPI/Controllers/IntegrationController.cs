using System.Diagnostics;
using System.Text.Json;
using EquipAI.Core.Interfaces;
using EquipAI.Application.WorkOrders.DTOs;
using EquipAI.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 集成配置管理 API
/// 管理租户级的外部系统集成（Webhook、钉钉、飞书、EAM），配置存储在 Tenant.Settings JSONB 字段中。
/// 配置 Schema（扁平结构）：
/// {
///   "integrations": {
///     "dingtalk": { "enabled": true, "webhookUrl": "...", "secret": "..." },
///     "feishu":   { "enabled": true, "appId": "...", "appSecret": "..." },
///     "webhook":  { "enabled": false, "url": "", "headers": {}, "bodyTemplate": "", "secret": "" },
///     "eam":      { "enabled": false, "type": "maximo", "endpoint": "", "apiKey": "" }
///   }
/// }
/// </summary>
[ApiController]
[Route("api/v1/settings/integrations")]
[Authorize]
public class IntegrationController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly ITenantContext _tenantContext;
    private readonly IEnumerable<IWorkOrderIntegration> _integrations;
    private readonly ILogger<IntegrationController> _logger;

    /// <summary>
    /// 支持的集成类型列表
    /// </summary>
    private static readonly HashSet<string> SupportedTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "dingtalk", "feishu", "webhook", "eam"
    };

    public IntegrationController(
        AppDbContext dbContext,
        ITenantContext tenantContext,
        IEnumerable<IWorkOrderIntegration> integrations,
        ILogger<IntegrationController> logger)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
        _integrations = integrations;
        _logger = logger;
    }

    /// <summary>
    /// 获取当前租户的所有集成配置
    /// GET /api/v1/settings/integrations
    /// </summary>
    [HttpGet]
    public async Task<ActionResult> GetIntegrations()
    {
        var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == _tenantContext.TenantId);
        if (tenant == null) return NotFound(new { code = 404, message = "租户不存在" });

        var result = ParseIntegrationSettings(tenant.Settings);
        return Ok(result);
    }

    /// <summary>
    /// 更新指定集成类型的配置
    /// PUT /api/v1/settings/integrations/{type}
    /// 使用扁平结构：将 config 字段合并到集成节点顶层，保留 enabled 字段
    /// </summary>
    [HttpPut("{type}")]
    public async Task<ActionResult> UpdateIntegration(string type, [FromBody] UpdateIntegrationRequest request)
    {
        if (!SupportedTypes.Contains(type))
        {
            return BadRequest(new { code = 400, message = $"不支持的集成类型: {type}，支持: {string.Join(", ", SupportedTypes)}" });
        }

        var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == _tenantContext.TenantId);
        if (tenant == null) return NotFound(new { code = 404, message = "租户不存在" });

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

        // 设置 enabled
        existingConfig["enabled"] = request.Enabled;

        // 合并新配置字段
        if (!string.IsNullOrEmpty(request.Config))
        {
            try
            {
                var newConfig = JsonSerializer.Deserialize<Dictionary<string, object>>(request.Config);
                if (newConfig != null)
                {
                    foreach (var kv in newConfig)
                    {
                        existingConfig[kv.Key] = kv.Value;
                    }
                }
            }
            catch (JsonException ex)
            {
                return BadRequest(new { code = 400, message = $"配置 JSON 格式错误: {ex.Message}" });
            }
        }

        integrations[type] = existingConfig;
        settingsDoc["integrations"] = integrations;

        // 写回租户 Settings 并保存
        tenant.Settings = JsonSerializer.Serialize(settingsDoc);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("集成配置已更新: Type={Type}, Enabled={Enabled}, TenantId={TenantId}",
            type, request.Enabled, _tenantContext.TenantId);

        return Ok(new { type, enabled = request.Enabled });
    }

    /// <summary>
    /// 测试指定集成类型的连接
    /// POST /api/v1/settings/integrations/{type}/test
    /// 发送一条测试消息到外部系统，验证配置是否正确
    /// </summary>
    [HttpPost("{type}/test")]
    public async Task<ActionResult<IntegrationTestResult>> TestIntegration(string type)
    {
        if (!SupportedTypes.Contains(type))
        {
            return BadRequest(new IntegrationTestResult
            {
                Type = type,
                Success = false,
                Message = $"不支持的集成类型: {type}"
            });
        }

        var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == _tenantContext.TenantId);
        if (tenant == null) return NotFound(new { code = 404, message = "租户不存在" });

        // 读取该集成的配置
        var integrationConfig = GetIntegrationConfig(tenant.Settings, type);
        if (integrationConfig == null)
        {
            return Ok(new IntegrationTestResult
            {
                Type = type,
                Success = false,
                Message = "未找到该集成的配置，请先保存配置"
            });
        }

        // 查找对应的集成实现
        var integration = _integrations.FirstOrDefault(i => i.IntegrationType == type);
        if (integration == null)
        {
            return Ok(new IntegrationTestResult
            {
                Type = type,
                Success = false,
                Message = "未注册的集成类型"
            });
        }

        // 发送测试推送
        var sw = Stopwatch.StartNew();
        try
        {
            var testWorkOrderId = Guid.NewGuid();
            var result = await integration.PushCreatedAsync(
                _tenantContext.TenantId, testWorkOrderId,
                "[测试] 集成连接测试", "Low", integrationConfig);
            sw.Stop();

            return Ok(new IntegrationTestResult
            {
                Type = type,
                Success = true,
                Message = "连接测试成功",
                DurationMs = sw.ElapsedMilliseconds,
                Details = result
            });
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogWarning(ex, "集成连接测试失败: Type={Type}", type);

            return Ok(new IntegrationTestResult
            {
                Type = type,
                Success = false,
                Message = $"连接测试失败: {ex.Message}",
                DurationMs = sw.ElapsedMilliseconds
            });
        }
    }

    /// <summary>
    /// 解析租户 Settings 中的 integrations 节点
    /// </summary>
    private static Dictionary<string, object>? ParseIntegrationSettings(string? settings)
    {
        if (string.IsNullOrEmpty(settings) || settings == "{}")
            return new Dictionary<string, object>();

        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, object>>(settings);
        }
        catch
        {
            return new Dictionary<string, object>();
        }
    }

    /// <summary>
    /// 获取指定集成类型的配置 JSON 字符串
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
/// 更新集成配置请求
/// </summary>
public class UpdateIntegrationRequest
{
    /// <summary>
    /// 是否启用该集成
    /// </summary>
    public bool Enabled { get; set; }

    /// <summary>
    /// 集成配置 JSON（各集成的具体参数，如 URL、密钥等）
    /// </summary>
    public string Config { get; set; } = "{}";
}
