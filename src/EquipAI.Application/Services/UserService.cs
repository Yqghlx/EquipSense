using AutoMapper;
using EquipAI.Application.DTOs.Common;
using EquipAI.Core.Models;
using EquipAI.Application.DTOs.Users;
using EquipAI.Application.Interfaces;
using EquipAI.Core.Enums;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Services;

/// <summary>
/// 用户管理服务实现，提供用户 CRUD 和角色管理能力
/// 所有操作均在指定租户范围内进行（依赖 AppDbContext 全局租户过滤器）
/// 创建和唯一性检查使用 IgnoreQueryFilters 以确保跨租户的用户名唯一性
/// </summary>
public class UserService : IUserService
{
    private readonly AppDbContext _dbContext;
    private readonly IMapper _mapper;
    private readonly ILogger<UserService> _logger;

    /// <summary>
    /// 初始化用户管理服务
    /// </summary>
    public UserService(
        AppDbContext dbContext,
        IMapper mapper,
        ILogger<UserService> logger)
    {
        _dbContext = dbContext;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// 分页查询用户列表
    /// 自动受租户全局过滤器约束，仅返回当前租户的用户
    /// </summary>
    /// <param name="query">分页查询参数</param>
    /// <param name="tenantId">租户 ID（由全局过滤器使用，此参数用于日志记录）</param>
    /// <returns>分页用户结果</returns>
    public async Task<PagedResult<UserDto>> GetUsersAsync(PagedQuery query, Guid tenantId)
    {
        var users = _dbContext.Users.AsQueryable();

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
        var user = await _dbContext.Users.FindAsync(userId);
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

        _dbContext.Users.Add(user);

        // 维护租户 CurrentUserCount（使用 UnfilteredSet 跨租户查询）
        var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == tenantId);
        if (tenant != null)
        {
            tenant.CurrentUserCount++;
        }

        await _dbContext.SaveChangesAsync();

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
        var user = await _dbContext.Users.FindAsync(userId)
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
        var user = await _dbContext.Users.FindAsync(userId)
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
        var user = await _dbContext.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException($"用户 {userId} 不存在");

        if (!Enum.TryParse<UserRole>(newRole, ignoreCase: true, out var role))
        {
            throw new ArgumentException($"无效的角色名称: '{newRole}'");
        }

        user.Role = role;
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("用户 {UserId} 角色已变更为 {Role}", userId, role);
    }
}
