using System.Collections.Concurrent;
using EquipAI.Application.Alerts;
using EquipAI.Core.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;

namespace EquipAI.Tests.Unit.Alerts;

/// <summary>
/// 验证告警聚合状态在多个应用实例之间共享，并在共享存储不可用时安全降级。
/// </summary>
public class AlertAggregatorDistributedStateTests
{
    [Fact]
    public async Task 两个聚合器共享状态时_计数应保持全局一致()
    {
        var store = new InMemoryAggregationStateStore();
        var firstInstance = new AlertAggregator(store, NullLogger<AlertAggregator>.Instance);
        var secondInstance = new AlertAggregator(store, NullLogger<AlertAggregator>.Instance);
        var deviceId = Guid.NewGuid();
        var ruleId = Guid.NewGuid();

        var first = await firstInstance.EvaluateAsync(deviceId, ruleId, "temperature");
        var second = await secondInstance.EvaluateAsync(deviceId, ruleId, "temperature");
        var third = await firstInstance.EvaluateAsync(deviceId, ruleId, "temperature");
        var fourth = await secondInstance.EvaluateAsync(deviceId, ruleId, "temperature");

        first.Should().Be(new AlertAggregationDecision(true, false, false));
        second.Should().Be(new AlertAggregationDecision(false, true, false));
        third.Should().Be(new AlertAggregationDecision(false, true, false));
        fourth.Should().Be(new AlertAggregationDecision(false, false, true));
    }

    [Fact]
    public async Task 共享状态存储失败时_应回退到本地窗口而不丢失告警()
    {
        var firstCall = true;
        var store = new FailingAggregationStateStore(() =>
        {
            if (firstCall)
            {
                firstCall = false;
                throw new InvalidOperationException("Redis 暂不可用");
            }

            throw new InvalidOperationException("Redis 仍不可用");
        });
        var aggregator = new AlertAggregator(store, NullLogger<AlertAggregator>.Instance);
        var deviceId = Guid.NewGuid();
        var ruleId = Guid.NewGuid();

        var first = await aggregator.EvaluateAsync(deviceId, ruleId, "temperature");
        var second = await aggregator.EvaluateAsync(deviceId, ruleId, "temperature");

        first.Should().Be(new AlertAggregationDecision(true, false, false));
        second.Should().Be(new AlertAggregationDecision(false, true, false));
    }

    private sealed class InMemoryAggregationStateStore : IAlertAggregationStateStore
    {
        private readonly ConcurrentDictionary<string, long> _counts = new();

        public Task<long> IncrementAsync(string key, TimeSpan window, CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            return Task.FromResult(_counts.AddOrUpdate(key, 1, (_, count) => count + 1));
        }
    }

    private sealed class FailingAggregationStateStore : IAlertAggregationStateStore
    {
        private readonly Action _onIncrement;

        public FailingAggregationStateStore(Action onIncrement)
        {
            _onIncrement = onIncrement;
        }

        public Task<long> IncrementAsync(string key, TimeSpan window, CancellationToken cancellationToken = default)
        {
            _onIncrement();
            return Task.FromResult(0L);
        }
    }
}
