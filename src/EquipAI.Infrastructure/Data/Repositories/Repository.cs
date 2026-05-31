using System.Linq.Expressions;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.Infrastructure.Data.Repositories;

/// <summary>
/// 通用仓储实现，提供标准的 CRUD 和分页查询操作
/// 所有查询自动受 AppDbContext 中全局租户查询过滤器的约束
/// </summary>
/// <typeparam name="T">实体类型，必须继承自 BaseEntity</typeparam>
public class Repository<T> : IRepository<T> where T : BaseEntity
{
    /// <summary>
    /// 数据库上下文，受租户过滤器约束
    /// </summary>
    protected readonly AppDbContext DbContext;

    /// <summary>
    /// 初始化仓储
    /// </summary>
    /// <param name="dbContext">应用数据库上下文</param>
    public Repository(AppDbContext dbContext)
    {
        DbContext = dbContext;
    }

    /// <inheritdoc />
    public async Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        // FindAsync 优先查询变更跟踪器，避免不必要的数据库查询
        return await DbContext.Set<T>().FindAsync([id], cancellationToken);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await DbContext.Set<T>().ToListAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task<(IReadOnlyList<T> Items, int TotalCount)> GetPagedAsync(
        int page,
        int pageSize,
        Expression<Func<T, bool>>? predicate = null,
        CancellationToken cancellationToken = default)
    {
        // 构建基础查询（已自动受租户过滤器约束）
        IQueryable<T> query = DbContext.Set<T>();

        // 应用可选的过滤条件
        if (predicate is not null)
        {
            query = query.Where(predicate);
        }

        // 先计算总数（在应用分页之前），用于前端分页控件
        var totalCount = await query.CountAsync(cancellationToken);

        // 应用分页（页码从 1 开始）
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    /// <inheritdoc />
    public async Task<T> AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        await DbContext.Set<T>().AddAsync(entity, cancellationToken);
        await DbContext.SaveChangesAsync(cancellationToken);
        return entity;
    }

    /// <inheritdoc />
    public async Task UpdateAsync(T entity, CancellationToken cancellationToken = default)
    {
        DbContext.Entry(entity).State = EntityState.Modified;
        await DbContext.SaveChangesAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task DeleteAsync(T entity, CancellationToken cancellationToken = default)
    {
        DbContext.Set<T>().Remove(entity);
        await DbContext.SaveChangesAsync(cancellationToken);
    }

    /// <inheritdoc />
    public async Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
    {
        return await DbContext.Set<T>().AnyAsync(predicate, cancellationToken);
    }

    /// <inheritdoc />
    public async Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null, CancellationToken cancellationToken = default)
    {
        if (predicate is null)
        {
            return await DbContext.Set<T>().CountAsync(cancellationToken);
        }

        return await DbContext.Set<T>().CountAsync(predicate, cancellationToken);
    }

    /// <inheritdoc />
    public IQueryable<T> Query()
    {
        return DbContext.Set<T>();
    }
}
