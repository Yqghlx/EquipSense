using EquipAI.EdgeGateway.Protocols;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;

namespace EquipAI.Tests.Unit.EdgeGateway;

/// <summary>
/// 使用仓库 Simulator 验证 Modbus TCP 适配器的保持寄存器和线圈读取。
/// </summary>
[Trait("Category", "RequiresSimulator")]
public class ModbusTcpAdapterIntegrationTests
{
    /// <summary>
    /// 仓库 Simulator 的默认 Modbus TCP 端点。
    /// </summary>
    private const string DefaultEndpoint = "127.0.0.1:5020";

    /// <summary>
    /// 检查指定 host:port 端点的 TCP 端口是否可连接。
    /// </summary>
    private static bool IsSimulatorRunning(string endpoint)
    {
        try
        {
            var separatorIndex = endpoint.LastIndexOf(':');
            if (separatorIndex <= 0
                || separatorIndex == endpoint.Length - 1
                || !int.TryParse(endpoint[(separatorIndex + 1)..], out var port)
                || port <= 0)
            {
                return false;
            }

            var host = endpoint[..separatorIndex].Trim('[', ']');
            using var client = new System.Net.Sockets.TcpClient();
            return client.ConnectAsync(host, port).Wait(TimeSpan.FromSeconds(3));
        }
        catch
        {
            return false;
        }
    }

    [ProtocolFact]
    public async Task ModbusTcpAdapter_Should_Connect_And_Read_Holding_Registers()
    {
        var endpoint = ProtocolIntegrationTestEnvironment.ReadEndpoint(
            "EQUIPAI_MODBUS_TEST_ENDPOINT",
            DefaultEndpoint);
        ProtocolIntegrationTestEnvironment.EnsureAvailable(
            "Modbus TCP",
            ProtocolIntegrationTestEnvironment.IsEnabled(),
            IsSimulatorRunning(endpoint));

        var adapter = new ModbusTcpAdapter(NullLogger<ModbusTcpAdapter>.Instance);
        var config = new DeviceConfig(
            DeviceId: "AC-MODBUS-001",
            Protocol: "modbus-tcp",
            ConnectionString: endpoint,
            DataPoints: new Dictionary<string, string>
            {
                ["holding_register:100"] = "temperature",
                ["holding_register:101"] = "pressure",
                ["holding_register:102"] = "vibration",
            });

        try
        {
            await adapter.ConnectAsync(config, CancellationToken.None);
            adapter.IsConnected.Should().BeTrue("连接成功后 IsConnected 应为 true");

            var points = await adapter.ReadAsync(
                new[] { "holding_register:100", "holding_register:101", "holding_register:102" },
                CancellationToken.None);

            points.Should().HaveCount(3);
            points.Should().AllSatisfy(point => point.Quality.Should().Be("good"));

            var temperature = points.First(point => point.PointId == "holding_register:100");
            temperature.Value.Should().BeInRange(20, 110, "温度寄存器值应在 Simulator 配置范围内");

            var pressure = points.First(point => point.PointId == "holding_register:101");
            pressure.Value.Should().BeInRange(10, 90);

            var vibration = points.First(point => point.PointId == "holding_register:102");
            vibration.Value.Should().BeInRange(0, 20);
        }
        finally
        {
            await adapter.DisposeAsync();
        }
    }

    [ProtocolFact]
    public async Task ModbusTcpAdapter_Should_Read_Coils()
    {
        var endpoint = ProtocolIntegrationTestEnvironment.ReadEndpoint(
            "EQUIPAI_MODBUS_TEST_ENDPOINT",
            DefaultEndpoint);
        ProtocolIntegrationTestEnvironment.EnsureAvailable(
            "Modbus TCP",
            ProtocolIntegrationTestEnvironment.IsEnabled(),
            IsSimulatorRunning(endpoint));

        var adapter = new ModbusTcpAdapter(NullLogger<ModbusTcpAdapter>.Instance);
        var config = new DeviceConfig(
            DeviceId: "AC-MODBUS-001",
            Protocol: "modbus-tcp",
            ConnectionString: endpoint,
            DataPoints: new Dictionary<string, string>());

        try
        {
            await adapter.ConnectAsync(config, CancellationToken.None);

            var points = await adapter.ReadAsync(
                new[] { "coil:0", "coil:1" },
                CancellationToken.None);

            points.Should().HaveCount(2);

            var running = points.First(point => point.PointId == "coil:0");
            running.Value.Should().Be(1.0, "Simulator 线圈 0 表示设备运行");

            var alarm = points.First(point => point.PointId == "coil:1");
            alarm.Value.Should().Be(0.0, "Simulator 线圈 1 表示无报警");
        }
        finally
        {
            await adapter.DisposeAsync();
        }
    }
}
