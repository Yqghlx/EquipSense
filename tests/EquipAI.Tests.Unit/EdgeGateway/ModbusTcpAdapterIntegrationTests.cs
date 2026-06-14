using EquipAI.EdgeGateway.Protocols;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;

namespace EquipAI.Tests.Unit.EdgeGateway;

/// <summary>
/// Modbus TCP 协议适配器集成测试
///
/// 需要本地运行 Modbus 模拟服务器（python3 /tmp/modbus_sim2.py，端口 502）。
/// 模拟器 Holding Registers: 100=650(温度) 101=70(压力) 102=120(电流) 103=2980(转速) 104=1
///
/// 测试验证 ModbusTcpAdapter 能：
/// 1. 连接到 Modbus TCP 服务器
/// 2. 读取保持寄存器值并正确转换为 DataPoint
/// 3. 读取线圈状态
///
/// 如模拟器未运行，测试会被跳过。
/// </summary>
[Trait("Category", "RequiresSimulator")]
public class ModbusTcpAdapterIntegrationTests
{
    private const string Endpoint = "127.0.0.1:502";

    private static bool IsSimulatorRunning()
    {
        try
        {
            using var client = new System.Net.Sockets.TcpClient();
            return client.ConnectAsync("127.0.0.1", 502).Wait(3000);
        }
        catch
        {
            return false;
        }
    }

    [Fact]
    public async Task ModbusTcpAdapter_Should_Connect_And_Read_Holding_Registers()
    {
        if (!IsSimulatorRunning()) return;

        var adapter = new ModbusTcpAdapter(NullLogger<ModbusTcpAdapter>.Instance);
        var config = new DeviceConfig(
            DeviceId: "AC-MODBUS-001",
            Protocol: "modbus-tcp",
            ConnectionString: Endpoint,
            DataPoints: new Dictionary<string, string>
            {
                ["holding_register:0"] = "temperature",
                ["holding_register:1"] = "pressure",
                ["holding_register:2"] = "motor_current",
            });

        try
        {
            // Act: 连接
            await adapter.ConnectAsync(config, CancellationToken.None);
            adapter.IsConnected.Should().BeTrue("连接成功后 IsConnected 应为 true");

            // Act: 读取保持寄存器
            var points = await adapter.ReadAsync(
                new[] { "holding_register:0", "holding_register:1", "holding_register:2" },
                CancellationToken.None);

            // Assert
            points.Should().HaveCount(3);
            points.Should().AllSatisfy(p =>
            {
                p.Quality.Should().Be("good");
            });

            // 温度寄存器 100 = 650（65.0°C）
            var temp = points.First(p => p.PointId == "holding_register:0");
            temp.Value.Should().Be(650.0, "温度寄存器值应为 650");

            // 压力寄存器 101 = 70
            var pressure = points.First(p => p.PointId == "holding_register:1");
            pressure.Value.Should().Be(70.0);

            // 电流寄存器 102 = 120
            var current = points.First(p => p.PointId == "holding_register:2");
            current.Value.Should().Be(120.0);
        }
        finally
        {
            await adapter.DisposeAsync();
        }
    }

    [Fact]
    public async Task ModbusTcpAdapter_Should_Read_Coils()
    {
        if (!IsSimulatorRunning()) return;

        var adapter = new ModbusTcpAdapter(NullLogger<ModbusTcpAdapter>.Instance);
        var config = new DeviceConfig(
            DeviceId: "AC-MODBUS-001",
            Protocol: "modbus-tcp",
            ConnectionString: Endpoint,
            DataPoints: new Dictionary<string, string>());

        try
        {
            await adapter.ConnectAsync(config, CancellationToken.None);

            // 读取线圈 0（IsRunning = True）
            var points = await adapter.ReadAsync(
                new[] { "coil:0", "coil:1" },
                CancellationToken.None);

            points.Should().HaveCount(2);

            // 线圈 0 = True (1.0)
            var running = points.First(p => p.PointId == "coil:0");
            running.Value.Should().Be(1.0, "IsRunning 线圈应为 True");

            // 线圈 1 = False (0.0)
            var alarm = points.First(p => p.PointId == "coil:1");
            alarm.Value.Should().Be(0.0, "Alarm 线圈应为 False");
        }
        finally
        {
            await adapter.DisposeAsync();
        }
    }
}
