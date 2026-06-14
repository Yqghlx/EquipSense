using EquipAI.EdgeGateway.Protocols;
using EquipAI.EdgeGateway.Security;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;

namespace EquipAI.Tests.Unit.EdgeGateway;

/// <summary>
/// OPC UA 协议适配器集成测试
///
/// 需要本地运行 OPC UA 模拟服务器（python3 /tmp/opcua_sim.py，端口 4840）。
/// 模拟器提供 AirCompressor1 设备的 Temperature/Pressure/Vibration 等节点。
///
/// 测试验证 OpcUaAdapter 能：
/// 1. 连接到 OPC UA 服务器
/// 2. 读取节点值并正确转换为 DataPoint
/// 3. 数据质量为 Good
///
/// 如模拟器未运行，测试会被跳过（[Trait] 标记，CI 可选择不跑）。
/// </summary>
[Trait("Category", "RequiresSimulator")]
public class OpcUaAdapterIntegrationTests
{
    /// <summary>OPC UA 模拟服务器端点（需提前启动 python3 /tmp/opcua_sim.py）</summary>
    private const string Endpoint = "opc.tcp://localhost:4840";

    /// <summary>检查模拟器是否运行（端口 4840 可连接）</summary>
    private static bool IsSimulatorRunning()
    {
        try
        {
            using var client = new System.Net.Sockets.TcpClient();
            var task = client.ConnectAsync("localhost", 4840);
            return task.Wait(3000);
        }
        catch
        {
            return false;
        }
    }

    [Fact]
    public async Task OpcUaAdapter_Should_Connect_And_Read_Temperature()
    {
        // Arrange: 模拟器未运行时跳过
        if (!IsSimulatorRunning())
        {
            // 使用 Assert.SkipWhen（xUnit 不直接支持），改为直接返回并输出
            return; // 模拟器未运行，跳过此测试
        }

        var adapter = new OpcUaAdapter(NullLogger<OpcUaAdapter>.Instance);
        var config = new DeviceConfig(
            DeviceId: "AC-OPCUA-001",
            Protocol: "opcua",
            ConnectionString: Endpoint,
            DataPoints: new Dictionary<string, string>
            {
                ["ns=2;i=2"] = "temperature",
                ["ns=2;i=3"] = "pressure",
                ["ns=2;i=5"] = "motor_current",
            });

        try
        {
            // Act: 连接
            await adapter.ConnectAsync(config, CancellationToken.None);
            adapter.IsConnected.Should().BeTrue("连接成功后 IsConnected 应为 true");

            // Act: 读取节点（模拟器节点 ID: ns=2;i=2 Temperature, i=3 Pressure, i=5 MotorCurrent）
            var points = await adapter.ReadAsync(
                new[] { "ns=2;i=2", "ns=2;i=3", "ns=2;i=5" },
                CancellationToken.None);

            // Assert: 应读到 3 个数据点
            points.Should().HaveCount(3);
            points.Should().AllSatisfy(p =>
            {
                p.Quality.Should().Be("Good", "模拟器返回的数据质量应为 Good");
                p.Timestamp.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(5));
            });

            // 温度应该在合理范围（45-85°C，因为模拟器 65±20）
            var temp = points.First(p => p.PointId == "ns=2;i=2");
            temp.Value.Should().BeInRange(40, 90, "温度模拟值应在 40-90°C 范围");
        }
        finally
        {
            await adapter.DisposeAsync();
        }
    }

    [Fact]
    public async Task OpcUaAdapter_Should_Read_Multiple_Points_In_One_Batch()
    {
        if (!IsSimulatorRunning()) return;

        var adapter = new OpcUaAdapter(NullLogger<OpcUaAdapter>.Instance);
        var config = new DeviceConfig(
            DeviceId: "AC-OPCUA-001",
            Protocol: "opcua",
            ConnectionString: Endpoint,
            DataPoints: new Dictionary<string, string>());

        try
        {
            await adapter.ConnectAsync(config, CancellationToken.None);

            // 批量读取所有节点（ns=2: i=2 Temp, i=3 Pressure, i=4 Vibration, i=5 Current, i=6 Speed）
            var points = await adapter.ReadAsync(
                new[] { "ns=2;i=2", "ns=2;i=3", "ns=2;i=4", "ns=2;i=5", "ns=2;i=6" },
                CancellationToken.None);

            points.Should().HaveCount(5);

            // 转速应为整数 2980
            var speed = points.First(p => p.PointId == "ns=2;i=6");
            speed.Value.Should().Be(2980.0);
        }
        finally
        {
            await adapter.DisposeAsync();
        }
    }
}
