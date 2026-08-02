using System.Net.Http.Json;
using EquipAI.Core.Security;
using EquipAI.EdgeGateway;
using EquipAI.EdgeGateway.Persistence;
using EquipAI.EdgeGateway.Pipeline;
using EquipAI.EdgeGateway.Protocols;
using EquipAI.EdgeGateway.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = Host.CreateApplicationBuilder(args);

    // 绑定配置
    builder.Services.Configure<GatewayOptions>(
        builder.Configuration.GetSection(GatewayOptions.SectionName));
    builder.Services.AddSingleton(sp =>
        sp.GetRequiredService<IOptions<GatewayOptions>>().Value);

    // 注册协议适配器工厂
    builder.Services.AddSingleton<CertificateManager>();
    var adapterFactory = new Func<IServiceProvider, string, IProtocolAdapter>((sp, protocol) => protocol switch
    {
        "opcua" => new OpcUaAdapter(
            sp.GetRequiredService<CertificateManager>(),
            sp.GetRequiredService<IOptions<GatewayOptions>>(),
            sp.GetRequiredService<ILogger<OpcUaAdapter>>()),
        "modbus-tcp" => new ModbusTcpAdapter(),
        "modbus-rtu" => new ModbusRtuAdapter(),
        _ => throw new ArgumentException($"不支持的协议: {protocol}")
    });

    // 注册离线缓冲存储（SQLite 持久化 + 内存环形队列）
    System.IO.Directory.CreateDirectory("data");
    var sqliteStore = new SqliteBufferStore("data/buffer.db");
    await sqliteStore.InitializeAsync();
    builder.Services.AddSingleton(sqliteStore);

    var gatewayOpts = new GatewayOptions();
    builder.Configuration.GetSection(GatewayOptions.SectionName).Bind(gatewayOpts);

    var mqttParts = gatewayOpts.MqttBroker.Split(':', 2, StringSplitOptions.TrimEntries);
    var mqttPort = mqttParts.Length > 1 && int.TryParse(mqttParts[1], out var configuredMqttPort)
        ? configuredMqttPort
        : (gatewayOpts.MqttUseTls ? 8883 : 1883);
    MqttSecurityConfigurationValidator.Validate(
        componentName: "Gateway",
        environmentName: builder.Environment.EnvironmentName,
        port: mqttPort,
        useTls: gatewayOpts.MqttUseTls,
        allowUntrustedCertificates: gatewayOpts.MqttAllowUntrustedCertificates,
        caCertificatePath: gatewayOpts.MqttCaCertificatePath,
        username: gatewayOpts.MqttUsername,
        password: gatewayOpts.MqttPassword);

    var localBuffer = new LocalBuffer(
        capacity: gatewayOpts.BufferSize,
        offlineStore: sqliteStore);
    builder.Services.AddSingleton(localBuffer);

    // 注册上传器（注入离线缓冲组件，启用断网保护）
    builder.Services.AddSingleton<CloudUploader>(sp => new CloudUploader(
        sp.GetRequiredService<ILogger<CloudUploader>>(),
        sp.GetRequiredService<GatewayOptions>(),
        sqliteStore,
        localBuffer,
        sp.GetRequiredService<GatewayMetrics>()));

    // 注册指标收集器（全局单例）
    builder.Services.AddSingleton<GatewayMetrics>();

    // 注册设备管理器（管理活跃的采集器实例，支持动态增删）
    builder.Services.AddSingleton<DeviceManager>(sp => new DeviceManager(
        sp,
        adapterFactory,
        sp.GetRequiredService<ILogger<DeviceManager>>()));

    // 加载初始设备配置 — 优先从后端 API 拉取，fallback 到本地 appsettings.json
    var devicesSection = builder.Configuration.GetSection("Devices");
    var localDevices = devicesSection.Get<DeviceConfig[]>() ?? [];
    DeviceConfig[] devices;

    try
    {
        if (!string.IsNullOrEmpty(gatewayOpts.BackendUrl) && !string.IsNullOrEmpty(gatewayOpts.AuthKey))
        {
            using var httpClient = new HttpClient();
            httpClient.DefaultRequestHeaders.Add("X-Gateway-Auth-Key", gatewayOpts.AuthKey);
            httpClient.Timeout = TimeSpan.FromSeconds(10);

            var response = await httpClient.GetAsync(
                // 必须携带 tenantId：后端按 (tenantId, gatewayId) 双重限定，缺则 400（安全修复）
                $"{gatewayOpts.BackendUrl.TrimEnd('/')}/api/v1/gateway/config?gatewayId={Uri.EscapeDataString(gatewayOpts.Id)}&tenantId={Uri.EscapeDataString(gatewayOpts.TenantId)}");

            if (response.IsSuccessStatusCode)
            {
                var apiDevices = await response.Content.ReadFromJsonAsync<List<GatewayDevicePullItem>>();
                if (apiDevices is { Count: > 0 })
                {
                    devices = apiDevices.Select(d => new DeviceConfig(
                        d.DeviceId, d.Protocol, d.ConnectionString, d.DataPoints, d.PollIntervalMs)
                    {
                        DeviceType = d.DeviceType
                    }).ToArray();
                    Log.Information("从后端 API 拉取了 {Count} 个设备配置", devices.Length);
                }
                else
                {
                    devices = localDevices;
                    Log.Information("后端 API 无设备配置，使用本地配置（{Count} 个）", devices.Length);
                }
            }
            else
            {
                devices = localDevices;
                Log.Warning("后端 API 返回 {StatusCode}，使用本地配置", response.StatusCode);
            }
        }
        else
        {
            devices = localDevices;
            Log.Information("未配置后端 API 地址或认证密钥，使用本地配置（{Count} 个）", devices.Length);
        }
    }
    catch (Exception ex)
    {
        devices = localDevices;
        Log.Warning(ex, "无法连接后端 API，使用本地配置");
    }

    Log.Information("已加载 {Count} 个设备配置", devices.Length);

    // 通过 DeviceManager 应用初始配置（替代原先的 foreach 注册方式）
    // DeviceManager 将在 host.Build() 后通过 IHostedLifecycleService 启动采集器
    var initialDevices = devices;
    builder.Services.AddSingleton<IHostedService>(sp =>
    {
        var deviceManager = sp.GetRequiredService<DeviceManager>();
        // 初始配置在服务启动后异步应用
        _ = deviceManager.ApplyConfigAsync(initialDevices);
        return new InitialConfigApplier(deviceManager, initialDevices);
    });

    builder.Services.AddSerilog();

    // 注册 HTTP 客户端工厂（供心跳和配置刷新服务使用）
    builder.Services.AddHttpClient("Backend");

    // 注册心跳服务 — 定期向后端发送心跳以保持在线状态
    builder.Services.AddSingleton<IHostedService>(sp => new HeartbeatService(
        sp.GetRequiredService<ILogger<HeartbeatService>>(),
        sp.GetRequiredService<GatewayOptions>(),
        sp.GetRequiredService<IHttpClientFactory>()));

    // 注册健康检查和 Prometheus 指标端点（含真实连接测试）
    builder.Services.AddSingleton<IHostedService>(sp => new HealthEndpoints(
        sp.GetRequiredService<ILogger<HealthEndpoints>>(),
        sp.GetRequiredService<GatewayOptions>(),
        sp.GetRequiredService<GatewayMetrics>(),
        adapterFactory,
        sp));

    // 注册配置定时刷新服务 — 每 60s 从后端拉取最新配置并动态应用
    builder.Services.AddSingleton<IHostedService>(sp => new ConfigRefreshService(
        sp.GetRequiredService<DeviceManager>(),
        sp.GetRequiredService<GatewayOptions>(),
        sp.GetRequiredService<IHttpClientFactory>(),
        sp.GetRequiredService<ILogger<ConfigRefreshService>>()));

    var host = builder.Build();
    Log.Information("边缘网关启动中...");
    await host.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "边缘网关启动失败");
}
finally
{
    await Log.CloseAndFlushAsync();
}

/// <summary>
/// 后端 API 返回的网关设备配置项
/// </summary>
record GatewayDevicePullItem(
    string DeviceId,
    string Protocol,
    string ConnectionString,
    Dictionary<string, string> DataPoints,
    int PollIntervalMs,
    string? DeviceType);

/// <summary>
/// 初始配置应用器 — 在服务启动时通过 DeviceManager 启动初始采集器
/// </summary>
file class InitialConfigApplier(DeviceManager deviceManager, DeviceConfig[] devices) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await deviceManager.ApplyConfigAsync(devices);
    }
}
