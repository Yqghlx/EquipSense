# EquipSense DevOps / CI/CD 专项分析报告

> 分析日期：2026-06-24 · 范围：.github/workflows/ci.yml · Dockerfiles · playwright/playwright · vitest · K6

---

## 一、流水线总览 (4 阶段)

```
触发: push/PR → main/develop (paths 过滤)

Stage 1 [后端测试]       Stage 2 [前端测试]        ← 并行
  dotnet restore           npm ci
  dotnet build Release     tsc --noEmit
  xUnit Unit               check:i18n
  xUnit Integration        ESLint --max-warnings 1
  NuGet vuln check         vitest
                           vite build

Stage 3 [Docker 构建]     Stage 4 [E2E 测试]       ← main push 仅
  (needs: backend+frontend)  (needs: backend+frontend)
  login GHCR                服务容器: postgres+redis
  buildx                    启动后端 (等待 /health 90s)
  backend:latest+sha        启动前端 (等待 :5173 30s)
  frontend:latest+sha       playwright test (52 spec)
  Trivy 扫描                报告上传 (retain 7d)
```

---

## 二、触发规则

```yaml
branches: [main, develop]
paths: ['src/**', 'tests/**', 'frontend/**', 'docker/**', 'tools/**',
        '.github/workflows/ci.yml', 'EquipAI.slnx', 'Directory.Build.props']
workflow_dispatch: true  # 手动触发
```

**问题**：feature 分支 push 不触发 CI，只能通过 PR。

---

## 三、Stage 1 — 后端测试

| 步骤 | 耗时 | 说明 |
|------|------|------|
| dotnet restore | ~60s | 9 个项目恢复 |
| dotnet build Release | ~90s | 编译 (TreatWarningsAsErrors) |
| Unit test | ~30s | 835 xUnit 测试 |
| Integration test | ~120s | 103 xUnit (Testcontainers) |
| NuGet vuln | ~20s | `|| true` 不阻断 |
| **合计** | **~5min** | |

---

## 四、Stage 2 — 前端测试

| 步骤 | 耗时 | 说明 |
|------|------|------|
| npm ci (cached) | ~60s | 锁定文件安装 |
| tsc --noEmit | ~30s | strict: true, 0 error |
| check:i18n | ~5s | key 完整性 |
| ESLint | ~30s | `--max-warnings 1` |
| vitest | ~30s | 258 测试 |
| vite build | ~60s | 分包构建 |
| **合计** | **~3.5min** | |

---

## 五、Stage 3 — Docker 构建

### 镜像版本方案

```yaml
tags:
  - ghcr.io/{org}/equipsense/backend:latest
  - ghcr.io/{org}/equipsense/backend:{short_sha}
  - ghcr.io/{org}/equipsense/frontend:latest
  - ghcr.io/{org}/equipsense/frontend:{short_sha}
```

### 安全扫描 (Trivy)

```yaml
exit-code: '0'    # 当前不阻断
ignore-unfixed: true
severity: HIGH,CRITICAL
```

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

### E2E 目录结构 (52 spec, 512 用例)

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

**当前状态**：脚本已存在但**未集成到 CI**。

---

## 八、CI/CD 评分

| 维度 | 评分 | 证据 |
|------|------|------|
| 构建速度 | ⭐⭐⭐⭐☆ | ~8min CI + ~35min E2E，层缓存利用充分 |
| 测试门禁 | ⭐⭐⭐⭐⭐ | 7 道门禁 (TS/ESLint/i18n/Vitest/Vite/xUnit/Integration) |
| E2E 覆盖 | ⭐⭐⭐⭐⭐ | 52 spec/512 用例/8 场景/含安全测试 |
| Docker 构建 | ⭐⭐⭐⭐⭐ | 多阶段 + 层缓存 + GHCR + 双标签 |
| 安全扫描 | ⭐⭐⭐⭐☆ | Trivy 镜像 CVE，exit-code=0 不阻断 |
| 压测集成 | ⭐⭐⭐☆☆ | K6 脚本存在但不跑 |
| CD 部署 | ⭐⭐⭐☆☆ | 镜像推送后无自动部署 |
| 版本管理 | ⭐⭐⭐⭐☆ | short_sha 精确追溯，缺 semver |

---

## 九、待改进项

| # | 缺失项 | 建议 |
|---|--------|------|
| 1 | NuGet 漏洞不阻断 | 升级依赖修复 CVE，移除 `|| true` |
| 2 | 无语义版本号 | 基于 git tag 自动化 semver |
| 3 | K6 未集成 CI | 添加 k6 run 步骤 + 阈值判断 |
| 4 | 无 CD | 添加自动部署 job (SSH/ArgoCD) |
| 5 | 无 SAST | 集成 SonarCloud/CodeQL |
| 6 | 无数据库迁移测试 | 添加 `ef migrations script` 校验 |
| 7 | 无 Dependabot | 配置自动依赖更新 PR |
| 8 | 无覆盖率阈值 | 添加 `--coverage --thresholds` |

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
*本文档属于 EquipSense 项目评估体系 · 生成日期：2026-06-24 · 版本：v3.1*
