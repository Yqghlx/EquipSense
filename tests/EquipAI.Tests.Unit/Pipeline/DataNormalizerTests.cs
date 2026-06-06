using EquipAI.EdgeGateway.Pipeline;
using EquipAI.EdgeGateway.Protocols;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Pipeline;

public class DataNormalizerTests
{
    [Fact]
    public void Normalize_应将DataPoint映射为指标名()
    {
        var dataPoints = new List<DataPoint>
        {
            new("ns=2;s=Channel1.Temperature", "temperature", 85.3, "good", DateTime.UtcNow),
            new("ns=2;s=Channel1.Vibration", "vibration", 2.1, "good", DateTime.UtcNow),
        };

        var deviceConfig = new DeviceConfig(
            "cnc-001", "opcua", "opc.tcp://localhost:4840",
            new Dictionary<string, string>
            {
                ["temperature"] = "ns=2;s=Channel1.Temperature",
                ["vibration"] = "ns=2;s=Channel1.Vibration"
            });

        var result = DataNormalizer.Normalize("cnc-001", dataPoints, deviceConfig);

        result.DeviceId.Should().Be("cnc-001");
        result.Metrics["temperature"].Should().Be(85.3);
        result.Metrics["vibration"].Should().Be(2.1);
    }

    [Fact]
    public void Normalize_未配置的数据点应忽略()
    {
        var dataPoints = new List<DataPoint>
        {
            new("ns=2;s=Unknown", "unknown", 42.0, "good", DateTime.UtcNow),
        };

        var deviceConfig = new DeviceConfig(
            "dev-001", "opcua", "opc.tcp://localhost:4840",
            new Dictionary<string, string>());

        var result = DataNormalizer.Normalize("dev-001", dataPoints, deviceConfig);

        result.Metrics.Should().BeEmpty();
    }

    [Fact]
    public void Normalize_多个数据点应正确映射()
    {
        var now = DateTime.UtcNow;
        var dataPoints = new List<DataPoint>
        {
            new("holding_register:100", "temperature", 85.3, "good", now),
            new("holding_register:101", "pressure", 6.2, "good", now),
            new("coil:0", "status", 1.0, "good", now),
        };

        var deviceConfig = new DeviceConfig(
            "inj-001", "modbus-tcp", "192.168.1.50:502",
            new Dictionary<string, string>
            {
                ["temperature"] = "holding_register:100",
                ["pressure"] = "holding_register:101",
                ["status"] = "coil:0"
            });

        var result = DataNormalizer.Normalize("inj-001", dataPoints, deviceConfig);

        result.Metrics.Should().HaveCount(3);
        result.DeviceId.Should().Be("inj-001");
    }

    [Fact]
    public void Normalize_空数据点列表应返回空指标()
    {
        var config = new DeviceConfig("dev-001", "opcua", "opc.tcp://localhost:4840",
            new Dictionary<string, string> { ["temp"] = "ns=2;s=Temp" });

        var result = DataNormalizer.Normalize("dev-001", [], config);

        result.Metrics.Should().BeEmpty();
        result.DeviceId.Should().Be("dev-001");
    }

    [Fact]
    public void Normalize_应取最新数据点的时间戳()
    {
        var t1 = new DateTime(2026, 6, 1, 12, 0, 0, DateTimeKind.Utc);
        var t2 = new DateTime(2026, 6, 1, 12, 0, 5, DateTimeKind.Utc);
        var dataPoints = new List<DataPoint>
        {
            new("addr1", "temp", 85.3, "good", t1),
            new("addr2", "pressure", 6.2, "good", t2),
        };

        var config = new DeviceConfig("dev-001", "opcua", "",
            new Dictionary<string, string>
            {
                ["temp"] = "addr1", ["pressure"] = "addr2"
            });

        var result = DataNormalizer.Normalize("dev-001", dataPoints, config);
        result.Timestamp.Should().Be(t2);
    }

    [Fact]
    public void Normalize_无匹配指标时Timestamp应为UtcNow()
    {
        var before = DateTime.UtcNow;
        var dataPoints = new List<DataPoint>
        {
            new("unknown_addr", "x", 1.0, "good", DateTime.UtcNow),
        };

        var config = new DeviceConfig("dev-001", "opcua", "",
            new Dictionary<string, string>());

        var result = DataNormalizer.Normalize("dev-001", dataPoints, config);
        var after = DateTime.UtcNow;

        result.Timestamp.Should().BeOnOrAfter(before);
        result.Timestamp.Should().BeOnOrBefore(after);
    }

    [Fact]
    public void Normalize_部分匹配部分不匹配应只映射匹配的()
    {
        var dataPoints = new List<DataPoint>
        {
            new("addr1", "temp", 85.3, "good", DateTime.UtcNow),
            new("addr2", "unknown", 99.0, "good", DateTime.UtcNow),
        };

        var config = new DeviceConfig("dev-001", "opcua", "",
            new Dictionary<string, string> { ["temp"] = "addr1" });

        var result = DataNormalizer.Normalize("dev-001", dataPoints, config);

        result.Metrics.Should().HaveCount(1);
        result.Metrics.Should().ContainKey("temp");
    }
}
