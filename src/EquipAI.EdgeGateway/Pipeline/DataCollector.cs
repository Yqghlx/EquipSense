using EquipAI.EdgeGateway.Protocols;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EquipAI.EdgeGateway.Pipeline;

/// <summary>
/// 数据采集调度器
/// 按设备配置的 PollIntervalMs 间隔定时采集，标准化后上传。
/// 支持自动重连：连接或采集异常时指数退避重试，不会永久退出。
/// </summary>
public class DataCollector : BackgroundService
{
    private readonly ILogger<DataCollector> _logger;
    private readonly Func<IProtocolAdapter> _adapterFactory;
    private readonly CloudUploader _uploader;
    private readonly DeviceConfig _config;
    private readonly string _deviceType;
    private readonly GatewayMetrics? _metrics;

    /// <summary>
    /// 当前活跃的协议适配器实例
    /// </summary>
    private IProtocolAdapter _adapter;

    /// <summary>
    /// 初始化数据采集调度器
    /// </summary>
    /// <param name="logger">日志记录器</param>
    /// <param name="adapterFactory">协议适配器工厂（每次重连时创建新实例）</param>
    /// <param name="uploader">云端上传器</param>
    /// <param name="config">设备连接配置</param>
    /// <param name="deviceType">设备类型（可选，默认 "Unknown"）</param>
    /// <param name="metrics">可选的指标收集器</param>
    public DataCollector(
        ILogger<DataCollector> logger,
        Func<IProtocolAdapter> adapterFactory,
        CloudUploader uploader,
        DeviceConfig config,
        string deviceType = "Unknown",
        GatewayMetrics? metrics = null)
    {
        _logger = logger;
        _adapterFactory = adapterFactory;
        _adapter = adapterFactory();
        _uploader = uploader;
        _config = config;
        _deviceType = deviceType;
        _metrics = metrics;
    }

    /// <summary>
    /// 后台服务执行入口
    /// </summary>
    protected override Task ExecuteAsync(CancellationToken stoppingToken)
        => RunCollectionLoopAsync(stoppingToken);

    /// <summary>
    /// 公开的采集循环入口，供 DeviceManager 手动启动
    /// </summary>
    public Task StartCollectingAsync(CancellationToken cancellationToken)
        => RunCollectionLoopAsync(cancellationToken);

    /// <summary>
    /// 采集循环核心逻辑：连接 → 采集 → 自动重连
    /// </summary>
    private async Task RunCollectionLoopAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("数据采集器启动: 设备={DeviceId}, 协议={Protocol}, 间隔={Interval}ms",
            _config.DeviceId, _config.Protocol, _config.PollIntervalMs);

        var retryDelay = TimeSpan.FromSeconds(1);
        var maxRetryDelay = TimeSpan.FromMinutes(5);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // 适配器未连接时尝试（重新）连接
                if (!_adapter.IsConnected)
                {
                    await _adapter.ConnectAsync(_config, stoppingToken);
                    _logger.LogInformation("设备 {DeviceId} 连接成功", _config.DeviceId);
                    retryDelay = TimeSpan.FromSeconds(1);
                }

                await CollectOnceAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "设备 {DeviceId} 采集异常，{Delay:F1}s 后重试",
                    _config.DeviceId, retryDelay.TotalSeconds);
                _metrics?.Increment(GatewayMetrics.Names.CollectionErrorsTotal);

                // 适配器处于异常状态，释放并重建
                try { await _adapter.DisposeAsync(); } catch { }
                _adapter = _adapterFactory();

                await Task.Delay(retryDelay, stoppingToken);
                retryDelay = TimeSpan.FromMilliseconds(
                    Math.Min(retryDelay.TotalMilliseconds * 2, maxRetryDelay.TotalMilliseconds));
                continue;
            }

            // 采集成功后重置退避时间
            retryDelay = TimeSpan.FromSeconds(1);
            await Task.Delay(_config.PollIntervalMs, stoppingToken);
        }
    }

    /// <summary>
    /// 执行一次采集 → 标准化 → 带离线保护的上传
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

        // 使用带断网保护的上传：在线时直接发送并回放积压数据，离线时缓冲到本地
        var topic = CloudUploader.BuildMqttTopic(_uploader.TenantId, message.DeviceId);
        var payload = System.Text.Encoding.UTF8.GetBytes(
            CloudUploader.BuildPayload(message, _deviceType));
        await _uploader.UploadWithFallbackAsync(topic, payload, ct);
        _metrics?.Increment(GatewayMetrics.Names.CollectionsTotal);
    }
}
