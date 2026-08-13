using AutoMapper;
using EquipAI.Application.DTOs.Common;
using EquipAI.Application.DTOs.Users;
using EquipAI.Application.Interfaces;
using EquipAI.Application.Mapping;
using EquipAI.Application.Services;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Tests.Unit.Services;

/// <summary>
/// UserService 单元测试 — 验证用户 CRUD、角色管理、租户隔离等核心业务逻辑
/// </summary>
public class UserServiceTests : IAsyncDisposable
{
    private readonly ServiceProvider _sp;
    private readonly Guid _tenantId;

    public UserServiceTests()
    {
        _tenantId = Guid.NewGuid();
        var dbName = $"UserServiceTest_{Guid.NewGuid()}";
        var services = new ServiceCollection();

        // 注册 InMemory 数据库，模拟租户上下文
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(dbName));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(_tenantId));

        // 注册 AutoMapper，使用项目实际的 MappingProfile
        services.AddAutoMapper(_ => { }, typeof(MappingProfile).Assembly);

        services.AddLogging();
        // 审计日志服务（真实实现，写入同一 InMemory db，便于断言审计记录）
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddScoped<IUserService, UserService>();

        _sp = services.BuildServiceProvider();
    }

    // ==================== GetUsersAsync ====================

    [Fact]
    public async Task GetUsersAsync_有用户_应返回分页结果()
    {
        // Arrange：创建用户并写入数据库
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IUserService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var user1 = CreateTestUser("user1", _tenantId);
        var user2 = CreateTestUser("user2", _tenantId);
        db.Users.AddRange(user1, user2);
        await db.SaveChangesAsync();

        var query = new PagedQuery { Page = 1, PageSize = 20 };

        // Act
        var result = await service.GetUsersAsync(query, _tenantId);

        // Assert：验证分页结果包含所有用户
        result.Items.Should().HaveCount(2);
        result.Total.Should().Be(2);
        result.Page.Should().Be(1);
    }

    [Fact]
    public async Task GetUsersAsync_应按租户过滤()
    {
        // Arrange：为两个不同租户创建用户
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IUserService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var otherTenantId = Guid.NewGuid();
        var userA = CreateTestUser("tenantA_user", _tenantId);
        var userB = CreateTestUser("tenantB_user", otherTenantId);
        db.Users.AddRange(userA, userB);
        await db.SaveChangesAsync();

        var query = new PagedQuery { Page = 1, PageSize = 20 };

        // Act：查询当前租户的用户（全局过滤器会自动隔离）
        var result = await service.GetUsersAsync(query, _tenantId);

        // Assert：只返回当前租户的用户
        result.Items.Should().HaveCount(1);
        result.Items[0].Username.Should().Be("tenantA_user");
    }

    // ==================== GetUserByIdAsync ====================

    [Fact]
    public async Task GetUserByIdAsync_存在_应返回DTO()
    {
        // Arrange
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IUserService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var user = CreateTestUser("findme", _tenantId);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        // Act
        var result = await service.GetUserByIdAsync(user.Id, _tenantId);

        // Assert：返回的 DTO 应包含正确的用户信息
        result.Should().NotBeNull();
        result!.Id.Should().Be(user.Id);
        result.Username.Should().Be("findme");
    }

    [Fact]
    public async Task GetUserByIdAsync_不存在_应返回null()
    {
        // Arrange
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IUserService>();

        // Act：查询不存在的用户 ID
        var result = await service.GetUserByIdAsync(Guid.NewGuid(), _tenantId);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetUserByIdAsync_租户不匹配_应返回null()
    {
        // Arrange：将其他租户用户写入当前上下文，模拟已被 ChangeTracker 跟踪的路径。
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IUserService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var otherTenantId = Guid.NewGuid();
        var user = CreateTestUser("other-get", otherTenantId);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        // Act
        var result = await service.GetUserByIdAsync(user.Id, _tenantId);

        // Assert：用户详情必须同时匹配用户 ID 和当前租户。
        result.Should().BeNull("当前租户不得读取其他租户的用户详情");
    }

    // ==================== CreateUserAsync ====================

    [Fact]
    public async Task CreateUserAsync_应创建用户()
    {
        // Arrange
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IUserService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 预先创建租户，以便 CurrentUserCount 递增逻辑生效
        await CreateTenantAsync(db, _tenantId);

        var request = new CreateUserRequest
        {
            Username = "newuser",
            Password = "StrongPass123",
            DisplayName = "新用户",
            Role = "Operator"
        };

        // Act
        var result = await service.CreateUserAsync(request, _tenantId);

        // Assert：验证用户已写入数据库（使用 IgnoreQueryFilters 确保查到数据）
        result.Username.Should().Be("newuser");
        result.DisplayName.Should().Be("新用户");
        var dbCount = await db.Users.IgnoreQueryFilters().CountAsync();
        dbCount.Should().Be(1);
    }

    [Fact]
    public async Task CreateUserAsync_密码应被哈希()
    {
        // Arrange
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IUserService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await CreateTenantAsync(db, _tenantId);

        var plainPassword = "MySecretPwd123";
        var request = new CreateUserRequest
        {
            Username = "hashtest",
            Password = plainPassword
        };

        // Act
        await service.CreateUserAsync(request, _tenantId);

        // Assert：密码哈希应非空，且不等于明文密码
        var user = await db.Users.IgnoreQueryFilters()
            .FirstAsync(u => u.Username == "hashtest");
        user.PasswordHash.Should().NotBeNullOrEmpty();
        user.PasswordHash.Should().NotBe(plainPassword);
    }

    [Fact]
    public async Task CreateUserAsync_应设置MustChangePassword为true()
    {
        // Arrange
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IUserService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await CreateTenantAsync(db, _tenantId);

        var request = new CreateUserRequest
        {
            Username = "mustchange",
            Password = "InitialPass123"
        };

        // Act
        await service.CreateUserAsync(request, _tenantId);

        // Assert：新建用户必须修改密码
        var user = await db.Users.IgnoreQueryFilters()
            .FirstAsync(u => u.Username == "mustchange");
        user.MustChangePassword.Should().BeTrue();
    }

    [Fact]
    public async Task CreateUserAsync_应递增租户用户计数()
    {
        // Arrange
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IUserService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 预先创建租户并记录初始计数
        await CreateTenantAsync(db, _tenantId);
        var tenantBefore = await db.UnfilteredSet<Tenant>().FirstAsync(t => t.Id == _tenantId);
        var countBefore = tenantBefore.CurrentUserCount;

        var request = new CreateUserRequest
        {
            Username = "countuser",
            Password = "Password123"
        };

        // Act
        await service.CreateUserAsync(request, _tenantId);

        // Assert：租户的 CurrentUserCount 应递增 1
        var tenantAfter = await db.UnfilteredSet<Tenant>().FirstAsync(t => t.Id == _tenantId);
        tenantAfter.CurrentUserCount.Should().Be(countBefore + 1);
    }

    [Fact]
    public async Task CreateUserAsync_达到用户配额_应拒绝且不写入用户()
    {
        // 配额检查不能只依赖 HTTP 中间件：后台任务或其他入口直接调用服务时也必须保持席位不变量。
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IUserService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await CreateTenantAsync(db, _tenantId);
        var tenant = await db.UnfilteredSet<Tenant>().SingleAsync(t => t.Id == _tenantId);
        tenant.MaxUsers = 1;
        tenant.CurrentUserCount = 1;
        await db.SaveChangesAsync();

        var act = () => service.CreateUserAsync(
            new CreateUserRequest { Username = "over-limit-user", Password = "Password123" },
            _tenantId);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*用户*上限*");
        (await db.Users.IgnoreQueryFilters().CountAsync()).Should().Be(0,
            "配额拒绝必须与用户写入处于同一事务边界，不能留下超额用户");
        (await db.UnfilteredSet<Tenant>().SingleAsync(t => t.Id == _tenantId))
            .CurrentUserCount.Should().Be(1);
    }

    [Fact]
    public async Task CreateUserAsync_重复用户名_应抛出InvalidOperationException()
    {
        // Arrange
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IUserService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await CreateTenantAsync(db, _tenantId);

        // 先创建一个用户
        var firstRequest = new CreateUserRequest
        {
            Username = "duplicate_user",
            Password = "Password123"
        };
        await service.CreateUserAsync(firstRequest, _tenantId);

        // 再用相同用户名创建
        var secondRequest = new CreateUserRequest
        {
            Username = "duplicate_user",
            Password = "AnotherPass456"
        };

        // Act & Assert：应抛出用户名重复异常
        var act = () => service.CreateUserAsync(secondRequest, _tenantId);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*duplicate_user*");
    }

    // ==================== UpdateUserAsync ====================

    [Fact]
    public async Task UpdateUserAsync_应更新用户属性()
    {
        // Arrange
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IUserService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var user = CreateTestUser("updateuser", _tenantId, email: "old@example.com");
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var updateRequest = new UpdateUserRequest
        {
            Email = "new@example.com"
        };

        // Act
        var result = await service.UpdateUserAsync(user.Id, _tenantId, updateRequest);

        // Assert：邮箱应更新，其他字段不变
        result.Email.Should().Be("new@example.com");
        result.Username.Should().Be("updateuser");

        // 验证数据库中的值也已更新
        var dbUser = await db.Users.FindAsync(user.Id);
        dbUser!.Email.Should().Be("new@example.com");
    }

    [Fact]
    public async Task UpdateUserAsync_不存在_应抛出KeyNotFoundException()
    {
        // Arrange
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IUserService>();

        var updateRequest = new UpdateUserRequest
        {
            DisplayName = "不存在用户"
        };

        // Act & Assert：更新不存在的用户应抛出异常
        var act = () => service.UpdateUserAsync(Guid.NewGuid(), _tenantId, updateRequest);
        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task UpdateUserAsync_租户不匹配_应抛出KeyNotFoundException且保持原数据()
    {
        // Arrange：其他租户用户已被当前上下文跟踪，验证更新不会信任 FindAsync 的命中结果。
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IUserService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var otherTenantId = Guid.NewGuid();
        var user = CreateTestUser("other-update", otherTenantId, email: "original@example.com");
        db.Users.Add(user);
        await db.SaveChangesAsync();

        // Act
        var act = () => service.UpdateUserAsync(
            user.Id,
            _tenantId,
            new UpdateUserRequest { Email = "attacker@example.com" });

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>();
        var persisted = await db.Users.IgnoreQueryFilters().AsNoTracking()
            .SingleAsync(u => u.Id == user.Id);
        persisted.Email.Should().Be("original@example.com");
    }

    // ==================== DeactivateUserAsync ====================

    [Fact]
    public async Task DeactivateUserAsync_应设置IsActive为false()
    {
        // Arrange
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IUserService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var user = CreateTestUser("deactivateme", _tenantId);
        user.IsActive.Should().BeTrue(); // 初始状态应为启用
        db.Users.Add(user);
        await db.SaveChangesAsync();

        // Act
        await service.DeactivateUserAsync(user.Id, _tenantId);

        // Assert：用户应被停用
        var deactivatedUser = await db.Users.FindAsync(user.Id);
        deactivatedUser!.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task DeactivateUserAsync_停用用户_应递减CurrentUserCount释放席位()
    {
        // 场景：工业客户员工离职，停用其账号（软删除）。期望释放席位（CurrentUserCount--），
        // 否则配额只增不减——离职员工的席位被永久占用，新员工无法建账号（配额卡死）。
        // 与 DeviceService.DeleteDeviceAsync 维护 CurrentDeviceCount-- 对称。
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IUserService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await CreateTenantAsync(db, _tenantId);
        // 创建 1 个用户 → 席位占 1（CreateUserAsync 会 ++）
        await service.CreateUserAsync(
            new CreateUserRequest { Username = "leaver", Password = "Password123" }, _tenantId);
        (await db.UnfilteredSet<Tenant>().FirstAsync(t => t.Id == _tenantId))
            .CurrentUserCount.Should().Be(1, "前置：创建 1 个用户，席位占 1");

        var user = await db.Users.FirstAsync(u => u.Username == "leaver");

        // Act：停用离职员工
        await service.DeactivateUserAsync(user.Id, _tenantId);

        // Assert：席位应释放（CurrentUserCount--），用户应被停用
        var tenantAfter = await db.UnfilteredSet<Tenant>().FirstAsync(t => t.Id == _tenantId);
        tenantAfter.CurrentUserCount.Should().Be(0,
            "停用用户须释放席位（CurrentUserCount--），否则新员工无法建账号（配额卡死）");
        (await db.Users.FindAsync(user.Id))!.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task DeactivateUserAsync_重复停用同一用户_不应重复扣减计数()
    {
        // 幂等性回归：同一用户重复停用不应重复扣减席位（IsActive 守卫），否则计数被多扣。
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IUserService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await CreateTenantAsync(db, _tenantId);
        await service.CreateUserAsync(
            new CreateUserRequest { Username = "dduser", Password = "Password123" }, _tenantId);
        var user = await db.Users.FirstAsync(u => u.Username == "dduser");

        // Act：连续停用两次（模拟重复调用/误操作）
        await service.DeactivateUserAsync(user.Id, _tenantId);   // 首次：席位 1 → 0
        await service.DeactivateUserAsync(user.Id, _tenantId);   // 重复：席位应保持 0

        // Assert：计数不应变为负数（重复扣减）
        var tenant = await db.UnfilteredSet<Tenant>().FirstAsync(t => t.Id == _tenantId);
        tenant.CurrentUserCount.Should().Be(0, "重复停用同一用户不应重复扣减席位（IsActive 守卫防重复扣减）");
    }

    [Fact]
    public async Task DeactivateUserAsync_租户不匹配_应抛出KeyNotFoundException且不改变状态()
    {
        // Arrange：其他租户用户已被当前上下文跟踪，验证停用不会跨租户执行。
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IUserService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var otherTenantId = Guid.NewGuid();
        var user = CreateTestUser("other-deactivate", otherTenantId);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        // Act
        var act = () => service.DeactivateUserAsync(user.Id, _tenantId);

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>();
        var persisted = await db.Users.IgnoreQueryFilters().AsNoTracking()
            .SingleAsync(u => u.Id == user.Id);
        persisted.IsActive.Should().BeTrue();
    }

    // ==================== ChangeUserRoleAsync ====================

    [Fact]
    public async Task ChangeUserRoleAsync_应更新角色()
    {
        // Arrange
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IUserService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var user = CreateTestUser("rolechange", _tenantId, role: UserRole.Operator);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        // Act：将角色从 Operator 变更为 Technician
        await service.ChangeUserRoleAsync(user.Id, _tenantId, "Technician");

        // Assert：角色应更新为 Technician
        var updatedUser = await db.Users.FindAsync(user.Id);
        updatedUser!.Role.Should().Be(UserRole.Technician);
    }

    [Fact]
    public async Task ChangeUserRoleAsync_应记录审计日志含变更前后角色()
    {
        // 角色变更（提权/降权）是最高风险安全操作，必须留痕审计：记录变更前后角色，
        // 以便追溯"谁在何时把谁提权为 SystemAdmin"等内部威胁（ISO 27001 / IEC 62443 可审计性）。
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IUserService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await CreateTenantAsync(db, _tenantId);
        var user = CreateTestUser("roleaudit", _tenantId, role: UserRole.Operator);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        // Act：把操作员提权为维保主管
        await service.ChangeUserRoleAsync(user.Id, _tenantId, "MaintenanceLead");

        // Assert：审计日志应记录角色变更，含变更前后角色（断言用新 scope 避免 ChangeTracker 干扰）
        using var assertScope = _sp.CreateScope();
        var assertDb = assertScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var audit = await assertDb.UnfilteredSet<AuditLog>()
            .FirstOrDefaultAsync(a => a.ResourceId == user.Id.ToString() && a.Action == "RoleChange");
        audit.Should().NotBeNull("角色变更必须留痕审计，否则提权等内部威胁不可追溯");
        audit!.Description.Should().Contain("Operator", "审计须记录变更前角色");
        audit.Description.Should().Contain("MaintenanceLead", "审计须记录变更后角色");
    }

    [Fact]
    public async Task DeactivateUserAsync_应记录审计日志()
    {
        // 停用用户属安全敏感操作，必须留痕审计（谁在何时停用了哪个用户）。
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IUserService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await CreateTenantAsync(db, _tenantId);
        var user = CreateTestUser("deactaudit", _tenantId);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        await service.DeactivateUserAsync(user.Id, _tenantId);

        using var assertScope = _sp.CreateScope();
        var assertDb = assertScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var audit = await assertDb.UnfilteredSet<AuditLog>()
            .FirstOrDefaultAsync(a => a.ResourceId == user.Id.ToString() && a.Action == "Deactivate");
        audit.Should().NotBeNull("停用用户必须留痕审计");
    }

    [Fact]
    public async Task ChangeUserRoleAsync_无效角色_应抛出ArgumentException()
    {
        // Arrange
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IUserService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var user = CreateTestUser("badrole", _tenantId);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        // Act & Assert：传入无效角色名应抛出参数异常
        var act = () => service.ChangeUserRoleAsync(user.Id, _tenantId, "InvalidRole");
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*InvalidRole*");
    }

    [Fact]
    public async Task ChangeUserRoleAsync_租户不匹配_应抛出KeyNotFoundException且不改变角色()
    {
        // Arrange：其他租户用户已被当前上下文跟踪，验证角色变更不会造成跨租户提权。
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IUserService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var otherTenantId = Guid.NewGuid();
        var user = CreateTestUser("other-role", otherTenantId, role: UserRole.Operator);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        // Act
        var act = () => service.ChangeUserRoleAsync(user.Id, _tenantId, "SystemAdmin");

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>();
        var persisted = await db.Users.IgnoreQueryFilters().AsNoTracking()
            .SingleAsync(u => u.Id == user.Id);
        persisted.Role.Should().Be(UserRole.Operator);
    }

    // ==================== 辅助方法 ====================

    /// <summary>
    /// 创建测试用用户实体
    /// </summary>
    /// <param name="username">用户名</param>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="role">角色（默认 Viewer）</param>
    /// <param name="email">邮箱（可选）</param>
    /// <returns>用户实体</returns>
    private static User CreateTestUser(
        string username,
        Guid tenantId,
        UserRole role = UserRole.Viewer,
        string? email = null)
    {
        return new User
        {
            Username = username,
            TenantId = tenantId,
            PasswordHash = "hashed_password_placeholder",
            DisplayName = username,
            Role = role,
            Email = email,
            IsActive = true
        };
    }

    /// <summary>
    /// 创建测试用租户实体并写入数据库
    /// </summary>
    /// <param name="db">数据库上下文</param>
    /// <param name="tenantId">租户 ID</param>
    private static async Task CreateTenantAsync(AppDbContext db, Guid tenantId)
    {
        var tenant = new Tenant
        {
            Id = tenantId,
            Name = "测试租户",
            Slug = $"test-{tenantId:N}",
            MaxUsers = 100
        };
        db.Tenants.Add(tenant);
        await db.SaveChangesAsync();
    }

    /// <summary>
    /// 测试用租户上下文 — 模拟 ITenantContext，提供租户隔离信息
    /// </summary>
    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode { get; } = "shared";
        public bool IsSystemAdmin { get; } = false;
        public Guid UserId { get; } = Guid.NewGuid();
    }

    public async ValueTask DisposeAsync() => await _sp.DisposeAsync();
}
