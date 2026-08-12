using System.Text.Json;
using EquipAI.Core.Constants;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
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
    private readonly IHostEnvironment _hostEnvironment;

    /// <summary>
    /// 初始化数据种子器
    /// </summary>
    /// <param name="dbContext">数据库上下文</param>
    /// <param name="logger">日志记录器</param>
    /// <param name="hostEnvironment">宿主环境，用于区分生产凭据策略</param>
    public DataSeeder(
        AppDbContext dbContext,
        ILogger<DataSeeder> logger,
        IHostEnvironment hostEnvironment)
    {
        _dbContext = dbContext;
        _logger = logger;
        _hostEnvironment = hostEnvironment;
    }

    /// <summary>
    /// 执行幂等种子数据初始化。
    /// 数据库 schema 必须由应用启动流程或测试夹具提前创建，本方法不负责建表或迁移。
    /// 所有存在性检查均使用 IgnoreQueryFilters 跨租户查询
    /// </summary>
    public async Task SeedAsync()
    {
        _logger.LogInformation("开始执行数据库种子数据初始化...");

        // 数据修复：早期版本（v1.3.0 前）的种子告警规则硬编码 device_type='空压机'，
        // 导致非空压机设备永远不触发告警。已部署的旧库需要一次性迁移到通用规则（device_type=null）。
        // 新部署的库不受影响（SeedSampleDeviceAndAlertRulesAsync 已用 null）
        await MigrateLegacyAirCompressorRulesToGenericAsync();

        await SeedTenantsAsync();
        await SeedAdminUserAsync();
        await SeedDeviceTypeTemplatesAsync();
        await SeedSampleDeviceAndAlertRulesAsync();
        await SeedAirCompressorKnowledgeRulesAsync();
        await SeedFmeaLibraryAsync();

        _logger.LogInformation("数据库种子数据初始化完成");
    }

    /// <summary>
    /// 数据迁移：把 v1.3.0 前硬编码 device_type='空压机' 的种子告警规则改为通用规则（device_type=null）
    ///
    /// 背景：早期种子数据把所有预置告警规则（振动/温度/压力/电流）绑定到 device_type='空压机'，
    /// 但 AlertEvaluationService 的查询是 `WHERE device_type IS NULL OR device_type = @current_device_type`，
    /// 导致用户在前端创建 type='电机' 或 'motor' 的设备时，即使指标值超阈值也永远不触发告警。
    ///
    /// 此迁移在 startup 时执行一次，幂等（已迁移的库不会重复执行）。
    /// </summary>
    private async Task MigrateLegacyAirCompressorRulesToGenericAsync()
    {
        var affected = await _dbContext.AlertRules
            .IgnoreQueryFilters()
            .Where(r => r.DeviceType == "空压机")
            .ExecuteUpdateAsync(s => s.SetProperty(r => r.DeviceType, (string?)null));

        if (affected > 0)
        {
            _logger.LogInformation(
                "已将 {Count} 条历史种子规则从 device_type='空压机' 迁移为通用规则（device_type=null）",
                affected);
        }
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
    /// 默认用户名 admin，归属默认租户
    /// 同时创建维保主管、技术员、操作员、观察者四种角色的测试用户
    ///
    /// 密码来源（按环境）：
    /// 1. 生产环境必须配置环境变量 SEED_{USERNAME}_PASSWORD
    /// 2. 非生产环境允许使用内置默认密码（仅用于开发/演示）
    ///
    /// 所有种子用户首次登录后必须修改密码（MustChangePassword = true），强制客户重置为强密码。
    /// </summary>
    private async Task SeedAdminUserAsync()
    {
        var defaultTenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        // 定义种子用户列表（Password 字段为开发环境默认值，生产环境应通过环境变量覆盖）
        var seedUsers = new[]
        {
            new { Username = "admin", DefaultPassword = "Admin@123", EnvVar = "SEED_ADMIN_PASSWORD", DisplayName = "系统管理员", Role = UserRole.SystemAdmin },
            new { Username = "lead", DefaultPassword = "Lead@123", EnvVar = "SEED_LEAD_PASSWORD", DisplayName = "维保主管", Role = UserRole.MaintenanceLead },
            new { Username = "tech", DefaultPassword = "Tech@123", EnvVar = "SEED_TECH_PASSWORD", DisplayName = "技术员", Role = UserRole.Technician },
            new { Username = "operator", DefaultPassword = "Operator@123", EnvVar = "SEED_OPERATOR_PASSWORD", DisplayName = "操作员", Role = UserRole.Operator },
            new { Username = "viewer", DefaultPassword = "Viewer@123", EnvVar = "SEED_VIEWER_PASSWORD", DisplayName = "观察者", Role = UserRole.Viewer }
        };

        // 第二租户账户仅在显式开启时创建。生产环境若开启，也必须提供独立密码。
        var seedTenant2Account = Environment.GetEnvironmentVariable("SEED_TENANT2_ACCOUNT")?
            .Equals("true", StringComparison.OrdinalIgnoreCase) == true;

        var seedCredentials = seedUsers.ToDictionary(
            seedUser => seedUser.EnvVar,
            seedUser => Environment.GetEnvironmentVariable(seedUser.EnvVar));
        seedCredentials["SEED_TENANT2_PASSWORD"] =
            Environment.GetEnvironmentVariable("SEED_TENANT2_PASSWORD");
        var allowIsolatedE2eTenant2Account =
            Environment.GetEnvironmentVariable("EQUIPAI_ISOLATED_E2E")
                ?.Equals("true", StringComparison.OrdinalIgnoreCase) == true;
        SeedCredentialValidator.Validate(
            _hostEnvironment.IsProduction(),
            seedCredentials,
            seedTenant2Account,
            allowIsolatedE2eTenant2Account);

        var usingDefaultPassword = false;
        foreach (var seedUser in seedUsers)
        {
            var userExists = await _dbContext.Users
                .IgnoreQueryFilters()
                .AnyAsync(u => u.Username == seedUser.Username);

            if (!userExists)
            {
                // 非生产环境允许回退到演示密码；生产环境已在方法开头完成必填校验。
                var password = Environment.GetEnvironmentVariable(seedUser.EnvVar);
                if (string.IsNullOrEmpty(password))
                {
                    password = seedUser.DefaultPassword;
                    usingDefaultPassword = true;
                }

                var user = new User
                {
                    TenantId = defaultTenantId,
                    Username = seedUser.Username,
                    PasswordHash = PasswordHasher.HashPassword(password),
                    DisplayName = seedUser.DisplayName,
                    Role = seedUser.Role,
                    IsActive = true,
                    // 关键修复：所有种子用户都必须改密码（原代码只强制 admin），
                    // 避免客户拿到系统后 lead/tech/operator/viewer 仍用公开默认密码登录。
                    MustChangePassword = true,
                    Language = "zh-CN"
                };

                _dbContext.Users.Add(user);
                _logger.LogInformation("已创建用户账户：{Username}（角色：{Role}）", seedUser.Username, seedUser.Role);
            }
        }

        // 一次性警告：有种子用户使用了默认密码（非环境变量），生产环境有泄露风险
        if (usingDefaultPassword)
        {
            _logger.LogWarning(
                "种子用户使用了内置默认密码（未设置 SEED_*_PASSWORD 环境变量）。" +
                "生产环境请通过环境变量覆盖所有种子用户密码，避免公开仓库中的默认密码被攻击者利用。" +
                "所有用户首次登录后强制修改密码（MustChangePassword=true）。");
        }

        await _dbContext.SaveChangesAsync();

        // 第二租户的 admin 用户（用于 E2E 跨租户隔离测试）
        //
        // 安全说明：此账户默认密码不强制改密（自动化 E2E 测试需要稳定凭据），
        // 因此默认【不创建】，避免生产环境部署后留下弱口令后门。
        // 仅在显式设置 SEED_TENANT2_ACCOUNT=true 时创建（E2E/CI 环境会注入此变量）。
        //
        // 已存在的历史账户不会被自动删除（避免误删生产数据）；
        // 如部署后不再需要，请手动执行：DELETE FROM users WHERE username = 'tenant2admin'。
        if (!seedTenant2Account)
        {
            // 未显式开启，跳过第二租户账户创建
            return;
        }

        var secondTenantId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var tenant2AdminExists = await _dbContext.Users
            .IgnoreQueryFilters()
            .AnyAsync(u => u.Username == "tenant2admin");

        if (!tenant2AdminExists)
        {
            var tenant2Password = Environment.GetEnvironmentVariable("SEED_TENANT2_PASSWORD")
                ?? "Tenant2@123";
            var tenant2Admin = new User
            {
                TenantId = secondTenantId,
                Username = "tenant2admin",
                PasswordHash = PasswordHasher.HashPassword(tenant2Password),
                DisplayName = "租户B管理员",
                Role = UserRole.SystemAdmin,
                IsActive = true,
                MustChangePassword = false,
                Language = "zh-CN"
            };

            _dbContext.Users.Add(tenant2Admin);
            _logger.LogInformation("已创建第二租户管理员账户：tenant2admin（仅测试用途，SEED_TENANT2_ACCOUNT=true）");
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
                // 关键修复：原 DefaultAlarmRules="[]"，导致客户用 CNC 模板创建设备后告警永远不触发。
                // 阈值依据：模板 metric range 上限的 90-95%（接近上限即预警）+ ISO 10816 振动标准。
                DefaultAlarmRules = JsonSerializer.Serialize(new object[]
                {
                    new { name = "主轴转速超限", metric = "spindle_speed", ruleType = "threshold", @operator = "gt", threshold = 14500.0, severity = "High", cooldownSeconds = 300, enabled = true, autoCreateWorkorder = false },
                    new { name = "冷却液温度过高", metric = "coolant_temperature", ruleType = "threshold", @operator = "gt", threshold = 50.0, severity = "High", cooldownSeconds = 300, enabled = true, autoCreateWorkorder = false },
                    new { name = "振动超标", metric = "vibration", ruleType = "threshold", @operator = "gt", threshold = 7.0, severity = "Critical", cooldownSeconds = 600, enabled = true, autoCreateWorkorder = true },
                    new { name = "功率消耗过高", metric = "power_consumption", ruleType = "threshold", @operator = "gt", threshold = 28.0, severity = "Medium", cooldownSeconds = 300, enabled = true, autoCreateWorkorder = false }
                }),
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
                // 关键修复：原 DefaultAlarmRules="[]"，客户用注塑机模板创建设备后告警永远不触发。
                // 阈值依据：模板 metric range 上限的 90-95%（接近上限即预警）+ 注塑机工艺安全规范。
                DefaultAlarmRules = JsonSerializer.Serialize(new object[]
                {
                    new { name = "注射压力过高", metric = "injection_pressure", ruleType = "threshold", @operator = "gt", threshold = 180.0, severity = "Critical", cooldownSeconds = 300, enabled = true, autoCreateWorkorder = true },
                    new { name = "熔体温度过高", metric = "melt_temperature", ruleType = "threshold", @operator = "gt", threshold = 340.0, severity = "High", cooldownSeconds = 300, enabled = true, autoCreateWorkorder = false },
                    new { name = "模具温度过高", metric = "mold_temperature", ruleType = "threshold", @operator = "gt", threshold = 160.0, severity = "Medium", cooldownSeconds = 300, enabled = true, autoCreateWorkorder = false },
                    new { name = "成型周期过长", metric = "cycle_time", ruleType = "threshold", @operator = "gt", threshold = 110.0, severity = "Low", cooldownSeconds = 600, enabled = true, autoCreateWorkorder = false },
                    new { name = "锁模力过高", metric = "clamping_force", ruleType = "threshold", @operator = "gt", threshold = 4500.0, severity = "High", cooldownSeconds = 300, enabled = true, autoCreateWorkorder = false }
                }),
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

        // 2. 提取所有模板的 DefaultAlarmRules 到 alert_rules 表（若尚无通用告警规则）
        // 注意：种子规则 DeviceType=null（通用），按 metric 维度去重（同一 metric 只保留第一条）
        //
        // 关键修复：原代码只提取空压机模板，导致 CNC / 注塑机模板即使配了规则也不生效。
        // 客户用 CNC 模板创建设备后告警永远不触发（振动/温度/功率异常全部漏报）。
        // 现在改为遍历所有行业模板，metric 去重后写入 alert_rules 作为通用规则。
        var hasGenericRules = await _dbContext.AlertRules
            .IgnoreQueryFilters()
            .AnyAsync(r => r.TenantId == DefaultTenantId && r.DeviceType == null);

        if (hasGenericRules)
            return;

        var templates = await _dbContext.DeviceTypeTemplates
            .IgnoreQueryFilters()
            .Where(t => t.TenantId == SystemConstants.SystemTenantId)
            .ToListAsync();

        if (templates.Count == 0)
        {
            _logger.LogWarning("未找到任何行业模板，跳过告警规则种子");
            return;
        }

        // 按 metric 去重：不同模板可能定义同名 metric（如 vibration 同时出现在空压机和 CNC 中）
        // 取第一个出现的定义（模板顺序：空压机 → CNC → 注塑机）
        var seenMetrics = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var addedCount = 0;

        foreach (var template in templates)
        {
            if (string.IsNullOrWhiteSpace(template.DefaultAlarmRules))
                continue;

            try
            {
                using var doc = JsonDocument.Parse(template.DefaultAlarmRules);
                foreach (var element in doc.RootElement.EnumerateArray())
                {
                    var rule = ParseAlarmRuleElement(element);
                    if (rule == null) continue;

                    if (!seenMetrics.Add(rule.Metric.ToLowerInvariant()))
                        continue;  // 该 metric 已有规则，跳过

                    _dbContext.AlertRules.Add(rule);
                    addedCount++;
                }
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "解析模板 {TemplateName} 的 DefaultAlarmRules 失败", template.Name);
            }
        }

        if (addedCount > 0)
        {
            await _dbContext.SaveChangesAsync();
            _logger.LogInformation("已为 {Count} 个模板提取 {RuleCount} 条默认告警规则到 alert_rules 表（按 metric 去重）",
                templates.Count, addedCount);
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
            // DeviceType=null 让规则成为「通用规则」，匹配任意设备类型
            // 设计权衡：空压机的振动/温度阈值参考 ISO 10816 / 一般机械安全工况，对其他旋转设备（电机、泵、风机）大体适用。
            // 若需特定设备的精细阈值，可由用户在前端新建 device_type 专用规则覆盖。
            // 此前硬编码 "空压机" 会导致用户建非空压机设备时告警永不触发（CLAUDE.md 误标"已完成"的真实 bug）。
            DeviceType = null,
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

    /// <summary>
    /// 种子 FMEA 故障模式库（覆盖 5 类常见工业设备）
    /// </summary>
    private async Task SeedFmeaLibraryAsync()
    {
        var fmeaExists = await _dbContext.FmeaLibrary.IgnoreQueryFilters().AnyAsync();
        if (fmeaExists) return;

        var defaultTenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        var entries = new[]
        {
            // 空压机
            new FmeaEntry { TenantId = defaultTenantId, DeviceType = "空压机", FailureMode = "电机过载", Cause = "负载过大或冷却不足", Effect = "电机烧毁导致停机", Detection = "电流 > 180A 持续 5 分钟", RecommendedAction = "减小负载，检查冷却系统", Severity = 8, Occurrence = 4, Detectability = 3, Rpn = 96 },
            new FmeaEntry { TenantId = defaultTenantId, DeviceType = "空压机", FailureMode = "排气压力异常", Cause = "气阀泄漏或滤芯堵塞", Effect = "产气效率下降", Detection = "排气压力 < 0.5MPa 或 > 1.1MPa", RecommendedAction = "检查气阀密封，更换滤芯", Severity = 6, Occurrence = 5, Detectability = 2, Rpn = 60 },
            new FmeaEntry { TenantId = defaultTenantId, DeviceType = "空压机", FailureMode = "油温过高", Cause = "润滑油不足或冷却器失效", Effect = "润滑油变质加速磨损", Detection = "油温 > 90°C", RecommendedAction = "补充润滑油，清洗冷却器", Severity = 7, Occurrence = 3, Detectability = 2, Rpn = 42 },
            // 离心泵
            new FmeaEntry { TenantId = defaultTenantId, DeviceType = "离心泵", FailureMode = "轴承磨损", Cause = "润滑不足或对中不良", Effect = "振动增大导致密封失效", Detection = "振动 > 7mm/s", RecommendedAction = "检查润滑和对中，必要时更换轴承", Severity = 7, Occurrence = 5, Detectability = 3, Rpn = 105 },
            new FmeaEntry { TenantId = defaultTenantId, DeviceType = "离心泵", FailureMode = "密封泄漏", Cause = "密封件老化或磨损", Effect = "介质泄漏环境污染", Detection = "目视检查或泄漏检测器", RecommendedAction = "更换机械密封件", Severity = 8, Occurrence = 3, Detectability = 4, Rpn = 96 },
            // 电机
            new FmeaEntry { TenantId = defaultTenantId, DeviceType = "电机", FailureMode = "定子绕组过热", Cause = "过载或散热不良", Effect = "绝缘老化缩短寿命", Detection = "绕组温度 > 120°C", RecommendedAction = "减小负载，检查散热风扇", Severity = 9, Occurrence = 3, Detectability = 3, Rpn = 81 },
            new FmeaEntry { TenantId = defaultTenantId, DeviceType = "电机", FailureMode = "转子不平衡", Cause = "积垢或材料不均匀", Effect = "振动增大加速轴承磨损", Detection = "振动频谱 1x 分量突出", RecommendedAction = "动平衡校正", Severity = 6, Occurrence = 4, Detectability = 5, Rpn = 120 },
            // 风机
            new FmeaEntry { TenantId = defaultTenantId, DeviceType = "风机", FailureMode = "叶片磨损", Cause = "粉尘颗粒冲刷", Effect = "风量下降效率降低", Detection = "风量下降 > 15%", RecommendedAction = "更换叶片或喷涂耐磨涂层", Severity = 5, Occurrence = 6, Detectability = 4, Rpn = 120 },
            new FmeaEntry { TenantId = defaultTenantId, DeviceType = "风机", FailureMode = "轴承故障", Cause = "润滑失效或疲劳剥落", Effect = "突然停机可能引发联锁停车", Detection = "振动加速度 > 10g", RecommendedAction = "更换轴承", Severity = 8, Occurrence = 3, Detectability = 3, Rpn = 72 },
            // 变压器
            new FmeaEntry { TenantId = defaultTenantId, DeviceType = "变压器", FailureMode = "绕组过热", Cause = "过载或冷却系统故障", Effect = "绝缘老化可能引发短路", Detection = "顶层油温 > 85°C", RecommendedAction = "降低负载，检查冷却系统", Severity = 9, Occurrence = 2, Detectability = 2, Rpn = 36 },
            new FmeaEntry { TenantId = defaultTenantId, DeviceType = "变压器", FailureMode = "油位异常", Cause = "渗漏或油膨胀收缩", Effect = "绝缘性能下降", Detection = "油位计读数异常", RecommendedAction = "检查渗漏点，补充变压器油", Severity = 6, Occurrence = 3, Detectability = 2, Rpn = 36 },
        };

        await _dbContext.FmeaLibrary.AddRangeAsync(entries);
        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("已种子 {Count} 条 FMEA 故障模式数据（5 类设备）", entries.Length);
    }
}
