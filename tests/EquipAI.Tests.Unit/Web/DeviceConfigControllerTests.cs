using System.Text.Json;
using EquipAI.Application.Devices;
using EquipAI.Core.Constants;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.WebAPI.Controllers;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Xunit;

namespace EquipAI.Tests.Unit.Web;

/// <summary>
/// DeviceConfigController.QuickRegister 跨租户注入 + 配额漂移回归测试（锁定不变量）。
///
/// 起因：旧版 QuickRegister 用请求体里的 <c>request.TenantId</c> 作为设备及告警规则的归属租户，
/// 且创建后不维护租户 <c>CurrentDeviceCount</c>。两个缺陷叠加：
/// 1. <b>跨租户注入</b>：租户 A 用户（JWT=A）传 <c>TenantId=B</c>，即可在 B 名下创建设备 →
///    污染 B 的设备列表、触发 B 的告警、占用 B 的订阅配额（P0 越权）。
/// 2. <b>配额漂移/超卖</b>：本端点创建的设备不计入 <c>CurrentDeviceCount</c>，配额中间件
///    （<c>CurrentDeviceCount &lt; MaxDevices</c>）会错误放行 → 租户超卖额度。
/// 这与已有的跨租户注入系列同源：租户身份必须以 JWT 为权威，禁止信任请求体里的 TenantId。
///
/// 修复：注入 <c>ITenantContext</c>，用 <c>_tenantContext.TenantId</c>（JWT 权威）创建设备及告警规则
/// （忽略请求体 TenantId），并 <c>tenant.CurrentDeviceCount++</c>（与 DeviceService.CreateDeviceAsync 一致）。
///
/// 必须用 SQLite：InMemory 提供程序不强制全局过滤器，无法如实反映生产 PG 的"按当前租户范围"重复编码
/// 检查；SQLite 强制过滤器，且能验证计数维护的真实写库行为。
/// </summary>
public class DeviceConfigControllerTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private ServiceProvider _sp = null!;
    private readonly Guid _tenantA = Guid.NewGuid();
    private readonly Guid _tenantB = Guid.NewGuid();

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseSqlite(_connection));
        // 模拟租户 A 用户登录：JWT 权威固定为租户 A
        services.AddSingleton<ITenantContext>(new FixedTenantContext(_tenantA));
        _sp = services.BuildServiceProvider();

        using var seedScope = _sp.CreateScope();
        var db = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();

        // 种子：两个业务租户和一个系统租户，设备计数均为 0（凸显计数维护断言）。
        db.Add(new Tenant
        {
            Id = SystemConstants.SystemTenantId, Name = "系统租户", Slug = "system", Plan = TenantPlan.Enterprise,
            CurrentDeviceCount = 0, MaxDevices = int.MaxValue
        });
        db.Add(new Tenant
        {
            Id = _tenantA, Name = "TA", Slug = "ta", Plan = TenantPlan.Basic,
            CurrentDeviceCount = 0, MaxDevices = 50
        });
        db.Add(new Tenant
        {
            Id = _tenantB, Name = "TB", Slug = "tb", Plan = TenantPlan.Basic,
            CurrentDeviceCount = 0, MaxDevices = 50
        });
        await db.SaveChangesAsync();
    }

    public async Task DisposeAsync()
    {
        await _sp.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task QuickRegister_请求体指定他租户TenantId_应以JWT租户为准且维护本租户计数()
    {
        // 场景：租户 A 用户（JWT=A）调用快速注册，请求体恶意指定 TenantId=B（跨租户注入）。
        // 期望：设备归属 JWT 租户 A（忽略请求体 B），并维护 A 的 CurrentDeviceCount。
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantContext = scope.ServiceProvider.GetRequiredService<ITenantContext>();
        var service = new DeviceConfigService(db, tenantContext);
        var controller = new DeviceConfigController(service);

        await controller.QuickRegister(new QuickRegisterRequest
        {
            TenantId = _tenantB,           // 恶意指定他租户（应被忽略）
            DeviceCode = "INJECT-001",
            Name = "注入测试设备",
            DeviceType = "电机"
        });

        // 核心断言 1：设备归属 JWT 租户 A，而非请求体的 B（防跨租户注入）
        var device = await db.UnfilteredSet<Device>().FirstOrDefaultAsync(d => d.DeviceCode == "INJECT-001");
        device.Should().NotBeNull("设备应被创建");
        device!.TenantId.Should().Be(_tenantA,
            "设备归属应以 JWT 租户为准，禁止信任请求体 TenantId（防跨租户注入）");
        device.TenantId.Should().NotBe(_tenantB, "租户 A 不得在租户 B 名下创建设备");

        // 核心断言 2：维护本租户计数（防配额漂移/超卖）
        var tA = await db.UnfilteredSet<Tenant>().FirstAsync(t => t.Id == _tenantA);
        var tB = await db.UnfilteredSet<Tenant>().FirstAsync(t => t.Id == _tenantB);
        tA.CurrentDeviceCount.Should().Be(1,
            "通过本端点创建设备应维护租户 A 的 CurrentDeviceCount，否则配额中间件超卖");
        tB.CurrentDeviceCount.Should().Be(0, "租户 B 的计数不应受影响");
    }

    [Fact]
    public async Task QuickRegister_达到设备配额_应拒绝且不写入设备()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantContext = scope.ServiceProvider.GetRequiredService<ITenantContext>();
        var tenant = await db.UnfilteredSet<Tenant>().SingleAsync(t => t.Id == _tenantA);
        tenant.MaxDevices = 1;
        tenant.CurrentDeviceCount = 0;
        db.Devices.Add(new Device
        {
            TenantId = _tenantA,
            DeviceCode = "ALREADY-FULL-001",
            Name = "已占用配额的设备",
            Type = "电机"
        });
        await db.SaveChangesAsync();

        var service = new DeviceConfigService(db, tenantContext);
        var act = () => service.QuickRegisterAsync(new QuickRegisterRequest
        {
            DeviceCode = "OVER-LIMIT-001",
            Name = "超额设备",
            DeviceType = "电机"
        });

        var exception = await FluentActions.Awaiting(act).Should().ThrowAsync<DeviceConfigException>();
        exception.Which.Code.Should().Be("QUOTA_EXCEEDED");
        (await db.UnfilteredSet<Device>().CountAsync(d => d.DeviceCode == "OVER-LIMIT-001"))
            .Should().Be(0);
        (await db.UnfilteredSet<Tenant>().SingleAsync(t => t.Id == _tenantA))
            .CurrentDeviceCount.Should().Be(tenant.CurrentDeviceCount);
    }

    [Fact]
    public async Task QuickRegister_使用系统模板并应用默认规则_应保存模板关联和完整规则语义()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantContext = scope.ServiceProvider.GetRequiredService<ITenantContext>();
        var templateId = Guid.NewGuid();
        db.DeviceTypeTemplates.Add(new DeviceTypeTemplate
        {
            Id = templateId,
            TenantId = SystemConstants.SystemTenantId,
            Name = "空压机模板",
            Industry = "制造业",
            Parameters = "{}",
            DefaultAlarmRules = """
                [
                  {"name":"排气压力过低","metric":"discharge_pressure","ruleType":"threshold","operator":"lt","threshold":0.5,"severity":"High","cooldownSeconds":600,"enabled":false,"autoCreateWorkorder":false},
                  {"name":"振动超标","metric":"vibration","ruleType":"threshold","operator":"gt","threshold":7,"severity":"Critical","cooldownSeconds":300,"enabled":true,"autoCreateWorkorder":true}
                ]
                """
        });
        await db.SaveChangesAsync();

        var service = new DeviceConfigService(db, tenantContext);
        var result = await service.QuickRegisterAsync(new QuickRegisterRequest
        {
            TemplateId = templateId,
            ApplyDefaultAlarmRules = true,
            DeviceCode = "TPL-001",
            Name = "一号空压机",
            TenantId = _tenantB
        });

        result.DuplicateCode.Should().BeFalse();
        var device = await db.UnfilteredSet<Device>().SingleAsync(d => d.Id == result.DeviceId);
        device.TenantId.Should().Be(_tenantA);
        device.TypeTemplateId.Should().Be(templateId);
        device.Type.Should().Be("空压机模板");

        var rules = await db.UnfilteredSet<AlertRule>()
            .Where(r => r.DeviceId == device.Id)
            .OrderBy(r => r.Name)
            .ToListAsync();
        rules.Should().HaveCount(2);
        rules.Should().OnlyContain(rule => rule.TenantId == _tenantA);
        rules.Should().ContainSingle(r =>
            r.Operator == "lt"
            && r.Threshold == 0.5m
            && r.Severity == AlertSeverity.High
            && r.CooldownSeconds == 600
            && !r.Enabled
            && !r.AutoCreateWorkorder);
        rules.Should().ContainSingle(r =>
            r.Operator == "gt"
            && r.Threshold == 7m
            && r.Severity == AlertSeverity.Critical
            && r.CooldownSeconds == 300
            && r.Enabled
            && r.AutoCreateWorkorder);
    }

    [Fact]
    public async Task ListTemplates_应返回当前租户和系统模板并排除其他租户模板()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantContext = scope.ServiceProvider.GetRequiredService<ITenantContext>();
        await AddTemplateAsync(db, "[]", SystemConstants.SystemTenantId);
        await AddTemplateAsync(db, "[]", _tenantA);
        await AddTemplateAsync(db, "[]", _tenantB);
        var service = new DeviceConfigService(db, tenantContext);

        var result = await service.ListTemplatesAsync();
        var serialized = JsonSerializer.Serialize(result);

        serialized.Should().Contain(SystemConstants.SystemTenantId.ToString());
        serialized.Should().Contain(_tenantA.ToString());
        serialized.Should().NotContain(_tenantB.ToString());
    }

    [Fact]
    public async Task QuickRegister_未勾选默认规则_只保存模板关联不创建告警()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantContext = scope.ServiceProvider.GetRequiredService<ITenantContext>();
        var templateId = await AddTemplateAsync(db, "[{\"name\":\"温度告警\",\"metric\":\"temperature\",\"ruleType\":\"threshold\",\"operator\":\">\",\"threshold\":80}]");
        var service = new DeviceConfigService(db, tenantContext);

        var result = await service.QuickRegisterAsync(new QuickRegisterRequest
        {
            TemplateId = templateId,
            ApplyDefaultAlarmRules = false,
            DeviceCode = "TPL-002"
        });

        var device = await db.UnfilteredSet<Device>().SingleAsync(d => d.Id == result.DeviceId);
        device.TypeTemplateId.Should().Be(templateId);
        (await db.UnfilteredSet<AlertRule>().CountAsync(r => r.DeviceId == device.Id)).Should().Be(0);
    }

    [Fact]
    public async Task QuickRegister_模板不可见_应返回稳定业务错误且不创建设备()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantContext = scope.ServiceProvider.GetRequiredService<ITenantContext>();
        var foreignTemplateId = await AddTemplateAsync(db, "[]", _tenantB);
        var service = new DeviceConfigService(db, tenantContext);

        var exception = await FluentActions.Awaiting(() => service.QuickRegisterAsync(new QuickRegisterRequest
        {
            TemplateId = foreignTemplateId,
            ApplyDefaultAlarmRules = true,
            DeviceCode = "TPL-003"
        })).Should().ThrowAsync<DeviceConfigException>();

        exception.Which.Code.Should().Be("TEMPLATE_NOT_FOUND");
        (await db.UnfilteredSet<Device>().CountAsync(d => d.DeviceCode == "TPL-003")).Should().Be(0);
    }

    [Fact]
    public async Task QuickRegister_模板规则无效_应回滚设备和租户计数()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantContext = scope.ServiceProvider.GetRequiredService<ITenantContext>();
        var templateId = await AddTemplateAsync(db, "{invalid-json");
        var service = new DeviceConfigService(db, tenantContext);

        var exception = await FluentActions.Awaiting(() => service.QuickRegisterAsync(new QuickRegisterRequest
        {
            TemplateId = templateId,
            ApplyDefaultAlarmRules = true,
            DeviceCode = "TPL-004"
        })).Should().ThrowAsync<DeviceTemplateRulesException>();

        exception.Which.Code.Should().Be("TEMPLATE_RULES_INVALID");
        (await db.UnfilteredSet<Device>().CountAsync(d => d.DeviceCode == "TPL-004")).Should().Be(0);
        (await db.UnfilteredSet<AlertRule>().CountAsync(r => r.Metric == "temperature")).Should().Be(0);
        (await db.UnfilteredSet<Tenant>().SingleAsync(t => t.Id == _tenantA)).CurrentDeviceCount.Should().Be(0);
    }

    [Fact]
    public async Task QuickRegister_无模板兼容路径_应保留客户端规则全部字段()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantContext = scope.ServiceProvider.GetRequiredService<ITenantContext>();
        var service = new DeviceConfigService(db, tenantContext);

        var result = await service.QuickRegisterAsync(new QuickRegisterRequest
        {
            DeviceCode = "LEGACY-001",
            Name = "兼容设备",
            DefaultAlertRules =
            [
                new DefaultAlertRuleRequest
                {
                    Name = "压力过低",
                    Metric = "pressure",
                    Operator = "lt",
                    Threshold = 0.5m,
                    Severity = AlertSeverity.High,
                    CooldownSeconds = 90,
                    Enabled = false,
                    AutoCreateWorkorder = false
                }
            ]
        });

        var rule = await db.UnfilteredSet<AlertRule>().SingleAsync(r => r.DeviceId == result.DeviceId);
        rule.Name.Should().Be("压力过低");
        rule.Operator.Should().Be("lt");
        rule.Threshold.Should().Be(0.5m);
        rule.Severity.Should().Be(AlertSeverity.High);
        rule.CooldownSeconds.Should().Be(90);
        rule.Enabled.Should().BeFalse();
        rule.AutoCreateWorkorder.Should().BeFalse();
    }

    [Fact]
    public async Task QuickRegister_重复编码_应由控制器返回409和稳定业务码()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantContext = scope.ServiceProvider.GetRequiredService<ITenantContext>();
        var service = new DeviceConfigService(db, tenantContext);
        var controller = new DeviceConfigController(service);
        var request = new QuickRegisterRequest { DeviceCode = "DUP-001" };

        (await controller.QuickRegister(request)).Should().BeOfType<CreatedAtActionResult>();
        var response = await controller.QuickRegister(request);

        var conflict = response.Should().BeOfType<ConflictObjectResult>().Subject;
        JsonSerializer.Serialize(conflict.Value).Should().Contain("DUPLICATE_CODE");
    }

    [Fact]
    public void QuickRegister_设备唯一约束异常_应识别为编码冲突()
    {
        var postgresException = new PostgresException("duplicate key", "ERROR", "unique_violation", "23505");
        var exception = new DbUpdateException("设备唯一索引冲突", postgresException);

        DeviceConfigService.IsDeviceCodeUniqueViolation(exception).Should().BeTrue();
    }

    private static async Task<Guid> AddTemplateAsync(AppDbContext db, string defaultAlarmRules, Guid? tenantId = null)
    {
        var template = new DeviceTypeTemplate
        {
            TenantId = tenantId ?? SystemConstants.SystemTenantId,
            Name = $"测试模板-{Guid.NewGuid():N}",
            Parameters = "{}",
            DefaultAlarmRules = defaultAlarmRules
        };
        db.DeviceTypeTemplates.Add(template);
        await db.SaveChangesAsync();
        return template.Id;
    }

    /// <summary>测试用固定租户上下文（模拟 JWT 解析出的租户）</summary>
    private sealed class FixedTenantContext : ITenantContext
    {
        public FixedTenantContext(Guid tenantId) => TenantId = tenantId;
        public Guid TenantId { get; }
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
