using System.Net;
using FluentModbus;

namespace EquipAI.Simulator;

/// <summary>
/// Modbus TCP Mock Server — 将 SimulatedSensor 值映射到 Holding Registers
/// 每个传感器占用 2 个连续寄存器（float 拆分为两个 ushort）
/// 寄存器地址从 StartAddress 开始，按传感器列表顺序依次排列
/// </summary>
public class ModbusTcpMockServer : IAsyncDisposable
{
    private readonly ModbusTcpServer _server;
    private readonly List<SimulatedSensor> _sensors;
    private readonly ushort _startAddress;
    private readonly CancellationTokenSource _cts = new();
    private Task? _updateTask;

    /// <summary>
    /// Modbus TCP 监听端口
    /// </summary>
    public int Port { get; }

    /// <summary>
    /// 创建 Modbus TCP Mock Server 实例
    /// </summary>
    /// <param name="port">TCP 监听端口</param>
    /// <param name="sensors">模拟传感器列表</param>
    /// <param name="startAddress">Holding Registers 起始地址（默认 100）</param>
    public ModbusTcpMockServer(int port, IEnumerable<SimulatedSensor> sensors, ushort startAddress = 100)
    {
        Port = port;
        _startAddress = startAddress;
        _sensors = sensors.ToList();
        _server = new ModbusTcpServer();
    }

    /// <summary>
    /// 启动 Modbus TCP Server 并开始定时更新寄存器值
    /// </summary>
    public void Start()
    {
        _server.Start(new IPEndPoint(IPAddress.Any, Port));
        _updateTask = Task.Run(UpdateLoopAsync);
    }

    /// <summary>
    /// 每 500ms 更新所有传感器的寄存器值
    /// 每个 float 值拆分为 2 个 ushort 寄存器（小端序），从 StartAddress 开始依次写入
    /// </summary>
    private async Task UpdateLoopAsync()
    {
        while (!_cts.IsCancellationRequested)
        {
            try
            {
                UpdateRegisters();
            }
            catch (ObjectDisposedException)
            {
                // 服务器已停止，正常退出
                break;
            }

            try
            {
                await Task.Delay(500, _cts.Token);
            }
            catch (OperationCanceledException)
            {
                // 取消令牌触发，正常退出
                break;
            }
        }
    }

    /// <summary>
    /// 将当前所有传感器的值写入 Holding Registers
    /// 使用 GetHoldingRegisterBuffer&lt;ushort&gt; 获取底层寄存器 span 直接写入
    /// </summary>
    private void UpdateRegisters()
    {
        // 获取底层 ushort 类型的寄存器缓冲区
        var holdingRegisters = _server.GetHoldingRegisterBuffer<ushort>();

        for (var i = 0; i < _sensors.Count; i++)
        {
            var value = (float)_sensors[i].GetValue(DateTime.UtcNow);
            var bytes = BitConverter.GetBytes(value);

            // float 是 4 字节，拆分为 2 个 ushort（小端序）
            if (!BitConverter.IsLittleEndian)
                Array.Reverse(bytes);

            var low = BitConverter.ToUInt16(bytes, 0);
            var high = BitConverter.ToUInt16(bytes, 2);

            // 每个传感器占 2 个寄存器，从 _startAddress 开始
            var baseIndex = _startAddress + i * 2;

            // 检查地址范围，防止越界
            if (baseIndex + 1 < holdingRegisters.Length)
            {
                holdingRegisters[baseIndex] = low;
                holdingRegisters[baseIndex + 1] = high;
            }
        }
    }

    /// <summary>
    /// 异步释放资源：停止更新任务、关闭 Modbus 服务器、释放取消令牌
    /// </summary>
    public async ValueTask DisposeAsync()
    {
        await _cts.CancelAsync();

        if (_updateTask is not null)
        {
            try
            {
                await _updateTask;
            }
            catch (OperationCanceledException)
            {
                // 任务被取消是预期行为
            }
            catch (Exception)
            {
                // 忽略其他异常，确保资源释放
            }
        }

        _server.Stop();
        _cts.Dispose();
    }
}
