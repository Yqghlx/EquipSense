using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Alerts.Handlers;

/// <summary>
/// 遥测数据事件处理器
/// 收到 TelemetryReceivedEvent 后：
/// 1. 更新设备状态为 Online 并刷新 LastSeenAt（这是 Dashboard 在线设备数和 OEE 计算的数据源）
/// 2. 构建设备上下文并触发告警评估
/// </summary>
public class TelemetryEventHandler : IEventHandler<TelemetryReceivedEvent>
{
    private readonly IAlertEvaluationService _evaluationService;
    private readonly AppDbContext _dbContext;
    private readonly ILogger<TelemetryEventHandler> _logger;

    public TelemetryEventHandler(
        IAlertEvaluationService evaluationService,
        AppDbContext dbContext,
        ILogger<TelemetryEventHandler> logger)
    {
        _evaluationService = evaluationService;
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task HandleAsync(TelemetryReceivedEvent @event, CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("处理遥测事件: 设备={DeviceId}, 指标={Metric}, 值={Value}",
            @event.DeviceId, @event.Metric, @event.Value);

        // 更新设备状态：收到遥测即视为在线
        // 只在状态非 Online 时写库，避免每条遥测都触发 UPDATE（高频场景下可降低 DB 压力）
        // LastSeenAt 始终更新，作为 DeviceStatusMonitor 判定超时的依据
        // 返回 false 表示设备不存在（野生遥测），直接 return 避免后续评估器对幽灵设备产生无意义调用
        var deviceFound = await UpdateDevicePresenceAsync(@event.DeviceId, cancellationToken);
        if (!deviceFound)
        {
            return;
        }

        // 构建设备上下文，当前仅包含触发事件的单一指标
        // 后续可扩展为从缓存加载设备全量指标，支持组合规则评估
        var context = new DeviceContext();
        context.Metrics[@event.Metric] = @event.Value;

        await _evaluationService.EvaluateForDeviceAsync(
            @event.TenantId,
            @event.DeviceId,
            string.Empty,
            @event.Metric,
            @event.Value,
            context);
    }

    /// <summary>
    /// 更新设备在线状态与最近活跃时间
    /// </summary>
    /// <remarks>
    /// 使用 IgnoreQueryFilters 绕过多租户过滤器：MQTT 上来的遥测消息可能来自任意租户的设备，
    /// 而当前 ITenantContext 是从 HTTP 请求上下文解析的（事件处理在后台 Channel 消费，无 HTTP 上下文）。
    /// 设备主键 Id 已是全局唯一，按 Id 直接定位即可，不需要租户过滤。
    /// </remarks>
    /// <returns>true 表示设备存在并已更新；false 表示设备不存在（野生遥测），调用方应跳过后续处理</returns>
    private async Task<bool> UpdateDevicePresenceAsync(Guid deviceId, CancellationToken ct)
    {
        var device = await _dbContext.Devices
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(d => d.Id == deviceId, ct);
        if (device == null)
        {
            _logger.LogWarning("收到未知设备的遥测，跳过状态更新：{DeviceId}", deviceId);
            return false;
        }

        var now = DateTime.UtcNow;
        var wasOffline = device.Status != DeviceStatus.Online;
        device.LastSeenAt = now;
        if (wasOffline)
        {
            device.Status = DeviceStatus.Online;
        }

        await _dbContext.SaveChangesAsync(ct);
        return true;
    }
}
