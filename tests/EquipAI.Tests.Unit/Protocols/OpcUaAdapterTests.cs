using EquipAI.EdgeGateway.Protocols;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Protocols;

/// <summary>
/// OpcUaAdapter 单元测试 — 验证基础属性和生命周期行为。
/// 注：实际 OPC UA 通信需要集成测试（需真实或模拟 OPC UA 服务器）。
/// </summary>
public class OpcUaAdapterTests
{
    [Fact]
    public async Task ProtocolType_应返回_opcua()
    {
        // Arrange
        await using var adapter = new OpcUaAdapter();

        // Act & Assert
        adapter.ProtocolType.Should().Be("opcua");
    }

    [Fact]
    public async Task 初始状态_IsConnected_应为_false()
    {
        // Arrange
        await using var adapter = new OpcUaAdapter();

        // Act & Assert
        adapter.IsConnected.Should().BeFalse("未连接服务器时 IsConnected 应为 false");
    }

    [Fact]
    public async Task 未连接时_ReadAsync_应抛出_InvalidOperationException()
    {
        // Arrange
        await using var adapter = new OpcUaAdapter();
        var pointIds = new[] { "ns=2;s=Temperature" };

        // Act
        var act = () => adapter.ReadAsync(pointIds, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*未连接*");
    }

    [Fact]
    public async Task DisposeAsync_应可安全重复调用()
    {
        // Arrange
        var adapter = new OpcUaAdapter();

        // Act
        await adapter.DisposeAsync();
        await adapter.DisposeAsync(); // 第二次调用不应抛出异常

        // Assert — 如果执行到这里说明测试通过
        adapter.IsConnected.Should().BeFalse();
    }

    [Fact]
    public async Task DisposeAsync_后_IsConnected_应为_false()
    {
        // Arrange
        var adapter = new OpcUaAdapter();

        // Act
        await adapter.DisposeAsync();

        // Assert
        adapter.IsConnected.Should().BeFalse("释放后 IsConnected 应为 false");
    }

    [Fact]
    public async Task DisposeAsync_后_ReadAsync_应抛出_ObjectDisposedException()
    {
        // Arrange
        var adapter = new OpcUaAdapter();
        await adapter.DisposeAsync();
        var pointIds = new[] { "ns=2;s=Temperature" };

        // Act
        var act = () => adapter.ReadAsync(pointIds, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ObjectDisposedException>();
    }

    [Fact]
    public async Task DisposeAsync_后_ConnectAsync_应抛出_ObjectDisposedException()
    {
        // Arrange
        var adapter = new OpcUaAdapter();
        await adapter.DisposeAsync();
        var config = new DeviceConfig(
            DeviceId: "test-device",
            Protocol: "opcua",
            ConnectionString: "opc.tcp://localhost:4840",
            DataPoints: new Dictionary<string, string> { ["Temperature"] = "ns=2;s=Temperature" }
        );

        // Act
        var act = () => adapter.ConnectAsync(config, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ObjectDisposedException>();
    }

    [Fact]
    public async Task 构造函数_接受_null_logger()
    {
        // Arrange & Act
        await using var adapter = new OpcUaAdapter(logger: null);

        // Assert — 不应抛出异常
        adapter.ProtocolType.Should().Be("opcua");
    }
}
