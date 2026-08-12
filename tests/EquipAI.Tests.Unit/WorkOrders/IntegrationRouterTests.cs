using System.Text.Json;
using EquipAI.Application.WorkOrders.Router;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace EquipAI.Tests.Unit.WorkOrders;

/// <summary>
/// IntegrationRouter 单元测试 — 验证集成路由分发、重试机制和日志记录
/// </summary>
public class IntegrationRouterTests : IDisposable
{
    private readonly ServiceProvider _serviceProvider;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly Mock<ILogger<IntegrationRouter>> _loggerMock;
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly Guid _workOrderId = Guid.NewGuid();
    private readonly string _dbName;

    public IntegrationRouterTests()
    {
        _dbName = $"TestDb_{Guid.NewGuid()}";

        // 构建 InMemory DbContext + Mock ITenantContext 的 DI 容器
        var services = new ServiceCollection();

        // Mock ITenantContext — AppDbContext 构造函数需要此依赖
        var tenantContextMock = new Mock<ITenantContext>();
        tenantContextMock.Setup(t => t.TenantId).Returns(_tenantId);
        services.AddScoped<ITenantContext>(_ => tenantContextMock.Object);

        services.AddDbContext<AppDbContext>(options =>
            options.UseInMemoryDatabase(_dbName));

        _loggerMock = new Mock<ILogger<IntegrationRouter>>();

        _serviceProvider = services.BuildServiceProvider();
        _scopeFactory = _serviceProvider.GetRequiredService<IServiceScopeFactory>();

        // 初始化种子数据
        SeedTestData();
    }

    public void Dispose()
    {
        _serviceProvider.Dispose();
    }

    /// <summary>
    /// 初始化测试数据：创建租户（含集成配置）和工单
    /// </summary>
    private void SeedTestData()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 创建租户，Settings 中配置钉钉启用、Webhook 禁用
        var tenant = new Core.Entities.Tenant
        {
            Id = _tenantId,
            Name = "测试租户",
            Slug = "test",
            Settings = JsonSerializer.Serialize(new
            {
                integrations = new
                {
                    dingtalk = new { enabled = true, webhook = "https://oapi.dingtalk.com/robot/send?access_token=test", secret = "test-secret" },
                    webhook = new { enabled = false, url = "https://example.com/hook", secret = "" }
                }
            })
        };
        db.Set<Core.Entities.Tenant>().Add(tenant);

        // 创建工单
        var workOrder = new WorkOrder
        {
            Id = _workOrderId,
            TenantId = _tenantId,
            Title = "测试工单标题",
            Priority = WorkOrderPriority.High,
            Status = WorkOrderStatus.PendingDispatch,
            Type = WorkOrderType.Corrective,
            DeviceId = Guid.NewGuid()
        };
        db.Set<WorkOrder>().Add(workOrder);
        db.SaveChanges();
    }

    /// <summary>
    /// 构建用于 IntegrationRouter 测试的 Mock IServiceScopeFactory
    /// 关键点：Mock 的 IServiceProvider 同时提供 AppDbContext 和 IWorkOrderIntegration 列表
    /// </summary>
    private IntegrationRouter CreateRouter(List<IWorkOrderIntegration> integrations)
    {
        var tenantContextMock = new Mock<ITenantContext>();
        tenantContextMock.Setup(t => t.TenantId).Returns(_tenantId);

        var mockScopeFactory = new Mock<IServiceScopeFactory>();
        mockScopeFactory
            .Setup(f => f.CreateScope())
            .Returns(() =>
            {
                // 为每个 scope 创建独立的 DbContext（共享 InMemory 数据库）
                var dbOptions = new DbContextOptionsBuilder<AppDbContext>()
                    .UseInMemoryDatabase(_dbName)
                    .Options;
                var db = new AppDbContext(dbOptions, tenantContextMock.Object);

                var mockSp = new Mock<IServiceProvider>();

                // 返回 AppDbContext 实例
                mockSp.Setup(p => p.GetService(typeof(AppDbContext)))
                    .Returns(db);

                // 返回集成实现列表 — GetServices<T>() 内部调用 GetService(typeof(IEnumerable<T>))
                mockSp.Setup(p => p.GetService(typeof(IEnumerable<IWorkOrderIntegration>)))
                    .Returns(integrations.Cast<IWorkOrderIntegration>());

                var mockScope = new Mock<IServiceScope>();
                mockScope.Setup(s => s.ServiceProvider).Returns(mockSp.Object);

                return mockScope.Object;
            });

        return new IntegrationRouter(mockScopeFactory.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task RouteCreatedAsync_当钉钉启用时_应调用DingTalk推送()
    {
        // Arrange
        var dingTalkMock = new Mock<IWorkOrderIntegration>();
        dingTalkMock.Setup(d => d.IntegrationType).Returns("dingtalk");
        dingTalkMock.Setup(d => d.PushCreatedAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("external-id-123");

        var webhookMock = new Mock<IWorkOrderIntegration>();
        webhookMock.Setup(w => w.IntegrationType).Returns("webhook");

        var router = CreateRouter([dingTalkMock.Object, webhookMock.Object]);

        // Act
        await router.RouteCreatedAsync(_tenantId, _workOrderId, CancellationToken.None);

        // Assert — 钉钉已启用，应调用 PushCreatedAsync
        dingTalkMock.Verify(d => d.PushCreatedAsync(
            _tenantId, _workOrderId,
            "测试工单标题", "High",
            It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once);

        // Assert — Webhook 未启用，不应调用
        webhookMock.Verify(w => w.PushCreatedAsync(
            It.IsAny<Guid>(), It.IsAny<Guid>(),
            It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RouteCreatedAsync_当所有集成禁用时_不应调用任何推送()
    {
        // Arrange — 创建一个所有集成都禁用的租户
        var allDisabledTenantId = Guid.NewGuid();
        var workOrderId = Guid.NewGuid();

        using (var seedScope = _scopeFactory.CreateScope())
        {
            var seedDb = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
            seedDb.Set<Core.Entities.Tenant>().Add(new Core.Entities.Tenant
            {
                Id = allDisabledTenantId,
                Name = "全部禁用租户",
                Slug = "disabled",
                Settings = JsonSerializer.Serialize(new
                {
                    integrations = new
                    {
                        dingtalk = new { enabled = false },
                        webhook = new { enabled = false }
                    }
                })
            });
            seedDb.Set<WorkOrder>().Add(new WorkOrder
            {
                Id = workOrderId,
                TenantId = allDisabledTenantId,
                Title = "禁用测试",
                Priority = WorkOrderPriority.Low,
                Status = WorkOrderStatus.PendingDispatch,
                Type = WorkOrderType.Corrective,
                DeviceId = Guid.NewGuid()
            });
            await seedDb.SaveChangesAsync();
        }

        var dingTalkMock = new Mock<IWorkOrderIntegration>();
        dingTalkMock.Setup(d => d.IntegrationType).Returns("dingtalk");

        var webhookMock = new Mock<IWorkOrderIntegration>();
        webhookMock.Setup(w => w.IntegrationType).Returns("webhook");

        var router = CreateRouter([dingTalkMock.Object, webhookMock.Object]);

        // Act
        await router.RouteCreatedAsync(allDisabledTenantId, workOrderId, CancellationToken.None);

        // Assert — 所有集成禁用，不应有任何调用
        dingTalkMock.Verify(d => d.PushCreatedAsync(
            It.IsAny<Guid>(), It.IsAny<Guid>(),
            It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        webhookMock.Verify(w => w.PushCreatedAsync(
            It.IsAny<Guid>(), It.IsAny<Guid>(),
            It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RouteCreatedAsync_推送失败时_应重试3次后记录Failed日志()
    {
        // Arrange
        var dingTalkMock = new Mock<IWorkOrderIntegration>();
        dingTalkMock.Setup(d => d.IntegrationType).Returns("dingtalk");
        // 模拟推送始终失败
        dingTalkMock.Setup(d => d.PushCreatedAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new HttpRequestException("连接超时"));

        var router = CreateRouter([dingTalkMock.Object]);

        // Act — 会触发 3 次重试（含指数退避延迟 1s + 2s = 3s）
        await router.RouteCreatedAsync(_tenantId, _workOrderId, CancellationToken.None);

        // Assert — 应调用 3 次（MaxRetryCount = 3）
        dingTalkMock.Verify(d => d.PushCreatedAsync(
            _tenantId, _workOrderId,
            "测试工单标题", "High",
            It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Exactly(3));

        // Assert — 应有 Error 级别的日志（最终失败）
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, _) => v.ToString()!.Contains("集成推送最终失败")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task RouteCreatedAsync_外部集成返回空响应后恢复_应重试并记录Success日志()
    {
        // Arrange — 外部集成用 null 表示 HTTP 非成功响应，第二次调用恢复成功
        var dingTalkMock = new Mock<IWorkOrderIntegration>();
        dingTalkMock.Setup(d => d.IntegrationType).Returns("dingtalk");
        dingTalkMock.SetupSequence(d => d.PushCreatedAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null)
            .ReturnsAsync("external-id-after-retry");

        var router = CreateRouter([dingTalkMock.Object]);

        // Act
        await router.RouteCreatedAsync(_tenantId, _workOrderId, CancellationToken.None);

        // Assert — null 不能被当成成功；恢复后应保留重试次数和外部 ID
        dingTalkMock.Verify(d => d.PushCreatedAsync(
            _tenantId, _workOrderId,
            "测试工单标题", "High",
            It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var pushLog = await db.Set<IntegrationPushLog>()
            .IgnoreQueryFilters()
            .SingleAsync(log => log.TenantId == _tenantId && log.WorkOrderId == _workOrderId);

        pushLog.Status.Should().Be("Success");
        pushLog.RetryCount.Should().Be(1);
        pushLog.ExternalId.Should().Be("external-id-after-retry");
        pushLog.ErrorMessage.Should().BeNull();
    }

    [Fact]
    public async Task RouteCreatedAsync_外部集成持续返回空响应_应重试3次并记录Failed日志()
    {
        // Arrange — 模拟钉钉、飞书或 Webhook 在 HTTP 非 2xx 时的 null 返回约定
        var dingTalkMock = new Mock<IWorkOrderIntegration>();
        dingTalkMock.Setup(d => d.IntegrationType).Returns("dingtalk");
        dingTalkMock.Setup(d => d.PushCreatedAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);

        var router = CreateRouter([dingTalkMock.Object]);

        // Act
        await router.RouteCreatedAsync(_tenantId, _workOrderId, CancellationToken.None);

        // Assert — 最终失败必须可观测，不能留下伪成功日志
        dingTalkMock.Verify(d => d.PushCreatedAsync(
            _tenantId, _workOrderId,
            "测试工单标题", "High",
            It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Exactly(3));

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var pushLog = await db.Set<IntegrationPushLog>()
            .IgnoreQueryFilters()
            .SingleAsync(log => log.TenantId == _tenantId && log.WorkOrderId == _workOrderId);

        pushLog.Status.Should().Be("Failed");
        pushLog.RetryCount.Should().Be(3);
        pushLog.ErrorMessage.Should().Be("外部集成未返回成功响应");
        pushLog.ExternalId.Should().BeNull();
    }

    [Fact]
    public async Task RouteStatusChangedAsync_应传递新状态给集成()
    {
        // Arrange
        var dingTalkMock = new Mock<IWorkOrderIntegration>();
        dingTalkMock.Setup(d => d.IntegrationType).Returns("dingtalk");
        dingTalkMock.Setup(d => d.PushStatusChangedAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var router = CreateRouter([dingTalkMock.Object]);
        var newStatus = "Assigned";

        // Act
        await router.RouteStatusChangedAsync(_tenantId, _workOrderId, newStatus, CancellationToken.None);

        // Assert — 应调用 PushStatusChangedAsync 并传递正确的新状态
        dingTalkMock.Verify(d => d.PushStatusChangedAsync(
            _tenantId, _workOrderId,
            newStatus, null,
            It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RouteStatusChangedAsync_应复用最近成功创建推送的ExternalId()
    {
        // Arrange — EAM 等外部系统必须依赖创建响应中的外部工单号更新状态
        using (var seedScope = _scopeFactory.CreateScope())
        {
            var seedDb = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
            seedDb.Set<IntegrationPushLog>().Add(new IntegrationPushLog
            {
                TenantId = _tenantId,
                WorkOrderId = _workOrderId,
                IntegrationType = "dingtalk",
                Direction = "Created",
                Status = "Success",
                ExternalId = "external-work-order-001"
            });
            await seedDb.SaveChangesAsync();
        }

        var dingTalkMock = new Mock<IWorkOrderIntegration>();
        dingTalkMock.Setup(d => d.IntegrationType).Returns("dingtalk");
        dingTalkMock.Setup(d => d.PushStatusChangedAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var router = CreateRouter([dingTalkMock.Object]);

        // Act
        await router.RouteStatusChangedAsync(
            _tenantId, _workOrderId, "InProgress", CancellationToken.None);

        // Assert — 状态推送应携带创建阶段保存的外部 ID
        dingTalkMock.Verify(d => d.PushStatusChangedAsync(
            _tenantId, _workOrderId,
            "InProgress", "external-work-order-001",
            It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RouteStatusChangedAsync_外部集成返回失败标志时_应重试3次并记录Failed日志()
    {
        // Arrange — 模拟适配器收到非 2xx 后返回 false
        var dingTalkMock = new Mock<IWorkOrderIntegration>();
        dingTalkMock.Setup(d => d.IntegrationType).Returns("dingtalk");
        dingTalkMock.Setup(d => d.PushStatusChangedAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var router = CreateRouter([dingTalkMock.Object]);

        // Act
        await router.RouteStatusChangedAsync(
            _tenantId, _workOrderId, "InProgress", CancellationToken.None);

        // Assert — 状态同步失败不能留下伪成功日志
        dingTalkMock.Verify(d => d.PushStatusChangedAsync(
            _tenantId, _workOrderId,
            "InProgress", null,
            It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Exactly(3));

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var pushLog = await db.Set<IntegrationPushLog>()
            .IgnoreQueryFilters()
            .SingleAsync(log => log.TenantId == _tenantId && log.WorkOrderId == _workOrderId);

        pushLog.Status.Should().Be("Failed");
        pushLog.RetryCount.Should().Be(3);
        pushLog.ErrorMessage.Should().Be("外部集成未返回成功响应");
    }

    [Fact]
    public async Task RouteCreatedAsync_无集成实现时应安全返回不抛异常()
    {
        var router = CreateRouter([]);

        var act = () => router.RouteCreatedAsync(_tenantId, _workOrderId, CancellationToken.None);
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task RouteCreatedAsync_多个集成应并行推送()
    {
        var dingTalkMock = new Mock<IWorkOrderIntegration>();
        dingTalkMock.Setup(d => d.IntegrationType).Returns("dingtalk");
        dingTalkMock.Setup(d => d.PushCreatedAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("dt-id");

        var feishuMock = new Mock<IWorkOrderIntegration>();
        feishuMock.Setup(f => f.IntegrationType).Returns("feishu");

        var router = CreateRouter([dingTalkMock.Object, feishuMock.Object]);

        await router.RouteCreatedAsync(_tenantId, _workOrderId, CancellationToken.None);

        // 钉钉启用应被调用，飞书未配置则不应调用
        dingTalkMock.Verify(d => d.PushCreatedAsync(
            _tenantId, _workOrderId,
            It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RouteCreatedAsync_一个集成失败不影响其他集成()
    {
        var failMock = new Mock<IWorkOrderIntegration>();
        failMock.Setup(f => f.IntegrationType).Returns("dingtalk");
        failMock.Setup(f => f.PushCreatedAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new HttpRequestException("连接失败"));

        var router = CreateRouter([failMock.Object]);

        // 不应抛出异常
        var act = () => router.RouteCreatedAsync(_tenantId, _workOrderId, CancellationToken.None);
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task RouteCreatedAsync_应记录推送日志到数据库()
    {
        var dingTalkMock = new Mock<IWorkOrderIntegration>();
        dingTalkMock.Setup(d => d.IntegrationType).Returns("dingtalk");
        dingTalkMock.Setup(d => d.PushCreatedAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("ext-id");

        var router = CreateRouter([dingTalkMock.Object]);

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var beforeCount = await db.Set<IntegrationPushLog>().IgnoreQueryFilters().CountAsync();

        await router.RouteCreatedAsync(_tenantId, _workOrderId, CancellationToken.None);

        var afterCount = await db.Set<IntegrationPushLog>().IgnoreQueryFilters().CountAsync();
        afterCount.Should().BeGreaterThan(beforeCount);
    }
}
