using System.Net;
using System.Net.Sockets;
using Microsoft.Extensions.Configuration;

namespace EquipAI.Application.Services;

/// <summary>
/// 网关后端代理目标策略。
///
/// 网关地址来自数据库或心跳请求，不能直接拼接到后端 HTTP 请求中；
/// 该策略同时执行精确白名单、端口格式和危险地址校验，降低 SSRF、云元数据读取和连接资源耗尽风险。
/// </summary>
public sealed class GatewayEndpointPolicy
{
    private static readonly HashSet<string> BlockedMetadataHostNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "metadata",
        "metadata.google.internal",
        "instance-data",
    };

    private readonly HashSet<string> _allowedHosts;

    /// <summary>
    /// 从 Gateway:AllowedHosts 读取精确主机白名单。
    /// 支持环境变量传入一个逗号分隔值，例如 Gateway__AllowedHosts__0=edgegateway,10.20.0.15。
    /// </summary>
    public GatewayEndpointPolicy(IConfiguration configuration)
    {
        var configuredHosts = configuration
            .GetSection("Gateway:AllowedHosts")
            .Get<string[]>()
            ?? [];

        _allowedHosts = configuredHosts
            .SelectMany(value => value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .Select(NormalizeHost)
            .Where(host => !string.IsNullOrEmpty(host) && host != "*")
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    /// <summary>
    /// 校验主机和端口是否允许作为网关代理目标。
    /// </summary>
    public bool IsAllowed(string? host, int port, out string reason)
    {
        var normalizedHost = NormalizeHost(host);
        if (string.IsNullOrEmpty(normalizedHost)
            || Uri.CheckHostName(normalizedHost) == UriHostNameType.Unknown)
        {
            reason = "网关主机名格式无效";
            return false;
        }

        if (port is < 1 or > 65535)
        {
            reason = "网关端口必须在 1-65535 范围内";
            return false;
        }

        if (BlockedMetadataHostNames.Contains(normalizedHost))
        {
            reason = "网关主机名命中云元数据地址黑名单";
            return false;
        }

        if (IPAddress.TryParse(normalizedHost, out var address) && IsDangerousAddress(address))
        {
            reason = "网关地址不能指向本机、未指定、链路本地或组播地址";
            return false;
        }

        // 开发/测试未配置白名单时保留非危险地址的本地联调能力；生产启动校验会强制要求非空白名单。
        if (_allowedHosts.Count > 0 && !_allowedHosts.Contains(normalizedHost))
        {
            reason = "网关主机不在 Gateway:AllowedHosts 白名单中";
            return false;
        }

        reason = string.Empty;
        return true;
    }

    /// <summary>
    /// 在真正发起请求前解析 DNS，并再次阻断解析到危险地址的主机。
    /// 允许 RFC1918 工业内网地址，但拒绝回环、链路本地和未指定地址。
    /// </summary>
    public async Task<bool> IsResolvedEndpointAllowedAsync(
        string? host,
        int port,
        CancellationToken cancellationToken = default)
    {
        if (!IsAllowed(host, port, out _))
            return false;

        var normalizedHost = NormalizeHost(host);
        if (IPAddress.TryParse(normalizedHost, out var literalAddress))
            return !IsDangerousAddress(literalAddress);

        try
        {
            var addresses = await Dns.GetHostAddressesAsync(normalizedHost, cancellationToken);
            return addresses.Length > 0 && addresses.All(address => !IsDangerousAddress(address));
        }
        catch (SocketException)
        {
            return false;
        }
    }

    /// <summary>
    /// 规范化主机名，去除末尾点并统一大小写；不接受 URL、路径或端口拼接值。
    /// </summary>
    private static string NormalizeHost(string? host)
        => host?.Trim().TrimEnd('.').ToLowerInvariant() ?? string.Empty;

    /// <summary>
    /// 判断地址是否属于不应由后端代理访问的本机/基础设施保留范围。
    /// </summary>
    private static bool IsDangerousAddress(IPAddress address)
    {
        if (IPAddress.IsLoopback(address)
            || IPAddress.Any.Equals(address)
            || IPAddress.IPv6Any.Equals(address)
            || address.IsIPv6LinkLocal
            || address.IsIPv6Multicast
            || address.IsIPv6SiteLocal)
        {
            return true;
        }

        var ipv4 = address.IsIPv4MappedToIPv6 ? address.MapToIPv4() : address;
        var bytes = ipv4.GetAddressBytes();
        return bytes.Length == 4
            && bytes[0] == 169
            && bytes[1] == 254;
    }
}
