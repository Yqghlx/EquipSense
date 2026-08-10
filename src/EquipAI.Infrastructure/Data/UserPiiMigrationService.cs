using System.Data.Common;
using EquipAI.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Infrastructure.Data;

/// <summary>
/// 将 users 表中历史邮箱/手机号明文迁移为应用层密文和盲索引。
/// </summary>
/// <remarks>
/// 该服务必须在数据库初始化 advisory lock 内运行，并且在 Seeder 之前执行。
/// 使用原始数据库命令是因为当前 EF ValueConverter 只接受新密文，不能把历史明文直接实例化为 User 实体。
/// </remarks>
public sealed class UserPiiMigrationService
{
    private const string EncryptedPrefix = "enc:v1:";

    private readonly AppDbContext _dbContext;
    private readonly IPiiProtector _piiProtector;
    private readonly ILogger<UserPiiMigrationService> _logger;

    /// <summary>
    /// 初始化历史 PII 迁移服务。
    /// </summary>
    public UserPiiMigrationService(
        AppDbContext dbContext,
        IPiiProtector piiProtector,
        ILogger<UserPiiMigrationService> logger)
    {
        _dbContext = dbContext;
        _piiProtector = piiProtector;
        _logger = logger;
    }

    /// <summary>
    /// 幂等迁移所有历史用户联系方式。
    /// </summary>
    /// <param name="cancellationToken">取消令牌。</param>
    /// <returns>异步任务。</returns>
    /// <exception cref="InvalidOperationException">迁移后仍发现不安全值。</exception>
    public async Task MigrateLegacyValuesAsync(CancellationToken cancellationToken = default)
    {
        var connection = _dbContext.Database.GetDbConnection();
        var ownsConnection = connection.State != System.Data.ConnectionState.Open;
        if (ownsConnection)
        {
            await connection.OpenAsync(cancellationToken);
        }

        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        try
        {
            var rows = await ReadRowsAsync(connection, transaction, cancellationToken);
            var migratedRows = 0;

            foreach (var row in rows)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var email = PrepareValue(
                    "email",
                    row.Email,
                    row.EmailLookupHash,
                    out var emailHash,
                    out var emailChanged);
                var phone = PrepareValue(
                    "phone",
                    row.Phone,
                    row.PhoneLookupHash,
                    out var phoneHash,
                    out var phoneChanged);

                if (!emailChanged && !phoneChanged)
                {
                    continue;
                }

                await UpdateRowAsync(
                    connection,
                    transaction,
                    row.Id,
                    email,
                    emailHash,
                    phone,
                    phoneHash,
                    cancellationToken);
                migratedRows++;
            }

            var remainingUnsafeRows = await CountUnsafeRowsAsync(connection, transaction, cancellationToken);
            if (remainingUnsafeRows != 0)
            {
                throw new InvalidOperationException(
                    $"用户联系方式迁移未完成，仍有 {remainingUnsafeRows} 行包含未加密值或不一致盲索引。");
            }

            await transaction.CommitAsync(cancellationToken);
            _logger.LogInformation("用户联系方式加密迁移完成：检查 {TotalRows} 行，更新 {MigratedRows} 行", rows.Count, migratedRows);
        }
        catch
        {
            // 回滚保证任何一行失败都不会出现“旧值已清空、新值未写完”的半迁移状态。
            await transaction.RollbackAsync(CancellationToken.None);
            throw;
        }
        finally
        {
            if (ownsConnection)
            {
                await connection.CloseAsync();
            }
        }
    }

    private string? PrepareValue(
        string field,
        string? storedValue,
        string? existingHash,
        out string? lookupHash,
        out bool changed)
    {
        if (string.IsNullOrWhiteSpace(storedValue))
        {
            lookupHash = null;
            changed = existingHash is not null || storedValue is not null;
            return null;
        }

        if (storedValue.StartsWith(EncryptedPrefix, StringComparison.Ordinal))
        {
            // 即使已有盲索引也必须验证密文认证标签，启动时提前发现密钥错误或数据损坏。
            var plainText = _piiProtector.Unprotect(storedValue)
                ?? throw new InvalidOperationException($"用户 {field} 密文解密后为空。");
            lookupHash = _piiProtector.CreateLookupHash(field, plainText);
            changed = !string.Equals(existingHash, lookupHash, StringComparison.Ordinal);
            return storedValue;
        }

        // 未带版本前缀的值只允许在这次历史迁移中读取，迁移完成后不再作为正常兼容路径接受。
        lookupHash = _piiProtector.CreateLookupHash(field, storedValue);
        var encryptedValue = _piiProtector.Protect(storedValue)
            ?? throw new InvalidOperationException($"用户 {field} 明文保护后为空。");
        changed = true;
        return encryptedValue;
    }

    private static async Task<List<UserPiiRow>> ReadRowsAsync(
        DbConnection connection,
        DbTransaction transaction,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = """
            SELECT "Id", email, phone, email_lookup_hash, phone_lookup_hash
            FROM users
            ORDER BY "Id"
            """;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var rows = new List<UserPiiRow>();
        while (await reader.ReadAsync(cancellationToken))
        {
            rows.Add(new UserPiiRow(
                ReadGuid(reader, 0),
                ReadNullableString(reader, 1),
                ReadNullableString(reader, 2),
                ReadNullableString(reader, 3),
                ReadNullableString(reader, 4)));
        }

        return rows;
    }

    private static async Task UpdateRowAsync(
        DbConnection connection,
        DbTransaction transaction,
        Guid id,
        string? email,
        string? emailHash,
        string? phone,
        string? phoneHash,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = """
            UPDATE users
            SET email = $email,
                email_lookup_hash = $email_lookup_hash,
                phone = $phone,
                phone_lookup_hash = $phone_lookup_hash
            WHERE "Id" = $id
            """;
        AddParameter(command, "$email", email);
        AddParameter(command, "$email_lookup_hash", emailHash);
        AddParameter(command, "$phone", phone);
        AddParameter(command, "$phone_lookup_hash", phoneHash);
        AddParameter(command, "$id", id);

        var affectedRows = await command.ExecuteNonQueryAsync(cancellationToken);
        if (affectedRows != 1)
        {
            throw new InvalidOperationException($"用户联系方式迁移更新用户 {id} 时未准确更新 1 行。");
        }
    }

    private static async Task<long> CountUnsafeRowsAsync(
        DbConnection connection,
        DbTransaction transaction,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = """
            SELECT COUNT(*)
            FROM users
            WHERE (email IS NOT NULL AND email <> '' AND email NOT LIKE 'enc:v1:%')
               OR (phone IS NOT NULL AND phone <> '' AND phone NOT LIKE 'enc:v1:%')
               OR ((email IS NULL OR email = '') AND email_lookup_hash IS NOT NULL)
               OR ((phone IS NULL OR phone = '') AND phone_lookup_hash IS NOT NULL)
               OR (email LIKE 'enc:v1:%' AND email_lookup_hash IS NULL)
               OR (phone LIKE 'enc:v1:%' AND phone_lookup_hash IS NULL)
            """;
        var value = await command.ExecuteScalarAsync(cancellationToken);
        return Convert.ToInt64(value ?? 0L);
    }

    private static void AddParameter(DbCommand command, string name, object? value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value ?? DBNull.Value;
        command.Parameters.Add(parameter);
    }

    private static Guid ReadGuid(DbDataReader reader, int ordinal)
    {
        var value = reader.GetValue(ordinal);
        return value switch
        {
            Guid id => id,
            string text => Guid.Parse(text),
            byte[] bytes => new Guid(bytes),
            _ => Guid.Parse(Convert.ToString(value, System.Globalization.CultureInfo.InvariantCulture)!)
        };
    }

    private static string? ReadNullableString(DbDataReader reader, int ordinal)
        => reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);

    private sealed record UserPiiRow(
        Guid Id,
        string? Email,
        string? Phone,
        string? EmailLookupHash,
        string? PhoneLookupHash);
}
