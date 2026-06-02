using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EquipAI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddKnowledgeRuleVersion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Version",
                table: "knowledge_rules",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.CreateTable(
                name: "knowledge_rule_versions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    RuleId = table.Column<Guid>(type: "uuid", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    Snapshot = table.Column<string>(type: "jsonb", nullable: false),
                    ChangedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    ChangeSummary = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_knowledge_rule_versions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_knowledge_rule_versions_RuleId_Version",
                table: "knowledge_rule_versions",
                columns: new[] { "RuleId", "Version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_knowledge_rule_versions_TenantId_RuleId",
                table: "knowledge_rule_versions",
                columns: new[] { "TenantId", "RuleId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "knowledge_rule_versions");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "knowledge_rules");
        }
    }
}
