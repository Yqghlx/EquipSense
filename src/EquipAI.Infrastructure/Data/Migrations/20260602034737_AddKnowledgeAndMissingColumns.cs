using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EquipAI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddKnowledgeAndMissingColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "ActualHours",
                table: "work_orders",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExecutionReport",
                table: "work_orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RequiredParts",
                table: "work_orders",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "audit_logs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    action = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    resource_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    resource_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ip_address = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    request_path = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    http_method = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    user_agent = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_logs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "fault_cases",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    DeviceId = table.Column<Guid>(type: "uuid", nullable: true),
                    DeviceType = table.Column<string>(type: "text", nullable: false),
                    FaultOccurredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FaultDescription = table.Column<string>(type: "text", nullable: false),
                    Symptoms = table.Column<string>(type: "text", nullable: true),
                    RootCause = table.Column<string>(type: "text", nullable: false),
                    Solution = table.Column<string>(type: "text", nullable: false),
                    RepairDurationMinutes = table.Column<int>(type: "integer", nullable: true),
                    PartsUsed = table.Column<string>(type: "text", nullable: true),
                    FaultData = table.Column<string>(type: "jsonb", nullable: true),
                    Operator = table.Column<string>(type: "text", nullable: true),
                    IsVerified = table.Column<bool>(type: "boolean", nullable: false),
                    VerifiedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    SourceWorkorderId = table.Column<Guid>(type: "uuid", nullable: true),
                    Tags = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fault_cases", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "knowledge_rules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    DeviceType = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Conditions = table.Column<string>(type: "jsonb", nullable: false),
                    Conclusion = table.Column<string>(type: "jsonb", nullable: false),
                    RecommendedActions = table.Column<string>(type: "text", nullable: true),
                    CheckSteps = table.Column<string>(type: "text", nullable: true),
                    ConfidenceWeight = table.Column<decimal>(type: "numeric", nullable: false),
                    Source = table.Column<string>(type: "text", nullable: false),
                    AccuracyRate = table.Column<decimal>(type: "numeric", nullable: true),
                    SuccessCount = table.Column<int>(type: "integer", nullable: false),
                    Enabled = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_knowledge_rules", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "pending_rules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    DeviceType = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Conditions = table.Column<string>(type: "jsonb", nullable: false),
                    Conclusion = table.Column<string>(type: "jsonb", nullable: false),
                    RecommendedActions = table.Column<string>(type: "text", nullable: true),
                    CheckSteps = table.Column<string>(type: "text", nullable: true),
                    SourceWorkorderId = table.Column<Guid>(type: "uuid", nullable: true),
                    SourceCaseId = table.Column<Guid>(type: "uuid", nullable: true),
                    Confidence = table.Column<decimal>(type: "numeric", nullable: true),
                    ReviewStatus = table.Column<int>(type: "integer", nullable: false),
                    ReviewedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    ReviewComment = table.Column<string>(type: "text", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pending_rules", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "technician_profiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    skills = table.Column<string>(type: "jsonb", nullable: false),
                    active_work_count = table.Column<int>(type: "integer", nullable: false),
                    completed_count = table.Column<int>(type: "integer", nullable: false),
                    avg_completion_hours = table.Column<double>(type: "double precision", nullable: true),
                    is_available = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_technician_profiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_technician_profiles_tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_technician_profiles_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_created_at",
                table: "audit_logs",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_tenant_id",
                table: "audit_logs",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_tenant_id_action",
                table: "audit_logs",
                columns: new[] { "tenant_id", "action" });

            migrationBuilder.CreateIndex(
                name: "IX_fault_cases_TenantId_DeviceType",
                table: "fault_cases",
                columns: new[] { "TenantId", "DeviceType" });

            migrationBuilder.CreateIndex(
                name: "IX_fault_cases_TenantId_SourceWorkorderId",
                table: "fault_cases",
                columns: new[] { "TenantId", "SourceWorkorderId" });

            migrationBuilder.CreateIndex(
                name: "IX_knowledge_rules_TenantId_DeviceType",
                table: "knowledge_rules",
                columns: new[] { "TenantId", "DeviceType" });

            migrationBuilder.CreateIndex(
                name: "IX_knowledge_rules_TenantId_Enabled",
                table: "knowledge_rules",
                columns: new[] { "TenantId", "Enabled" });

            migrationBuilder.CreateIndex(
                name: "IX_pending_rules_TenantId_DeviceType",
                table: "pending_rules",
                columns: new[] { "TenantId", "DeviceType" });

            migrationBuilder.CreateIndex(
                name: "IX_pending_rules_TenantId_ReviewStatus",
                table: "pending_rules",
                columns: new[] { "TenantId", "ReviewStatus" });

            migrationBuilder.CreateIndex(
                name: "IX_technician_profiles_tenant_id_is_available",
                table: "technician_profiles",
                columns: new[] { "tenant_id", "is_available" });

            migrationBuilder.CreateIndex(
                name: "IX_technician_profiles_tenant_id_user_id",
                table: "technician_profiles",
                columns: new[] { "tenant_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_technician_profiles_user_id",
                table: "technician_profiles",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "audit_logs");

            migrationBuilder.DropTable(
                name: "fault_cases");

            migrationBuilder.DropTable(
                name: "knowledge_rules");

            migrationBuilder.DropTable(
                name: "pending_rules");

            migrationBuilder.DropTable(
                name: "technician_profiles");

            migrationBuilder.DropColumn(
                name: "ActualHours",
                table: "work_orders");

            migrationBuilder.DropColumn(
                name: "ExecutionReport",
                table: "work_orders");

            migrationBuilder.DropColumn(
                name: "RequiredParts",
                table: "work_orders");
        }
    }
}
