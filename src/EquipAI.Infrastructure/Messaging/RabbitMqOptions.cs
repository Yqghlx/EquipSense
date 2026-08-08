namespace EquipAI.Infrastructure.Messaging;

/// <summary>
/// RabbitMQ 事件总线配置选项
///
/// 设计取舍：与 MQTT 配置（MqttOptions）保持一致，全部通过 IConfiguration 绑定，
/// 支持环境变量覆盖（EventBus__RabbitMq__Host 等双下划线语法）。
///
/// 容器名 / 端口 / 账号与 docker/docker-compose.yml 中 rabbitmq 服务保持一致，
/// 生产部署需通过 .env 覆盖默认密码（RABBITMQ_PASSWORD）。
/// </summary>
public sealed class RabbitMqOptions
{
    /// <summary>
    /// RabbitMQ broker 主机名。容器内互调用用服务名（rabbitmq），
    /// 本地开发用 localhost。
    /// </summary>
    public string Host { get; set; } = "localhost";

    /// <summary>
    /// AMQP 端口（非 TLS）。容器映射到宿主 5672。
    /// </summary>
    public int Port { get; set; } = 5672;

    /// <summary>
    /// 虚拟主机，多租户隔离用。单租户部署用默认 "/" 即可。
    /// </summary>
    public string VirtualHost { get; set; } = "/";

    /// <summary>
    /// 用户名。生产环境必须通过环境变量覆盖（与 RabbitMQ 容器配置一致）。
    /// </summary>
    public string Username { get; set; } = "guest";

    /// <summary>
    /// 密码。生产环境必须通过环境变量覆盖（RABBITMQ_PASSWORD）。
    /// </summary>
    public string Password { get; set; } = "guest";

    /// <summary>
    /// 连接心跳（秒）。保持长连接活性，及时发现半开连接。
    /// 默认 30s 与 RabbitMQ 官方推荐一致。
    /// </summary>
    public ushort HeartbeatSeconds { get; set; } = 30;

    /// <summary>
    /// 连接自动恢复。RabbitMQ.Client 6.x 默认启用，这里显式标记便于排查。
    /// </summary>
    public bool AutomaticRecoveryEnabled { get; set; } = true;

    /// <summary>
    /// 消费预取数。限制未确认消息数，避免单个消费者被压垮。
    /// 业务事件吞吐不高（告警/工单/分析，非遥测），50 足够且留余量。
    /// </summary>
    public ushort PrefetchCount { get; set; } = 50;

    /// <summary>
    /// 单个事件处理超时（秒）。超时后消息 nack（不重排队，进入重试或死信）。
    /// 默认 120s：AI 根因分析、工单创建等可能较慢。
    /// </summary>
    public int HandlerTimeoutSeconds { get; set; } = 120;

    /// <summary>
    /// 最大重试次数（含首次）。超过后消息进入死信队列。
    /// x-delivery-limit 由队列声明时设置，这里用于记录意图，实际重试由 DLX + TTL 循环实现。
    /// </summary>
    public int MaxRetryCount { get; set; } = 5;

    /// <summary>
    /// 重试间隔（秒）。通过重试队列的 x-message-ttl 实现：消息 nack 后进入重试队列，
    /// TTL 到期后通过 DLX 回到主队列，形成延迟重试。
    /// </summary>
    public int RetryIntervalSeconds { get; set; } = 30;
}
