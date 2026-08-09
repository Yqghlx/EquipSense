namespace EquipAI.Infrastructure.Messaging;

/// <summary>
/// 向就绪检查暴露 RabbitMQ 事件总线的只读连接状态。
/// </summary>
public interface IRabbitMqConnectionState
{
    /// <summary>
    /// 获取连接、发布通道和全部消费者是否均可用。
    /// </summary>
    bool IsReady { get; }

    /// <summary>
    /// 获取不包含凭证的状态说明。
    /// </summary>
    string StatusDescription { get; }
}
