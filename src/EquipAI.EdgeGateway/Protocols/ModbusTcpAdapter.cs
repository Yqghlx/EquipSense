using System.Net;
using FluentModbus;
using Microsoft.Extensions.Logging;

namespace EquipAI.EdgeGateway.Protocols;

/// <summary>
/// Modbus TCP 协议适配器。
/// 数据点地址格式：{类型}:{起始地址}，如 holding_register:100、coil:0。
/// 支持四种标准 Modbus 数据类型：holding_register、input_register、coil、discrete_input。
/// </summary>
public class ModbusTcpAdapter : IProtocolAdapter
{
    private readonly ILogger<ModbusTcpAdapter>? _logger;
    private ModbusTcpClient? _client;
    private bool _disposed;

    /// <summary>
    /// 默认 Modbus TCP 端口。
    /// </summary>
    private const int DefaultPort = 502;

    /// <summary>
    /// 默认 Modbus 从站单元标识符（0x00 用于直接 TCP 连接）。
    /// </summary>
    private const int DefaultUnitIdentifier = 0;

    public ModbusTcpAdapter(ILogger<ModbusTcpAdapter>? logger = null)
    {
        _logger = logger;
    }

    /// <inheritdoc />
    public string ProtocolType => "modbus-tcp";

    /// <inheritdoc />
    public bool IsConnected => _client?.IsConnected == true && !_disposed;

    /// <inheritdoc />
    /// <remarks>
    /// 连接字符串格式："IP地址:端口"（如 192.168.1.100:502），端口可省略，默认 502。
    /// 使用 FluentModbus 5.x 的 Connect(string) 方法，其内部自动解析 IP 和端口。
    /// </remarks>
    public Task ConnectAsync(DeviceConfig config, CancellationToken ct)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);

        // FluentModbus 5.x 的 Connect(string) 直接接受 "host:port" 格式
        var endpoint = NormalizeEndpoint(config.ConnectionString);
        _logger?.LogInformation("正在连接 Modbus TCP: {Endpoint}", endpoint);

        _client = new ModbusTcpClient();
        _client.Connect(endpoint);

        _logger?.LogInformation("Modbus TCP 连接成功: {Endpoint}", endpoint);
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    /// <remarks>
    /// 遍历每个点位 ID，按类型分别调用对应的 Modbus 读取函数。
    /// unitIdentifier 固定为 0（直接 TCP 连接场景的默认值）。
    /// </remarks>
    public Task<List<DataPoint>> ReadAsync(string[] pointIds, CancellationToken ct)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);

        if (_client is null || !_client.IsConnected)
            throw new InvalidOperationException("Modbus TCP 未连接，请先调用 ConnectAsync");

        var results = new List<DataPoint>(pointIds.Length);
        var timestamp = DateTime.UtcNow;

        foreach (var pointId in pointIds)
        {
            var (type, address) = ParsePointId(pointId);
            double value = type switch
            {
                // 保持寄存器（功能码 0x03）：读取单个 ushort 并转为 double
                "holding_register" => _client.ReadHoldingRegisters<ushort>(
                    DefaultUnitIdentifier, address, 1)[0],

                // 输入寄存器（功能码 0x04）：读取单个 ushort 并转为 double
                "input_register" => _client.ReadInputRegisters<ushort>(
                    DefaultUnitIdentifier, address, 1)[0],

                // 线圈（功能码 0x01）：ReadCoils 返回 Span<byte>，每个 bit 代表一个线圈
                // 取第一个字节的最低位作为线圈状态
                "coil" => (_client.ReadCoils(DefaultUnitIdentifier, address, 1)[0] & 0x01) != 0
                    ? 1.0 : 0.0,

                // 离散输入（功能码 0x02）：ReadDiscreteInputs 返回 Span<byte>
                "discrete_input" => (_client.ReadDiscreteInputs(DefaultUnitIdentifier, address, 1)[0] & 0x01) != 0
                    ? 1.0 : 0.0,

                _ => throw new FormatException($"不支持的 Modbus 数据类型: {type}")
            };

            results.Add(new DataPoint(pointId, pointId, value, "good", timestamp));
        }

        return Task.FromResult(results);
    }

    /// <summary>
    /// 解析 Modbus 数据点地址标识。
    /// </summary>
    /// <param name="pointId">点位 ID，格式为 "类型:地址"（如 "holding_register:100"）。</param>
    /// <returns>解析后的（类型, 地址）元组。</returns>
    /// <exception cref="FormatException">格式无效或地址不是非负整数。</exception>
    public static (string Type, int Address) ParsePointId(string pointId)
    {
        var separatorIndex = pointId.IndexOf(':');
        if (separatorIndex < 0 || separatorIndex >= pointId.Length - 1)
            throw new FormatException($"Modbus 数据点格式无效: {pointId}，期望格式: type:address");

        var type = pointId[..separatorIndex];
        var addressStr = pointId[(separatorIndex + 1)..];

        if (!int.TryParse(addressStr, out var address) || address < 0)
            throw new FormatException($"Modbus 地址无效: {addressStr}");

        return (type, address);
    }

    /// <inheritdoc />
    public ValueTask DisposeAsync()
    {
        if (_disposed) return ValueTask.CompletedTask;

        _disposed = true;

        if (_client is not null)
        {
            try
            {
                _client.Disconnect();
            }
            catch
            {
                // 断开连接时的异常无需向上传播，资源释放才是关键
            }

            _client.Dispose();
            _client = null;
        }

        GC.SuppressFinalize(this);
        return ValueTask.CompletedTask;
    }

    /// <summary>
    /// 规范化连接字符串，确保包含端口号。
    /// FluentModbus 5.x 的 Connect(string) 接受 "host:port" 格式，默认端口 502。
    /// </summary>
    private static string NormalizeEndpoint(string connectionString)
    {
        // 处理 IPv6 地址（含方括号）：[::1]:502 或 [::1]
        if (connectionString.StartsWith('['))
        {
            var closingBracket = connectionString.IndexOf(']');
            if (closingBracket < 0)
                throw new FormatException($"IPv6 地址格式无效: {connectionString}");

            // 已有端口（如 [::1]:502）
            if (closingBracket + 1 < connectionString.Length
                && connectionString[closingBracket + 1] == ':')
                return connectionString;

            // 无端口，追加默认端口（如 [::1] -> [::1]:502）
            return $"{connectionString}:{DefaultPort}";
        }

        // IPv4 地址：检查是否已包含端口
        var lastColon = connectionString.LastIndexOf(':');
        if (lastColon < 0)
            return $"{connectionString}:{DefaultPort}";

        return connectionString;
    }
}
