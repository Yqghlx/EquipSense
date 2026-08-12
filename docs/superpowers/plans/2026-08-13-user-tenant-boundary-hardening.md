# 用户服务显式租户边界加固实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让用户服务的详情、更新、停用和角色变更按 `userId + tenantId` 做显式匹配，阻止 `FindAsync` 从跟踪实体返回其他租户用户。

**Architecture:** 保留 `AppDbContext` 全局租户过滤器作为纵深防御；列表和所有按 ID 的业务操作都把传入 `tenantId` 写入查询谓词。创建用户的全局用户名唯一性检查保持 `IgnoreQueryFilters` 语义不变，公开接口和审计契约不变。

**Tech Stack:** .NET 8、EF Core 8、xUnit、FluentAssertions、InMemory provider。

## Global Constraints

- 所有新增注释、测试说明和文档使用简体中文。
- 不修改真实凭据、证书、数据库卷或 `docker/.env`。
- 不改变 `IUserService` 的公开方法签名，不新增迁移，不修改全局用户名唯一性策略。
- 先写红测确认 `FindAsync` 跟踪实体风险，再修改生产代码；完成前运行用户服务聚焦测试、完整单元测试和 Release 编译。

---

### Task 1: 建立用户服务跨租户回归测试

**Files:**
- Modify: `tests/EquipAI.Tests.Unit/Services/UserServiceTests.cs`

**Interfaces:**
- Consumes: 现有 `IUserService` 的详情、更新、停用和角色变更方法。
- Produces: 4 个跨租户回归测试，分别锁定详情不返回、更新不修改、停用不改变状态/计数、角色变更不提权。

- [x] **Step 1: Write the failing tests**

在现有对应测试组中写入其他租户用户；保存后继续复用同一 `AppDbContext`，让旧实现的 `FindAsync` 命中 ChangeTracker：

```csharp
[Fact]
public async Task GetUserByIdAsync_租户不匹配_应返回null()
{
    using var scope = _sp.CreateScope();
    var service = scope.ServiceProvider.GetRequiredService<IUserService>();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var otherTenantId = Guid.NewGuid();
    var user = CreateTestUser("other-get", otherTenantId);
    db.Users.Add(user);
    await db.SaveChangesAsync();

    var result = await service.GetUserByIdAsync(user.Id, _tenantId);

    result.Should().BeNull("用户详情必须同时匹配用户 ID 和当前租户");
}

[Fact]
public async Task UpdateUserAsync_租户不匹配_应抛出KeyNotFoundException且保持原数据()
{
    using var scope = _sp.CreateScope();
    var service = scope.ServiceProvider.GetRequiredService<IUserService>();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var otherTenantId = Guid.NewGuid();
    var user = CreateTestUser("other-update", otherTenantId, email: "original@example.com");
    db.Users.Add(user);
    await db.SaveChangesAsync();

    var act = () => service.UpdateUserAsync(
        user.Id, _tenantId, new UpdateUserRequest { Email = "attacker@example.com" });

    await act.Should().ThrowAsync<KeyNotFoundException>();
    var persisted = await db.Users.IgnoreQueryFilters().AsNoTracking()
        .SingleAsync(u => u.Id == user.Id);
    persisted.Email.Should().Be("original@example.com");
}

[Fact]
public async Task DeactivateUserAsync_租户不匹配_应抛出KeyNotFoundException且不改变状态()
{
    using var scope = _sp.CreateScope();
    var service = scope.ServiceProvider.GetRequiredService<IUserService>();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var otherTenantId = Guid.NewGuid();
    var user = CreateTestUser("other-deactivate", otherTenantId);
    db.Users.Add(user);
    await db.SaveChangesAsync();

    var act = () => service.DeactivateUserAsync(user.Id, _tenantId);

    await act.Should().ThrowAsync<KeyNotFoundException>();
    var persisted = await db.Users.IgnoreQueryFilters().AsNoTracking()
        .SingleAsync(u => u.Id == user.Id);
    persisted.IsActive.Should().BeTrue();
}

[Fact]
public async Task ChangeUserRoleAsync_租户不匹配_应抛出KeyNotFoundException且不改变角色()
{
    using var scope = _sp.CreateScope();
    var service = scope.ServiceProvider.GetRequiredService<IUserService>();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var otherTenantId = Guid.NewGuid();
    var user = CreateTestUser("other-role", otherTenantId, role: UserRole.Operator);
    db.Users.Add(user);
    await db.SaveChangesAsync();

    var act = () => service.ChangeUserRoleAsync(user.Id, _tenantId, "SystemAdmin");

    await act.Should().ThrowAsync<KeyNotFoundException>();
    var persisted = await db.Users.IgnoreQueryFilters().AsNoTracking()
        .SingleAsync(u => u.Id == user.Id);
    persisted.Role.Should().Be(UserRole.Operator);
}
```

- [x] **Step 2: Run tests to verify they fail**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~UserServiceTests" --no-restore`

Expected: 新增的 4 个测试失败，错误分别表现为返回其他租户用户、更新成功、停用成功或角色被改为 `SystemAdmin`，而不是编译错误。

实际证据：修复前 4 个新增测试均失败，复现了 `FindAsync` 从 ChangeTracker 返回其他租户用户的详情读取、更新、停用和角色变更路径。

### Task 2: 为用户查询和写操作加入显式租户谓词

**Files:**
- Modify: `src/EquipAI.Application/Services/UserService.cs:13-85,140-220`

**Interfaces:**
- Consumes: Task 1 的红测；现有方法参数 `tenantId`。
- Produces: 列表、详情、更新、停用、角色变更都显式匹配 `TenantId == tenantId`；用户名全局唯一性检查继续跨租户执行。

- [x] **Step 1: Write minimal implementation**

使用以下查询形态替换按 ID 的 `FindAsync`，并在列表查询起点加入显式租户条件：

```csharp
var users = _dbContext.Users
    .Where(u => u.TenantId == tenantId)
    .AsQueryable();

var user = await _dbContext.Users
    .FirstOrDefaultAsync(u => u.Id == userId && u.TenantId == tenantId);
```

停用用户时租户计数继续使用 `UnfilteredSet<Tenant>()`，因为它是按显式租户维护系统级配额的跨过滤器操作；仅用户资源定位改为复合谓词。

- [x] **Step 2: Run focused tests to verify they pass**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~UserServiceTests" --no-restore`

Expected: 用户服务全部通过，包含 4 个跨租户回归测试。

实际证据：`UserServiceTests` 22/22 通过。

### Task 3: 完整验证、审查和提交

**Files:**
- No additional source files.

**Interfaces:**
- Consumes: Task 2 的用户服务实现和测试。
- Produces: 可复核的聚焦测试、完整单元测试和 Release 编译证据。

- [x] **Step 1: Run complete unit tests**

Run: `dotnet test tests/EquipAI.Tests.Unit --no-restore -nodeReuse:false -maxcpucount:1`

Expected: 0 failed。

实际证据：完整单元测试 1513/1513 通过。

- [x] **Step 2: Build Release solution**

Run: `dotnet build EquipAI.sln --configuration Release --no-restore -nodeReuse:false -maxcpucount:1 -p:BuildInParallel=false -v:minimal`

Expected: 0 errors，0 warnings。

实际证据：单节点 Release 方案构建成功，0 Warning、0 Error。

- [x] **Step 3: Review and commit**

Run: `git -c core.fsmonitor=false diff --check`；确认差异只涉及用户服务租户谓词、对应回归测试和本计划文档后，使用提交信息 `fix(security): enforce tenant boundary in user service` 提交。

实际证据：独立审查 Approved，`git diff --check` 通过；已提交为 `113e5c6`（`fix(security): enforce tenant boundary in user service`）。
