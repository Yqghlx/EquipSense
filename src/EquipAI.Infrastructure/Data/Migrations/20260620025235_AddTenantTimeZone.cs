using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EquipAI.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    /// <summary>
    /// v1.4：给 tenants 表加 TimeZone 字段（IANA 时区 ID）
    ///
    /// 用途：Dashboard 趋势聚合按租户时区本地日期分组，避免 UTC 跨日错位
    /// 默认值 "UTC"，新租户注册时可由前端选择
    ///
    /// 注意：本次只加 TimeZone 字段。同时存在的 schema 不一致（TotpSecret 命名 / last_seen_at 缺失）
    /// 不在本 migration 处理范围，避免混入无关变更造成数据丢失风险。
    /// </summary>
    public partial class AddTenantTimeZone : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TimeZone",
                table: "tenants",
                type: "text",
                nullable: false,
                defaultValue: "UTC");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TimeZone",
                table: "tenants");
        }
    }
}
