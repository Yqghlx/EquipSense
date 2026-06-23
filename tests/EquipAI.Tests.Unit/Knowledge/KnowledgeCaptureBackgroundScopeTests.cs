using EquipAI.Application.Knowledge;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace EquipAI.Tests.Unit.Knowledge;

/// <summary>
/// 知识沉淀后台 scope 回归测试。
///
/// 生产链路：工单关闭 → <c>WorkOrderStatusChangedEvent</c> → <c>KnowledgeCaptureHandler</c>
/// （后台事件处理器，无 HttpContext）→ <c>KnowledgeCaptureService.ProcessWorkOrderClosedAsync</c>。
/// 后台 scope 中 <c>ITenantContext</c> 走 DI 回退 → <c>TenantId == Guid.Empty</c>。
/// 若服务内工单/设备/分析查询沿用默认全局租户过滤器，会恒查不到真实租户的数据
/// （已实测确认 EF Core 8 的 <see cref="Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FindAsync"/>
/// 在实体未追踪时同样应用全局过滤器）→ 知识沉淀（故障案例 + 候选规则）整体失效。
///
/// InMemory provider 不强制过滤器，必须用 SQLite 复刻生产行为。
/// </summary>
public class KnowledgeCaptureBackgroundScopeTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private ServiceProvider _sp = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseSqlite(_connection));
        // 复刻后台 scope：ITenantContext 回退为空租户
        services.AddScoped<ITenantContext>(_ => new BackgroundTenantContext());
        services.AddScoped<KnowledgeCaptureService>();
        services.AddScoped<ILLMService>(_ => Mock.Of<ILLMService>());
        services.AddScoped<IAuditLogService>(_ => Mock.Of<IAuditLogService>());
        services.AddLogging();
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
    public async Task ProcessWorkOrderClosedAsync_后台scope应按事件租户沉淀故障案例()
    {
        var tenantId = Guid.NewGuid();
        var deviceId = Guid.NewGuid();
        var workOrderId = Guid.NewGuid();

        // seed 真实租户的设备 + 已关闭工单（ActualHours 超过 0.5h 沉淀阈值）
        // 写入不受查询过滤器影响，故即便用 Guid.Empty 上下文也能正确写入显式 TenantId
        using (var seedScope = _sp.CreateScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Tenants.Add(new Tenant
            {
                Id = tenantId, Name = "T", Slug = "t", Plan = TenantPlan.Professional,
                Status = TenantStatus.Active, MaxDevices = 10
            });
            db.Devices.Add(new Device
            {
                Id = deviceId, TenantId = tenantId, Type = "电机",
                DeviceCode = "M-1", Name = "测试电机", Status = DeviceStatus.Online
            });
            db.WorkOrders.Add(new WorkOrder
            {
                Id = workOrderId, TenantId = tenantId, DeviceId = deviceId,
                Title = "电机过热", Status = WorkOrderStatus.Closed, Type = WorkOrderType.Corrective,
                ActualHours = 2.0, RootCause = "轴承磨损", ExecutionReport = "更换轴承",
                AnalysisId = null // 不触发候选规则生成，聚焦验证故障案例沉淀
            });
            await db.SaveChangesAsync();
        }

        // 从 DI 解析服务：其内部的 _scopeFactory 会创建后台 scope（Guid.Empty 租户上下文）
        KnowledgeCaptureService service;
        using (var scope = _sp.CreateScope())
        {
            service = scope.ServiceProvider.GetRequiredService<KnowledgeCaptureService>();
            await service.ProcessWorkOrderClosedAsync(tenantId, workOrderId, CancellationToken.None);
        }

        // 关键回归：应生成该租户的故障案例。修复前因后台 Guid.Empty 过滤查不到工单 → 无案例 → 失败。
        using var assertScope = _sp.CreateScope();
        var assertDb = assertScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var faultCases = await assertDb.FaultCases
            .IgnoreQueryFilters()
            .Where(f => f.SourceWorkorderId == workOrderId && f.TenantId == tenantId)
            .ToListAsync();

        faultCases.Should().ContainSingle("后台 scope 必须能按事件租户查到工单并沉淀故障案例");
        faultCases[0].DeviceType.Should().Be("电机", "关联设备查询同样需绕过失效的租户过滤器");
        faultCases[0].RootCause.Should().Be("轴承磨损");
    }

    /// <summary>复刻后台事件处理器中 ITenantContext 的 DI 回退：空租户上下文。</summary>
    private sealed class BackgroundTenantContext : ITenantContext
    {
        public Guid TenantId => Guid.Empty;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
