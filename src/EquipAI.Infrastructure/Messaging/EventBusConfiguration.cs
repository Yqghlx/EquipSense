using Microsoft.Extensions.Configuration;

namespace EquipAI.Infrastructure.Messaging;

/// <summary>
/// 支持的事件总线实现。
/// </summary>
public enum EventBusProvider
{
    /// <summary>
    /// 进程内事件总线，仅适用于开发、测试和显式授权的生产应急降级。
    /// </summary>
    InMemory,

    /// <summary>
    /// RabbitMQ 持久化事件总线。
    /// </summary>
    RabbitMQ,
}

/// <summary>
/// 统一解析并校验事件总线配置，防止拼写错误或弱配置静默降级。
/// </summary>
public static class EventBusConfiguration
{
    /// <summary>
    /// 解析事件总线实现；未配置时保持开发环境兼容性，默认使用 InMemory。
    /// </summary>
    /// <param name="configuration">应用配置。</param>
    /// <returns>确定的事件总线实现。</returns>
    /// <exception cref="InvalidOperationException">配置值不受支持。</exception>
    public static EventBusProvider ResolveProvider(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        var raw = configuration["EventBus:Provider"];
        if (string.IsNullOrWhiteSpace(raw)) return EventBusProvider.InMemory;
        if (raw.Equals("InMemory", StringComparison.OrdinalIgnoreCase)) return EventBusProvider.InMemory;
        if (raw.Equals("RabbitMQ", StringComparison.OrdinalIgnoreCase)) return EventBusProvider.RabbitMQ;

        throw new InvalidOperationException(
            $"不支持的事件总线 Provider：{raw}，仅允许 InMemory 或 RabbitMQ");
    }

    /// <summary>
    /// 根据运行环境验证事件总线安全边界和 RabbitMQ 参数。
    /// </summary>
    /// <param name="configuration">应用配置。</param>
    /// <param name="environmentName">运行环境名称。</param>
    /// <exception cref="InvalidOperationException">配置不满足运行要求。</exception>
    public static void ValidateForEnvironment(IConfiguration configuration, string environmentName)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentException.ThrowIfNullOrWhiteSpace(environmentName);

        var provider = ResolveProvider(configuration);
        var isProduction = environmentName.Equals("Production", StringComparison.OrdinalIgnoreCase);
        if (isProduction
            && provider == EventBusProvider.InMemory
            && !configuration.GetValue("EventBus:AllowInMemoryInProduction", false))
        {
            throw new InvalidOperationException(
                "生产环境禁止使用 InMemory；紧急降级需显式设置 EventBus:AllowInMemoryInProduction=true");
        }

        if (provider != EventBusProvider.RabbitMQ) return;

        var options = new RabbitMqOptions();
        configuration.GetSection("EventBus:RabbitMq").Bind(options);
        ValidateRabbitMq(options, isProduction);
    }

    private static void ValidateRabbitMq(RabbitMqOptions options, bool isProduction)
    {
        RequireText(options.Host, nameof(options.Host));
        RequireRange(options.Port, 1, 65535, nameof(options.Port));
        RequireText(options.VirtualHost, nameof(options.VirtualHost));
        RequireText(options.Username, nameof(options.Username));
        RequireText(options.Password, nameof(options.Password));
        RequireRange(options.HeartbeatSeconds, 1, ushort.MaxValue, nameof(options.HeartbeatSeconds));
        RequireRange(options.ConnectionTimeoutSeconds, 1, 120, nameof(options.ConnectionTimeoutSeconds));
        RequireRange(options.PrefetchCount, 1, ushort.MaxValue, nameof(options.PrefetchCount));
        RequireRange(options.HandlerTimeoutSeconds, 1, 3600, nameof(options.HandlerTimeoutSeconds));
        RequireRange(options.MaxRetryCount, 1, 100, nameof(options.MaxRetryCount));
        RequireRange(options.RetryIntervalSeconds, 1, 86400, nameof(options.RetryIntervalSeconds));

        if (!isProduction) return;

        if (IsPlaceholder(options.Host))
        {
            throw new InvalidOperationException("生产环境 RabbitMQ Host 仍是未解析占位符");
        }

        if (!options.AutomaticRecoveryEnabled)
        {
            throw new InvalidOperationException(
                "生产环境 RabbitMQ AutomaticRecoveryEnabled 必须为 true");
        }

        if (options.Username.Equals("guest", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("生产环境 RabbitMQ Username 禁止使用 guest");
        }

        if (options.Password.Equals("guest", StringComparison.OrdinalIgnoreCase)
            || options.Password.Length < 16)
        {
            throw new InvalidOperationException(
                "生产环境 RabbitMQ Password 必须至少 16 个字符且不能使用默认值");
        }
    }

    private static void RequireText(string? value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"RabbitMQ {fieldName} 不能为空");
        }
    }

    private static void RequireRange(int value, int minimum, int maximum, string fieldName)
    {
        if (value < minimum || value > maximum)
        {
            throw new InvalidOperationException(
                $"RabbitMQ {fieldName} 必须在 {minimum} 到 {maximum} 之间");
        }
    }

    private static bool IsPlaceholder(string value) =>
        value.Equals("SET_VIA_ENVIRONMENT", StringComparison.OrdinalIgnoreCase)
        || value.Equals("CHANGE_ME", StringComparison.OrdinalIgnoreCase)
        || value.Contains('<', StringComparison.Ordinal)
        || value.Contains('>', StringComparison.Ordinal);
}
