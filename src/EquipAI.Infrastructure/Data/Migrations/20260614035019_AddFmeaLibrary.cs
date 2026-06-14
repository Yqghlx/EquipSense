using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EquipAI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddFmeaLibrary : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "billing_records",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Plan = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    PeriodStart = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PeriodEnd = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PaymentMethod = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Remark = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_billing_records", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "fmea_library",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    DeviceType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FailureMode = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Cause = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Effect = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Detection = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    RecommendedAction = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Severity = table.Column<int>(type: "integer", nullable: false),
                    Occurrence = table.Column<int>(type: "integer", nullable: false),
                    Detectability = table.Column<int>(type: "integer", nullable: false),
                    Rpn = table.Column<int>(type: "integer", nullable: false),
                    KnowledgeRuleId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fmea_library", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "gateways",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GatewayId = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Host = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    HealthPort = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    LastHeartbeatAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UptimeSeconds = table.Column<int>(type: "integer", nullable: true),
                    Version = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Enabled = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gateways", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ground_truth_entries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    RunId = table.Column<string>(type: "text", nullable: false),
                    DeviceId = table.Column<Guid>(type: "uuid", nullable: false),
                    DeviceCode = table.Column<string>(type: "text", nullable: false),
                    ScenarioName = table.Column<string>(type: "text", nullable: false),
                    FaultType = table.Column<string>(type: "text", nullable: false),
                    ExpectedRootCause = table.Column<string>(type: "text", nullable: false),
                    ExpectedSeverity = table.Column<string>(type: "text", nullable: false),
                    AffectedMetrics = table.Column<string>(type: "jsonb", nullable: false),
                    InjectedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ground_truth_entries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "work_order_attachments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    work_order_id = table.Column<Guid>(type: "uuid", nullable: false),
                    file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    content_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    storage_path = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    uploaded_by = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_work_order_attachments", x => x.id);
                    table.ForeignKey(
                        name: "FK_work_order_attachments_work_orders_work_order_id",
                        column: x => x.work_order_id,
                        principalTable: "work_orders",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_billing_records_TenantId",
                table: "billing_records",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_billing_records_TenantId_PeriodStart",
                table: "billing_records",
                columns: new[] { "TenantId", "PeriodStart" });

            migrationBuilder.CreateIndex(
                name: "IX_fmea_library_DeviceType",
                table: "fmea_library",
                column: "DeviceType");

            migrationBuilder.CreateIndex(
                name: "IX_fmea_library_IsEnabled",
                table: "fmea_library",
                column: "IsEnabled");

            migrationBuilder.CreateIndex(
                name: "IX_fmea_library_Rpn",
                table: "fmea_library",
                column: "Rpn");

            migrationBuilder.CreateIndex(
                name: "IX_fmea_library_TenantId",
                table: "fmea_library",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_gateways_TenantId",
                table: "gateways",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_gateways_TenantId_GatewayId",
                table: "gateways",
                columns: new[] { "TenantId", "GatewayId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ground_truth_entries_DeviceId_InjectedAt",
                table: "ground_truth_entries",
                columns: new[] { "DeviceId", "InjectedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ground_truth_entries_RunId",
                table: "ground_truth_entries",
                column: "RunId");

            migrationBuilder.CreateIndex(
                name: "IX_work_order_attachments_tenant_id",
                table: "work_order_attachments",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_work_order_attachments_work_order_id",
                table: "work_order_attachments",
                column: "work_order_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "billing_records");

            migrationBuilder.DropTable(
                name: "fmea_library");

            migrationBuilder.DropTable(
                name: "gateways");

            migrationBuilder.DropTable(
                name: "ground_truth_entries");

            migrationBuilder.DropTable(
                name: "work_order_attachments");
        }
    }
}
