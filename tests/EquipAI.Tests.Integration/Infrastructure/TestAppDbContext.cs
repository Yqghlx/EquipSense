using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace EquipAI.Tests.Integration.Infrastructure;

/// <summary>
/// 测试专用的 AppDbContext 子类
/// 覆写 OnModelCreating，将 PostgreSQL 特有的列类型（如 jsonb）替换为 SQLite 兼容的类型
/// 确保在 SQLite InMemory 环境下不会因不支持的列类型而报错
/// </summary>
public class TestAppDbContext : AppDbContext
{
    private readonly ITenantContext _testTenantContext;

    public TestAppDbContext(DbContextOptions<AppDbContext> options, ITenantContext tenantContext)
        : base(options, tenantContext)
    {
        // 保存租户上下文引用，供 GetCurrentTenantId 方法使用
        _testTenantContext = tenantContext;
    }

    /// <summary>
    /// 声明与基类同名的方法，解决 Expression.Call 在子类类型上找不到方法的问题。
    /// 基类 AppDbContext.OnModelCreating 中使用 Expression.Call(constant(this), "GetCurrentTenantId", null)
    /// 构建多租户查询过滤器。当 DI 容器创建 TestAppDbContext 实例时，Expression.Constant(this) 的运行时类型
    /// 是 TestAppDbContext，而基类的 GetCurrentTenantId 是 private 的，Expression.Call 无法在子类类型上找到。
    /// 通过在子类中声明同名方法，确保表达式能正确绑定。
    /// </summary>
    private Guid GetCurrentTenantId() => _testTenantContext.TenantId;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // 先调用基类的模型构建，应用所有生产环境的 Entity Configuration
        base.OnModelCreating(modelBuilder);

        // 遍历所有实体类型的所有属性，将 PostgreSQL 特有的列类型替换为 SQLite 兼容类型
        foreach (IMutableEntityType entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (IMutableProperty property in entityType.GetProperties())
            {
                string? columnType = property.GetColumnType();
                if (columnType is not null)
                {
                    // 将 jsonb 替换为 TEXT（SQLite 原生支持 JSON 文本存储）
                    if (columnType.Equals("jsonb", StringComparison.OrdinalIgnoreCase))
                    {
                        property.SetColumnType("TEXT");
                    }
                }
            }
        }
    }
}
