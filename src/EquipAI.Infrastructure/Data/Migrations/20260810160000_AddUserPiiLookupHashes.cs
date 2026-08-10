using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EquipAI.Infrastructure.Data.Migrations;

/// <summary>
/// 为用户联系方式增加盲索引，并扩大联系方式列以容纳 AES-GCM 密文。
/// 历史明文由应用启动时的 UserPiiMigrationService 在数据库初始化锁内回填。
/// </summary>
[DbContext(typeof(AppDbContext))]
[Migration("20260810160000_AddUserPiiLookupHashes")]
public partial class AddUserPiiLookupHashes : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AlterColumn<string>(
            name: "phone",
            table: "users",
            type: "character varying(256)",
            maxLength: 256,
            nullable: true,
            oldClrType: typeof(string),
            oldType: "character varying(20)",
            oldMaxLength: 20,
            oldNullable: true);

        migrationBuilder.AlterColumn<string>(
            name: "email",
            table: "users",
            type: "character varying(256)",
            maxLength: 256,
            nullable: true,
            oldClrType: typeof(string),
            oldType: "character varying(100)",
            oldMaxLength: 100,
            oldNullable: true);

        migrationBuilder.AddColumn<string>(
            name: "email_lookup_hash",
            table: "users",
            type: "character varying(64)",
            maxLength: 64,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "phone_lookup_hash",
            table: "users",
            type: "character varying(64)",
            maxLength: 64,
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_users_email_lookup_hash",
            table: "users",
            column: "email_lookup_hash");

        migrationBuilder.CreateIndex(
            name: "IX_users_phone_lookup_hash",
            table: "users",
            column: "phone_lookup_hash");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_users_email_lookup_hash",
            table: "users");

        migrationBuilder.DropIndex(
            name: "IX_users_phone_lookup_hash",
            table: "users");

        migrationBuilder.DropColumn(
            name: "email_lookup_hash",
            table: "users");

        migrationBuilder.DropColumn(
            name: "phone_lookup_hash",
            table: "users");

        migrationBuilder.AlterColumn<string>(
            name: "phone",
            table: "users",
            type: "character varying(20)",
            maxLength: 20,
            nullable: true,
            oldClrType: typeof(string),
            oldType: "character varying(256)",
            oldMaxLength: 256,
            oldNullable: true);

        migrationBuilder.AlterColumn<string>(
            name: "email",
            table: "users",
            type: "character varying(100)",
            maxLength: 100,
            nullable: true,
            oldClrType: typeof(string),
            oldType: "character varying(256)",
            oldMaxLength: 256,
            oldNullable: true);
    }
}
