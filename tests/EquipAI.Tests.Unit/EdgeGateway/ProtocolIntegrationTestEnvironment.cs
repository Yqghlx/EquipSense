using Xunit.Sdk;

namespace EquipAI.Tests.Unit.EdgeGateway;

/// <summary>
/// 集中管理工业协议集成测试的启用、端点和 fail-closed 边界。
/// </summary>
internal static class ProtocolIntegrationTestEnvironment
{
    /// <summary>
    /// 显式启用真实工业协议测试的环境变量名称。
    /// </summary>
    internal const string RunEnvironmentVariable = "RUN_PROTOCOL_INTEGRATION_TESTS";

    /// <summary>
    /// 判断协议集成测试是否被显式启用。
    /// </summary>
    /// <param name="environment">可选的测试环境变量集合；为空时读取当前进程环境。</param>
    /// <returns>只有配置值为 true（忽略大小写）时返回 true。</returns>
    internal static bool IsEnabled(IReadOnlyDictionary<string, string?>? environment = null)
    {
        var value = ReadValue(RunEnvironmentVariable, environment);
        return string.Equals(value?.Trim(), "true", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// 读取协议测试端点，空值或空白值使用安全默认值。
    /// </summary>
    /// <param name="key">端点环境变量名称。</param>
    /// <param name="defaultValue">仓库 Simulator 的默认端点。</param>
    /// <param name="environment">可选的测试环境变量集合；为空时读取当前进程环境。</param>
    /// <returns>显式非空端点或默认值。</returns>
    internal static string ReadEndpoint(
        string key,
        string defaultValue,
        IReadOnlyDictionary<string, string?>? environment = null)
    {
        var value = ReadValue(key, environment);
        return string.IsNullOrWhiteSpace(value) ? defaultValue : value;
    }

    /// <summary>
    /// 按测试启用状态处理模拟器不可用场景。
    /// </summary>
    /// <param name="protocol">协议名称，用于生成可读的跳过或失败原因。</param>
    /// <param name="enabled">是否显式启用了协议集成测试。</param>
    /// <param name="available">模拟器端点是否可达。</param>
    internal static void EnsureAvailable(string protocol, bool enabled, bool available)
    {
        if (available)
        {
            return;
        }

        if (enabled)
        {
            throw new InvalidOperationException(
                $"{protocol} 协议集成测试已显式启用，但仓库 Simulator 不可用。");
        }

        throw SkipException.ForSkip(
            $"{protocol} 协议集成测试需要仓库 Simulator；未设置 {RunEnvironmentVariable}=true。");
    }

    /// <summary>
    /// 从显式字典或当前进程读取单个环境值。
    /// </summary>
    private static string? ReadValue(
        string key,
        IReadOnlyDictionary<string, string?>? environment)
    {
        return environment is null
            ? Environment.GetEnvironmentVariable(key)
            : environment.TryGetValue(key, out var value) ? value : null;
    }
}
