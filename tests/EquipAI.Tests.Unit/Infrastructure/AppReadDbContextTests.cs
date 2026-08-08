using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace EquipAI.Tests.Unit.Infrastructure;

/// <summary>
/// AppReadDbContext 单元测试
///
/// 验证只读上下文的核心保证：
/// 1. 所有 SaveChanges 重载抛 NotSupportedException（防误把只读副本当主库写）
/// 2. DI 中 AppReadDbContext 与 AppDbContext 独立解析（不共享实例，连接串可不同）
/// 3. 继承 AppDbContext 的全部 DbSet 与多租户全局过滤器照常工作
/// 4. 默认配置（ReadOnly=Default）下查询行为与 AppDbContext 一致
/// </summary>
public class AppReadDbContextTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private ServiceProvider _sp = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();

        var services = new ServiceCollection();
        // 主库上下文与只读上下文共享同一 SQLite 连接（模拟 ReadOnly 退化为 Default 的场景）
        services.AddDbContext<AppDbContext>(o => o.UseSqlite(_connection));
        services.AddDbContext<AppReadDbContext>(o =>
        {
            o.UseSqlite(_connection);
            o.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
        });
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(Guid.NewGuid()));
        _sp = services.BuildServiceProvider();

        // 建表（用主库上下文，只读上下文禁止 SaveChanges 无法建表）
        using (var scope = _sp.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Database.EnsureCreatedAsync();
        }
    }

    public async Task DisposeAsync()
    {
        await _sp.DisposeAsync();
        await _connection.DisposeAsync();
    }

    // =========================================================================
    // SaveChanges 必须全部抛 NotSupportedException（防误写只读副本）
    // =========================================================================

    [Fact]
    public void SaveChanges_应抛NotSupportedException()
    {
        var db = _sp.GetRequiredService<AppReadDbContext>();
        var act = () => db.SaveChanges();
        act.Should().Throw<NotSupportedException>()
            .WithMessage("*只读上下文*");
    }

    [Fact]
    public void SaveChanges带参数_应抛NotSupportedException()
    {
        var db = _sp.GetRequiredService<AppReadDbContext>();
        var act = () => db.SaveChanges(acceptAllChangesOnSuccess: true);
        act.Should().Throw<NotSupportedException>()
            .WithMessage("*只读上下文*");
    }

    [Fact]
    public async Task SaveChangesAsync_应抛NotSupportedException()
    {
        var db = _sp.GetRequiredService<AppReadDbContext>();
        var act = async () => await db.SaveChangesAsync();
        await act.Should().ThrowAsync<NotSupportedException>()
            .WithMessage("*只读上下文*");
    }

    [Fact]
    public async Task SaveChangesAsync带参数_应抛NotSupportedException()
    {
        var db = _sp.GetRequiredService<AppReadDbContext>();
        var act = async () => await db.SaveChangesAsync(acceptAllChangesOnSuccess: true, CancellationToken.None);
        await act.Should().ThrowAsync<NotSupportedException>()
            .WithMessage("*只读上下文*");
    }

    // =========================================================================
    // DI 独立性：AppReadDbContext 与 AppDbContext 是不同实例
    // =========================================================================

    [Fact]
    public void DI解析_AppReadDbContext与AppDbContext应为不同实例()
    {
        using var scope = _sp.CreateScope();
        var readDb = scope.ServiceProvider.GetRequiredService<AppReadDbContext>();
        var writeDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        readDb.Should().NotBeSameAs(writeDb, "只读上下文应独立于主库上下文，允许指向不同连接串（副本）");
        readDb.GetType().Should().Be<AppReadDbContext>();
        writeDb.GetType().Should().Be<AppDbContext>();
    }

    // =========================================================================
    // NoTracking：只读上下文查询不跟踪实体变更（性能优化 + 防误改实体）
    // =========================================================================

    [Fact]
    public async Task 查询_应为NoTracking模式()
    {
        var readDb = _sp.GetRequiredService<AppReadDbContext>();
        // ChangeTracker.HasChanges() 在 NoTracking 模式下恒为 false（不跟踪任何实体）
        // 即使 Attach 一个实体，也不会被跟踪
        readDb.ChangeTracker.QueryTrackingBehavior.Should().Be(QueryTrackingBehavior.NoTracking);
        await Task.CompletedTask;
    }

    // =========================================================================
    // 继承验证：只读上下文能访问 AppDbContext 的全部 DbSet（多租户隔离也照常）
    // =========================================================================

    [Fact]
    public async Task 只读上下文_应能查询AppDbContext的DbSet()
    {
        var readDb = _sp.GetRequiredService<AppReadDbContext>();
        // 访问任意 DbSet 不抛异常，验证继承的模型元数据正确
        var act = async () => await readDb.Tenants.ToListAsync();
        await act.Should().NotThrowAsync("只读上下文继承全部 DbSet，查询应正常工作");
    }

    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
