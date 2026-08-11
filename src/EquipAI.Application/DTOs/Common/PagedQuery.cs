using System.ComponentModel.DataAnnotations;

namespace EquipAI.Application.DTOs.Common;

/// <summary>
/// 通用分页查询参数
/// 所有列表查询接口的基类，提供统一的分页、排序和搜索能力
/// </summary>
public class PagedQuery
{
    /// <summary>
    /// 单次列表查询允许返回的最大记录数，避免客户端通过超大 pageSize 放大数据库和内存压力。
    /// </summary>
    public const int MaxPageSize = 100;

    /// <summary>
    /// 允许请求的最大页码，防止 Skip 计算发生整数溢出。
    /// </summary>
    public const int MaxPage = 1_000_000;

    /// <summary>
    /// 当前页码（从 1 开始）
    /// </summary>
    [Range(1, MaxPage, ErrorMessage = "页码必须在 1 到 1000000 之间")]
    public int Page { get; set; } = 1;

    /// <summary>
    /// 每页条数
    /// </summary>
    [Range(1, MaxPageSize, ErrorMessage = "每页条数必须在 1 到 100 之间")]
    public int PageSize { get; set; } = 20;

    /// <summary>
    /// 排序字段名
    /// </summary>
    [StringLength(64, ErrorMessage = "排序字段长度不能超过 64 个字符")]
    [RegularExpression(
        @"^[A-Za-z][A-Za-z0-9_]*$",
        ErrorMessage = "排序字段只能包含字母、数字和下划线")]
    public string Sort { get; set; } = "created_at";

    /// <summary>
    /// 排序方向（asc / desc）
    /// </summary>
    [RegularExpression(
        @"^(?i:asc|desc)$",
        ErrorMessage = "排序方向只能是 asc 或 desc")]
    public string Order { get; set; } = "desc";

    /// <summary>
    /// 搜索关键词（模糊匹配）
    /// </summary>
    public string? Keyword { get; set; }
}
