using EquipAI.EdgeGateway.Protocols;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;

namespace EquipAI.Tests.Unit.EdgeGateway;

/// <summary>
/// 使用仓库 Simulator 验证 OPC UA 适配器的真实连接、批量读取和数据质量。
/// </summary>
[Trait("Category", "RequiresSimulator")]
public class OpcUaAdapterIntegrationTests
{
    /// <summary>
    /// 仓库 Simulator 的默认 OPC UA 端点。
    /// </summary>
    private const string DefaultEndpoint = "opc.tcp://127.0.0.1:4840";

    /// <summary>
    /// 检查指定 OPC UA 端点的 TCP 端口是否可连接。
    /// </summary>
    private static bool IsSimulatorRunning(string endpoint)
    {
        try
        {
            if (!Uri.TryCreate(endpoint, UriKind.Absolute, out var uri)
                || string.IsNullOrWhiteSpace(uri.Host)
                || uri.Port <= 0)
            {
                return false;
            }

            using var client = new System.Net.Sockets.TcpClient();
            return client.ConnectAsync(uri.Host, uri.Port).Wait(TimeSpan.FromSeconds(3));
        }
        catch
        {
            return false;
        }
    }

    [ProtocolFact]
    public async Task OpcUaAdapter_Should_Connect_And_Read_Temperature()
    {
        var endpoint = ProtocolIntegrationTestEnvironment.ReadEndpoint(
            "EQUIPAI_OPCUA_TEST_ENDPOINT",
            DefaultEndpoint);
        ProtocolIntegrationTestEnvironment.EnsureAvailable(
            "OPC UA",
            ProtocolIntegrationTestEnvironment.IsEnabled(),
            IsSimulatorRunning(endpoint));

        var adapter = new OpcUaAdapter(NullLogger<OpcUaAdapter>.Instance);
        var config = new DeviceConfig(
            DeviceId: "AC-OPCUA-001",
            Protocol: "opcua",
            ConnectionString: endpoint,
            DataPoints: new Dictionary<string, string>
            {
                ["ns=2;s=temperature"] = "temperature",
                ["ns=2;s=pressure"] = "pressure",
                ["ns=2;s=vibration"] = "vibration",
            });

        try
        {
            await adapter.ConnectAsync(config, CancellationToken.None);
            adapter.IsConnected.Should().BeTrue("连接成功后 IsConnected 应为 true");

            var points = await adapter.ReadAsync(
                new[] { "ns=2;s=temperature", "ns=2;s=pressure", "ns=2;s=vibration" },
                CancellationToken.None);

            points.Should().HaveCount(3);
            points.Should().AllSatisfy(point =>
            {
                point.Quality.Should().Be("Good", "模拟器返回的数据质量应为 Good");
                point.Timestamp.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(5));
            });

            var temperature = points.First(point => point.PointId == "ns=2;s=temperature");
            temperature.Value.Should().BeInRange(20, 110, "温度模拟值应在 20-110°C 范围");
        }
        finally
        {
            await adapter.DisposeAsync();
        }
    }

    [ProtocolFact]
    public async Task OpcUaAdapter_Should_Read_Multiple_Points_In_One_Batch()
    {
        var endpoint = ProtocolIntegrationTestEnvironment.ReadEndpoint(
            "EQUIPAI_OPCUA_TEST_ENDPOINT",
            DefaultEndpoint);
        ProtocolIntegrationTestEnvironment.EnsureAvailable(
            "OPC UA",
            ProtocolIntegrationTestEnvironment.IsEnabled(),
            IsSimulatorRunning(endpoint));

        var adapter = new OpcUaAdapter(NullLogger<OpcUaAdapter>.Instance);
        var config = new DeviceConfig(
            DeviceId: "AC-OPCUA-001",
            Protocol: "opcua",
            ConnectionString: endpoint,
            DataPoints: new Dictionary<string, string>());

        try
        {
            await adapter.ConnectAsync(config, CancellationToken.None);

            var points = await adapter.ReadAsync(
                new[] { "ns=2;s=temperature", "ns=2;s=pressure", "ns=2;s=vibration" },
                CancellationToken.None);

            points.Should().HaveCount(3);
            points.Should().AllSatisfy(point => point.Quality.Should().Be("Good"));

            var vibration = points.First(point => point.PointId == "ns=2;s=vibration");
            vibration.Value.Should().BeInRange(0, 20);
        }
        finally
        {
            await adapter.DisposeAsync();
        }
    }
}
