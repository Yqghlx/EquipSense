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
}
