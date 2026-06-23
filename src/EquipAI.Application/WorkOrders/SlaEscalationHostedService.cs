using EquipAI.Core.Enums;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders;

/// <summary>
/// SLA 超时自动升级后台服务
///
/// 背景：SlaManagementService.CheckAndEscalateAsync 此前仅由手动端点 POST /work-orders/sla/check 触发
/// （该端点注释自述"通常由定时任务调用"），但系统无任何定时任务调用它（7 个 HostedService 均与 SLA 无关，
/// 也无 Hangfire/Quartz 等外部调度器）。后果：生产环境逾期工单永不自动升级优先级、主管永不收到 SLA 超时
/// 通知——对有契约型 SLA 罚则的工业客户是严重缺陷（#184 的通知修复因无触发方形同虚设）。
///
/// 本服务每 5 分钟遍历所有活跃（非 Expired、非系统）租户，逐租户调用 CheckAndEscalateAsync。
/// 通知能力由 SlaManagementService 通过其注入的 ISignalRNotificationService 自动完成（DI 解析 3 参构造函数）。
/// 单租户失败不阻断其余租户（捕获并记录）。
/// </summary>
public class SlaEscalationHostedService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SlaEscalationHostedService> _logger;

    /// <summary>扫描间隔：5 分钟。Critical SLA 为 2h，5 分钟粒度足以及时捕获超时且 DB 负载极低。</summary>
    private static readonly TimeSpan ScanInterval = TimeSpan.FromMinutes(5);

    /// <summary>启动延迟：等待应用完全启动后再扫描，避免启动期 DB 压力叠加。</summary>
    private static readonly TimeSpan StartupDelay = TimeSpan.FromSeconds(30);

    public SlaEscalationHostedService(IServiceScopeFactory scopeFactory, ILogger<SlaEscalationHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // 首次延迟等待应用完全启动
        await Task.Delay(StartupDelay, stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunEscalationAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                // 单次扫描整体失败不应终止后台循环，记录后等待下次扫描
                _logger.LogError(ex, "SLA 升级扫描执行失败");
            }

            await Task.Delay(ScanInterval, stoppingToken);
        }
    }

    /// <summary>
    /// 单次扫描：遍历所有活跃租户，逐租户执行 SLA 升级。
    /// 公开以便单元测试直接调用（不依赖定时器与启动延迟）。
    /// </summary>
    /// <param name="ct">取消令牌</param>
    /// <returns>本次扫描累计升级的工单数</returns>
    public async Task<int> RunEscalationAsync(CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var slaService = scope.ServiceProvider.GetRequiredService<SlaManagementService>();

        // Tenant 实体无全局租户过滤器（后台服务需跨租户遍历），默认查询即返回全部租户。
        // 跳过系统租户（Guid.Empty，仅承载预置模板，无真实工单）与已过期租户（不再产生 SLA 义务）。
        var tenants = await dbContext.Tenants
            .Where(t => t.Id != Guid.Empty && t.Status != TenantStatus.Expired)
            .Select(t => t.Id)
            .ToListAsync(ct);

        var totalEscalated = 0;
        foreach (var tenantId in tenants)
        {
            // 单租户隔离：一个租户的升级失败不阻断其余租户的处理
            try
            {
                totalEscalated += await slaService.CheckAndEscalateAsync(tenantId, ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "租户 {TenantId} 的 SLA 升级失败", tenantId);
            }
        }

        if (totalEscalated > 0)
        {
            _logger.LogInformation("SLA 升级扫描完成：处理 {TenantCount} 个租户，累计升级 {EscalatedCount} 个工单",
                tenants.Count, totalEscalated);
        }

        return totalEscalated;
    }
}
