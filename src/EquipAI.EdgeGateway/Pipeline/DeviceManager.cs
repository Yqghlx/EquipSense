using System.Collections.Concurrent;
using EquipAI.EdgeGateway.Protocols;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.EdgeGateway.Pipeline;

/// <summary>
/// 运行时设备管理器，负责管理活跃的数据采集器实例。
/// 支持动态增删采集器：接收新配置后对比差异，停用已移除的采集器，启动新增的采集器。
/// </summary>
public class DeviceManager : IAsyncDisposable
{
    private readonly ConcurrentDictionary<string, RunningDevice> _devices = new();
    private readonly IServiceProvider _serviceProvider;
    private readonly Func<IServiceProvider, string, IProtocolAdapter> _adapterFactory;
    private readonly ILogger<DeviceManager> _logger;
    private readonly SemaphoreSlim _configurationGate = new(1, 1);
    private int _disposed;

    /// <summary>
    /// 当前管理的设备数量
    /// </summary>
    public int DeviceCount => _devices.Count;

    /// <summary>
    /// 初始化设备管理器
    /// </summary>
    /// <param name="serviceProvider">DI 服务提供者</param>
    /// <param name="adapterFactory">协议适配器工厂</param>
    /// <param name="logger">日志记录器</param>
    public DeviceManager(
        IServiceProvider serviceProvider,
        Func<IServiceProvider, string, IProtocolAdapter> adapterFactory,
        ILogger<DeviceManager> logger)
    {
        _serviceProvider = serviceProvider;
        _adapterFactory = adapterFactory;
        _logger = logger;
    }

    /// <summary>
    /// 应用新的设备配置集合：停用已移除的、启动新增的、重启变更的
    /// </summary>
    /// <param name="desired">期望的设备配置列表</param>
    /// <param name="ct">等待配置锁时使用的取消令牌</param>
    public async Task ApplyConfigAsync(DeviceConfig[] desired, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(desired);
        ObjectDisposedException.ThrowIf(Volatile.Read(ref _disposed) != 0, this);

        // 配置刷新可能与初始配置应用、下一轮定时刷新重叠；串行化整批变更，
        // 确保同一个采集器不会被两个调用方同时停止、替换或从字典移除。
        await _configurationGate.WaitAsync(ct);
        try
        {
            ObjectDisposedException.ThrowIf(Volatile.Read(ref _disposed) != 0, this);

            var desiredMap = desired.ToDictionary(d => d.DeviceId);
            var currentIds = _devices.Keys.ToHashSet();

            // 停用已移除的设备
            foreach (var id in currentIds.Except(desiredMap.Keys))
            {
                if (_devices.TryRemove(id, out var running))
                {
                    await running.StopAsync();
                    _logger.LogInformation("已停止设备采集器: {DeviceId}", id);
                }
            }

            // 启动新增或重启变更的设备
            foreach (var (deviceId, config) in desiredMap)
            {
                if (_devices.TryGetValue(deviceId, out var existing))
                {
                    // 配置未变更则跳过
                    if (ConfigEquals(existing.Config, config))
                        continue;

                    // 配置变更：停旧启新
                    await existing.StopAsync();
                    _devices.TryRemove(deviceId, out _);
                    _logger.LogInformation("设备 {DeviceId} 配置变更，重启采集器", deviceId);
                }

                // 启动新采集器
                var collector = CreateCollector(config);
                var cts = new CancellationTokenSource();
                var task = collector.StartCollectingAsync(cts.Token);
                var runningDevice = new RunningDevice(config, collector, cts, task);

                _devices[deviceId] = runningDevice;
                _logger.LogInformation("已启动设备采集器: {DeviceId}, 协议={Protocol}", deviceId, config.Protocol);
            }
        }
        finally
        {
            _configurationGate.Release();
        }
    }

    /// <summary>
    /// 停止所有活跃的采集器
    /// </summary>
    public async ValueTask DisposeAsync()
    {
        if (Interlocked.Exchange(ref _disposed, 1) != 0)
            return;

        await _configurationGate.WaitAsync();
        try
        {
            foreach (var id in _devices.Keys)
            {
                if (_devices.TryRemove(id, out var running))
                {
                    await running.StopAsync();
                }
            }
        }
        finally
        {
            _configurationGate.Release();
        }

        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// 创建一个新的 DataCollector 实例
    /// </summary>
    private DataCollector CreateCollector(DeviceConfig config)
    {
        return new DataCollector(
            _serviceProvider.GetRequiredService<ILogger<DataCollector>>(),
            () => _adapterFactory(_serviceProvider, config.Protocol),
            _serviceProvider.GetRequiredService<CloudUploader>(),
            config,
            config.DeviceType ?? "Unknown",
            _serviceProvider.GetRequiredService<GatewayMetrics>());
    }

    /// <summary>
    /// 比较两个设备配置是否相同（用于判断是否需要重启采集器）
    /// </summary>
    private static bool ConfigEquals(DeviceConfig a, DeviceConfig b)
    {
        return a.DeviceId == b.DeviceId
               && a.Protocol == b.Protocol
               && a.ConnectionString == b.ConnectionString
               && a.PollIntervalMs == b.PollIntervalMs
               && a.DeviceType == b.DeviceType
               && DataPointsEqual(a.DataPoints, b.DataPoints);
    }

    /// <summary>
    /// 比较两个数据点字典是否相同
    /// </summary>
    private static bool DataPointsEqual(Dictionary<string, string> a, Dictionary<string, string> b)
    {
        if (a.Count != b.Count) return false;
        foreach (var kvp in a)
        {
            if (!b.TryGetValue(kvp.Key, out var value) || value != kvp.Value)
                return false;
        }
        return true;
    }

    /// <summary>
    /// 运行中的设备采集器及其取消令牌
    /// </summary>
    private sealed class RunningDevice(DeviceConfig config, DataCollector collector, CancellationTokenSource cts, Task task)
    {
        public DeviceConfig Config { get; } = config;
        public DataCollector Collector { get; } = collector;
        public CancellationTokenSource Cts { get; } = cts;
        public Task RunningTask { get; } = task;

        private int _stopped;

        /// <summary>
        /// 停止采集器并释放资源
        /// </summary>
        public async Task StopAsync()
        {
            if (Interlocked.Exchange(ref _stopped, 1) != 0)
                return;

            Cts.Cancel();
            try
            {
                await RunningTask;
            }
            catch (OperationCanceledException)
            {
                // 取消是配置变更和正常停机的预期结束路径。
            }
            finally
            {
                await Collector.DisposeAsync();
                Cts.Dispose();
            }
        }
    }
}
