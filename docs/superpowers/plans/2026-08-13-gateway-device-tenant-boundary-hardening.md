# 网关设备配置显式租户边界加固实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让网关设备配置列表、更新和删除显式绑定当前租户，防止 `FindAsync` 跟踪实体路径和未来过滤器变化造成跨租户配置泄露或破坏。

**Architecture:** 保留 `AppDbContext` 全局租户过滤器，同时在 `GatewayDeviceConfigService` 的当前租户列表、详情写操作中使用 `_tenantContext.TenantId` 作为业务谓词。网关密钥认证的 `PullConfigAsync` 已经使用显式 `(tenantId, gatewayId)`，不改变其绕过过滤器的设计。

**Tech Stack:** .NET 8、EF Core 8、xUnit、FluentAssertions、InMemory provider。

## Global Constraints

- 所有新增注释、测试说明和文档使用简体中文。
- 不修改真实凭据、证书、数据库卷或 `docker/.env`。
- 不改变 Controller 路由、状态码或公开服务方法签名。
- 先写红测确认旧 `FindAsync` 路径失败，再做最小实现；完成前运行聚焦测试、完整单元测试和 Release 编译。

---

### Task 1: 建立网关配置跨租户回归测试

**Files:**
- Modify: `tests/EquipAI.Tests.Unit/Web/GatewayDeviceConfigServiceTests.cs`

**Interfaces:**
- Consumes: `GatewayDeviceConfigService.ListAsync`、`UpdateAsync`、`DeleteAsync`。
- Produces: 3 个跨租户回归测试，验证列表不返回、更新不修改、删除不删除其他租户配置。

- [ ] **Step 1: Write the failing tests**

为测试文件增加 InMemory `AppDbContext`、固定 `ITenantContext` 和服务构造辅助方法；在同一上下文保存其他租户配置后调用服务：

```csharp
[Fact]
public async Task ListAsync_应只返回当前租户配置()
{
    await using var db = CreateDb(out var contextTenantId);
    var serviceTenantId = Guid.NewGuid();
    db.GatewayDevices.Add(CreateGatewayDevice(contextTenantId, "上下文租户配置"));
    await db.SaveChangesAsync();
    var service = CreateService(db, serviceTenantId);

    var result = await service.ListAsync();

    result.Should().BeEmpty("网关配置列表不得依赖可能失配的全局过滤器上下文");
}

[Fact]
public async Task UpdateAsync_其他租户配置_应返回null且保持原数据()
{
    await using var db = CreateDb(out var tenantId);
    var entity = CreateGatewayDevice(Guid.NewGuid(), "不可修改配置");
    db.GatewayDevices.Add(entity);
    await db.SaveChangesAsync();
    var service = CreateService(db, tenantId);

    var result = await service.UpdateAsync(
        entity.Id,
        new UpdateGatewayDeviceRequest { DeviceName = "越权修改" });

    result.Should().BeNull();
    var persisted = await db.GatewayDevices.IgnoreQueryFilters()
        .AsNoTracking().SingleAsync(d => d.Id == entity.Id);
    persisted.DeviceName.Should().Be("不可修改配置");
}

[Fact]
public async Task DeleteAsync_其他租户配置_应返回false且保留原数据()
{
    await using var db = CreateDb(out var tenantId);
    var entity = CreateGatewayDevice(Guid.NewGuid(), "不可删除配置");
    db.GatewayDevices.Add(entity);
    await db.SaveChangesAsync();
    var service = CreateService(db, tenantId);

    var deleted = await service.DeleteAsync(entity.Id);

    deleted.Should().BeFalse();
    var exists = await db.GatewayDevices.IgnoreQueryFilters()
        .AsNoTracking().AnyAsync(d => d.Id == entity.Id);
    exists.Should().BeTrue();
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~GatewayDeviceConfigServiceTests" --no-restore`

Expected: 3 个新增测试因 `FindAsync`/全局上下文行为而失败，失败应表现为列表泄露、更新成功或删除成功，而不是编译错误。

实际证据：修复前 3 个新增测试均失败；列表返回了上下文租户配置，更新和删除均命中了其他租户的已跟踪实体。

### Task 2: 在网关配置服务中加入显式租户谓词

**Files:**
- Modify: `src/EquipAI.Application/Services/GatewayDeviceConfigService.cs:61-78,211-244`

**Interfaces:**
- Consumes: Task 1 红测和 `_tenantContext.TenantId`。
- Produces: 列表、更新、删除都显式匹配 `TenantId == _tenantContext.TenantId`；`PullConfigAsync` 的显式租户+网关边界保持不变。

- [x] **Step 1: Write minimal implementation**

使用以下查询形态替换当前实现：

```csharp
var query = _dbContext.GatewayDevices
    .Where(d => d.TenantId == _tenantContext.TenantId)
    .AsQueryable();

var entity = await _dbContext.GatewayDevices
    .FirstOrDefaultAsync(
        d => d.Id == id && d.TenantId == _tenantContext.TenantId,
        ct);
```

更新和删除复用同一复合谓词；不改变 DTO 映射、日志、返回 null/false 契约。

- [x] **Step 2: Run focused tests to verify they pass**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~GatewayDeviceConfigServiceTests" --no-restore`

Expected: 网关配置服务测试全部通过，包含 3 个跨租户回归测试。

实际证据：`GatewayDeviceConfigServiceTests` 4/4 通过；既有网关认证代理测试保持通过。

### Task 3: 完整验证、审查和提交

**Files:**
- No additional source files.

**Interfaces:**
- Consumes: Task 2 实现和测试。
- Produces: 聚焦测试、完整单元测试和 Release 编译证据。

- [x] **Step 1: Run complete unit tests**

Run: `dotnet test tests/EquipAI.Tests.Unit --no-restore -nodeReuse:false -maxcpucount:1`

Expected: 0 failed。

实际证据：完整单元测试 1516/1516 通过。

- [x] **Step 2: Build Release solution**

Run: `dotnet build EquipAI.sln --configuration Release --no-restore -nodeReuse:false -maxcpucount:1 -p:BuildInParallel=false -v:minimal`

Expected: 0 errors，0 warnings。

实际证据：单节点 Release 方案构建成功，0 Warning、0 Error。

- [x] **Step 3: Review and commit**

Run: `git -c core.fsmonitor=false diff --check`；确认差异仅涉及网关配置租户谓词、对应测试和本计划文档后，使用提交信息 `fix(security): enforce tenant boundary in gateway config` 提交。

实际证据：独立审查 Approved，`git diff --check` 通过；已提交为 `928aa95`（`fix(security): enforce tenant boundary in gateway config`）。
