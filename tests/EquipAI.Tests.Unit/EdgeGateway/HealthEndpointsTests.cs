using System.Net;
using System.Net.Http.Json;
using System.Net.Sockets;
using EquipAI.EdgeGateway;
using EquipAI.EdgeGateway.Pipeline;
using EquipAI.EdgeGateway.Protocols;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace EquipAI.Tests.Unit.EdgeGateway;

/// <summary>
/// 边缘网关 HTTP 端点安全测试。
/// </summary>
public sealed class HealthEndpointsTests
{
    [Fact]
    public async Task 未携带网关密钥访问连接测试端点应返回401()
    {
        var port = GetFreePort();
        var options = new GatewayOptions { AuthKey = "gateway-secret" };
        using var serviceProvider = new ServiceCollection().BuildServiceProvider();
        var endpoints = new HealthEndpoints(
            NullLogger<HealthEndpoints>.Instance,
            options,
            new GatewayMetrics(),
            (_, protocol) => throw new ArgumentException($"不支持的协议: {protocol}"),
            serviceProvider,
            port);
        using var requestCancellation = new CancellationTokenSource();
        using var client = new HttpClient { Timeout = TimeSpan.FromMilliseconds(250) };

        await endpoints.StartAsync(requestCancellation.Token);
        try
        {
            using var response = await SendWithRetryAsync(
                client,
                $"http://127.0.0.1:{port}/test-connection",
                new { protocol = "invalid", connectionString = "{}" });

            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }
        finally
        {
            requestCancellation.Cancel();
            try
            {
                // 即使测试断言失败，也主动尝试唤醒或确认监听器已关闭，
                // 防止失败测试遗留后台监听器影响后续测试。
                await client.GetAsync($"http://127.0.0.1:{port}/health");
            }
            catch (HttpRequestException)
            {
                // 修复后监听器会在取消时立即关闭，唤醒请求失败属于预期。
            }

            var stopTask = endpoints.StopAsync(CancellationToken.None);
            var completed = await Task.WhenAny(stopTask, Task.Delay(TimeSpan.FromSeconds(1)));
            completed.Should().Be(stopTask, "停止健康端点不应阻塞宿主优雅退出");
            await stopTask;
        }
    }

    [Fact]
    public async Task 携带有效网关密钥访问连接测试端点应进入业务校验()
    {
        var port = GetFreePort();
        const string authKey = "gateway-secret";
        var options = new GatewayOptions { AuthKey = authKey };
        using var serviceProvider = new ServiceCollection().BuildServiceProvider();
        var endpoints = new HealthEndpoints(
            NullLogger<HealthEndpoints>.Instance,
            options,
            new GatewayMetrics(),
            (_, protocol) => throw new ArgumentException($"不支持的协议: {protocol}"),
            serviceProvider,
            port);
        using var requestCancellation = new CancellationTokenSource();
        using var client = new HttpClient { Timeout = TimeSpan.FromMilliseconds(250) };
        client.DefaultRequestHeaders.Add("X-Gateway-Auth-Key", authKey);

        await endpoints.StartAsync(requestCancellation.Token);
        try
        {
            using var response = await SendWithRetryAsync(
                client,
                $"http://127.0.0.1:{port}/test-connection",
                new { protocol = "invalid", connectionString = "{}" });

            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }
        finally
        {
            requestCancellation.Cancel();
            await endpoints.StopAsync(CancellationToken.None);
        }
    }

    [Fact]
    public async Task 取消服务时应自动释放HTTP监听器()
    {
        var port = GetFreePort();
        var options = new GatewayOptions { AuthKey = "gateway-secret" };
        using var serviceProvider = new ServiceCollection().BuildServiceProvider();
        var endpoints = new HealthEndpoints(
            NullLogger<HealthEndpoints>.Instance,
            options,
            new GatewayMetrics(),
            (_, protocol) => throw new ArgumentException($"不支持的协议: {protocol}"),
            serviceProvider,
            port);
        using var requestCancellation = new CancellationTokenSource();
        Task? stopTask = null;

        await endpoints.StartAsync(requestCancellation.Token);
        try
        {
            using var client = new HttpClient { Timeout = TimeSpan.FromMilliseconds(250) };
            using var healthResponse = await GetWithRetryAsync(
                client,
                $"http://127.0.0.1:{port}/health");
            healthResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            requestCancellation.Cancel();
            stopTask = endpoints.StopAsync(CancellationToken.None);
            var completed = await Task.WhenAny(stopTask, Task.Delay(TimeSpan.FromSeconds(1)));

            completed.Should().Be(stopTask, "取消服务后应立即关闭 HttpListener，避免阻塞优雅停机");
            await stopTask;
        }
        finally
        {
            if (stopTask is not null && !stopTask.IsCompleted)
            {
                using var wakeClient = new HttpClient { Timeout = TimeSpan.FromSeconds(1) };
                try
                {
                    await wakeClient.GetAsync($"http://127.0.0.1:{port}/health");
                }
                catch (HttpRequestException)
                {
                    // 修复后监听器已关闭时，请求失败属于预期。
                }

                await stopTask;
            }
        }
    }

    [Fact]
    public async Task 连接测试超过并发上限应快速返回503()
    {
        var port = GetFreePort();
        var adapter = new BlockingProtocolAdapter(maxExpectedConnections: 1);
        var options = new GatewayOptions { AuthKey = "gateway-secret" };
        using var serviceProvider = new ServiceCollection().BuildServiceProvider();
        var endpoints = new HealthEndpoints(
            NullLogger<HealthEndpoints>.Instance,
            options,
            new GatewayMetrics(),
            (_, _) => adapter,
            serviceProvider,
            port,
            maxConcurrentConnectionTests: 1);
        using var requestCancellation = new CancellationTokenSource();
        using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };
        client.DefaultRequestHeaders.Add("X-Gateway-Auth-Key", options.AuthKey);
        var requests = new List<Task<HttpResponseMessage>>();

        await endpoints.StartAsync(requestCancellation.Token);
        try
        {
            using var healthResponse = await GetWithRetryAsync(
                client,
                $"http://127.0.0.1:{port}/health");
            healthResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            requests.Add(client.PostAsJsonAsync(
                $"http://127.0.0.1:{port}/test-connection",
                new { protocol = "modbus-tcp", connectionString = "127.0.0.1:502" }));

            await adapter.WaitForAllConnectionsStartedAsync();

            var rejectedRequest = client.PostAsJsonAsync(
                $"http://127.0.0.1:{port}/test-connection",
                new { protocol = "modbus-tcp", connectionString = "127.0.0.1:502" });
            var completed = await Task.WhenAny(rejectedRequest, Task.Delay(TimeSpan.FromMilliseconds(500)));
            completed.Should().Be(rejectedRequest, "超过并发上限的请求不能等待协议连接超时");

            using var rejectedResponse = await rejectedRequest;
            rejectedResponse.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);

            adapter.ReleaseConnections();
            var responses = await Task.WhenAll(requests);
            responses.Should().OnlyContain(response => response.StatusCode == HttpStatusCode.OK);
            foreach (var response in responses)
                response.Dispose();
        }
        finally
        {
            adapter.ReleaseConnections();
            requestCancellation.Cancel();
            await endpoints.StopAsync(CancellationToken.None);
        }
    }

    [Fact]
    public async Task 连接测试请求体超过64KiB应返回413()
    {
        var port = GetFreePort();
        var options = new GatewayOptions { AuthKey = "gateway-secret" };
        using var serviceProvider = new ServiceCollection().BuildServiceProvider();
        var endpoints = new HealthEndpoints(
            NullLogger<HealthEndpoints>.Instance,
            options,
            new GatewayMetrics(),
            (_, _) => throw new InvalidOperationException("不应进入协议适配器"),
            serviceProvider,
            port);
        using var requestCancellation = new CancellationTokenSource();
        using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };
        client.DefaultRequestHeaders.Add("X-Gateway-Auth-Key", options.AuthKey);

        await endpoints.StartAsync(requestCancellation.Token);
        try
        {
            using var response = await SendWithRetryAsync(
                client,
                $"http://127.0.0.1:{port}/test-connection",
                new
                {
                    protocol = "modbus-tcp",
                    connectionString = new string('x', 65 * 1024),
                });

            response.StatusCode.Should().Be(HttpStatusCode.RequestEntityTooLarge);
        }
        finally
        {
            requestCancellation.Cancel();
            await endpoints.StopAsync(CancellationToken.None);
        }
    }

    [Fact]
    public async Task 停机时应等待已接受的连接测试完成()
    {
        var port = GetFreePort();
        var adapter = new BlockingProtocolAdapter(maxExpectedConnections: 1);
        var options = new GatewayOptions { AuthKey = "gateway-secret" };
        using var serviceProvider = new ServiceCollection().BuildServiceProvider();
        var endpoints = new HealthEndpoints(
            NullLogger<HealthEndpoints>.Instance,
            options,
            new GatewayMetrics(),
            (_, _) => adapter,
            serviceProvider,
            port);
        using var requestCancellation = new CancellationTokenSource();
        using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };
        client.DefaultRequestHeaders.Add("X-Gateway-Auth-Key", options.AuthKey);

        await endpoints.StartAsync(requestCancellation.Token);
        try
        {
            using var healthResponse = await GetWithRetryAsync(
                client,
                $"http://127.0.0.1:{port}/health");
            healthResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var requestTask = client.PostAsJsonAsync(
                $"http://127.0.0.1:{port}/test-connection",
                new { protocol = "modbus-tcp", connectionString = "127.0.0.1:502" });
            await adapter.WaitForAllConnectionsStartedAsync();

            requestCancellation.Cancel();
            var stopTask = endpoints.StopAsync(CancellationToken.None);
            var earlyCompletion = await Task.WhenAny(stopTask, Task.Delay(100));
            earlyCompletion.Should().NotBe(stopTask, "停机不能绕过仍在执行的协议连接测试");

            adapter.ReleaseConnections();
            await stopTask;
            using var response = await requestTask;
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }
        finally
        {
            adapter.ReleaseConnections();
            requestCancellation.Cancel();
            await endpoints.StopAsync(CancellationToken.None);
        }
    }

    [Fact]
    public async Task 停机取消连接测试时不应记录请求处理失败日志()
    {
        var port = GetFreePort();
        var adapter = new CancellationAwareProtocolAdapter();
        var logger = new CapturingLogger<HealthEndpoints>();
        var options = new GatewayOptions { AuthKey = "gateway-secret" };
        using var serviceProvider = new ServiceCollection().BuildServiceProvider();
        var endpoints = new HealthEndpoints(
            logger,
            options,
            new GatewayMetrics(),
            (_, _) => adapter,
            serviceProvider,
            port);
        using var requestCancellation = new CancellationTokenSource();
        using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };
        client.DefaultRequestHeaders.Add("X-Gateway-Auth-Key", options.AuthKey);

        await endpoints.StartAsync(requestCancellation.Token);
        try
        {
            using var healthResponse = await GetWithRetryAsync(
                client,
                $"http://127.0.0.1:{port}/health");
            healthResponse.StatusCode.Should().Be(HttpStatusCode.OK);

            var requestTask = client.PostAsJsonAsync(
                $"http://127.0.0.1:{port}/test-connection",
                new { protocol = "modbus-tcp", connectionString = "127.0.0.1:502" });
            await adapter.WaitForConnectionStartedAsync();

            requestCancellation.Cancel();
            await endpoints.StopAsync(CancellationToken.None);

            try
            {
                using var response = await requestTask;
            }
            catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException)
            {
                // 监听器在停机时关闭，客户端收到连接中断属于预期结果。
            }

            logger.Messages.Should().NotContain(
                message => message.Contains("处理健康检查请求失败", StringComparison.Ordinal),
                "宿主取消不是健康端点请求故障，不应在停机期间记录误导性错误");
        }
        finally
        {
            requestCancellation.Cancel();
            await endpoints.StopAsync(CancellationToken.None);
        }
    }

    private static async Task<HttpResponseMessage> GetWithRetryAsync(
        HttpClient client,
        string requestUri)
    {
        Exception? lastError = null;
        for (var attempt = 0; attempt < 20; attempt++)
        {
            try
            {
                return await client.GetAsync(requestUri);
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
            {
                lastError = ex;
                await Task.Delay(25);
            }
        }

        throw new InvalidOperationException("健康端点在限定时间内未启动", lastError);
    }

    private static async Task<HttpResponseMessage> SendWithRetryAsync(
        HttpClient client,
        string requestUri,
        object payload)
    {
        Exception? lastError = null;
        for (var attempt = 0; attempt < 20; attempt++)
        {
            try
            {
                return await client.PostAsJsonAsync(requestUri, payload);
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
            {
                lastError = ex;
                await Task.Delay(25);
            }
        }

        throw new InvalidOperationException("健康端点在限定时间内未启动", lastError);
    }

    private static int GetFreePort()
    {
        using var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        return ((IPEndPoint)listener.LocalEndpoint).Port;
    }

    /// <summary>
    /// 模拟协议驱动在收到宿主取消后退出连接测试。
    /// </summary>
    private sealed class CancellationAwareProtocolAdapter : IProtocolAdapter
    {
        private readonly TaskCompletionSource<bool> _started =
            new(TaskCreationOptions.RunContinuationsAsynchronously);

        public string ProtocolType => "modbus-tcp";

        public bool IsConnected => false;

        public Task ConnectAsync(DeviceConfig config, CancellationToken ct)
        {
            _started.TrySetResult(true);
            return Task.Delay(Timeout.InfiniteTimeSpan, ct);
        }

        public Task<List<DataPoint>> ReadAsync(string[] pointIds, CancellationToken ct)
            => Task.FromResult(new List<DataPoint>());

        public ValueTask DisposeAsync() => ValueTask.CompletedTask;

        public Task WaitForConnectionStartedAsync()
            => _started.Task.WaitAsync(TimeSpan.FromSeconds(2));
    }

    /// <summary>
    /// 记录健康端点日志，验证宿主取消不会走普通错误分支。
    /// </summary>
    private sealed class CapturingLogger<T> : ILogger<T>
    {
        public List<string> Messages { get; } = [];

        public IDisposable? BeginScope<TState>(TState state)
            where TState : notnull
            => NullLogger.Instance.BeginScope(state);

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            Messages.Add(formatter(state, exception));
        }
    }

    private sealed class BlockingProtocolAdapter : IProtocolAdapter
    {
        private readonly int _maxExpectedConnections;
        private readonly TaskCompletionSource<bool> _allConnectionsStarted =
            new(TaskCreationOptions.RunContinuationsAsynchronously);
        private readonly TaskCompletionSource<bool> _release =
            new(TaskCreationOptions.RunContinuationsAsynchronously);
        private int _startedConnections;

        public BlockingProtocolAdapter(int maxExpectedConnections)
        {
            _maxExpectedConnections = maxExpectedConnections;
        }

        public string ProtocolType => "modbus-tcp";

        public bool IsConnected => true;

        public Task ConnectAsync(DeviceConfig config, CancellationToken ct)
        {
            if (Interlocked.Increment(ref _startedConnections) >= _maxExpectedConnections)
                _allConnectionsStarted.TrySetResult(true);

            // 故意忽略取消令牌，模拟第三方驱动未正确响应停机信号，
            // 用来验证 HealthEndpoints 自身确实等待已接受的请求。
            return _release.Task;
        }

        public Task<List<DataPoint>> ReadAsync(string[] pointIds, CancellationToken ct)
            => Task.FromResult(new List<DataPoint>());

        public ValueTask DisposeAsync() => ValueTask.CompletedTask;

        public Task WaitForAllConnectionsStartedAsync()
            => _allConnectionsStarted.Task.WaitAsync(TimeSpan.FromSeconds(2));

        public void ReleaseConnections() => _release.TrySetResult(true);
    }
}
