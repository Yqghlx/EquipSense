using EquipAI.Application.Alerts;
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

namespace EquipAI.Tests.Unit.Alerts;

/// <summary>
/// AlertEvaluationService 单元测试
/// 覆盖规则匹配、评估器调用、告警创建/更新/静默、事件发布等核心场景
/// </summary>
public class AlertEvaluationServiceTests : IAsyncDisposable
{
    private readonly ServiceProvider _sp;
    private readonly Guid _tenantId = Guid.NewGuid();

    public AlertEvaluationServiceTests()
    {
        // 每个测试使用独立的内存数据库，避免测试间数据污染
        var dbName = $"AlertEvalTest_{Guid.NewGuid()}";
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(dbName));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(_tenantId));
        services.AddLogging();
        _sp = services.BuildServiceProvider();
    }

    /// <summary>
    /// 从 DI 容器获取内存数据库实例
    /// </summary>
    private AppDbContext GetDb()
    {
        return _sp.GetRequiredService<AppDbContext>();
    }

    /// <summary>
    /// 创建 AlertEvaluationService 实例，手动 Mock 所有依赖
    /// 使用 IServiceScopeFactory 模式创建独立的 DbContext 作用域
    /// </summary>
    private (AlertEvaluationService service, Mock<IEventBus> eventBusMock, Mock<IAlertAggregator> aggregatorMock, List<Mock<IAlertRuleEvaluator>> evaluatorMocks)
        CreateService(AppDbContext db, params (RuleType ruleType, bool evaluateResult)[] evaluatorConfigs)
    {
        // 模拟 IServiceScopeFactory → IServiceScope → IServiceProvider → AppDbContext 链路
        var serviceProviderMock = new Mock<IServiceProvider>();
        serviceProviderMock.Setup(sp => sp.GetService(typeof(AppDbContext))).Returns(db);
        var scopeMock = new Mock<IServiceScope>();
        scopeMock.SetupGet(s => s.ServiceProvider).Returns(serviceProviderMock.Object);
        var scopeFactoryMock = new Mock<IServiceScopeFactory>();
        scopeFactoryMock.Setup(f => f.CreateScope()).Returns(scopeMock.Object);

        var eventBusMock = new Mock<IEventBus>();
        var aggregatorMock = new Mock<IAlertAggregator>();

        // 根据配置创建评估器 Mock 列表
        var evaluatorMocks = new List<Mock<IAlertRuleEvaluator>>();
        var evaluators = new List<IAlertRuleEvaluator>();

        foreach (var (ruleType, evaluateResult) in evaluatorConfigs)
        {
            var evaluatorMock = new Mock<IAlertRuleEvaluator>();
            evaluatorMock.SetupGet(e => e.RuleType).Returns(ruleType);
            evaluatorMock.Setup(e => e.Evaluate(
                    It.IsAny<double>(),
                    It.IsAny<AlertRule>(),
                    It.IsAny<DeviceContext>()))
                .Returns(evaluateResult);
            evaluatorMocks.Add(evaluatorMock);
            evaluators.Add(evaluatorMock.Object);
        }

        var loggerMock = new Mock<ILogger<AlertEvaluationService>>();

        var service = new AlertEvaluationService(
            scopeFactoryMock.Object,
            eventBusMock.Object,
            aggregatorMock.Object,
            evaluators,
            loggerMock.Object);

        return (service, eventBusMock, aggregatorMock, evaluatorMocks);
    }

    /// <summary>
    /// 创建标准告警规则实体
    /// </summary>
    private static AlertRule CreateAlertRule(
        Guid tenantId,
        string metric = "temperature",
        RuleType ruleType = RuleType.Threshold,
        AlertSeverity severity = AlertSeverity.High,
        Guid? deviceId = null,
        string? deviceType = null,
        bool enabled = true)
    {
        return new AlertRule
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Name = $"测试{ruleType}规则",
            Metric = metric,
            RuleType = ruleType,
            Severity = severity,
            Threshold = 90m,
            Operator = ">",
            Enabled = enabled,
            DeviceId = deviceId,
            DeviceType = deviceType,
        };
    }

    /// <summary>
    /// 创建设备实体并写入数据库
    /// </summary>
    private static async Task<Device> AddDeviceAsync(AppDbContext db, Guid tenantId, Guid deviceId, string deviceCode = "DEV-001")
    {
        var device = new Device
        {
            Id = deviceId,
            TenantId = tenantId,
            DeviceCode = deviceCode,
            Name = "测试设备",
            Type = "电机"
        };
        db.Devices.Add(device);
        await db.SaveChangesAsync();
        return device;
    }

    // ========================================================================
    // 测试用例
    // ========================================================================

    /// <summary>
    /// 测试 1：无匹配规则时，应安全返回不报错
    /// 验证：不发布事件，不创建告警
    /// </summary>
    [Fact]
    public async Task 无匹配规则_应安全返回不报错()
    {
        // 准备
        var db = GetDb();
        var (service, eventBusMock, _, _) = CreateService(db, (RuleType.Threshold, true));
        var context = new DeviceContext();

        // 执行：指标 "pressure" 无对应规则
        await service.EvaluateForDeviceAsync(
            _tenantId, Guid.NewGuid(), "电机",
            "pressure", 100.0, context);

        // 验证：事件总线不应被调用
        eventBusMock.Verify(
            e => e.PublishAsync(It.IsAny<IIntegrationEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);

        // 验证：数据库中无告警记录
        db.Alerts.Should().BeEmpty();
    }

    /// <summary>
    /// 测试 2：规则未触发时，不应创建告警
    /// 验证：评估器返回 false 时，不创建告警
    /// </summary>
    [Fact]
    public async Task 规则未触发_不应创建告警()
    {
        // 准备：评估器始终返回 false（未触发）
        var db = GetDb();
        var (service, _, aggregatorMock, _) = CreateService(db, (RuleType.Threshold, false));

        var rule = CreateAlertRule(_tenantId);
        db.AlertRules.Add(rule);
        await db.SaveChangesAsync();

        var context = new DeviceContext();

        // 执行
        await service.EvaluateForDeviceAsync(
            _tenantId, Guid.NewGuid(), "电机",
            "temperature", 50.0, context);

        // 验证：不应创建任何告警
        db.Alerts.Should().BeEmpty();

        // 验证：聚合器不应被调用（评估器返回 false 时跳过聚合）
        aggregatorMock.Verify(a => a.Evaluate(It.IsAny<Guid>(), It.IsAny<string>()), Times.Never);
    }

    /// <summary>
    /// 测试 3：规则触发且聚合器返回应创建时，应创建告警
    /// 验证：数据库中出现一条新的告警记录
    /// </summary>
    [Fact]
    public async Task 规则触发_应创建告警()
    {
        // 准备
        var db = GetDb();
        var deviceId = Guid.NewGuid();
        await AddDeviceAsync(db, _tenantId, deviceId);

        // 聚合器返回 (shouldCreate=true, shouldUpdate=false, silenced=false)
        var aggregatorMock = new Mock<IAlertAggregator>();
        aggregatorMock.Setup(a => a.Evaluate(deviceId, "temperature"))
            .Returns((true, false, false));

        var serviceProviderMock = new Mock<IServiceProvider>();
        serviceProviderMock.Setup(sp => sp.GetService(typeof(AppDbContext))).Returns(db);
        var scopeMock = new Mock<IServiceScope>();
        scopeMock.SetupGet(s => s.ServiceProvider).Returns(serviceProviderMock.Object);
        var scopeFactoryMock = new Mock<IServiceScopeFactory>();
        scopeFactoryMock.Setup(f => f.CreateScope()).Returns(scopeMock.Object);

        var evaluatorMock = new Mock<IAlertRuleEvaluator>();
        evaluatorMock.SetupGet(e => e.RuleType).Returns(RuleType.Threshold);
        evaluatorMock.Setup(e => e.Evaluate(It.IsAny<double>(), It.IsAny<AlertRule>(), It.IsAny<DeviceContext>()))
            .Returns(true);

        var eventBusMock = new Mock<IEventBus>();
        var loggerMock = new Mock<ILogger<AlertEvaluationService>>();

        var service = new AlertEvaluationService(
            scopeFactoryMock.Object, eventBusMock.Object, aggregatorMock.Object,
            new[] { evaluatorMock.Object }, loggerMock.Object);

        var rule = CreateAlertRule(_tenantId);
        db.AlertRules.Add(rule);
        await db.SaveChangesAsync();

        var context = new DeviceContext();

        // 执行
        await service.EvaluateForDeviceAsync(
            _tenantId, deviceId, "电机",
            "temperature", 95.0, context);

        // 验证：应创建 1 条告警
        db.Alerts.Should().HaveCount(1);
        var alert = db.Alerts.First();
        alert.DeviceId.Should().Be(deviceId);
        alert.Metric.Should().Be("temperature");
        alert.Value.Should().Be(95.0m);
        alert.RuleId.Should().Be(rule.Id);
        alert.Status.Should().Be(AlertStatus.Active);
        alert.Severity.Should().Be(AlertSeverity.High);
    }

    /// <summary>
    /// 测试 4：触发告警后，应通过事件总线发布 AlertTriggeredEvent
    /// 验证：事件总线 PublishAsync 被调用恰好 1 次
    /// </summary>
    [Fact]
    public async Task 触发后_应发布AlertTriggeredEvent()
    {
        // 准备
        var db = GetDb();
        var deviceId = Guid.NewGuid();
        await AddDeviceAsync(db, _tenantId, deviceId);

        var (service, eventBusMock, aggregatorMock, _) = CreateService(db, (RuleType.Threshold, true));
        aggregatorMock.Setup(a => a.Evaluate(deviceId, "temperature"))
            .Returns((true, false, false));

        var rule = CreateAlertRule(_tenantId);
        db.AlertRules.Add(rule);
        await db.SaveChangesAsync();

        var context = new DeviceContext();

        // 执行
        await service.EvaluateForDeviceAsync(
            _tenantId, deviceId, "电机",
            "temperature", 95.0, context);

        // 验证：应发布 1 次 AlertTriggeredEvent
        eventBusMock.Verify(
            e => e.PublishAsync(It.IsAny<AlertTriggeredEvent>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    /// <summary>
    /// 测试 5：聚合器返回静默时，应跳过告警创建
    /// 验证：不创建告警，不发布事件
    /// </summary>
    [Fact]
    public async Task 告警静默_应跳过()
    {
        // 准备
        var db = GetDb();
        var deviceId = Guid.NewGuid();

        var (service, eventBusMock, aggregatorMock, _) = CreateService(db, (RuleType.Threshold, true));
        // 聚合器返回 silenced=true
        aggregatorMock.Setup(a => a.Evaluate(deviceId, "temperature"))
            .Returns((false, false, true));

        var rule = CreateAlertRule(_tenantId);
        db.AlertRules.Add(rule);
        await db.SaveChangesAsync();

        var context = new DeviceContext();

        // 执行
        await service.EvaluateForDeviceAsync(
            _tenantId, deviceId, "电机",
            "temperature", 95.0, context);

        // 验证：静默模式下不创建告警
        db.Alerts.Should().BeEmpty();

        // 验证：静默模式下不发布事件
        eventBusMock.Verify(
            e => e.PublishAsync(It.IsAny<IIntegrationEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    /// <summary>
    /// 测试 6：聚合器返回应更新时，应更新已有活跃告警的值和触发计数
    /// 验证：已有告警的 Value 更新为新值，TriggerCount 递增
    /// </summary>
    [Fact]
    public async Task 告警更新_应更新已有告警()
    {
        // 准备
        var db = GetDb();
        var deviceId = Guid.NewGuid();
        var rule = CreateAlertRule(_tenantId);

        // 预先在数据库中创建一条活跃告警（模拟第 1 次触发后的状态）
        var existingAlert = new Alert
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantId,
            AlertCode = "ALT-DEV001-temperature-20260101120000",
            RuleId = rule.Id,
            DeviceId = deviceId,
            Severity = AlertSeverity.High,
            Status = AlertStatus.Active,
            Metric = "temperature",
            Value = 95.0m,
            Threshold = 90m,
            TriggerCount = 1,
            OccurredAt = DateTime.UtcNow.AddMinutes(-5)
        };
        db.Alerts.Add(existingAlert);
        db.AlertRules.Add(rule);
        await db.SaveChangesAsync();

        // 聚合器返回 shouldUpdate=true（第 2 次触发）
        var (service, _, aggregatorMock, _) = CreateService(db, (RuleType.Threshold, true));
        aggregatorMock.Setup(a => a.Evaluate(deviceId, "temperature"))
            .Returns((false, true, false));

        var context = new DeviceContext();

        // 执行
        await service.EvaluateForDeviceAsync(
            _tenantId, deviceId, "电机",
            "temperature", 98.5, context);

        // 验证：不应新增告警（总数仍为 1）
        db.Alerts.Should().HaveCount(1);

        // 验证：已有告警的值已更新
        var updatedAlert = db.Alerts.First();
        updatedAlert.Value.Should().Be(98.5m);
        updatedAlert.TriggerCount.Should().Be(2);
    }

    /// <summary>
    /// 测试 7：多条规则同时匹配时，应逐一评估并分别创建告警
    /// 验证：2 条匹配规则均触发时，创建 2 条告警
    /// </summary>
    [Fact]
    public async Task 多规则匹配_应逐一评估()
    {
        // 准备
        var db = GetDb();
        var deviceId = Guid.NewGuid();
        await AddDeviceAsync(db, _tenantId, deviceId);

        // 创建两条同指标、不同类型的规则
        var rule1 = CreateAlertRule(_tenantId, "temperature", RuleType.Threshold, AlertSeverity.High);
        var rule2 = CreateAlertRule(_tenantId, "temperature", RuleType.Combined, AlertSeverity.Critical);
        db.AlertRules.AddRange(rule1, rule2);
        await db.SaveChangesAsync();

        // 两个评估器均返回触发
        var (service, eventBusMock, aggregatorMock, _) = CreateService(
            db,
            (RuleType.Threshold, true),
            (RuleType.Combined, true));
        aggregatorMock.Setup(a => a.Evaluate(deviceId, "temperature"))
            .Returns((true, false, false));

        var context = new DeviceContext();

        // 执行
        await service.EvaluateForDeviceAsync(
            _tenantId, deviceId, "电机",
            "temperature", 100.0, context);

        // 验证：应创建 2 条告警
        db.Alerts.Should().HaveCount(2);

        // 验证：事件总线应发布 2 次事件
        eventBusMock.Verify(
            e => e.PublishAsync(It.IsAny<AlertTriggeredEvent>(), It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    /// <summary>
    /// 测试 8：设备特定规则（DeviceId 不为空）应在匹配的设备上生效
    /// 验证：仅 DeviceId 匹配的规则被评估
    /// </summary>
    [Fact]
    public async Task 设备特定规则_应生效()
    {
        // 准备
        var db = GetDb();
        var deviceId = Guid.NewGuid();
        await AddDeviceAsync(db, _tenantId, deviceId);

        // 创建设备特定规则（DeviceId 绑定到当前设备）
        var rule = CreateAlertRule(_tenantId, "temperature", RuleType.Threshold, AlertSeverity.Critical);
        rule.DeviceId = deviceId;

        // 创建另一条绑定到其他设备的规则（不应匹配）
        var otherRule = CreateAlertRule(_tenantId, "temperature", RuleType.Threshold, AlertSeverity.Low);
        otherRule.DeviceId = Guid.NewGuid();

        db.AlertRules.AddRange(rule, otherRule);
        await db.SaveChangesAsync();

        var (service, _, aggregatorMock, _) = CreateService(db, (RuleType.Threshold, true));
        aggregatorMock.Setup(a => a.Evaluate(deviceId, "temperature"))
            .Returns((true, false, false));

        var context = new DeviceContext();

        // 执行
        await service.EvaluateForDeviceAsync(
            _tenantId, deviceId, "电机",
            "temperature", 100.0, context);

        // 验证：仅 1 条告警（排除不匹配的 otherRule）
        db.Alerts.Should().HaveCount(1);
    }

    /// <summary>
    /// 测试 9：通用规则（DeviceId 为空）应匹配所有设备
    /// 验证：DeviceId=null 的规则对任意设备生效
    /// </summary>
    [Fact]
    public async Task 通用规则_应匹配所有设备()
    {
        // 准备
        var db = GetDb();
        var deviceId = Guid.NewGuid();
        await AddDeviceAsync(db, _tenantId, deviceId);

        // DeviceId=null 的通用规则
        var rule = CreateAlertRule(_tenantId, "temperature", RuleType.Threshold, AlertSeverity.High);
        rule.DeviceId = null;

        db.AlertRules.Add(rule);
        await db.SaveChangesAsync();

        var (service, _, aggregatorMock, _) = CreateService(db, (RuleType.Threshold, true));
        aggregatorMock.Setup(a => a.Evaluate(deviceId, "temperature"))
            .Returns((true, false, false));

        var context = new DeviceContext();

        // 执行
        await service.EvaluateForDeviceAsync(
            _tenantId, deviceId, "电机",
            "temperature", 95.0, context);

        // 验证：通用规则应生效，创建告警
        db.Alerts.Should().HaveCount(1);
    }

    /// <summary>
    /// 测试 10：创建的告警编码应符合 ALT-{deviceCode}-{metric}-{timestamp} 格式
    /// 验证：AlertCode 以 "ALT-" 开头，包含指标名称
    /// </summary>
    [Fact]
    public async Task 告警编码格式正确()
    {
        // 准备
        var db = GetDb();
        var deviceId = Guid.NewGuid();
        await AddDeviceAsync(db, _tenantId, deviceId, "MOTOR-001");

        var (service, _, aggregatorMock, _) = CreateService(db, (RuleType.Threshold, true));
        aggregatorMock.Setup(a => a.Evaluate(deviceId, "temperature"))
            .Returns((true, false, false));

        var rule = CreateAlertRule(_tenantId, "temperature");
        db.AlertRules.Add(rule);
        await db.SaveChangesAsync();

        var context = new DeviceContext();

        // 执行
        await service.EvaluateForDeviceAsync(
            _tenantId, deviceId, "电机",
            "temperature", 95.0, context);

        // 验证：告警编码格式
        var alert = db.Alerts.First();
        alert.AlertCode.Should().StartWith("ALT-");
        alert.AlertCode.Should().Contain("MOTOR-001");
        alert.AlertCode.Should().Contain("temperature");
    }

    /// <summary>
    /// 测试 11：有基线数据时，应将基线注入 DeviceContext 传给评估器
    /// 验证：评估器接收到的 DeviceContext.Baseline 不为空
    /// </summary>
    [Fact]
    public async Task 有基线数据_应传入DeviceContext()
    {
        // 准备
        var db = GetDb();
        var deviceId = Guid.NewGuid();
        await AddDeviceAsync(db, _tenantId, deviceId);

        // 预先创建基线数据
        var baseline = new MetricBaseline
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantId,
            DeviceId = deviceId,
            Metric = "temperature",
            AvgValue = 45.0,
            StdDev = 3.5,
            SampleCount = 500
        };
        db.Set<MetricBaseline>().Add(baseline);

        var rule = CreateAlertRule(_tenantId, "temperature", RuleType.Baseline);
        db.AlertRules.Add(rule);
        await db.SaveChangesAsync();

        // 使用回调捕获评估器收到的 DeviceContext 参数
        DeviceContext? capturedContext = null;
        var evaluatorMock = new Mock<IAlertRuleEvaluator>();
        evaluatorMock.SetupGet(e => e.RuleType).Returns(RuleType.Baseline);
        evaluatorMock.Setup(e => e.Evaluate(It.IsAny<double>(), It.IsAny<AlertRule>(), It.IsAny<DeviceContext>()))
            .Callback<double, AlertRule, DeviceContext>((_, _, ctx) => capturedContext = ctx)
            .Returns(false); // 不触发，只验证上下文

        var serviceProviderMock = new Mock<IServiceProvider>();
        serviceProviderMock.Setup(sp => sp.GetService(typeof(AppDbContext))).Returns(db);
        var scopeMock = new Mock<IServiceScope>();
        scopeMock.SetupGet(s => s.ServiceProvider).Returns(serviceProviderMock.Object);
        var scopeFactoryMock = new Mock<IServiceScopeFactory>();
        scopeFactoryMock.Setup(f => f.CreateScope()).Returns(scopeMock.Object);

        var eventBusMock = new Mock<IEventBus>();
        var aggregatorMock = new Mock<IAlertAggregator>();
        var loggerMock = new Mock<ILogger<AlertEvaluationService>>();

        var service = new AlertEvaluationService(
            scopeFactoryMock.Object, eventBusMock.Object, aggregatorMock.Object,
            new[] { evaluatorMock.Object }, loggerMock.Object);

        var context = new DeviceContext();

        // 执行
        await service.EvaluateForDeviceAsync(
            _tenantId, deviceId, "电机",
            "temperature", 60.0, context);

        // 验证：评估器被调用
        evaluatorMock.Verify(
            e => e.Evaluate(It.IsAny<double>(), It.IsAny<AlertRule>(), It.IsAny<DeviceContext>()),
            Times.Once);

        // 验证：DeviceContext 中包含基线数据
        capturedContext.Should().NotBeNull();
        capturedContext!.Baseline.Should().NotBeNull();
        capturedContext.Baseline!.AvgValue.Should().Be(45.0);
        capturedContext.Baseline.StdDev.Should().Be(3.5);
        capturedContext.Baseline.DeviceId.Should().Be(deviceId);
    }

    /// <summary>
    /// 测试 12：不同 RuleType 应选择对应的评估器
    /// 验证：Threshold 评估器处理 Threshold 规则，Combined 评估器处理 Combined 规则
    /// </summary>
    [Fact]
    public async Task 不同RuleType_应选择对应评估器()
    {
        // 准备
        var db = GetDb();
        var deviceId = Guid.NewGuid();
        await AddDeviceAsync(db, _tenantId, deviceId);

        // 创建两种类型的规则
        var thresholdRule = CreateAlertRule(_tenantId, "temperature", RuleType.Threshold, AlertSeverity.High);
        var combinedRule = CreateAlertRule(_tenantId, "temperature", RuleType.Combined, AlertSeverity.Critical);
        db.AlertRules.AddRange(thresholdRule, combinedRule);
        await db.SaveChangesAsync();

        // 创建两种类型的评估器，使用回调记录调用情况
        var thresholdEvaluatorCalled = false;
        var combinedEvaluatorCalled = false;

        var thresholdMock = new Mock<IAlertRuleEvaluator>();
        thresholdMock.SetupGet(e => e.RuleType).Returns(RuleType.Threshold);
        thresholdMock.Setup(e => e.Evaluate(It.IsAny<double>(), It.IsAny<AlertRule>(), It.IsAny<DeviceContext>()))
            .Callback(() => thresholdEvaluatorCalled = true)
            .Returns(true);

        var combinedMock = new Mock<IAlertRuleEvaluator>();
        combinedMock.SetupGet(e => e.RuleType).Returns(RuleType.Combined);
        combinedMock.Setup(e => e.Evaluate(It.IsAny<double>(), It.IsAny<AlertRule>(), It.IsAny<DeviceContext>()))
            .Callback(() => combinedEvaluatorCalled = true)
            .Returns(true);

        var serviceProviderMock = new Mock<IServiceProvider>();
        serviceProviderMock.Setup(sp => sp.GetService(typeof(AppDbContext))).Returns(db);
        var scopeMock = new Mock<IServiceScope>();
        scopeMock.SetupGet(s => s.ServiceProvider).Returns(serviceProviderMock.Object);
        var scopeFactoryMock = new Mock<IServiceScopeFactory>();
        scopeFactoryMock.Setup(f => f.CreateScope()).Returns(scopeMock.Object);

        var eventBusMock = new Mock<IEventBus>();
        var aggregatorMock = new Mock<IAlertAggregator>();
        aggregatorMock.Setup(a => a.Evaluate(deviceId, "temperature"))
            .Returns((true, false, false));
        var loggerMock = new Mock<ILogger<AlertEvaluationService>>();

        var service = new AlertEvaluationService(
            scopeFactoryMock.Object, eventBusMock.Object, aggregatorMock.Object,
            new[] { thresholdMock.Object, combinedMock.Object }, loggerMock.Object);

        var context = new DeviceContext();

        // 执行
        await service.EvaluateForDeviceAsync(
            _tenantId, deviceId, "电机",
            "temperature", 100.0, context);

        // 验证：两种评估器都被调用（各自处理对应类型的规则）
        thresholdEvaluatorCalled.Should().BeTrue("Threshold 评估器应处理 Threshold 规则");
        combinedEvaluatorCalled.Should().BeTrue("Combined 评估器应处理 Combined 规则");

        // 验证：两种评估器各被调用 1 次
        thresholdMock.Verify(
            e => e.Evaluate(It.IsAny<double>(), It.IsAny<AlertRule>(), It.IsAny<DeviceContext>()),
            Times.Once);
        combinedMock.Verify(
            e => e.Evaluate(It.IsAny<double>(), It.IsAny<AlertRule>(), It.IsAny<DeviceContext>()),
            Times.Once);
    }

    // ========================================================================
    // 辅助类型
    // ========================================================================

    /// <summary>
    /// 测试用租户上下文，模拟 ITenantContext 实现
    /// </summary>
    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }

    /// <summary>
    /// 释放 DI 容器资源
    /// </summary>
    public async ValueTask DisposeAsync() => await _sp.DisposeAsync();
}
