using System.Text.Json;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Validation;
using EquipAI.Infrastructure.Messaging;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace EquipAI.Tests.Unit.Messaging;

/// <summary>
/// MQTT 遥测消息边界测试。
///
/// MQTT 没有 HTTP 模型绑定层，消息体会直接进入后台队列，因此必须在解析入口
/// 执行与 HTTP 上报一致的大小、字段和指标边界校验。
/// </summary>
public class MqttMessageHandlerTests
{
    private static readonly Guid TenantId = Guid.NewGuid();
    private static readonly Guid DeviceId = Guid.NewGuid();

    [Fact]
    public async Task HandleAsync_有效消息_按指标入队并保留租户设备来源()
    {
        var telemetry = new Mock<ITelemetryService>();
        telemetry
            .Setup(service => service.EnqueueAndWaitForPersistenceAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<double>(),
                It.IsAny<DateTime>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);
        var handler = new MqttMessageHandler(
            telemetry.Object,
            NullLogger<MqttMessageHandler>.Instance);
        var timestamp = new DateTime(2026, 8, 12, 12, 0, 0, DateTimeKind.Utc);
        var payload = JsonSerializer.SerializeToUtf8Bytes(new
        {
            timestamp,
            metrics = new Dictionary<string, double>
            {
                ["temperature"] = 75.5,
                ["pressure"] = 0.8,
            },
            quality = " good ",
        });

        await handler.HandleAsync($"factory/{TenantId}/telemetry/{DeviceId}", payload);

        var invocations = telemetry.Invocations
            .Where(call => call.Method.Name == nameof(ITelemetryService.EnqueueAndWaitForPersistenceAsync))
            .ToList();
        invocations.Should().HaveCount(2);
        invocations.Should().OnlyContain(call =>
            (Guid)call.Arguments[0] == TenantId
            && (Guid)call.Arguments[1] == DeviceId
            && (string)call.Arguments[5] == "good"
            && (string)call.Arguments[6] == "mqtt");
        invocations.Select(call => (string)call.Arguments[2])
            .Should().BeEquivalentTo("temperature", "pressure");
    }

    [Fact]
    public async Task HandleAsync_遥测持久化失败_必须向上抛出以阻止MQTT确认()
    {
        var telemetry = new Mock<ITelemetryService>();
        telemetry
            .Setup(service => service.EnqueueAndWaitForPersistenceAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<double>(),
                It.IsAny<DateTime>(), It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new InvalidOperationException("模拟数据库不可用"));
        var handler = CreateHandler(telemetry);
        var payload = JsonSerializer.SerializeToUtf8Bytes(new
        {
            timestamp = DateTime.UtcNow,
            metrics = new Dictionary<string, double> { ["temperature"] = 95 },
            quality = "good",
        });

        var act = () => handler.HandleAsync(CreateTopic(), payload);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("模拟数据库不可用");
    }

    [Fact]
    public async Task HandleAsync_指标数量超过上限_整条消息不入队()
    {
        var telemetry = new Mock<ITelemetryService>();
        var handler = CreateHandler(telemetry);
        var metrics = Enumerable.Range(0, TelemetryInputValidator.MaxMetricCount + 1)
            .ToDictionary(index => $"metric-{index}", _ => 1d);
        var payload = JsonSerializer.SerializeToUtf8Bytes(new
        {
            timestamp = DateTime.UtcNow,
            metrics,
            quality = "good",
        });

        await handler.HandleAsync(CreateTopic(), payload);

        telemetry.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task HandleAsync_指标名或质量字段非法_不入队()
    {
        var telemetry = new Mock<ITelemetryService>();
        var handler = CreateHandler(telemetry);
        var invalidMetricPayload = JsonSerializer.SerializeToUtf8Bytes(new
        {
            timestamp = DateTime.UtcNow,
            metrics = new Dictionary<string, double> { ["temperature\n"] = 1 },
            quality = "good",
        });
        var invalidQualityPayload = JsonSerializer.SerializeToUtf8Bytes(new
        {
            timestamp = DateTime.UtcNow,
            metrics = new Dictionary<string, double> { ["temperature"] = 1 },
            quality = new string('q', TelemetryInputValidator.MaxQualityLength + 1),
        });

        await handler.HandleAsync(CreateTopic(), invalidMetricPayload);
        await handler.HandleAsync(CreateTopic(), invalidQualityPayload);

        telemetry.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task HandleAsync_消息体超过上限_不反序列化也不入队()
    {
        var telemetry = new Mock<ITelemetryService>();
        var handler = CreateHandler(telemetry);
        var padding = new string('x', TelemetryInputValidator.MaxPayloadBytes);
        var payload = JsonSerializer.SerializeToUtf8Bytes(new
        {
            timestamp = DateTime.UtcNow,
            metrics = new Dictionary<string, double> { ["temperature"] = 1 },
            quality = "good",
            padding,
        });
        payload.Length.Should().BeGreaterThan(TelemetryInputValidator.MaxPayloadBytes);

        await handler.HandleAsync(CreateTopic(), payload);

        telemetry.VerifyNoOtherCalls();
    }

    private static MqttMessageHandler CreateHandler(Mock<ITelemetryService> telemetry)
        => new(telemetry.Object, NullLogger<MqttMessageHandler>.Instance);

    private static string CreateTopic()
        => $"factory/{TenantId}/telemetry/{DeviceId}";
}
