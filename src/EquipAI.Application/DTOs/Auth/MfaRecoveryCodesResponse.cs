namespace EquipAI.Application.DTOs.Auth;

/// <summary>
/// MFA 恢复码响应。
/// 明文恢复码只在生成或重新生成的响应中返回一次，服务端不持久化明文。
/// </summary>
public sealed class MfaRecoveryCodesResponse
{
    /// <summary>
    /// 一次性恢复码列表。
    /// </summary>
    public List<string> RecoveryCodes { get; set; } = [];
}
