using System.Net.Http.Json;
using EquipAI.EdgeGateway;
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
    private readonly string _environmentName;
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
    /// <param name="environmentName">宿主环境名称，用于在动态配置变更时复用生产门禁。</param>
    /// <param name="httpClientFactory">HTTP 客户端工厂</param>
    /// <param name="logger">日志记录器</param>
    public ConfigRefreshService(
        DeviceManager deviceManager,
        GatewayOptions options,
        string environmentName,
        IHttpClientFactory httpClientFactory,
        ILogger<ConfigRefreshService> logger)
    {
        _deviceManager = deviceManager;
        _options = options;
        _environmentName = environmentName;
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
                var fetchResult = await FetchConfigAsync(stoppingToken);
                if (!fetchResult.IsAvailable)
                {
                    // 后端暂时不可达时保留现有采集器，避免短暂网络故障造成全量停采。
                    await Task.Delay(RefreshInterval, stoppingToken);
                    continue;
                }

                var devices = fetchResult.Devices;
                // 配置刷新可能在网关启动后首次加入 OPC UA 设备，不能只依赖启动时的设备列表校验。
                // 校验失败时不应用整批配置，保留当前已运行的安全配置并在下一轮重试。
                ValidateRuntimeConfiguration(_environmentName, _options, devices);
                // 空列表是后端明确表示“当前没有设备”，必须应用它以停止已删除的采集器；
                // 与上面的不可达状态分开，避免旧设备永久残留或临时故障导致误停采。
                await _deviceManager.ApplyConfigAsync(devices, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (InvalidOperationException ex)
            {
                // 安全门禁失败时明确记录为 Error，便于告警系统区分“后端暂时不可达”和“配置被拒绝”。
                // 不应用本轮整批配置，避免动态刷新把当前安全状态替换成不合规设备。
                _logger.LogError(ex, "动态设备配置未通过安全门禁，本轮未应用");
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
    private async Task<DeviceConfigurationFetchResult> FetchConfigAsync(CancellationToken ct)
    {
        if (string.IsNullOrEmpty(_options.BackendUrl) || string.IsNullOrEmpty(_options.AuthKey))
            return DeviceConfigurationFetchResult.Unavailable();

        using var httpClient = _httpClientFactory.CreateClient("Backend");
        httpClient.DefaultRequestHeaders.Add("X-Gateway-Auth-Key", _options.AuthKey);
        httpClient.Timeout = TimeSpan.FromSeconds(10);

        var response = await httpClient.GetAsync(
            // 必须携带 tenantId：后端按 (tenantId, gatewayId) 双重限定，缺则 400。
            // GatewayId 仅租户内唯一，不带 tenantId 会跨租户拉到他人设备配置（安全修复）
            $"{_options.BackendUrl.TrimEnd('/')}/api/v1/gateway/config?gatewayId={Uri.EscapeDataString(_options.Id)}&tenantId={Uri.EscapeDataString(_options.TenantId)}",
            ct);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogDebug("后端配置拉取返回 {StatusCode}", response.StatusCode);
            return DeviceConfigurationFetchResult.Unavailable();
        }

        var apiDevices = await response.Content.ReadFromJsonAsync<List<GatewayDevicePullItem>>(ct);
        if (apiDevices is null)
        {
            _logger.LogWarning("后端配置响应为空，保留当前设备配置");
            return DeviceConfigurationFetchResult.Unavailable();
        }

        var devices = apiDevices.Select(d => new Protocols.DeviceConfig(
            d.DeviceId, d.Protocol, d.ConnectionString, d.DataPoints, d.PollIntervalMs)
        {
            DeviceType = d.DeviceType
        }).ToArray();

        return DeviceConfigurationFetchResult.FromBackend(devices);
    }

    /// <summary>
    /// 校验动态设备配置的生产安全门禁。
    /// </summary>
    /// <param name="environmentName">宿主环境名称。</param>
    /// <param name="options">网关配置选项。</param>
    /// <param name="devices">本轮从后端拉取的设备配置。</param>
    /// <exception cref="InvalidOperationException">生产环境动态启用不安全 OPC UA 配置时抛出。</exception>
    internal static void ValidateRuntimeConfiguration(
        string environmentName,
        GatewayOptions options,
        IReadOnlyCollection<Protocols.DeviceConfig> devices)
    {
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(devices);

        GatewayConfigurationValidator.ValidateOpcUaSecurity(
            environmentName,
            options,
            devices
                .Select(device => device.Protocol)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray());
    }
}

/// <summary>
/// 后端设备配置拉取结果。
/// 成功的空列表和网络/响应失败必须有不同状态，否则网关无法安全处理设备删除与临时故障。
/// </summary>
internal readonly record struct DeviceConfigurationFetchResult(
    bool IsAvailable,
    Protocols.DeviceConfig[] Devices)
{
    /// <summary>表示后端明确返回的设备配置，可为空列表。</summary>
    public static DeviceConfigurationFetchResult FromBackend(Protocols.DeviceConfig[] devices)
    {
        ArgumentNullException.ThrowIfNull(devices);
        return new(true, devices);
    }

    /// <summary>表示本轮无法可靠获取后端配置，应保留当前采集状态。</summary>
    public static DeviceConfigurationFetchResult Unavailable()
        => new(false, []);
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
