namespace EquipAI.Core.Entities;

/// <summary>
/// 工单附件实体 — 存储工单关联的文件（图片、PDF、文档等）
/// </summary>
public class WorkOrderAttachment : BaseEntity
{
    /// <summary>
    /// 所属租户 ID（多租户隔离）
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 关联工单 ID
    /// </summary>
    public Guid WorkOrderId { get; set; }

    /// <summary>
    /// 原始文件名
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// 文件 MIME 类型（如 image/png、application/pdf）
    /// </summary>
    public string ContentType { get; set; } = string.Empty;

    /// <summary>
    /// 文件大小（字节）
    /// </summary>
    public long FileSize { get; set; }

    /// <summary>
    /// 服务端存储路径（相对路径，如 uploads/{tenantId}/{workOrderId}/{uniqueName}）
    /// </summary>
    public string StoragePath { get; set; } = string.Empty;

    /// <summary>
    /// 上传者用户 ID
    /// </summary>
    public Guid UploadedBy { get; set; }

    /// <summary>
    /// 关联工单导航属性
    /// </summary>
    public WorkOrder? WorkOrder { get; set; }
}
