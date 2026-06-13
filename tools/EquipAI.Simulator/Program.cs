using System.Text;
using System.Text.Json;
using EquipAI.Simulator.Engine;
using EquipAI.Simulator.Faults;
using EquipAI.Simulator.Models;
using EquipAI.Simulator.Profiles;
using MQTTnet;
using MQTTnet.Client;
using MQTTnet.Protocol;

namespace EquipAI.Simulator;

/// <summary>
/// 工业设备遥测数据模拟器（升级版）
/// 支持剧本模式（--scenario）和随机模式（--mode random）
/// 生成的数据具有真实工业时序特征：趋势 + 周期 + 故障演化
/// </summary>
class Program
{
    static async Task<int> Main(string[] args)
    {
        var options = ParseArguments(args);
        if (options.ShowHelp) { PrintUsage(); return 0; }

        PrintBanner(options);

        using var cts = options.DurationSeconds.HasValue
            ? new CancellationTokenSource(TimeSpan.FromSeconds(options.DurationSeconds.Value))
            : new CancellationTokenSource();

        Console.CancelKeyPress += (_, e) => { e.Cancel = true; cts.Cancel(); };

        try
        {
            await RunSimulatorAsync(options, cts.Token);
        }
        catch (OperationCanceledException) { Console.WriteLine("\n[信息] 模拟器已停止"); }
        catch (Exception ex) { Console.WriteLine($"[错误] {ex.Message}"); return 1; }

        return 0;
    }

    private static async Task RunSimulatorAsync(SimulatorOptions options, CancellationToken ct)
    {
        // 装配设备画像和数据生成器
        var profile = new AirCompressorProfile();
        var generator = new TelemetryGenerator(profile);

        // 装配故障调度器（剧本模式或随机模式）
        ScenarioEngine? scenarioEngine = null;
        RandomFaultScheduler? randomScheduler = null;
        FaultScenario? scenario = null;

        if (!string.IsNullOrEmpty(options.ScenarioFile))
        {
            var json = await File.ReadAllTextAsync(options.ScenarioFile, ct);
            scenario = JsonSerializer.Deserialize<FaultScenario>(json)
                       ?? throw new InvalidOperationException("剧本文件解析失败");
            scenarioEngine = new ScenarioEngine(scenario);
            Console.WriteLine($"[信息] 已加载剧本: {scenario.Name}（timeScale={scenario.TimeScale}）");
        }
        else
        {
            randomScheduler = new RandomFaultScheduler(options.FaultRate, maxDurationMinutes: 30);
            Console.WriteLine($"[信息] 随机模式：faultRate={options.FaultRate}");
        }

        // 装配标准答案记录器
        var scenarioName = scenario?.Name ?? "random";
        var truthLogger = new GroundTruthLogger(options.DeviceCode, scenarioName);
        var lastFaultTypes = new HashSet<string>();
        var registry = new FaultRegistry();

        // 连接 MQTT
        using var mqttClient = new MqttFactory().CreateMqttClient();
        var connectOptions = new MqttClientOptionsBuilder()
            .WithTcpServer(options.BrokerHost, options.Port)
            .WithClientId($"EquipAI-Sim-{Guid.NewGuid():N}"[..50])
            .WithCleanSession(true)
            .Build();

        Console.WriteLine($"[信息] 连接 MQTT {options.BrokerHost}:{options.Port}...");
        await mqttClient.ConnectAsync(connectOptions, ct);
        Console.WriteLine("[信息] 连接成功，开始发送遥测数据...\n");

        var deviceId = Guid.NewGuid();
        var timeScale = scenario?.TimeScale ?? 1;

        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(options.IntervalSeconds));
        var tickCount = 0;

        while (await timer.WaitForNextTickAsync(ct))
        {
            // 推进模拟时间
            var simTime = TimeSpan.FromSeconds(tickCount * options.IntervalSeconds * timeScale);
            tickCount++;

            // 调度故障
            if (scenarioEngine != null)
            {
                scenarioEngine.Tick(simTime);
                LogFaultChanges(scenarioEngine.ActiveFaults, lastFaultTypes, truthLogger, registry);
            }
            else if (randomScheduler != null)
            {
                randomScheduler.Tick(simTime);
                LogFaultChanges(randomScheduler.ActiveFaults, lastFaultTypes, truthLogger, registry);
            }

            IReadOnlyList<ActiveFault> activeFaults = scenarioEngine?.ActiveFaults
                ?? randomScheduler?.ActiveFaults
                ?? Array.Empty<ActiveFault>();

            // 生成数据
            var metrics = generator.Generate(simTime, activeFaults.ToList());
            var payload = new
            {
                timestamp = DateTime.UtcNow.ToString("o"),
                quality = activeFaults.Count > 0 ? "warning" : "good",
                metrics,
            };

            var topic = $"factory/{options.TenantId}/telemetry/{deviceId}";
            var message = new MqttApplicationMessageBuilder()
                .WithTopic(topic)
                .WithPayload(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(payload)))
                .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce)
                .Build();

            try
            {
                await mqttClient.PublishAsync(message, ct);
                Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] sim={simTime:hh\\:mm\\:ss} faults={activeFaults.Count} "
                                  + $"oil_temp={metrics["oil_temperature"]:F1}°C vib={metrics["vibration"]:F2} "
                                  + $"press={metrics["discharge_pressure"]:F2} current={metrics["motor_current"]:F0}A");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[错误] 发送失败: {ex.Message}");
            }
        }

        // 保存标准答案日志
        var outputPath = Path.Combine(AppContext.BaseDirectory, "ground-truth");
        await truthLogger.SaveAsync(outputPath, ct);
        Console.WriteLine($"\n[信息] 标准答案已保存到: {outputPath}");
    }

    /// <summary>检测活跃故障列表变化，记录注入/移除事件到标准答案日志</summary>
    private static void LogFaultChanges(
        IReadOnlyList<ActiveFault> current,
        HashSet<string> lastTypes,
        GroundTruthLogger logger,
        FaultRegistry registry)
    {
        var currentTypes = current.Select(f => f.Pattern.FaultType).ToHashSet();

        // 新注入的故障
        foreach (var fault in current.Where(f => !lastTypes.Contains(f.Pattern.FaultType)))
            logger.LogFaultInjected(fault.Pattern, DateTime.UtcNow);

        // 已移除的故障
        foreach (var removed in lastTypes.Except(currentTypes))
        {
            var pattern = registry.Get(removed);
            logger.LogFaultStopped(pattern, DateTime.UtcNow);
        }

        lastTypes.Clear();
        foreach (var t in currentTypes) lastTypes.Add(t);
    }

    private static SimulatorOptions ParseArguments(string[] args)
    {
        var options = new SimulatorOptions();
        for (var i = 0; i < args.Length; i++)
        {
            switch (args[i])
            {
                case "--host" or "-h" when i + 1 < args.Length:
                    options.BrokerHost = args[++i]; break;
                case "--port" or "-p" when i + 1 < args.Length:
                    if (int.TryParse(args[++i], out var port)) options.Port = port;
                    break;
                case "--tenant" or "-t" when i + 1 < args.Length:
                    options.TenantId = args[++i]; break;
                case "--device-code" when i + 1 < args.Length:
                    options.DeviceCode = args[++i]; break;
                case "--interval" or "-i" when i + 1 < args.Length:
                    if (int.TryParse(args[++i], out var interval)) options.IntervalSeconds = interval;
                    break;
                case "--scenario" or "-s" when i + 1 < args.Length:
                    options.ScenarioFile = args[++i]; break;
                case "--mode" when i + 1 < args.Length:
                    options.Mode = args[++i]; break;
                case "--fault-rate" when i + 1 < args.Length:
                    if (double.TryParse(args[++i], out var rate)) options.FaultRate = rate;
                    break;
                case "--duration" when i + 1 < args.Length:
                    if (int.TryParse(args[++i], out var duration)) options.DurationSeconds = duration;
                    break;
                case "--help": options.ShowHelp = true; break;
            }
        }
        return options;
    }

    private static void PrintUsage()
    {
        Console.WriteLine("EquipAI 工业遥测模拟器（升级版）\n");
        Console.WriteLine("剧本模式（可重复评估）:");
        Console.WriteLine("  EquipAI.Simulator --scenario scenarios/bearing-wear.json\n");
        Console.WriteLine("随机模式（长期运行测试）:");
        Console.WriteLine("  EquipAI.Simulator --mode random --fault-rate 0.1\n");
        Console.WriteLine("选项:");
        Console.WriteLine("  --host, -h <host>        MQTT 代理 (默认 localhost)");
        Console.WriteLine("  --port, -p <port>        MQTT 端口 (默认 1883)");
        Console.WriteLine("  --tenant, -t <guid>      租户 ID");
        Console.WriteLine("  --device-code <code>     设备编码 (默认 AC-001)");
        Console.WriteLine("  --interval, -i <sec>     采样间隔 (默认 5)");
        Console.WriteLine("  --scenario, -s <path>    剧本 JSON 文件路径");
        Console.WriteLine("  --mode random            随机故障模式");
        Console.WriteLine("  --fault-rate <0-1>       随机模式故障概率 (默认 0.1)");
        Console.WriteLine("  --duration <sec>         运行时长 (默认无限)");
    }

    private static void PrintBanner(SimulatorOptions options)
    {
        Console.WriteLine();
        Console.WriteLine("  ╔═══════════════════════════════════════════════╗");
        Console.WriteLine("  ║   EquipAI 工业遥测模拟器（升级版）           ║");
        Console.WriteLine("  ╚═══════════════════════════════════════════════╝\n");
        Console.WriteLine($"  设备类型:    空压机 ({options.DeviceCode})");
        Console.WriteLine($"  运行模式:    {(string.IsNullOrEmpty(options.ScenarioFile) ? "随机" : "剧本")}");
        if (!string.IsNullOrEmpty(options.ScenarioFile))
            Console.WriteLine($"  剧本文件:    {options.ScenarioFile}");
        Console.WriteLine($"  采样间隔:    {options.IntervalSeconds} 秒\n");
    }
}

internal class SimulatorOptions
{
    public string BrokerHost { get; set; } = "localhost";
    public int Port { get; set; } = 1883;
    public string TenantId { get; set; } = "11111111-1111-1111-1111-111111111111";
    public string DeviceCode { get; set; } = "AC-001";
    public int IntervalSeconds { get; set; } = 5;
    public string? ScenarioFile { get; set; }
    public string Mode { get; set; } = "scenario";
    public double FaultRate { get; set; } = 0.1;
    public int? DurationSeconds { get; set; }
    public bool ShowHelp { get; set; }
}
