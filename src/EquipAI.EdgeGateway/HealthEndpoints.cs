using System.Diagnostics;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using EquipAI.EdgeGateway.Protocols;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EquipAI.EdgeGateway;

/// <summary>
/// 轻量级 HTTP 健康检查和 Prometheus 指标端点。
/// 使用 HttpListener 监听，不依赖 ASP.NET Core。
/// 额外提供 /test-connection 端点用于代理真实协议连接测试。
/// </summary>
public class HealthEndpoints : BackgroundService
{
    private const int DefaultMaxConcurrentConnectionTests = 16;
    private const int DefaultMaxRequestBodyBytes = 64 * 1024;
    private static readonly TimeSpan InFlightRequestShutdownTimeout = TimeSpan.FromSeconds(10);

    private readonly ILogger<HealthEndpoints> _logger;
    private readonly GatewayOptions _options;
    private readonly Pipeline.GatewayMetrics _metrics;
    private readonly Func<IServiceProvider, string, IProtocolAdapter> _adapterFactory;
    private readonly IServiceProvider _serviceProvider;
    private readonly int _port;
    private readonly SemaphoreSlim _connectionTestGate;
    private readonly int _maxRequestBodyBytes;
    private readonly object _inFlightRequestsLock = new();
    private readonly HashSet<Task> _inFlightRequests = [];

    /// <summary>
    /// 初始化健康检查端点服务
    /// </summary>
    /// <param name="logger">日志记录器</param>
    /// <param name="options">网关配置选项</param>
    /// <param name="metrics">指标收集器</param>
    /// <param name="adapterFactory">协议适配器工厂</param>
    /// <param name="serviceProvider">DI 服务提供者（用于创建适配器）</param>
    /// <param name="port">监听端口（默认 8081）</param>
    /// <param name="maxConcurrentConnectionTests">同时执行的协议连接测试上限。</param>
    /// <param name="maxRequestBodyBytes">连接测试请求体大小上限。</param>
    public HealthEndpoints(
        ILogger<HealthEndpoints> logger,
        GatewayOptions options,
        Pipeline.GatewayMetrics metrics,
        Func<IServiceProvider, string, IProtocolAdapter> adapterFactory,
        IServiceProvider serviceProvider,
        int port = 8081,
        int maxConcurrentConnectionTests = DefaultMaxConcurrentConnectionTests,
        int maxRequestBodyBytes = DefaultMaxRequestBodyBytes)
    {
        if (maxConcurrentConnectionTests < 1)
            throw new ArgumentOutOfRangeException(nameof(maxConcurrentConnectionTests));
        if (maxRequestBodyBytes < 1024)
            throw new ArgumentOutOfRangeException(nameof(maxRequestBodyBytes));

        _logger = logger;
        _options = options;
        _metrics = metrics;
        _adapterFactory = adapterFactory;
        _serviceProvider = serviceProvider;
        _port = port;
        _connectionTestGate = new SemaphoreSlim(maxConcurrentConnectionTests, maxConcurrentConnectionTests);
        _maxRequestBodyBytes = maxRequestBodyBytes;
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
                // HttpListener 原生等待不感知宿主取消令牌；用 WaitAsync 让优雅停机能够进入 finally，
                // 由 finally 统一 Stop/Close 监听器，避免后台服务永久卡在 GetContextAsync。
                var context = await listener.GetContextAsync().WaitAsync(stoppingToken);
                // 不使用未跟踪的 Task.Run：已接受请求必须进入集合，停机时等待其完成，
                // 否则宿主可能已经释放依赖而连接测试仍在后台访问适配器。
                TrackRequest(HandleRequestAsync(context, stoppingToken));
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // 正常关闭
        }
        catch (HttpListenerException) when (stoppingToken.IsCancellationRequested)
        {
            // 正常关闭
        }
        finally
        {
            listener.Stop();
            listener.Close();
            await WaitForInFlightRequestsAsync();
            // 不在这里 Dispose 闸门：超时后仍可能有第三方适配器晚些返回并释放信号量，
            // 提前释放会把一次可控的停机超时变成后台 ObjectDisposedException。
        }
    }

    /// <summary>
    /// 记录已接受的请求，并在完成后及时移除，避免长时间运行的网关累积任务对象。
    /// </summary>
    private void TrackRequest(Task requestTask)
    {
        lock (_inFlightRequestsLock)
        {
            _inFlightRequests.Add(requestTask);
        }

        _ = requestTask.ContinueWith(
            completedTask =>
            {
                // 读取 Exception，避免极端情况下未观察到的任务异常触发进程级告警。
                _ = completedTask.Exception;
                lock (_inFlightRequestsLock)
                {
                    _inFlightRequests.Remove(completedTask);
                }
            },
            CancellationToken.None,
            TaskContinuationOptions.ExecuteSynchronously,
            TaskScheduler.Default);
    }

    /// <summary>
    /// 监听器关闭后等待已接受的请求，最多等待固定时间，避免不遵守取消令牌的第三方适配器阻塞整个进程退出。
    /// </summary>
    private async Task WaitForInFlightRequestsAsync()
    {
        Task[] pendingTasks;
        lock (_inFlightRequestsLock)
        {
            pendingTasks = _inFlightRequests.ToArray();
        }

        if (pendingTasks.Length == 0)
            return;

        try
        {
            await Task.WhenAll(pendingTasks).WaitAsync(InFlightRequestShutdownTimeout);
        }
        catch (TimeoutException)
        {
            _logger.LogError(
                "健康端点仍有 {Count} 个请求在停机超时后未完成，已停止继续等待",
                pendingTasks.Length);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "等待健康端点请求完成时发生异常");
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
            if (RequiresAuthentication(path) && !IsAuthorized(context.Request))
            {
                await WriteJsonAsync(
                    context,
                    new { success = false, message = "网关认证失败" },
                    401,
                    ct);
                return;
            }

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
                case "/test-connection":
                    await HandleTestConnectionWithLimitAsync(context, ct);
                    break;
                default:
                    response.StatusCode = 404;
                    response.Close();
                    break;
            }
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // 宿主停机取消不是健康端点故障，监听器关闭后无需再写入 500 响应或记录错误日志。
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "处理健康检查请求失败: {Path}", path);
            try { response.StatusCode = 500; response.Close(); } catch { }
        }
    }

    /// <summary>
    /// 限制真实协议连接测试的并发量。健康探针和指标端点不共享该闸门，
    /// 保证设备连接异常或慢响应时运维仍能观察网关状态。
    /// </summary>
    private async Task HandleTestConnectionWithLimitAsync(HttpListenerContext context, CancellationToken ct)
    {
        if (!_connectionTestGate.Wait(0))
        {
            await WriteJsonAsync(
                context,
                new { success = false, message = "连接测试并发已满，请稍后重试" },
                503,
                CancellationToken.None);
            return;
        }

        try
        {
            await HandleTestConnectionAsync(context, ct);
        }
        finally
        {
            _connectionTestGate.Release();
        }
    }

    /// <summary>
    /// 判断端点是否需要网关间认证。存活探针和 Prometheus 指标必须保持匿名，
    /// 状态详情和真实连接测试则可能泄露拓扑或触发主动网络连接，必须受保护。
    /// </summary>
    private static bool RequiresAuthentication(string path)
        => path is "/status" or "/test-connection";

    /// <summary>
    /// 使用固定时间比较校验后端/运维请求携带的网关认证密钥。
    /// </summary>
    private bool IsAuthorized(HttpListenerRequest request)
    {
        if (string.IsNullOrEmpty(_options.AuthKey))
            return false;

        var providedKey = request.Headers["X-Gateway-Auth-Key"];
        if (string.IsNullOrEmpty(providedKey))
            return false;

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(_options.AuthKey),
            Encoding.UTF8.GetBytes(providedKey));
    }

    /// <summary>
    /// 处理真实协议连接测试请求
    /// 请求体 JSON 格式：{ "protocol": "opcua|modbus-tcp|modbus-rtu", "connectionString": "..." }
    /// </summary>
    private async Task HandleTestConnectionAsync(HttpListenerContext context, CancellationToken ct)
    {
        if (context.Request.HttpMethod != "POST")
        {
            context.Response.StatusCode = 405;
            context.Response.Close();
            return;
        }

        if (context.Request.ContentLength64 > _maxRequestBodyBytes)
        {
            await WriteJsonAsync(
                context,
                new { success = false, message = "请求体过大" },
                413,
                ct);
            return;
        }

        string protocol;
        string connectionString;
        try
        {
            var body = await ReadRequestBodyAsync(context.Request.InputStream, _maxRequestBodyBytes, ct);
            if (body is null)
            {
                await WriteJsonAsync(
                    context,
                    new { success = false, message = "请求体过大" },
                    413,
                    ct);
                return;
            }

            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.ValueKind != JsonValueKind.Object
                || !doc.RootElement.TryGetProperty("protocol", out var protocolProperty)
                || protocolProperty.ValueKind != JsonValueKind.String
                || !doc.RootElement.TryGetProperty("connectionString", out var connectionProperty)
                || connectionProperty.ValueKind != JsonValueKind.String)
            {
                throw new JsonException("缺少 protocol 或 connectionString 字段");
            }

            protocol = protocolProperty.GetString()?.Trim().ToLowerInvariant() ?? string.Empty;
            connectionString = connectionProperty.GetString()?.Trim() ?? string.Empty;
            if (string.IsNullOrEmpty(protocol) || string.IsNullOrEmpty(connectionString))
                throw new JsonException("protocol 和 connectionString 不能为空");
        }
        catch (JsonException)
        {
            await WriteJsonAsync(context, new { success = false, message = "请求格式无效" }, 400, ct);
            return;
        }

        var supportedProtocols = new[] { "opcua", "modbus-tcp", "modbus-rtu" };
        if (!supportedProtocols.Contains(protocol, StringComparer.Ordinal))
        {
            await WriteJsonAsync(context, new { success = false, message = $"不支持的协议: {protocol}" }, 400, ct);
            return;
        }

        // 创建临时适配器进行真实连接测试
        IProtocolAdapter? adapter = null;
        try
        {
            adapter = _adapterFactory(_serviceProvider, protocol);
            var config = new DeviceConfig("test-device", protocol, connectionString, new Dictionary<string, string>());

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(10));

            var sw = Stopwatch.StartNew();
            await adapter.ConnectAsync(config, cts.Token);
            sw.Stop();

            await WriteJsonAsync(context, new
            {
                success = true,
                message = $"连接测试成功（{protocol}），耗时 {sw.ElapsedMilliseconds}ms",
                latencyMs = sw.ElapsedMilliseconds
            }, 200, ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // 宿主停机取消必须继续向上传播，避免被转换成普通的“连接失败”业务响应。
            throw;
        }
        catch (Exception ex)
        {
            var shortMessage = ex.InnerException?.Message ?? ex.Message;
            await WriteJsonAsync(context, new
            {
                success = false,
                message = $"连接失败: {shortMessage}"
            }, 200, ct);
        }
        finally
        {
            if (adapter is not null)
            {
                try { await adapter.DisposeAsync(); } catch { }
            }
        }
    }

    /// <summary>
    /// 读取分块请求体并在达到上限后立即停止，防止 chunked 请求绕过 Content-Length 检查占满内存。
    /// </summary>
    private static async Task<string?> ReadRequestBodyAsync(
        Stream input,
        int maxBytes,
        CancellationToken ct)
    {
        await using var body = new MemoryStream(Math.Min(maxBytes, 16 * 1024));
        var buffer = new byte[4096];
        var totalBytes = 0;

        while (true)
        {
            var read = await input.ReadAsync(buffer.AsMemory(), ct);
            if (read == 0)
                break;

            totalBytes += read;
            if (totalBytes > maxBytes)
                return null;

            await body.WriteAsync(buffer.AsMemory(0, read), ct);
        }

        return Encoding.UTF8.GetString(body.GetBuffer(), 0, (int)body.Length);
    }

    /// <summary>
    /// 写入 JSON 响应
    /// </summary>
    private static async Task WriteJsonAsync(HttpListenerContext context, object data, int statusCode, CancellationToken ct)
    {
        var json = JsonSerializer.Serialize(data);
        var buffer = System.Text.Encoding.UTF8.GetBytes(json);
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";
        context.Response.ContentLength64 = buffer.Length;
        await context.Response.OutputStream.WriteAsync(buffer, ct);
        context.Response.Close();
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
