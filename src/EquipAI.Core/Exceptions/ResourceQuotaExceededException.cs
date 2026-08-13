namespace EquipAI.Core.Exceptions;

/// <summary>
/// 表示租户已达到某类资源配额。
/// </summary>
public sealed class ResourceQuotaExceededException : InvalidOperationException
{
    /// <summary>
    /// 资源类型标识（如 device、user）。
    /// </summary>
    public string ResourceType { get; }

    /// <summary>
    /// 初始化配额异常。
    /// </summary>
    /// <param name="resourceType">资源类型标识。</param>
    public ResourceQuotaExceededException(string resourceType)
        : base($"已超出{GetResourceName(resourceType)}数量上限，请升级计划")
    {
        ResourceType = resourceType;
    }

    /// <summary>
    /// 将内部资源类型转换为面向用户的中文名称。
    /// </summary>
    private static string GetResourceName(string resourceType)
        => resourceType.ToLowerInvariant() switch
        {
            "device" => "设备",
            "user" => "用户",
            _ => "资源"
        };
}
