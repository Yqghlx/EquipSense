using EquipAI.Application.Analysis;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit;

namespace EquipAI.Tests.Unit.Analysis;

public class RuleEngineAnalysisServiceTests : IAsyncDisposable
{
    private readonly ServiceProvider _sp;
    private readonly Guid _tenantId = Guid.NewGuid();

    public RuleEngineAnalysisServiceTests()
    {
        var dbName = $"RuleEngineTest_{Guid.NewGuid()}";
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(dbName));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(_tenantId));
        services.AddLogging();
        services.AddScoped<IRuleEngineAnalysisService, RuleEngineAnalysisService>();
        _sp = services.BuildServiceProvider();
    }

    [Fact]
    public async Task MatchRuleAsync_条件满足应返回匹配结果()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var deviceId = Guid.NewGuid();

        // 先添加设备，以便服务能查到设备类型
        db.Devices.Add(new Device
        {
            Id = deviceId,
            TenantId = _tenantId,
            DeviceCode = "DEV-001",
            Name = "测试电机",
            Type = "电机"
        });

        db.KnowledgeRules.Add(new KnowledgeRule
        {
            TenantId = _tenantId,
            DeviceType = "电机",
            Name = "电机过热诊断",
            Conditions = """[{"metric":"temperature","operator":">","threshold":80}]""",
            Conclusion = "电机温度过高，可能散热系统异常",
            RecommendedActions = """["检查冷却风扇","清理散热片"]""",
            ConfidenceWeight = 0.9m,
            Enabled = true
        });
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<IRuleEngineAnalysisService>();
        var result = await service.MatchRuleAsync(_tenantId, deviceId, "temperature", 95.0);

        result.Should().NotBeNull();
        result!.Conclusion.Should().Contain("温度过高");
        result.ConfidenceWeight.Should().Be(0.9);
        result.RuleName.Should().Be("电机过热诊断");
    }

    [Fact]
    public async Task MatchRuleAsync_条件不满足应返回null()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var deviceId = Guid.NewGuid();

        db.Devices.Add(new Device
        {
            Id = deviceId,
            TenantId = _tenantId,
            DeviceCode = "DEV-002",
            Name = "测试电机",
            Type = "电机"
        });

        db.KnowledgeRules.Add(new KnowledgeRule
        {
            TenantId = _tenantId,
            DeviceType = "电机",
            Name = "电机过热诊断",
            Conditions = """[{"metric":"temperature","operator":">","threshold":80}]""",
            Conclusion = "电机温度过高",
            Enabled = true
        });
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<IRuleEngineAnalysisService>();
        var result = await service.MatchRuleAsync(_tenantId, deviceId, "temperature", 50.0);

        result.Should().BeNull();
    }

    [Fact]
    public async Task MatchRuleAsync_禁用规则不应匹配()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var deviceId = Guid.NewGuid();

        db.Devices.Add(new Device
        {
            Id = deviceId,
            TenantId = _tenantId,
            DeviceCode = "DEV-003",
            Name = "测试电机",
            Type = "电机"
        });

        db.KnowledgeRules.Add(new KnowledgeRule
        {
            TenantId = _tenantId,
            DeviceType = "电机",
            Name = "电机过热诊断",
            Conditions = """[{"metric":"temperature","operator":">","threshold":80}]""",
            Conclusion = "电机温度过高",
            Enabled = false
        });
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<IRuleEngineAnalysisService>();
        var result = await service.MatchRuleAsync(_tenantId, deviceId, "temperature", 95.0);

        result.Should().BeNull();
    }

    [Fact]
    public async Task MatchRuleAsync_无任何规则应返回null()
    {
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IRuleEngineAnalysisService>();

        var result = await service.MatchRuleAsync(_tenantId, Guid.NewGuid(), "vibration", 10.0);

        result.Should().BeNull();
    }

    [Fact]
    public async Task MatchRuleAsync_通配符设备类型应匹配()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var deviceId = Guid.NewGuid();

        db.Devices.Add(new Device
        {
            Id = deviceId,
            TenantId = _tenantId,
            DeviceCode = "DEV-004",
            Name = "测试泵",
            Type = "泵"
        });

        // DeviceType = "*" 的通用规则应匹配任何设备
        db.KnowledgeRules.Add(new KnowledgeRule
        {
            TenantId = _tenantId,
            DeviceType = "*",
            Name = "通用温度告警",
            Conditions = """[{"metric":"temperature","operator":">","threshold":100}]""",
            Conclusion = "设备温度超限",
            ConfidenceWeight = 0.7m,
            Enabled = true
        });
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<IRuleEngineAnalysisService>();
        var result = await service.MatchRuleAsync(_tenantId, deviceId, "temperature", 105.0);

        result.Should().NotBeNull();
        result!.RuleName.Should().Be("通用温度告警");
    }

    [Fact]
    public async Task MatchRuleAsync_系统租户规则应匹配()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var deviceId = Guid.NewGuid();

        db.Devices.Add(new Device
        {
            Id = deviceId,
            TenantId = _tenantId,
            DeviceCode = "DEV-005",
            Name = "测试压缩机",
            Type = "压缩机"
        });

        // 系统租户（Guid.Empty）的规则应被所有租户匹配
        db.KnowledgeRules.Add(new KnowledgeRule
        {
            TenantId = Guid.Empty,
            DeviceType = "压缩机",
            Name = "系统预置-压缩机振动诊断",
            Conditions = """[{"metric":"vibration","operator":">","threshold":5.0}]""",
            Conclusion = "压缩机振动异常",
            ConfidenceWeight = 0.8m,
            Enabled = true
        });
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<IRuleEngineAnalysisService>();
        var result = await service.MatchRuleAsync(_tenantId, deviceId, "vibration", 8.0);

        result.Should().NotBeNull();
        result!.Conclusion.Should().Contain("振动异常");
    }

    [Fact]
    public async Task MatchRuleAsync_多条件规则全部满足应匹配()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var deviceId = Guid.NewGuid();

        db.Devices.Add(new Device
        {
            Id = deviceId,
            TenantId = _tenantId,
            DeviceCode = "DEV-006",
            Name = "测试电机",
            Type = "电机"
        });

        // 多条件规则：temperature > 80 AND vibration > 3.0
        // 只评估与目标指标匹配的条件
        db.KnowledgeRules.Add(new KnowledgeRule
        {
            TenantId = _tenantId,
            DeviceType = "电机",
            Name = "电机多指标诊断",
            Conditions = """[{"metric":"temperature","operator":">","threshold":80},{"metric":"vibration","operator":">","threshold":3.0}]""",
            Conclusion = "电机多项指标异常",
            ConfidenceWeight = 0.85m,
            Enabled = true
        });
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<IRuleEngineAnalysisService>();

        // 只传入 temperature 指标，vibration 条件不在评估范围内
        var result = await service.MatchRuleAsync(_tenantId, deviceId, "temperature", 95.0);

        result.Should().NotBeNull();
        result!.Conclusion.Should().Contain("多项指标异常");
    }

    [Fact]
    public async Task MatchRuleAsync_多条件规则部分不满足应返回null()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var deviceId = Guid.NewGuid();

        db.Devices.Add(new Device
        {
            Id = deviceId,
            TenantId = _tenantId,
            DeviceCode = "DEV-007",
            Name = "测试电机",
            Type = "电机"
        });

        // 多条件规则：temperature > 80 AND temperature < 90
        db.KnowledgeRules.Add(new KnowledgeRule
        {
            TenantId = _tenantId,
            DeviceType = "电机",
            Name = "电机温区诊断",
            Conditions = """[{"metric":"temperature","operator":">","threshold":80},{"metric":"temperature","operator":"<","threshold":90}]""",
            Conclusion = "电机温度偏高但可控",
            ConfidenceWeight = 0.75m,
            Enabled = true
        });
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<IRuleEngineAnalysisService>();

        // 值 95 不满足 temperature < 90 的条件
        var result = await service.MatchRuleAsync(_tenantId, deviceId, "temperature", 95.0);

        result.Should().BeNull();
    }

    /// <summary>
    /// 安全边界：设备属于租户 A 时，租户 B 的规则不能借用该设备类型完成匹配。
    ///
    /// Why：后台规则匹配绕过 HTTP 租户过滤器读取事件数据，但设备类型仍必须绑定事件租户，
    /// 否则跨租户设备 ID 配合同类型规则会产生错误的根因结论。
    /// </summary>
    [Fact]
    public async Task MatchRuleAsync_设备租户与事件租户不一致_不应返回规则()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var deviceId = Guid.NewGuid();
        var deviceTenantId = Guid.NewGuid();
        var eventTenantId = Guid.NewGuid();

        db.Devices.Add(new Device
        {
            Id = deviceId,
            TenantId = deviceTenantId,
            DeviceCode = "TENANT-A-DEV",
            Name = "租户A设备",
            Type = "电机",
        });
        db.KnowledgeRules.Add(new KnowledgeRule
        {
            TenantId = eventTenantId,
            DeviceType = "电机",
            Name = "租户B电机规则",
            Conditions = """[{"metric":"temperature","operator":">","threshold":80}]""",
            Conclusion = "不应被跨租户设备命中",
            ConfidenceWeight = 0.9m,
            Enabled = true,
        });
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<IRuleEngineAnalysisService>();
        var result = await service.MatchRuleAsync(eventTenantId, deviceId, "temperature", 95.0);

        result.Should().BeNull("规则引擎不能读取其他租户设备类型");
    }

    /// <summary>
    /// 后台正向路径：当前上下文租户与事件租户不同，但设备属于事件租户时仍应匹配规则。
    /// </summary>
    [Fact]
    public async Task MatchRuleAsync_后台事件租户与当前上下文不同_合法设备应正常匹配()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var eventTenantId = Guid.NewGuid();
        var deviceId = Guid.NewGuid();

        db.Devices.Add(new Device
        {
            Id = deviceId,
            TenantId = eventTenantId,
            DeviceCode = "EVENT-TENANT-DEV",
            Name = "事件租户设备",
            Type = "电机",
        });
        db.KnowledgeRules.Add(new KnowledgeRule
        {
            TenantId = eventTenantId,
            DeviceType = "电机",
            Name = "后台电机规则",
            Conditions = """[{"metric":"temperature","operator":">","threshold":80}]""",
            Conclusion = "后台事件正常命中",
            ConfidenceWeight = 0.9m,
            Enabled = true,
        });
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<IRuleEngineAnalysisService>();
        var result = await service.MatchRuleAsync(eventTenantId, deviceId, "temperature", 95.0);

        result.Should().NotBeNull("后台处理应使用事件租户而非当前 HTTP 上下文租户");
        result!.Conclusion.Should().Be("后台事件正常命中");
    }

    /// <summary>
    /// 安全边界：不存在的设备即使有通配知识规则，也不能产生诊断结论。
    ///
    /// Why：未知设备的设备类型为空；旧实现会把 DeviceType="*" 规则当成匹配结果，
    /// 将没有真实设备上下文的遥测误判为根因，造成错误建议。
    /// </summary>
    [Fact]
    public async Task MatchRuleAsync_不存在设备加通配规则_不应返回规则()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var eventTenantId = Guid.NewGuid();
        var unknownDeviceId = Guid.NewGuid();

        db.KnowledgeRules.Add(new KnowledgeRule
        {
            TenantId = eventTenantId,
            DeviceType = "*",
            Name = "通配温度规则",
            Conditions = """[{"metric":"temperature","operator":">","threshold":80}]""",
            Conclusion = "未知设备不应命中",
            ConfidenceWeight = 0.8m,
            Enabled = true,
        });
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<IRuleEngineAnalysisService>();
        var result = await service.MatchRuleAsync(
            eventTenantId,
            unknownDeviceId,
            "temperature",
            95.0);

        result.Should().BeNull("没有设备实体时不能生成诊断规则匹配");
    }

    /// <summary>
    /// 测试用租户上下文
    /// </summary>
    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }

    public async ValueTask DisposeAsync() => await _sp.DisposeAsync();
}
