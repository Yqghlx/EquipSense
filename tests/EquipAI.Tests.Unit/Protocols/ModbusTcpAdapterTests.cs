using EquipAI.EdgeGateway.Protocols;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Protocols;

public class ModbusTcpAdapterTests
{
    [Fact]
    public void ProtocolType_应返回_modbus_tcp()
    {
        var adapter = new ModbusTcpAdapter();
        adapter.ProtocolType.Should().Be("modbus-tcp");
    }

    [Fact]
    public void 初始状态_IsConnected_应为_false()
    {
        var adapter = new ModbusTcpAdapter();
        adapter.IsConnected.Should().BeFalse();
    }

    [Fact]
    public async Task 未连接时_ReadAsync_应抛出异常()
    {
        var adapter = new ModbusTcpAdapter();
        var act = () => adapter.ReadAsync(["holding_register:100"], CancellationToken.None);
        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*未连接*");
    }

    [Fact]
    public void ParsePointId_holding_register_应解析正确()
    {
        var (type, address) = ModbusTcpAdapter.ParsePointId("holding_register:100");
        type.Should().Be("holding_register");
        address.Should().Be(100);
    }

    [Fact]
    public void ParsePointId_input_register_应解析正确()
    {
        var (type, address) = ModbusTcpAdapter.ParsePointId("input_register:50");
        type.Should().Be("input_register");
        address.Should().Be(50);
    }

    [Fact]
    public void ParsePointId_coil_应解析正确()
    {
        var (type, address) = ModbusTcpAdapter.ParsePointId("coil:10");
        type.Should().Be("coil");
        address.Should().Be(10);
    }

    [Fact]
    public void ParsePointId_discrete_input_应解析正确()
    {
        var (type, address) = ModbusTcpAdapter.ParsePointId("discrete_input:5");
        type.Should().Be("discrete_input");
        address.Should().Be(5);
    }

    [Fact]
    public void ParsePointId_地址为零应合法()
    {
        var (type, address) = ModbusTcpAdapter.ParsePointId("holding_register:0");
        type.Should().Be("holding_register");
        address.Should().Be(0);
    }

    [Fact]
    public void ParsePointId_无效格式无冒号应抛出异常()
    {
        var act = () => ModbusTcpAdapter.ParsePointId("invalid");
        act.Should().Throw<FormatException>();
    }

    [Fact]
    public void ParsePointId_无效格式冒号后无内容应抛出异常()
    {
        var act = () => ModbusTcpAdapter.ParsePointId("holding_register:");
        act.Should().Throw<FormatException>();
    }

    [Fact]
    public void ParsePointId_负数地址应抛出异常()
    {
        var act = () => ModbusTcpAdapter.ParsePointId("holding_register:-1");
        act.Should().Throw<FormatException>();
    }

    [Fact]
    public void ParsePointId_非数字地址应抛出异常()
    {
        var act = () => ModbusTcpAdapter.ParsePointId("holding_register:abc");
        act.Should().Throw<FormatException>();
    }

    [Fact]
    public async Task DisposeAsync_应可安全重复调用()
    {
        var adapter = new ModbusTcpAdapter();
        await adapter.DisposeAsync();
        await adapter.DisposeAsync();
        // 不应抛出异常
    }

    [Fact]
    public async Task DisposeAsync后_IsConnected应为false()
    {
        var adapter = new ModbusTcpAdapter();
        await adapter.DisposeAsync();
        adapter.IsConnected.Should().BeFalse();
    }

    [Fact]
    public async Task DisposeAsync后_ReadAsync应抛出ObjectDisposedException()
    {
        var adapter = new ModbusTcpAdapter();
        await adapter.DisposeAsync();
        var act = () => adapter.ReadAsync(["holding_register:100"], CancellationToken.None);
        await act.Should().ThrowAsync<ObjectDisposedException>();
    }
}
