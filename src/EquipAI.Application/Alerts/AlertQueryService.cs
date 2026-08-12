using AutoMapper;
using EquipAI.Application.Alerts.DTOs;
using EquipAI.Application.DTOs.Common;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.Application.Alerts;

/// <summary>
/// 告警实例查询与状态变更服务。
/// 封装告警列表/详情查询，以及确认/解决状态变更（含事件总线发布），
/// 使 Controller 不直接依赖 <c>AppDbContext</c>。
/// </summary>
public class AlertQueryService
{
    private readonly AppDbContext _dbContext;
    private readonly IMapper _mapper;
    private readonly ITenantContext _tenantContext;
    private readonly IEventBus _eventBus;

    public AlertQueryService(
        AppDbContext dbContext,
        IMapper mapper,
        ITenantContext tenantContext,
        IEventBus eventBus)
    {
        _dbContext = dbContext;
        _mapper = mapper;
        _tenantContext = tenantContext;
        _eventBus = eventBus;
    }

    /// <summary>
    /// 分页查询告警，支持按状态/严重级别/设备筛选。
    /// </summary>
    public async Task<PagedResult<AlertDto>> ListAsync(
        PagedQuery query, string? status = null, string? severity = null, Guid? deviceId = null, CancellationToken ct = default)
    {
        // 全局过滤器是纵深防御，业务查询仍需显式绑定租户，避免上下文配置异常时跨租户泄露告警。
        var alerts = _dbContext.Alerts
            .Where(a => a.TenantId == _tenantContext.TenantId)
            .AsQueryable();

        if (deviceId.HasValue)
            alerts = alerts.Where(a => a.DeviceId == deviceId.Value);

        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<AlertStatus>(status, ignoreCase: true, out var alertStatus))
        {
            alerts = alerts.Where(a => a.Status == alertStatus);
        }

        if (!string.IsNullOrWhiteSpace(severity) &&
            Enum.TryParse<AlertSeverity>(severity, ignoreCase: true, out var alertSeverity))
        {
            alerts = alerts.Where(a => a.Severity == alertSeverity);
        }

        var (items, total) = await alerts.ToPagedAsync(query, ct);

        return new PagedResult<AlertDto>
        {
            Items = _mapper.Map<List<AlertDto>>(items)!,
            Total = total,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }

    /// <summary>
    /// 按 ID 查询单条告警。返回 null 表示未找到。
    /// </summary>
    public async Task<AlertDto?> GetAsync(Guid id, CancellationToken ct = default)
    {
        // FindAsync 可能命中已跟踪的其他租户实体，因此这里必须使用带租户条件的查询。
        var alert = await _dbContext.Alerts
            .FirstOrDefaultAsync(
                a => a.Id == id && a.TenantId == _tenantContext.TenantId,
                ct);
        return alert is null ? null : _mapper.Map<AlertDto>(alert);
    }

    /// <summary>
    /// 确认告警。返回 (AlertDto?, Error) —— Error 非 null 时为业务错误（状态非法/告警不存在）。
    /// </summary>
    public async Task<(AlertDto? Alert, string? Error)> AcknowledgeAsync(Guid id, string? note, CancellationToken ct = default)
    {
        // 状态变更同样必须先验证租户归属，避免越权确认告警。
        var alert = await _dbContext.Alerts
            .FirstOrDefaultAsync(
                a => a.Id == id && a.TenantId == _tenantContext.TenantId,
                ct);
        if (alert is null)
            return (null, "告警不存在");

        if (alert.Status != AlertStatus.Active)
            return (null, "只能确认活跃状态的告警");

        alert.Status = AlertStatus.Acknowledged;
        // 记录操作用户 ID（非租户 ID）：审计须追溯「谁确认了告警」
        alert.AcknowledgedBy = _tenantContext.UserId;
        alert.AcknowledgedAt = DateTime.UtcNow;
        alert.AcknowledgementNote = note;

        // 发布告警确认事件 → SignalR 推送，让其他在线用户实时看到该告警已被接管
        // 显式 CancellationToken.None：即便发起方断开，状态变更仍须通知其他在线用户
        await _eventBus.PublishAsync(new AlertAcknowledgedEvent(
            EventId: Guid.NewGuid(),
            OccurredAt: DateTime.UtcNow,
            TenantId: _tenantContext.TenantId,
            AlertId: id,
            AcknowledgedBy: _tenantContext.UserId,
            Note: note), CancellationToken.None);
        // 生产 RabbitMQ 模式下，事务事件总线会把状态和 Outbox 一起提交；
        // InMemory/单元测试模式下此处仍由原有 DbContext 完成保存。
        await _dbContext.SaveChangesAsync(ct);

        return (_mapper.Map<AlertDto>(alert), null);
    }

    /// <summary>
    /// 解决告警。返回 (AlertDto?, Error) —— Error 非 null 时为业务错误。
    /// </summary>
    public async Task<(AlertDto? Alert, string? Error)> ResolveAsync(Guid id, string resolution, CancellationToken ct = default)
    {
        // 状态变更同样必须先验证租户归属，避免越权解决告警。
        var alert = await _dbContext.Alerts
            .FirstOrDefaultAsync(
                a => a.Id == id && a.TenantId == _tenantContext.TenantId,
                ct);
        if (alert is null)
            return (null, "告警不存在");

        if (alert.Status == AlertStatus.Resolved)
            return (null, "告警已解决");

        alert.Status = AlertStatus.Resolved;
        // 记录操作用户 ID（非租户 ID），与 Acknowledge 对称
        alert.ResolvedBy = _tenantContext.UserId;
        alert.ResolvedAt = DateTime.UtcNow;
        alert.Resolution = resolution;

        // 发布告警解决事件 → SignalR 推送 + 持久化通知 + Web Push
        await _eventBus.PublishAsync(new AlertResolvedEvent(
            EventId: Guid.NewGuid(),
            OccurredAt: DateTime.UtcNow,
            TenantId: _tenantContext.TenantId,
            AlertId: id,
            ResolvedBy: _tenantContext.UserId,
            Resolution: resolution), CancellationToken.None);
        await _dbContext.SaveChangesAsync(ct);

        return (_mapper.Map<AlertDto>(alert), null);
    }
}
