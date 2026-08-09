namespace EquipAI.Infrastructure.Messaging;

/// <summary>
/// 事务 Outbox 分发配置。
/// </summary>
public sealed class OutboxOptions
{
    /// <summary>
    /// 是否启用后台分发器。
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// 轮询间隔（秒）。
    /// </summary>
    public int PollIntervalSeconds { get; set; } = 1;

    /// <summary>
    /// 每轮最多领取的消息数量。
    /// </summary>
    public int BatchSize { get; set; } = 50;

    /// <summary>
    /// 单条消息分发租约时长（秒）。
    /// </summary>
    public int LeaseSeconds { get; set; } = 60;

    /// <summary>
    /// 发布失败的最大退避时间（秒）。
    /// </summary>
    public int MaxBackoffSeconds { get; set; } = 300;

    /// <summary>
    /// 已发布消息的保留天数，便于审计和问题追查。
    /// </summary>
    public int RetentionDays { get; set; } = 7;
}

/// <summary>
/// Outbox 重试退避策略。
/// </summary>
public static class OutboxRetryPolicy
{
    /// <summary>
    /// 计算指数退避时长，结果始终受最大值限制。
    /// </summary>
    /// <param name="attemptCount">本次发布尝试次数</param>
    /// <param name="maxBackoffSeconds">最大退避秒数</param>
    /// <returns>下一次重试前等待时间</returns>
    public static TimeSpan GetDelay(int attemptCount, int maxBackoffSeconds)
    {
        var safeAttempt = Math.Clamp(attemptCount, 1, 30);
        var safeMax = Math.Max(1, maxBackoffSeconds);
        var seconds = Math.Min(Math.Pow(2, safeAttempt - 1), safeMax);
        return TimeSpan.FromSeconds(seconds);
    }
}
