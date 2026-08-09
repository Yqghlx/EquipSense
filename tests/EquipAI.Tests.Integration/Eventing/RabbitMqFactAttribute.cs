namespace EquipAI.Tests.Integration.Eventing;

/// <summary>
/// 仅在显式启用真实 RabbitMQ 时运行的集成测试标记。
/// </summary>
public sealed class RabbitMqFactAttribute : FactAttribute
{
    /// <summary>
    /// 初始化测试标记；本地未启用时安全跳过，不尝试连接或修改 broker。
    /// </summary>
    public RabbitMqFactAttribute()
    {
        if (!string.Equals(
                Environment.GetEnvironmentVariable("RUN_RABBITMQ_INTEGRATION_TESTS"),
                "true",
                StringComparison.OrdinalIgnoreCase))
        {
            Skip = "设置 RUN_RABBITMQ_INTEGRATION_TESTS=true 后运行 RabbitMQ 集成测试";
        }
    }
}
