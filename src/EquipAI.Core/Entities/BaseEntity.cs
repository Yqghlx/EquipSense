namespace EquipAI.Core.Entities;

/// <summary>
/// 实体基类，提供公共主键和审计字段
/// </summary>
public abstract class BaseEntity
{
    /// <summary>
    /// 实体唯一标识（UUID）
    /// </summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// 创建时间（UTC）
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
