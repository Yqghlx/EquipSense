using AutoMapper;
using EquipAI.Application.DTOs.Common;
using EquipAI.Core.Models;
using EquipAI.Application.DTOs.Users;
using EquipAI.Application.Interfaces;
using EquipAI.Core.Enums;
using EquipAI.Core.Exceptions;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Services;

/// <summary>
/// 用户管理服务实现，提供用户 CRUD 和角色管理能力
/// 所有操作均在指定租户范围内进行；全局租户过滤器作为纵深防御，业务谓词仍显式匹配 TenantId
/// 创建和唯一性检查使用 IgnoreQueryFilters 以确保跨租户的用户名唯一性
/// </summary>
public class UserService : IUserService
{
    private readonly AppDbContext _dbContext;
    private readonly IMapper _mapper;
    private readonly ILogger<UserService> _logger;
    private readonly IAuditLogService _auditLogService;

    /// <summary>
    /// 初始化用户管理服务
    /// </summary>
    /// <param name="auditLogService">审计日志服务：用户创建/停用/角色变更等安全敏感操作必须留痕（可审计性）</param>
    public UserService(
        AppDbContext dbContext,
        IMapper mapper,
        ILogger<UserService> logger,
        IAuditLogService auditLogService)
    {
        _dbContext = dbContext;
        _mapper = mapper;
        _logger = logger;
        _auditLogService = auditLogService;
    }

    /// <summary>
    /// 分页查询用户列表
    /// 显式按租户筛选，并由全局过滤器提供第二层隔离
    /// </summary>
    /// <param name="query">分页查询参数</param>
    /// <param name="tenantId">租户 ID</param>
    /// <returns>分页用户结果</returns>
    public async Task<PagedResult<UserDto>> GetUsersAsync(PagedQuery query, Guid tenantId)
    {
        // tenantId 是服务契约的一部分，不能只依赖 DbContext 的全局过滤器。
        var users = _dbContext.Users
            .Where(u => u.TenantId == tenantId)
            .AsQueryable();

        // 关键词搜索：匹配用户名或显示名称
        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            var keyword = $"%{query.Keyword}%";
            users = users.Where(u =>
                EF.Functions.ILike(u.Username, keyword) ||
                EF.Functions.ILike(u.DisplayName!, keyword));
        }

        var (items, total) = await users.ToPagedAsync(query);

        return new PagedResult<UserDto>
        {
            Items = _mapper.Map<List<UserDto>>(items)!,
            Total = total,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }

    /// <summary>
    /// 根据 ID 获取用户详情
    /// </summary>
    /// <param name="userId">用户 ID</param>
    /// <param name="tenantId">租户 ID</param>
    /// <returns>用户信息，不存在则返回 null</returns>
    public async Task<UserDto?> GetUserByIdAsync(Guid userId, Guid tenantId)
    {
        // 不使用 FindAsync：它可能从 ChangeTracker 返回实体，从而绕过查询过滤器。
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.TenantId == tenantId);
        return user == null ? null : _mapper.Map<UserDto>(user);
    }

    /// <summary>
    /// 创建新用户
    /// 使用 IgnoreQueryFilters 检查用户名的全局唯一性，防止不同租户间用户名冲突
    /// 新建用户默认需要修改密码（MustChangePassword = true）
    /// 同时维护租户的 CurrentUserCount 计数器
    /// </summary>
    /// <param name="request">创建用户请求</param>
    /// <param name="tenantId">所属租户 ID</param>
    /// <returns>创建后的用户信息</returns>
    /// <exception cref="InvalidOperationException">用户名已存在</exception>
    public async Task<UserDto> CreateUserAsync(CreateUserRequest request, Guid tenantId)
    {
        // 跨租户检查用户名唯一性
        var existingUser = await _dbContext.UnfilteredSet<Core.Entities.User>()
            .AnyAsync(u => u.Username == request.Username);

        if (existingUser)
        {
            throw new InvalidOperationException($"用户名 '{request.Username}' 已存在");
        }

        var user = _mapper.Map<Core.Entities.User>(request)!;
        user.TenantId = tenantId;
        user.PasswordHash = PasswordHasher.HashPassword(request.Password);
        user.MustChangePassword = true;

        // 配额不能只依赖 HTTP 中间件：后台任务、测试工具或未来新增入口可能直接调用服务。
        // 关系型数据库使用“带条件的原子递增”并与用户写入放在同一事务，避免并发请求同时读到同一旧计数而超卖席位。
        var executionStrategy = _dbContext.Database.CreateExecutionStrategy();
        try
        {
            await executionStrategy.ExecuteAsync(async () =>
            {
                if (!_dbContext.Database.IsRelational())
                {
                    // InMemory provider 不支持事务；保留等价的检查顺序供单元测试验证业务不变量。
                    var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
                        .FirstOrDefaultAsync(t => t.Id == tenantId);
                    if (tenant != null)
                    {
                        if (tenant.MaxUsers > 0 && tenant.CurrentUserCount >= tenant.MaxUsers)
                            throw new ResourceQuotaExceededException("user");

                        tenant.CurrentUserCount++;
                    }
                    else
                    {
                        throw new InvalidOperationException("当前租户不存在，无法创建用户");
                    }

                    _dbContext.Users.Add(user);
                    await _dbContext.SaveChangesAsync();
                    return true;
                }

                _dbContext.ChangeTracker.Clear();
                await using var transaction = await _dbContext.Database.BeginTransactionAsync();
                try
                {
                    var affected = await TenantQuotaSql.TryReserveUserSlotsAsync(
                        _dbContext, tenantId, 1, CancellationToken.None);

                    if (affected == 0)
                    {
                        var tenantExists = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
                            .AnyAsync(t => t.Id == tenantId);
                        throw tenantExists
                            ? new ResourceQuotaExceededException("user")
                            : new InvalidOperationException("当前租户不存在，无法创建用户");
                    }

                    _dbContext.Users.Add(user);
                    await _dbContext.SaveChangesAsync();
                    await transaction.CommitAsync();
                    return true;
                }
                catch
                {
                    await transaction.RollbackAsync();
                    _dbContext.ChangeTracker.Clear();
                    throw;
                }
            });
        }
        catch (DbUpdateException exception)
            when (DatabaseConstraintDetector.IsUsernameUniqueViolation(exception))
        {
            // 预检查无法消除并发窗口；唯一索引是最终边界，转换为稳定的 409 业务冲突而非 500。
            _dbContext.ChangeTracker.Clear();
            throw new InvalidOperationException($"用户名 '{request.Username}' 已存在", exception);
        }

        // 用户创建属安全敏感操作，留痕审计（谁在何时创建了哪个用户），满足可审计性要求
        await _auditLogService.LogAsync(tenantId, "Create", "User",
            user.Id.ToString(), $"创建用户 {user.Username}", default);

        _logger.LogInformation("用户 {Username} 创建成功（租户：{TenantId}）", user.Username, tenantId);

        return _mapper.Map<UserDto>(user)!;
    }

    /// <summary>
    /// 更新用户信息（仅修改非敏感字段）
    /// 通过 AutoMapper 的 Condition 配置仅更新请求中非 null 的字段
    /// </summary>
    /// <param name="userId">用户 ID</param>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="request">更新用户请求</param>
    /// <returns>更新后的用户信息</returns>
    /// <exception cref="KeyNotFoundException">用户不存在</exception>
    public async Task<UserDto> UpdateUserAsync(Guid userId, Guid tenantId, UpdateUserRequest request)
    {
        // ID 和租户必须在同一个业务谓词中校验，跨租户资源按不存在处理。
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.TenantId == tenantId)
            ?? throw new KeyNotFoundException($"用户 {userId} 不存在");

        _mapper.Map(request, user);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("用户 {UserId} 信息已更新", userId);

        return _mapper.Map<UserDto>(user)!;
    }

    /// <summary>
    /// 停用用户（软删除）
    /// 将 IsActive 设为 false，用户将无法登录
    /// </summary>
    /// <param name="userId">用户 ID</param>
    /// <param name="tenantId">租户 ID</param>
    /// <exception cref="KeyNotFoundException">用户不存在</exception>
    public async Task DeactivateUserAsync(Guid userId, Guid tenantId)
    {
        // 停用会影响登录权限和租户席位，必须显式绑定租户。
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.TenantId == tenantId)
            ?? throw new KeyNotFoundException($"用户 {userId} 不存在");

        // 仅在用户当前为启用状态时停用并释放席位，避免对同一用户重复停用导致重复扣减计数。
        // （停用是单向操作——本系统无重新激活路径，停用即等同于软删除。）
        if (user.IsActive)
        {
            user.IsActive = false;

            // 停用用户（软删除）须释放其占用的用户席位（CurrentUserCount--），与 CreateUserAsync
            // 的 ++ 对称。否则配额只增不减：工业客户员工流动大，停用离职员工后席位不放，配额检查
            // （CurrentUserCount < MaxUsers）被离职员工永久占满 → 新员工无法建账号（配额卡死）。
            // 与 DeviceService.DeleteDeviceAsync 维护 CurrentDeviceCount-- 同理。
            var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
                .FirstOrDefaultAsync(t => t.Id == tenantId);
            if (tenant != null && tenant.CurrentUserCount > 0)
            {
                tenant.CurrentUserCount--;
            }
        }

        await _dbContext.SaveChangesAsync();

        // 停用用户属安全敏感操作，留痕审计（谁在何时停用了哪个用户）
        await _auditLogService.LogAsync(tenantId, "Deactivate", "User",
            userId.ToString(), $"停用用户 {user.Username}", default);

        _logger.LogInformation("用户 {UserId} 已停用", userId);
    }

    /// <summary>
    /// 变更用户角色
    /// 解析角色名称为 UserRole 枚举并保存
    /// </summary>
    /// <param name="userId">用户 ID</param>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="newRole">新角色名称（如 SystemAdmin、MaintenanceLead 等）</param>
    /// <exception cref="KeyNotFoundException">用户不存在</exception>
    /// <exception cref="ArgumentException">角色名称无效</exception>
    public async Task ChangeUserRoleAsync(Guid userId, Guid tenantId, string newRole)
    {
        // 角色变更可能造成提权，必须显式绑定租户，不能依赖 FindAsync 或跟踪状态。
        var user = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.TenantId == tenantId)
            ?? throw new KeyNotFoundException($"用户 {userId} 不存在");

        if (!Enum.TryParse<UserRole>(newRole, ignoreCase: true, out var role))
        {
            throw new ArgumentException($"无效的角色名称: '{newRole}'");
        }

        // 角色变更（提权/降权）是最高风险的安全操作，必须留痕审计：记录变更前后的角色，
        // 以便追溯"谁在何时把谁提权为 SystemAdmin"等内部威胁（ISO 27001 / IEC 62443 可审计性要求）
        var oldRole = user.Role;
        user.Role = role;
        await _dbContext.SaveChangesAsync();

        await _auditLogService.LogAsync(tenantId, "RoleChange", "User",
            userId.ToString(), $"角色变更：{oldRole} → {role}（用户 {user.Username}）", default);

        _logger.LogInformation("用户 {UserId} 角色已变更为 {Role}", userId, role);
    }
}
