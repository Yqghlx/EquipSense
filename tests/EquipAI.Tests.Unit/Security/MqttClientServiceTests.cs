using EquipAI.Infrastructure.Messaging;
using FluentAssertions;
using EquipAI.Infrastructure.HealthChecks;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using MQTTnet;
using MQTTnet.Client;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using System.Text;
using System.Diagnostics;

namespace EquipAI.Tests.Unit.Security;

/// <summary>
/// MQTT 客户端连接生命周期测试。
/// </summary>
public sealed class MqttClientServiceTests
{
    [Fact]
    public void MQTT负载提取必须尊重ArraySegment的偏移量和长度()
    {
        // Arrange：模拟 MQTTnet 从池化缓冲区返回带前后无关字节的 ArraySegment。
        var expected = Encoding.UTF8.GetBytes("{\"ok\":true}");
        var buffer = Encoding.UTF8.GetBytes($"xxx{Encoding.UTF8.GetString(expected)}trailing");
        var message = new MqttApplicationMessage
        {
            PayloadSegment = new ArraySegment<byte>(buffer, 3, expected.Length)
        };

        // Act
        var payload = MqttClientService.ExtractPayload(message);

        // Assert：只能交给业务层实际的 Count 字节，不能把整个底层数组传下去。
        payload.Should().Equal(expected);
    }

    [Fact]
    public async Task 断线重连成功后必须重新订阅遥测主题()
    {
        // Arrange：使用零退避时间，让测试只验证重连后的订阅行为，不等待真实网络退避。
        var mqttClient = new Mock<IMqttClient>();
        mqttClient.SetupGet(client => client.IsConnected).Returns(false);
        mqttClient
            .Setup(client => client.ConnectAsync(
                It.IsAny<MqttClientOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((MqttClientConnectResult)null!);
        mqttClient
            .Setup(client => client.SubscribeAsync(
                It.IsAny<MqttClientSubscribeOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((MqttClientSubscribeResult)null!);

        var service = new MqttClientService(
            Options.Create(new MqttOptions
            {
                Host = "mqtt.example.com",
                Port = 8883,
                TopicPattern = "factory/+/telemetry/+",
                ReconnectDelaySeconds = 0,
                UseTls = true,
                Username = "mqtt-user",
                Password = "not-a-real-secret"
            }),
            NullLogger<MqttClientService>.Instance,
            () => mqttClient.Object);

        // Act：首次连接会订阅一次；模拟断线后，重连成功必须再次订阅。
        await service.ConnectAsync();
        await service.HandleDisconnectedAsync(null!);

        // Assert：若缺少重连后的 SubscribeAsync，计数将只有 1，数据管线会静默中断。
        mqttClient.Verify(
            client => client.SubscribeAsync(
                It.IsAny<MqttClientSubscribeOptions>(),
                It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    [Fact]
    public async Task 并发断线事件只能启动一条重连循环()
    {
        var mqttClient = new Mock<IMqttClient>();
        mqttClient.SetupGet(client => client.IsConnected).Returns(false);

        var reconnectStarted = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        var releaseReconnect = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        var connectCalls = 0;

        mqttClient
            .Setup(client => client.ConnectAsync(
                It.IsAny<MqttClientOptions>(),
                It.IsAny<CancellationToken>()))
            .Returns(async () =>
            {
                var call = Interlocked.Increment(ref connectCalls);
                if (call == 2)
                {
                    reconnectStarted.TrySetResult(true);
                    await releaseReconnect.Task;
                }

                return null!;
            });
        mqttClient
            .Setup(client => client.SubscribeAsync(
                It.IsAny<MqttClientSubscribeOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((MqttClientSubscribeResult)null!);

        var service = new MqttClientService(
            Options.Create(new MqttOptions
            {
                Host = "mqtt.example.com",
                Port = 8883,
                TopicPattern = "factory/+/telemetry/+",
                ReconnectDelaySeconds = 0,
                UseTls = true
            }),
            NullLogger<MqttClientService>.Instance,
            () => mqttClient.Object);

        await service.ConnectAsync();

        var firstReconnect = service.HandleDisconnectedAsync(null!);
        await reconnectStarted.Task.WaitAsync(TimeSpan.FromSeconds(5));

        var secondReconnect = service.HandleDisconnectedAsync(null!);
        await secondReconnect.WaitAsync(TimeSpan.FromSeconds(5));
        secondReconnect.IsCompletedSuccessfully.Should().BeTrue(
            "重复的断线事件应复用已有重连循环，不能并发操作同一个 MQTT 客户端");

        releaseReconnect.TrySetResult(true);
        await firstReconnect.WaitAsync(TimeSpan.FromSeconds(5));

        connectCalls.Should().Be(2);
        mqttClient.Verify(
            client => client.SubscribeAsync(
                It.IsAny<MqttClientSubscribeOptions>(),
                It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    [Fact]
    public async Task 停机时断线重连退避必须立即取消()
    {
        var mqttClient = new Mock<IMqttClient>();
        mqttClient.SetupGet(client => client.IsConnected).Returns(false);

        var service = new MqttClientService(
            Options.Create(new MqttOptions
            {
                Host = "mqtt.example.com",
                Port = 8883,
                ReconnectDelaySeconds = 1,
                UseTls = true,
            }),
            NullLogger<MqttClientService>.Instance,
            () => mqttClient.Object);

        await service.ConnectAsync();

        // 让重连循环进入退避等待；旧实现会完整等待 1 秒后才检查停机标志。
        var reconnectTask = service.HandleDisconnectedAsync(null!);
        await Task.Delay(50);

        var stopwatch = Stopwatch.StartNew();
        await service.DisconnectAsync();
        await reconnectTask.WaitAsync(TimeSpan.FromMilliseconds(500));

        stopwatch.Elapsed.Should().BeLessThan(TimeSpan.FromMilliseconds(500),
            "应用收到 SIGTERM 后不能被 MQTT 退避等待阻塞");
    }

    [Fact]
    public async Task MQTT就绪探针必须反映实际客户端连接状态()
    {
        var connected = false;
        var mqttClient = new Mock<IMqttClient>();
        mqttClient.SetupGet(client => client.IsConnected).Returns(() => connected);
        mqttClient
            .Setup(client => client.ConnectAsync(
                It.IsAny<MqttClientOptions>(),
                It.IsAny<CancellationToken>()))
            .Callback(() => connected = true)
            .ReturnsAsync((MqttClientConnectResult)null!);
        mqttClient
            .Setup(client => client.SubscribeAsync(
                It.IsAny<MqttClientSubscribeOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((MqttClientSubscribeResult)null!);

        var service = new MqttClientService(
            Options.Create(new MqttOptions
            {
                Host = "mqtt.example.com",
                Port = 8883,
                UseTls = true
            }),
            NullLogger<MqttClientService>.Instance,
            () => mqttClient.Object);
        var healthCheck = new MqttHealthCheck(service);
        var context = new HealthCheckContext();

        var beforeConnect = await healthCheck.CheckHealthAsync(context);
        beforeConnect.Status.Should().Be(HealthStatus.Unhealthy);

        await service.ConnectAsync();

        var afterConnect = await healthCheck.CheckHealthAsync(context);
        afterConnect.Status.Should().Be(HealthStatus.Healthy);
    }
}
