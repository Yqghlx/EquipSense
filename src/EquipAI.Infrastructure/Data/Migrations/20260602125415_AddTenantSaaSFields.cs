using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EquipAI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantSaaSFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "current_device_count",
                table: "tenants",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "current_user_count",
                table: "tenants",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "status",
                table: "tenants",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "subscription_ends_at",
                table: "tenants",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "trial_ends_at",
                table: "tenants",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "current_device_count",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "current_user_count",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "status",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "subscription_ends_at",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "trial_ends_at",
                table: "tenants");
        }
    }
}
