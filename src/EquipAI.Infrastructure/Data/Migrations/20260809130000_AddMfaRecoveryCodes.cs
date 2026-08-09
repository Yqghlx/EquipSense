using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EquipAI.Infrastructure.Data.Migrations;

/// <summary>
/// 为用户增加 MFA 一次性恢复码摘要存储。
/// </summary>
public partial class AddMfaRecoveryCodes : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "mfa_recovery_codes",
            table: "users",
            type: "jsonb",
            nullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "mfa_recovery_codes",
            table: "users");
    }
}
