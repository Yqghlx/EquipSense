using System.Reflection;
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
        ArgumentNullException.ThrowIfNull(query);
        ArgumentNullException.ThrowIfNull(pagedQuery);

        var sortPropertyName = ResolveSortPropertyName<T>(pagedQuery.Sort);
        var isAscending = pagedQuery.Order.Equals("asc", StringComparison.OrdinalIgnoreCase);
        if (!isAscending && !pagedQuery.Order.Equals("desc", StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("排序方向只能是 asc 或 desc。", nameof(pagedQuery.Order));
        }

        var total = await query.CountAsync(ct);

        // 动态排序：将 Sort 字段名映射为 EF.Property，根据 Order 方向排序
        // 先在应用层确认字段确实存在且是可排序的标量属性，再交给 EF 生成 SQL。
        // 这样客户端拼写错误会得到 400，而不是在数据库查询阶段变成 500。
        var sorted = isAscending
            ? query.OrderBy(e => EF.Property<object>(e, sortPropertyName))
            : query.OrderByDescending(e => EF.Property<object>(e, sortPropertyName));

        var items = await sorted
            .Skip((pagedQuery.Page - 1) * pagedQuery.PageSize)
            .Take(pagedQuery.PageSize)
            .ToListAsync(ct);

        return (items, total);
    }

    /// <summary>
    /// 将外部排序字段解析为实体上的可排序标量属性。
    /// </summary>
    private static string ResolveSortPropertyName<T>(string sort)
        where T : class
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(sort);

        var requestedPropertyName = ToPascalCase(sort);
        var property = typeof(T)
            .GetProperties(BindingFlags.Instance | BindingFlags.Public)
            .FirstOrDefault(candidate =>
                string.Equals(candidate.Name, requestedPropertyName, StringComparison.OrdinalIgnoreCase)
                && IsSortableScalar(candidate.PropertyType));

        return property?.Name
            ?? throw new ArgumentException($"排序字段不存在或不可排序：{sort}", nameof(sort));
    }

    /// <summary>
    /// 只允许 EF 可以稳定转换为 ORDER BY 的标量类型，拒绝导航属性和集合属性。
    /// </summary>
    private static bool IsSortableScalar(Type type)
    {
        var underlyingType = Nullable.GetUnderlyingType(type) ?? type;
        return underlyingType.IsPrimitive
            || underlyingType.IsEnum
            || underlyingType == typeof(string)
            || underlyingType == typeof(decimal)
            || underlyingType == typeof(Guid)
            || underlyingType == typeof(DateTime)
            || underlyingType == typeof(DateTimeOffset)
            || underlyingType == typeof(TimeSpan)
            || underlyingType == typeof(DateOnly)
            || underlyingType == typeof(TimeOnly);
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
