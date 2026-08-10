using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.HttpOverrides;
using AspNetIpNetwork = Microsoft.AspNetCore.HttpOverrides.IPNetwork;

namespace EquipAI.WebAPI.Extensions;

/// <summary>
/// 反向代理转发头配置。
/// </summary>
public static class ForwardedHeadersConfiguration
{
    /// <summary>
    /// 可信反向代理网段配置键。多个网段使用英文逗号分隔。
    /// </summary>
    public const string TrustedProxyNetworksKey = "TRUSTED_PROXY_NETWORKS";

    /// <summary>
    /// Docker bridge 网络常用的私有地址范围。
    /// </summary>
    private const string DefaultTrustedProxyNetworks = "172.16.0.0/12";

    /// <summary>
    /// 根据配置注册 X-Forwarded-For/X-Forwarded-Proto 处理器。
    /// 仅在明确声明应用位于反向代理之后时启用，并限制只接受可信网段的请求头，
    /// 避免直接访问后端时伪造客户端 IP 绕过登录限流或污染审计来源。
    /// </summary>
    /// <param name="services">服务集合</param>
    /// <param name="configuration">应用配置</param>
    /// <returns>原服务集合</returns>
    public static IServiceCollection AddTrustedForwardedHeaders(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        if (!IsEnabled(configuration["BEHIND_PROXY"]))
        {
            return services;
        }

        var trustedNetworks = ParseTrustedProxyNetworks(configuration[TrustedProxyNetworksKey]);
        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            options.ForwardLimit = 1;
            options.RequireHeaderSymmetry = true;
            options.KnownProxies.Clear();
            options.KnownNetworks.Clear();
            foreach (var network in trustedNetworks)
            {
                options.KnownNetworks.Add(network);
            }
        });

        return services;
    }

    /// <summary>
    /// 解析可信代理网段。
    /// </summary>
    /// <param name="rawValue">逗号分隔的 CIDR 网段；为空时使用 Docker 默认网段</param>
    /// <returns>解析后的网段列表</returns>
    /// <exception cref="InvalidOperationException">配置不是有效的 CIDR 网段</exception>
    public static IReadOnlyList<AspNetIpNetwork> ParseTrustedProxyNetworks(string? rawValue)
    {
        var value = string.IsNullOrWhiteSpace(rawValue)
            ? DefaultTrustedProxyNetworks
            : rawValue;

        var networks = new List<AspNetIpNetwork>();
        foreach (var item in value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            try
            {
                networks.Add(AspNetIpNetwork.Parse(item.AsSpan()));
            }
            catch (Exception ex) when (ex is FormatException or ArgumentOutOfRangeException)
            {
                throw new InvalidOperationException(
                    $"{TrustedProxyNetworksKey} 必须是逗号分隔的 CIDR 网段，例如 172.16.0.0/12",
                    ex);
            }
        }

        if (networks.Count == 0)
        {
            throw new InvalidOperationException(
                $"{TrustedProxyNetworksKey} 至少需要配置一个 CIDR 网段");
        }

        return networks;
    }

    /// <summary>
    /// 判断配置是否显式启用反向代理模式。
    /// </summary>
    /// <param name="value">配置值</param>
    /// <returns>是否启用</returns>
    private static bool IsEnabled(string? value) =>
        bool.TryParse(value, out var enabled) && enabled;
}
