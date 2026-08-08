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
    public TestAppDbContext(DbContextOptions<AppDbContext> options, ITenantContext tenantContext)
        : base(options, tenantContext)
    {
    }

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
