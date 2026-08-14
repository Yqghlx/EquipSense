using EquipAI.Simulator;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Simulator;

/// <summary>
/// 验证 Simulator 的命令行运行模式识别。
/// </summary>
public sealed class SimulatorCommandLineTests
{
    /// <summary>
    /// 验收脚本传入 headless 参数时，Simulator 必须保持运行直到收到停止信号。
    /// </summary>
    [Fact]
    public void Headless参数应启用非交互模式()
    {
        SimulatorCommandLine.IsHeadless(["--headless"])
            .Should().BeTrue();
    }

    /// <summary>
    /// 未传入 headless 参数时保留本地按 Enter 退出的交互行为。
    /// </summary>
    [Fact]
    public void 未传入Headless参数时保持交互模式()
    {
        SimulatorCommandLine.IsHeadless(["--verbose"])
            .Should().BeFalse();
    }
}
