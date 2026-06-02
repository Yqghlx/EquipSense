namespace EquipAI.Application.DTOs.Tenants;

/// <summary>
/// 变更计划请求
/// </summary>
public class ChangePlanRequest
{
    /// <summary>
    /// 新计划名称（Trial/Basic/Professional/Enterprise）
    /// </summary>
    public string Plan { get; set; } = string.Empty;
}
