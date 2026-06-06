using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EquipAI.EdgeGateway;

/// <summary>
/// 轻量级 HTTP 健康检查和 Prometheus 指标端点
/// 使用 HttpListener 监听，不依赖 ASP.NET Core
/// </summary>
public class HealthEndpoints : BackgroundService
{
    private readonly ILogger<HealthEndpoints> _logger;
    private readonly GatewayOptions _options;
    private readonly Pipeline.GatewayMetrics _metrics;
    private readonly int _port;

    /// <summary>
    /// 初始化健康检查端点服务
    /// </summary>
    /// <param name="logger">日志记录器</param>
    /// <param name="options">网关配置选项</param>
    /// <param name="metrics">指标收集器</param>
    /// <param name="port">监听端口（默认 8081）</param>
    public HealthEndpoints(
        ILogger<HealthEndpoints> logger,
        GatewayOptions options,
        Pipeline.GatewayMetrics metrics,
        int port = 8081)
    {
        _logger = logger;
        _options = options;
        _metrics = metrics;
        _port = port;
    }

    /// <summary>
    /// 后台服务执行入口：启动 HttpListener 处理请求
    /// </summary>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var prefix = $"http://+:{_port}/";
        var listener = new HttpListener();
        listener.Prefixes.Add(prefix);

        try
        {
            listener.Start();
            _logger.LogInformation("健康检查端点已启动: http://*:{Port}/", _port);
        }
        catch (HttpListenerException ex)
        {
            _logger.LogError(ex, "健康检查端点启动失败（端口 {Port}），跳过", _port);
            return;
        }

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var context = await listener.GetContextAsync();
                _ = Task.Run(() => HandleRequestAsync(context, stoppingToken), stoppingToken);
            }
        }
        catch (HttpListenerException) when (stoppingToken.IsCancellationRequested)
        {
            // 正常关闭
        }
        finally
        {
            listener.Stop();
            listener.Close();
        }
    }

    /// <summary>
    /// 处理 HTTP 请求
    /// </summary>
    private async Task HandleRequestAsync(HttpListenerContext context, CancellationToken ct)
    {
        var path = context.Request.Url?.AbsolutePath ?? "/";
        var response = context.Response;

        try
        {
            switch (path)
            {
                case "/health":
                    await WriteHealthAsync(response, ct);
                    break;
                case "/status":
                    await WriteStatusAsync(response, ct);
                    break;
                case "/metrics":
                    await WriteMetricsAsync(response, ct);
                    break;
                default:
                    response.StatusCode = 404;
                    response.Close();
                    break;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "处理健康检查请求失败: {Path}", path);
            try { response.StatusCode = 500; response.Close(); } catch { }
        }
    }

    /// <summary>
    /// 写入健康检查 JSON 响应
    /// </summary>
    private async Task WriteHealthAsync(HttpListenerResponse response, CancellationToken ct)
    {
        var uptime = DateTime.UtcNow - _metrics.StartTime;
        var health = new
        {
            status = "healthy",
            gatewayId = _options.Id,
            tenantId = _options.TenantId,
            uptime = uptime.ToString(@"dd\.hh\:mm\:ss"),
            uptimeSeconds = (int)uptime.TotalSeconds
        };

        var json = JsonSerializer.Serialize(health);
        response.StatusCode = 200;
        response.ContentType = "application/json";
        var buffer = System.Text.Encoding.UTF8.GetBytes(json);
        response.ContentLength64 = buffer.Length;
        await response.OutputStream.WriteAsync(buffer, ct);
        response.Close();
    }

    /// <summary>
    /// 写入网关详细状态 JSON 响应（供后端代理调用）
    /// </summary>
    private async Task WriteStatusAsync(HttpListenerResponse response, CancellationToken ct)
    {
        var uptime = DateTime.UtcNow - _metrics.StartTime;
        var status = new
        {
            status = "healthy",
            gatewayId = _options.Id,
            tenantId = _options.TenantId,
            backendUrl = _options.BackendUrl,
            mqttBroker = _options.MqttBroker,
            securityMode = _options.OpcUaSecurityMode,
            uptime = uptime.ToString(@"dd\.hh\:mm\:ss"),
            uptimeSeconds = (int)uptime.TotalSeconds,
            startedAt = _metrics.StartTime,
            metrics = new
            {
                collections = _metrics.GetCounter(Pipeline.GatewayMetrics.Names.CollectionsTotal),
                errors = _metrics.GetCounter(Pipeline.GatewayMetrics.Names.CollectionErrorsTotal),
                uploads = _metrics.GetCounter(Pipeline.GatewayMetrics.Names.UploadSuccessTotal),
                uploadFailures = _metrics.GetCounter(Pipeline.GatewayMetrics.Names.UploadFailTotal),
                replays = _metrics.GetCounter(Pipeline.GatewayMetrics.Names.ReplayMessagesTotal),
                bufferQueueDepth = _metrics.GetGauge(Pipeline.GatewayMetrics.Names.BufferQueueDepth),
            }
        };

        var json = JsonSerializer.Serialize(status);
        response.StatusCode = 200;
        response.ContentType = "application/json";
        var buffer = System.Text.Encoding.UTF8.GetBytes(json);
        response.ContentLength64 = buffer.Length;
        await response.OutputStream.WriteAsync(buffer, ct);
        response.Close();
    }

    /// <summary>
    /// 写入 Prometheus 文本格式指标
    /// </summary>
    private async Task WriteMetricsAsync(HttpListenerResponse response, CancellationToken ct)
    {
        var text = _metrics.ToPrometheusText();
        response.StatusCode = 200;
        response.ContentType = "text/plain; version=0.0.4; charset=utf-8";
        var buffer = System.Text.Encoding.UTF8.GetBytes(text);
        response.ContentLength64 = buffer.Length;
        await response.OutputStream.WriteAsync(buffer, ct);
        response.Close();
    }
}
