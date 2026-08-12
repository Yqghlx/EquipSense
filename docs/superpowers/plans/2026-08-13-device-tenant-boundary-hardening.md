# 设备服务显式租户边界加固实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让设备 CRUD 服务对传入的 `tenantId` 做显式数据边界校验，避免 `FindAsync` 的跟踪实体路径绕过全局查询过滤器后形成跨租户读取、修改或删除。

**Architecture:** 保留 `AppDbContext` 的全局租户过滤器作为纵深防御，同时在设备创建唯一性、列表、详情、更新、删除查询中把 `TenantId` 写入业务谓词。公开接口签名不变，控制器和租户解析链路不改；通过服务单元测试覆盖“同 ID、不同租户”的详情/写操作和上下文租户不一致回归场景。

**Tech Stack:** .NET 8、EF Core 8、xUnit、FluentAssertions、InMemory provider。

## Global Constraints

- 所有新增注释、测试说明和文档使用简体中文。
- 不修改真实凭据、证书、数据库卷或 `docker/.env`。
- 不改变 `IDeviceService` 的公开方法签名，不新增迁移，不扩大到 WorkOrder 等未纳入本切片的服务。
- 先写回归测试并确认当前实现失败，再修改生产代码；完成前运行聚焦测试、完整单元测试和后端编译验证。

---

### Task 1: 建立跨租户设备 CRUD 回归测试

**Files:**
- Modify: `tests/EquipAI.Tests.Unit/Services/DeviceServiceTests.cs`

**Interfaces:**
- Consumes: 现有 `DeviceService` 的 `GetDeviceByIdAsync`、`UpdateDeviceAsync`、`DeleteDeviceAsync` 接口。
- Produces: 四个可复现的租户边界回归测试，要求不同租户设备对当前租户不可见、不可修改、不可删除，且设备编码唯一性使用显式租户参数。

- [x] **Step 1: Write the failing test**

在 `GetDeviceByIdAsync`、`UpdateDeviceAsync`、`DeleteDeviceAsync` 现有测试组中加入跨租户测试，并在 `CreateDeviceAsync` 测试组加入上下文租户不一致的编码唯一性测试；跨租户实体通过 `TenantId = Guid.NewGuid()` 写入同一个测试数据库，使用 `IgnoreQueryFilters()` 验证写操作没有改变或删除它：

```csharp
[Fact]
public async Task GetDeviceByIdAsync_租户不匹配_应返回null()
{
    var otherTenantId = Guid.NewGuid();
    var device = new Device
    {
        Id = Guid.NewGuid(),
        TenantId = otherTenantId,
        DeviceCode = "DEV-OTHER-GET",
        Name = "其他租户设备",
        Type = "电机",
    };
    _db.Devices.Add(device);
    await _db.SaveChangesAsync();

    var result = await _sut.GetDeviceByIdAsync(device.Id, _tenantId);

    result.Should().BeNull("设备详情必须同时匹配设备 ID 和当前租户");
}

[Fact]
public async Task UpdateDeviceAsync_租户不匹配_应视为不存在且保持原数据()
{
    var otherTenantId = Guid.NewGuid();
    var device = new Device
    {
        Id = Guid.NewGuid(),
        TenantId = otherTenantId,
        DeviceCode = "DEV-OTHER-UPDATE",
        Name = "不可被修改的设备",
        Type = "电机",
    };
    _db.Devices.Add(device);
    await _db.SaveChangesAsync();

    var act = () => _sut.UpdateDeviceAsync(
        device.Id,
        _tenantId,
        new UpdateDeviceRequest { Name = "越权修改" });

    await act.Should().ThrowAsync<KeyNotFoundException>();

    var persisted = await _db.Devices.IgnoreQueryFilters()
        .AsNoTracking()
        .SingleAsync(d => d.Id == device.Id);
    persisted.Name.Should().Be("不可被修改的设备");
}

[Fact]
public async Task DeleteDeviceAsync_租户不匹配_应视为不存在且保留原数据()
{
    var otherTenantId = Guid.NewGuid();
    var device = new Device
    {
        Id = Guid.NewGuid(),
        TenantId = otherTenantId,
        DeviceCode = "DEV-OTHER-DELETE",
        Name = "不可被删除的设备",
        Type = "电机",
    };
    _db.Devices.Add(device);
    await _db.SaveChangesAsync();

    var act = () => _sut.DeleteDeviceAsync(device.Id, _tenantId);

    await act.Should().ThrowAsync<KeyNotFoundException>();

    var exists = await _db.Devices.IgnoreQueryFilters()
        .AsNoTracking()
        .AnyAsync(d => d.Id == device.Id && d.TenantId == otherTenantId);
    exists.Should().BeTrue("当前租户不得删除其他租户的设备");
}

[Fact]
public async Task CreateDeviceAsync_显式租户与上下文不一致_唯一性检查应使用显式租户()
{
    var contextTenantId = Guid.NewGuid();
    await SeedTenantAsync();

    var contextOptions = new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(_databaseName)
        .Options;
    await using var contextDb = new AppDbContext(
        contextOptions,
        new TestTenantContext(contextTenantId));
    contextDb.Devices.Add(new Device
    {
        Id = Guid.NewGuid(),
        TenantId = contextTenantId,
        DeviceCode = "DEV-CROSS-CREATE",
        Name = "上下文租户设备",
        Type = "电机",
    });
    await contextDb.SaveChangesAsync();

    var mapperConfig = new MapperConfiguration(
        cfg => cfg.AddProfile<MappingProfile>(),
        Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
    var contextService = new DeviceService(
        contextDb,
        mapperConfig.CreateMapper(),
        LoggerFactory.Create(_ => { }).CreateLogger<DeviceService>(),
        _audit);
    var result = await contextService.CreateDeviceAsync(new CreateDeviceRequest
    {
        DeviceCode = "DEV-CROSS-CREATE",
        Name = "显式租户新设备",
        Type = "泵",
    }, _tenantId);

    result.DeviceCode.Should().Be("DEV-CROSS-CREATE");
    var persisted = await _db.Devices.IgnoreQueryFilters()
        .AsNoTracking()
        .SingleAsync(d => d.Id == result.Id);
    persisted.TenantId.Should().Be(_tenantId);
}
```

- [x] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~DeviceServiceTests" --no-restore`

Expected: 新增的跨租户测试至少有一个失败；失败现象应表明 `FindAsync(deviceId)` 找到了其他租户的已跟踪实体，而不是测试编译错误。

实际证据：修复前详情、更新、删除 3 个回归测试均失败；新增创建唯一性测试也因上下文租户误用而失败。

### Task 2: 在设备 CRUD 查询中加入显式租户谓词

**Files:**
- Modify: `src/EquipAI.Application/Services/DeviceService.cs:39-130,156-210`

**Interfaces:**
- Consumes: Task 1 的跨租户回归测试；现有方法参数中的 `tenantId`。
- Produces: 设备编码唯一性、列表、详情、更新、删除均显式使用 `TenantId == tenantId`，保留原有异常契约和清理行为。

- [x] **Step 1: Write minimal implementation**

按以下查询形态修改，不使用 `FindAsync` 读取业务实体：

```csharp
var devices = _dbContext.Devices
    .Where(d => d.TenantId == tenantId)
    .AsQueryable();

var device = await _dbContext.Devices
    .FirstOrDefaultAsync(d => d.Id == deviceId && d.TenantId == tenantId);
```

详情、更新、删除分别使用同样的复合谓词；删除后的告警、网关关联、规则清理继续使用当前设备 ID，但不改变现有租户过滤和计数逻辑。同步更新相关 XML 注释，说明全局过滤器是纵深防御而非唯一边界。

- [x] **Step 2: Run focused tests to verify it passes**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~DeviceServiceTests" --no-restore`

Expected: DeviceService 测试全部通过，包含 4 个租户边界回归测试。

实际证据：`DeviceServiceTests` 28/28 通过。

### Task 3: 运行验证并记录安全证据

**Files:**
- Modify: `docs/evaluation/00-INDEX.md` only if the existing安全评估入口需要新增本切片的当前证据；否则不改文档。

**Interfaces:**
- Consumes: Task 2 已通过的设备服务实现和测试。
- Produces: 可复核的聚焦测试、完整单元测试和 Release 编译结果；不得把未完成的真实环境门禁写成已通过。

- [x] **Step 1: Run the complete unit test project**

Run: `dotnet test tests/EquipAI.Tests.Unit --no-restore`

Expected: 0 failed。

实际证据：完整单元测试 1508/1508 通过。

- [x] **Step 2: Build the release solution**

Run: `dotnet build EquipAI.sln --configuration Release --no-restore`

Expected: 0 errors，且无新增警告。

实际证据：单节点 Release 方案构建成功，0 Warning、0 Error；WebAPI Release 构建也成功，0 Warning、0 Error。

- [x] **Step 3: Review the diff and commit**

Run: `git -c core.fsmonitor=false diff --check` and `git -c core.fsmonitor=false diff -- src/EquipAI.Application/Services/DeviceService.cs tests/EquipAI.Tests.Unit/Services/DeviceServiceTests.cs`

Expected: 仅包含显式租户边界和对应测试；提交信息使用 `fix(security): enforce tenant boundary in device crud`。

实际证据：`git diff --check` 通过；既有跨租户 HTTP 探针 2/2 通过；已提交为 `c802bad`（`fix(security): enforce tenant boundary in device crud`）。
