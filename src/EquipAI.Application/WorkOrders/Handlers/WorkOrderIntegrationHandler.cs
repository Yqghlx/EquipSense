using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders.Handlers;

/// <summary>
/// 工单集成事件处理器
/// 监听 WorkOrderStatusChangedEvent，在工单创建/状态变更时推送到外部系统
/// 集成配置存储在 Tenant.Settings JSONB 字段中
/// </summary>
public class WorkOrderIntegrationHandler : IEventHandler<WorkOrderStatusChangedEvent>
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<WorkOrderIntegrationHandler> _logger;

    public WorkOrderIntegrationHandler(
        IServiceScopeFactory scopeFactory,
        ILogger<WorkOrderIntegrationHandler> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task HandleAsync(WorkOrderStatusChangedEvent eventMsg, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 获取工单信息（Title, Priority）— 事件中不包含这些字段，需从数据库查询
        var workOrder = await db.UnfilteredSet<Core.Entities.WorkOrder>()
            .FirstOrDefaultAsync(wo => wo.Id == eventMsg.WorkOrderId, ct);
        if (workOrder == null)
        {
            _logger.LogWarning("工单不存在，跳过集成推送: {WorkOrderId}", eventMsg.WorkOrderId);
            return;
        }

        // 从租户设置中读取集成配置
        var tenant = await db.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == eventMsg.TenantId, ct);
        if (tenant == null)
        {
            _logger.LogWarning("租户不存在，跳过集成推送: {TenantId}", eventMsg.TenantId);
            return;
        }

        var integrations = GetIntegrationConfigs(tenant.Settings);
        if (integrations.Count == 0) return;

        // 获取所有已注册的集成实现（多个 IWorkOrderImplementation 通过 GetServices 解析）
        var integrationServices = scope.ServiceProvider.GetServices<IWorkOrderIntegration>();

        foreach (var (type, config) in integrations)
        {
            if (!config.Enabled) continue;

            var integration = integrationServices.FirstOrDefault(i => i.IntegrationType == type);
            if (integration == null)
            {
                _logger.LogWarning("未注册的集成类型: {Type}", type);
                continue;
            }

            try
            {
                if (eventMsg.NewStatus == "PendingDispatch")
                {
                    // 工单新建：推送创建通知
                    await integration.PushCreatedAsync(
                        eventMsg.TenantId, eventMsg.WorkOrderId,
                        workOrder.Title, workOrder.Priority.ToString(),
                        config.Config, ct);
                }
                else
                {
                    // 工单状态变更：推送状态更新
                    await integration.PushStatusChangedAsync(
                        eventMsg.TenantId, eventMsg.WorkOrderId,
                        eventMsg.NewStatus, null, config.Config, ct);
                }
            }
            catch (Exception ex)
            {
                // 集成推送失败不应阻断主流程，仅记录警告日志
                _logger.LogWarning(ex, "集成推送失败: Type={Type}, WorkOrderId={WorkOrderId}",
                    type, eventMsg.WorkOrderId);
            }
        }
    }

    /// <summary>
    /// 从租户 Settings JSON 中解析集成配置
    /// 配置格式：{ "integrations": { "webhook": { "enabled": true, "config": "..." }, ... } }
    /// </summary>
    private static List<(string Type, (bool Enabled, string Config))> GetIntegrationConfigs(string? settingsJson)
    {
        var result = new List<(string, (bool, string))>();
        if (string.IsNullOrEmpty(settingsJson)) return result;

        try
        {
            var json = System.Text.Json.JsonDocument.Parse(settingsJson);
            if (json.RootElement.TryGetProperty("integrations", out var integrations))
            {
                foreach (var prop in integrations.EnumerateObject())
                {
                    var enabled = prop.Value.TryGetProperty("enabled", out var e) && e.GetBoolean();
                    var config = prop.Value.TryGetProperty("config", out var c) ? c.GetRawText() : "{}";
                    result.Add((prop.Name, (enabled, config)));
                }
            }
        }
        catch
        {
            // 忽略 JSON 解析错误，返回空列表
        }

        return result;
    }
}
