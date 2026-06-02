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

        // 确保数据库和表结构已创建（开发环境使用 EnsureCreated，生产环境应使用 Migrations）
        await _dbContext.Database.EnsureCreatedAsync();

        await SeedTenantsAsync();
        await SeedAdminUserAsync();
        await SeedDeviceTypeTemplatesAsync();

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

        await _dbContext.SaveChangesAsync();
    }

    /// <summary>
    /// 创建超级管理员账户
    /// 默认用户名 admin，密码 Admin@123，归属默认租户
    /// 首次登录后必须修改密码（MustChangePassword = true）
    /// </summary>
    private async Task SeedAdminUserAsync()
    {
        var adminUsername = "admin";
        var adminExists = await _dbContext.Users
            .IgnoreQueryFilters()
            .AnyAsync(u => u.Username == adminUsername);

        if (!adminExists)
        {
            var defaultTenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

            var adminUser = new User
            {
                TenantId = defaultTenantId,
                Username = adminUsername,
                PasswordHash = PasswordHasher.HashPassword("Admin@123"),
                DisplayName = "系统管理员",
                Role = UserRole.SystemAdmin,
                IsActive = true,
                // 首次登录后必须修改密码，提升安全性
                MustChangePassword = true,
                Language = "zh-CN"
            };

            _dbContext.Users.Add(adminUser);
            await _dbContext.SaveChangesAsync();
            _logger.LogInformation("已创建超级管理员账户（用户名: admin）");
        }
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
                DefaultAlarmRules = "[]",
                DefaultDiagnosisRules = "[]"
            }
        ];
    }
}
