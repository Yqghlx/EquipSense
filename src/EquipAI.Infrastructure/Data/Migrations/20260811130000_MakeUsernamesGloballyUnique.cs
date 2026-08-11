using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EquipAI.Infrastructure.Data.Migrations;

/// <summary>
/// 将用户名唯一性从租户内提升为全局，避免无租户登录场景命中错误账号。
/// </summary>
[DbContext(typeof(AppDbContext))]
[Migration("20260811130000_MakeUsernamesGloballyUnique")]
public partial class MakeUsernamesGloballyUnique : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // 先检查历史数据，避免删除旧索引后才发现无法建立新约束，导致迁移处于半完成状态。
        migrationBuilder.Sql("""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM users
                    GROUP BY username
                    HAVING COUNT(*) > 1
                ) THEN
                    RAISE EXCEPTION '无法创建全局用户名唯一索引：users 表存在重复用户名';
                END IF;
            END $$;
            """);

        migrationBuilder.DropIndex(
            name: "IX_users_tenant_id_username",
            table: "users");

        migrationBuilder.CreateIndex(
            name: "IX_users_username",
            table: "users",
            column: "username",
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_users_username",
            table: "users");

        migrationBuilder.CreateIndex(
            name: "IX_users_tenant_id_username",
            table: "users",
            columns: new[] { "tenant_id", "username" },
            unique: true);
    }
}
