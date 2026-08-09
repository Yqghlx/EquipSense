using EquipAI.Application.WorkOrders.DTOs;
using EquipAI.Application.WorkOrders.Integration;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
/// GET 响应中的凭证字段只返回“已配置/未配置”状态，URL 只返回协议、主机和端口摘要；原始值不会离开服务端。
/// </summary>
[ApiController]
[Route("api/v1/settings/integrations")]
[Authorize]
public class IntegrationController : ControllerBase
{
    private readonly IntegrationSettingsService _service;

    public IntegrationController(IntegrationSettingsService service)
    {
        _service = service;
    }

    /// <summary>
    /// 获取当前租户的集成配置摘要（凭证和 URL 已脱敏）
    /// GET /api/v1/settings/integrations
    /// </summary>
    [RequirePermission("tenant:read")]
    [HttpGet]
    public async Task<ActionResult> GetIntegrations(CancellationToken ct = default)
    {
        var (settings, found) = await _service.GetAllAsync(ct);
        if (!found)
            return NotFound(new { code = 404, message = "租户不存在" });
        return Ok(settings);
    }

    /// <summary>
    /// 更新指定集成类型的配置
    /// PUT /api/v1/settings/integrations/{type}
    /// 使用扁平结构：将 config 字段合并到集成节点顶层，保留 enabled 字段
    /// </summary>
    [RequirePermission("tenant:update")]
    [HttpPut("{type}")]
    public async Task<ActionResult> UpdateIntegration(string type, [FromBody] UpdateIntegrationRequest request, CancellationToken ct = default)
    {
        var (updated, error) = await _service.UpdateAsync(type, request, ct);
        if (!updated)
        {
            return error == "租户不存在"
                ? NotFound(new { code = 404, message = error })
                : BadRequest(new { code = 400, message = error });
        }

        return Ok(new { type, enabled = request.Enabled });
    }

    /// <summary>
    /// 测试指定集成类型的连接
    /// POST /api/v1/settings/integrations/{type}/test
    /// 发送一条测试消息到外部系统，验证配置是否正确
    /// </summary>
    [RequirePermission("tenant:update")]
    [HttpPost("{type}/test")]
    public async Task<ActionResult<IntegrationTestResult>> TestIntegration(string type, CancellationToken ct = default)
    {
        var (result, notFound) = await _service.TestAsync(type, ct);
        if (notFound)
            return NotFound(new { code = 404, message = "租户不存在" });
        return Ok(result);
    }
}
