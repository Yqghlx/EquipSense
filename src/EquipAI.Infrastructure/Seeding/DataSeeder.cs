using System.Text.Json;
using EquipAI.Core.Constants;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Infrastructure.Seeding;

/// <summary>
/// 数据库种子数据初始化器，负责创建系统必需的基础数据：
/// 1. 系统租户和默认租户
/// 2. 超级管理员账户
/// 3. 行业预置设备类型模板（归属系统租户）
/// 使用 IgnoreQueryFilters 确保种子数据检查不受租户过滤器影响
/// </summary>
public class DataSeeder
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<DataSeeder> _logger;

    /// <summary>
    /// 初始化数据种子器
    /// </summary>
    /// <param name="dbContext">数据库上下文</param>
    /// <param name="logger">日志记录器</param>
    public DataSeeder(AppDbContext dbContext, ILogger<DataSeeder> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// 执行种子数据初始化，确保数据库已创建并填充基础数据
    /// 所有存在性检查均使用 IgnoreQueryFilters 跨租户查询
    /// </summary>
    public async Task SeedAsync()
    {
        _logger.LogInformation("开始执行数据库种子数据初始化...");

        // 先应用待处理的迁移（适用于已有数据库的增量更新）
        var pendingMigrations = await _dbContext.Database.GetPendingMigrationsAsync();
        if (pendingMigrations.Any())
        {
            _logger.LogInformation("检测到 {Count} 个待处理迁移，开始应用...", pendingMigrations.Count());
            await _dbContext.Database.MigrateAsync();
        }

        // 兜底：确保数据库已创建（新数据库场景，无迁移历史时直接创建）
        await _dbContext.Database.EnsureCreatedAsync();

        await SeedTenantsAsync();
        await SeedAdminUserAsync();
        await SeedDeviceTypeTemplatesAsync();
        await SeedSampleDeviceAndAlertRulesAsync();
        await SeedAirCompressorKnowledgeRulesAsync();

        _logger.LogInformation("数据库种子数据初始化完成");
    }

    /// <summary>
    /// 创建系统租户和默认租户
    /// 系统租户（全零 GUID）用于存放行业预置模板和共享资源
    /// 默认租户（1111... GUID）用于开发和演示
    /// </summary>
    private async Task SeedTenantsAsync()
    {
        // 系统租户
        var systemTenantExists = await _dbContext.Tenants
            .IgnoreQueryFilters()
            .AnyAsync(t => t.Id == SystemConstants.SystemTenantId);

        if (!systemTenantExists)
        {
            var systemTenant = new Core.Entities.Tenant
            {
                Id = SystemConstants.SystemTenantId,
                Name = "系统租户",
                Slug = SystemConstants.SystemTenantSlug,
                Plan = TenantPlan.Enterprise,
                IsolationMode = TenantIsolationMode.Shared,
                MaxDevices = int.MaxValue,
                MaxUsers = int.MaxValue,
                DataRetentionDays = 365,
                IsActive = true,
                Status = TenantStatus.Active,
                TrialEndsAt = null,
                SubscriptionEndsAt = DateTime.UtcNow.AddYears(10),
                CurrentDeviceCount = 0,
                CurrentUserCount = 1
            };

            _dbContext.Tenants.Add(systemTenant);
            _logger.LogInformation("已创建系统租户（ID: {TenantId}）", SystemConstants.SystemTenantId);
        }

        // 默认租户（开发和演示用）
        var defaultTenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var defaultTenantExists = await _dbContext.Tenants
            .IgnoreQueryFilters()
            .AnyAsync(t => t.Id == defaultTenantId);

        if (!defaultTenantExists)
        {
            var defaultTenant = new Core.Entities.Tenant
            {
                Id = defaultTenantId,
                Name = "默认租户",
                Slug = "default",
                Plan = TenantPlan.Trial,
                IsolationMode = TenantIsolationMode.Shared,
                MaxDevices = 50,
                MaxUsers = 20,
                DataRetentionDays = 90,
                IsActive = true,
                Status = TenantStatus.Active,
                TrialEndsAt = null,
                SubscriptionEndsAt = DateTime.UtcNow.AddYears(1),
                CurrentDeviceCount = 0,
                CurrentUserCount = 1
            };

            _dbContext.Tenants.Add(defaultTenant);
            _logger.LogInformation("已创建默认租户（ID: {TenantId}）", defaultTenantId);
        }

        // 第二租户（用于 E2E 跨租户隔离测试）
        var secondTenantId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var secondTenantExists = await _dbContext.Tenants
            .IgnoreQueryFilters()
            .AnyAsync(t => t.Id == secondTenantId);

        if (!secondTenantExists)
        {
            var secondTenant = new Core.Entities.Tenant
            {
                Id = secondTenantId,
                Name = "测试租户B",
                Slug = "tenant-b",
                Plan = TenantPlan.Trial,
                IsolationMode = TenantIsolationMode.Shared,
                MaxDevices = 50,
                MaxUsers = 20,
                DataRetentionDays = 90,
                IsActive = true,
                Status = TenantStatus.Active,
                TrialEndsAt = null,
                SubscriptionEndsAt = DateTime.UtcNow.AddYears(1),
                CurrentDeviceCount = 0,
                CurrentUserCount = 0
            };

            _dbContext.Tenants.Add(secondTenant);
            _logger.LogInformation("已创建测试租户B（ID: {TenantId}）", secondTenantId);
        }

        await _dbContext.SaveChangesAsync();
    }

    /// <summary>
    /// 创建超级管理员账户及其他角色用户
    /// 默认用户名 admin，密码 Admin@123，归属默认租户
    /// 同时创建维保主管、技术员、操作员、观察者四种角色的测试用户
    /// 首次登录后必须修改密码（MustChangePassword = true）
    /// </summary>
    private async Task SeedAdminUserAsync()
    {
        var defaultTenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        // 定义种子用户列表
        var seedUsers = new[]
        {
            new { Username = "admin", Password = "Admin@123", DisplayName = "系统管理员", Role = UserRole.SystemAdmin },
            new { Username = "lead", Password = "Lead@123", DisplayName = "维保主管", Role = UserRole.MaintenanceLead },
            new { Username = "tech", Password = "Tech@123", DisplayName = "技术员", Role = UserRole.Technician },
            new { Username = "operator", Password = "Operator@123", DisplayName = "操作员", Role = UserRole.Operator },
            new { Username = "viewer", Password = "Viewer@123", DisplayName = "观察者", Role = UserRole.Viewer }
        };

        foreach (var seedUser in seedUsers)
        {
            var userExists = await _dbContext.Users
                .IgnoreQueryFilters()
                .AnyAsync(u => u.Username == seedUser.Username);

            if (!userExists)
            {
                var user = new User
                {
                    TenantId = defaultTenantId,
                    Username = seedUser.Username,
                    PasswordHash = PasswordHasher.HashPassword(seedUser.Password),
                    DisplayName = seedUser.DisplayName,
                    Role = seedUser.Role,
                    IsActive = true,
                    // 首次登录后必须修改密码，提升安全性
                    MustChangePassword = seedUser.Username == "admin",
                    Language = "zh-CN"
                };

                _dbContext.Users.Add(user);
                _logger.LogInformation("已创建用户账户：{Username}（角色：{Role}）", seedUser.Username, seedUser.Role);
            }
        }

        await _dbContext.SaveChangesAsync();

        // 第二租户的 admin 用户（用于 E2E 跨租户隔离测试）
        var secondTenantId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var tenant2AdminExists = await _dbContext.Users
            .IgnoreQueryFilters()
            .AnyAsync(u => u.Username == "tenant2admin");

        if (!tenant2AdminExists)
        {
            var tenant2Admin = new User
            {
                TenantId = secondTenantId,
                Username = "tenant2admin",
                PasswordHash = PasswordHasher.HashPassword("Tenant2@123"),
                DisplayName = "租户B管理员",
                Role = UserRole.SystemAdmin,
                IsActive = true,
                MustChangePassword = false,
                Language = "zh-CN"
            };

            _dbContext.Users.Add(tenant2Admin);
            _logger.LogInformation("已创建第二租户管理员账户：tenant2admin");
        }

        await _dbContext.SaveChangesAsync();
    }

    /// <summary>
    /// 创建行业预置设备类型模板，归属系统租户
    /// 包含 CNC 数控机床、注塑机、空压机三种常见工业设备的监控指标定义
    /// 这些模板对所有租户可见，作为设备创建的起点
    /// </summary>
    private async Task SeedDeviceTypeTemplatesAsync()
    {
        var templates = GetIndustryTemplates();

        foreach (var template in templates)
        {
            var exists = await _dbContext.DeviceTypeTemplates
                .IgnoreQueryFilters()
                .AnyAsync(t => t.TenantId == SystemConstants.SystemTenantId && t.Name == template.Name);

            if (!exists)
            {
                _dbContext.DeviceTypeTemplates.Add(template);
                _logger.LogInformation("已创建行业预置模板：{TemplateName}", template.Name);
            }
        }

        await _dbContext.SaveChangesAsync();
    }

    /// <summary>
    /// 获取行业预置设备类型模板列表
    /// 每个模板包含设备名称、行业分类和 JSONB 格式的参数定义
    /// 参数定义描述了该类型设备的关键监控指标、单位和正常范围
    /// </summary>
    /// <returns>预置模板列表</returns>
    private static List<DeviceTypeTemplate> GetIndustryTemplates()
    {
        return
        [
            new DeviceTypeTemplate
            {
                TenantId = SystemConstants.SystemTenantId,
                Name = "CNC 数控机床",
                Industry = "制造业",
                Parameters = JsonSerializer.Serialize(new
                {
                    metrics = new[]
                    {
                        new { name = "spindle_speed", displayName = "主轴转速", unit = "rpm", range = new { min = 0, max = 15000 } },
                        new { name = "feed_rate", displayName = "进给速度", unit = "mm/min", range = new { min = 0, max = 10000 } },
                        new { name = "coolant_temperature", displayName = "冷却液温度", unit = "°C", range = new { min = 15, max = 45 } },
                        new { name = "vibration", displayName = "振动幅值", unit = "mm/s", range = new { min = 0, max = 10 } },
                        new { name = "power_consumption", displayName = "功率消耗", unit = "kW", range = new { min = 0, max = 30 } }
                    }
                }),
                DefaultAlarmRules = "[]",
                DefaultDiagnosisRules = "[]"
            },
            new DeviceTypeTemplate
            {
                TenantId = SystemConstants.SystemTenantId,
                Name = "注塑机",
                Industry = "制造业",
                Parameters = JsonSerializer.Serialize(new
                {
                    metrics = new[]
                    {
                        new { name = "injection_pressure", displayName = "注射压力", unit = "MPa", range = new { min = 0, max = 200 } },
                        new { name = "melt_temperature", displayName = "熔体温度", unit = "°C", range = new { min = 150, max = 350 } },
                        new { name = "mold_temperature", displayName = "模具温度", unit = "°C", range = new { min = 20, max = 150 } },
                        new { name = "cycle_time", displayName = "成型周期", unit = "s", range = new { min = 5, max = 120 } },
                        new { name = "clamping_force", displayName = "锁模力", unit = "kN", range = new { min = 0, max = 5000 } }
                    }
                }),
                DefaultAlarmRules = "[]",
                DefaultDiagnosisRules = "[]"
            },
            new DeviceTypeTemplate
            {
                TenantId = SystemConstants.SystemTenantId,
                Name = "空压机",
                Industry = "通用",
                Parameters = JsonSerializer.Serialize(new
                {
                    metrics = new[]
                    {
                        new { name = "discharge_pressure", displayName = "排气压力", unit = "MPa", range = new { min = 0.4, max = 1.2 } },
                        new { name = "oil_temperature", displayName = "油温", unit = "°C", range = new { min = 30.0, max = 95.0 } },
                        new { name = "vibration", displayName = "振动幅值", unit = "mm/s", range = new { min = 0.0, max = 8.0 } },
                        new { name = "motor_current", displayName = "电机电流", unit = "A", range = new { min = 0.0, max = 200.0 } },
                        new { name = "air_flow", displayName = "排气量", unit = "m³/min", range = new { min = 0.0, max = 40.0 } }
                    }
                }),
                DefaultAlarmRules = JsonSerializer.Serialize(new object[]
                {
                    new { name = "油温过高", metric = "oil_temperature", ruleType = "threshold", @operator = "gt", threshold = 90.0, severity = "High", cooldownSeconds = 300, enabled = true, autoCreateWorkorder = false },
                    new { name = "振动超标", metric = "vibration", ruleType = "threshold", @operator = "gt", threshold = 7.0, severity = "Critical", cooldownSeconds = 600, enabled = true, autoCreateWorkorder = true },
                    new { name = "排气压力过高", metric = "discharge_pressure", ruleType = "threshold", @operator = "gt", threshold = 1.1, severity = "High", cooldownSeconds = 300, enabled = true, autoCreateWorkorder = false },
                    new { name = "排气压力过低", metric = "discharge_pressure", ruleType = "threshold", @operator = "lt", threshold = 0.5, severity = "High", cooldownSeconds = 300, enabled = true, autoCreateWorkorder = false },
                    new { name = "电机电流过高", metric = "motor_current", ruleType = "threshold", @operator = "gt", threshold = 180.0, severity = "High", cooldownSeconds = 300, enabled = true, autoCreateWorkorder = false }
                }),
                DefaultDiagnosisRules = "[]"
            }
        ];
    }

    /// <summary>
    /// 默认租户 ID（与 SeedTenantsAsync 中的默认租户一致）
    /// </summary>
    private static readonly Guid DefaultTenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    /// <summary>
    /// 种子空压机设备的固定 ID，供模拟器开箱即用（--device-id 参数默认值）
    /// </summary>
    private static readonly Guid SeedAirCompressorId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    /// <summary>
    /// 创建示例空压机设备并提取模板告警规则到 alert_rules 表
    /// 模拟器和端到端测试依赖此设备 + 规则才能走通"采集→告警→AI 分析→工单"全链路
    /// </summary>
    private async Task SeedSampleDeviceAndAlertRulesAsync()
    {
        // 1. 创建种子空压机设备（若不存在）
        var deviceExists = await _dbContext.Devices
            .IgnoreQueryFilters()
            .AnyAsync(d => d.Id == SeedAirCompressorId);

        if (!deviceExists)
        {
            _dbContext.Devices.Add(new Device
            {
                Id = SeedAirCompressorId,
                TenantId = DefaultTenantId,
                DeviceCode = "AC-001",
                Name = "一号空压机",
                Type = "空压机",
                Status = DeviceStatus.Offline,
                Criticality = DeviceCriticality.High,
            });

            // 维护租户设备计数
            var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
                .FirstOrDefaultAsync(t => t.Id == DefaultTenantId);
            if (tenant != null)
                tenant.CurrentDeviceCount++;

            _logger.LogInformation("已创建种子空压机设备（ID: {DeviceId}, DeviceCode: AC-001）", SeedAirCompressorId);
            await _dbContext.SaveChangesAsync();
        }

        // 2. 提取空压机模板的 DefaultAlarmRules 到 alert_rules 表（若尚无空压机规则）
        var hasAirCompressorRules = await _dbContext.AlertRules
            .IgnoreQueryFilters()
            .AnyAsync(r => r.TenantId == DefaultTenantId && r.DeviceType == "空压机");

        if (hasAirCompressorRules)
            return;

        // 查询系统租户的空压机模板
        var template = await _dbContext.DeviceTypeTemplates
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.TenantId == SystemConstants.SystemTenantId && t.Name == "空压机");

        if (template == null || string.IsNullOrWhiteSpace(template.DefaultAlarmRules))
        {
            _logger.LogWarning("空压机模板未找到或无 DefaultAlarmRules，跳过告警规则种子");
            return;
        }

        // 解析模板 JSON 并创建 AlertRule 记录
        try
        {
            using var doc = JsonDocument.Parse(template.DefaultAlarmRules);
            foreach (var element in doc.RootElement.EnumerateArray())
            {
                var rule = ParseAlarmRuleElement(element);
                if (rule != null)
                    _dbContext.AlertRules.Add(rule);
            }

            _logger.LogInformation("已为空压机提取 {Count} 条默认告警规则到 alert_rules 表", doc.RootElement.GetArrayLength());
            await _dbContext.SaveChangesAsync();
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "解析空压机模板 DefaultAlarmRules 失败");
        }
    }

    /// <summary>
    /// 将模板 JSON 元素解析为 AlertRule 实体
    /// </summary>
    private AlertRule? ParseAlarmRuleElement(JsonElement element)
    {
        var name = element.GetProperty("name").GetString();
        var metric = element.GetProperty("metric").GetString();
        if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(metric))
            return null;

        var ruleTypeStr = element.GetProperty("ruleType").GetString() ?? "threshold";
        var operatorStr = element.TryGetProperty("operator", out var opEl) ? opEl.GetString() : null;
        var threshold = element.TryGetProperty("threshold", out var thEl) && thEl.TryGetDecimal(out var th) ? th : (decimal?)null;
        var severityStr = element.TryGetProperty("severity", out var sevEl) ? sevEl.GetString() ?? "Normal" : "Normal";
        var cooldown = element.TryGetProperty("cooldownSeconds", out var cdEl) && cdEl.TryGetInt32(out var cd) ? cd : 300;
        var enabled = element.TryGetProperty("enabled", out var enEl) && enEl.ValueKind == JsonValueKind.False ? false : true;
        var autoWo = element.TryGetProperty("autoCreateWorkorder", out var woEl) && woEl.ValueKind == JsonValueKind.True;

        return new AlertRule
        {
            TenantId = DefaultTenantId,
            Name = name,
            DeviceType = "空压机",
            DeviceId = null,
            Metric = metric,
            RuleType = Enum.TryParse<RuleType>(ruleTypeStr, ignoreCase: true, out var rt) ? rt : RuleType.Threshold,
            Operator = operatorStr,
            Threshold = threshold,
            Severity = Enum.TryParse<AlertSeverity>(severityStr, ignoreCase: true, out var sev) ? sev : AlertSeverity.Normal,
            CooldownSeconds = cooldown,
            Enabled = enabled,
            AutoCreateWorkorder = autoWo,
        };
    }

    /// <summary>
    /// 种子空压机知识规则到系统租户（所有租户共享）
    /// 规则条件与告警阈值对齐，使 L2 规则引擎能在告警触发时给出诊断（无需 LLM Key）
    /// </summary>
    private async Task SeedAirCompressorKnowledgeRulesAsync()
    {
        var hasRules = await _dbContext.KnowledgeRules
            .IgnoreQueryFilters()
            .AnyAsync(r => r.TenantId == SystemConstants.SystemTenantId && r.DeviceType == "空压机");

        if (hasRules)
            return;

        // 规则条件格式：[{metric, operator, threshold}]，与 RuleEngineAnalysisService 的 TryMatchConditions 对齐
        // 使用显式 JSON 字符串确保 jsonb 列正确解析（匿名对象序列化曾导致 invalid input syntax）
        var rules = new[]
        {
            new
            {
                Name = "油温过高诊断",
                Conditions = """[{"metric":"oil_temperature","operator":">","threshold":90.0}]""",
                Conclusion = "润滑油温过高，可能原因：润滑系统故障、冷却不足、轴承磨损",
                RecommendedActions = "检查油位和油泵运行状态；检查冷却器是否堵塞；监测轴承振动趋势",
                ConfidenceWeight = 0.8m,
            },
            new
            {
                Name = "振动超标诊断",
                Conditions = """[{"metric":"vibration","operator":">","threshold":7.0}]""",
                Conclusion = "振动幅值超标，可能原因：轴承磨损、转子不平衡、对中不良",
                RecommendedActions = "检查轴承游隙和润滑；做动平衡校正；检查联轴器对中",
                ConfidenceWeight = 0.75m,
            },
            new
            {
                Name = "排气压力过高诊断",
                Conditions = """[{"metric":"discharge_pressure","operator":">","threshold":1.1}]""",
                Conclusion = "排气压力异常升高，可能原因：排气系统堵塞、阀片故障",
                RecommendedActions = "检查排气过滤器和管路；检查最小压力阀；监测阀片密封",
                ConfidenceWeight = 0.8m,
            },
            new
            {
                Name = "排气压力过低诊断",
                Conditions = """[{"metric":"discharge_pressure","operator":"<","threshold":0.5}]""",
                Conclusion = "排气压力低于正常范围，可能原因：气阀泄漏、进气不足、活塞环磨损",
                RecommendedActions = "检查进气阀和阀片密封；检查管路泄漏；监测排气量变化",
                ConfidenceWeight = 0.75m,
            },
            new
            {
                Name = "电机电流过高诊断",
                Conditions = """[{"metric":"motor_current","operator":">","threshold":180.0}]""",
                Conclusion = "电机电流过载，可能原因：机械过载、电压异常、轴承卡阻",
                RecommendedActions = "检查负载是否超标；测量三相电压平衡；检查轴承转动灵活性",
                ConfidenceWeight = 0.8m,
            },
        };

        foreach (var r in rules)
        {
            _dbContext.KnowledgeRules.Add(new KnowledgeRule
            {
                TenantId = SystemConstants.SystemTenantId,
                DeviceType = "空压机",
                Name = r.Name,
                Conditions = r.Conditions,
                // Conclusion 由 EF Core HasConversion 自动序列化（KnowledgeRuleConfiguration 配置了 jsonb 转换）
                Conclusion = r.Conclusion,
                RecommendedActions = r.RecommendedActions,
                ConfidenceWeight = r.ConfidenceWeight,
                Source = "preset",
                Enabled = true,
            });
        }

        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("已为空压机种子 {Count} 条知识规则到系统租户", rules.Length);
    }
}
