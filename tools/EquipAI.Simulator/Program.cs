using System.Text;
using System.Text.Json;
using MQTTnet;
using MQTTnet.Client;
using MQTTnet.Protocol;

namespace EquipAI.Simulator;

/// <summary>
/// 工业设备遥测数据模拟器
/// 模拟多个工业设备通过 MQTT 发送温度、压力、振动、湿度、转速等遥测数据
/// </summary>
class Program
{
    /// <summary>
    /// 默认租户 ID（与数据库种子数据一致）
    /// </summary>
    private const string DefaultTenantId = "11111111-1111-1111-1111-111111111111";

    /// <summary>
    /// 异常值出现概率（5%）
    /// </summary>
    private const double AnomalyProbability = 0.05;

    /// <summary>
    /// 程序入口
    /// </summary>
    static async Task<int> Main(string[] args)
    {
        // 解析命令行参数
        var options = ParseArguments(args);

        if (options.ShowHelp)
        {
            PrintUsage();
            return 0;
        }

        // 打印启动横幅
        PrintBanner(options);

        // 创建取消令牌，支持 Ctrl+C 优雅退出
        using var cts = options.DurationSeconds.HasValue
            ? new CancellationTokenSource(TimeSpan.FromSeconds(options.DurationSeconds.Value))
            : new CancellationTokenSource();

        Console.CancelKeyPress += (_, e) =>
        {
            e.Cancel = true;
            cts.Cancel();
            Console.WriteLine("\n[信息] 正在停止模拟器...");
        };

        try
        {
            await RunSimulatorAsync(options, cts.Token);
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("[信息] 模拟器已停止。");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[错误] 模拟器运行异常: {ex.Message}");
            return 1;
        }

        return 0;
    }

    /// <summary>
    /// 运行模拟器主循环
    /// </summary>
    private static async Task RunSimulatorAsync(SimulatorOptions options, CancellationToken cancellationToken)
    {
        // 创建 MQTT 客户端工厂
        var factory = new MqttFactory();

        // 使用 using 确保客户端正确释放
        using var mqttClient = factory.CreateMqttClient();

        // 构建 MQTT 连接选项
        var connectOptions = new MqttClientOptionsBuilder()
            .WithTcpServer(options.BrokerHost, options.Port)
            .WithClientId($"EquipAI-Simulator-{Guid.NewGuid():N}"[..50])
            .WithCleanSession(true)
            .Build();

        // 连接到 MQTT 代理
        Console.WriteLine($"[信息] 正在连接到 MQTT 代理 {options.BrokerHost}:{options.Port}...");
        var connectResult = await mqttClient.ConnectAsync(connectOptions, cancellationToken);
        Console.WriteLine($"[信息] 连接成功！结果代码: {connectResult.ResultCode}");

        // 生成模拟设备列表
        var devices = GenerateDevices(options.DeviceCount);
        Console.WriteLine($"[信息] 已生成 {devices.Count} 个模拟设备:");

        foreach (var device in devices)
        {
            Console.WriteLine($"  - {device.Name} ({device.Id})");
        }

        Console.WriteLine();
        Console.WriteLine("[信息] 开始发送遥测数据... 按 Ctrl+C 停止");
        Console.WriteLine(new string('=', 70));

        // 发送统计
        var totalSent = 0L;
        var deviceStats = devices.ToDictionary(d => d.Id, _ => new DeviceSendStats());

        // 面板占位行（为后续刷新留出空间）
        for (var i = 0; i < devices.Count + 4; i++)
        {
            Console.WriteLine();
        }

        // 定时器：按指定间隔发送数据
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(options.IntervalSeconds));

        while (await timer.WaitForNextTickAsync(cancellationToken))
        {
            // 为每个设备生成并发送遥测数据
            foreach (var device in devices)
            {
                var telemetry = GenerateTelemetry(device);
                var topic = $"factory/{options.TenantId}/telemetry/{device.Id}";
                var payload = JsonSerializer.Serialize(telemetry);

                var message = new MqttApplicationMessageBuilder()
                    .WithTopic(topic)
                    .WithPayload(Encoding.UTF8.GetBytes(payload))
                    .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce)
                    .WithRetainFlag(false)
                    .Build();

                try
                {
                    await mqttClient.PublishAsync(message, cancellationToken);
                    Interlocked.Increment(ref totalSent);

                    // 更新设备统计信息
                    var stats = deviceStats[device.Id];
                    stats.SendCount++;
                    stats.LastMetrics = telemetry.Metrics;
                    stats.LastTimestamp = telemetry.Timestamp;
                    stats.IsAnomaly = telemetry.Quality == "anomaly";
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[错误] 设备 {device.Name} 发送失败: {ex.Message}");
                }
            }

            // 更新控制台面板显示
            RenderDashboard(devices, deviceStats, totalSent, options);
        }
    }

    /// <summary>
    /// 为指定设备生成一条遥测数据
    /// 正常数据在合理范围内随机波动，5% 概率生成异常值
    /// </summary>
    private static TelemetryMessage GenerateTelemetry(SimulatedDevice device)
    {
        // 5% 概率生成异常数据
        var isAnomaly = Random.Shared.NextDouble() < AnomalyProbability;

        // 在正常值基础上添加高斯噪声，使数据更真实
        var metrics = new Dictionary<string, double>
        {
            ["temperature"] = isAnomaly
                ? GenerateAnomalousValue(100.0, 130.0)   // 异常温度: 100-130°C
                : GenerateNormalValue(device.BaseTemperature, 3.0), // 正常: 约 60-80°C

            ["vibration"] = isAnomaly
                ? GenerateAnomalousValue(5.0, 12.0)      // 异常振动: 5-12 mm/s
                : Math.Max(0, GenerateNormalValue(device.BaseVibration, 0.3)), // 正常: 0-5 mm/s

            ["pressure"] = isAnomaly
                ? GenerateAnomalousValue(110.0, 140.0)   // 异常压力: 110-140 bar
                : GenerateNormalValue(device.BasePressure, 2.0), // 正常: 约 90-110 bar

            ["humidity"] = Math.Clamp(
                GenerateNormalValue(device.BaseHumidity, 3.0),
                10.0, 95.0), // 湿度限制在 10%-95%

            ["rpm"] = isAnomaly
                ? GenerateAnomalousValue(2000.0, 3000.0) // 异常转速: 2000-3000
                : Math.Max(0, GenerateNormalValue(device.BaseRpm, 50.0)) // 正常: 约 1450-1550
        };

        return new TelemetryMessage
        {
            Timestamp = DateTime.UtcNow.ToString("o"),
            Quality = isAnomaly ? "anomaly" : "good",
            Metrics = metrics
        };
    }

    /// <summary>
    /// 生成服从正态分布的随机值（Box-Muller 变换）
    /// </summary>
    /// <param name="mean">均值</param>
    /// <param name="stdDev">标准差</param>
    private static double GenerateNormalValue(double mean, double stdDev)
    {
        // Box-Muller 变换生成标准正态分布
        var u1 = 1.0 - Random.Shared.NextDouble(); // 避免取 0
        var u2 = 1.0 - Random.Shared.NextDouble();
        var normal = Math.Sqrt(-2.0 * Math.Log(u1)) * Math.Cos(2.0 * Math.PI * u2);

        return Math.Round(mean + stdDev * normal, 2);
    }

    /// <summary>
    /// 生成异常值：在 [min, max) 区间内均匀分布
    /// </summary>
    private static double GenerateAnomalousValue(double anomalyMin, double anomalyMax)
    {
        var value = anomalyMin + Random.Shared.NextDouble() * (anomalyMax - anomalyMin);
        return Math.Round(value, 2);
    }

    /// <summary>
    /// 生成指定数量的模拟设备
    /// 每个设备有独立的基础参数值，模拟不同类型/状态的工业设备
    /// </summary>
    private static List<SimulatedDevice> GenerateDevices(int count)
    {
        // 预定义的设备名称，使模拟更真实
        var deviceNames = new[]
        {
            "CNC加工中心-01", "CNC加工中心-02", "注塑机-A1", "注塑机-A2",
            "空压机-01", "空压机-02", "冲压机床-B1", "冲压机床-B2",
            "焊接机器人-R1", "焊接机器人-R2", "传送带-S1", "传送带-S2",
            "冷却塔-T1", "冷却塔-T2", "液压站-H1", "液压站-H2",
            "数控车床-L1", "数控车床-L2", "铣床-M1", "铣床-M2"
        };

        var devices = new List<SimulatedDevice>();

        for (var i = 0; i < count; i++)
        {
            var name = i < deviceNames.Length
                ? deviceNames[i]
                : $"设备-{i + 1:D3}";

            devices.Add(new SimulatedDevice
            {
                Id = Guid.NewGuid(),
                Name = name,
                // 每台设备的基础参数略有不同，模拟设备差异
                BaseTemperature = 60.0 + Random.Shared.NextDouble() * 20.0,  // 60-80°C
                BaseVibration = Random.Shared.NextDouble() * 2.0,             // 0-2 mm/s
                BasePressure = 90.0 + Random.Shared.NextDouble() * 20.0,     // 90-110 bar
                BaseHumidity = 40.0 + Random.Shared.NextDouble() * 20.0,     // 40-60%
                BaseRpm = 1400.0 + Random.Shared.NextDouble() * 200.0        // 1400-1600 RPM
            });
        }

        return devices;
    }

    /// <summary>
    /// 渲染控制台面板，显示各设备的发送统计和最新数据
    /// </summary>
    private static void RenderDashboard(
        List<SimulatedDevice> devices,
        Dictionary<Guid, DeviceSendStats> stats,
        long totalSent,
        SimulatorOptions options)
    {
        // 计算面板起始行（面板之前的行数为固定值）
        var dashboardStartLine = Console.CursorTop - devices.Count - 4;

        // 确保光标位置有效
        if (dashboardStartLine < 0) dashboardStartLine = 0;

        Console.SetCursorPosition(0, dashboardStartLine);

        var now = DateTime.Now.ToString("HH:mm:ss");
        Console.WriteLine($"[{now}] 总发送: {totalSent} 条 | "
                          + $"设备数: {devices.Count} | "
                          + $"间隔: {options.IntervalSeconds}s | "
                          + $"代理: {options.BrokerHost}:{options.Port}");

        Console.WriteLine(new string('-', 70));
        Console.WriteLine($"{"设备名称",-18} {"发送数",8} {"温度°C",8} {"振动mm/s",10} {"压力bar",8} {"质量",6}");
        Console.WriteLine(new string('-', 70));

        foreach (var device in devices)
        {
            var s = stats[device.Id];
            if (s.LastMetrics == null) continue;

            s.LastMetrics.TryGetValue("temperature", out var temp);
            s.LastMetrics.TryGetValue("vibration", out var vib);
            s.LastMetrics.TryGetValue("pressure", out var pres);

            var qualityDisplay = s.IsAnomaly ? "!!异常" : "正常";
            Console.WriteLine($"{device.Name,-18} {s.SendCount,8} {temp,8:F1} {vib,10:F2} {pres,8:F1} {qualityDisplay,6}");
        }

        Console.WriteLine(new string('=', 70));
    }

    /// <summary>
    /// 解析命令行参数
    /// </summary>
    private static SimulatorOptions ParseArguments(string[] args)
    {
        var options = new SimulatorOptions
        {
            BrokerHost = "localhost",
            Port = 1883,
            TenantId = DefaultTenantId,
            DeviceCount = 5,
            IntervalSeconds = 10
        };

        for (var i = 0; i < args.Length; i++)
        {
            switch (args[i])
            {
                case "--host" or "-h" when i + 1 < args.Length && !args[i + 1].StartsWith('-'):
                    options.BrokerHost = args[++i];
                    break;
                case "--port" or "-p" when i + 1 < args.Length:
                    if (int.TryParse(args[++i], out var port))
                        options.Port = port;
                    break;
                case "--tenant" or "-t" when i + 1 < args.Length:
                    options.TenantId = args[++i];
                    break;
                case "--devices" or "-d" when i + 1 < args.Length:
                    if (int.TryParse(args[++i], out var devCount))
                        options.DeviceCount = devCount;
                    break;
                case "--interval" or "-i" when i + 1 < args.Length:
                    if (int.TryParse(args[++i], out var interval))
                        options.IntervalSeconds = interval;
                    break;
                case "--duration" when i + 1 < args.Length:
                    if (int.TryParse(args[++i], out var duration))
                        options.DurationSeconds = duration;
                    break;
                case "--help":
                    options.ShowHelp = true;
                    break;
            }
        }

        return options;
    }

    /// <summary>
    /// 打印使用说明
    /// </summary>
    private static void PrintUsage()
    {
        Console.WriteLine("EquipAI 工业设备遥测数据模拟器");
        Console.WriteLine();
        Console.WriteLine("用法: EquipAI.Simulator [选项]");
        Console.WriteLine();
        Console.WriteLine("选项:");
        Console.WriteLine("  --host, -h <host>       MQTT 代理地址 (默认: localhost)");
        Console.WriteLine("  --port, -p <port>       MQTT 代理端口 (默认: 1883)");
        Console.WriteLine("  --tenant, -t <guid>     租户 ID (默认: 11111111-1111-1111-1111-111111111111)");
        Console.WriteLine("  --devices, -d <count>   模拟设备数量 (默认: 5)");
        Console.WriteLine("  --interval, -i <sec>    发送间隔秒数 (默认: 10)");
        Console.WriteLine("  --duration <sec>        运行时长秒数 (默认: 无限)");
        Console.WriteLine("  --help                  显示帮助信息");
        Console.WriteLine();
        Console.WriteLine("示例:");
        Console.WriteLine("  EquipAI.Simulator --host 192.168.1.100 --devices 10 --interval 5");
        Console.WriteLine("  EquipAI.Simulator -h localhost -p 1883 -d 3 -i 2 --duration 300");
    }

    /// <summary>
    /// 打印启动横幅
    /// </summary>
    private static void PrintBanner(SimulatorOptions options)
    {
        Console.WriteLine();
        Console.WriteLine("  ╔═══════════════════════════════════════════════╗");
        Console.WriteLine("  ║   EquipAI 工业设备遥测数据模拟器            ║");
        Console.WriteLine("  ║   Industrial Telemetry Data Simulator        ║");
        Console.WriteLine("  ╚═══════════════════════════════════════════════╝");
        Console.WriteLine();
        Console.WriteLine($"  MQTT 代理:   {options.BrokerHost}:{options.Port}");
        Console.WriteLine($"  租户 ID:     {options.TenantId}");
        Console.WriteLine($"  设备数量:    {options.DeviceCount}");
        Console.WriteLine($"  发送间隔:    {options.IntervalSeconds} 秒");
        Console.WriteLine($"  运行时长:    {(options.DurationSeconds.HasValue ? $"{options.DurationSeconds} 秒" : "无限")}");
        Console.WriteLine();
    }
}

/// <summary>
/// 模拟器命令行选项
/// </summary>
internal class SimulatorOptions
{
    /// <summary>MQTT 代理主机地址</summary>
    public string BrokerHost { get; set; } = "localhost";

    /// <summary>MQTT 代理端口</summary>
    public int Port { get; set; } = 1883;

    /// <summary>租户 ID</summary>
    public string TenantId { get; set; } = "11111111-1111-1111-1111-111111111111";

    /// <summary>模拟设备数量</summary>
    public int DeviceCount { get; set; } = 5;

    /// <summary>数据发送间隔（秒）</summary>
    public int IntervalSeconds { get; set; } = 10;

    /// <summary>运行时长（秒），null 表示无限运行</summary>
    public int? DurationSeconds { get; set; }

    /// <summary>是否显示帮助信息</summary>
    public bool ShowHelp { get; set; }
}

/// <summary>
/// 模拟设备信息
/// 每台设备有独立的基础参数，模拟不同类型和运行状态的工业设备
/// </summary>
internal class SimulatedDevice
{
    /// <summary>设备唯一标识</summary>
    public Guid Id { get; set; }

    /// <summary>设备名称</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>基础温度 (°C)</summary>
    public double BaseTemperature { get; set; }

    /// <summary>基础振动 (mm/s)</summary>
    public double BaseVibration { get; set; }

    /// <summary>基础压力 (bar)</summary>
    public double BasePressure { get; set; }

    /// <summary>基础湿度 (%)</summary>
    public double BaseHumidity { get; set; }

    /// <summary>基础转速 (RPM)</summary>
    public double BaseRpm { get; set; }
}

/// <summary>
/// 设备发送统计
/// </summary>
internal class DeviceSendStats
{
    /// <summary>已发送消息数</summary>
    public int SendCount { get; set; }

    /// <summary>最近一次遥测指标</summary>
    public Dictionary<string, double>? LastMetrics { get; set; }

    /// <summary>最近一次数据时间戳</summary>
    public string? LastTimestamp { get; set; }

    /// <summary>最近一次数据是否为异常值</summary>
    public bool IsAnomaly { get; set; }
}

/// <summary>
/// MQTT 遥测消息格式
/// 与后端 API 预期的 JSON 格式一致
/// </summary>
internal class TelemetryMessage
{
    /// <summary>数据采集时间戳 (ISO 8601 格式)</summary>
    public string Timestamp { get; set; } = string.Empty;

    /// <summary>数据质量标识: "good" 表示正常, "anomaly" 表示异常</summary>
    public string Quality { get; set; } = "good";

    /// <summary>遥测指标集合（温度、振动、压力、湿度、转速）</summary>
    public Dictionary<string, double> Metrics { get; set; } = new();
}