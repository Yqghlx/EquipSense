using EquipAI.Application.Alerts;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Alerts;

/// <summary>
/// 验证同一设备、规则和指标的告警状态变更按顺序执行，避免并发遥测在创建与更新之间产生重复 Active 告警。
/// </summary>
public class AlertEvaluationConcurrencyGateTests
{
    [Fact]
    public async Task 同一告警键_并发进入时后续调用必须等待前一个调用释放()
    {
        var gate = new AlertEvaluationConcurrencyGate();
        var firstEntered = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var secondEntered = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var releaseFirst = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);

        var first = Task.Run(async () =>
        {
            await using var lease = await gate.EnterAsync("tenant/device/rule/temperature");
            firstEntered.SetResult();
            await releaseFirst.Task;
        });

        await firstEntered.Task.WaitAsync(TimeSpan.FromSeconds(2));

        var second = Task.Run(async () =>
        {
            await using var lease = await gate.EnterAsync("tenant/device/rule/temperature");
            secondEntered.SetResult();
        });

        var completedBeforeRelease = await Task.WhenAny(
            secondEntered.Task,
            Task.Delay(TimeSpan.FromMilliseconds(100)));
        completedBeforeRelease.Should().NotBe(secondEntered.Task);

        releaseFirst.SetResult();
        await Task.WhenAll(first, second);
        secondEntered.Task.IsCompletedSuccessfully.Should().BeTrue();
    }

    [Fact]
    public async Task 不同告警键_可以并行进入()
    {
        var gate = new AlertEvaluationConcurrencyGate();
        var firstEntered = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var secondEntered = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var release = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);

        async Task RunAsync(string key, TaskCompletionSource entered)
        {
            await using var lease = await gate.EnterAsync(key);
            entered.SetResult();
            await release.Task;
        }

        var first = RunAsync("tenant/device-a/rule/temperature", firstEntered);
        var second = RunAsync("tenant/device-b/rule/temperature", secondEntered);

        await Task.WhenAll(
            firstEntered.Task.WaitAsync(TimeSpan.FromSeconds(2)),
            secondEntered.Task.WaitAsync(TimeSpan.FromSeconds(2)));

        first.IsCompleted.Should().BeFalse();
        second.IsCompleted.Should().BeFalse();

        release.SetResult();
        await Task.WhenAll(first, second);
    }
}
