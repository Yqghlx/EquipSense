using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EquipAI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMetricBaselinesAndBaselineStddev : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "baseline_stddev_multiplier",
                table: "alert_rules",
                type: "numeric",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "metric_baselines",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    device_id = table.Column<Guid>(type: "uuid", nullable: false),
                    metric = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    period_start = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    period_end = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    avg_value = table.Column<double>(type: "double precision", nullable: true),
                    std_dev = table.Column<double>(type: "double precision", nullable: true),
                    min_value = table.Column<double>(type: "double precision", nullable: true),
                    max_value = table.Column<double>(type: "double precision", nullable: true),
                    p95_value = table.Column<double>(type: "double precision", nullable: true),
                    sample_count = table.Column<int>(type: "integer", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_metric_baselines", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_metric_baselines_tenant_id_device_id_metric",
                table: "metric_baselines",
                columns: new[] { "tenant_id", "device_id", "metric" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "metric_baselines");

            migrationBuilder.DropColumn(
                name: "baseline_stddev_multiplier",
                table: "alert_rules");
        }
    }
}
