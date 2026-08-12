namespace EquipAI.Infrastructure.Seeding;

/// <summary>
/// 控制演示/验收业务数据是否参与种子初始化。
/// </summary>
public static class DemoDataSeedingPolicy
{
    /// <summary>
    /// 演示数据开关对应的环境变量名称。
    /// </summary>
    public const string EnvironmentVariableName = "SEED_DEMO_DATA";

    /// <summary>
    /// 判断当前环境是否允许播种演示数据。
    /// 非生产环境保持开发和测试的开箱即用体验；生产环境必须显式设置 true、1 或 full。
    /// </summary>
    /// <param name="isProduction">是否为 Production 环境。</param>
    /// <param name="configuredValue">环境变量的原始值。</param>
    /// <returns>允许播种时返回 true，否则返回 false。</returns>
    public static bool ShouldSeedDemoData(bool isProduction, string? configuredValue)
    {
        if (!isProduction)
            return true;

        var normalizedValue = configuredValue?.Trim();
        return string.Equals(normalizedValue, "true", StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalizedValue, "full", StringComparison.OrdinalIgnoreCase)
            || normalizedValue == "1";
    }

    /// <summary>
    /// 判断是否请求完整演示数据集。
    /// true/1 只保留现有的最小验收种子，full 才会额外创建 10 台设备、遥测、告警和工单。
    /// </summary>
    /// <param name="configuredValue">环境变量的原始值。</param>
    /// <returns>配置为 full（忽略大小写和首尾空格）时返回 true。</returns>
    public static bool IsFullDemoData(string? configuredValue)
    {
        return string.Equals(configuredValue?.Trim(), "full", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// 校验 Production 下启用完整演示数据时是否明确处于隔离验收环境。
    /// 应用层也执行该门禁，防止直接调用 Compose 绕过部署脚本后污染真实租户。
    /// </summary>
    /// <param name="isProduction">是否为 Production 环境。</param>
    /// <param name="configuredValue">演示数据开关原始值。</param>
    /// <param name="isolatedE2eValue">隔离验收授权原始值。</param>
    public static void EnsureFullDemoDataAllowed(
        bool isProduction,
        string? configuredValue,
        string? isolatedE2eValue)
    {
        if (!isProduction || !IsFullDemoData(configuredValue))
            return;

        if (!string.Equals(isolatedE2eValue?.Trim(), "true", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Production 禁止在未授权隔离环境中启用 {EnvironmentVariableName}=full；请设置 EQUIPAI_ISOLATED_E2E=true 仅用于临时隔离验收。");
        }
    }
}
