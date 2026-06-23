using EquipAI.Application.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Xunit;

namespace EquipAI.Tests.Unit.Data;

/// <summary>
/// TimescaleDB 遥测保留策略回归测试
///
/// 守护一个易被破坏的不变量：TimescaleDB 的全局 drop_chunks 保留策略（超级表级、无差别丢弃）
/// 必须不短于任何套餐承诺的 DataRetentionDays。否则长期套餐（Enterprise=365、Professional=180）
/// 的遥测会在全局阈值处被提前删除，按套餐承诺的长期历史趋势分析静默失效——客户付费的长期数据能力
/// 实际拿不到。该缺陷无需真实 TimescaleDB 即可由"两个常量/派生值的大小关系"暴露。
/// </summary>
public class TimescaleDbRetentionTests
{
    /// <summary>
    /// 全局保留期（drop_chunks 阈值）必须 >= 最大套餐保留期。
    /// 历史缺陷：曾硬编码 90 天，导致 Enterprise（365 天）、Professional（180 天）被截断到 90 天。
    /// </summary>
    [Fact]
    public void 全局遥测保留期_不得小于最大套餐保留期()
    {
        TimescaleDbSetup.MaxRetentionDays.Should().BeGreaterThanOrEqualTo(
            SubscriptionService.MaxPlanRetentionDays,
            "TimescaleDB 的全局 drop_chunks 保留策略是超级表级无差别丢弃，无法按租户区分。" +
            "若该阈值小于某套餐的 DataRetentionDays，则该套餐承诺的长期遥测会被提前删除。" +
            "当前最大套餐保留期为 Enterprise 的 {0} 天，全局阈值必须 >= 该值。" +
            "短保留期套餐由 TelemetryCleanupService 按租户精细 DELETE，无需全局策略兜底。",
            SubscriptionService.MaxPlanRetentionDays);
    }

    /// <summary>
    /// 当前各套餐保留期契约（显式钉死，防止有人误改 PlanLimits 中的保留期而未同步全局策略）。
    /// </summary>
    [Fact]
    public void 套餐保留期_应符合当前产品契约()
    {
        // Enterprise 的 365 天保留是高端套餐的核心卖点，断言其未被悄悄缩减
        SubscriptionService.MaxPlanRetentionDays.Should().Be(365,
            "Enterprise 套餐承诺 365 天数据保留，是长期历史趋势分析的基础");
    }
}
