using Microsoft.Extensions.Logging;
using Opc.Ua;
using Opc.Ua.Client;

namespace EquipAI.EdgeGateway.Protocols;

/// <summary>
/// OPC UA 协议适配器 — 通过 OPC Foundation SDK (1.5.x) 连接 OPC UA 服务器并读取点位数据。
/// <para>生命周期：ConnectAsync → ReadAsync(可多次) → DisposeAsync</para>
/// </summary>
public class OpcUaAdapter : IProtocolAdapter
{
    private readonly ILogger<OpcUaAdapter>? _logger;
    private readonly DefaultSessionFactory _sessionFactory;
    private ISession? _session;
    private bool _disposed;

    /// <summary>
    /// 创建 OPC UA 适配器实例。
    /// </summary>
    /// <param name="logger">可选的日志记录器。</param>
    public OpcUaAdapter(ILogger<OpcUaAdapter>? logger = null)
    {
        _logger = logger;
#pragma warning disable CS0618 // DefaultSessionFactory 无参构造函数已过时，SDK 1.5.x 推荐传 ITelemetryContext
        _sessionFactory = new DefaultSessionFactory();
#pragma warning restore CS0618
    }

    /// <inheritdoc />
    public string ProtocolType => "opcua";

    /// <inheritdoc />
    /// <remarks>
    /// 检查 Session 是否已创建且连接状态为 true，且未被释放。
    /// </remarks>
    public bool IsConnected => _session?.Connected == true && !_disposed;

    /// <inheritdoc />
    /// <remarks>
    /// 连接流程：创建 ApplicationConfiguration → 发现端点 → ISessionFactory.CreateAsync 建立会话。
    /// 连接失败时会清理已分配的 Session 资源。
    /// </remarks>
    public async Task ConnectAsync(DeviceConfig config, CancellationToken ct)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);

        _logger?.LogInformation("正在连接 OPC UA 服务器: {Endpoint}", config.ConnectionString);

        try
        {
            // 1. 创建应用配置（边缘网关作为 OPC UA 客户端）
            var appConfig = await CreateApplicationConfigurationAsync();

            // 2. 发现服务器端点（使用不安全连接以简化开发阶段，生产环境应启用安全）
            //    使用推荐签名: SelectEndpointAsync(ApplicationConfiguration, string, bool, ITelemetryContext?, CancellationToken)
            var endpointDescription = await CoreClientUtils.SelectEndpointAsync(
                appConfig, config.ConnectionString, false, null!, ct);
            var endpointConfig = EndpointConfiguration.Create();
            var configuredEndpoint = new ConfiguredEndpoint(null!, endpointDescription, endpointConfig);

            // 3. 使用 ISessionFactory 创建并打开会话（推荐方式，替代已过时的 Session.Create）
            _session = await _sessionFactory.CreateAsync(
                configuration: appConfig,
                endpoint: configuredEndpoint,
                updateBeforeConnect: true,
                sessionName: $"EdgeGateway-{config.DeviceId}",
                sessionTimeout: 30000,
                identity: null,
                preferredLocales: null,
                ct);

            _logger?.LogInformation("OPC UA 连接成功: {Endpoint}", config.ConnectionString);
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "OPC UA 连接失败: {Endpoint}", config.ConnectionString);
            // 连接失败时清理可能已分配的会话资源
            if (_session is not null)
            {
                try { _session.Dispose(); } catch { /* 忽略清理异常 */ }
                _session = null;
            }
            throw;
        }
    }

    /// <inheritdoc />
    /// <remarks>
    /// 通过 SessionClient.ReadAsync（基类方法）批量读取节点值。
    /// 支持 double/float/int/long/bool 等类型的自动转换。
    /// </remarks>
    public async Task<List<DataPoint>> ReadAsync(string[] pointIds, CancellationToken ct)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);

        if (_session is null || !_session.Connected)
        {
            throw new InvalidOperationException("OPC UA 未连接，请先调用 ConnectAsync");
        }

        // 构建读取请求：每个点位对应一个 ReadValueId
        var nodesToRead = new ReadValueIdCollection(
            pointIds.Select(id => new ReadValueId
            {
                NodeId = new NodeId(id),
                AttributeId = Attributes.Value
            }));

        // 调用 OPC UA Read 服务
        var response = await _session.ReadAsync(
            requestHeader: null,
            maxAge: 0,
            timestampsToReturn: TimestampsToReturn.Both,
            nodesToRead: nodesToRead,
            ct);

        var results = new List<DataPoint>(pointIds.Length);

        for (var i = 0; i < pointIds.Length; i++)
        {
            var dataValue = response.Results[i];
            var quality = StatusCode.IsGood(dataValue.StatusCode) ? "Good" : "Bad";
            var timestamp = dataValue.ServerTimestamp != DateTime.MinValue
                ? dataValue.ServerTimestamp
                : DateTime.UtcNow;

            // 将 OPC UA 值统一转换为 double，适配 DataPoint 结构
            var numericValue = ConvertToDouble(dataValue.Value);

            results.Add(new DataPoint(
                PointId: pointIds[i],
                Metric: pointIds[i],
                Value: numericValue,
                Quality: quality,
                Timestamp: timestamp));
        }

        return results;
    }

    /// <inheritdoc />
    public async ValueTask DisposeAsync()
    {
        if (_disposed) return;
        _disposed = true;

        if (_session is not null)
        {
            try
            {
                await _session.CloseAsync(CancellationToken.None);
            }
            catch (Exception ex)
            {
                _logger?.LogDebug(ex, "关闭 OPC UA 会话时出现异常，已忽略");
            }

            _session.Dispose();
            _session = null;
        }

        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// 创建 OPC UA 客户端的 ApplicationConfiguration。
    /// </summary>
    /// <remarks>
    /// 边缘网关作为客户端，配置应用名称、证书存储路径等基础信息。
    /// 生产环境中应配置安全证书和加密策略，关闭 AutoAcceptUntrustedCertificates。
    /// </remarks>
    private static async Task<ApplicationConfiguration> CreateApplicationConfigurationAsync()
    {
        var config = new ApplicationConfiguration
        {
            ApplicationName = "EquipAI EdgeGateway",
            ApplicationUri = $"urn:{Utils.GetHostName()}:EquipAI:EdgeGateway",
            ApplicationType = ApplicationType.Client,
            SecurityConfiguration = new SecurityConfiguration
            {
                ApplicationCertificate = new CertificateIdentifier
                {
                    StoreType = CertificateStoreType.Directory,
                    StorePath = "certificates/client"
                },
                TrustedPeerCertificates = new CertificateTrustList
                {
                    StoreType = CertificateStoreType.Directory,
                    StorePath = "certificates/trusted"
                },
                RejectedCertificateStore = new CertificateTrustList
                {
                    StoreType = CertificateStoreType.Directory,
                    StorePath = "certificates/rejected"
                },
                AutoAcceptUntrustedCertificates = true // 开发阶段自动接受，生产应关闭
            },
            TransportQuotas = new TransportQuotas
            {
                OperationTimeout = 15000
            }
        };

        await config.ValidateAsync(ApplicationType.Client);
        return config;
    }

    /// <summary>
    /// 将 OPC UA 数据值转换为 double 类型。
    /// </summary>
    /// <remarks>
    /// 支持常见工业数据类型：double、float、int、long、bool、decimal 等。
    /// 无法转换时返回 0.0 并记录警告日志。
    /// </remarks>
    private static double ConvertToDouble(object? value)
    {
        return value switch
        {
            double d => d,
            float f => f,
            int n => n,
            long l => l,
            bool b => b ? 1.0 : 0.0,
            decimal dec => (double)dec,
            short s => s,
            ushort us => us,
            uint ui => ui,
            ulong ul => (double)ul,
            byte bt => bt,
            sbyte sb => sb,
            _ => double.TryParse(value?.ToString(), out var parsed) ? parsed : 0.0
        };
    }
}
