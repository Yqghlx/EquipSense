using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EquipAI.Infrastructure.Data.Migrations;

/// <inheritdoc />
public partial class AddDeviceLastSeenAt : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // 添加 last_seen_at 字段，记录设备最近一次遥测时间
        // 配合 TelemetryEventHandler 自动上线 + DeviceStatusMonitor 自动离线判定
        migrationBuilder.AddColumn<DateTime>(
            name: "last_seen_at",
            table: "devices",
            type: "timestamp with time zone",
            nullable: true);

        // 索引：DeviceStatusMonitor 周期扫描时按 last_seen_at 过滤
        migrationBuilder.CreateIndex(
            name: "ix_devices_last_seen_at",
            table: "devices",
            column: "last_seen_at");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "ix_devices_last_seen_at",
            table: "devices");

        migrationBuilder.DropColumn(
            name: "last_seen_at",
            table: "devices");
    }
}
