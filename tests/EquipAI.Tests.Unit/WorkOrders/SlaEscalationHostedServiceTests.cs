using EquipAI.Application.WorkOrders;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Tests.Unit.TestHelpers;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace EquipAI.Tests.Unit.WorkOrders;

/// <summary>
/// SLA 超时自动升级后台服务（SlaEscalationHostedService）回归测试。
///
/// 背景：SlaManagementService.CheckAndEscalateAsync 此前仅由手动端点触发，无定时调用者，导致生产环境逾期
/// 工单永不自动升级、主管永不收到通知。本服务补齐"每 5 分钟遍历活跃租户自动升级"的定时调用者。
///
/// 同时覆盖后台 scope 租户过滤器 bug：SlaManagementService 原查询沿用默认全局过滤器，后台 scope
/// （Guid.Empty）下与 tenantId 求交集恒为空 → 永远查不到工单。已改 IgnoreQueryFilters + 显式 tenantId。
/// InMemory 不强制过滤器会掩盖此 bug，必须用 SQLite + Guid.Empty 上下文复刻生产后台路径。
/// </summary>
public class SlaEscalationHostedServiceTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private ServiceProvider _sp = null!;
    private Mock<ISignalRNotificationService> _notifyMock = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();

        _notifyMock = new Mock<ISignalRNotificationService>();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseSqlite(_connection));
        // 复刻后台 HostedService scope：ITenantContext 回退为空租户
        services.AddScoped<ITenantContext>(_ => new BackgroundTenantContext());
        services.AddLogging();
        services.AddScoped<SlaManagementService>();
        // 注入通知 Mock，使 DI 解析 SlaManagementService 的 3 参构造函数（带通知能力）
        services.AddScoped<ISignalRNotificationService>(_ => _notifyMock.Object);
        // 后台服务现在依赖 IDistributedLockProvider（LockedTimerService 基类）；测试用始终获取锁的 mock
        services.AddSingleton<IDistributedLockProvider, AlwaysAcquireLockProvider>();
        services.AddSingleton<SlaEscalationHostedService>();
        _sp = services.BuildServiceProvider();

        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        await _sp.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task RunEscalationAsync_应遍历活跃租户升级逾期工单并跳过过期租户()
    {
        var tenantA = Guid.NewGuid();
        var tenantB = Guid.NewGuid();
        var tenantC = Guid.NewGuid(); // Expired，应被跳过

        // 各租户一条 Medium 工单，创建于 30 小时前（Medium SLA=24h → 已逾期）
        using (var seedScope = _sp.CreateScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Tenants.Add(MakeTenant(tenantA, TenantStatus.Active));
            db.Tenants.Add(MakeTenant(tenantB, TenantStatus.Active));
            db.Tenants.Add(MakeTenant(tenantC, TenantStatus.Expired));

            db.WorkOrders.Add(MakeOverdueWorkOrder(tenantA, WorkOrderPriority.Medium));
            db.WorkOrders.Add(MakeOverdueWorkOrder(tenantB, WorkOrderPriority.Medium));
            db.WorkOrders.Add(MakeOverdueWorkOrder(tenantC, WorkOrderPriority.Medium));
            await db.SaveChangesAsync();
        }

        // 解析 HostedService（其 _scopeFactory 创建后台 scope，Guid.Empty 租户上下文）
        var hosted = _sp.GetRequiredService<SlaEscalationHostedService>();
        var escalated = await hosted.RunEscalationAsync(CancellationToken.None);

        // 仅 2 个活跃租户的工单被升级（Expired 租户跳过）
        escalated.Should().Be(2, "两个活跃租户各有一条逾期工单被升级，Expired 租户被跳过");

        using var assertScope = _sp.CreateScope();
        var assertDb = assertScope.ServiceProvider.GetRequiredService<AppDbContext>();

        var woA = await assertDb.WorkOrders.IgnoreQueryFilters().FirstAsync(w => w.TenantId == tenantA);
        var woB = await assertDb.WorkOrders.IgnoreQueryFilters().FirstAsync(w => w.TenantId == tenantB);
        var woC = await assertDb.WorkOrders.IgnoreQueryFilters().FirstAsync(w => w.TenantId == tenantC);

        woA.Priority.Should().Be(WorkOrderPriority.High, "Medium 逾期应升级为 High");
        woB.Priority.Should().Be(WorkOrderPriority.High, "Medium 逾期应升级为 High");
        woC.Priority.Should().Be(WorkOrderPriority.Medium, "Expired 租户被跳过，优先级不应变更");

        // 升级后应通知主管（每个活跃租户一条）
        _notifyMock.Verify(
            n => n.SendWorkOrderEscalatedAsync(tenantA, woA.Id, woA.WorkOrderCode, woA.Title,
                WorkOrderPriority.Medium.ToString(), WorkOrderPriority.High.ToString(),
                It.IsAny<CancellationToken>()),
            Times.Once, "租户 A 的升级应通知主管");
        _notifyMock.Verify(
            n => n.SendWorkOrderEscalatedAsync(tenantB, woB.Id, woB.WorkOrderCode, woB.Title,
                WorkOrderPriority.Medium.ToString(), WorkOrderPriority.High.ToString(),
                It.IsAny<CancellationToken>()),
            Times.Once, "租户 B 的升级应通知主管");
        _notifyMock.Verify(
            n => n.SendWorkOrderEscalatedAsync(It.Is<Guid>(g => g == tenantC), It.IsAny<Guid>(),
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never, "Expired 租户被跳过，不应发送升级通知");
    }

    /// <summary>
    /// 后台扫描不能吞掉通知阶段的停机取消信号。
    ///
    /// Why：HostedService 的租户级异常隔离只适用于业务故障；取消必须传播给
    /// LockedTimerService，确保应用能在容器停止超时前释放数据库连接和分布式锁。
    /// </summary>
    [Fact]
    public async Task RunEscalationAsync_租户处理收到停机取消时应向宿主传播()
    {
        var tenantId = Guid.NewGuid();
        using var cancellation = new CancellationTokenSource();

        _notifyMock
            .Setup(n => n.SendWorkOrderEscalatedAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                cancellation.Cancel();
                throw new OperationCanceledException(cancellation.Token);
            });

        using (var seedScope = _sp.CreateScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Tenants.Add(MakeTenant(tenantId, TenantStatus.Active));
            db.WorkOrders.Add(MakeOverdueWorkOrder(tenantId, WorkOrderPriority.Medium));
            await db.SaveChangesAsync();
        }

        var hosted = _sp.GetRequiredService<SlaEscalationHostedService>();
        var act = async () => await hosted.RunEscalationAsync(cancellation.Token);

        await act.Should().ThrowAsync<OperationCanceledException>(
            "租户级故障隔离不能把宿主停机信号转换成成功完成");
    }

    /// <summary>构造租户（最小必填字段）</summary>
    private static Tenant MakeTenant(Guid id, TenantStatus status) => new()
    {
        Id = id, Name = $"T-{id:N}".Substring(0, 10), Slug = $"s-{id:N}".Substring(0, 10),
        Plan = TenantPlan.Professional, Status = status, MaxDevices = 10
    };

    /// <summary>构造一条已逾期的 Medium 工单（创建于 30 小时前，状态 PendingDispatch）</summary>
    private static WorkOrder MakeOverdueWorkOrder(Guid tenantId, WorkOrderPriority priority) => new()
    {
        TenantId = tenantId,
        WorkOrderCode = $"WO-{tenantId:N}".Substring(0, 12),
        Title = "测试工单",
        Type = WorkOrderType.Corrective,
        Status = WorkOrderStatus.PendingDispatch,
        Priority = priority,
        CreatedAt = DateTime.UtcNow.AddHours(-30),
    };

    /// <summary>复刻后台 HostedService 中 ITenantContext 的 DI 回退：空租户上下文。</summary>
    private sealed class BackgroundTenantContext : ITenantContext
    {
        public Guid TenantId => Guid.Empty;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
