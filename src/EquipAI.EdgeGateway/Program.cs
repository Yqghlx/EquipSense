using System.Net.Http.Json;
using EquipAI.EdgeGateway;
using EquipAI.EdgeGateway.Pipeline;
using EquipAI.EdgeGateway.Protocols;
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
    var adapterFactory = new Func<string, IProtocolAdapter>(protocol => protocol switch
    {
        "opcua" => new OpcUaAdapter(),
        "modbus-tcp" => new ModbusTcpAdapter(),
        "modbus-rtu" => new ModbusRtuAdapter(),
        _ => throw new ArgumentException($"不支持的协议: {protocol}")
    });

    // 注册上传器
    builder.Services.AddSingleton<CloudUploader>();

    // 加载设备配置 — 优先从后端 API 拉取，fallback 到本地 appsettings.json
    var devicesSection = builder.Configuration.GetSection("Devices");
    var localDevices = devicesSection.Get<DeviceConfig[]>() ?? [];
    DeviceConfig[] devices;

    try
    {
        var gatewayOpts = new GatewayOptions();
        builder.Configuration.GetSection(GatewayOptions.SectionName).Bind(gatewayOpts);

        if (!string.IsNullOrEmpty(gatewayOpts.BackendUrl) && !string.IsNullOrEmpty(gatewayOpts.AuthKey))
        {
            using var httpClient = new HttpClient();
            httpClient.DefaultRequestHeaders.Add("X-Gateway-Auth-Key", gatewayOpts.AuthKey);
            httpClient.Timeout = TimeSpan.FromSeconds(10);

            var response = await httpClient.GetAsync(
                $"{gatewayOpts.BackendUrl.TrimEnd('/')}/api/v1/gateway/config?gatewayId={gatewayOpts.Id}");

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

    foreach (var device in devices)
    {
        var deviceConfig = device;
        builder.Services.AddSingleton<IHostedService>(sp => new DataCollector(
            sp.GetRequiredService<ILogger<DataCollector>>(),
            adapterFactory(deviceConfig.Protocol),
            sp.GetRequiredService<CloudUploader>(),
            deviceConfig,
            deviceConfig.DeviceType ?? "Unknown"));
    }

    builder.Services.AddSerilog();

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
