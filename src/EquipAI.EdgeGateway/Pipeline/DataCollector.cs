using EquipAI.EdgeGateway.Protocols;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EquipAI.EdgeGateway.Pipeline;

/// <summary>
/// 数据采集调度器
/// 按设备配置的 PollIntervalMs 间隔定时采集，标准化后上传
/// </summary>
public class DataCollector : BackgroundService
{
    private readonly ILogger<DataCollector> _logger;
    private readonly IProtocolAdapter _adapter;
    private readonly CloudUploader _uploader;
    private readonly DeviceConfig _config;
    private readonly string _deviceType;

    /// <summary>
    /// 初始化数据采集调度器
    /// </summary>
    /// <param name="logger">日志记录器</param>
    /// <param name="adapter">协议适配器（OPC UA / Modbus 等）</param>
    /// <param name="uploader">云端上传器</param>
    /// <param name="config">设备连接配置</param>
    /// <param name="deviceType">设备类型（可选，默认 "Unknown"）</param>
    public DataCollector(
        ILogger<DataCollector> logger,
        IProtocolAdapter adapter,
        CloudUploader uploader,
        DeviceConfig config,
        string deviceType = "Unknown")
    {
        _logger = logger;
        _adapter = adapter;
        _uploader = uploader;
        _config = config;
        _deviceType = deviceType;
    }

    /// <summary>
    /// 后台服务执行入口：连接设备后循环采集
    /// </summary>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("数据采集器启动: 设备={DeviceId}, 协议={Protocol}, 间隔={Interval}ms",
            _config.DeviceId, _config.Protocol, _config.PollIntervalMs);

        try
        {
            await _adapter.ConnectAsync(_config, stoppingToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "设备 {DeviceId} 连接失败", _config.DeviceId);
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CollectOnceAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "设备 {DeviceId} 采集失败", _config.DeviceId);
            }

            await Task.Delay(_config.PollIntervalMs, stoppingToken);
        }
    }

    /// <summary>
    /// 执行一次采集 → 标准化 → 上传
    /// </summary>
    /// <param name="ct">取消令牌</param>
    public async Task CollectOnceAsync(CancellationToken ct)
    {
        if (!_adapter.IsConnected)
        {
            _logger.LogWarning("设备 {DeviceId} 适配器未连接，跳过采集", _config.DeviceId);
            return;
        }

        var pointIds = _config.DataPoints.Values.ToArray();
        var dataPoints = await _adapter.ReadAsync(pointIds, ct);

        if (dataPoints.Count == 0) return;

        var message = DataNormalizer.Normalize(_config.DeviceId, dataPoints, _config);
        if (message.Metrics.Count == 0) return;

        await _uploader.UploadAsync(message, _deviceType, ct);
    }
}
