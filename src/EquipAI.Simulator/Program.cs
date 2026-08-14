using System.Runtime.InteropServices;
using EquipAI.Simulator;
using Microsoft.Extensions.Configuration;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var shutdownCts = new CancellationTokenSource();
    using var sigintRegistration = PosixSignalRegistration.Create(
        PosixSignal.SIGINT,
        context =>
        {
            context.Cancel = true;
            shutdownCts.Cancel();
        });
    using var sigtermRegistration = PosixSignalRegistration.Create(
        PosixSignal.SIGTERM,
        context =>
        {
            context.Cancel = true;
            shutdownCts.Cancel();
        });

    var headless = SimulatorCommandLine.IsHeadless(args);
    var config = new ConfigurationBuilder()
        .SetBasePath(Directory.GetCurrentDirectory())
        .AddJsonFile("appsettings.json", optional: false)
        .Build();

    var options = new SimulatorOptions();
    config.GetSection(SimulatorOptions.SectionName).Bind(options);

    Log.Information("EquipAI Simulator 启动中...");
    Log.Information("已配置 {Count} 个传感器", options.Sensors.Count);

    var sensors = options.Sensors
        .Select(s => new SimulatedSensor(s))
        .ToList();

    // 启动 Modbus TCP Mock Server
    var modbusServer = new ModbusTcpMockServer(options.ModbusTcp.Port, sensors);
    modbusServer.Start();
    Log.Information("Modbus TCP Mock Server 已启动，端口: {Port}", options.ModbusTcp.Port);

    // 启动 OPC UA Mock Server
    var opcUaServer = new OpcUaMockServer(options.OpcUa.Port, sensors);
    await opcUaServer.StartAsync();
    Log.Information("OPC UA Mock Server 已启动，端口: {Port}", options.OpcUa.Port);

    Log.Information("Simulator 就绪 — OPC UA: opc.tcp://localhost:{OpcPort}, Modbus TCP: localhost:{ModbusPort}",
        options.OpcUa.Port, options.ModbusTcp.Port);
    if (headless)
    {
        Log.Information("Simulator 已进入非交互模式，等待终止信号...");
        try
        {
            await Task.Delay(Timeout.InfiniteTimeSpan, shutdownCts.Token);
        }
        catch (OperationCanceledException) when (shutdownCts.IsCancellationRequested)
        {
            // 收到 SIGINT/SIGTERM 后进入统一资源释放流程。
        }
    }
    else
    {
        Log.Information("按 Enter 键退出...");
        Console.ReadLine();
    }

    await modbusServer.DisposeAsync();
    await opcUaServer.DisposeAsync();
    shutdownCts.Dispose();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Simulator 启动失败");
}
finally
{
    await Log.CloseAndFlushAsync();
}
