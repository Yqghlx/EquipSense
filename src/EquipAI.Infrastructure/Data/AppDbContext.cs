using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.Infrastructure.Data;

/// <summary>
/// 应用程序数据库上下文，负责：
/// 1. 管理 DbSets 和实体映射
/// 2. 通过全局查询过滤器实现 Day 1 多租户数据隔离
/// 3. 提供忽略租户过滤器的 UnfilteredSet 方法（系统管理场景）
/// </summary>
public class AppDbContext : DbContext
{
    private readonly ITenantContext _tenantContext;

    /// <summary>
    /// 初始化数据库上下文
    /// </summary>
    /// <param name="options">DbContext 配置选项</param>
    /// <param name="tenantContext">租户上下文，用于全局查询过滤器</param>
    public AppDbContext(DbContextOptions<AppDbContext> options, ITenantContext tenantContext)
        : base(options)
    {
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 租户表
    /// </summary>
    public DbSet<Core.Entities.Tenant> Tenants => Set<Core.Entities.Tenant>();

    /// <summary>
    /// 用户表
    /// </summary>
    public DbSet<User> Users => Set<User>();

    /// <summary>
    /// 设备表
    /// </summary>
    public DbSet<Device> Devices => Set<Device>();

    /// <summary>
    /// 设备类型模板表
    /// </summary>
    public DbSet<DeviceTypeTemplate> DeviceTypeTemplates => Set<DeviceTypeTemplate>();

    /// <summary>
    /// 告警规则表
    /// </summary>
    public DbSet<Core.Entities.AlertRule> AlertRules => Set<Core.Entities.AlertRule>();

    /// <summary>
    /// 告警实例表
    /// </summary>
    public DbSet<Core.Entities.Alert> Alerts => Set<Core.Entities.Alert>();

    /// <summary>
    /// 设备遥测时序数据表（TimescaleDB 超级表，无主键）
    /// </summary>
    public DbSet<Entities.DeviceTelemetry> DeviceTelemetry => Set<Entities.DeviceTelemetry>();

    /// <summary>
    /// 指标基线数据表
    /// </summary>
    public DbSet<Core.Entities.MetricBaseline> MetricBaselines => Set<Core.Entities.MetricBaseline>();

    /// <summary>
    /// 模型创建时配置实体映射和全局查询过滤器
    /// 全局查询过滤器确保所有拥有 TenantId 属性的实体自动按租户隔离，
    /// 避免开发人员遗漏租户条件导致数据泄露
    /// </summary>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // 从程序集自动加载所有 IEntityTypeConfiguration 实现
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // 为所有拥有 TenantId 属性的实体注册全局多租户查询过滤器
        // 过滤逻辑：实体租户 ID == 当前请求租户 ID
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            // Tenant 实体本身没有 TenantId 属性，跳过
            if (entityType.ClrType == typeof(Core.Entities.Tenant))
                continue;

            var tenantIdProperty = entityType.FindProperty("TenantId");
            if (tenantIdProperty is null)
                continue;

            // 构建过滤器 Lambda: entity => entity.TenantId == _tenantContext.TenantId
            var parameter = System.Linq.Expressions.Expression.Parameter(entityType.ClrType, "e");
            var propertyAccess = System.Linq.Expressions.Expression.Property(parameter, "TenantId");
            var tenantIdValue = System.Linq.Expressions.Expression.Property(
                System.Linq.Expressions.Expression.Constant(_tenantContext),
                nameof(ITenantContext.TenantId));
            var filter = System.Linq.Expressions.Expression.Lambda(
                System.Linq.Expressions.Expression.Equal(propertyAccess, tenantIdValue),
                parameter);

            modelBuilder.Entity(entityType.ClrType).HasQueryFilter(filter);
        }

        base.OnModelCreating(modelBuilder);
    }

    /// <summary>
    /// 获取不受租户过滤器约束的 DbSet
    /// 仅在系统管理场景下使用，例如：创建租户、查询所有租户的数据
    /// </summary>
    /// <typeparam name="T">实体类型</typeparam>
    /// <returns>不带租户过滤器的查询集合</returns>
    public IQueryable<T> UnfilteredSet<T>() where T : BaseEntity
    {
        return Set<T>().IgnoreQueryFilters();
    }
}
