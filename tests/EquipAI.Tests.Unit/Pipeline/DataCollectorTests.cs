using EquipAI.EdgeGateway;
using EquipAI.EdgeGateway.Pipeline;
using EquipAI.EdgeGateway.Protocols;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace EquipAI.Tests.Unit.Pipeline;

public class DataCollectorTests
{
    /// <summary>
    /// 构建测试用的 DataCollector 实例
    /// CloudUploader 不是接口，但构造函数接受可选依赖，MQTT 未连接时 UploadAsync 会安全跳过
    /// </summary>
    private static (DataCollector collector, Mock<IProtocolAdapter> adapterMock) CreateSut(
        DeviceConfig? config = null)
    {
        config ??= new DeviceConfig(
            "test-device", "opcua", "opc.tcp://localhost:4840",
            new Dictionary<string, string>
            {
                ["temperature"] = "ns=2;s=Temperature",
                ["pressure"] = "ns=2;s=Pressure"
            },
            PollIntervalMs: 1000);

        var adapterMock = new Mock<IProtocolAdapter>();
        // 默认模拟已连接
        adapterMock.SetupGet(a => a.IsConnected).Returns(true);
        adapterMock.SetupGet(a => a.ProtocolType).Returns("OPCUA");

        // 创建真实的 CloudUploader（无需 MQTT 连接，未连接时 UploadAsync 会直接返回）
        var options = new GatewayOptions();
        var uploader = new CloudUploader(
            new NullLogger<CloudUploader>(), options);

        var collector = new DataCollector(
            new NullLogger<DataCollector>(),
            () => adapterMock.Object,
            uploader,
            config,
            "TestDevice");

        return (collector, adapterMock);
    }

    [Fact]
    public async Task CollectOnceAsync_应调用适配器读取所有配置的数据点()
    {
        // Arrange
        var (collector, adapterMock) = CreateSut();

        var expectedPointIds = new[] { "ns=2;s=Temperature", "ns=2;s=Pressure" };
        adapterMock
            .Setup(a => a.ReadAsync(It.IsAny<string[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<DataPoint>
            {
                new("ns=2;s=Temperature", "temperature", 85.0, "Good", DateTime.UtcNow),
                new("ns=2;s=Pressure", "pressure", 6.2, "Good", DateTime.UtcNow),
            });

        // Act
        await collector.CollectOnceAsync(CancellationToken.None);

        // Assert — 验证 ReadAsync 被调用，且传入的点位 ID 包含所有配置的数据点
        adapterMock.Verify(
            a => a.ReadAsync(
                It.Is<string[]>(ids => ids.SequenceEqual(expectedPointIds)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CollectOnceAsync_适配器未连接应跳过采集()
    {
        // Arrange
        var (collector, adapterMock) = CreateSut();
        adapterMock.SetupGet(a => a.IsConnected).Returns(false);

        // Act
        await collector.CollectOnceAsync(CancellationToken.None);

        // Assert — 适配器未连接时不应调用 ReadAsync
        adapterMock.Verify(
            a => a.ReadAsync(It.IsAny<string[]>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CollectOnceAsync_ReadAsync返回空列表不应抛异常()
    {
        var (collector, adapterMock) = CreateSut();
        adapterMock
            .Setup(a => a.ReadAsync(It.IsAny<string[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        var act = () => collector.CollectOnceAsync(CancellationToken.None);
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task CollectOnceAsync_空配置点位列表应调用ReadAsync传空数组()
    {
        var config = new DeviceConfig("empty-dev", "opcua", "opc.tcp://localhost:4840",
            new Dictionary<string, string>(), PollIntervalMs: 1000);

        var (collector, adapterMock) = CreateSut(config);
        adapterMock
            .Setup(a => a.ReadAsync(It.IsAny<string[]>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        await collector.CollectOnceAsync(CancellationToken.None);

        adapterMock.Verify(
            a => a.ReadAsync(It.IsAny<string[]>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CollectOnceAsync_ReadAsync异常应向上传播()
    {
        var (collector, adapterMock) = CreateSut();
        adapterMock
            .Setup(a => a.ReadAsync(It.IsAny<string[]>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("适配器读取失败"));

        var act = () => collector.CollectOnceAsync(CancellationToken.None);
        await act.Should().ThrowAsync<Exception>().WithMessage("*适配器读取失败*");
    }
}
