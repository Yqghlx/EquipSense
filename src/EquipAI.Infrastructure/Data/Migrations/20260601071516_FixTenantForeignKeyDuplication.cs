using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EquipAI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class FixTenantForeignKeyDuplication : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_device_type_templates_tenants_tenant_id1",
                table: "device_type_templates");

            migrationBuilder.DropForeignKey(
                name: "FK_devices_tenants_tenant_id1",
                table: "devices");

            migrationBuilder.DropIndex(
                name: "IX_devices_tenant_id1",
                table: "devices");

            migrationBuilder.DropIndex(
                name: "IX_device_type_templates_tenant_id1",
                table: "device_type_templates");

            migrationBuilder.DropColumn(
                name: "tenant_id1",
                table: "users");

            migrationBuilder.DropColumn(
                name: "tenant_id1",
                table: "devices");

            migrationBuilder.DropColumn(
                name: "tenant_id1",
                table: "device_type_templates");

            migrationBuilder.CreateIndex(
                name: "IX_device_type_templates_tenant_id",
                table: "device_type_templates",
                column: "tenant_id");

            migrationBuilder.AddForeignKey(
                name: "FK_device_type_templates_tenants_tenant_id",
                table: "device_type_templates",
                column: "tenant_id",
                principalTable: "tenants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_devices_tenants_tenant_id",
                table: "devices",
                column: "tenant_id",
                principalTable: "tenants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_device_type_templates_tenants_tenant_id",
                table: "device_type_templates");

            migrationBuilder.DropForeignKey(
                name: "FK_devices_tenants_tenant_id",
                table: "devices");

            migrationBuilder.DropIndex(
                name: "IX_device_type_templates_tenant_id",
                table: "device_type_templates");

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id1",
                table: "users",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id1",
                table: "devices",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id1",
                table: "device_type_templates",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_devices_tenant_id1",
                table: "devices",
                column: "tenant_id1");

            migrationBuilder.CreateIndex(
                name: "IX_device_type_templates_tenant_id1",
                table: "device_type_templates",
                column: "tenant_id1");

            migrationBuilder.AddForeignKey(
                name: "FK_device_type_templates_tenants_tenant_id1",
                table: "device_type_templates",
                column: "tenant_id1",
                principalTable: "tenants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_devices_tenants_tenant_id1",
                table: "devices",
                column: "tenant_id1",
                principalTable: "tenants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
