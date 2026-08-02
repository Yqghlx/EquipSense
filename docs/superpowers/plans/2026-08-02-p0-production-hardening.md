# P0 生产化加固实施计划

> 设计文档：`docs/superpowers/specs/2026-08-02-p0-production-hardening-design.md`
> 目标：完成数据库迁移、MQTT TLS、依赖漏洞和生产凭据四项 P0 加固。

## 实施约束

- 直接在当前工作区实施，保留已有暂存改动，不执行 reset、checkout 或覆盖式格式化。
- 所有新增注释、日志和文档使用中文。
- 每个行为改动遵循 TDD：先添加会失败的测试，再写最小实现，最后重构。
- `Testing` 环境继续使用 SQLite `EnsureCreatedAsync`；生产、开发和显式迁移路径使用 EF Core `MigrateAsync`。
- 本轮不改持久化事件总线、告警聚合分布式化、后台任务锁、工单编号或 Phase 5 前端页面。

## 任务 1：先建立安全配置的失败测试

### 1.1 MQTT 配置校验

- 新增配置校验测试，覆盖：生产明文 MQTT 拒绝、生产允许不受信任证书拒绝、生产缺少用户名/密码拒绝、开发明文配置允许、配置的 CA 文件不存在拒绝。
- 测试只断言配置项名称和安全行为，不输出或断言真实密码。

### 1.2 种子凭据校验

- 新增测试，覆盖五个默认种子用户中任一 `SEED_*_PASSWORD` 缺失时生产拒绝，完整配置时通过，开发环境仍允许默认值。
- 增加第二租户测试账户在显式启用时必须提供 `SEED_TENANT2_PASSWORD` 的测试。

### 1.3 数据库启动策略

- 增加测试证明 `Testing` 环境不会调用生产迁移路径，且种子器只负责数据幂等初始化，不负责建表。
- 保留现有集成测试工厂的 SQLite `EnsureCreatedAsync`，更新其中关于生产迁移的过时说明。

## 任务 2：统一数据库迁移与种子职责

- 修改 `DataSeeder`：删除 `GetPendingMigrationsAsync`、`MigrateAsync` 和 `EnsureCreatedAsync`，保留历史数据修复及幂等种子逻辑。
- 修改 `Program.cs`：在 `Testing` 环境之外启动时统一异步调用 `Database.MigrateAsync()`；迁移异常直接阻止应用启动。
- 将迁移放在种子和 TimescaleDB 初始化之前，移除 `--migrate` 的同步旁路和冲突注释。
- 生产启动顺序固定为：配置校验 → 数据库迁移 → 种子 → TimescaleDB 初始化。
- 更新集成测试夹具注释，确保测试不会依赖 Npgsql 迁移 SQL。

## 任务 3：实现 MQTT TLS 与生产配置校验

- 在后端 `MqttOptions` 增加 `UseTls`、`AllowUntrustedCertificates` 和 `CaCertificatePath`。
- 在边缘网关 `GatewayOptions` 增加对应的 MQTT TLS 配置字段。
- 在 Core 增加无框架依赖的 MQTT 安全配置校验器，供 WebAPI 和 EdgeGateway 复用。
- 在后端和边缘网关的 MQTT 客户端构建过程中：
  - `UseTls=true` 时启用 MQTTnet TLS；
  - 默认使用系统证书信任链；配置 CA 路径时加载自定义信任根；
  - 生产环境不允许忽略证书链、吊销或服务端证书校验；
  - 配置错误在首次连接前 fail-fast，不进入无限重连。
- 为两端客户端构建逻辑增加单元测试，确认 TLS 开关、认证和 CA 配置被转换到 MQTTnet 选项。

## 任务 4：收紧生产凭据

- 注入宿主环境到 `DataSeeder`。
- 生产环境预先校验所有主种子账户的 `SEED_*_PASSWORD`，缺失时抛出不包含密码值的配置异常。
- 生产环境禁止默认 MQTT 用户名/密码和匿名连接；开发、测试保留现有演示默认值。
- 更新 `docker/.env.example`、生产 Compose 环境变量和部署文档，使用 Compose 必填变量语法，避免回退到公开默认值。
- 保留 `MustChangePassword=true`，不删除历史账户、不自动修改已存在用户密码。

## 任务 5：启用生产 Compose 的 MQTT TLS

- 将 `docker/mosquitto.prod.conf` 改为 8883 TLS listener，保留密码认证并禁止匿名访问。
- 增加 MQTT 证书目录挂载和生成/校验脚本；生成的私钥、证书和密码文件不得进入版本库。
- 后端和 EdgeGateway Compose 环境统一使用 8883、TLS 开关、CA 路径及必填账号密码。
- 开发 Compose 继续使用 1883 明文，配置和文档明确其仅限开发/测试。
- 更新部署文档中的证书生成、挂载、健康检查和首次登录步骤。

## 任务 6：清理依赖漏洞并恢复警告门禁

- 删除 `Directory.Build.props` 中的 `NU1901` 和 `NU1903` 抑制；保留 `NU1603` 前先确认还原结果稳定。
- 将 EdgeGateway 的 `Microsoft.Data.Sqlite` 升级到能够带来安全 SQLite 原生库的 .NET 10.0.x 修复版本，同时确认 net8.0 运行时兼容性。
- 将测试项目的 EF Core SQLite 和 xUnit 依赖升级到兼容的最新 .NET 8/xUnit 版本，消除测试专用旧 SQLite 与 `System.Net.Http`/正则表达式传递漏洞。
- 运行 NuGet 漏洞扫描；若仍有无修复上游漏洞，记录准确包、影响范围和替代方案，不再全局静默。
- 核对前端生产依赖漏洞来源，只升级必要的直接依赖并提交锁文件；不执行未经审查的全量 `npm audit fix --force`。

## 任务 7：验证与交付

- 先运行新增测试，确认红 → 绿；再运行后端构建、单元测试、集成测试。
- 运行前端类型检查、Lint、i18n、Vitest 和生产构建。
- 运行 NuGet 漏洞扫描、前端生产依赖审计，并校验 Compose 配置语法。
- 复核 `git diff` 和 `git status`：既有 5 项暂存改动不得被修改或提交；本轮变更按文件范围单独汇总。
- 完成前不宣称“全部通过”；若某项漏洞只能等待上游修复，明确写入交付结果和后续风险。
