using EquipAI.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace EquipAI.Infrastructure.Data;

/// <summary>
/// EF Core 迁移设计时上下文工厂。
/// 使用工厂可以避免迁移命令启动完整 WebAPI、连接 Redis 或初始化消息总线。
/// </summary>
public sealed class AppDbContextDesignTimeFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    /// <inheritdoc />
    public AppDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__Default")
            ?? "Host=localhost;Database=equipai;Username=equipai;Password=design-time-only";
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .Options;
        return new AppDbContext(options, new DesignTimeTenantContext());
    }

    /// <summary>
    /// 迁移设计时使用的空租户上下文；只用于生成模型，不执行业务查询。
    /// </summary>
    private sealed class DesignTimeTenantContext : ITenantContext
    {
        /// <inheritdoc />
        public Guid TenantId => Guid.Empty;

        /// <inheritdoc />
        public string IsolationMode => "Shared";

        /// <inheritdoc />
        public bool IsSystemAdmin => true;

        /// <inheritdoc />
        public Guid UserId => Guid.Empty;
    }
}
