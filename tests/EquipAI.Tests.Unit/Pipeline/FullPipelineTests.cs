using System.Diagnostics;
using EquipAI.Application.Alerts;
using EquipAI.Application.Alerts.Evaluators;
using EquipAI.Application.Alerts.Handlers;
using EquipAI.Application.Analysis;
using EquipAI.Application.Analysis.Handlers;
using EquipAI.Application.Eventing;
using EquipAI.Application.Telemetry;
using EquipAI.Application.WorkOrders.Handlers;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace EquipAI.Tests.Unit.Pipeline;

/// <summary>
/// 端到端流水线测试：验证 MQTT 遥测数据 → 告警评估 → 告警触发 → 根因分析 → 工单自动创建
/// 使用 InMemory 数据库 + 真实服务（模拟 LLM 和数据质量服务），在进程内完成完整数据流验证
/// 每个测试方法使用独立的 PipelineFixture 确保完全隔离
/// </summary>
public class FullPipelineTests
{
    /// <summary>
    /// 验证完整流水线（从 TelemetryReceivedEvent 开始）：
    /// 1. 发布 TelemetryReceivedEvent（模拟 TelemetryService 写入后的输出）
    /// 2. 告警评估服务匹配温度 > 90 的规则并创建 Alert
    /// 3. 根因分析处理器调用 LLM 并创建 Analysis
    /// 4. 工单自动创建处理器生成 WorkOrder
    /// 5. 工单分析更新处理器将分析结果回填到工单
    ///
    /// 注意：跳过 TelemetryService 的 InMemory DB 写入步骤，
    /// 因为 DeviceTelemetry 是 keyless entity，InMemory Provider 对其支持有限
    /// </summary>
    [Fact]
    public async Task 完整流水线_温度超标_应触发告警分析并创建工单()
    {
        await using var fixture = new PipelineFixture();

        // ====== 执行 ======
        // 直接发布 TelemetryReceivedEvent（模拟 MQTT 遥测数据接收后的输出）
        await fixture.EventBus.PublishAsync(new TelemetryReceivedEvent(
            EventId: Guid.NewGuid(), OccurredAt: DateTime.UtcNow,
            TenantId: fixture.TenantId, DeviceId: fixture.DeviceId,
            Metric: "temperature", Value: 100.0,
            Timestamp: DateTime.UtcNow, Quality: "good"));

        // 等待告警创建
        var alertFound = await fixture.WaitForCountAsync<Alert>(
            q => q.Where(a => a.DeviceId == fixture.DeviceId), minCount: 1, timeoutMs: 8000);
        alertFound.Should().BeTrue("应在超时前检测到告警创建");

        // 等待工单创建
        var woFound = await fixture.WaitForCountAsync<WorkOrder>(
            q => q.Where(wo => wo.DeviceId == fixture.DeviceId), minCount: 1, timeoutMs: 6000);
        woFound.Should().BeTrue("应在超时前检测到工单创建");

        // ====== 验证 ======

        // 1. 验证告警已创建
        var alerts = await fixture.QueryAsync(db =>
            db.Alerts.Where(a => a.DeviceId == fixture.DeviceId && a.Metric == "temperature").ToListAsync());
        alerts.Should().ContainSingle("应创建一条温度告警");
        var alert = alerts[0];
        alert.Severity.Should().Be(AlertSeverity.Critical);
        alert.Status.Should().Be(AlertStatus.Active);
        alert.Value.Should().Be(100m);
        alert.Threshold.Should().Be(90m);
        alert.RuleId.Should().Be(fixture.AlertRuleId);
        alert.AlertCode.Should().StartWith("ALT-DEV-001-temperature-");

        // 2. 验证根因分析已完成
        var analysisFound = await fixture.WaitForCountAsync<Core.Entities.Analysis>(
            q => q.Where(a => a.AlertId == alert.Id), minCount: 1, timeoutMs: 5000);

        var analyses = await fixture.QueryAsync(db =>
            db.Analyses.Where(a => a.AlertId == alert.Id).ToListAsync());
        analyses.Should().ContainSingle("应为该告警执行一次根因分析");
        var analysis = analyses[0];
        // 无基线数据且样本不足 → 降级到 L1 LLM 诊断
        analysis.Level.Should().Be(AnalysisLevel.L1);
        analysis.Status.Should().Be(AnalysisStatus.Completed);
        analysis.Confidence.Should().BeGreaterThan(0);
        analysis.RootCause.Should().NotBeNullOrEmpty("LLM 应返回根因描述");
        analysis.Suggestion.Should().NotBeNullOrEmpty("LLM 应返回建议措施");
        analysis.DeviceId.Should().Be(fixture.DeviceId);

        // 3. 验证工单已自动创建
        var workOrders = await fixture.QueryAsync(db =>
            db.WorkOrders.Where(wo => wo.DeviceId == fixture.DeviceId && wo.AlertId == alert.Id).ToListAsync());
        workOrders.Should().ContainSingle("应为该告警自动创建一条工单");
        var workOrder = workOrders[0];
        workOrder.Type.Should().Be(WorkOrderType.Corrective);
        workOrder.Priority.Should().Be(WorkOrderPriority.Critical, "告警级别 Critical 应映射为工单优先级 Critical");
        workOrder.Status.Should().Be(WorkOrderStatus.PendingDispatch);
        workOrder.TenantId.Should().Be(fixture.TenantId);
        workOrder.WorkOrderCode.Should().MatchRegex(@"^WO-\d{8}-\d{4}$", "工单编码格式应为 WO-{yyyyMMdd}-{4位序号}");
        workOrder.Title.Should().Contain("temperature").And.Contain("异常");

        // 4. 验证分析结果已回填到工单
        var backfillFound = await fixture.WaitForConditionAsync(async () =>
        {
            var wo = await fixture.QueryAsync(db =>
                db.WorkOrders.Where(w => w.Id == workOrder.Id).FirstOrDefaultAsync());
            return wo?.AnalysisId != null;
        }, timeoutMs: 5000);

        var refreshedWorkOrder = await fixture.QueryAsync(db =>
            db.WorkOrders.Where(w => w.Id == workOrder.Id).FirstOrDefaultAsync());
        refreshedWorkOrder.Should().NotBeNull();
        refreshedWorkOrder!.AnalysisId.Should().Be(analysis.Id, "工单应关联到分析结果");
        refreshedWorkOrder.RootCause.Should().NotBeNullOrEmpty("分析结果应回填到工单的根因字段");
    }

    /// <summary>
    /// 直接发布 TelemetryReceivedEvent 验证告警评估路径
    /// 绕过 TelemetryService 的数据库写入，验证事件总线 → 告警评估 → 告警创建
    /// </summary>
    [Fact]
    public async Task 直接发布遥测事件_应创建告警()
    {
        await using var fixture = new PipelineFixture();

        // 直接发布 TelemetryReceivedEvent
        await fixture.EventBus.PublishAsync(new TelemetryReceivedEvent(
            EventId: Guid.NewGuid(), OccurredAt: DateTime.UtcNow,
            TenantId: fixture.TenantId, DeviceId: fixture.DeviceId,
            Metric: "temperature", Value: 100.0,
            Timestamp: DateTime.UtcNow, Quality: "good"));

        var alertFound = await fixture.WaitForCountAsync<Alert>(
            q => q.Where(a => a.DeviceId == fixture.DeviceId), minCount: 1, timeoutMs: 8000);
        alertFound.Should().BeTrue("直接发布遥测事件后应创建告警");
    }

    /// <summary>
    /// 验证正常值不触发告警：温度=50 低于阈值90，不应产生任何告警和工单
    /// </summary>
    [Fact]
    public async Task 正常温度_不应触发告警()
    {
        await using var fixture = new PipelineFixture();

        await fixture.TelemetryService.EnqueueAsync(
            fixture.TenantId, fixture.DeviceId,
            "temperature", 50.0,
            DateTime.UtcNow, "good", "mqtt");

        await fixture.TelemetryService.FlushAsync();
        await Task.Delay(3000);

        var alertCount = await fixture.CountAsync<Alert>(q => q.Where(a => a.DeviceId == fixture.DeviceId));
        alertCount.Should().Be(0, "温度=50 未超过阈值90，不应创建告警");

        var woCount = await fixture.CountAsync<WorkOrder>(q => q.Where(wo => wo.DeviceId == fixture.DeviceId));
        woCount.Should().Be(0, "无告警则不应创建工单");
    }

    /// <summary>
    /// 验证禁用自动创建工单的规则不会产生工单
    /// </summary>
    [Fact]
    public async Task 规则未启用自动工单_应仅创建告警不创建工单()
    {
        await using var fixture = new PipelineFixture();

        // 修改规则：禁用自动创建工单
        await fixture.QueryAsync<bool>(async db =>
        {
            var rule = await db.AlertRules.FindAsync(fixture.AlertRuleId);
            rule!.AutoCreateWorkorder = false;
            await db.SaveChangesAsync();
            return true;
        });

        await fixture.EventBus.PublishAsync(new TelemetryReceivedEvent(
            EventId: Guid.NewGuid(), OccurredAt: DateTime.UtcNow,
            TenantId: fixture.TenantId, DeviceId: fixture.DeviceId,
            Metric: "temperature", Value: 95.0,
            Timestamp: DateTime.UtcNow, Quality: "good"));

        var alertFound = await fixture.WaitForCountAsync<Alert>(
            q => q.Where(a => a.DeviceId == fixture.DeviceId), minCount: 1, timeoutMs: 8000);
        alertFound.Should().BeTrue("应创建告警");

        await Task.Delay(2000);

        var woCount = await fixture.CountAsync<WorkOrder>(q => q.Where(wo => wo.DeviceId == fixture.DeviceId));
        woCount.Should().Be(0, "规则禁用了自动创建工单，不应产生工单");
    }

    /// <summary>
    /// 验证 Critical 级别告警正确映射为工单优先级
    /// </summary>
    [Fact]
    public async Task Critical告警应映射为紧急工单()
    {
        await using var fixture = new PipelineFixture();

        var alertId = Guid.NewGuid();
        await fixture.EventBus.PublishAsync(new AlertTriggeredEvent(
            EventId: Guid.NewGuid(), OccurredAt: DateTime.UtcNow,
            TenantId: fixture.TenantId, AlertId: alertId,
            DeviceId: fixture.DeviceId, RuleId: fixture.AlertRuleId,
            Metric: "temperature", Value: 100.0, Severity: "critical"));

        var found = await fixture.WaitForCountAsync<WorkOrder>(
            q => q.Where(wo => wo.AlertId == alertId), minCount: 1, timeoutMs: 5000);
        found.Should().BeTrue("Critical 告警应创建一条工单");

        var workOrders = await fixture.QueryAsync(db =>
            db.WorkOrders.Where(wo => wo.AlertId == alertId).ToListAsync());
        workOrders.Should().ContainSingle();
        workOrders[0].Priority.Should().Be(WorkOrderPriority.Critical);
    }

    /// <summary>
    /// 验证 High 级别告警正确映射为工单优先级
    /// </summary>
    [Fact]
    public async Task High告警应映射为高优先级工单()
    {
        await using var fixture = new PipelineFixture();

        var alertId = Guid.NewGuid();
        await fixture.EventBus.PublishAsync(new AlertTriggeredEvent(
            EventId: Guid.NewGuid(), OccurredAt: DateTime.UtcNow,
            TenantId: fixture.TenantId, AlertId: alertId,
            DeviceId: fixture.DeviceId, RuleId: fixture.AlertRuleId,
            Metric: "pressure", Value: 95.0, Severity: "high"));

        var found = await fixture.WaitForCountAsync<WorkOrder>(
            q => q.Where(wo => wo.AlertId == alertId), minCount: 1, timeoutMs: 5000);
        found.Should().BeTrue("High 告警应创建一条工单");

        var workOrders = await fixture.QueryAsync(db =>
            db.WorkOrders.Where(wo => wo.AlertId == alertId).ToListAsync());
        workOrders.Should().ContainSingle();
        workOrders[0].Priority.Should().Be(WorkOrderPriority.High);
    }

    /// <summary>
    /// 验证告警聚合防风暴：30 分钟窗口内第 2 次告警应更新而非创建新告警
    /// </summary>
    [Fact]
    public async Task 告警聚合_第二次超标应更新告警而非创建新告警()
    {
        await using var fixture = new PipelineFixture();

        // 第一次发送温度超标数据
        await fixture.EventBus.PublishAsync(new TelemetryReceivedEvent(
            EventId: Guid.NewGuid(), OccurredAt: DateTime.UtcNow,
            TenantId: fixture.TenantId, DeviceId: fixture.DeviceId,
            Metric: "temperature", Value: 100.0,
            Timestamp: DateTime.UtcNow, Quality: "good"));

        var firstFound = await fixture.WaitForCountAsync<Alert>(
            q => q.Where(a => a.DeviceId == fixture.DeviceId), minCount: 1, timeoutMs: 8000);
        firstFound.Should().BeTrue("第一次告警应创建");

        // 第二次发送温度超标数据（同一设备同一指标）
        await fixture.EventBus.PublishAsync(new TelemetryReceivedEvent(
            EventId: Guid.NewGuid(), OccurredAt: DateTime.UtcNow,
            TenantId: fixture.TenantId, DeviceId: fixture.DeviceId,
            Metric: "temperature", Value: 105.0,
            Timestamp: DateTime.UtcNow, Quality: "good"));
        await Task.Delay(3000);

        // 验证只有一条告警（第 2 次是更新而非创建）
        var alerts = await fixture.QueryAsync(db =>
            db.Alerts.Where(a => a.DeviceId == fixture.DeviceId && a.Metric == "temperature").ToListAsync());
        alerts.Should().ContainSingle("第 2 次告警应更新已有告警而非创建新告警");
        alerts[0].Value.Should().Be(105m, "告警值应被更新为最新的 105");
    }

    /// <summary>
    /// 测试用租户上下文，提供固定的租户 ID
    /// </summary>
    private sealed class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }

    /// <summary>
    /// 测试夹具，为每个测试方法创建完全隔离的 DI 容器和数据库。
    /// 注册所有真实服务（LLM 使用 Mock），手动管理 EventBus 生命周期。
    /// </summary>
    private sealed class PipelineFixture : IAsyncDisposable
    {
        private readonly ServiceProvider _serviceProvider;

        public Guid TenantId { get; }
        public Guid DeviceId { get; }
        public Guid AlertRuleId { get; }
        public InMemoryEventBus EventBus { get; }
        public TelemetryService TelemetryService { get; }

        public PipelineFixture()
        {
            TenantId = Guid.NewGuid();
            DeviceId = Guid.NewGuid();
            AlertRuleId = Guid.NewGuid();
            var dbName = $"PipelineTest_{Guid.NewGuid()}";

            var services = new ServiceCollection();

            // InMemory 数据库（同一 dbName 共享数据）
            services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase(dbName));
            services.AddDbContextFactory<AppDbContext>(options => options.UseInMemoryDatabase(dbName));

            // 租户上下文
            var tenantContext = new TestTenantContext(TenantId);
            services.AddScoped<ITenantContext>(_ => tenantContext);

            // 日志
            services.AddLogging(builder => builder.SetMinimumLevel(LogLevel.Debug));

            // 内存缓存
            services.AddMemoryCache();

            // 模拟 LLM 服务
            var llmMock = new Mock<ILLMService>();
            llmMock.Setup(x => x.AnalyzeAsync(It.IsAny<LLMRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new LLMResponse(
                    Content: """{"rootCause":"温度传感器可能故障或冷却系统失效","suggestion":"检查温度传感器接线和冷却液液位","confidence":0.75}""",
                    Confidence: 0.75, Success: true, ErrorMessage: null));
            services.AddSingleton(llmMock.Object);

            // 数据质量服务
            services.AddSingleton<IDataQualityService, DataQualityService>();

            // 告警评估器
            services.AddSingleton<IAlertRuleEvaluator, ThresholdEvaluator>();
            services.AddSingleton<IAlertRuleEvaluator, CombinedEvaluator>();
            services.AddSingleton<IAlertRuleEvaluator, BaselineEvaluator>();

            // 告警聚合器
            services.AddSingleton<IAlertAggregator, AlertAggregator>();

            // 业务服务
            services.AddScoped<IAlertEvaluationService, AlertEvaluationService>();
            services.AddScoped<IAnalysisService, RootCauseAnalysisEngine>();

            // 事件处理器
            services.AddScoped<TelemetryEventHandler>();
            services.AddScoped<RootCauseAnalysisHandler>();
            services.AddScoped<WorkOrderAutoCreateHandler>();
            services.AddScoped<WorkOrderAnalysisHandler>();

            // 注册 EventBus 为 Singleton（使用工厂方法延迟创建）
            // 处理器通过 DI 注入 IEventBus，所以必须注册到 DI 容器中
            InMemoryEventBus? capturedBus = null;
            services.AddSingleton<IEventBus>(sp =>
            {
                var logger = sp.GetRequiredService<ILogger<InMemoryEventBus>>();
                capturedBus = new InMemoryEventBus(sp, logger);
                return capturedBus;
            });

            _serviceProvider = services.BuildServiceProvider();

            // 触发 EventBus 创建（Singleton 在首次请求时创建）
            EventBus = (InMemoryEventBus)_serviceProvider.GetRequiredService<IEventBus>();
            EventBus.Subscribe<TelemetryReceivedEvent, TelemetryEventHandler>();
            EventBus.Subscribe<AlertTriggeredEvent, RootCauseAnalysisHandler>();
            EventBus.Subscribe<AlertTriggeredEvent, WorkOrderAutoCreateHandler>();
            EventBus.Subscribe<AnalysisCompletedEvent, WorkOrderAnalysisHandler>();

            // 遥测服务
            var telemetryLogger = _serviceProvider.GetRequiredService<ILogger<TelemetryService>>();
            TelemetryService = new TelemetryService(
                _serviceProvider.GetRequiredService<IServiceScopeFactory>(),
                EventBus, telemetryLogger);

            SeedTestData();
        }

        private void SeedTestData()
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            db.Tenants.Add(new Tenant
            {
                Id = TenantId, Name = "测试租户", Slug = "test",
                Plan = TenantPlan.Professional, IsolationMode = TenantIsolationMode.Shared,
                MaxDevices = 100, IsActive = true
            });
            db.Devices.Add(new Device
            {
                Id = DeviceId, TenantId = TenantId, DeviceCode = "DEV-001",
                Name = "1号电机", Type = "电机", Status = DeviceStatus.Online, HealthScore = 85m
            });
            db.AlertRules.Add(new AlertRule
            {
                Id = AlertRuleId, TenantId = TenantId, Name = "高温告警规则",
                Metric = "temperature", RuleType = RuleType.Threshold, Operator = ">",
                Threshold = 90m, Severity = AlertSeverity.Critical,
                Enabled = true, AutoCreateWorkorder = true
            });
            db.SaveChanges();
        }

        /// <summary>
        /// 通过独立作用域查询数据库
        /// </summary>
        public async Task<T> QueryAsync<T>(Func<AppDbContext, Task<T>> query)
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            return await query(db);
        }

        /// <summary>
        /// 统计符合条件的实体数量
        /// </summary>
        public async Task<int> CountAsync<T>(Func<DbSet<T>, IQueryable<T>> filter) where T : BaseEntity
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            return await filter(db.Set<T>()).CountAsync();
        }

        /// <summary>
        /// 轮询等待，直到指定实体的计数达到最小值或超时
        /// </summary>
        public async Task<bool> WaitForCountAsync<T>(
            Func<DbSet<T>, IQueryable<T>> filter, int minCount = 1, int timeoutMs = 5000)
            where T : BaseEntity
        {
            var deadline = DateTime.UtcNow + TimeSpan.FromMilliseconds(timeoutMs);
            await Task.Delay(300); // 等待事件进入总线

            while (DateTime.UtcNow < deadline)
            {
                var count = await CountAsync(filter);
                if (count >= minCount)
                    return true;
                await Task.Delay(200);
            }
            return false;
        }

        /// <summary>
        /// 轮询等待自定义条件
        /// </summary>
        public async Task<bool> WaitForConditionAsync(Func<Task<bool>> condition, int timeoutMs = 5000)
        {
            var deadline = DateTime.UtcNow + TimeSpan.FromMilliseconds(timeoutMs);
            await Task.Delay(300);

            while (DateTime.UtcNow < deadline)
            {
                if (await condition())
                    return true;
                await Task.Delay(200);
            }
            return false;
        }

        public async ValueTask DisposeAsync()
        {
            try { TelemetryService.Dispose(); } catch { /* 忽略 */ }
            try { EventBus.Dispose(); } catch { /* 忽略 */ }
            await _serviceProvider.DisposeAsync();
        }
    }
}
