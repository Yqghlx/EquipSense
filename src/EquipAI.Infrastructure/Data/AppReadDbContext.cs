using EquipAI.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.Infrastructure.Data;

/// <summary>
/// 只读数据库上下文 — 用于查询路径分离（CQRS 读侧）。
///
/// 继承 <see cref="AppDbContext"/> 复用全部 DbSet 与多租户全局过滤器，
/// 通过独立的连接配置（<c>ConnectionStrings:ReadOnly</c>）连接到只读副本，
/// 与主库 <see cref="AppDbContext"/> 隔离。
///
/// 设计取舍：
///   - **默认退化为单库**：未配置独立 ReadOnly 连接时，DI 注入的 AppReadDbContext
///     指向主库 Default，行为与直接用 AppDbContext 一致（无副本也能安全部署）。
///   - **NoTracking 优化**：注册时设 QueryTrackingBehavior.NoTracking，跳过变更跟踪，
///     复杂分析查询（遥测聚合、历史告警）更快、内存更低。
///   - **禁止写**：重写所有 SaveChanges 重载抛 NotSupportedException，
///     防止误把只读副本当主库写入（replica 通常为只读角色，写会直接失败或被丢弃）。
///   - **多租户隔离保留**：OnModelCreating 继承自基类，全局 TenantId 过滤器照常生效。
///
/// 使用方式：纯读 QueryService 注入 AppReadDbContext（而非 AppDbContext）。
/// 含写操作的服务（如 AlertQueryService 的 AcknowledgeAsync）继续用 AppDbContext。
/// </summary>
public class AppReadDbContext : AppDbContext
{
    /// <summary>
    /// 构造只读上下文。
    /// 转发到基类的 protected 非泛型构造函数（<c>AppDbContext(DbContextOptions, ITenantContext)</c>），
    /// 该构造函数把 options 透传给 EF Core DbContext 基类。EF Core 按 options 内的 ContextType
    /// 字段识别上下文身份（AppReadDbContext），不依赖泛型参数匹配，因此非泛型转发是安全的。
    /// </summary>
    public AppReadDbContext(DbContextOptions<AppReadDbContext> options, ITenantContext tenantContext)
        : base((DbContextOptions)options, tenantContext)
    {
    }

    /// <summary>
    /// 只读上下文禁止写：任何 SaveChanges 都直接拒绝。
    /// 只读副本（read replica）通常是只读角色，写入会失败或被数据库拒绝；
    /// 在应用层提前拦截，给出明确错误信息而非让数据库报错。
    /// </summary>
    public override int SaveChanges(bool acceptAllChangesOnSuccess)
        => throw new NotSupportedException(
            "AppReadDbContext 是只读上下文，禁止 SaveChanges。写操作请注入 AppDbContext。");

    public override int SaveChanges()
        => throw new NotSupportedException(
            "AppReadDbContext 是只读上下文，禁止 SaveChanges。写操作请注入 AppDbContext。");

    public override Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default)
        => throw new NotSupportedException(
            "AppReadDbContext 是只读上下文，禁止 SaveChangesAsync。写操作请注入 AppDbContext。");

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => throw new NotSupportedException(
            "AppReadDbContext 是只读上下文，禁止 SaveChangesAsync。写操作请注入 AppDbContext。");
}
