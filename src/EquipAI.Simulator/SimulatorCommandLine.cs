namespace EquipAI.Simulator;

/// <summary>
/// 解析 Simulator 的运行模式参数。
/// </summary>
public static class SimulatorCommandLine
{
    /// <summary>
    /// 判断是否以非交互模式运行。
    /// </summary>
    /// <param name="args">进程命令行参数。</param>
    /// <returns>包含 `--headless`（忽略大小写）时返回 true。</returns>
    public static bool IsHeadless(IReadOnlyCollection<string>? args) =>
        args?.Any(argument => string.Equals(argument, "--headless", StringComparison.OrdinalIgnoreCase)) == true;
}
