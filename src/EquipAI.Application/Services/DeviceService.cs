using AutoMapper;
using EquipAI.Application.DTOs.Common;
using EquipAI.Core.Models;
using EquipAI.Application.DTOs.Devices;
using EquipAI.Application.Interfaces;
using EquipAI.Core.Enums;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Services;

/// <summary>
/// 设备管理服务实现，提供设备 CRUD 和筛选查询能力
/// 所有操作均在指定租户范围内进行（依赖 AppDbContext 全局租户过滤器）
/// </summary>
public class DeviceService : IDeviceService
{
    private readonly AppDbContext _dbContext;
    private readonly IMapper _mapper;
    private readonly ILogger<DeviceService> _logger;

    /// <summary>
    /// 初始化设备管理服务
    /// </summary>
    public DeviceService(
        AppDbContext dbContext,
        IMapper mapper,
        ILogger<DeviceService> logger)
    {
        _dbContext = dbContext;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// 分页查询设备列表，支持按状态、类型和关键词筛选
    /// 自动受租户全局过滤器约束
    /// </summary>
    /// <param name="query">分页查询参数</param>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="status">可选：按设备状态筛选（如 Online、Offline）</param>
    /// <param name="type">可选：按设备类型筛选（如 电机、泵）</param>
    /// <returns>分页设备结果</returns>
    public async Task<PagedResult<DeviceDto>> GetDevicesAsync(
        PagedQuery query, Guid tenantId, string? status = null, string? type = null)
    {
        var devices = _dbContext.Devices.AsQueryable();

        // 按状态筛选
        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<DeviceStatus>(status, ignoreCase: true, out var deviceStatus))
        {
            devices = devices.Where(d => d.Status == deviceStatus);
        }

        // 按类型筛选
        if (!string.IsNullOrWhiteSpace(type))
        {
            devices = devices.Where(d => d.Type == type);
        }

        // 关键词搜索：匹配设备编码、名称或型号
        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            var keyword = $"%{query.Keyword}%";
            devices = devices.Where(d =>
                EF.Functions.ILike(d.DeviceCode, keyword) ||
                EF.Functions.ILike(d.Name, keyword) ||
                EF.Functions.ILike(d.Model!, keyword));
        }

        var (items, total) = await devices.ToPagedAsync(query);

        return new PagedResult<DeviceDto>
        {
            Items = _mapper.Map<List<DeviceDto>>(items)!,
            Total = total,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }

    /// <summary>
    /// 根据 ID 获取设备详情
    /// </summary>
    /// <param name="deviceId">设备 ID</param>
    /// <param name="tenantId">租户 ID</param>
    /// <returns>设备信息，不存在则返回 null</returns>
    public async Task<DeviceDto?> GetDeviceByIdAsync(Guid deviceId, Guid tenantId)
    {
        var device = await _dbContext.Devices.FindAsync(deviceId);
        return device == null ? null : _mapper.Map<DeviceDto>(device);
    }

    /// <summary>
    /// 创建新设备
    /// 检查设备编码的租户内唯一性，新建设备默认状态为 Offline
    /// 同时维护租户的 CurrentDeviceCount 计数器
    /// </summary>
    /// <param name="request">创建设备请求</param>
    /// <param name="tenantId">所属租户 ID</param>
    /// <returns>创建后的设备信息</returns>
    /// <exception cref="InvalidOperationException">设备编码已存在</exception>
    public async Task<DeviceDto> CreateDeviceAsync(CreateDeviceRequest request, Guid tenantId)
    {
        // 检查设备编码在当前租户内的唯一性（全局过滤器已自动限制租户范围）
        var codeExists = await _dbContext.Devices
            .AnyAsync(d => d.DeviceCode == request.DeviceCode);

        if (codeExists)
        {
            throw new InvalidOperationException($"设备编码 '{request.DeviceCode}' 在当前租户内已存在");
        }

        var device = _mapper.Map<Core.Entities.Device>(request)!;
        device.TenantId = tenantId;
        device.Status = DeviceStatus.Offline;

        _dbContext.Devices.Add(device);

        // 维护租户 CurrentDeviceCount（使用 UnfilteredSet 跨租户查询）
        var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == tenantId);
        if (tenant != null)
        {
            tenant.CurrentDeviceCount++;
        }

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("设备 {DeviceCode}（名称：{Name}）创建成功（租户：{TenantId}）",
            device.DeviceCode, device.Name, tenantId);

        return _mapper.Map<DeviceDto>(device)!;
    }

    /// <summary>
    /// 更新设备信息
    /// 通过 AutoMapper 的 Condition 配置仅更新请求中非 null 的字段
    /// </summary>
    /// <param name="deviceId">设备 ID</param>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="request">更新设备请求</param>
    /// <returns>更新后的设备信息</returns>
    /// <exception cref="KeyNotFoundException">设备不存在</exception>
    public async Task<DeviceDto> UpdateDeviceAsync(Guid deviceId, Guid tenantId, UpdateDeviceRequest request)
    {
        var device = await _dbContext.Devices.FindAsync(deviceId)
            ?? throw new KeyNotFoundException($"设备 {deviceId} 不存在");

        _mapper.Map(request, device);
        device.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("设备 {DeviceId} 信息已更新", deviceId);

        return _mapper.Map<DeviceDto>(device)!;
    }

    /// <summary>
    /// 删除设备（硬删除）+ 清理关联数据，避免孤儿数据污染统计
    ///
    /// 关键修复（v1.5 数据完整性）：原代码只 _dbContext.Devices.Remove(device)，
    /// 但 alerts / work_orders / gateway_devices 都没有指向 devices 的外键约束
    /// （仅存储 DeviceId 作为普通 Guid 字段）。删除设备后留下孤儿数据：
    ///   - 活跃告警仍指向已删除设备 → Dashboard activeAlerts 虚高，告警列表点击设备 404
    ///   - 网关关联仍存在 → 网关继续向幽灵设备推送数据
    ///   - 工单仍指向已删除设备 → 工单统计/详情显示异常
    ///
    /// 修复策略（保留历史 + 消除活跃孤儿）：
    ///   1. 活跃告警 → 批量标记为 Resolved（保留告警历史，但不再污染活跃统计）
    ///   2. 网关设备关联 → 删除（停止向幽灵设备推送）
    ///   3. 工单 → 保留（工单是业务记录，删除设备不应使历史工单失效；
    ///      WorkOrderService 查询设备名时已做 null 容忍，详情页显示"已删除设备"）
    ///   4. 遥测 → 保留（工业历史数据，由 TimescaleDB 保留策略自动清理过期数据）
    ///   5. 维护租户 CurrentDeviceCount 计数器
    /// </summary>
    /// <param name="deviceId">设备 ID</param>
    /// <param name="tenantId">租户 ID</param>
    /// <exception cref="KeyNotFoundException">设备不存在</exception>
    public async Task DeleteDeviceAsync(Guid deviceId, Guid tenantId)
    {
        var device = await _dbContext.Devices.FindAsync(deviceId)
            ?? throw new KeyNotFoundException($"设备 {deviceId} 不存在");

        // 1. 归档该设备的活跃告警（标记 Resolved，避免孤儿告警污染 Dashboard）
        // 注意：用传统 foreach 而非 ExecuteUpdateAsync，兼容 InMemory 测试 provider
        // （ExecuteUpdate/ExecuteDelete 仅关系型数据库支持）。删设备是低频操作，性能不关键。
        var activeAlerts = await _dbContext.Alerts
            .Where(a => a.DeviceId == deviceId && a.Status == Core.Enums.AlertStatus.Active)
            .ToListAsync();

        var now = DateTime.UtcNow;
        foreach (var alert in activeAlerts)
        {
            alert.Status = Core.Enums.AlertStatus.Resolved;
            alert.ResolvedAt = now;
            alert.Resolution = "设备已删除，自动归档活跃告警";
        }

        // 2. 删除该设备的网关关联（停止向幽灵设备推送）
        var gatewayLinks = await _dbContext.GatewayDevices
            .Where(gd => gd.DeviceId == deviceId)
            .ToListAsync();
        _dbContext.GatewayDevices.RemoveRange(gatewayLinks);

        // 3. 删除设备本身
        _dbContext.Devices.Remove(device);

        // 4. 维护租户 CurrentDeviceCount（使用 UnfilteredSet 跨租户查询）
        var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == tenantId);
        if (tenant != null && tenant.CurrentDeviceCount > 0)
        {
            tenant.CurrentDeviceCount--;
        }

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation(
            "设备 {DeviceId}（编码：{DeviceCode}）已删除，同时归档 {AlertCount} 条活跃告警，移除 {LinkCount} 个网关关联",
            deviceId, device.DeviceCode, activeAlerts.Count, gatewayLinks.Count);
    }
}
