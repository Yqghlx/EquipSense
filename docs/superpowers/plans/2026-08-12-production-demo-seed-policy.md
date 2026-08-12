# Production Demo Seed Policy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 Production 默认不创建测试租户和示例设备，同时保留隔离验收环境的完整演示链路。

**Architecture:** 使用一个无副作用的 `DemoDataSeedingPolicy` 集中解释 `SEED_DEMO_DATA`，Production 仅接受显式 true/1，其他环境保持演示数据兼容。`DataSeeder` 仅用该策略包住第二租户和示例设备；通用模板告警规则及系统基础数据不受影响。Compose 与 `validate-env.sh` 使用同一安全默认，并让隔离 smoke 显式打开。

**Tech Stack:** .NET 8、xUnit、FluentAssertions、EF Core、Docker Compose、Bash。

## Global Constraints

- 所有新增注释、日志和文档使用简体中文。
- 不删除既有生产数据；只改变未来启动时的新增行为。
- 普通 Production 默认 `SEED_DEMO_DATA=false`，隔离验收必须显式授权。
- 保持 Development、Testing、现有 E2E 和 Production smoke 的既有可用性。
- 不修改真实 `docker/.env`、证书、正在运行的容器或用户未提交的其他改动。

### Task 1: 锁定播种策略行为

**Files:**
- Create: `src/EquipAI.Infrastructure/Seeding/DemoDataSeedingPolicy.cs`
- Test: `tests/EquipAI.Tests.Unit/Seeding/DemoDataSeedingPolicyTests.cs`

**Interfaces:**
- Produces: `DemoDataSeedingPolicy.ShouldSeedDemoData(bool isProduction, string? configuredValue)`。

- [x] **Step 1: Write the failing tests**

  覆盖 Production 缺省/false/0/非法值返回 false、Production true/1 返回 true、非 Production 未配置返回 true。

- [x] **Step 2: Run the focused test and verify it fails**

  Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~DemoDataSeedingPolicyTests" --no-restore`

  Expected: 编译失败，提示 `DemoDataSeedingPolicy` 尚不存在。

- [x] **Step 3: Implement the minimal policy**

  新增公开静态策略类和 `SEED_DEMO_DATA` 常量；Production 只把忽略大小写的 `true`/`1` 视为开启，非 Production 固定返回 true。

- [x] **Step 4: Run the focused test and verify it passes**

  Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~DemoDataSeedingPolicyTests" --no-restore`

  Expected: 所有策略测试通过。

### Task 2: 将策略接入 DataSeeder

**Files:**
- Modify: `src/EquipAI.Infrastructure/Seeding/DataSeeder.cs`
- Test: `tests/EquipAI.Tests.Unit/Seeding/DemoDataSeedingPolicyTests.cs`

- [x] **Step 1: Extend the failing contract test**

  为策略增加 `IsDemoDataEnabled` 的环境语义测试，并在代码契约中锁定：第二租户和 `AC-001` 属于演示数据，通用告警规则仍属于基础数据。

- [x] **Step 2: Run the focused test and verify the new expectation fails**

  Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~DemoDataSeedingPolicyTests" --no-restore`

  Expected: 新增行为断言在尚未接入 `DataSeeder` 前失败或契约检查失败。

- [x] **Step 3: Implement the minimal seeder gate**

  `DataSeeder.SeedAsync` 读取 `SEED_DEMO_DATA`，Production 关闭时跳过第二租户和示例设备；继续执行模板、通用规则、知识库、FMEA 和种子账户。关闭时写一条中文信息日志，避免输出配置值。

- [x] **Step 4: Run backend tests**

  Run: `dotnet test tests/EquipAI.Tests.Unit --no-restore`

  Expected: 单元测试全通过。

### Task 3: 固化 Compose、校验器和 smoke 契约

**Files:**
- Modify: `docker/docker-compose.yml`
- Modify: `docker/docker-compose.smoke.yml`
- Modify: `docker/.env.example`
- Modify: `docker/compose-production.sh`
- Modify: `docker/validate-env.sh`
- Modify: `tests/scripts/production-runtime-smoke.sh`
- Modify: `tests/scripts/production-scripts-test.sh`

- [x] **Step 1: Add failing shell contracts**

  增加断言：生产 Compose 默认注入 `SEED_DEMO_DATA` 为 false，smoke 覆盖为 true，普通 Production 校验拒绝 true，`--allow-isolated-e2e` 允许 true，runtime smoke 环境数组传递 true。

- [x] **Step 2: Run the focused shell regression and verify it fails**

  Run: `bash tests/scripts/production-scripts-test.sh readiness`

  Expected: 新增契约断言失败，指出缺少 demo seed 配置或隔离授权逻辑。

- [x] **Step 3: Implement the configuration contract**

  生产 Compose 使用 `${SEED_DEMO_DATA:-false}`，smoke Compose 使用 `SEED_DEMO_DATA: "true"`；`.env.example` 和环境变量文档标注普通生产不得开启。校验器沿用 `--allow-isolated-e2e` 保护边界；runtime smoke 只在 E2E/隔离验收时传 true。

- [x] **Step 4: Run shell tests and syntax checks**

  Run: `bash tests/scripts/production-scripts-test.sh readiness && bash tests/scripts/production-scripts-test.sh all && bash -n docker/validate-env.sh tests/scripts/production-runtime-smoke.sh`

  Expected: 脚本回归和语法检查通过。

### Task 4: 更新部署文档并完成回归

**Files:**
- Modify: `docs/DEPLOY.md`
- Modify: `docs/OPS_RUNBOOK.md`
- Modify: `docs/environment-variables.md`
- Modify: `docs/E2E_SUITE.md`
- Modify: `tests/scripts/production-scripts-test.sh`

- [x] **Step 1: Document the safe default and isolated override**

  说明生产首次启动只初始化基础数据；演示设备和测试租户只允许隔离验收开关，历史库不自动删除既有演示数据。

- [x] **Step 2: Run the complete targeted verification**

  Run: `dotnet test tests/EquipAI.Tests.Unit --no-restore && bash tests/scripts/production-scripts-test.sh all && git -c core.fsmonitor=false diff --check`

  Expected: 后端单元测试全通过、生产脚本全通过、差异无空白错误。

- [x] **Step 3: Review the final diff**

  Run: `git -c core.fsmonitor=false status --short && git -c core.fsmonitor=false diff --stat`

  Expected: 只出现本计划列出的文件及此前已有的用户改动，不触碰 `.env`、证书和容器状态。
