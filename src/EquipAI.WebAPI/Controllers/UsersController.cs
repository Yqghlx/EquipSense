using EquipAI.Application.DTOs.Common;
using EquipAI.Application.DTOs.Users;
using EquipAI.Application.Interfaces;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 用户管理控制器，提供用户 CRUD 和角色管理接口
/// 所有接口均需认证和对应权限
/// </summary>
[ApiController]
[Route("api/v1/admin/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ITenantContext _tenantContext;

    /// <summary>
    /// 初始化用户管理控制器
    /// </summary>
    /// <param name="userService">用户管理服务</param>
    /// <param name="tenantContext">租户上下文，用于获取当前请求的租户 ID</param>
    public UsersController(IUserService userService, ITenantContext tenantContext)
    {
        _userService = userService;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 分页查询用户列表
    /// </summary>
    /// <param name="query">分页查询参数（页码、每页条数、排序、搜索）</param>
    /// <returns>分页用户结果</returns>
    [HttpGet]
    [RequirePermission("user:read")]
    [ProducesResponseType(typeof(PagedResult<UserDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<UserDto>>> GetUsers([FromQuery] PagedQuery query)
    {
        var result = await _userService.GetUsersAsync(query, _tenantContext.TenantId);
        return Ok(result);
    }

    /// <summary>
    /// 根据 ID 获取用户详情
    /// </summary>
    /// <param name="id">用户 ID</param>
    /// <returns>用户信息</returns>
    [HttpGet("{id:guid}")]
    [RequirePermission("user:read")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> GetUser(Guid id)
    {
        var user = await _userService.GetUserByIdAsync(id, _tenantContext.TenantId);
        if (user == null)
        {
            return NotFound(new { code = 404, message = "用户不存在" });
        }
        return Ok(user);
    }

    /// <summary>
    /// 创建新用户
    /// </summary>
    /// <param name="request">创建用户请求</param>
    /// <returns>创建后的用户信息</returns>
    [HttpPost]
    [RequirePermission("user:create")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserRequest request)
    {
        var user = await _userService.CreateUserAsync(request, _tenantContext.TenantId);
        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
    }

    /// <summary>
    /// 更新用户信息（非敏感字段）
    /// </summary>
    /// <param name="id">用户 ID</param>
    /// <param name="request">更新用户请求</param>
    /// <returns>更新后的用户信息</returns>
    [HttpPut("{id:guid}")]
    [RequirePermission("user:update")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
    {
        var user = await _userService.UpdateUserAsync(id, _tenantContext.TenantId, request);
        return Ok(user);
    }

    /// <summary>
    /// 停用用户（软删除）
    /// </summary>
    /// <param name="id">用户 ID</param>
    [HttpDelete("{id:guid}")]
    [RequirePermission("user:delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        await _userService.DeactivateUserAsync(id, _tenantContext.TenantId);
        return NoContent();
    }

    /// <summary>
    /// 变更用户角色
    /// </summary>
    /// <param name="id">用户 ID</param>
    /// <param name="request">角色变更请求</param>
    [HttpPut("{id:guid}/role")]
    [RequirePermission("user:role")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ChangeRole(Guid id, [FromBody] ChangeRoleRequest request)
    {
        await _userService.ChangeUserRoleAsync(id, _tenantContext.TenantId, request.Role);
        return Ok(new { message = "角色变更成功" });
    }
}

/// <summary>
/// 角色变更请求 DTO
/// </summary>
public class ChangeRoleRequest
{
    /// <summary>
    /// 目标角色名称（如 SystemAdmin、MaintenanceLead、Technician、Operator、Viewer）
    /// </summary>
    public string Role { get; set; } = string.Empty;
}
