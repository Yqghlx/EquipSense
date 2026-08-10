# 用户 PII 加密实现计划

> **For agentic workers:** 本计划按当前工作区直接执行；由于用户已授权自主决策，采用本会话内联执行，不创建提交。

**Goal:** 将用户邮箱和手机号改为应用层 AES-256-GCM 密文，并通过字段级 HMAC 盲索引保持登录、找回密码和用户管理可用。

**Architecture:** `IPiiProtector` 位于 Core 接口层，Infrastructure 提供 AES-GCM/HMAC 实现并由配置注入。`AppDbContext` 为生产上下文配置 ValueConverter，将 `User.Email`/`User.Phone` 的内存明文转换为数据库密文；SaveChanges 同步写入盲索引，认证查询改用盲索引。数据库初始化锁内的原始 SQL 回填历史明文，失败即拒绝启动。

**Tech Stack:** .NET 8、EF Core 8、Npgsql/PostgreSQL、AES-256-GCM、HMAC-SHA256、xUnit、FluentAssertions、Docker Compose、Bash。

## Global Constraints

- 生产配置键为 `Security:PiiEncryptionKey`，Docker 环境变量为 `PII_ENCRYPTION_KEY`。
- 生产密钥必须是 Base64 编码的 32 字节值；缺失、格式错误或长度错误必须 fail-closed。
- 开发/测试未配置密钥时仅允许固定开发后备密钥，不能作为生产默认值。
- 数据库中 `users.email` / `users.phone` 不得保存明文；异常解密不得静默降级。
- 所有新增注释、日志和文档使用简体中文；日志不得包含 PII、密钥、密文或盲索引。
- 不修改真实 `docker/.env`、证书或正在运行的 Docker 容器；不进行 git stage/commit。

---

### Task 1: 实现 PII 保护器和生产配置门禁

**Files:**
- Create: `src/EquipAI.Core/Interfaces/IPiiProtector.cs`
- Create: `src/EquipAI.Infrastructure/Security/PiiProtector.cs`
- Create: `src/EquipAI.Application/Security/PiiProtectionOptions.cs`
- Test: `tests/EquipAI.Tests.Unit/Security/PiiProtectorTests.cs`
- Test: `tests/EquipAI.Tests.Unit/Security/PiiProtectionValidatorTests.cs`

**Interfaces:**
- `IPiiProtector.Normalize(string field, string? value) -> string?`
- `IPiiProtector.Protect(string? value) -> string?`
- `IPiiProtector.Unprotect(string? storedValue) -> string?`
- `IPiiProtector.CreateLookupHash(string field, string? value) -> string?`
- `PiiProtectionValidator.ValidateForEnvironment(IConfiguration, string)`。

- [ ] **Step 1: 写保护器失败测试**

覆盖随机 nonce、往返解密、相同明文生成不同密文、密文篡改/格式错误拒绝、邮箱和手机号域隔离、邮箱大小写规范化、手机号符号规范化，以及生产环境密钥缺失/非法长度拒绝。

- [ ] **Step 2: 运行针对性测试确认失败**

运行：

```bash
dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~PiiProtectorTests|FullyQualifiedName~PiiProtectionValidatorTests" --no-restore --nologo
```

预期：新增类型尚不存在导致编译失败。

- [ ] **Step 3: 实现 AES-GCM/HMAC 和配置校验**

使用 `Security:PiiEncryptionKey` 解码 32 字节主密钥；通过 `HMACSHA256(master, "EquipSense:PII:Encryption:v1")` 和 `HMACSHA256(master, "EquipSense:PII:Lookup:v1")` 派生两个独立 32 字节子密钥。密文格式固定为 `enc:v1:<base64 nonce>.<base64 tag>.<base64 ciphertext>`，nonce 12 字节、tag 16 字节。盲索引使用规范化值的字段域 HMAC，返回小写十六进制摘要。

- [ ] **Step 4: 运行针对性测试确认通过**

运行同一条 `dotnet test` 命令，预期所有保护器和 validator 测试通过。

### Task 2: 接入 User 实体、EF Converter 和数据库迁移

**Files:**
- Modify: `src/EquipAI.Core/Entities/User.cs`
- Modify: `src/EquipAI.Infrastructure/Data/Configurations/UserConfiguration.cs`
- Modify: `src/EquipAI.Infrastructure/Data/AppDbContext.cs`
- Modify: `src/EquipAI.Infrastructure/Data/AppReadDbContext.cs`
- Modify: `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs`
- Create: `src/EquipAI.Infrastructure/Data/Migrations/20260810160000_AddUserPiiLookupHashes.cs`
- Modify: `src/EquipAI.Infrastructure/Data/Migrations/AppDbContextModelSnapshot.cs`
- Test: `tests/EquipAI.Tests.Unit/Infrastructure/UserPiiPersistenceTests.cs`

**Interfaces:**
- `User.EmailLookupHash` / `User.PhoneLookupHash` 为持久化摘要字段。
- `AppDbContext` 接受可选 `IPiiProtector`；生产 DI 注入真实实现，直接构造的测试上下文保持无转换测试语义。

- [ ] **Step 1: 写持久化失败测试**

构造启用真实 `PiiProtector` 的 SQLite/InMemory 上下文，新增和修改用户后断言盲索引与规范化值一致；使用底层 provider 查询原始列，断言邮箱/手机号值以 `enc:v1:` 开头且不包含原文；清空联系方式时摘要为空。

- [ ] **Step 2: 运行测试确认失败**

运行：

```bash
dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~UserPiiPersistenceTests" --no-restore --nologo
```

预期：实体字段、Converter 或保存同步逻辑尚未存在而失败。

- [ ] **Step 3: 实现模型和保存同步**

为 `User` 增加 `EmailLookupHash`、`PhoneLookupHash`；在配置中映射为 `email_lookup_hash`、`phone_lookup_hash`（长度 64）并分别建立普通索引。`AppDbContext.OnModelCreating` 对邮箱/手机号安装 ValueConverter；`SaveChanges` 和 `SaveChangesAsync` 在保存前扫描新增/修改用户，调用保护器刷新摘要。DI 注册 `IPiiProtector` 为单例，并将其传递给 `AppReadDbContext`。

- [ ] **Step 4: 添加 EF migration**

只新增两个可空 text/varchar(64) 摘要列和索引，不在 migration SQL 中读取或打印 PII；保留现有 `email`/`phone` 列以便下一步应用初始化器使用原始 SQL 回填。

- [ ] **Step 5: 运行持久化测试确认通过并检查模型**

运行针对性测试和：

```bash
dotnet ef migrations has-pending-model-changes \
  --project src/EquipAI.Infrastructure \
  --startup-project src/EquipAI.WebAPI
```

预期：测试通过，且没有未生成的模型变更。

### Task 3: 实现历史明文回填并切换认证查询

**Files:**
- Create: `src/EquipAI.Infrastructure/Data/UserPiiMigrationService.cs`
- Modify: `src/EquipAI.WebAPI/Program.cs`
- Modify: `src/EquipAI.Application/Services/AuthService.cs`
- Modify: `src/EquipAI.Application/Services/UserService.cs`
- Modify: `src/EquipAI.Application/Services/TenantService.cs`（仅在需要直接查询邮箱时）
- Test: `tests/EquipAI.Tests.Unit/Infrastructure/UserPiiMigrationServiceTests.cs`
- Modify: `tests/EquipAI.Tests.Unit/Services/AuthServiceTests.cs`

**Interfaces:**
- `UserPiiMigrationService.MigrateLegacyValuesAsync(CancellationToken) -> Task`。
- 服务在 `MigrateAsync()` 成功、`DataSeeder.SeedAsync()` 之前调用该方法，并处于现有 `DatabaseInitializationLock` 租约内。

- [ ] **Step 1: 写历史迁移失败测试**

覆盖：未加密邮箱/手机号被加密并补摘要、已加密值只补缺失摘要、重复运行无变化、加密异常时原值未被清空、完成后非 `enc:v1:` 值计数为零。测试使用参数化 SQL 替身或 SQLite 原始连接，不依赖 EF 对旧值解密。

- [ ] **Step 2: 运行迁移测试确认失败**

运行：

```bash
dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~UserPiiMigrationServiceTests" --no-restore --nologo
```

- [ ] **Step 3: 实现原始 SQL、批处理和 fail-closed**

使用 `DbConnection`/`DbCommand` 和参数化参数读取 PostgreSQL 的大小写敏感主键列 `"Id"` 以及 `email,phone,email_lookup_hash,phone_lookup_hash`。每行在内存中保护并更新；任何异常直接抛出，不执行清空旧值的补偿操作。更新后执行非密文计数查询，发现残留即抛出。历史值迁移完成后记录不含 PII 的数量日志。

- [ ] **Step 4: 在启动初始化序列接入迁移**

在 `await db.Database.MigrateAsync()` 后、Seeder 前解析 `UserPiiMigrationService` 并执行。保持现有数据库 advisory lock，不新增第二把锁。

- [ ] **Step 5: 把认证查询改成盲索引**

登录和密码重置统一调用 `CreateLookupHash("email", request.Email)`，使用 `UnfilteredSet<User>().FirstOrDefaultAsync(u => u.EmailLookupHash == hash, ct)`；仍在内存中检查规范化后的邮箱，避免哈希碰撞造成错误匹配。所有需要发信的路径继续使用解密后的 `user.Email`。

- [ ] **Step 6: 运行迁移与认证测试确认通过**

运行 Task 3 两个测试筛选器，并检查日志/异常内容不包含联系方式原文。

### Task 4: 增加配置、容器和发布门禁覆盖

**Files:**
- Modify: `docker/docker-compose.yml`
- Modify: `docker/.env.example`
- Modify: `docker/validate-env.sh`
- Modify: `tests/scripts/production-scripts-test.sh`
- Modify: `tests/scripts/production-runtime-smoke.sh`
- Modify: `docs/environment-variables.md`
- Modify: `docs/DEPLOY.md`
- Modify: `docs/COMPLIANCE_REPORT.md`
- Modify: `docs/LANDING_READINESS_REPORT.md`

**Interfaces:**
- Docker 后端环境变量：`Security__PiiEncryptionKey: "${PII_ENCRYPTION_KEY:?请在 .env 中设置 PII_ENCRYPTION_KEY}"`。
- Smoke 环境生成随机 `PII_ENCRYPTION_KEY` 并写入隔离运行时环境。

- [ ] **Step 1: 为环境门禁写失败测试**

在现有有效环境 fixture 中加入合法 PII key；增加“缺失/短 key 拒绝、日志不打印 key”的断言，并增加 compose 静态断言确保后端收到 `Security__PiiEncryptionKey`。

- [ ] **Step 2: 运行脚本测试确认失败**

运行：

```bash
bash tests/scripts/production-scripts-test.sh ci
```

预期：validator/compose 尚未识别新变量或 fixture 不完整而失败。

- [ ] **Step 3: 接入 Compose、validator 和 Smoke**

把 PII key 加入生产必填变量、32 字节 Base64 校验、凭据独立性比较、模板说明和 runtime smoke 随机环境；不修改真实 `docker/.env`。

- [ ] **Step 4: 更新生产文档状态**

将邮箱/手机号从“部分”改为“代码已实现、实际环境需配置密钥和完成历史迁移验证”，并明确密钥备份与轮换的单独运维要求。

- [ ] **Step 5: 运行脚本门禁确认通过**

运行：

```bash
bash tests/scripts/production-scripts-test.sh all
docker compose --env-file docker/.env.example -f docker/docker-compose.yml config --quiet
```

### Task 5: 全量验证并复核生产运行时

**Files:**
- No new source files; inspect all files changed above and generated build artifacts remain ignored.

- [ ] **Step 1: 运行后端构建与测试**

```bash
dotnet build EquipAI.sln --configuration Release --no-restore -m:1 --disable-build-servers
dotnet test tests/EquipAI.Tests.Unit --configuration Release --no-restore --nologo
RUN_RABBITMQ_INTEGRATION_TESTS=true dotnet test tests/EquipAI.Tests.Integration --configuration Release --no-restore --nologo
```

- [ ] **Step 2: 运行前端质量门禁**

```bash
cd frontend
npm run check:i18n
npx tsc -p tsconfig.json --noEmit
npm run lint
npm run test -- --run
npm run build
```

- [ ] **Step 3: 运行生产镜像 Smoke 和全量 E2E**

构建后端镜像后运行现有 `tests/scripts/production-runtime-smoke.sh`，注入本地构建镜像和随机 PII key；必须同时通过迁移、种子登录、健康探针、HTTPS/API 代理、边缘缓存和默认 442 个 E2E。

- [ ] **Step 4: 完成自检**

运行 `git -c core.fsmonitor=false diff --check`、确认生产环境 validator 仍仅报告真实 `docker/.env` 的部署配置问题，不输出任何秘密，并核对用户现有 Docker 容器未被修改。
