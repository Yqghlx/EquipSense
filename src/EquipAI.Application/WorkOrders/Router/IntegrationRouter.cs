using System.Diagnostics;
using System.Text.Json;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders.Router;

/// <summary>
/// 集成路由服务 — 统一管理外部集成的推送分发、重试和日志记录
/// 核心职责：
/// 1. 从租户 Settings JSON 中解析启用的集成配置
/// 2. 对每个启用的集成调用对应 IWorkOrderIntegration 实现
/// 3. 失败时指数退避重试（最多 3 次，间隔 1s/2s/4s）
/// 4. 每次推送前后写入 IntegrationPushLog 日志
/// </summary>
public class IntegrationRouter
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<IntegrationRouter> _logger;

    /// <summary>
    /// 最大重试次数
    /// </summary>
    private const int MaxRetryCount = 3;

    /// <summary>
    /// 指数退避基础间隔（秒）：第 1 次 1s，第 2 次 2s，第 3 次 4s
    /// </summary>
    private static readonly int[] RetryDelaysSeconds = [1, 2, 4];

    public IntegrationRouter(
        IServiceScopeFactory scopeFactory,
        ILogger<IntegrationRouter> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    /// <summary>
    /// 工单创建时路由 — 对所有启用的集成推送创建通知
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="workOrderId">工单 ID</param>
    /// <param name="ct">取消令牌</param>
    public async Task RouteCreatedAsync(Guid tenantId, Guid workOrderId, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 获取工单信息（标题、优先级）用于推送内容
        var workOrder = await db.UnfilteredSet<WorkOrder>()
            .FirstOrDefaultAsync(wo => wo.Id == workOrderId, ct);
        if (workOrder == null)
        {
            _logger.LogWarning("工单不存在，跳过集成路由推送: {WorkOrderId}", workOrderId);
            return;
        }

        // 获取租户的集成配置
        var integrationConfigs = await GetIntegrationConfigsAsync(db, tenantId, ct);
        if (integrationConfigs.Count == 0) return;

        // 获取所有已注册的集成实现
        var integrationServices = scope.ServiceProvider.GetServices<IWorkOrderIntegration>();

        // 逐个推送到启用的集成
        foreach (var (type, enabled, config) in integrationConfigs)
        {
            if (!enabled) continue;

            var integration = integrationServices.FirstOrDefault(i => i.IntegrationType == type);
            if (integration == null)
            {
                _logger.LogWarning("未注册的集成类型: {Type}", type);
                continue;
            }

            await PushWithRetryAsync(
                db, tenantId, workOrderId, type, "Created",
                async () => await integration.PushCreatedAsync(
                    tenantId, workOrderId,
                    workOrder.Title, workOrder.Priority.ToString(),
                    config, ct),
                ct);
        }
    }

    /// <summary>
    /// 工单状态变更时路由 — 对所有启用的集成推送状态更新
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="workOrderId">工单 ID</param>
    /// <param name="newStatus">新状态</param>
    /// <param name="ct">取消令牌</param>
    public async Task RouteStatusChangedAsync(Guid tenantId, Guid workOrderId, string newStatus, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 获取租户的集成配置
        var integrationConfigs = await GetIntegrationConfigsAsync(db, tenantId, ct);
        if (integrationConfigs.Count == 0) return;

        // 获取所有已注册的集成实现
        var integrationServices = scope.ServiceProvider.GetServices<IWorkOrderIntegration>();

        // 逐个推送到启用的集成
        foreach (var (type, enabled, config) in integrationConfigs)
        {
            if (!enabled) continue;

            var integration = integrationServices.FirstOrDefault(i => i.IntegrationType == type);
            if (integration == null)
            {
                _logger.LogWarning("未注册的集成类型: {Type}", type);
                continue;
            }

            await PushWithRetryAsync(
                db, tenantId, workOrderId, type, "StatusChanged",
                async () =>
                {
                    await integration.PushStatusChangedAsync(
                        tenantId, workOrderId, newStatus, null, config, ct);
                    // PushStatusChangedAsync 返回 void，无 ExternalId
                    return (string?)null;
                },
                ct);
        }
    }

    /// <summary>
    /// 带指数退避重试的推送执行器
    /// 每次推送前后写入 IntegrationPushLog：
    /// - 推送前：写入 Pending 状态日志
    /// - 推送成功：更新为 Success 状态，记录 ExternalId 和耗时
    /// - 推送失败：重试最多 3 次，最终失败时更新为 Failed 状态并记录错误信息
    /// </summary>
    private async Task PushWithRetryAsync(
        AppDbContext db,
        Guid tenantId,
        Guid workOrderId,
        string integrationType,
        string direction,
        Func<Task<string?>> pushFunc,
        CancellationToken ct)
    {
        // 创建推送日志（Pending 状态）
        var pushLog = new IntegrationPushLog
        {
            TenantId = tenantId,
            WorkOrderId = workOrderId,
            IntegrationType = integrationType,
            Direction = direction,
            Status = "Pending"
        };

        db.IntegrationPushLogs.Add(pushLog);
        await db.SaveChangesAsync(ct);

        var stopwatch = Stopwatch.StartNew();
        string? lastError = null;

        for (var attempt = 0; attempt < MaxRetryCount; attempt++)
        {
            try
            {
                stopwatch.Restart();
                var externalId = await pushFunc();
                stopwatch.Stop();

                // 推送成功：更新日志状态
                pushLog.Status = "Success";
                pushLog.ExternalId = externalId;
                pushLog.DurationMs = stopwatch.ElapsedMilliseconds;
                pushLog.RetryCount = attempt;
                await db.SaveChangesAsync(ct);

                _logger.LogInformation(
                    "集成推送成功: Type={Type}, WorkOrderId={WorkOrderId}, Direction={Direction}, 耗时={DurationMs}ms, 重试次数={RetryCount}",
                    integrationType, workOrderId, direction, stopwatch.ElapsedMilliseconds, attempt);
                return;
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                lastError = ex.Message;
                _logger.LogWarning(ex,
                    "集成推送失败（第 {Attempt}/{Max} 次）: Type={Type}, WorkOrderId={WorkOrderId}",
                    attempt + 1, MaxRetryCount, integrationType, workOrderId);

                // 非最后一次重试：等待指数退避间隔后继续
                if (attempt < MaxRetryCount - 1)
                {
                    var delaySeconds = RetryDelaysSeconds[attempt];
                    await Task.Delay(TimeSpan.FromSeconds(delaySeconds), ct);
                }
            }
        }

        // 所有重试均失败：更新日志为 Failed 状态
        stopwatch.Stop();
        pushLog.Status = "Failed";
        pushLog.ErrorMessage = TruncateString(lastError, 2000);
        pushLog.DurationMs = stopwatch.ElapsedMilliseconds;
        pushLog.RetryCount = MaxRetryCount;
        await db.SaveChangesAsync(ct);

        _logger.LogError(
            "集成推送最终失败: Type={Type}, WorkOrderId={WorkOrderId}, Direction={Direction}, 重试 {MaxRetry} 次后仍失败",
            integrationType, workOrderId, direction, MaxRetryCount);
    }

    /// <summary>
    /// 从租户 Settings JSON 中解析集成配置
    /// 配置格式示例：
    /// {
    ///   "integrations": {
    ///     "dingtalk": { "enabled": true, "webhook": "...", "secret": "..." },
    ///     "webhook": { "enabled": false, "url": "", "secret": "" },
    ///     "feishu": { "enabled": false, "appId": "", "appSecret": "" },
    ///     "eam": { "enabled": false, "type": "maximo", "endpoint": "", "apiKey": "" }
    ///   }
    /// }
    /// </summary>
    private static async Task<List<(string Type, bool Enabled, string Config)>> GetIntegrationConfigsAsync(
        AppDbContext db, Guid tenantId, CancellationToken ct)
    {
        var result = new List<(string, bool, string)>();

        var tenant = await db.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == tenantId, ct);
        if (tenant == null || string.IsNullOrEmpty(tenant.Settings))
            return result;

        try
        {
            var json = JsonDocument.Parse(tenant.Settings);
            if (!json.RootElement.TryGetProperty("integrations", out var integrations))
                return result;

            foreach (var prop in integrations.EnumerateObject())
            {
                var enabled = prop.Value.TryGetProperty("enabled", out var e) && e.GetBoolean();
                // 将每个集成节点的完整配置序列化为字符串，传递给对应的 IWorkOrderIntegration 实现
                var config = prop.Value.GetRawText();
                result.Add((prop.Name, enabled, config));
            }
        }
        catch (JsonException)
        {
            // JSON 解析错误时返回空列表，不中断主流程
            // 注意：这里是静态方法，无法注入 logger，调用方已有日志记录
        }

        return result;
    }

    /// <summary>
    /// 截断字符串到指定最大长度，防止超长错误信息写入数据库失败
    /// </summary>
    private static string? TruncateString(string? value, int maxLength)
    {
        if (value == null) return null;
        return value.Length <= maxLength ? value : value[..maxLength];
    }
}
