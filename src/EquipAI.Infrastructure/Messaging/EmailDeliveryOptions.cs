namespace EquipAI.Infrastructure.Messaging;

/// <summary>
/// 告警邮件投递队列配置。
/// </summary>
public sealed class EmailDeliveryOptions
{
    /// <summary>配置节名称。</summary>
    public const string SectionName = "EmailDelivery";

    /// <summary>
    /// 最短租约秒数。SMTP 单次发送硬超时为 10 秒，保留额外时间给数据库读取与状态确认。
    /// </summary>
    public const int MinimumLeaseSeconds = 30;

    /// <summary>是否启用邮件投递 worker。</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>worker 轮询间隔（秒）。</summary>
    public int PollIntervalSeconds { get; set; } = 5;

    /// <summary>每轮最多领取的任务数。</summary>
    public int BatchSize { get; set; } = 50;

    /// <summary>任务租约时长（秒）。</summary>
    public int LeaseSeconds { get; set; } = 60;

    /// <summary>普通失败允许的最大尝试次数。</summary>
    public int MaxAttempts { get; set; } = 5;

    /// <summary>退避上限（秒）。</summary>
    public int MaxBackoffSeconds { get; set; } = 300;

    /// <summary>已结束任务保留天数。</summary>
    public int RetentionDays { get; set; } = 90;
}
