using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EquipAI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_work_orders_tenant_id_status_created_at",
                table: "work_orders",
                columns: new[] { "tenant_id", "status", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_alerts_tenant_id_device_id_metric_status_occurred_at",
                table: "alerts",
                columns: new[] { "tenant_id", "device_id", "metric", "status", "occurred_at" });

            migrationBuilder.CreateIndex(
                name: "IX_alert_rules_tenant_id_enabled_metric",
                table: "alert_rules",
                columns: new[] { "tenant_id", "enabled", "metric" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_work_orders_tenant_id_status_created_at",
                table: "work_orders");

            migrationBuilder.DropIndex(
                name: "IX_alerts_tenant_id_device_id_metric_status_occurred_at",
                table: "alerts");

            migrationBuilder.DropIndex(
                name: "IX_alert_rules_tenant_id_enabled_metric",
                table: "alert_rules");
        }
    }
}
