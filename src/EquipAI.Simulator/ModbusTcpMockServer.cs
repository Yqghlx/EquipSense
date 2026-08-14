using System.Net;
using FluentModbus;

namespace EquipAI.Simulator;

/// <summary>
/// Modbus TCP Mock Server — 将 SimulatedSensor 值映射到 Holding Registers。
/// 每个传感器占用一个连续寄存器，寄存器地址从 StartAddress 开始依次排列。
/// </summary>
public class ModbusTcpMockServer : IAsyncDisposable
{
    // FluentModbus 5.x 的单元模式使用 0 作为默认单元，需与 ModbusTcpAdapter 保持一致。
    private const byte DefaultUnitIdentifier = 0;
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
        // 协议验收客户端会在连接后立即发起请求，启用异步处理确保每个请求
        // 在 TCP 接收线程中及时响应；同步模式需要额外的 ProcessRequests 调度。
        _server = new ModbusTcpServer(isAsynchronous: true);
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
    /// 每 500ms 更新所有传感器的寄存器值，并刷新用于验收读写链路的线圈。
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
    /// 将当前所有传感器的值写入 Holding Registers，并设置确定性的线圈状态。
    /// 使用底层缓冲区可以避免额外的协议客户端，保持模拟器更新操作简单且可重复。
    /// </summary>
    private void UpdateRegisters()
    {
        var holdingRegisters = _server.GetHoldingRegisterBuffer<ushort>(DefaultUnitIdentifier);
        var coils = _server.GetCoilBuffer<byte>(DefaultUnitIdentifier);

        for (var i = 0; i < _sensors.Count; i++)
        {
            var value = _sensors[i].GetValue(DateTime.UtcNow);
            var baseIndex = _startAddress + i;

            // 检查地址范围，防止越界
            if (baseIndex < holdingRegisters.Length)
            {
                holdingRegisters[baseIndex] = ModbusRegisterEncoding.EncodeHoldingRegister(value);
            }
        }

        if (coils.Length > 0)
        {
            coils[0] = 1;
        }

        if (coils.Length > 1)
        {
            coils[1] = 0;
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
