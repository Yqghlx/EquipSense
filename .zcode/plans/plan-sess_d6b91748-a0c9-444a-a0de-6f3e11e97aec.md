## P3 #27 — CQRS 只读路径分离（基础设施就绪，默认安全）

### 决策与现状
- 项目已有 Query/Command 分离（TelemetryQueryService/AlertQueryService/AnalysisQueryService vs Command services）
- 缺失的「只读副本」部分经分析有重大权衡：
  - `AlertQueryService` **非纯读**（含 SaveChangesAsync），不能整体迁移
  - 所有 query service 注入具体 `AppDbContext`，无接口抽象，透明替换需大改
  - read replica 有复制延迟风险（刚写数据读不到）
  - 单实例 Docker Compose 部署下 read replica 是过度优化

### 采用方案：基础设施就绪 + 默认安全（不强制 replica）
为多实例/读写分离部署**预留**只读路径，默认指向主库（行为零变化）。只有纯读 query service 可选迁移。

### 实现步骤

1. **新增只读连接字符串配置**
   - `appsettings.json` + `appsettings.Production.json`：`ConnectionStrings.ReadOnly`（默认值同 `Default`，无独立连接时退化为单库）
   - `docker/docker-compose.yml` backend env：`ConnectionStrings__ReadOnly`（默认 fallback 到 Default）

2. **新增 `AppReadDbContext`**（`src/EquipAI.Infrastructure/Data/AppReadDbContext.cs`）
   - 继承自 `AppDbContext`，复用全部 DbSet + 多租户全局过滤器（保持租户隔离）
   - 构造函数用 `DbContextOptions<AppReadDbContext>`（独立 options 类型，便于独立配置连接串/重试）
   - `OnConfiguring` 重写或注册时设 `QueryTrackingBehavior = NoTracking`（只读优化：无变更跟踪开销）
   - **禁止 SaveChanges**：重写 `SaveChangesAsync` 抛 `NotSupportedException`（编译期 + 运行期防误用）

3. **DI 注册**（`ServiceCollectionExtensions.AddInfrastructure`）
   - `services.AddDbContext<AppReadDbContext>(...)` 用 `ConnectionStrings:ReadOnly`，同样 `EnableRetryOnFailure`
   - 注册独立的 health check（Program.cs `AddHealthChecks`）：`replica-postgresql`，tag `ready`（不加 `startup`/`liveness`，replica 故障不应阻止启动）

4. **迁移纯读 query service**（仅 2 个，AlertQueryService 不动）
   - `TelemetryQueryService`：构造函数加 `AppReadDbContext readDbContext` 可选参数，查询改用 read context
   - `AnalysisQueryService`：同上
   - **兼容设计**：read context 默认 fallback——若未配置独立 ReadOnly 连接，DI 仍注入 AppReadDbContext（指向 Default），行为与现状完全一致

5. **单元测试**（`tests/EquipAI.Tests.Unit/Infrastructure/AppReadDbContextTests.cs`）
   - `SaveChangesAsync_Throws_NotSupported`（防误写）
   - `QueryTrackingBehavior_NoTracking`（只读优化生效）
   - DI 注册：AppReadDbContext 与 AppDbContext 独立解析（不共享实例）

6. **文档**
   - `docs/environment-variables.md`：加 `ConnectionStrings__ReadOnly` 说明
   - 路线图 #27 标记完成，附权衡说明（AlertQueryService 非纯读未迁移、单实例默认无 replica、何时启用）
   - **明确不**做：PG 物理 replica 部署（需运维决策 + 流复制配置，超出代码库范围）

### 不做（明确边界）
- ❌ 不部署 PG 物理 read replica（需 pg_basebackup + 流复制配置，运维决策）
- ❌ 不迁移 AlertQueryService（含写操作，需先拆分为 Query + Command 两类）
- ❌ 不引入 IDbContext 接口抽象（过度工程，read context 继承 AppDbContext 已够用）
- ❌ 不做读副本路由中间件/负载均衡（EF Core 直接按注入类型路由）

### 验证
- `dotnet build EquipAI.slnx` 绿
- `dotnet test tests/EquipAI.Tests.Unit` 全绿（新增 ~3 测试，现有 1048 不回归）
- docker-compose config 验证
- 默认配置（ReadOnly=Default）下所有现有集成测试行为不变