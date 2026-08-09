# 生产滚动部署自动回滚实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将默认生产滚动部署提取为可测试脚本，使首次容器变更后的任何失败自动回滚并验证旧版本健康。

**Architecture:** `docker/deploy-production.sh` 负责预检、拉取、无状态服务重建、双健康门禁、错误陷阱和原子版本记录；GitHub Actions 只传入目标版本并远程调用。生产脚本测试通过假 Docker/curl 模拟成功、失败与回滚，不访问真实仓库或容器。

**Tech Stack:** Bash 3.2+、Docker Compose v2、GitHub Actions、现有生产脚本回归框架。

## Global Constraints

- 所有注释、日志和文档使用简体中文。
- 只替换 `backend`、`frontend`，不得停止或重建任何有状态服务或数据卷。
- 预检和目标镜像拉取失败时运行态尚未改变，不执行回滚。
- 运行态开始改变后的任何失败必须尝试旧 tag 回滚并重新验证健康。
- 回滚必须使用 `--pull never`，不把镜像仓库可用性作为恢复前提。
- 目标镜像显式拉取成功后，容器重建也必须使用 `--pull never`，避免变更阶段再次访问仓库。
- 每次健康探测默认最多等待 5 秒，连接或响应卡死不得无限阻塞部署状态机。
- 只有目标版本健康通过后才能原子更新 `.last-deployed-tag`。
- 不打印 GHCR 凭据或生产环境变量值。

---

### Task 1: 可测试的部署与回滚编排

**Files:**
- Create: `docker/deploy-production.sh`
- Modify: `tests/scripts/production-scripts-test.sh`

**Interfaces:**
- Consumes: `deploy-production.sh <target-tag>`、`COMPOSE_DIR`、`GHCR_PULL_USER`、`GHCR_PULL_TOKEN` 和健康探测环境变量。
- Produces: 目标成功时退出 `0` 并更新 `.last-deployed-tag`；目标失败时完成回滚尝试后退出原始非零状态。

- [ ] **Step 1: 写预检失败测试**

在 `production-scripts-test.sh` 新增 `test_deploy_preflight_failure_does_not_mutate_services`。临时目录中的假 `validate-env.sh` 返回 `1`，假 `docker` 把调用写入日志；断言部署失败且日志不包含 `login`、`pull`、` up `。

- [ ] **Step 2: 运行测试并确认 RED**

Run: `bash tests/scripts/production-scripts-test.sh deploy`

Expected: FAIL，原因是 `docker/deploy-production.sh` 尚不存在或没有预检保护。

- [ ] **Step 3: 写成功发布与自动回滚测试**

新增以下行为测试：

```bash
test_deploy_success_updates_version_atomically
test_deploy_health_failure_rolls_back_and_verifies_health
test_deploy_compose_failure_rolls_back
test_deploy_without_history_never_rolls_back_to_unknown_tag
test_deploy_rollback_health_failure_is_critical
```

假 `docker` 必须记录 `TAG|参数`；假 `curl` 按调用次数返回 HTTP 码。成功场景返回 `200`，失败后回滚场景依次返回 `503`、`200`，双失败场景依次返回 `503`、`503`。所有测试设置：

```bash
DEPLOY_MAX_ATTEMPTS=1
DEPLOY_INITIAL_DELAY_SECONDS=0
DEPLOY_ROLLBACK_INITIAL_DELAY_SECONDS=0
DEPLOY_POLL_INTERVAL_SECONDS=0
```

- [ ] **Step 4: 运行测试并确认 RED**

Run: `bash tests/scripts/production-scripts-test.sh deploy`

Expected: FAIL，原因是自动回滚、回滚健康验证和原子版本记录尚未实现。

- [ ] **Step 5: 实现最小部署脚本**

脚本使用以下结构：

```bash
set -Eeuo pipefail

wait_for_health() {
  local label="$1"
  local initial_delay="$2"
  sleep "$initial_delay"
  # 轮询 DEPLOY_HEALTH_URL，并同时检查 frontend 容器 health。
}

rollback() {
  export TAG="$CURRENT_TAG"
  "${COMPOSE[@]}" up -d --no-deps --force-recreate --pull never backend frontend
  wait_for_health "回滚版本 $CURRENT_TAG" "$DEPLOY_ROLLBACK_INITIAL_DELAY_SECONDS"
}

handle_failure() {
  local original_status="$1"
  trap - ERR
  set +e
  if [[ "$MUTATION_STARTED" = true ]]; then
    rollback
  fi
  exit "$original_status"
}

trap 'handle_failure "$?"' ERR
```

预检完成并拉取目标镜像后，在 `compose up` 前设置 `MUTATION_STARTED=true`。健康成功后使用 `mktemp`、`printf` 和 `mv` 更新版本文件，再解除 `ERR` trap。

- [ ] **Step 6: 运行部署测试并确认 GREEN**

Run: `bash tests/scripts/production-scripts-test.sh deploy`

Expected: `生产脚本测试通过`。

- [ ] **Step 7: 运行 shell 语法检查**

Run: `bash -n docker/deploy-production.sh tests/scripts/production-scripts-test.sh`

Expected: 退出码 `0`、无输出。

- [ ] **Step 8: 提交 Task 1**

```bash
git add docker/deploy-production.sh tests/scripts/production-scripts-test.sh
git commit -m "feat(ops): add verified production deployment rollback"
```

### Task 2: GitHub Actions 调用部署脚本

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `tests/scripts/production-scripts-test.sh`

**Interfaces:**
- Consumes: deploy job 的 `TARGET_VERSION`、`DEPLOY_PATH` 和服务器端 `docker/deploy-production.sh`。
- Produces: SSH 步骤只验证部署脚本存在并执行 `bash ./deploy-production.sh "$TARGET_VERSION"`。

- [ ] **Step 1: 写 CI 契约失败测试**

更新 `test_deploy_has_fail_closed_preflight`，断言 deploy block 包含：

```text
test -f ./deploy-production.sh
bash ./deploy-production.sh "$TARGET_VERSION"
```

同时断言 deploy job 仍为 `needs: [release]`。

- [ ] **Step 2: 运行 CI 测试并确认 RED**

Run: `bash tests/scripts/production-scripts-test.sh ci`

Expected: FAIL，输出缺少 `deploy-production.sh`。

- [ ] **Step 3: 精简远程部署步骤**

保留 SSH action、目录切换和目标版本传递，将内联部署逻辑替换为：

```bash
set -euo pipefail
cd "$DEPLOY_PATH"
test -f ./deploy-production.sh || {
  echo "❌ DEPLOY_PATH 缺少 deploy-production.sh" >&2
  exit 1
}
bash ./deploy-production.sh "$TARGET_VERSION"
```

- [ ] **Step 4: 运行 CI 与全部生产脚本测试**

Run: `bash tests/scripts/production-scripts-test.sh ci`

Expected: `生产脚本测试通过`。

Run: `bash tests/scripts/production-scripts-test.sh all`

Expected: `生产脚本测试通过`。

- [ ] **Step 5: 提交 Task 2**

```bash
git add .github/workflows/ci.yml tests/scripts/production-scripts-test.sh
git commit -m "ci: invoke tested production deployment script"
```

### Task 3: 部署与故障处理文档

**Files:**
- Modify: `docs/DEPLOY.md`
- Modify: `docs/OPS_RUNBOOK.md`
- Modify: `docs/BLUE_GREEN_DEPLOY.md`

**Interfaces:**
- Consumes: Task 1 的命令、健康门禁与回滚语义。
- Produces: 现场部署、回滚失败处置和蓝绿选型说明。

- [ ] **Step 1: 更新默认部署说明**

在 `DEPLOY.md` 记录 `docker/deploy-production.sh <tag>`、部署目录所需文件、同版本幂等行为、`--pull never` 回滚和回滚后双健康检查。

- [ ] **Step 2: 更新故障剧本**

在 `OPS_RUNBOOK.md` 增加：

```bash
cat .last-deployed-tag
docker compose --env-file .env -f docker-compose.yml -f docker-compose.prod.yml ps backend frontend
docker compose --env-file .env -f docker-compose.yml -f docker-compose.prod.yml logs --tail=200 backend frontend
curl --fail http://localhost:8080/health/ready
```

明确回滚健康失败时不得更新版本记录，也不得删除旧镜像或数据卷。

- [ ] **Step 3: 对齐蓝绿文档**

在 `BLUE_GREEN_DEPLOY.md` 明确默认滚动部署使用独立脚本并具备分钟级自动回滚；蓝绿仍是资源充足环境的零停机选项。

- [ ] **Step 4: 完成差异与脚本验证**

Run: `git diff --check`

Expected: 退出码 `0`、无空白错误。

Run: `bash -n docker/deploy-production.sh && bash tests/scripts/production-scripts-test.sh all`

Expected: 语法检查退出码 `0`，生产脚本测试通过。

- [ ] **Step 5: 提交 Task 3**

```bash
git add docs/DEPLOY.md docs/OPS_RUNBOOK.md docs/BLUE_GREEN_DEPLOY.md
git commit -m "docs: document verified deployment rollback"
```
