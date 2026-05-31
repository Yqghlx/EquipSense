using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EquipAI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tenants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    slug = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    plan = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    isolation_mode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    max_devices = table.Column<int>(type: "integer", nullable: false),
                    max_users = table.Column<int>(type: "integer", nullable: false),
                    data_retention_days = table.Column<int>(type: "integer", nullable: false),
                    work_order_mode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    settings = table.Column<string>(type: "jsonb", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tenants", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "device_type_templates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    industry = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    parameters = table.Column<string>(type: "jsonb", nullable: false),
                    default_alarm_rules = table.Column<string>(type: "jsonb", nullable: false),
                    default_diagnosis_rules = table.Column<string>(type: "jsonb", nullable: false),
                    tenant_id1 = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_device_type_templates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_device_type_templates_tenants_tenant_id1",
                        column: x => x.tenant_id1,
                        principalTable: "tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    username = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    password_hash = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    display_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    skills = table.Column<List<string>>(type: "text[]", nullable: false),
                    locations = table.Column<List<string>>(type: "text[]", nullable: false),
                    phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    language = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    notification_prefs = table.Column<string>(type: "jsonb", nullable: false),
                    token_version = table.Column<int>(type: "integer", nullable: false),
                    must_change_password = table.Column<bool>(type: "boolean", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    last_login_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    tenant_id1 = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_users_tenants_tenant_id",
                        column: x => x.tenant_id,
                        principalTable: "tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "devices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    device_code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    type_template_id = table.Column<Guid>(type: "uuid", nullable: true),
                    manufacturer = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    model = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    serial_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    location = table.Column<string>(type: "jsonb", nullable: false),
                    install_date = table.Column<DateOnly>(type: "date", nullable: true),
                    gateway_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    connection_config = table.Column<string>(type: "jsonb", nullable: false),
                    responsible_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    criticality = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    downtime_cost_per_hour = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    health_score = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    tags = table.Column<List<string>>(type: "text[]", nullable: false),
                    custom_fields = table.Column<string>(type: "jsonb", nullable: false),
                    last_data_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    tenant_id1 = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_devices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_devices_device_type_templates_type_template_id",
                        column: x => x.type_template_id,
                        principalTable: "device_type_templates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_devices_tenants_tenant_id1",
                        column: x => x.tenant_id1,
                        principalTable: "tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_devices_users_responsible_user_id",
                        column: x => x.responsible_user_id,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_device_type_templates_tenant_id1",
                table: "device_type_templates",
                column: "tenant_id1");

            migrationBuilder.CreateIndex(
                name: "IX_devices_responsible_user_id",
                table: "devices",
                column: "responsible_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_devices_tenant_id_device_code",
                table: "devices",
                columns: new[] { "tenant_id", "device_code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_devices_tenant_id1",
                table: "devices",
                column: "tenant_id1");

            migrationBuilder.CreateIndex(
                name: "IX_devices_type_template_id",
                table: "devices",
                column: "type_template_id");

            migrationBuilder.CreateIndex(
                name: "IX_tenants_slug",
                table: "tenants",
                column: "slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_tenant_id_username",
                table: "users",
                columns: new[] { "tenant_id", "username" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "devices");

            migrationBuilder.DropTable(
                name: "device_type_templates");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "tenants");
        }
    }
}
