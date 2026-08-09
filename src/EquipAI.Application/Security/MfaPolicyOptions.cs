using EquipAI.Core.Enums;
using Microsoft.Extensions.Configuration;

namespace EquipAI.Application.Security;

/// <summary>
/// 多因素认证强制策略。
/// 生产环境通过 Security:Mfa:RequiredRoles 配置需要强制启用 MFA 的角色；
/// 开发和测试环境没有配置时不改变现有登录行为。
/// </summary>
public sealed class MfaPolicyOptions
{
    /// <summary>
    /// 必须完成 MFA 注册的角色集合。
    /// </summary>
    public IReadOnlySet<UserRole> RequiredRoles { get; }

    /// <summary>
    /// 初始化 MFA 强制策略。
    /// </summary>
    /// <param name="requiredRoles">必须启用 MFA 的角色集合。</param>
    public MfaPolicyOptions(IEnumerable<UserRole> requiredRoles)
    {
        RequiredRoles = requiredRoles.ToHashSet();
    }

    /// <summary>
    /// 从配置读取 MFA 角色策略。
    /// 使用数组配置而不是逗号分隔字符串，避免角色名拼写错误被静默忽略。
    /// </summary>
    /// <param name="configuration">应用配置。</param>
    /// <returns>解析后的 MFA 策略。</returns>
    /// <exception cref="InvalidOperationException">角色配置不是有效的 UserRole 时抛出。</exception>
    public static MfaPolicyOptions FromConfiguration(IConfiguration configuration)
    {
        var roleValues = configuration
            .GetSection("Security:Mfa:RequiredRoles")
            .GetChildren()
            .Select(child => child.Value)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value!.Trim())
            .ToArray();

        var roles = new List<UserRole>(roleValues.Length);
        foreach (var roleValue in roleValues)
        {
            if (!Enum.TryParse<UserRole>(roleValue, ignoreCase: true, out var role))
            {
                throw new InvalidOperationException(
                    $"Security:Mfa:RequiredRoles 包含无效角色 '{roleValue}'，请使用有效的 UserRole 名称。");
            }

            roles.Add(role);
        }

        return new MfaPolicyOptions(roles);
    }

    /// <summary>
    /// 判断指定角色是否必须完成 MFA。
    /// </summary>
    /// <param name="role">用户角色。</param>
    public bool IsRequiredFor(UserRole role) => RequiredRoles.Contains(role);
}

/// <summary>
/// 生产环境 MFA 策略启动校验器。
/// </summary>
public static class MfaPolicyValidator
{
    private static readonly UserRole[] MandatoryProductionRoles =
    [
        UserRole.SystemAdmin,
        UserRole.MaintenanceLead
    ];

    /// <summary>
    /// 校验生产环境是否确实配置了高权限 MFA 强制策略。
    /// </summary>
    /// <param name="configuration">应用配置。</param>
    /// <param name="environmentName">宿主环境名称。</param>
    public static void ValidateForEnvironment(IConfiguration configuration, string environmentName)
    {
        if (!string.Equals(environmentName, "Production", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var options = MfaPolicyOptions.FromConfiguration(configuration);
        var missingRoles = MandatoryProductionRoles
            .Where(role => !options.IsRequiredFor(role))
            .Select(role => role.ToString())
            .ToArray();

        if (missingRoles.Length > 0)
        {
            throw new InvalidOperationException(
                $"生产环境 MFA 强制策略不完整，必须包含角色：{string.Join("、", missingRoles)}。");
        }
    }
}

/// <summary>
/// 生产环境 TOTP 密钥保护配置启动校验器。
/// </summary>
public static class TotpSecretProtectionValidator
{
    private const int RequiredKeyByteLength = 32;

    /// <summary>
    /// 校验生产环境是否配置了可用于 AES-256-GCM 的外部密钥。
    /// </summary>
    /// <param name="configuration">应用配置。</param>
    /// <param name="environmentName">宿主环境名称。</param>
    /// <exception cref="InvalidOperationException">密钥缺失、格式错误或长度不符合要求时抛出。</exception>
    public static void ValidateForEnvironment(IConfiguration configuration, string environmentName)
    {
        if (!string.Equals(environmentName, "Production", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var configuredKey = configuration["Security:TotpEncryptionKey"];
        if (string.IsNullOrWhiteSpace(configuredKey))
        {
            throw new InvalidOperationException(
                "生产环境未配置 Security:TotpEncryptionKey，无法安全保护 TOTP 密钥。");
        }

        byte[] decodedKey;
        try
        {
            decodedKey = Convert.FromBase64String(configuredKey);
        }
        catch (FormatException ex)
        {
            throw new InvalidOperationException(
                "Security:TotpEncryptionKey 必须是 Base64 编码的 32 字节密钥。", ex);
        }

        if (decodedKey.Length != RequiredKeyByteLength)
        {
            throw new InvalidOperationException(
                "Security:TotpEncryptionKey 必须解码为 32 字节（AES-256）密钥。");
        }
    }
}
