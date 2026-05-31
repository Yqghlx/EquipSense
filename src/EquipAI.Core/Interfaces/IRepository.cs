using System.Linq.Expressions;
using EquipAI.Core.Entities;

namespace EquipAI.Core.Interfaces;

/// <summary>
/// 通用仓储接口，提供标准的 CRUD 和查询操作
/// 所有实现均受租户全局查询过滤器约束，确保数据隔离
/// </summary>
/// <typeparam name="T">实体类型，必须继承自 BaseEntity</typeparam>
public interface IRepository<T> where T : BaseEntity
{
    /// <summary>
    /// 根据主键获取实体
    /// </summary>
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 获取所有实体（受租户过滤器约束）
    /// </summary>
    Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 分页查询
    /// </summary>
    /// <param name="page">页码（从 1 开始）</param>
    /// <param name="pageSize">每页大小</param>
    /// <param name="predicate">可选的过滤条件</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>分页结果集</returns>
    Task<(IReadOnlyList<T> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        Expression<Func<T, bool>>? predicate = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 新增实体
    /// </summary>
    Task<T> AddAsync(T entity, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新实体
    /// </summary>
    Task UpdateAsync(T entity, CancellationToken cancellationToken = default);

    /// <summary>
    /// 删除实体
    /// </summary>
    Task DeleteAsync(T entity, CancellationToken cancellationToken = default);

    /// <summary>
    /// 判断指定条件的实体是否存在
    /// </summary>
    Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);

    /// <summary>
    /// 统计满足条件的实体数量
    /// </summary>
    Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// 获取可查询的 IQueryable（用于复杂查询场景）
    /// 注意：返回的查询已自动应用租户过滤器
    /// </summary>
    IQueryable<T> Query();
}
