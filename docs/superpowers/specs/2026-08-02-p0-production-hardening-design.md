# P0 生产化加固设计

> 设计日期：2026-08-02  
> 适用范围：EquipSense 当前 `main` 工作区  
> 目标：消除第一批阻塞客户试点和生产部署的安全、迁移与依赖风险。

## 一、目标与范围

本次只处理四类 P0 问题：

1. 统一生产数据库初始化与 EF Core Migrations 的职责，避免 `MigrateAsync` 与 `EnsureCreatedAsync` 混用。
2. 为后端订阅端和边缘网关发布端增加可配置的 MQTT TLS，并在生产环境阻止明文 MQTT。
3. 清理当前 NuGet/npm High 漏洞，保留漏洞扫描门禁，移除 NuGet 全局漏洞警告抑制。
4. 收紧生产种子凭据和 MQTT 默认凭据，避免部署者漏配时使用公开默认密码。

本次不包含：持久化事件总线、告警聚合分布式化、后台任务分布式锁、工单编号重构、趋势/设备对比页面以及 CD 自动部署。这些属于下一批独立改动，避免在一次变更中同时改变消息、调度和前端产品边界。

## 二、现状与约束

- `DataSeeder` 当前先查询并应用待处理迁移，再调用 `EnsureCreatedAsync`；`Program.cs` 也说明两种模式不兼容。
- `MqttClientService` 和 `CloudUploader` 当前使用 `WithTcpServer` 连接 1883，没有 TLS 开关或证书校验配置。
- EdgeGateway 的 `Microsoft.Data.Sqlite` 传递依赖存在 `SQLitePCLRaw.lib.e_sqlite3` High 漏洞；前端生产依赖树存在多个 High 漏洞。
- `Directory.Build.props` 当前抑制 `NU1901` 和 `NU1903`，升级依赖后必须移除抑制并重新执行扫描。
- 种子用户支持 `SEED_*_PASSWORD`，但缺失时仍回退到公开默认密码；生产环境需要把“未配置”变成启动失败。
- 当前工作区存在既有暂存改动，实施时只修改本设计涉及的文件，不重置、不覆盖其他暂存内容。

## 三、设计方案

### 3.1 数据库初始化与迁移

生产路径采用“先迁移、后种子”的单一职责模型：

```text
应用启动
  ├─ 生产/显式迁移模式：Database.MigrateAsync()
  ├─ 测试环境：由测试工厂自行 EnsureCreated
  ├─ DataSeeder：只负责幂等种子数据和一次性数据修复
  └─ TimescaleDbSetup：在业务表完成后初始化超级表、压缩和保留策略
```

具体规则：

- `DataSeeder.SeedAsync` 不再负责建表，也不再调用 `EnsureCreatedAsync`。
- WebAPI 启动时统一执行异步 `MigrateAsync`，不再依赖 `--migrate` 的同步旁路。
- 新数据库和已有数据库都通过迁移历史判断版本；没有迁移历史时由初始迁移创建 schema。
- 种子失败必须让生产启动失败，避免服务已对外提供但基础数据不完整。
- 测试工厂和使用 SQLite/InMemory 的单元测试保留各自的 `EnsureCreated`，不改变测试数据库策略。
- 增加集成测试，验证迁移后的关键表和种子用户存在；不在生产代码中加入测试专用分支。

### 3.2 MQTT TLS

为后端和边缘网关分别增加配置对象字段：

- `UseTls`：是否启用 TLS。
- `AllowUntrustedCertificates`：仅允许开发环境使用，生产环境强制为 `false`。
- `CaCertificatePath`：可选的 CA 证书路径；未配置时使用系统信任链。

连接行为：

- `UseTls=false` 只允许 Development/Test；Production 启动校验直接失败。
- `UseTls=true` 时调用 MQTTnet 的 TLS 配置，启用服务端证书校验。
- 证书文件路径配置但文件不存在时，连接前抛出带路径的配置异常。
- 不在生产环境使用“忽略证书链错误”或“忽略证书吊销错误”。
- Compose 生产配置使用 8883；开发 Compose 可以保留 1883，便于本地快速启动，但应明确标识为非生产配置。
- 后端订阅端和 EdgeGateway 发布端使用同一套语义配置，避免一端加密、一端明文导致现场联调失败。

### 3.3 依赖漏洞与门禁

- 先确定每个漏洞的直接引入链和可升级版本，再更新 `.csproj`、`package.json` 与 lock 文件。
- 不使用盲目的大版本升级；每次升级后运行后端构建、xUnit、前端类型检查、Lint、单测和生产构建。
- 删除 `NU1901/NU1903` 全局抑制；`NU1603` 只有在依赖树稳定且有明确理由时保留。
- CI 的 `dotnet list package --vulnerable --include-transitive` 和 `npm audit --omit=dev --audit-level=high` 继续作为门禁。
- 测试专用漏洞需要尽量升级；如果某项只能暂时保留，必须在 CI 中明确区分测试依赖与生产镜像依赖，并记录风险，而不是全局静默。

### 3.4 生产凭据

- Production 环境中，任一种子用户密码缺失都导致启动失败；不再回退到 `Admin@123` 等内置值。
- MQTT 用户名和密码在 Production 中必须显式配置，禁止使用 `device/device123` 默认组合。
- `MustChangePassword=true` 继续保留，作为首次登录后的第二层保护。
- 开发和测试环境继续允许默认种子数据，确保现有 E2E 和本地演示流程不被破坏。
- 错误信息只指出配置项名称，不输出实际密码或密钥。

## 四、错误处理与兼容性

- 生产配置错误在启动阶段 fail-fast，并写入结构化日志；不等到第一次数据库或 MQTT 请求时才暴露。
- 数据库迁移异常直接终止启动，保留原始异常用于日志诊断。
- MQTT TLS 连接失败沿用现有重连机制，但配置错误不进行无限重试。
- 旧的 1883 开发配置保持可用；生产 Compose、`.env.example` 和部署文档同步更新为 TLS 配置。
- 不改变业务 API、租户隔离、告警规则、工单状态机和前端交互契约。

## 五、测试策略

遵循测试先行：

1. 为生产数据库启动路径增加测试，证明不再调用 `EnsureCreatedAsync`，并验证迁移后种子流程成功。
2. 为 MQTT 选项构建增加测试，覆盖 TLS 开启、开发环境允许非 TLS、生产环境拒绝非 TLS、证书路径错误。
3. 为生产凭据校验增加测试，覆盖所有必要凭据缺失和完整配置两种路径。
4. 依赖升级不新增业务行为，但必须运行完整质量门禁，确认没有编译、运行时和前端构建回归。
5. 完成代码修改后执行：

   ```bash
   dotnet build EquipAI.slnx --configuration Release --no-restore
   dotnet test tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj --configuration Release --no-build
   dotnet test tests/EquipAI.Tests.Integration/EquipAI.Tests.Integration.csproj --configuration Release --no-build
   cd frontend && npx tsc -p tsconfig.json --noEmit
   cd frontend && npx eslint src/ --max-warnings 1
   cd frontend && npm run check:i18n
   cd frontend && npm run test
   cd frontend && npm run build
   dotnet list EquipAI.slnx package --vulnerable --include-transitive
   cd frontend && npm audit --omit=dev --audit-level=high
   ```

## 六、完成标准

- 生产启动不再混用 `Migrate` 与 `EnsureCreated`。
- Production 明文 MQTT 和默认凭据均无法启动。
- NuGet EdgeGateway 运行时 High 漏洞消除；前端生产依赖树无 High/Critical，或每项都有明确的阻断理由和记录。
- 全部后端、前端质量门禁通过，新增回归测试覆盖上述配置行为。
- 部署文档、环境变量样例和 CI 配置与实际行为一致。

