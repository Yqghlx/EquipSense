using EquipAI.EdgeGateway.Pipeline;
using FluentAssertions;
using System.Text.Json;

namespace EquipAI.Tests.Unit.Pipeline;

public class CloudUploaderTests
{
    [Fact]
    public void BuildMqttTopic_应生成正确的主题()
    {
        var topic = CloudUploader.BuildMqttTopic("tenant-123", "cnc-001");
        topic.Should().Be("factory/tenant-123/telemetry/cnc-001");
    }

    [Fact]
    public void BuildPayload_应生成有效的JSON()
    {
        var msg = new NormalizedMessage(
            "cnc-001", new DateTime(2026, 6, 1, 12, 0, 0, DateTimeKind.Utc),
            new Dictionary<string, double> { ["temperature"] = 85.3, ["vibration"] = 2.1 });

        var json = CloudUploader.BuildPayload(msg, "CNC");
        var doc = JsonDocument.Parse(json);

        doc.RootElement.GetProperty("device_id").GetString().Should().Be("cnc-001");
        doc.RootElement.GetProperty("device_type").GetString().Should().Be("CNC");
        doc.RootElement.GetProperty("metrics").GetProperty("temperature").GetDouble().Should().Be(85.3);
        doc.RootElement.GetProperty("quality").GetString().Should().Be("good");
    }

    [Fact]
    public void BuildPayload_应包含时间戳()
    {
        var msg = new NormalizedMessage(
            "dev-001", new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            new Dictionary<string, double>());

        var json = CloudUploader.BuildPayload(msg, "Test");
        var doc = JsonDocument.Parse(json);

        doc.RootElement.TryGetProperty("timestamp", out _).Should().BeTrue();
    }
}
