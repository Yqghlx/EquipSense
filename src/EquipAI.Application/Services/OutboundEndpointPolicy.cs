using System.Net;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Services;

/// <summary>
/// 租户可配置出站 HTTP 目标的安全策略。
///
/// 出站请求既要兼容企业内部 EAM，又不能把平台变成访问本机、容器网络或云元数据的 SSRF 代理，
/// 因此默认拒绝回环/链路本地/未指定/组播地址；RFC1918 私网地址仅在显式配置后允许。
/// </summary>
public sealed class OutboundEndpointPolicy
{
    private static readonly HashSet<string> ForbiddenHostNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "localhost",
        "metadata",
        "metadata.google.internal",
        "instance-data",
        "host.docker.internal",
        "gateway.docker.internal",
        "kubernetes.default.svc",
    };

    private readonly bool _allowPrivateNetworks;

    public OutboundEndpointPolicy(IConfiguration configuration)
    {
        var environment = configuration["ASPNETCORE_ENVIRONMENT"] ?? "Production";
        _allowPrivateNetworks = configuration.GetValue(
            "Security:OutboundHttp:AllowPrivateNetworks",
            environment is "Development" or "Testing");
    }

    /// <summary>
    /// 校验配置保存阶段的 URI。域名不在这里解析，避免 DNS 临时故障阻断配置保存；发送阶段会再次解析。
    /// </summary>
    public (bool Allowed, string Reason) ValidateConfiguredUri(string? rawUrl)
    {
        if (!Uri.TryCreate(rawUrl, UriKind.Absolute, out var uri))
            return (false, "目标地址必须是完整的 HTTP 或 HTTPS URL");

        return ValidateBasicUri(uri);
    }

    /// <summary>
    /// 校验实际发送目标，并在 DNS 解析后再次检查地址，防止历史脏配置绕过保存校验。
    /// </summary>
    public async Task<(bool Allowed, string Reason)> ValidateAsync(Uri? uri, CancellationToken ct = default)
    {
        if (uri is null)
            return (false, "出站请求缺少目标地址");

        var basicResult = ValidateBasicUri(uri);
        if (!basicResult.Allowed)
            return basicResult;

        if (IPAddress.TryParse(uri.Host, out var literalAddress))
        {
            return IsAddressAllowed(literalAddress)
                ? (true, string.Empty)
                : (false, "目标地址解析为受保护的网络地址");
        }

        IPAddress[] addresses;
        try
        {
            addresses = await Dns.GetHostAddressesAsync(uri.DnsSafeHost, ct);
        }
        catch (Exception ex) when (ex is System.Net.Sockets.SocketException or OperationCanceledException)
        {
            if (ex is OperationCanceledException)
                throw;

            return (false, "目标域名无法解析");
        }

        if (addresses.Length == 0 || addresses.Any(address => !IsAddressAllowed(address)))
            return (false, "目标域名解析到了受保护的网络地址");

        return (true, string.Empty);
    }

    /// <summary>
    /// 仅校验 URI 结构和显式 IP，供配置保存阶段使用。
    /// </summary>
    private (bool Allowed, string Reason) ValidateBasicUri(Uri uri)
    {
        if (uri.Scheme is not ("http" or "https"))
            return (false, "仅允许 HTTP 或 HTTPS 出站地址");

        if (!string.IsNullOrEmpty(uri.UserInfo))
            return (false, "出站地址不得包含内嵌用户名或密码");

        var host = uri.Host.TrimEnd('.');
        if (string.IsNullOrWhiteSpace(host) || ForbiddenHostNames.Contains(host))
            return (false, "目标地址属于受保护的主机");

        if (IPAddress.TryParse(host, out var literalAddress) && !IsAddressAllowed(literalAddress))
            return (false, "目标地址属于受保护的网络地址");

        return (true, string.Empty);
    }

    /// <summary>
    /// 判断解析出的 IP 是否可作为出站目标。
    /// </summary>
    private bool IsAddressAllowed(IPAddress address)
    {
        if (IPAddress.IsLoopback(address)
            || address.Equals(IPAddress.Any)
            || address.Equals(IPAddress.IPv6Any)
            || address.IsIPv6LinkLocal
            || address.IsIPv6Multicast)
        {
            return false;
        }

        var bytes = address.GetAddressBytes();
        if (address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
        {
            // 链路本地、组播和广播地址不应作为业务集成目标。
            if ((bytes[0] == 169 && bytes[1] == 254)
                || bytes[0] >= 224)
            {
                return false;
            }

            // 企业内部 EAM 可能位于 RFC1918 网络，但必须由部署者显式开启。
            var isPrivate = bytes[0] == 10
                || (bytes[0] == 172 && bytes[1] is >= 16 and <= 31)
                || (bytes[0] == 192 && bytes[1] == 168);
            if (isPrivate && !_allowPrivateNetworks)
                return false;
        }
        else if (address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetworkV6)
        {
            // fc00::/7 是 IPv6 唯一本地地址（ULA），与 RFC1918 私网同等处理。
            var isUniqueLocal = (bytes[0] & 0xFE) == 0xFC;
            if (isUniqueLocal && !_allowPrivateNetworks)
                return false;
        }

        return true;
    }
}

/// <summary>
/// 所有租户可配置出站 HTTP 客户端共用的目标校验处理器。
/// </summary>
public sealed class OutboundEndpointValidationHandler : DelegatingHandler
{
    private readonly OutboundEndpointPolicy _policy;
    private readonly ILogger<OutboundEndpointValidationHandler> _logger;

    public OutboundEndpointValidationHandler(
        OutboundEndpointPolicy policy,
        ILogger<OutboundEndpointValidationHandler> logger)
    {
        _policy = policy;
        _logger = logger;
    }

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        var validation = await _policy.ValidateAsync(request.RequestUri, cancellationToken);
        if (!validation.Allowed)
        {
            var host = request.RequestUri?.Host ?? "unknown";
            _logger.LogWarning("出站请求被安全策略拒绝：Host={Host}, Reason={Reason}", host, validation.Reason);
            throw new HttpRequestException("出站请求目标未通过安全校验");
        }

        return await base.SendAsync(request, cancellationToken);
    }
}
