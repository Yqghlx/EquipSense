using EquipAI.Infrastructure.Messaging;

namespace EquipAI.Tests.Integration.Eventing;

/// <summary>
/// 生成真实 RabbitMQ 集成测试的连接配置。
/// </summary>
internal static class RabbitMqIntegrationTestConfiguration
{
    /// <summary>
    /// 真实测试默认使用的隔离 vhost，避免清理拓扑时触碰默认环境。
    /// </summary>
    internal const string DefaultVirtualHost = "/equipai_test";

    /// <summary>
    /// 根据进程环境或测试提供的变量集合创建 RabbitMQ 配置。
    /// </summary>
    /// <param name="environment">可选的变量集合；为空时读取当前进程环境。</param>
    /// <param name="maxRetryCount">单次测试总重试次数。</param>
    /// <param name="retryIntervalSeconds">重试间隔秒数。</param>
    /// <returns>RabbitMQ 测试连接配置。</returns>
    internal static RabbitMqOptions CreateOptions(
        IReadOnlyDictionary<string, string?>? environment = null,
        int maxRetryCount = 5,
        int retryIntervalSeconds = 1)
    {
        string? Read(string key) => environment is null
            ? Environment.GetEnvironmentVariable(key)
            : environment.TryGetValue(key, out var value) ? value : null;

        return new RabbitMqOptions
        {
            Host = Read("RABBITMQ_TEST_HOST") ?? "127.0.0.1",
            Port = int.TryParse(Read("RABBITMQ_TEST_PORT"), out var port) ? port : 5672,
            VirtualHost = Read("RABBITMQ_TEST_VHOST") ?? DefaultVirtualHost,
            Username = Read("RABBITMQ_TEST_USERNAME") ?? "equipai_test",
            Password = Read("RABBITMQ_TEST_PASSWORD") ?? "equipai_test_password",
            MaxRetryCount = maxRetryCount,
            RetryIntervalSeconds = retryIntervalSeconds,
            HandlerTimeoutSeconds = 10,
            PrefetchCount = 20,
        };
    }
}
