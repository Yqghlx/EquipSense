using EquipAI.Application.Analysis;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 设备对比分析控制器（Phase 5 新增）
/// </summary>
[ApiController]
[Route("api/v1/device-comparison")]
[Authorize]
public class DeviceComparisonController : ControllerBase
{
    private const string DeviceIdsBindingErrorItemKey = "__deviceComparisonDeviceIdsBindingError";

    private readonly DeviceComparisonService _comparisonService;
    private readonly ITenantContext _tenantContext;

    public DeviceComparisonController(DeviceComparisonService comparisonService, ITenantContext tenantContext)
    {
        _comparisonService = comparisonService;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 对比指定设备类型的多个设备指标
    /// </summary>
    [HttpGet]
    [RequirePermission("device:read")]
    [ProducesResponseType(typeof(DeviceComparisonResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<DeviceComparisonResult>> Compare(
        [FromQuery] string deviceType,
        [FromQuery] string metric,
        [FromQuery] int hours = 24,
        [FromQuery]
        [ModelBinder(BinderType = typeof(DeviceIdsModelBinder))]
        Guid[]? deviceIds = null,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(deviceType) || string.IsNullOrWhiteSpace(metric))
            return BadRequest(new { code = 400, message = "deviceType 和 metric 不能为空" });
        if (deviceType.Length > 50 || metric.Length > 100)
            return BadRequest(new { code = 400, message = "deviceType 长度不能超过 50，metric 长度不能超过 100" });
        if (hours is < 1 or > DeviceComparisonService.MaxComparisonHours)
            return BadRequest(new
            {
                code = 400,
                message = $"hours 必须在 1 到 {DeviceComparisonService.MaxComparisonHours} 之间"
            });

        if (HttpContext.Items.TryGetValue(DeviceIdsBindingErrorItemKey, out var bindingError)
            && bindingError is DeviceIdsBindingError.InvalidGuid)
        {
            return BadRequest(new
            {
                code = 400,
                message = "deviceIds 必须是有效 GUID，且去重后数量必须在 2 到 5 之间"
            });
        }

        Guid[]? normalizedDeviceIds = null;
        if (deviceIds != null)
        {
            if (deviceIds.Length == 0)
            {
                return BadRequest(new { code = 400, message = "deviceIds 去重后数量必须在 2 到 5 之间" });
            }

            if (deviceIds.Any(id => id == Guid.Empty))
            {
                return BadRequest(new
                {
                    code = 400,
                    message = "deviceIds 不能包含空 GUID，且去重后数量必须在 2 到 5 之间"
                });
            }

            normalizedDeviceIds = deviceIds.Distinct().ToArray();
            if (normalizedDeviceIds.Length is < 2 or > 5)
            {
                return BadRequest(new { code = 400, message = "deviceIds 去重后数量必须在 2 到 5 之间" });
            }
        }

        var result = await _comparisonService.CompareAsync(
            _tenantContext.TenantId, deviceType.Trim(), metric.Trim(), hours, normalizedDeviceIds, ct);
        return Ok(result);
    }

    private enum DeviceIdsBindingError
    {
        InvalidGuid,
    }

    /// <summary>
    /// 绑定重复 deviceIds 查询参数，并将非法值转换为不回显原始输入的受控错误标记。
    /// </summary>
    public sealed class DeviceIdsModelBinder : IModelBinder
    {
        public Task BindModelAsync(ModelBindingContext bindingContext)
        {
            var valueProviderResult = bindingContext.ValueProvider.GetValue(bindingContext.ModelName);
            if (valueProviderResult == ValueProviderResult.None)
            {
                bindingContext.Result = ModelBindingResult.Success(null);
                return Task.CompletedTask;
            }

            var rawValues = valueProviderResult.Values;
            if (rawValues.Count == 0 || rawValues.All(string.IsNullOrWhiteSpace))
            {
                bindingContext.Result = ModelBindingResult.Success(Array.Empty<Guid>());
                return Task.CompletedTask;
            }

            var parsedDeviceIds = new Guid[rawValues.Count];
            for (var index = 0; index < rawValues.Count; index++)
            {
                if (Guid.TryParse(rawValues[index], out var deviceId))
                {
                    parsedDeviceIds[index] = deviceId;
                    continue;
                }

                bindingContext.HttpContext.Items[DeviceIdsBindingErrorItemKey] = DeviceIdsBindingError.InvalidGuid;
                bindingContext.Result = ModelBindingResult.Success(null);
                return Task.CompletedTask;
            }

            bindingContext.Result = ModelBindingResult.Success(parsedDeviceIds);
            return Task.CompletedTask;
        }
    }
}
