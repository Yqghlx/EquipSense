using EquipAI.Simulator;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Simulator;

/// <summary>
/// 验证 Simulator 与 Modbus TCP 适配器之间的单寄存器编码契约。
/// </summary>
public sealed class ModbusRegisterEncodingTests
{
    /// <summary>
    /// 非数字值必须降级为零，避免无效传感器数据转换时抛出异常。
    /// </summary>
    [Fact]
    public void NaN应编码为零()
    {
        ModbusRegisterEncoding.EncodeHoldingRegister(double.NaN)
            .Should().Be(0);
    }

    /// <summary>
    /// 负数不能写入无符号保持寄存器，统一按零处理。
    /// </summary>
    [Fact]
    public void 负数应编码为零()
    {
        ModbusRegisterEncoding.EncodeHoldingRegister(-1.2)
            .Should().Be(0);
    }

    /// <summary>
    /// 普通小数使用远离零的四舍五入，保持设备侧整数寄存器语义稳定。
    /// </summary>
    [Fact]
    public void 普通小数应四舍五入()
    {
        ModbusRegisterEncoding.EncodeHoldingRegister(12.6)
            .Should().Be(13);
    }

    /// <summary>
    /// 超出寄存器范围的数值必须钳制到最大值，避免转换溢出。
    /// </summary>
    [Fact]
    public void 超过最大值应钳制()
    {
        ModbusRegisterEncoding.EncodeHoldingRegister(ushort.MaxValue + 100d)
            .Should().Be(ushort.MaxValue);
    }
}
