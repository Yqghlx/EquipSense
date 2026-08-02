using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EquipAI.Infrastructure.Data.Migrations;

/// <summary>
/// 修复历史迁移 AddDeviceLastSeenAt 的空 Up 方法导致的 schema 漂移。
/// </summary>
[DbContext(typeof(AppDbContext))]
[Migration("20260802090000_AddMissingDeviceLastSeenAtColumn")]
public partial class AddMissingDeviceLastSeenAtColumn : Migration
{
    /// <summary>
    /// 为设备表补充最后活跃时间列。
    /// </summary>
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // 历史迁移已记录为执行过但没有真正建列，使用 IF NOT EXISTS 兼容已由运维手动修复的数据库。
        migrationBuilder.Sql(
            """
            ALTER TABLE devices
            ADD COLUMN IF NOT EXISTS last_seen_at timestamp with time zone;
            """);
    }

    /// <summary>
    /// 回滚设备最后活跃时间列。
    /// </summary>
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            ALTER TABLE devices
            DROP COLUMN IF EXISTS last_seen_at;
            """);
    }
}
