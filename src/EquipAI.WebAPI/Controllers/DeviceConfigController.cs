using EquipAI.Application.Devices;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 设备配置向导控制器，提供模板查询和快速注册设备接口
/// </summary>
[ApiController]
[Route("api/v1/device-config")]
[Authorize]
public class DeviceConfigController : ControllerBase
{
    private readonly DeviceConfigService _service;

    public DeviceConfigController(DeviceConfigService service)
    {
        _service = service;
    }

    /// <summary>
    /// 获取设备类型模板列表，支持按行业筛选
    /// </summary>
    /// <param name="industry">可选：按行业筛选（如 制造业、化工、电力）</param>
    /// <returns>模板列表</returns>
    [HttpGet("templates")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> GetTemplates([FromQuery] string? industry, CancellationToken ct = default)
        => Ok(await _service.ListTemplatesAsync(industry, ct));

    /// <summary>
    /// 快速注册设备（向导模式），同时可创建默认告警规则
    /// </summary>
    /// <param name="request">快速注册请求</param>
    /// <returns>创建后的设备信息</returns>
    [RequirePermission("device:create")]
    [HttpPost("quick-register")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult> QuickRegister([FromBody] QuickRegisterRequest request, CancellationToken ct = default)
    {
        try
        {
            var (deviceId, deviceCode, name, type, duplicate) = await _service.QuickRegisterAsync(request, ct);
            if (duplicate)
                return Conflict(new { code = "DUPLICATE_CODE", message = $"设备编码 {deviceCode} 已存在", details = (object?)null });

            return CreatedAtAction(nameof(GetTemplates), new { id = deviceId },
                new { Id = deviceId, DeviceCode = deviceCode, Name = name, Type = type });
        }
        catch (DeviceTemplateRulesException exception)
        {
            return UnprocessableEntity(new
            {
                code = exception.Code,
                message = exception.Message,
                details = (object?)null
            });
        }
        catch (DeviceConfigException exception)
        {
            return exception.Code switch
            {
                "TEMPLATE_NOT_FOUND" => NotFound(new
                {
                    code = exception.Code,
                    message = exception.Message,
                    details = (object?)null
                }),
                "DUPLICATE_CODE" => Conflict(new
                {
                    code = exception.Code,
                    message = exception.Message,
                    details = (object?)null
                }),
                "QUOTA_EXCEEDED" => StatusCode(StatusCodes.Status403Forbidden, new
                {
                    code = exception.Code,
                    message = exception.Message,
                    details = (object?)null
                }),
                _ => BadRequest(new
                {
                    code = exception.Code,
                    message = exception.Message,
                    details = (object?)null
                })
            };
        }
    }
}
