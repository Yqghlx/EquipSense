# 完整演示数据模式实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with review checkpoints.

**Goal:** 为 EquipSense 增加只在隔离环境可开启的完整演示数据集，并验证其幂等性与生产安全边界。

**Architecture:** 保留现有基础 DataSeeder 和 \`true/1\` 最小兼容模式，新增独立的 \`FullDemoDataSeeder\` 负责固定演示数据。策略、应用启动、生产校验脚本和 smoke Compose 四层共同限制 \`full\`，避免单点绕过。

**Tech Stack:** .NET 8、EF Core 8、SQLite 集成测试、PostgreSQL/TimescaleDB 生产、Docker Compose、Bash。

## Global Constraints

- Production 默认 \`SEED_DEMO_DATA=false\)，普通 Production 禁止演示数据。
- \`SEED_DEMO_DATA=full\` 必须同时具备 \`EQUIPAI_ISOLATED_E2E=true\) 才能在 Production 应用启动。
- 所有业务数据必须带默认租户 ID；遥测写入使用参数化 SQL。
- 设备、告警、工单和日志必须固定 ID/编码并幂等。
- 注释、日志和文档使用简体中文。
- 不修改数据库 schema，不增加第三方依赖。
- 不提交或暴露任何真实凭据。

---

### Task 1: 策略和测试门禁

**Files:**
- Modify: \`src/EquipAI.Infrastructure/Seeding/DemoDataSeedingPolicy.cs\`
- Test: \`tests/EquipAI.Tests.Unit/Seeding/DemoDataSeedingPolicyTests.cs\`

- [x] 写 \`full\` 值识别、非 \`full\` 值排除和 Production 隔离授权失败测试。
- [x] 运行策略测试确认先因缺少方法或门禁实现失败。
- [x] 实现 \`IsFullDemoData\` 与 \`EnsureFullDemoDataAllowed\`。
- [x] 运行策略测试，确认全部通过。

### Task 2: 完整播种器

**Files:**
- Create: \`src/EquipAI.Infrastructure/Seeding/FullDemoDataSeeder.cs\`
- Test: \`tests/EquipAI.Tests.Integration/Seeding/FullDemoDataSeederTests.cs\`

- [x] 固定 10 台设备、24 小时 x 3 指标遥测、5 条告警、4 条工单和工单日志。
- [x] 使用事务、固定 ID/编码、默认租户和参数化时序 SQL。
- [x] 重复播种保持固定数量。
- [x] 运行完整播种集成测试。

### Task 3: 应用和容器接线

**Files:**
- Modify: \`src/EquipAI.Infrastructure/Seeding/DataSeeder.cs\`
- Modify: \`src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs\`
- Modify: \`docker/validate-env.sh\`
- Modify: \`docker/docker-compose.smoke.yml\`
- Modify: \`tests/scripts/production-runtime-smoke.sh\`
- Modify: \`tests/scripts/production-scripts-test.sh\`

- [x] 注册完整播种器并在 full 模式调用。
- [x] 应用启动时执行 Production 隔离授权门禁。
- [x] 生产校验器拒绝普通 Production full，隔离模式允许。
- [x] smoke 使用 full，脚本断言同步更新。

### Task 4: 文档和回归验证

**Files:**
- Modify: \`docker/.env.example\`
- Modify: \`docs/DEPLOY.md\`
- Modify: \`docs/OPS_RUNBOOK.md\`
- Modify: \`docs/environment-variables.md\`
- Modify: \`docs/E2E_SUITE.md\`
- Modify: \`docs/evaluation/S13-产品化路线图.md\`
- Modify: \`docs/LANDING_READINESS_REPORT.md\`

- [x] 说明 false/true/full 三档行为及隔离边界。
- [x] 将内置演示模式标记为已完成，但保留真实 Production 凭证、证书和现场联调为外部交付项。
- [x] 运行后端全量测试、集成测试、生产脚本测试、脚本语法和差异检查。
