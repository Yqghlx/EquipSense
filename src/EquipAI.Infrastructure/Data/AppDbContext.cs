using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.Infrastructure.Data;

/// <summary>
/// 应用程序数据库上下文
/// </summary>
public class AppDbContext : DbContext
{
    private readonly ITenantContext _tenantContext;

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
    /// AI 分析结果表
    /// </summary>
    public DbSet<Core.Entities.Analysis> Analyses => Set<Core.Entities.Analysis>();

    /// <summary>
    /// 工单表
    /// </summary>
    public DbSet<Core.Entities.WorkOrder> WorkOrders => Set<Core.Entities.WorkOrder>();

    /// <summary>
    /// 工单日志表
    /// </summary>
    public DbSet<Core.Entities.WorkOrderLog> WorkOrderLogs => Set<Core.Entities.WorkOrderLog>();

    /// <summary>
    /// 正式知识规则表
    /// </summary>
    public DbSet<KnowledgeRule> KnowledgeRules => Set<KnowledgeRule>();

    /// <summary>
    /// 候选规则表（AI 生成，待专家审核）
    /// </summary>
    public DbSet<PendingRule> PendingRules => Set<PendingRule>();

    /// <summary>
    /// 故障案例表
    /// </summary>
    public DbSet<FaultCase> FaultCases => Set<FaultCase>();

    /// <summary>
    /// 知识规则版本快照表
    /// </summary>
    public DbSet<KnowledgeRuleVersion> KnowledgeRuleVersions => Set<KnowledgeRuleVersion>();

    /// <summary>
    /// 技术人员画像表
    /// </summary>
    public DbSet<TechnicianProfile> TechnicianProfiles => Set<TechnicianProfile>();

    /// <summary>
    /// 审计日志表
    /// </summary>
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    /// <summary>
    /// 网关设备配置表 — 边缘网关的设备连接参数
    /// </summary>
    public DbSet<Core.Entities.GatewayDevice> GatewayDevices => Set<Core.Entities.GatewayDevice>();

    /// <summary>
    /// 审批链模板表
    /// </summary>
    public DbSet<Core.Entities.ApprovalChainTemplate> ApprovalChainTemplates => Set<Core.Entities.ApprovalChainTemplate>();

    /// <summary>
    /// 审批步骤表
    /// </summary>
    public DbSet<Core.Entities.ApprovalStep> ApprovalSteps => Set<Core.Entities.ApprovalStep>();

    /// <summary>
    /// 工单审批记录表
    /// </summary>
    public DbSet<Core.Entities.WorkOrderApproval> WorkOrderApprovals => Set<Core.Entities.WorkOrderApproval>();

    /// <summary>
    /// 集成推送日志表 — 记录每次外部集成调用的完整信息
    /// </summary>
    public DbSet<Core.Entities.IntegrationPushLog> IntegrationPushLogs => Set<Core.Entities.IntegrationPushLog>();

    /// <summary>
    /// Web Push 推送订阅表
    /// </summary>
    public DbSet<PushSubscription> PushSubscriptions => Set<PushSubscription>();

    /// <summary>
    /// 通知记录表
    /// </summary>
    public DbSet<Core.Entities.Notification> Notifications => Set<Core.Entities.Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // 全局多租户查询过滤器
        // 关键：不能直接引用 _tenantContext，因为 OnModelCreating 只执行一次（模型缓存）
        // 必须通过 Expression 访问 ITenantContext.TenantId，使其每次查询时动态评估
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (entityType.ClrType == typeof(Core.Entities.Tenant))
                continue;

            var tenantIdProperty = entityType.FindProperty("TenantId");
            if (tenantIdProperty is null)
                continue;

            // 使用 Func<Func<ITenantContext>> 延迟解析，确保每次查询使用当前请求的租户上下文
            var parameter = System.Linq.Expressions.Expression.Parameter(entityType.ClrType, "e");
            var propertyAccess = System.Linq.Expressions.Expression.Property(parameter, "TenantId");
            // 通过闭包访问 _tenantContext，EF Core 每次查询时都会重新评估此表达式
            var tenantIdValue = System.Linq.Expressions.Expression.Call(
                System.Linq.Expressions.Expression.Constant(this),
                nameof(GetCurrentTenantId),
                null);
            var filter = System.Linq.Expressions.Expression.Lambda(
                System.Linq.Expressions.Expression.Equal(propertyAccess, tenantIdValue),
                parameter);

            modelBuilder.Entity(entityType.ClrType).HasQueryFilter(filter);
        }

        base.OnModelCreating(modelBuilder);
    }

    /// <summary>
    /// 获取当前请求的租户 ID，供全局查询过滤器使用
    /// </summary>
    private Guid GetCurrentTenantId() => _tenantContext.TenantId;

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
