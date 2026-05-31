using EquipAI.Application.DTOs.Common;
using EquipAI.Application.DTOs.Devices;

namespace EquipAI.Application.Interfaces;

/// <summary>
/// 设备管理服务接口，提供设备 CRUD 和筛选查询能力
/// 所有操作均在指定租户范围内进行
/// </summary>
public interface IDeviceService
{
    /// <summary>
    /// 分页查询设备列表，支持按状态和类型筛选
    /// </summary>
    /// <param name="query">分页查询参数</param>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="status">可选：按设备状态筛选</param>
    /// <param name="type">可选：按设备类型筛选</param>
    /// <returns>分页设备结果</returns>
    Task<PagedResult<DeviceDto>> GetDevicesAsync(PagedQuery query, Guid tenantId, string? status = null, string? type = null);

    /// <summary>
    /// 根据 ID 获取设备详情
    /// </summary>
    /// <param name="deviceId">设备 ID</param>
    /// <param name="tenantId">租户 ID</param>
    /// <returns>设备信息</returns>
    Task<DeviceDto?> GetDeviceByIdAsync(Guid deviceId, Guid tenantId);

    /// <summary>
    /// 创建新设备
    /// </summary>
    /// <param name="request">创建设备请求</param>
    /// <param name="tenantId">所属租户 ID</param>
    /// <returns>创建后的设备信息</returns>
    Task<DeviceDto> CreateDeviceAsync(CreateDeviceRequest request, Guid tenantId);

    /// <summary>
    /// 更新设备信息
    /// </summary>
    /// <param name="deviceId">设备 ID</param>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="request">更新设备请求</param>
    /// <returns>更新后的设备信息</returns>
    Task<DeviceDto> UpdateDeviceAsync(Guid deviceId, Guid tenantId, UpdateDeviceRequest request);

    /// <summary>
    /// 删除设备
    /// </summary>
    /// <param name="deviceId">设备 ID</param>
    /// <param name="tenantId">租户 ID</param>
    Task DeleteDeviceAsync(Guid deviceId, Guid tenantId);
}
