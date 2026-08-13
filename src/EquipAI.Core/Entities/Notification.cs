namespace EquipAI.Core.Entities;

/// <summary>
/// 通知实体 — 持久化用户通知记录，支持告警、工单、系统三类通知
/// </summary>
public class Notification : BaseEntity
{
    /// <summary>所属租户 ID</summary>
    public Guid TenantId { get; set; }

    /// <summary>目标用户 ID</summary>
    public Guid UserId { get; set; }

    /// <summary>通知类型（alert / workorder / system）</summary>
    public string Type { get; set; } = "system";

    /// <summary>通知标题</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>通知内容</summary>
    public string? Content { get; set; }

    /// <summary>关联实体 ID（告警或工单 ID）</summary>
    public Guid? RelatedId { get; set; }

    /// <summary>
    /// 产生该通知的集成事件 ID；为空表示通知不是由可靠事件总线创建。
    /// 同一事件重投时用于按租户和用户幂等去重。
    /// </summary>
    public Guid? SourceEventId { get; set; }

    /// <summary>关联链接（前端路由路径）</summary>
    public string? Link { get; set; }

    /// <summary>是否已读</summary>
    public bool IsRead { get; set; }
}
