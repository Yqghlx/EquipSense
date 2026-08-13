# EquipSense DevOps / CI/CD 专项分析报告

> 分析日期：2026-08-13（按当前工作区复核） · 范围：.github/workflows/ci.yml · Dockerfiles · Production smoke · e2e-comprehensive · Vitest · K6 · 部署脚本

---

## 一、流水线总览（质量门禁 + 运行时验收 + 发布）

```
触发: push/PR → main/develop (paths 过滤)

Stage 1 [密钥扫描]        Stage 2 [后端质量]        Stage 3 [前端质量] ← 并行
  Gitleaks                 restore/build            npm ci/tsc
  发现即阻断              xUnit Unit + Integration  i18n/ESLint/Vitest/build
                            NuGet CVE + 覆盖率门禁    npm 审计 + 覆盖率门禁

Stage 4 [Production smoke] Stage 5 [镜像扫描/发布]   Stage 6 [发布与部署]
  三个当前提交镜像          backend/frontend/edge     vX.Y.Z → semver
  迁移 + 健康 + HTTPS       本地构建→全扫描→GHCR       SSH + 三重健康 + 回滚
  登录/API/代理闭环         main: sha/latest           可选蓝绿部署

Stage 7 [K6 回归]          Stage 8 [E2E]
  main/PR/tag 读写门禁      main/PR Playwright
  P95/P99/错误率阈值        435 用例，失败重试 1 次
```

---

## 二、触发规则

```yaml
branches: [main, develop]
paths: ['src/**', 'tests/**', 'frontend/**', 'docker/**', 'tools/**',
        '.github/workflows/ci.yml', 'EquipAI.sln', 'Directory.Build.props']
workflow_dispatch: true  # 手动触发
```

**问题**：feature 分支 push 不触发 CI，只能通过 PR。

---

## 三、Stage 1 — 后端测试

| 步骤 | 耗时 | 说明 |
|------|------|------|
| dotnet restore | ~60s | 9 个项目恢复 |
| dotnet build Release | ~90s | 编译 (TreatWarningsAsErrors) |
| Unit test | ~30s | 1658 xUnit 测试 |
| Integration test | ~120s | 184 个测试（178 通过、6 个条件跳过，含真实 RabbitMQ 场景） |
| NuGet vuln | ~20s | 已纳入阻断门禁 |
| **合计** | **~5min** | |

---

## 四、Stage 2 — 前端测试

| 步骤 | 耗时 | 说明 |
|------|------|------|
| npm ci (cached) | ~60s | 锁定文件安装 |
| tsc --noEmit | ~30s | strict: true, 0 error |
| check:i18n | ~5s | key 完整性 |
| ESLint | ~30s | `--max-warnings 1` |
| vitest | ~30s | 490 测试 |
| vite build | ~60s | 分包构建 |
| **合计** | **~3.5min** | |

---

## 五、Stage 3 — Docker 构建

### 镜像版本方案

```yaml
tags:
  - ghcr.io/{org}/equipsense/backend:sha-<short>
  - ghcr.io/{org}/equipsense/frontend:sha-<short>
  - ghcr.io/{org}/equipsense/edgegateway:sha-<short>
  - main 分支额外维护 latest；版本 tag 维护 semver（1.2.3 / 1.2 / 1 / latest）
```

### 安全扫描 (Trivy)

```yaml
exit-code: '1'    # HIGH/CRITICAL 阻断
ignore-unfixed: true
severity: HIGH,CRITICAL
```

`aquasecurity/trivy-action` 的 6 个调用均固定到经核实的 v0.36.0 完整提交 SHA。main 与版本发布先把 backend/frontend/edgegateway 三张镜像加载到 runner 本地，三张镜像全部通过 Trivy 后才允许写入 GHCR；任一扫描失败都不会提前发布 sha、semver、major/minor 或 `latest` 标签。

main 的 `latest` 发布显式依赖后端、前端、Production runtime smoke、备份恢复、K6 和 E2E；版本标签发布依赖后端、前端、Production runtime smoke、备份恢复和 K6。服务启动统一使用失败关闭的 HTTP 就绪等待器，后端或前端在限定次数内未就绪时返回非零，不再让后续负载或 E2E 测试继续运行。

### Dockerfile 优化

| 项目 | 层缓存策略 | 基础镜像 | 最终大小 |
|------|-----------|---------|---------|
| Backend | 先 COPY .csproj → restore | aspnet:8.0 + libicu | ~220MB |
| Frontend | 先 COPY package*.json → npm ci | nginx:alpine | ~25MB |
| EdgeGateway | 先 COPY .csproj → restore | runtime:8.0 + libicu | ~220MB |

---

## 六、Stage 4 — E2E 测试

### 服务容器 (GitHub Actions 原生)

```yaml
services:
  postgres: timescale/timescaledb:latest-pg16
  redis: redis:7-alpine
```

### E2E 目录结构（当前 435 用例，1 个架构性条件跳过点；本次 Production smoke 实际跳过 1 个）

```
00-setup/        (2)  — 健康检查 + 种子数据
01-auth/         (4)  — 登录/注册/会话/强制改密
02-crud/         (16) — 设备/告警规则/工单/知识库 CRUD
03-realtime/     (5)  — SignalR 推送/MQTT 模拟
04-advanced/     (7)  — 导出/导入/MFA/密码重置/OEE
05-auth/         (5)  — Token 刷新/RBAC/MFA
05-error-handling/ (4) — 400/401/403/500 错误处理
06-edge-cases/   (7)  — 并发/SQLi/XSS/限流/离线
```

### Playwright 配置

```typescript
projects: 9 个 (setup → auth → crud → realtime → advanced → errors → edge)
fullyParallel: false    (跨租户隔离测试不并行)
retries: 1 (CI)
timeout: 60s
```

---

## 七、K6 压力测试 (7 脚本)

| 脚本 | 场景 |
|------|------|
| k6/login.js | 高并发登录 |
| k6/devices.js | 设备 CRUD 吞吐 |
| k6/alerts.js | 告警引擎并发 |
| k6/telemetry.js | MQTT 高吞吐 |
| k6/full-workflow.js | 全链路 (设备→遥测→告警→工单) |
| api-load.js | 综合负载 |
| k6/config.js | 共享配置 |

**当前状态**：已集成到 CI 的 `load-test` job；main/PR/tag 执行读路径回归和固定种子设备的轻量遥测写路径回归，P95/P99 与错误率阈值由脚本阻断。高吞吐写入与完整链路容量压测仍按生产预算保留为本地/手动场景。

---

## 八、CI/CD 评分

| 维度 | 评分 | 证据 |
|------|------|------|
| 构建速度 | ⭐⭐⭐⭐☆ | 质量门禁与运行时 smoke 分离，层缓存利用充分 |
| 测试门禁 | ⭐⭐⭐⭐⭐ | 7 道门禁 (TS/ESLint/i18n/Vitest/Vite/xUnit/Integration) |
| E2E 覆盖 | ⭐⭐⭐⭐⭐ | 435 用例/8 场景/含安全测试；最新隔离 Production 镜像为 434 通过、1 个架构性条件跳过、0 失败；main/tag 已接入全量门禁 |
| Docker 构建 | ⭐⭐⭐⭐⭐ | 多阶段 + 层缓存 + GHCR + 三镜像版本标签 |
| 安全扫描 | ⭐⭐⭐⭐⭐ | Gitleaks + NuGet/npm + 三镜像 Trivy；Action 固定 SHA，HIGH/CRITICAL 阻断且全部扫描通过后才发布 |
| 压测集成 | ⭐⭐⭐⭐☆ | K6 读路径与 20 VU × 30s 遥测写路径已进入 main/PR/tag 门禁，高吞吐容量压测保留手动 |
| CD 部署 | ⭐⭐⭐⭐☆ | tag 发布后可 SSH 自动部署，三重健康门禁与旧镜像回滚 |
| 版本管理 | ⭐⭐⭐⭐⭐ | semver + sha 追溯，支持精确回滚 |

---

## 九、待改进项

| # | 缺失项 | 建议 |
|---|--------|------|
| 1 | 真实生产环境验收 | Production smoke 已覆盖启动/迁移/探针/代理，main/tag 还会在 Production 镜像执行完整 435 用例；剩余工作是正式凭据、证书、容量和现场协议验收 |
| 2 | 数据库迁移发布治理 | 当前应用启动已用 PostgreSQL advisory lock 串行迁移；仍建议在独立发布流水线执行迁移并完成审批/回滚演练 |
| 3 | 跨主机附件存储 | 当前命名卷 + 备份补偿已覆盖单机；跨主机仍需 S3/MinIO 和恢复演练 |
| 4 | 供应商运行时凭据 | 当前工作区 `.env` 仍有 27 项生产门禁问题，必须由密钥管理系统注入真实凭据和证书后再发布 |
| 5 | 蓝绿生产演练 | 脚本和回滚行为测试已完成，仍需在真实生产资源上做首次容量与切换演练 |
| 6 | 同引用流水线并发竞态 | 当前不同 CI run 仍可能并发写 `latest`；待确认采用“分支/PR 新运行取消旧运行、版本标签不取消、手动触发隔离”的并发组策略 |

---

## 关联报告

| 领域 | 报告 |
|------|------|
| 架构总览 | [S01-全系统架构总览图](./S01-全系统架构总览图.md) |
| 运维上下文 | [07-运维与可观测性分析](./07-运维与可观测性分析.md) |
| 依赖 CVE | [12-依赖与供应链安全分析](./12-依赖与供应链安全分析.md) |
| 测试策略 | [14-测试策略与金字塔分析](./14-测试策略与金字塔分析.md) |
| 技术债务 | [13-技术债务与改进路线图](./13-技术债务与改进路线图.md) |

---
*本文档属于 EquipSense 项目评估体系 · 复核日期：2026-08-13 · 版本：v3.91*
