namespace EquipAI.Simulator;

/// <summary>
/// 提供模拟器写入 Modbus 保持寄存器时的数值编码规则。
/// </summary>
public static class ModbusRegisterEncoding
{
    /// <summary>
    /// 将传感器数值编码为单个无符号保持寄存器。
    /// </summary>
    /// <param name="value">待编码的传感器数值。</param>
    /// <returns>经过清洗、四舍五入和范围钳制后的寄存器值。</returns>
    public static ushort EncodeHoldingRegister(double value)
    {
        if (double.IsNaN(value) || value <= 0)
        {
            return 0;
        }

        if (double.IsPositiveInfinity(value) || value >= ushort.MaxValue)
        {
            return ushort.MaxValue;
        }

        var rounded = Math.Round(value, MidpointRounding.AwayFromZero);
        return rounded >= ushort.MaxValue ? ushort.MaxValue : (ushort)rounded;
    }
}
