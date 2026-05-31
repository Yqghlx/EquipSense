namespace EquipAI.Application.DTOs.Common;

/// <summary>
/// 通用分页查询参数
/// 所有列表查询接口的基类，提供统一的分页、排序和搜索能力
/// </summary>
public class PagedQuery
{
    /// <summary>
    /// 当前页码（从 1 开始）
    /// </summary>
    public int Page { get; set; } = 1;

    /// <summary>
    /// 每页条数
    /// </summary>
    public int PageSize { get; set; } = 20;

    /// <summary>
    /// 排序字段名
    /// </summary>
    public string Sort { get; set; } = "created_at";

    /// <summary>
    /// 排序方向（asc / desc）
    /// </summary>
    public string Order { get; set; } = "desc";

    /// <summary>
    /// 搜索关键词（模糊匹配）
    /// </summary>
    public string? Keyword { get; set; }
}
