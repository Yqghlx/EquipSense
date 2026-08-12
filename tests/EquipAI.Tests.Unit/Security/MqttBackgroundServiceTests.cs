using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Messaging;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using MQTTnet;
using MQTTnet.Client;

namespace EquipAI.Tests.Unit.Security;

/// <summary>
/// MQTT 后台服务生命周期测试。
/// </summary>
public sealed class MqttBackgroundServiceTests
{
    [Fact]
    public async Task ExecuteAsync_宿主取消初始连接时不应记录错误日志()
    {
        var connectStarted = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        var mqttClient = new Mock<IMqttClient>();
        mqttClient
            .Setup(client => client.ConnectAsync(
                It.IsAny<MqttClientOptions>(),
                It.IsAny<CancellationToken>()))
            .Returns(async (
                MqttClientOptions _,
                CancellationToken cancellationToken) =>
            {
                connectStarted.TrySetResult(true);
                await Task.Delay(Timeout.InfiniteTimeSpan, cancellationToken);
                return null!;
            });

        var mqttService = new MqttClientService(
            Options.Create(new MqttOptions
            {
                Host = "mqtt.example.com",
                Port = 8883,
                UseTls = true,
            }),
            NullLogger<MqttClientService>.Instance,
            () => mqttClient.Object);
        var messageHandler = new MqttMessageHandler(
            Mock.Of<ITelemetryService>(),
            NullLogger<MqttMessageHandler>.Instance);
        var logger = new Mock<ILogger<MqttBackgroundService>>();
        var service = new TestableMqttBackgroundService(mqttService, messageHandler, logger.Object);
        using var cts = new CancellationTokenSource();

        var executeTask = service.RunAsync(cts.Token);
        await connectStarted.Task.WaitAsync(TimeSpan.FromSeconds(5));

        cts.Cancel();

        await executeTask;
        var hasErrorLog = logger.Invocations.Any(invocation =>
            invocation.Method.Name == nameof(ILogger.Log)
            && invocation.Arguments.Count > 0
            && invocation.Arguments[0] is LogLevel
            && (LogLevel)invocation.Arguments[0] == LogLevel.Error);
        hasErrorLog.Should().BeFalse("宿主主动停机不属于 MQTT 连接故障，不应产生错误告警");
    }

    private sealed class TestableMqttBackgroundService : MqttBackgroundService
    {
        public TestableMqttBackgroundService(
            MqttClientService mqttClient,
            MqttMessageHandler messageHandler,
            ILogger<MqttBackgroundService> logger)
            : base(mqttClient, messageHandler, logger)
        {
        }

        public Task RunAsync(CancellationToken cancellationToken) => ExecuteAsync(cancellationToken);
    }
}
