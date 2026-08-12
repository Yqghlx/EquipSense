using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Seeding;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace EquipAI.Tests.Integration.Seeding;

/// <summary>
/// 完整演示数据播种器的集成测试，验证固定数据集可重复执行且不会不断追加遥测、告警或工单。
/// </summary>
[Collection("SharedFactory")]
public sealed class FullDemoDataSeederTests
{
    private readonly CustomWebApplicationFactory _factory;

    public FullDemoDataSeederTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task 重复执行完整演示播种应保持固定数据量()
    {
        await _factory.CreateClientWithSeedAsync();

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var seeder = scope.ServiceProvider.GetRequiredService<FullDemoDataSeeder>();

        await seeder.SeedAsync();
        var first = await ReadSnapshotAsync(db);

        await seeder.SeedAsync();
        var second = await ReadSnapshotAsync(db);

        second.Should().BeEquivalentTo(first);
        first.DemoDeviceCount.Should().Be(10);
        first.TelemetryCount.Should().Be(10 * 24 * 3);
        first.AlertCount.Should().Be(5);
        first.WorkOrderCount.Should().Be(4);
        first.WorkOrderLogCount.Should().Be(4);
    }

    private static async Task<DemoDataSnapshot> ReadSnapshotAsync(AppDbContext db)
    {
        var demoDevices = db.UnfilteredSet<Core.Entities.Device>()
            .Where(device => device.TenantId == Guid.Parse("11111111-1111-1111-1111-111111111111")
                && (device.DeviceCode == "AC-001" || device.DeviceCode.StartsWith("DEMO-")));

        var demoDeviceIds = await demoDevices.Select(device => device.Id).ToListAsync();
        return new DemoDataSnapshot(
            DemoDeviceCount: demoDeviceIds.Count,
            TelemetryCount: await db.DeviceTelemetry.IgnoreQueryFilters().CountAsync(telemetry =>
                telemetry.Source == "demo-seed" && demoDeviceIds.Contains(telemetry.DeviceId)),
            AlertCount: await db.UnfilteredSet<Core.Entities.Alert>().CountAsync(alert =>
                alert.AlertCode.StartsWith("DEMO-")),
            WorkOrderCount: await db.UnfilteredSet<Core.Entities.WorkOrder>().CountAsync(order =>
                order.WorkOrderCode.StartsWith("DEMO-")),
            WorkOrderLogCount: await db.UnfilteredSet<Core.Entities.WorkOrderLog>().CountAsync(log =>
                db.UnfilteredSet<Core.Entities.WorkOrder>().Any(order =>
                    order.Id == log.WorkOrderId && order.WorkOrderCode.StartsWith("DEMO-"))));
    }

    private sealed record DemoDataSnapshot(
        int DemoDeviceCount,
        int TelemetryCount,
        int AlertCount,
        int WorkOrderCount,
        int WorkOrderLogCount);
}
