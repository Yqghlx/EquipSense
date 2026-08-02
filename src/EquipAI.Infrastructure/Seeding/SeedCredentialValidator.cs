namespace EquipAI.Infrastructure.Seeding;

/// <summary>
/// 生产种子账户凭据校验器。
/// </summary>
public static class SeedCredentialValidator
{
    private static readonly string[] RequiredPasswordVariables =
    [
        "SEED_ADMIN_PASSWORD",
        "SEED_LEAD_PASSWORD",
        "SEED_TECH_PASSWORD",
        "SEED_OPERATOR_PASSWORD",
        "SEED_VIEWER_PASSWORD"
    ];

    private static readonly IReadOnlyDictionary<string, string> PublicDefaultPasswords =
        new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["SEED_ADMIN_PASSWORD"] = "Admin@123",
            ["SEED_LEAD_PASSWORD"] = "Lead@123",
            ["SEED_TECH_PASSWORD"] = "Tech@123",
            ["SEED_OPERATOR_PASSWORD"] = "Operator@123",
            ["SEED_VIEWER_PASSWORD"] = "Viewer@123",
            ["SEED_TENANT2_PASSWORD"] = "Tenant2@123"
        };

    /// <summary>
    /// 校验生产环境种子账户密码是否完整。
    /// </summary>
    /// <param name="isProduction">是否为生产环境。</param>
    /// <param name="credentials">环境变量名到密码是否配置的映射。</param>
    /// <param name="includeTenant2Account">是否显式创建测试用第二租户账户。</param>
    /// <exception cref="InvalidOperationException">生产凭据缺失时抛出。</exception>
    public static void Validate(
        bool isProduction,
        IReadOnlyDictionary<string, string?> credentials,
        bool includeTenant2Account)
    {
        if (!isProduction)
        {
            return;
        }

        var requiredVariables = RequiredPasswordVariables.AsEnumerable();
        if (includeTenant2Account)
        {
            requiredVariables = requiredVariables.Append("SEED_TENANT2_PASSWORD");
        }

        var missingVariables = requiredVariables
            .Where(variable => !credentials.TryGetValue(variable, out var value)
                || IsUnsafeCredential(variable, value))
            .ToArray();

        if (missingVariables.Length > 0)
        {
            throw new InvalidOperationException(
                $"生产环境缺少种子账户密码配置：{string.Join("、", missingVariables)}。请配置后重启服务。");
        }
    }

    /// <summary>
    /// 判断密码是否为空、占位符或仓库中的公开默认值。
    /// </summary>
    private static bool IsUnsafeCredential(string variableName, string? value)
        => string.IsNullOrWhiteSpace(value)
            || value.Contains("请修改", StringComparison.Ordinal)
            || PublicDefaultPasswords.TryGetValue(variableName, out var defaultPassword)
                && string.Equals(value, defaultPassword, StringComparison.Ordinal);
}
