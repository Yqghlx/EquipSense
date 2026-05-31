namespace EquipAI.Core.Constants;

/// <summary>
/// 系统级常量定义
/// </summary>
public static class SystemConstants
{
    /// <summary>
    /// 系统租户 ID，用于存放行业预置模板和共享规则
    /// </summary>
    public static readonly Guid SystemTenantId = Guid.Parse("00000000-0000-0000-0000-000000000000");

    /// <summary>
    /// 系统租户标识（URL Slug）
    /// </summary>
    public const string SystemTenantSlug = "system";
}
