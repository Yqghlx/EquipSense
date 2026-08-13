using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace EquipAI.Application.Services;

/// <summary>
/// 识别关系型数据库约束冲突，统一把并发唯一键失败转换为稳定业务错误。
/// </summary>
internal static class DatabaseConstraintDetector
{
    /// <summary>
    /// 判断是否为设备编码唯一约束冲突。
    /// </summary>
    public static bool IsDeviceCodeUniqueViolation(DbUpdateException exception)
        => ContainsPostgresUniqueViolation(exception, "devices", "device_code")
           || ContainsMessage(exception, "IX_devices_tenant_id_device_code")
           || (ContainsMessage(exception, "devices.tenant_id")
               && ContainsMessage(exception, "devices.device_code"));

    /// <summary>
    /// 判断是否为全局用户名唯一约束冲突。
    /// </summary>
    public static bool IsUsernameUniqueViolation(DbUpdateException exception)
        => ContainsPostgresUniqueViolation(exception, "users", "username")
           || ContainsMessage(exception, "IX_users_username")
           || (ContainsMessage(exception, "users.username")
               && ContainsMessage(exception, "unique"));

    /// <summary>
    /// 识别 PostgreSQL SQLSTATE 23505，并优先按约束名缩小到目标字段。
    /// </summary>
    private static bool ContainsPostgresUniqueViolation(
        DbUpdateException exception, string tableName, string columnName)
    {
        for (var current = (Exception?)exception; current is not null; current = current.InnerException)
        {
            if (current is PostgresException postgres
                && postgres.SqlState == "23505"
                && (string.IsNullOrWhiteSpace(postgres.ConstraintName)
                    || postgres.ConstraintName.Contains(tableName, StringComparison.OrdinalIgnoreCase)
                    || postgres.ConstraintName.Contains(columnName, StringComparison.OrdinalIgnoreCase)))
            {
                return true;
            }
        }

        return false;
    }

    /// <summary>
    /// 判断异常链中是否包含指定文本，兼容 SQLite 集成测试的错误信息格式。
    /// </summary>
    private static bool ContainsMessage(DbUpdateException exception, string value)
    {
        for (var current = (Exception?)exception; current is not null; current = current.InnerException)
        {
            if (current.Message.Contains(value, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }
}
