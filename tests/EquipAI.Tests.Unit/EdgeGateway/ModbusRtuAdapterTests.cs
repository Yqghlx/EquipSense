using EquipAI.EdgeGateway.Protocols;
using FluentAssertions;

namespace EquipAI.Tests.Unit.EdgeGateway;

public class ModbusRtuAdapterTests
{
    [Fact]
    public void ProtocolType_返回modbus_rtu()
    {
        var adapter = new ModbusRtuAdapter();
        adapter.ProtocolType.Should().Be("modbus-rtu");
    }

    [Fact]
    public void IsConnected_未连接时返回false()
    {
        var adapter = new ModbusRtuAdapter();
        adapter.IsConnected.Should().BeFalse();
    }

    [Fact]
    public async Task DisposeAsync_重复调用不抛异常()
    {
        var adapter = new ModbusRtuAdapter();
        await adapter.DisposeAsync();
        await adapter.DisposeAsync();
        adapter.IsConnected.Should().BeFalse();
    }

    [Fact]
    public async Task ReadAsync_未连接时抛出异常()
    {
        var adapter = new ModbusRtuAdapter();
        var act = async () => await adapter.ReadAsync(["holding_register:100"], CancellationToken.None);
        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*未连接*");
    }

    [Theory]
    [InlineData("holding_register:100", "holding_register", 100)]
    [InlineData("input_register:200", "input_register", 200)]
    [InlineData("coil:0", "coil", 0)]
    [InlineData("discrete_input:15", "discrete_input", 15)]
    public void ParsePointId_复用TcpAdapter解析逻辑(string pointId, string expectedType, int expectedAddress)
    {
        var (type, address) = ModbusTcpAdapter.ParsePointId(pointId);
        type.Should().Be(expectedType);
        address.Should().Be(expectedAddress);
    }
}
