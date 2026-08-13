# CI 发布供应链加固 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 消除扫描制品与发布制品不一致、GitHub Release 权限不足和可移动 Action 引用三项生产发布阻断。

**Architecture:** 镜像 job 只构建一次并扫描本地镜像，扫描通过后直接逐标签推送；Release 创建拆为独立最小权限 job；所有 workflow Action 固定官方完整 commit SHA。契约测试以 workflow 文本和 job 边界验证安全不变量。

**Tech Stack:** GitHub Actions、Docker CLI/Buildx、Trivy、Bash 契约测试、Markdown 审计文档。

## Global Constraints

- 保持现有后端、前端、边缘网关三镜像和质量门禁顺序。
- 镜像 job 不得获得 `contents: write`。
- Release job 必须拥有 `contents: write`，且只能在镜像发布成功后运行。
- 所有代码注释、日志和文档使用简体中文。

---

### Task 1: 添加失败的 CI 安全契约测试

**Files:**
- Modify: `tests/scripts/production-scripts-test.sh`

- [x] 添加测试，要求 `docker` 与 `release` job 都包含 `docker image push`，且不存在扫描后再次调用 `docker/build-push-action` 的 `push: true` 阶段。
- [x] 添加测试，要求 `create-release` job 仅声明 `contents: write`，依赖 `release`，而 `deploy` 依赖 `create-release`。
- [x] 添加测试，统计 `ci.yml` 与 `codeql.yml` 的 `uses:` 引用，并拒绝不是完整 40 位 SHA 的引用。
- [x] 将测试加入 `ci` 与 `all` 两个执行分支。
- [x] 运行 `bash tests/scripts/production-scripts-test.sh ci`，确认旧 workflow 按预期失败。

### Task 2: 让扫描对象与发布对象严格相同

**Files:**
- Modify: `.github/workflows/ci.yml`

- [x] 删除 `docker` 与 `release` job 中扫描后的三次 `docker/build-push-action` 推送调用。
- [x] 为每个镜像增加中文 `run` 步骤，通过 `IMAGE_TAGS` 环境变量逐行执行 `docker image push`。
- [x] 保留三张本地镜像的 `load: true`、Trivy 顺序和原有标签输出。
- [x] 运行 CI 契约测试确认红灯转绿灯。

### Task 3: 拆分最小权限 GitHub Release job

**Files:**
- Modify: `.github/workflows/ci.yml`

- [x] 从 `release` 镜像 job 移除 GitHub Release Action。
- [x] 新增 `create-release` job，`needs: [release]`，权限仅为 `contents: write`，固定 Release Action 完整 SHA。
- [x] 修改 `deploy` 为 `needs: [release, create-release]`，使 Release 失败时不部署。
- [x] 运行 CI 契约测试确认权限与依赖边界。

### Task 4: 固定 Action 引用并纠正审计文档

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/codeql.yml`
- Modify: `docs/LANDING_READINESS_REPORT.md`
- Modify: `docs/evaluation/00-INDEX.md`
- Modify: `docs/evaluation/08-DevOps与CI_CD分析.md`
- Modify: `docs/evaluation/12-依赖与供应链安全分析.md`
- Modify: `docs/evaluation/S09-风险登记册.md`

- [x] 将每个 Action 引用固定到经 GitHub 官方仓库核实的完整 SHA，并在同一行保留版本注释。
- [x] 加入顶层 `permissions: contents: read`，并保留各 job 的最小覆盖权限。
- [x] 将 R25、R26、R27 状态更新为已修复或验证中的准确状态，并把 Action 计数改为修复后的真实值。
- [x] 运行 `git diff --check` 和静态计数检查，确保文档没有再次出现 54/48 的旧数字。

### Task 5: 分层验证

**Files:**
- No new files.

- [x] 运行 `bash -n tests/scripts/production-scripts-test.sh`。
- [x] 运行 `bash tests/scripts/production-scripts-test.sh ci`。
- [x] 运行 YAML 解析和 `git diff --check`。
- [ ] 按环境能力运行后端/前端相关回归；若依赖或容器不可用，记录确切失败边界，不宣称全量通过。
