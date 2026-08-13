using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EquipAI.Infrastructure.Data.Migrations;

/// <inheritdoc />
[DbContext(typeof(AppDbContext))]
[Migration("20260813140000_AddFmeaKnowledgeRuleIndex")]
public partial class AddFmeaKnowledgeRuleIndex : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateIndex(
            name: "IX_fmea_library_TenantId_KnowledgeRuleId_IsEnabled",
            table: "fmea_library",
            columns: new[] { "TenantId", "KnowledgeRuleId", "IsEnabled" });
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_fmea_library_TenantId_KnowledgeRuleId_IsEnabled",
            table: "fmea_library");
    }
}
