using System.Net.Http.Json;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EquipAI.EdgeGateway.Pipeline;

/// <summary>
/// 配置刷新服务，定期从后端 API 拉取最新的设备配置，
/// 通过 DeviceManager 动态增删采集器，无需重启网关。
/// </summary>
public class ConfigRefreshService : BackgroundService
{
    private readonly DeviceManager _deviceManager;
    private readonly GatewayOptions _options;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ConfigRefreshService> _logger;

    /// <summary>
    /// 配置刷新间隔（默认 60 秒）
    /// </summary>
    private static readonly TimeSpan RefreshInterval = TimeSpan.FromMinutes(1);

    /// <summary>
    /// 初始化配置刷新服务
    /// </summary>
    /// <param name="deviceManager">设备管理器</param>
    /// <param name="options">网关配置选项</param>
    /// <param name="httpClientFactory">HTTP 客户端工厂</param>
    /// <param name="logger">日志记录器</param>
    public ConfigRefreshService(
        DeviceManager deviceManager,
        GatewayOptions options,
        IHttpClientFactory httpClientFactory,
        ILogger<ConfigRefreshService> logger)
    {
        _deviceManager = deviceManager;
        _options = options;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    /// <summary>
    /// 后台服务执行入口：定期拉取配置并应用到 DeviceManager
    /// </summary>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // 等待初始启动完成
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

        _logger.LogInformation("配置刷新服务已启动，每 {Interval}s 从后端拉取设备配置",
            RefreshInterval.TotalSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var devices = await FetchConfigAsync(stoppingToken);
                if (devices.Length > 0)
                {
                    await _deviceManager.ApplyConfigAsync(devices);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "配置刷新失败");
            }

            await Task.Delay(RefreshInterval, stoppingToken);
        }
    }

    /// <summary>
    /// 从后端 API 拉取设备配置
    /// </summary>
    /// <param name="ct">取消令牌</param>
    /// <returns>设备配置数组</returns>
    private async Task<Protocols.DeviceConfig[]> FetchConfigAsync(CancellationToken ct)
    {
        if (string.IsNullOrEmpty(_options.BackendUrl) || string.IsNullOrEmpty(_options.AuthKey))
            return [];

        using var httpClient = _httpClientFactory.CreateClient("Backend");
        httpClient.DefaultRequestHeaders.Add("X-Gateway-Auth-Key", _options.AuthKey);
        httpClient.Timeout = TimeSpan.FromSeconds(10);

        var response = await httpClient.GetAsync(
            $"{_options.BackendUrl.TrimEnd('/')}/api/v1/gateway/config?gatewayId={_options.Id}",
            ct);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogDebug("后端配置拉取返回 {StatusCode}", response.StatusCode);
            return [];
        }

        var apiDevices = await response.Content.ReadFromJsonAsync<List<GatewayDevicePullItem>>(ct);
        if (apiDevices is null || apiDevices.Count == 0)
            return [];

        return apiDevices.Select(d => new Protocols.DeviceConfig(
            d.DeviceId, d.Protocol, d.ConnectionString, d.DataPoints, d.PollIntervalMs)
        {
            DeviceType = d.DeviceType
        }).ToArray();
    }
}

/// <summary>
/// 后端 API 返回的网关设备配置项（与 Program.cs 中定义一致，此处独立声明避免耦合）
/// </summary>
file record GatewayDevicePullItem(
    string DeviceId,
    string Protocol,
    string ConnectionString,
    Dictionary<string, string> DataPoints,
    int PollIntervalMs,
    string? DeviceType);
