namespace EquipAI.EdgeGateway;

/// <summary>
/// 边缘网关入口点。
/// 当前为骨架阶段，后续将集成 Generic Host、协议适配器与数据管线。
/// </summary>
public class Program
{
    public static async Task Main(string[] args)
    {
        Console.WriteLine("EquipAI 边缘网关启动中...");
        Console.WriteLine("当前为骨架模式，等待后续集成。按 Ctrl+C 退出。");

        using var cts = new CancellationTokenSource();
        Console.CancelKeyPress += (_, e) =>
        {
            e.Cancel = true;
            cts.Cancel();
        };

        await Task.Delay(Timeout.Infinite, cts.Token)
            .ConfigureAwait(false);
    }
}
