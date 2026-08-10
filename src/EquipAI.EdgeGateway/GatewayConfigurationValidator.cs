namespace EquipAI.EdgeGateway;

/// <summary>
/// 边缘网关启动配置校验器。
/// 生产环境必须在启动阶段拒绝不完整配置，避免容器保持运行但无法注册、上传或持久化数据。
/// </summary>
public static class GatewayConfigurationValidator
{
    /// <summary>
    /// 校验边缘网关配置。
    /// </summary>
    /// <param name="environmentName">宿主环境名称。</param>
    /// <param name="options">网关配置。</param>
    /// <exception cref="InvalidOperationException">生产配置不完整或不安全时抛出。</exception>
    public static void Validate(string environmentName, GatewayOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        // 开发环境允许使用 appsettings.json 的 localhost 和相对缓存路径，便于本地调试。
        // 生产环境则必须显式绑定租户和持久化目录，否则网关可能“健康但不工作”。
        if (!string.Equals(environmentName, "Production", StringComparison.OrdinalIgnoreCase))
            return;

        if (string.IsNullOrWhiteSpace(options.Id))
            throw new InvalidOperationException("生产环境必须配置 Gateway:Id");

        if (!Guid.TryParse(options.TenantId, out var tenantId) || tenantId == Guid.Empty)
        {
            throw new InvalidOperationException(
                "生产环境必须配置有效的 Gateway:TenantId（UUID），否则网关无法按租户注册和拉取设备配置");
        }

        if (string.IsNullOrWhiteSpace(options.BackendUrl))
            throw new InvalidOperationException("生产环境必须配置 Gateway:BackendUrl");

        if (string.IsNullOrWhiteSpace(options.AuthKey))
            throw new InvalidOperationException("生产环境必须配置 Gateway:AuthKey");

        if (string.IsNullOrWhiteSpace(options.BufferPath) || !Path.IsPathRooted(options.BufferPath))
        {
            throw new InvalidOperationException(
                "生产环境 Gateway:BufferPath 必须是绝对路径，并指向持久化卷（例如 /data/buffer.db）");
        }
    }
}
