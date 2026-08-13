using EquipAI.EdgeGateway;
using EquipAI.EdgeGateway.Pipeline;
using EquipAI.EdgeGateway.Protocols;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace EquipAI.Tests.Unit.EdgeGateway;

/// <summary>
/// 设备管理器生命周期与配置并发测试。
/// </summary>
public sealed class DeviceManagerTests
{
    [Fact]
    public async Task DisposeAsync_应释放所有正在运行的协议适配器()
    {
        var adapters = new List<Mock<IProtocolAdapter>>();
        using var services = CreateServiceProvider();
        var manager = new DeviceManager(
            services,
            (_, _) => CreateAdapter(adapters).Object,
            NullLogger<DeviceManager>.Instance);

        await manager.ApplyConfigAsync([CreateConfig("device-001")]);
        await WaitUntilAsync(() => adapters.Count == 1);

        await manager.DisposeAsync();

        adapters.Should().ContainSingle();
        adapters[0].Verify(adapter => adapter.DisposeAsync(), Times.Once);
    }

    [Fact]
    public async Task 并发应用配置时应串行停止和替换采集器()
    {
        var adapters = new List<Mock<IProtocolAdapter>>();
        var firstReadStarted = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        var releaseFirstRead = new TaskCompletionSource<List<DataPoint>>(TaskCreationOptions.RunContinuationsAsynchronously);
        using var services = CreateServiceProvider();
        var manager = new DeviceManager(
            services,
            (_, _) => CreateAdapter(adapters, firstReadStarted, releaseFirstRead).Object,
            NullLogger<DeviceManager>.Instance);

        await manager.ApplyConfigAsync([CreateConfig("device-001", "opc.tcp://first")]);
        await firstReadStarted.Task.WaitAsync(TimeSpan.FromSeconds(2));

        var firstUpdate = manager.ApplyConfigAsync([CreateConfig("device-001", "opc.tcp://second")]);
        await WaitUntilAsync(() => !firstUpdate.IsCompleted);
        var secondUpdate = manager.ApplyConfigAsync([CreateConfig("device-001", "opc.tcp://third")]);

        releaseFirstRead.SetResult([]);
        await Task.WhenAll(firstUpdate, secondUpdate);
        await manager.DisposeAsync();

        adapters.Should().HaveCount(3);
        foreach (var adapter in adapters)
            adapter.Verify(item => item.DisposeAsync(), Times.Once);
    }

    private static ServiceProvider CreateServiceProvider()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton(new GatewayMetrics());
        services.AddSingleton(new CloudUploader(
            NullLogger<CloudUploader>.Instance,
            new GatewayOptions()));
        return services.BuildServiceProvider();
    }

    private static DeviceConfig CreateConfig(string deviceId, string? connectionString = null)
        => new(
            deviceId,
            "test",
            connectionString ?? "test://device",
            new Dictionary<string, string>(),
            PollIntervalMs: 1);

    private static Mock<IProtocolAdapter> CreateAdapter(
        ICollection<Mock<IProtocolAdapter>> adapters,
        TaskCompletionSource<bool>? firstReadStarted = null,
        TaskCompletionSource<List<DataPoint>>? releaseFirstRead = null)
    {
        var adapter = new Mock<IProtocolAdapter>();
        adapter.SetupGet(item => item.IsConnected).Returns(true);
        adapter.SetupGet(item => item.ProtocolType).Returns("test");
        adapter
            .Setup(item => item.ReadAsync(It.IsAny<string[]>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                if (firstReadStarted is not null && releaseFirstRead is not null)
                {
                    firstReadStarted.TrySetResult(true);
                    return releaseFirstRead.Task;
                }

                return Task.FromResult<List<DataPoint>>([]);
            });
        adapter
            .Setup(item => item.DisposeAsync())
            .Returns(ValueTask.CompletedTask);
        adapters.Add(adapter);
        return adapter;
    }

    private static async Task WaitUntilAsync(Func<bool> predicate)
    {
        var deadline = DateTime.UtcNow + TimeSpan.FromSeconds(2);
        while (!predicate())
        {
            if (DateTime.UtcNow >= deadline)
                throw new TimeoutException("等待设备管理器进入预期状态超时");

            await Task.Delay(10);
        }
    }
}
