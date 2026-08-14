using Xunit;

namespace EquipAI.Tests.Unit.EdgeGateway;

/// <summary>
/// 仅在显式启用协议集成测试时发现测试用例。
/// </summary>
[AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
internal sealed class ProtocolFactAttribute : FactAttribute
{
    /// <summary>
    /// 根据当前进程环境决定是否在测试发现阶段跳过。
    /// </summary>
    public ProtocolFactAttribute()
        : this(ProtocolIntegrationTestEnvironment.IsEnabled())
    {
    }

    /// <summary>
    /// 提供可测试的启用状态构造函数，避免测试修改进程环境。
    /// </summary>
    /// <param name="enabled">是否显式启用协议集成测试。</param>
    internal ProtocolFactAttribute(bool enabled)
    {
        if (!enabled)
        {
            Skip = $"需要设置 {ProtocolIntegrationTestEnvironment.RunEnvironmentVariable}=true。";
        }
    }
}
