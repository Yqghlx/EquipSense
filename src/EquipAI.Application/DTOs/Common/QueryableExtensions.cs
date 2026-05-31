using Microsoft.EntityFrameworkCore;

namespace EquipAI.Application.DTOs.Common;

/// <summary>
/// IQueryable 分页扩展方法，提供统一的分页查询和动态排序能力
/// </summary>
public static class QueryableExtensions
{
    /// <summary>
    /// 将 IQueryable 转换为分页结果
    /// 支持动态排序：根据 PagedQuery 中的 Sort 字段名和 Order 方向进行排序
    /// </summary>
    /// <typeparam name="T">实体类型</typeparam>
    /// <param name="query">待分页的查询</param>
    /// <param name="pagedQuery">分页参数（页码、每页条数、排序字段、排序方向）</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>分页元组（当前页数据列表，总记录数）</returns>
    public static async Task<(List<T> Items, int Total)> ToPagedAsync<T>(
        this IQueryable<T> query, PagedQuery pagedQuery, CancellationToken ct = default)
    where T : class
    {
        var total = await query.CountAsync(ct);

        // 动态排序：将 Sort 字段名映射为 EF.Property，根据 Order 方向排序
        // 如果排序字段不存在，EF Core 会在运行时抛出异常，由全局异常中间件捕获
        var sorted = pagedQuery.Order.Equals("asc", StringComparison.OrdinalIgnoreCase)
            ? query.OrderBy(e => EF.Property<object>(e, ToPascalCase(pagedQuery.Sort)))
            : query.OrderByDescending(e => EF.Property<object>(e, ToPascalCase(pagedQuery.Sort)));

        var items = await sorted
            .Skip((pagedQuery.Page - 1) * pagedQuery.PageSize)
            .Take(pagedQuery.PageSize)
            .ToListAsync(ct);

        return (items, total);
    }

    /// <summary>
    /// 将 snake_case 字段名转换为 PascalCase，以匹配 C# 属性命名
    /// 例如：created_at → CreatedAt，tenant_id → TenantId
    /// </summary>
    /// <param name="snakeCase">snake_case 格式的字符串</param>
    /// <returns>PascalCase 格式的字符串</returns>
    private static string ToPascalCase(string snakeCase)
    {
        if (string.IsNullOrEmpty(snakeCase))
            return snakeCase;

        return string.Concat(
            snakeCase.Split('_')
                .Select(s => string.IsNullOrEmpty(s) ? s : char.ToUpperInvariant(s[0]) + s[1..]));
    }
}
