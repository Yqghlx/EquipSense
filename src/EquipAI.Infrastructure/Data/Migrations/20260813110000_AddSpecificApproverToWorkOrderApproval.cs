using System;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EquipAI.Infrastructure.Data.Migrations;

/// <summary>
/// 为工单审批记录保存模板指定的审批人，确保指定审批人约束在运行时可执行。
/// </summary>
[DbContext(typeof(AppDbContext))]
[Migration("20260813110000_AddSpecificApproverToWorkOrderApproval")]
public partial class AddSpecificApproverToWorkOrderApproval : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "specific_approver_id",
            table: "work_order_approvals",
            type: "uuid",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_work_order_approvals_tenant_id_specific_approver_id_action",
            table: "work_order_approvals",
            columns: new[] { "tenant_id", "specific_approver_id", "action" });
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_work_order_approvals_tenant_id_specific_approver_id_action",
            table: "work_order_approvals");

        migrationBuilder.DropColumn(
            name: "specific_approver_id",
            table: "work_order_approvals");
    }
}
