using System.Net.Http.Json;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EquipAI.EdgeGateway;

/// <summary>
/// 网关心跳后台服务
///
/// 定期向后端 POST /api/v1/gateways/register 发送心跳，
/// 首次心跳自动注册网关，后续刷新在线状态。
/// </summary>
public class HeartbeatService : BackgroundService
{
    private readonly ILogger<HeartbeatService> _logger;
    private readonly GatewayOptions _options;
    private readonly IHttpClientFactory _httpClientFactory;

    public HeartbeatService(
        ILogger<HeartbeatService> logger,
        GatewayOptions options,
        IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _options = options;
        _httpClientFactory = httpClientFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("网关心跳服务已启动，间隔 {Interval}s，后端: {BackendUrl}",
            _options.HeartbeatIntervalSeconds, _options.BackendUrl);

        // 启动后延迟 5 秒再发首次心跳，等待其他服务就绪
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

        var retryDelay = TimeSpan.FromSeconds(1);
        var success = false;

        while (!stoppingToken.IsCancellationRequested)
        {
            success = false;
            try
            {
                success = await SendHeartbeatAsync(stoppingToken);
                if (success)
                {
                    retryDelay = TimeSpan.FromSeconds(1);
                }
                else
                {
                    retryDelay = TimeSpan.FromMilliseconds(
                        Math.Min(retryDelay.TotalMilliseconds * 2, 30000));
                    _logger.LogWarning("心跳失败，{RetryDelay}s 后重试", retryDelay.TotalSeconds);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "心跳发送异常");
                retryDelay = TimeSpan.FromMilliseconds(
                    Math.Min(retryDelay.TotalMilliseconds * 2, 30000));
            }

            var delay = TimeSpan.FromSeconds(_options.HeartbeatIntervalSeconds);
            await Task.Delay(success ? delay : retryDelay, stoppingToken);
        }
    }

    /** 发送心跳请求 */
    private async Task<bool> SendHeartbeatAsync(CancellationToken ct)
    {
        if (string.IsNullOrEmpty(_options.AuthKey))
        {
            _logger.LogDebug("AuthKey 未配置，跳过心跳");
            return false;
        }

        var client = _httpClientFactory.CreateClient("Backend");
        client.DefaultRequestHeaders.Clear();
        client.DefaultRequestHeaders.Add("X-Gateway-Auth-Key", _options.AuthKey);

        var payload = new
        {
            GatewayId = _options.Id,
            TenantId = string.IsNullOrEmpty(_options.TenantId)
                ? Guid.Empty
                : Guid.Parse(_options.TenantId),
            Name = _options.Id,
            Host = _options.Host,
            HealthPort = _options.HealthPort,
            Version = _options.Version,
        };

        var response = await client.PostAsJsonAsync(
            $"{_options.BackendUrl}/api/v1/gateways/register",
            payload,
            cancellationToken: ct);

        if (response.IsSuccessStatusCode)
        {
            _logger.LogDebug("心跳成功：{GatewayId}", _options.Id);
            return true;
        }

        var body = await response.Content.ReadAsStringAsync(ct);
        _logger.LogWarning("心跳失败：HTTP {Status} - {Body}", (int)response.StatusCode, body);
        return false;
    }
}
