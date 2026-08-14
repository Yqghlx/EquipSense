using System.Text.Json;

namespace EquipAI.Application.WorkOrders.Integration;

/// <summary>
/// 工单集成配置共用的 JSON 反序列化选项。
/// 管理端 API 按小驼峰保存配置，而领域配置类使用 PascalCase 属性名，
/// 因此所有工单集成必须使用大小写不敏感的选项读取 tenant.Settings。
/// </summary>
internal static class IntegrationJsonOptions
{
    /// <summary>兼容管理端小驼峰字段名的 JSON 选项。</summary>
    public static readonly JsonSerializerOptions Default = new()
    {
        PropertyNameCaseInsensitive = true,
    };
}
