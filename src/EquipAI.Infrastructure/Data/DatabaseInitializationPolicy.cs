namespace EquipAI.Infrastructure.Data;

/// <summary>
/// 数据库启动初始化策略。
/// </summary>
public static class DatabaseInitializationPolicy
{
    /// <summary>
    /// 判断当前环境是否应由应用启动时执行 EF Core 迁移。
    /// 测试环境使用测试夹具创建 SQLite schema，避免执行面向 PostgreSQL 的迁移 SQL。
    /// </summary>
    /// <param name="environmentName">宿主环境名称。</param>
    public static bool ShouldApplyMigrations(string environmentName)
        => !string.Equals(environmentName, "Testing", StringComparison.OrdinalIgnoreCase);
}
