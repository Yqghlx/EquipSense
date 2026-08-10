using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace EquipAI.WebAPI;

/// <summary>
/// WebAPI 启动项目的 EF Core 设计时上下文工厂。
/// 
/// 将工厂放在启动项目中可以让 dotnet-ef 直接创建上下文，避免执行顶层 Program 的完整宿主启动流程、
/// 连接 Redis/RabbitMQ 或运行数据库初始化逻辑。
/// </summary>
public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
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
    /// 设计时模型生成使用的空租户上下文，不参与业务请求。
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
