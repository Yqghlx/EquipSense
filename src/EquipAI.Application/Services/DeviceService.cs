using AutoMapper;
using EquipAI.Application.DTOs.Common;
using EquipAI.Core.Models;
using EquipAI.Application.DTOs.Devices;
using EquipAI.Application.Interfaces;
using EquipAI.Core.Enums;
using EquipAI.Core.Exceptions;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Services;

/// <summary>
/// 设备管理服务实现，提供设备 CRUD 和筛选查询能力
/// 所有操作均在指定租户范围内进行；全局租户过滤器作为纵深防御，业务谓词仍显式匹配 TenantId
/// </summary>
public class DeviceService : IDeviceService
{
    private readonly AppDbContext _dbContext;
    private readonly IMapper _mapper;
    private readonly ILogger<DeviceService> _logger;
    private readonly IAuditLogService _auditLogService;

    /// <summary>
    /// 初始化设备管理服务
    /// </summary>
    public DeviceService(
        AppDbContext dbContext,
        IMapper mapper,
        ILogger<DeviceService> logger,
        IAuditLogService auditLogService)
    {
        _dbContext = dbContext;
        _mapper = mapper;
        _logger = logger;
        _auditLogService = auditLogService;
    }

    /// <summary>
    /// 分页查询设备列表，支持按状态、类型和关键词筛选
    /// 显式按租户筛选，并由全局过滤器提供第二层隔离
    /// </summary>
    /// <param name="query">分页查询参数</param>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="status">可选：按设备状态筛选（如 Online、Offline）</param>
    /// <param name="type">可选：按设备类型筛选（如 电机、泵）</param>
    /// <returns>分页设备结果</returns>
    public async Task<PagedResult<DeviceDto>> GetDevicesAsync(
        PagedQuery query, Guid tenantId, string? status = null, string? type = null)
    {
        // tenantId 是服务契约的一部分，不能只依赖 DbContext 的全局过滤器。
        // 这样即使调用方传入的上下文被复用，列表也不会脱离显式租户边界。
        var devices = _dbContext.Devices
            .Where(d => d.TenantId == tenantId)
            .AsQueryable();

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
        // 不使用 FindAsync：它可能从 ChangeTracker 返回实体，从而绕过查询过滤器。
        var device = await _dbContext.Devices
            .FirstOrDefaultAsync(d => d.Id == deviceId && d.TenantId == tenantId);
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
        // 显式按租户校验编码唯一性；全局过滤器只作为第二层隔离。
        var codeExists = await _dbContext.Devices
            .AnyAsync(d => d.TenantId == tenantId &&
                           d.DeviceCode == request.DeviceCode);

        if (codeExists)
        {
            throw new InvalidOperationException($"设备编码 '{request.DeviceCode}' 在当前租户内已存在");
        }

        var device = _mapper.Map<Core.Entities.Device>(request)!;
        device.TenantId = tenantId;
        device.Status = DeviceStatus.Offline;

        // 配额不能只依赖 HTTP 中间件：直接调用服务的入口也必须受保护。
        // 关系型数据库使用带条件的原子递增，并与设备写入共用事务，避免并发请求超卖设备席位。
        var executionStrategy = _dbContext.Database.CreateExecutionStrategy();
        try
        {
            await executionStrategy.ExecuteAsync(async () =>
            {
                if (!_dbContext.Database.IsRelational())
                {
                    // InMemory provider 不支持事务；保留同样的配额不变量供单元测试验证。
                    var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
                        .FirstOrDefaultAsync(t => t.Id == tenantId);
                    if (tenant != null)
                    {
                        if (tenant.MaxDevices > 0 && tenant.CurrentDeviceCount >= tenant.MaxDevices)
                            throw new ResourceQuotaExceededException("device");

                        tenant.CurrentDeviceCount++;
                    }

                    _dbContext.Devices.Add(device);
                    await _dbContext.SaveChangesAsync();
                    return true;
                }

                _dbContext.ChangeTracker.Clear();
                await using var transaction = await _dbContext.Database.BeginTransactionAsync();
                try
                {
                    var affected = await TenantQuotaSql.TryReserveDeviceSlotsAsync(
                        _dbContext, tenantId, 1, CancellationToken.None);

                    if (affected == 0)
                    {
                        var tenantExists = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
                            .AnyAsync(t => t.Id == tenantId);
                        throw tenantExists
                            ? new ResourceQuotaExceededException("device")
                            : new InvalidOperationException("当前租户不存在，无法创建设备");
                    }

                    _dbContext.Devices.Add(device);
                    await _dbContext.SaveChangesAsync();
                    await transaction.CommitAsync();
                    return true;
                }
                catch
                {
                    await transaction.RollbackAsync();
                    _dbContext.ChangeTracker.Clear();
                    throw;
                }
            });
        }
        catch (DbUpdateException exception)
            when (DatabaseConstraintDetector.IsDeviceCodeUniqueViolation(exception))
        {
            // 先查后写无法消除并发窗口；唯一索引冲突应返回可理解的 409，而不是暴露为 500。
            _dbContext.ChangeTracker.Clear();
            throw new InvalidOperationException($"设备编码 '{request.DeviceCode}' 在当前租户内已存在", exception);
        }

        // 设备创建（资产登记）必须留痕审计：工业资产台账是 ISO 55000 资产管理 / IEC 62443 安全合规的基础，
        // 新增设备不可追溯则无法核对资产清单（是否有未经登记的设备接入监控）。
        await _auditLogService.LogAsync(tenantId, "DeviceCreate", "Device",
            device.Id.ToString(), $"创建设备：{device.DeviceCode}（{device.Name}）", default);

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
        // ID 和租户必须在同一个业务谓词中校验，跨租户资源按不存在处理。
        var device = await _dbContext.Devices
            .FirstOrDefaultAsync(d => d.Id == deviceId && d.TenantId == tenantId)
            ?? throw new KeyNotFoundException($"设备 {deviceId} 不存在");

        _mapper.Map(request, device);
        device.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        // 设备信息变更（名称/位置/关键等级/参数等）影响告警规则匹配与运维识别，必须留痕审计：
        // 关键等级(Criticality)变更影响 SLA/派工优先级，参数变更影响告警阈值——这些变更不可追溯
        // 则无法定位"谁改了设备配置导致告警失效/误派工"。
        await _auditLogService.LogAsync(tenantId, "DeviceUpdate", "Device",
            deviceId.ToString(), $"更新设备信息：{device.DeviceCode}（{device.Name}）", default);

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
        // 删除是不可逆操作，必须显式绑定租户，不能依赖 FindAsync 或跟踪状态。
        var device = await _dbContext.Devices
            .FirstOrDefaultAsync(d => d.Id == deviceId && d.TenantId == tenantId)
            ?? throw new KeyNotFoundException($"设备 {deviceId} 不存在");

        // 1. 归档该设备的活跃告警（标记 Resolved，避免孤儿告警污染 Dashboard）
        // 注意：用传统 foreach 而非 ExecuteUpdateAsync，兼容 InMemory 测试 provider
        // （ExecuteUpdate/ExecuteDelete 仅关系型数据库支持）。删设备是低频操作，性能不关键。
        var activeAlerts = await _dbContext.Alerts
            .Where(a => a.TenantId == tenantId &&
                        a.DeviceId == deviceId &&
                        a.Status == Core.Enums.AlertStatus.Active)
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
            .Where(gd => gd.TenantId == tenantId && gd.DeviceId == deviceId)
            .ToListAsync();
        _dbContext.GatewayDevices.RemoveRange(gatewayLinks);

        // 3. 删除该设备绑定的告警规则（避免孤儿规则残留）
        // 规则分三种粒度：DeviceId 特定（绑定具体设备）/ DeviceType 特定（绑定类型）/ 租户级（全设备）。
        // 仅清理 DeviceId 绑定本设备的规则；DeviceType/租户级规则不绑定具体设备，保留（仍适用于其他/同类型设备）。
        // 不清理的后果：删设备后规则残留（DeviceId 指向已删设备）→ 规则管理页显示孤儿规则致困惑；更严重：
        // 重建同 DeviceCode 设备（返修/更换后新 ID）时旧规则仍绑旧 ID，新设备无告警保护
        // （温度/振动超限不告警）——告警评估按 r.DeviceId==当前遥测设备过滤，孤儿规则永不匹配（静默失效，不崩溃），
        // 工业设备返修后失去告警是安全盲区。与归档告警/移除网关关联同为"删设备必须清理的 DeviceId 绑定关联"。
        var deviceRules = await _dbContext.AlertRules
            .Where(r => r.TenantId == tenantId && r.DeviceId == deviceId)
            .ToListAsync();
        _dbContext.AlertRules.RemoveRange(deviceRules);

        // 4. 删除设备本身
        _dbContext.Devices.Remove(device);

        // 5. 维护租户 CurrentDeviceCount（使用 UnfilteredSet 跨租户查询）
        var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == tenantId);
        if (tenant != null && tenant.CurrentDeviceCount > 0)
        {
            tenant.CurrentDeviceCount--;
        }

        await _dbContext.SaveChangesAsync();

        // 设备删除是不可逆的资产处置（硬删除 + 级联清理告警/规则/网关关联），必须留痕审计：
        // 工业资产报废/拆除是重大事件，删除不可追溯则无法核查"谁在何时删除了哪台设备"
        // （误删/恶意删设备的内部威胁，ISO 27001 / IEC 62443 可审计性要求）。
        await _auditLogService.LogAsync(tenantId, "DeviceDelete", "Device",
            deviceId.ToString(), $"删除设备：{device.DeviceCode}（{device.Name}）", default);

        _logger.LogInformation(
            "设备 {DeviceId}（编码：{DeviceCode}）已删除，同时归档 {AlertCount} 条活跃告警，移除 {LinkCount} 个网关关联，清理 {RuleCount} 条绑定告警规则",
            deviceId, device.DeviceCode, activeAlerts.Count, gatewayLinks.Count, deviceRules.Count);
    }

    /// <summary>
    /// 根据设备编码解析设备 ID（用于 HTTP 遥测上报等以编码标识设备的场景）
    /// 查询受 AppDbContext 全局租户过滤器约束，仅返回当前请求租户的设备，
    /// 避免跨租户通过枚举编码探测设备存在性。
    /// </summary>
    public async Task<Guid?> GetDeviceIdByCodeAsync(string deviceCode)
    {
        // 投影到 Id 而非拉取整个实体，减少不必要的数据传输
        return await _dbContext.Devices
            .Where(d => d.DeviceCode == deviceCode)
            .Select(d => (Guid?)d.Id)
            .FirstOrDefaultAsync();
    }
}
