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
        _ => throw new ArgumentException($"不支持的协议: {protocol}")
    });

    // 注册上传器
    builder.Services.AddSingleton<CloudUploader>();

    // 加载设备配置并为每个设备注册 DataCollector
    var devicesSection = builder.Configuration.GetSection("Devices");
    var devices = devicesSection.Get<DeviceConfig[]>() ?? [];

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
