using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 集成配置管理 API
/// 管理租户级的外部系统集成（Webhook、钉钉等），配置存储在 Tenant.Settings JSONB 字段中
/// </summary>
[ApiController]
[Route("api/v1/integrations")]
[Authorize]
public class IntegrationController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly ITenantContext _tenantContext;

    public IntegrationController(AppDbContext dbContext, ITenantContext tenantContext)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 获取当前租户的所有集成配置
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
    /// </summary>
    /// <param name="type">集成类型（如 "webhook"、"dingtalk"）</param>
    /// <param name="request">更新请求</param>
    [HttpPut("{type}")]
    public async Task<ActionResult> UpdateIntegration(string type, [FromBody] UpdateIntegrationRequest request)
    {
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
        integrations[type] = new { enabled = request.Enabled, config = request.Config };
        settingsDoc["integrations"] = integrations;

        // 写回租户 Settings 并保存
        tenant.Settings = JsonSerializer.Serialize(settingsDoc);
        await _dbContext.SaveChangesAsync();

        return Ok(new { type, request.Enabled });
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
    /// 集成配置 JSON（如 Webhook URL、钉钉 Token 等参数）
    /// </summary>
    public string Config { get; set; } = "{}";
}
