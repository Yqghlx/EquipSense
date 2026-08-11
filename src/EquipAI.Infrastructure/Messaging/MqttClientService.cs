using EquipAI.Infrastructure.Metrics;
using EquipAI.Core.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MQTTnet;
using MQTTnet.Client;
using System.Security.Authentication;

namespace EquipAI.Infrastructure.Messaging;

public class MqttOptions
{
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 1883;
    public string ClientIdPrefix { get; set; } = "equipai-backend";
    public string TopicPattern { get; set; } = "factory/+/telemetry/+";
    public int ReconnectDelaySeconds { get; set; } = 30;

    /// <summary>MQTT 认证用户名（可选，Mosquitto 未开启认证时可为空）</summary>
    public string? Username { get; set; }

    /// <summary>MQTT 认证密码（可选）</summary>
    public string? Password { get; set; }

    /// <summary>是否通过 TLS 连接 MQTT Broker。</summary>
    public bool UseTls { get; set; }

    /// <summary>
    /// 是否允许不受信任的服务端证书。
    /// 仅用于开发环境临时连接自签名证书，生产环境必须为 false。
    /// </summary>
    public bool AllowUntrustedCertificates { get; set; }

    /// <summary>可选的自定义 CA 证书路径，未配置时使用系统信任链。</summary>
    public string? CaCertificatePath { get; set; }
}

/// <summary>
/// MQTT 客户端封装，管理连接、订阅和消息接收
/// </summary>
public class MqttClientService
{
    private readonly MqttOptions _options;
    private readonly ILogger<MqttClientService> _logger;
    private readonly Func<IMqttClient> _clientFactory;
    private IMqttClient? _client;
    private MqttClientOptions? _clientOptions;

    /// <summary>
    /// 停机保护标志：为 1 时 HandleDisconnectedAsync 不再尝试重连。
    /// 由 GracefulShutdown 钩子在断开前设置，避免 SIGTERM 后触发无意义的重连尝试。
    /// </summary>
    private int _isStopping;

    /// <summary>
    /// 重连循环保护标志：同一时刻只允许一个断线事件操作 MQTT 客户端。
    /// MQTTnet 可能在网络抖动期间连续触发多个断线回调；并发 ConnectAsync 会造成重复订阅，
    /// 甚至让后一个回调覆盖前一个连接状态，形成“连接看似成功但消息接收不稳定”的竞态。
    /// </summary>
    private int _isReconnecting;

    /// <summary>
    /// MQTT 业务连接状态：只有连接和订阅都成功后才置为 1。
    /// 不能直接读取 IMqttClient.IsConnected，因为连接成功但订阅失败时后端仍然收不到遥测。
    /// </summary>
    private int _mqttConnected;

    /// <summary>
    /// 重连退避的取消源。
    /// MQTT 断线回调不接收宿主停机令牌，必须由 DisconnectAsync 或宿主令牌回调主动取消，
    /// 否则退避上限 5 分钟会阻塞应用优雅停机。
    /// </summary>
    private readonly CancellationTokenSource _reconnectCancellation = new();

    private CancellationTokenRegistration _hostCancellationRegistration;

    public event Func<string, string, byte[], Task>? OnMessageReceived;

    /// <summary>
    /// 当前 MQTT 会话是否已连接并完成遥测主题订阅。
    /// </summary>
    public bool IsConnected => Volatile.Read(ref _mqttConnected) == 1;

    public MqttClientService(IOptions<MqttOptions> options, ILogger<MqttClientService> logger)
        : this(options, logger, () => new MqttFactory().CreateMqttClient())
    {
    }

    /// <summary>
    /// 初始化 MQTT 客户端服务。
    /// </summary>
    /// <param name="options">MQTT 连接配置</param>
    /// <param name="logger">日志记录器</param>
    /// <param name="clientFactory">MQTT 客户端工厂；生产环境使用 MQTTnet，测试可注入替身</param>
    internal MqttClientService(
        IOptions<MqttOptions> options,
        ILogger<MqttClientService> logger,
        Func<IMqttClient> clientFactory)
    {
        _options = options.Value;
        _logger = logger;
        _clientFactory = clientFactory ?? throw new ArgumentNullException(nameof(clientFactory));

        // 检测是否使用了默认连接参数（可能配置节缺失），记录警告便于排查
        if (_options.Host == "localhost" && _options.Port == 1883)
        {
            _logger.LogWarning("MQTT 使用默认连接参数（localhost:1883），请确认配置节 Mqtt 是否已正确设置");
        }
    }

    public async Task ConnectAsync(CancellationToken cancellationToken = default)
    {
        // 保存宿主生命周期：初始连接成功后，断线回调仍需感知宿主取消。
        if (cancellationToken.CanBeCanceled)
        {
            _hostCancellationRegistration.Dispose();
            _hostCancellationRegistration = cancellationToken.Register(
                static state => ((MqttClientService)state!).StopReconnect(),
                this);
        }

        Volatile.Write(ref _mqttConnected, 0);
        _client = _clientFactory();

        _clientOptions = BuildClientOptions();

        _client.DisconnectedAsync += HandleDisconnectedAsync;
        _client.ApplicationMessageReceivedAsync += HandleMessageAsync;

        await _client.ConnectAsync(_clientOptions, cancellationToken);
        await SubscribeAsync(_client, cancellationToken);

        Volatile.Write(ref _mqttConnected, 1);
        BusinessMetrics.MqttConnected.Set(1);
        _logger.LogInformation("MQTT 已连接到 {Host}:{Port}", _options.Host, _options.Port);
    }

    /// <summary>
    /// 为当前连接订阅遥测主题。
    /// 每次重新建立 MQTT 会话都必须重新订阅；本客户端使用 CleanStart，Broker 不会保留订阅关系。
    /// </summary>
    /// <param name="client">已连接的 MQTT 客户端</param>
    /// <param name="cancellationToken">取消令牌</param>
    private async Task SubscribeAsync(IMqttClient client, CancellationToken cancellationToken)
    {
        var subscribeOptions = new MqttClientSubscribeOptionsBuilder()
            .WithTopicFilter(filter => filter.WithTopic(_options.TopicPattern))
            .Build();

        await client.SubscribeAsync(subscribeOptions, cancellationToken);
        _logger.LogInformation("MQTT 已订阅主题: {Topic}", _options.TopicPattern);
    }

    /// <summary>
    /// 构建 MQTT 客户端连接选项。
    /// </summary>
    private MqttClientOptions BuildClientOptions()
    {
        // 构建 MQTT 客户端选项，包含认证（如果配置了用户名密码）。
        var builder = new MqttClientOptionsBuilder()
            .WithTcpServer(_options.Host, _options.Port)
            .WithClientId($"{_options.ClientIdPrefix}-{Environment.MachineName}-{Guid.NewGuid():N}")
            .WithCleanStart(true);

        if (_options.UseTls)
        {
            builder.WithTlsOptions(tlsOptions =>
            {
                tlsOptions
                    .UseTls()
                    .WithSslProtocols(SslProtocols.Tls12 | SslProtocols.Tls13)
                    .WithAllowUntrustedCertificates(_options.AllowUntrustedCertificates)
                    .WithIgnoreCertificateChainErrors(_options.AllowUntrustedCertificates)
                    .WithIgnoreCertificateRevocationErrors(_options.AllowUntrustedCertificates);

                if (!string.IsNullOrWhiteSpace(_options.CaCertificatePath))
                {
                    tlsOptions.WithCertificateValidationHandler(context =>
                        MqttServerCertificateValidator.Validate(
                            context.Certificate,
                            context.SslPolicyErrors,
                            _options.CaCertificatePath));
                }
            });
        }

        // 如果配置了认证凭证，则添加用户名密码
        if (!string.IsNullOrEmpty(_options.Username))
        {
            builder.WithCredentials(_options.Username, _options.Password ?? string.Empty);
            _logger.LogInformation("MQTT 使用认证连接: 用户名={Username}", _options.Username);
        }
        else
        {
            _logger.LogWarning("MQTT 未配置认证凭证，使用匿名连接");
        }

        return builder.Build();
    }

    /// <summary>
    /// 测试辅助入口：返回实际使用的 MQTTnet 连接选项，不建立网络连接。
    /// </summary>
    internal MqttClientOptions BuildClientOptionsForTest() => BuildClientOptions();

    public async Task DisconnectAsync(CancellationToken cancellationToken = default)
    {
        // 停机保护：先置标志位，防止 Disconnect 事件回调触发重连
        StopReconnect();
        Volatile.Write(ref _mqttConnected, 0);
        BusinessMetrics.MqttConnected.Set(0);

        if (_client?.IsConnected == true)
        {
            await _client.DisconnectAsync(cancellationToken: cancellationToken);
            _logger.LogInformation("MQTT 已断开连接（优雅停机）");
        }
    }

    /// <summary>
    /// 设置停机标志并取消当前重连退避。
    /// </summary>
    private void StopReconnect()
    {
        Volatile.Write(ref _isStopping, 1);
        _reconnectCancellation.Cancel();
    }

    private async Task HandleMessageAsync(MqttApplicationMessageReceivedEventArgs e)
    {
        if (OnMessageReceived != null)
        {
            await OnMessageReceived(
                e.ApplicationMessage.Topic,
                string.Empty,
                ExtractPayload(e.ApplicationMessage));
        }
    }

    /// <summary>
    /// 提取 MQTT 消息的实际负载。
    /// MQTTnet 可能返回指向池化底层数组的 ArraySegment，必须同时尊重 Offset 和 Count，
    /// 否则尾部无关字节会污染 JSON 解析并让合法遥测被静默丢弃。
    /// </summary>
    /// <param name="message">MQTT 应用消息</param>
    /// <returns>仅包含实际消息范围的新字节数组</returns>
    internal static byte[] ExtractPayload(MqttApplicationMessage message)
    {
        ArgumentNullException.ThrowIfNull(message);

        var segment = message.PayloadSegment;
        if (segment.Array is null || segment.Count == 0)
        {
            return [];
        }

        return segment.Array.AsSpan(segment.Offset, segment.Count).ToArray();
    }

    /// <summary>
    /// 处理 MQTT 断线并循环重连。
    /// </summary>
    internal async Task HandleDisconnectedAsync(MqttClientDisconnectedEventArgs e)
    {
        Volatile.Write(ref _mqttConnected, 0);
        BusinessMetrics.MqttConnected.Set(0);

        // 停机保护：应用正在关闭时不再尝试重连
        if (Volatile.Read(ref _isStopping) != 0)
        {
            _logger.LogInformation("MQTT 连接断开（停机中），跳过重连");
            return;
        }

        // 非阻塞获取：已有重连循环时直接返回，避免多个回调并发操作同一个 MQTT 客户端。
        if (Interlocked.Exchange(ref _isReconnecting, 1) != 0)
        {
            _logger.LogDebug("MQTT 已有重连循环在执行，忽略重复断线事件");
            return;
        }

        try
        {
            if (e?.ClientWasConnected == true)
            {
                _logger.LogWarning("MQTT 连接断开，开始尝试重连（指数退避，上限 5 分钟）");
            }
            else
            {
                _logger.LogWarning("MQTT 首次连接失败，开始尝试重连（指数退避，上限 5 分钟）");
            }

            // 关键修复：原实现只重连一次，broker 重启超过 30 秒+1 次连接超时即永久失联。
            // 改为循环重试 + 指数退避（30s → 60s → 120s → 240s → 300s 封顶），
            // 直到成功或应用停机。MQTTnet 3.x 推荐在 Disconnected 事件中循环重连。
            var attempt = 0;
            while (Volatile.Read(ref _isStopping) == 0)
            {
                attempt++;
                // 指数退避：base * 2^(attempt-1)，封顶 5 分钟
                var delaySeconds = Math.Min(
                    _options.ReconnectDelaySeconds * Math.Pow(2, attempt - 1),
                    300);
                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(delaySeconds), _reconnectCancellation.Token);
                }
                catch (OperationCanceledException) when (_reconnectCancellation.IsCancellationRequested)
                {
                    return;
                }

                // Delay 期间可能已收到停机信号，再次检查
                if (Volatile.Read(ref _isStopping) != 0) return;

                try
                {
                    if (_client != null && _clientOptions != null)
                    {
                        // 重连前确保旧连接已清理（MQTTnet 在某些异常状态下 IsConnected 可能不准）
                        if (_client.IsConnected)
                        {
                            try { await _client.DisconnectAsync(); } catch { /* 忽略清理失败 */ }
                        }

                        await _client.ConnectAsync(_clientOptions, _reconnectCancellation.Token);
                        // CleanStart=true 时重连会创建新会话；只恢复 TCP 连接而不恢复订阅会让
                        // 服务进入“连接正常但遥测永远收不到”的静默故障状态。
                        await SubscribeAsync(_client, _reconnectCancellation.Token);
                        Volatile.Write(ref _mqttConnected, 1);
                        BusinessMetrics.MqttConnected.Set(1);
                        _logger.LogInformation("MQTT 第 {Attempt} 次重连成功", attempt);
                        return;  // 成功则退出循环
                    }
                }
                catch (OperationCanceledException) when (_reconnectCancellation.IsCancellationRequested)
                {
                    return;
                }
                catch (Exception ex)
                {
                    BusinessMetrics.MqttConnected.Set(0);
                    _logger.LogError(ex, "MQTT 第 {Attempt} 次重连失败，{Delay}s 后重试", attempt, (int)delaySeconds);
                    // 继续循环，直到成功或停机
                }
            }
        }
        finally
        {
            Volatile.Write(ref _isReconnecting, 0);
        }
    }
}
