using System.IO.Ports;
using FluentModbus;
using Microsoft.Extensions.Logging;

namespace EquipAI.EdgeGateway.Protocols;

/// <summary>
/// Modbus RTU 协议适配器 — 通过 RS485 串口读取设备数据。
/// 连接字符串格式："端口:波特率:数据位:校验(N/E/O):停止位(1/2):从站地址"
/// 数据点地址格式与 ModbusTcpAdapter 相同："类型:地址"
/// </summary>
public class ModbusRtuAdapter : IProtocolAdapter
{
    private readonly ILogger<ModbusRtuAdapter>? _logger;
    private ModbusRtuClient? _client;
    private byte _slaveAddress;
    private bool _disposed;

    public ModbusRtuAdapter(ILogger<ModbusRtuAdapter>? logger = null)
    {
        _logger = logger;
    }

    /// <inheritdoc />
    public string ProtocolType => "modbus-rtu";

    /// <inheritdoc />
    public bool IsConnected => _client is not null && _client.IsConnected && !_disposed;

    /// <inheritdoc />
    public Task ConnectAsync(DeviceConfig config, CancellationToken ct)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);

        // 解析连接字符串：端口:波特率:数据位:校验:停止位:从站地址
        var parts = config.ConnectionString.Split(':');
        var portName = parts[0];
        var baudRate = parts.Length >= 2 ? int.Parse(parts[1]) : 9600;
        var parity = parts.Length >= 4 ? ParseParity(parts[3]) : Parity.None;
        var stopBits = parts.Length >= 5 ? ParseStopBits(parts[4]) : StopBits.One;
        _slaveAddress = parts.Length >= 6 ? byte.Parse(parts[5]) : (byte)1;

        _logger?.LogInformation("正在连接 Modbus RTU: {Port}, 波特率: {BaudRate}, 从站地址: {SlaveAddress}",
            portName, baudRate, _slaveAddress);

        _client = new ModbusRtuClient
        {
            BaudRate = baudRate,
            Parity = parity,
            StopBits = stopBits,
            ReadTimeout = 5000,
            WriteTimeout = 5000
        };
        _client.Connect(portName);

        _logger?.LogInformation("Modbus RTU 连接成功: {Port}", portName);
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<List<DataPoint>> ReadAsync(string[] pointIds, CancellationToken ct)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);

        if (_client is null)
            throw new InvalidOperationException("Modbus RTU 未连接，请先调用 ConnectAsync");

        var results = new List<DataPoint>(pointIds.Length);
        var timestamp = DateTime.UtcNow;

        foreach (var pointId in pointIds)
        {
            var (type, address) = ModbusTcpAdapter.ParsePointId(pointId);
            double value = type switch
            {
                "holding_register" => _client.ReadHoldingRegisters<ushort>(_slaveAddress, address, 1)[0],
                "input_register" => _client.ReadInputRegisters<ushort>(_slaveAddress, address, 1)[0],
                "coil" => (_client.ReadCoils(_slaveAddress, address, 1)[0] & 0x01) != 0 ? 1.0 : 0.0,
                "discrete_input" => (_client.ReadDiscreteInputs(_slaveAddress, address, 1)[0] & 0x01) != 0 ? 1.0 : 0.0,
                _ => throw new FormatException($"不支持的 Modbus 数据类型: {type}")
            };
            results.Add(new DataPoint(pointId, pointId, value, "good", timestamp));
        }

        return Task.FromResult(results);
    }

    /// <inheritdoc />
    public ValueTask DisposeAsync()
    {
        if (_disposed) return ValueTask.CompletedTask;

        _disposed = true;

        if (_client is not null)
        {
            try { _client.Close(); }
            catch { /* 关闭时忽略异常 */ }
            _client = null;
        }

        GC.SuppressFinalize(this);
        return ValueTask.CompletedTask;
    }

    private static Parity ParseParity(string code) => code.ToUpperInvariant() switch
    {
        "N" => Parity.None,
        "E" => Parity.Even,
        "O" => Parity.Odd,
        _ => throw new FormatException($"不支持的校验位: {code}，可选值: N(无), E(偶), O(奇)")
    };

    private static StopBits ParseStopBits(string code) => code switch
    {
        "1" => StopBits.One,
        "2" => StopBits.Two,
        _ => throw new FormatException($"不支持的停止位: {code}，可选值: 1, 2")
    };
}
