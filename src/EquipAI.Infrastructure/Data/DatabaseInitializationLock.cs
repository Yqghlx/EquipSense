using Microsoft.EntityFrameworkCore;

namespace EquipAI.Infrastructure.Data;

/// <summary>
/// 为数据库迁移、种子数据和 TimescaleDB 初始化提供跨进程互斥。
/// </summary>
/// <remarks>
/// 蓝绿发布会让新旧后端短暂并行启动。PostgreSQL 的 advisory lock 绑定数据库会话，
/// 因此可以让多个容器安全地串行完成启动初始化，同时不向业务表引入额外锁记录。
/// SQLite 和 InMemory 仅用于开发或测试，不执行 PostgreSQL 专属锁语句。
/// </remarks>
public static class DatabaseInitializationLock
{
    private const string AdvisoryLockSql =
        "SELECT pg_advisory_lock(hashtext('equipsense:database-initialization'))";
    private const string AdvisoryUnlockSql =
        "SELECT pg_advisory_unlock(hashtext('equipsense:database-initialization'))";

    /// <summary>
    /// 判断指定的 EF Core provider 是否需要 PostgreSQL 会话级互斥锁。
    /// </summary>
    /// <param name="providerName">EF Core 数据库 provider 名称。</param>
    /// <returns>使用 Npgsql 时返回 <see langword="true"/>。</returns>
    internal static bool RequiresAdvisoryLock(string? providerName)
        => string.Equals(
            providerName,
            "Npgsql.EntityFrameworkCore.PostgreSQL",
            StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// 获取数据库初始化锁。
    /// </summary>
    /// <param name="dbContext">用于执行迁移和初始化的数据库上下文。</param>
    /// <param name="cancellationToken">取消令牌。</param>
    /// <returns>释放时自动解锁并关闭本次保持的数据库连接的租约。</returns>
    public static async Task<IAsyncDisposable> AcquireAsync(
        DbContext dbContext,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(dbContext);

        if (!RequiresAdvisoryLock(dbContext.Database.ProviderName))
            return NoopLease.Instance;

        await dbContext.Database.OpenConnectionAsync(cancellationToken);
        try
        {
            // 必须保持连接打开，确保锁与当前初始化会话绑定；不能改用连接池之外的独立连接。
            await dbContext.Database.ExecuteSqlRawAsync(AdvisoryLockSql, cancellationToken);
            return new PostgreSqlLease(dbContext);
        }
        catch
        {
            await dbContext.Database.CloseConnectionAsync();
            throw;
        }
    }

    /// <summary>
    /// PostgreSQL advisory lock 租约，负责保证异常路径也释放锁。
    /// </summary>
    private sealed class PostgreSqlLease : IAsyncDisposable
    {
        private readonly DbContext _dbContext;
        private int _disposed;

        public PostgreSqlLease(DbContext dbContext)
        {
            _dbContext = dbContext;
        }

        /// <inheritdoc />
        public async ValueTask DisposeAsync()
        {
            if (Interlocked.Exchange(ref _disposed, 1) != 0)
                return;

            try
            {
                // 解锁失败时仍必须关闭连接，避免连接池把持锁会话重新分配给其他请求。
                await _dbContext.Database.ExecuteSqlRawAsync(
                    AdvisoryUnlockSql,
                    CancellationToken.None);
            }
            finally
            {
                await _dbContext.Database.CloseConnectionAsync();
            }
        }
    }

    /// <summary>
    /// 非 PostgreSQL provider 使用的空租约。
    /// </summary>
    private sealed class NoopLease : IAsyncDisposable
    {
        public static NoopLease Instance { get; } = new();

        /// <inheritdoc />
        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }
}
