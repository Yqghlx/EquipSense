using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EquipAI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddApprovalChainTemplate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "approval_chain_templates",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    work_order_type = table.Column<int>(type: "integer", nullable: true),
                    priority = table.Column<int>(type: "integer", nullable: true),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    is_default = table.Column<bool>(type: "boolean", nullable: false),
                    enabled = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_approval_chain_templates", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "approval_steps",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    chain_id = table.Column<Guid>(type: "uuid", nullable: false),
                    step_order = table.Column<int>(type: "integer", nullable: false),
                    role = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    specific_approver_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_required = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_approval_steps", x => x.id);
                    table.ForeignKey(
                        name: "FK_approval_steps_approval_chain_templates_chain_id",
                        column: x => x.chain_id,
                        principalTable: "approval_chain_templates",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_approval_chain_templates_tenant_id_work_order_type_priority",
                table: "approval_chain_templates",
                columns: new[] { "tenant_id", "work_order_type", "priority" });

            migrationBuilder.CreateIndex(
                name: "IX_approval_steps_chain_id_step_order",
                table: "approval_steps",
                columns: new[] { "chain_id", "step_order" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "approval_steps");

            migrationBuilder.DropTable(
                name: "approval_chain_templates");
        }
    }
}
