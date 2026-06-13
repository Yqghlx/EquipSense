namespace EquipAI.WebAPI.Middleware;

/// <summary>
/// 审计日志特性 — 标注在 Controller Action 上，覆盖全局 AuditActionFilter 的自动推断
/// 用于语义化记录自动推断无法表达的动作（如工单"派工"、"验收"，告警"确认"）
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false)]
public sealed class AuditAttribute : Attribute
{
    /// <summary>操作类型（如 Create、Update、Delete、Dispatch、Acknowledge、Approve）</summary>
    public string Action { get; }

    /// <summary>资源类型（如 Device、WorkOrder、Alert）</summary>
    public string ResourceType { get; }

    /// <summary>
    /// 初始化审计特性
    /// </summary>
    /// <param name="action">操作类型（如 Create、Update、Delete、Dispatch）</param>
    /// <param name="resourceType">资源类型（如 Device、WorkOrder、Alert）</param>
    public AuditAttribute(string action, string resourceType)
    {
        Action = action;
        ResourceType = resourceType;
    }
}

/// <summary>
/// 跳过审计特性 — 标注在不需记录的操作上（如登录心跳、健康检查、高频查询类写操作）
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false)]
public sealed class SkipAuditAttribute : Attribute
{
}
