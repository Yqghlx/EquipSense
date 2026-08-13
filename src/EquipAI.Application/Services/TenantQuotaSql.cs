using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace EquipAI.Application.Services;

/// <summary>
/// 租户资源配额的关系型原子预留实现。
/// </summary>
/// <remarks>
/// 计数器是热路径缓存，历史数据修复、导入失败或并发操作都可能让它短暂漂移。
/// 预留时先锁定租户行，再用新的数据库语句统计真实行数并更新计数，
/// 使普通创建、快速注册和批量导入共享同一并发安全边界。
/// </remarks>
internal static class TenantQuotaSql
{
    private const string NpgsqlProviderName = "Npgsql.EntityFrameworkCore.PostgreSQL";
    private const string SqliteProviderName = "Microsoft.EntityFrameworkCore.Sqlite";

    /// <summary>
    /// 按真实设备数量原子预留设备席位，并修正设备计数器。
    /// </summary>
    public static async Task<int> TryReserveDeviceSlotsAsync(
        AppDbContext dbContext, Guid tenantId, int amount, CancellationToken ct)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(amount);

        if (!await LockTenantRowAsync(dbContext, tenantId, ct))
            return 0;

        return await dbContext.Database.ExecuteSqlInterpolatedAsync($"""
            UPDATE tenants
            SET current_device_count = (
                SELECT CAST(COUNT(*) AS INTEGER)
                FROM devices
                WHERE devices.tenant_id = tenants."Id"
            ) + {amount}
            WHERE tenants."Id" = {tenantId}
              AND (
                  tenants.max_devices <= 0
                  OR (
                      SELECT CAST(COUNT(*) AS INTEGER)
                      FROM devices
                      WHERE devices.tenant_id = tenants."Id"
                  ) + {amount} <= tenants.max_devices
              )
            """, ct);
    }

    /// <summary>
    /// 按真实有效用户数量原子预留用户席位，并修正用户计数器。
    /// </summary>
    public static async Task<int> TryReserveUserSlotsAsync(
        AppDbContext dbContext, Guid tenantId, int amount, CancellationToken ct)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(amount);

        if (!await LockTenantRowAsync(dbContext, tenantId, ct))
            return 0;

        return await dbContext.Database.ExecuteSqlInterpolatedAsync($"""
            UPDATE tenants
            SET current_user_count = (
                SELECT CAST(COUNT(*) AS INTEGER)
                FROM users
                WHERE users.tenant_id = tenants."Id"
                  AND users.is_active = TRUE
            ) + {amount}
            WHERE tenants."Id" = {tenantId}
              AND (
                  tenants.max_users <= 0
                  OR (
                      SELECT CAST(COUNT(*) AS INTEGER)
                      FROM users
                      WHERE users.tenant_id = tenants."Id"
                        AND users.is_active = TRUE
                  ) + {amount} <= tenants.max_users
              )
            """, ct);
    }

    /// <summary>
    /// 在统计真实资源数之前锁定租户行。
    /// </summary>
    /// <remarks>
    /// 不能把“锁行、统计、更新”压进同一条 PostgreSQL UPDATE：在 READ COMMITTED 下，
    /// 一个事务等待另一个事务的行锁时，相关子查询仍可能沿用语句开始时的旧快照，
    /// 从而让两个并发创建都通过配额判断。先独立执行 FOR UPDATE，等待结束后再发出
    /// 下一条统计语句，才能获得前一事务提交后的新快照并真正串行化同租户预留。
    /// </remarks>
    internal static async Task<bool> LockTenantRowAsync(
        AppDbContext dbContext,
        Guid tenantId,
        CancellationToken ct)
    {
        var transaction = dbContext.Database.CurrentTransaction
            ?? throw new InvalidOperationException("租户配额预留必须在显式数据库事务内执行");
        var providerName = dbContext.Database.ProviderName;

        // SQLite 写事务本身会串行化写入，且不支持 SELECT ... FOR UPDATE；
        // 该分支仅用于关系型单元测试，生产数据库固定为 PostgreSQL。
        if (string.Equals(providerName, SqliteProviderName, StringComparison.Ordinal))
            return true;

        if (!string.Equals(providerName, NpgsqlProviderName, StringComparison.Ordinal))
        {
            throw new NotSupportedException(
                $"数据库提供程序 {providerName ?? "<unknown>"} 未实现租户配额行锁语义");
        }

        var connection = dbContext.Database.GetDbConnection();
        await using var command = connection.CreateCommand();
        command.Transaction = transaction.GetDbTransaction();
        command.CommandText = """
            SELECT 1
            FROM tenants
            WHERE "Id" = @tenant_id
            FOR UPDATE
            """;

        var tenantIdParameter = command.CreateParameter();
        tenantIdParameter.ParameterName = "tenant_id";
        tenantIdParameter.Value = tenantId;
        command.Parameters.Add(tenantIdParameter);

        return await command.ExecuteScalarAsync(ct) is not null;
    }
}
