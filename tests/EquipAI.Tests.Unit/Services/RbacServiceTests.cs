using EquipAI.Application.Services;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Services;

public class RbacServiceTests
{
    private readonly RbacService _sut = new();

    [Fact]
    public void SystemAdmin_HasAllDevicePermissions()
    {
        _sut.HasPermission("SystemAdmin", "device:create").Should().BeTrue();
        _sut.HasPermission("SystemAdmin", "device:read").Should().BeTrue();
        _sut.HasPermission("SystemAdmin", "device:update").Should().BeTrue();
        _sut.HasPermission("SystemAdmin", "device:delete").Should().BeTrue();
    }

    [Fact]
    public void Viewer_CanOnlyReadDevices()
    {
        _sut.HasPermission("Viewer", "device:read").Should().BeTrue();
        _sut.HasPermission("Viewer", "device:create").Should().BeFalse();
        _sut.HasPermission("Viewer", "device:delete").Should().BeFalse();
    }

    [Fact]
    public void Technician_CannotDeleteDevices()
    {
        _sut.HasPermission("Technician", "device:read").Should().BeTrue();
        _sut.HasPermission("Technician", "device:delete").Should().BeFalse();
    }

    [Fact]
    public void MaintenanceLead_CanUpdateDevicesButNotDelete()
    {
        _sut.HasPermission("MaintenanceLead", "device:update").Should().BeTrue();
        _sut.HasPermission("MaintenanceLead", "device:delete").Should().BeFalse();
    }

    [Fact]
    public void MaintenanceLead_CanCreateAndUpdateKnowledgeButNotDelete()
    {
        _sut.HasPermission("MaintenanceLead", "knowledge:create").Should().BeTrue();
        _sut.HasPermission("MaintenanceLead", "knowledge:update").Should().BeTrue();
        _sut.HasPermission("MaintenanceLead", "knowledge:delete").Should().BeFalse();
    }

    [Fact]
    public void Operator_CanReadAndAcknowledgeAlerts()
    {
        _sut.HasPermission("Operator", "alert:read").Should().BeTrue();
        _sut.HasPermission("Operator", "alert:acknowledge").Should().BeTrue();
        _sut.HasPermission("Operator", "alert:delete").Should().BeFalse();
    }

    [Fact]
    public void UnknownRole_HasNoPermissions()
    {
        _sut.HasPermission("Unknown", "device:read").Should().BeFalse();
    }

    [Fact]
    public void EmptyPermission_ReturnsFalse()
    {
        _sut.HasPermission("SystemAdmin", "nonexistent:permission").Should().BeFalse();
    }

    /// <summary>
    /// SystemAdmin 必须拥有所有 Controller 中通过 [RequirePermission] 声明的权限。
    /// 该测试是回归保护：2026-06-15 审计发现 SystemAdmin 缺少 alert:acknowledge 和 user:role，
    /// 导致 PUT /alerts/{id}/acknowledge 和 PUT /admin/users/{id}/role 对超级管理员返回 403。
    /// 后续新增 Controller 端点若引入新的 RequirePermission，必须同步加入 SystemAdmin 集合。
    /// </summary>
    [Theory]
    [InlineData("alert:acknowledge")]
    [InlineData("alert:config")]
    [InlineData("alert:delete")]
    [InlineData("alert:read")]
    [InlineData("alert:update")]
    [InlineData("analysis:read")]
    [InlineData("analysis:trigger")]
    [InlineData("audit:read")]
    [InlineData("device:create")]
    [InlineData("device:delete")]
    [InlineData("device:read")]
    [InlineData("device:update")]
    [InlineData("knowledge:create")]
    [InlineData("knowledge:delete")]
    [InlineData("knowledge:read")]
    [InlineData("knowledge:update")]
    [InlineData("report:read")]
    [InlineData("tenant:create")]
    [InlineData("tenant:read")]
    [InlineData("tenant:update")]
    [InlineData("user:create")]
    [InlineData("user:delete")]
    [InlineData("user:read")]
    [InlineData("user:role")]
    [InlineData("user:update")]
    [InlineData("workorder:accept")]
    [InlineData("workorder:cancel")]
    [InlineData("workorder:close")]
    [InlineData("workorder:create")]
    [InlineData("workorder:dispatch")]
    [InlineData("workorder:execute")]
    [InlineData("workorder:manage")]
    [InlineData("workorder:read")]
    [InlineData("workorder:update")]
    public void SystemAdmin_HasEveryControllerDeclaredPermission(string permission)
    {
        _sut.HasPermission("SystemAdmin", permission).Should().BeTrue(
            $"SystemAdmin 应拥有所有 Controller 通过 [RequirePermission] 声明的权限，但缺少 {permission}");
    }
}
