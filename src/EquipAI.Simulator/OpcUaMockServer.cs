using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Opc.Ua;
using Opc.Ua.Configuration;
using Opc.Ua.Server;

namespace EquipAI.Simulator;

/// <summary>
/// OPC UA Mock Server — 为每个 SimulatedSensor 注册一个可读节点
/// 节点 ID 格式：ns=2;s={SensorName}
/// 后台每 500ms 更新所有传感器值
/// </summary>
public class OpcUaMockServer : IAsyncDisposable
{
    /// <summary>
    /// OPC UA 服务器实例
    /// </summary>
    private StandardServer? _server;

    /// <summary>
    /// 模拟传感器列表
    /// </summary>
    private readonly List<SimulatedSensor> _sensors;

    /// <summary>
    /// OPC UA 监听端口
    /// </summary>
    private readonly int _port;

    /// <summary>
    /// 取消令牌源，用于停止后台更新任务
    /// </summary>
    private readonly CancellationTokenSource _cts = new();

    /// <summary>
    /// 后台传感器值更新任务
    /// </summary>
    private Task? _updateTask;

    /// <summary>
    /// 传感器名称到当前值的映射字典，由后台任务写入、由 OPC UA 节点读取回调读取
    /// </summary>
    private readonly Dictionary<string, double> _sensorValues = new();

    /// <summary>
    /// OPC UA 监听端口
    /// </summary>
    public int Port => _port;

    /// <summary>
    /// 创建 OPC UA Mock Server 实例
    /// </summary>
    /// <param name="port">OPC UA 监听端口（默认 4840）</param>
    /// <param name="sensors">模拟传感器列表</param>
    public OpcUaMockServer(int port, IEnumerable<SimulatedSensor> sensors)
    {
        _port = port;
        _sensors = sensors.ToList();

        // 用初始值填充字典，确保 OPC UA 节点读取回调始终能找到值
        foreach (var sensor in _sensors)
        {
            _sensorValues[sensor.Name] = sensor.GetValue(DateTime.UtcNow);
        }
    }

    /// <summary>
    /// 获取指定传感器的当前值（供外部直接读取）
    /// </summary>
    /// <param name="sensorName">传感器名称</param>
    /// <returns>当前传感器值，不存在则返回 0.0</returns>
    public double GetValue(string sensorName) =>
        _sensorValues.TryGetValue(sensorName, out var v) ? v : 0.0;

    /// <summary>
    /// 启动 OPC UA Server + 后台传感器值更新
    /// 使用 OPC Foundation SDK 1.5 的 Fluent Builder API 配置服务器
    /// 如果服务器配置失败，仍保持传感器值字典的定时更新
    /// </summary>
    public async Task StartAsync()
    {
        // 启动后台定时更新传感器值（无论 OPC UA 服务器是否成功启动都运行）
        _updateTask = Task.Run(UpdateLoopAsync);

        // 尝试启动 OPC UA 服务器
        try
        {
            await StartOpcUaServerAsync().ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            // OPC UA 服务器启动失败不影响传感器值字典的更新
            // 外部仍可通过 GetValue() 直接读取传感器值
            Console.WriteLine($"[警告] OPC UA 服务器启动失败: {ex.Message}");
            Console.WriteLine("[提示] 传感器值字典仍可通过 GetValue() 方法直接访问");
        }
    }

    /// <summary>
    /// 使用 Fluent Builder API 配置并启动 OPC UA 服务器
    /// </summary>
    private async Task StartOpcUaServerAsync()
    {
        // 使用 CertificateIdentifierCollection 版本的 AddSecurityConfiguration
        // 构建应用证书标识列表
        string pkiRoot = Path.Combine(Path.GetTempPath(), "OPC Foundation", "EquipAI.Simulator", "pki");
        string subject = "CN=EquipAI Simulator, O=EquipAI, DC=localhost";
        string endpointUrl = $"opc.tcp://localhost:{_port}";

        var appCerts = new CertificateIdentifierCollection
        {
            new CertificateIdentifier
            {
                StoreType = CertificateStoreType.Directory,
                StorePath = Path.Combine(pkiRoot, "own"),
                SubjectName = subject,
            },
        };

        // Fluent Builder 配置步骤：
        // 1. Build() — 初始化 ApplicationConfiguration
        // 2. AsServer() — 配置端点 URL
        // 3. AddUnsecurePolicyNone() — 允许无安全策略连接（开发环境）
        // 4. AddUserTokenPolicy() — 允许匿名访问
        // 5. AddSecurityConfiguration() — 配置证书存储路径
        // 6. CreateAsync() — 验证并完成配置
#pragma warning disable CS0618 // 抑制过时 API 警告：无参构造函数在独立场景仍可用
        var application = new ApplicationInstance
        {
            ApplicationName = "EquipAI Simulator",
            ApplicationType = ApplicationType.Server,
        };
#pragma warning restore CS0618

        await application
            .Build("urn:equipai:simulator", "http://equipai.com/simulator")
            .AsServer([endpointUrl])
            .AddUnsecurePolicyNone()
            .AddUserTokenPolicy(UserTokenType.Anonymous)
            .AddSecurityConfiguration(appCerts, pkiRoot)
            .SetAutoAcceptUntrustedCertificates(true)
            .SetRejectSHA1SignedCertificates(false)
            .CreateAsync(_cts.Token)
            .ConfigureAwait(false);

        // 检查并创建自签名证书（首次运行时自动创建）
        bool haveCert = await application
            .CheckApplicationInstanceCertificatesAsync(silent: true, ct: _cts.Token)
            .ConfigureAwait(false);

        if (!haveCert)
        {
            throw new InvalidOperationException("无法创建或加载 OPC UA 应用实例证书");
        }

        // 创建 StandardServer 并注册自定义 NodeManager
        _server = new StandardServer();
        _server.AddNodeManager(new SimulatorNodeManagerFactory(_sensorValues));

        // 启动服务器（StartAsync 只接受 ServerBase，不接受 CancellationToken）
        await application.StartAsync(_server).ConfigureAwait(false);

        Console.WriteLine($"[OPC UA] 服务器已启动，端点: {endpointUrl}");
        Console.WriteLine($"[OPC UA] 已注册 {_sensors.Count} 个传感器节点");
    }

    /// <summary>
    /// 后台循环：每 500ms 更新所有传感器的模拟值
    /// 更新后的值可通过 OPC UA 节点读取回调或 GetValue() 方法获取
    /// </summary>
    private async Task UpdateLoopAsync()
    {
        while (!_cts.IsCancellationRequested)
        {
            try
            {
                foreach (var sensor in _sensors)
                {
                    _sensorValues[sensor.Name] = sensor.GetValue(DateTime.UtcNow);
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                // 更新传感器值出错时记录但继续运行
                Console.WriteLine($"[警告] 更新传感器值时出错: {ex.Message}");
            }

            try
            {
                await Task.Delay(500, _cts.Token).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                // 取消令牌触发，正常退出循环
                break;
            }
        }
    }

    /// <summary>
    /// 异步释放资源：停止更新任务、关闭 OPC UA 服务器、释放取消令牌
    /// </summary>
    public async ValueTask DisposeAsync()
    {
        await _cts.CancelAsync().ConfigureAwait(false);

        if (_updateTask is not null)
        {
            try
            {
                await _updateTask.ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                // 任务被取消是预期行为
            }
            catch (Exception)
            {
                // 忽略其他异常，确保资源释放
            }
        }

        if (_server is not null)
        {
            try
            {
                await _server.StopAsync().ConfigureAwait(false);
            }
            catch (Exception)
            {
                // 服务器停止时的异常不影响资源释放
            }
        }

        _cts.Dispose();
    }

    /// <summary>
    /// 节点管理器工厂 — 实现 INodeManagerFactory 接口
    /// 为 StandardServer 创建 SimulatorNodeManager 实例
    /// </summary>
    private sealed class SimulatorNodeManagerFactory : INodeManagerFactory
    {
        private readonly Dictionary<string, double> _values;

        /// <summary>
        /// 节点管理器使用的命名空间 URI
        /// </summary>
        private const string NamespaceUri = "http://equipai.com/simulator";

        /// <summary>
        /// 创建节点管理器工厂
        /// </summary>
        /// <param name="values">传感器值字典（共享引用，由后台任务更新）</param>
        public SimulatorNodeManagerFactory(Dictionary<string, double> values)
        {
            _values = values;
        }

        /// <inheritdoc/>
        public StringCollection NamespacesUris => [NamespaceUri];

        /// <inheritdoc/>
        public INodeManager Create(IServerInternal server, ApplicationConfiguration configuration)
        {
            return new SimulatorNodeManager(server, configuration, NamespaceUri, _values);
        }
    }

    /// <summary>
    /// 自定义节点管理器 — 继承 CustomNodeManager2，为每个传感器创建变量节点
    /// 节点使用 OnReadValue 回调从共享字典中读取最新的传感器值
    /// </summary>
    private sealed class SimulatorNodeManager : CustomNodeManager2
    {
        /// <summary>
        /// 传感器名称到当前值的共享字典（由后台任务写入）
        /// </summary>
        private readonly Dictionary<string, double> _values;

        /// <summary>
        /// 创建节点管理器
        /// </summary>
        /// <param name="server">OPC UA 服务器内部实例</param>
        /// <param name="configuration">应用配置</param>
        /// <param name="namespaceUri">节点管理器的命名空间 URI</param>
        /// <param name="values">传感器值字典</param>
        public SimulatorNodeManager(
            IServerInternal server,
            ApplicationConfiguration configuration,
            string namespaceUri,
            Dictionary<string, double> values)
            : base(server, configuration, namespaceUri)
        {
            _values = values;
            SystemContext.NodeIdFactory = this;
        }

        /// <summary>
        /// 创建地址空间 — 在 Objects 文件夹下创建 Sensors 子文件夹，
        /// 然后为每个传感器创建一个 BaseDataVariableState 变量节点
        /// </summary>
        /// <param name="externalReferences">外部引用字典，用于将节点链接到其他节点管理器的节点</param>
        public override void CreateAddressSpace(IDictionary<NodeId, IList<IReference>> externalReferences)
        {
            lock (Lock)
            {
                // 加载预定义节点（基类所需）
                LoadPredefinedNodes(SystemContext, externalReferences);

                // 在 Objects 文件夹下创建 Sensors 文件夹
                var sensorsFolder = CreateFolder(
                    null,
                    "Sensors",
                    "模拟传感器文件夹");

                // 将 Sensors 文件夹添加到 Objects 节点的引用中
                var objectsFolder = FindPredefinedNode<FolderState>(ObjectIds.ObjectsFolder);

                if (objectsFolder is not null && sensorsFolder is not null)
                {
                    // 从 Objects 文件夹到 Sensors 文件夹的正向引用（Organizes 类型）
                    objectsFolder.AddReference(ReferenceTypeIds.Organizes, false, sensorsFolder.NodeId);
                    // 从 Sensors 文件夹到 Objects 文件夹的反向引用
                    sensorsFolder.AddReference(ReferenceTypeIds.Organizes, true, objectsFolder.NodeId);
                }

                // 为每个传感器创建一个变量节点
                if (sensorsFolder is not null)
                {
                    foreach (var kvp in _values)
                    {
                        CreateSensorVariable(sensorsFolder, kvp.Key);
                    }
                }
            }
        }

        /// <summary>
        /// 创建一个文件夹节点
        /// </summary>
        /// <param name="parent">父节点（null 表示根级别）</param>
        /// <param name="name">文件夹名称</param>
        /// <param name="description">文件夹描述</param>
        /// <returns>创建的文件夹状态节点</returns>
        private FolderState CreateFolder(NodeState? parent, string name, string description)
        {
            var folder = new FolderState(parent)
            {
                SymbolicName = name,
                ReferenceTypeId = ReferenceTypes.Organizes,
                TypeDefinitionId = ObjectTypeIds.FolderType,
                NodeId = new NodeId(name, NamespaceIndex),
                BrowseName = new QualifiedName(name, NamespaceIndex),
                DisplayName = new LocalizedText("en", name),
                Description = new LocalizedText("en", description),
                WriteMask = AttributeWriteMask.None,
                UserWriteMask = AttributeWriteMask.None,
                EventNotifier = EventNotifiers.None,
            };

            if (parent is not null)
            {
                AddPredefinedNode(SystemContext, folder);
            }

            return folder;
        }

        /// <summary>
        /// 为传感器创建一个 Double 类型的变量节点
        /// 节点 ID: ns={NamespaceIndex};s={sensorName}
        /// 使用 OnReadValue 回调从共享字典中读取最新值
        /// </summary>
        /// <param name="parent">父文件夹节点</param>
        /// <param name="sensorName">传感器名称</param>
        private void CreateSensorVariable(NodeState parent, string sensorName)
        {
            var variable = new BaseDataVariableState(parent)
            {
                SymbolicName = sensorName,
                ReferenceTypeId = ReferenceTypes.Organizes,
                TypeDefinitionId = VariableTypeIds.BaseDataVariableType,
                NodeId = new NodeId(sensorName, NamespaceIndex),
                BrowseName = new QualifiedName(sensorName, NamespaceIndex),
                DisplayName = new LocalizedText("en", sensorName),
                Description = new LocalizedText("en", $"模拟传感器: {sensorName}"),
                WriteMask = AttributeWriteMask.None,
                UserWriteMask = AttributeWriteMask.None,
                DataType = DataTypeIds.Double,
                ValueRank = ValueRanks.Scalar,
                AccessLevel = AccessLevels.CurrentReadOrWrite,
                UserAccessLevel = AccessLevels.CurrentReadOrWrite,
                // 初始值
                Value = _values.TryGetValue(sensorName, out var v) ? v : 0.0,
            };

            // 注册读取回调 — 每次客户端读取节点时，从共享字典获取最新值
            // 这样 OPC UA 客户端始终能读到后台任务更新的最新传感器值
            variable.OnReadValue = OnReadSensorValue;

            AddPredefinedNode(SystemContext, variable);
        }

        /// <summary>
        /// OPC UA 节点值读取回调（NodeValueEventHandler 委托）
        /// 从共享字典中获取传感器的最新值，实现客户端读取时总是获取实时数据
        /// </summary>
        /// <param name="context">系统上下文</param>
        /// <param name="node">被读取的节点状态</param>
        /// <param name="indexRange">数值范围（用于数组，标量忽略）</param>
        /// <param name="dataEncoding">数据编码（此场景忽略）</param>
        /// <param name="value">读取的值（输出参数）</param>
        /// <param name="statusCode">状态码（输出参数）</param>
        /// <param name="timestamp">时间戳（输出参数）</param>
        /// <returns>ServiceResult.Good 表示成功</returns>
        private ServiceResult OnReadSensorValue(
            ISystemContext context,
            NodeState node,
            NumericRange indexRange,
            QualifiedName dataEncoding,
            ref object value,
            ref StatusCode statusCode,
            ref DateTime timestamp)
        {
            // 从节点浏览名称中提取传感器名称
            string sensorName = node.BrowseName.Name;

            value = _values.TryGetValue(sensorName, out var sensorValue) ? sensorValue : 0.0;
            timestamp = DateTime.UtcNow;

            return StatusCodes.Good;
        }
    }
}
