# 生产发布与回滚统一门禁实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将只读生产 readiness 检查接入滚动部署、幂等发布和自动回滚，使部署只有在完整 Compose 运行态健康后才记录成功。

**Architecture:** 扩展 `docker/production-readiness.sh` 支持有序的多文件 Compose overlay；`docker/deploy-production.sh` 通过内部 `run_readiness_gate` 在拉取镜像前执行静态门禁，在目标版本和回滚版本的应用探针通过后执行全量运行态门禁。部署脚本不读取 `.env` 为 Shell，不生成或修复生产凭据，继续使用本机旧镜像回滚并原子维护 `.last-deployed-tag`。

**Tech Stack:** Bash `set -Eeuo pipefail`、Docker Compose v2、现有 `validate-env.sh`、生产脚本回归测试 `tests/scripts/production-scripts-test.sh`。

## Global Constraints

- 所有新增注释、日志和文档使用简体中文。
- `production-readiness.sh` 不得调用 `up`、`start`、`restart`、`build`、`pull`、`create`、`run` 或 `exec`。
- 不 source `.env`，不把凭据作为命令参数传递，不在输出中打印环境变量值或 Compose 展开配置。
- `docker/.env`、TLS/MQTT 证书、容器、卷和网络不在本计划中修改。
- 不通过切换 `Development`、开启演示种子或放宽校验降低真实环境的 27 项阻断。
- 每个任务先补失败测试，再做最小实现；每个任务结束运行对应回归并创建一个 Conventional Commit。
- 生产 Compose 使用 `docker-compose.yml` 后跟 `docker-compose.prod.yml` 的顺序，后者覆盖前者。

---

## 文件与职责映射

| 文件 | 职责 | 本计划变更 |
|---|---|---|
| `docker/production-readiness.sh` | 只读静态/运行态门禁 | 支持重复 `--compose-file`，按顺序构造 Compose 命令并逐文件校验 |
| `docker/deploy-production.sh` | 生产滚动部署、健康检查、回滚 | 统一调用 readiness，部署后和回滚后执行全量运行态门禁 |
| `tests/scripts/production-scripts-test.sh` | Bash 行为回归、Docker/curl 替身 | 增加 overlay、部署顺序、运行态失败和回滚门禁测试 |
| `docs/DEPLOY.md` | 部署操作手册 | 明确 overlay 参数和自动门禁顺序 |
| `docs/OPS_RUNBOOK.md` | 故障恢复手册 | 明确部署/回滚 readiness 失败处置 |
| `docs/LANDING_READINESS_REPORT.md` | 生产就绪证据基线 | 只记录已验证的代码能力，保留外部环境阻断 |

### Task 1: 让只读 readiness 支持生产 Compose overlay

**Files:**
- Modify: `docker/production-readiness.sh` 的 Compose 路径、参数解析和命令构造部分
- Modify: `tests/scripts/production-scripts-test.sh` 的 readiness fixture、测试分支和 `all` 分支

**Interfaces:**
- Consumes: 现有 `--env-file <路径>`、`--runtime`、`PRODUCTION_DOCKER_BIN`、`PRODUCTION_COMPOSE_FILE`。
- Produces: `production-readiness.sh [--env-file <路径>] [--compose-file <路径> ...] [--runtime]`；未传 `--compose-file` 时保留单文件默认行为。

- [x] **Step 1: 写多文件和符号链接失败测试**

在 `create_readiness_fixture` 后增加测试。多文件测试必须创建空的 `docker-compose.prod.yml`，运行：

```bash
bash ./production-readiness.sh \
  --compose-file "$case_dir/docker-compose.yml" \
  --compose-file "$case_dir/docker-compose.prod.yml"
```

使用现有 `DOCKER_CALL_LOG` 断言 Docker 调用包含：

```text
-f <基础 Compose> -f <生产 Compose> config --quiet
```

第二个测试把 overlay 改为指向基础文件的符号链接，断言返回非零并包含“符号链接”，且 fake Docker 没有被调用。把两个测试加入 `readiness)` 和 `all)` 分支。

- [x] **Step 2: 运行测试确认先失败**

```bash
bash tests/scripts/production-scripts-test.sh readiness
```

预期：新测试因当前脚本将 `--compose-file` 视为未知参数而失败；现有单文件测试仍通过。

- [x] **Step 3: 实现数组化 Compose 参数**

将单值 `COMPOSE_FILE` 改为 `COMPOSE_FILES=()`；参数解析时对每个 `--compose-file` 执行 `COMPOSE_FILES+=("$2")`。未指定时使用 `${PRODUCTION_COMPOSE_FILE:-${SCRIPT_DIR}/docker-compose.yml}` 作为唯一文件。

解析后逐个执行绝对路径解析、存在性检查和符号链接拒绝。将 Compose 调用统一构造成数组：

```bash
compose_command=("$DOCKER_BIN" compose --env-file "$ENV_FILE")
for compose_file in "${COMPOSE_FILES[@]}"; do
compose_command+=(-f "$compose_file")
done
compose_command+=("$@")
run_captured "$output_variable" "${compose_command[@]}"
```

更新帮助文本，说明 `--compose-file` 可重复；静态配置解析、服务清单和运行态状态读取必须复用这组文件。

- [x] **Step 4: 运行 readiness 回归**

```bash
bash tests/scripts/production-scripts-test.sh readiness
bash -n docker/production-readiness.sh tests/scripts/production-scripts-test.sh
```

预期：所有 readiness 测试通过，Compose 错误脱敏测试仍不输出秘密值。

- [x] **Step 5: 提交 Task 1**

```bash
git add docker/production-readiness.sh tests/scripts/production-scripts-test.sh \
  docs/superpowers/plans/2026-08-12-production-release-readiness-gate.md
git commit -m "feat: support layered compose files in readiness gate"
```

### Task 2: 把静态 readiness 接入部署前置检查

**Files:**
- Modify: `docker/deploy-production.sh` 的必需文件、预检和 Compose 编排部分
- Modify: `tests/scripts/production-scripts-test.sh` 的部署 fixture、预检测试和 `deploy/all` 分支

**Interfaces:**
- Consumes: Task 1 的 `production-readiness.sh --env-file --compose-file --runtime` 接口。
- Produces: `deploy-production.sh` 内部 `run_readiness_gate [--runtime]`；部署目录必须包含 `production-readiness.sh`。

- [x] **Step 1: 写部署预检顺序测试**

在 `create_deploy_fixtures` 中创建可执行 readiness 替身，写入 `DEPLOY_ORDER_LOG`，并由 `DEPLOY_READINESS_STATIC_RESULT` 控制无 `--runtime` 调用的退出码：

```bash
printf '%s\n' \
  '#!/usr/bin/env bash' \
  'printf "readiness|%s\\n" "$*" >> "$DEPLOY_ORDER_LOG"' \
  'if [[ "${DEPLOY_READINESS_STATIC_RESULT:-0}" != "0" && "$*" != *"--runtime"* ]]; then exit 1; fi' \
  'exit 0' > "$case_dir/production-readiness.sh"
chmod 700 "$case_dir/production-readiness.sh"
```

让 Docker 替身把 `docker|...` 写入同一日志；预检失败测试断言 readiness 先出现、返回非零、Docker 日志为空，且未调用登录、拉取或容器重建。

- [x] **Step 2: 运行部署测试确认先失败**

```bash
bash tests/scripts/production-scripts-test.sh deploy
```

预期：新顺序断言失败，因为当前部署脚本只直接调用 `validate-env.sh`。

- [x] **Step 3: 实现 `run_readiness_gate`**

在部署脚本中定义：

```bash
run_readiness_gate() {
  local runtime_flag="${1:-}"
  local readiness_args=(
    --env-file "$COMPOSE_DIR/.env"
    --compose-file "$COMPOSE_DIR/docker-compose.yml"
    --compose-file "$COMPOSE_DIR/docker-compose.prod.yml"
  )
  if [ "$runtime_flag" = "--runtime" ]; then
    readiness_args+=(--runtime)
  fi
  bash "$COMPOSE_DIR/production-readiness.sh" "${readiness_args[@]}"
}
```

将 `production-readiness.sh` 加入部署必需文件清单；在仓库登录、镜像拉取和容器变更前，用 `run_readiness_gate` 替换直接调用 `validate-env.sh` 与单独的 `compose config --quiet`，避免部署脚本维护第二套静态预检。

- [x] **Step 4: 运行部署预检回归**

```bash
bash tests/scripts/production-scripts-test.sh deploy
bash -n docker/deploy-production.sh
```

预期：静态 readiness 失败不会登录仓库、拉取镜像或重建容器；正常 fixture 继续进入部署流程。

- [x] **Step 5: 提交 Task 2**

```bash
git add docker/deploy-production.sh tests/scripts/production-scripts-test.sh \
  docs/superpowers/plans/2026-08-12-production-release-readiness-gate.md
git commit -m "feat: gate deployments with production readiness"
```

### Task 3: 在目标版本、幂等路径和回滚后执行运行态 readiness

**Files:**
- Modify: `docker/deploy-production.sh` 的 `wait_for_health`、幂等分支、目标部署和 `rollback`
- Modify: `tests/scripts/production-scripts-test.sh` 的 readiness 替身、部署回滚测试和 `deploy/all` 分支

**Interfaces:**
- Consumes: Task 2 的 `run_readiness_gate`。
- Produces: 目标版本健康检查后、回滚健康检查后和同 tag 幂等路径都执行 `run_readiness_gate --runtime`；只有成功后才写 `.last-deployed-tag`。

- [x] **Step 1: 写运行态失败和回滚失败测试**

扩展 readiness 替身，使 `--runtime` 调用按 `DEPLOY_READINESS_RUNTIME_CODES` 的逗号序列返回，并记录 `DEPLOY_READINESS_LOG`。新增两个场景：`1,0` 表示目标运行态失败、回滚运行态成功；`1,1` 表示目标和回滚都失败。两者都断言返回非零、旧 tag 保留，前者包含“回滚验证通过”，后者包含“严重”。

同 tag 测试增加运行态成功断言，并增加运行态失败场景，确保不健康的既有服务不会被误报为幂等成功。

- [x] **Step 2: 运行测试确认先失败**

```bash
bash tests/scripts/production-scripts-test.sh deploy
```

预期：新增测试因部署脚本尚未调用运行态 readiness 而失败。

- [x] **Step 3: 接入三个运行态节点**

目标版本现有应用探针通过后调用：

```bash
if ! run_readiness_gate --runtime; then
  printf '目标版本全量运行态 readiness 失败。\n' >&2
  false
fi
```

同 tag 分支只有应用探针和运行态 readiness 都成功才输出幂等成功。`rollback` 在应用探针通过后调用同一门禁；失败时输出严重故障并返回非零。保持现有 `MUTATION_STARTED`、`handle_failure`、原始失败状态和版本记录原子替换，不在失败路径写入目标 tag。

- [x] **Step 4: 运行完整部署回归**

```bash
bash tests/scripts/production-scripts-test.sh deploy
bash -n docker/deploy-production.sh tests/scripts/production-scripts-test.sh
```

预期：目标失败进入回滚，回滚 readiness 失败保持严重状态；无历史版本时不伪造回滚 tag；状态展示失败不撤销已完成记账。

- [x] **Step 5: 提交 Task 3**

```bash
git add docker/deploy-production.sh tests/scripts/production-scripts-test.sh \
  docs/superpowers/plans/2026-08-12-production-release-readiness-gate.md
git commit -m "feat: verify runtime readiness after deploy and rollback"
```

### Task 4: 更新操作文档和项目级契约

**Files:**
- Modify: `docs/DEPLOY.md` 的 readiness、滚动部署和验证章节
- Modify: `docs/OPS_RUNBOOK.md` 的总检查、升级失败和回滚章节
- Modify: `tests/scripts/production-scripts-test.sh` 的 readiness/deploy/CI 契约测试

**Interfaces:**
- Consumes: Task 1 的多文件 CLI 和 Task 3 的自动运行态门禁。
- Produces: 可复制的基础 Compose + 生产 overlay 命令，以及“部署成功必须包含全量 readiness”的运维说明。

- [x] **Step 1: 先补契约断言**

在现有契约测试中断言：readiness 内容包含 `--compose-file`；部署脚本包含 `production-readiness.sh`、`run_readiness_gate --runtime` 和 `docker-compose.prod.yml`；部署文档包含第二个 Compose 文件；运维手册包含“回滚后的全量运行态 readiness”。

- [x] **Step 2: 更新文档命令**

统一使用：

```bash
bash docker/production-readiness.sh \
  --env-file docker/.env \
  --compose-file docker/docker-compose.yml \
  --compose-file docker/docker-compose.prod.yml

bash docker/production-readiness.sh \
  --env-file docker/.env \
  --compose-file docker/docker-compose.yml \
  --compose-file docker/docker-compose.prod.yml \
  --runtime
```

明确 `deploy-production.sh` 自动执行静态 readiness、三项应用探针和全量运行态 readiness；任一失败都不会写目标版本，目标失败会使用旧镜像回滚，回滚也必须通过全量 readiness。

- [x] **Step 3: 运行文档和契约测试**

```bash
bash tests/scripts/production-scripts-test.sh setup
bash tests/scripts/production-scripts-test.sh ci
bash tests/scripts/production-scripts-test.sh all
```

- [x] **Step 4: 提交 Task 4**

```bash
git add docs/DEPLOY.md docs/OPS_RUNBOOK.md \
  tests/scripts/production-scripts-test.sh \
  docs/superpowers/plans/2026-08-12-production-release-readiness-gate.md
git commit -m "docs: document full runtime readiness deployment gate"
```

### Task 5: 完成项目级验证并记录剩余外部阻断

**Files:**
- Modify: `docs/LANDING_READINESS_REPORT.md` 的质量门禁和部署检查说明
- Test: `docker/production-readiness.sh --help`
- Test: `tests/scripts/production-scripts-test.sh`
- Test: `docker/validate-env.sh docker/.env --check-runtime-files`

**Interfaces:**
- Consumes: Task 1-4 的脚本、测试和文档。
- Produces: 可复现的验证结果，区分代码闭环已通过与真实生产环境仍需人工完成的事项。

- [ ] **Step 1: 执行脚本全量门禁**

```bash
bash docker/production-readiness.sh --help
bash tests/scripts/production-scripts-test.sh readiness
bash tests/scripts/production-scripts-test.sh deploy
bash tests/scripts/production-scripts-test.sh setup
bash tests/scripts/production-scripts-test.sh ci
bash tests/scripts/production-scripts-test.sh all
```

- [ ] **Step 2: 执行 Shell 语法与差异检查**

```bash
bash -n docker/production-readiness.sh docker/deploy-production.sh \
  docker/setup.sh tests/scripts/production-scripts-test.sh
git diff --check
```

- [ ] **Step 3: 重新验证真实工作区门禁**

```bash
bash docker/validate-env.sh docker/.env --check-runtime-files
```

预期：命令仍以非零退出并只报告真实变量名、证书文件和错误类别；当前 27 项问题必须保持可见，不得修改 `docker/.env`。

- [ ] **Step 4: 检查变更范围**

```bash
git -c core.fsmonitor=false status --short --branch
git log -5 --oneline --decorate
```

确认没有生成证书、备份、`.env`、容器卷或未追踪的构建产物。

- [ ] **Step 5: 用实际验证结果更新生产就绪报告并提交**

```bash
git add docs/LANDING_READINESS_REPORT.md
git commit -m "docs: record production readiness gate verification"
```

报告只能记录代码和替身测试已证明的能力；必须保留当前 `docker/.env` 27 项阻断、正式凭据/证书、PII/MFA 密钥恢复、RTO/RPO、容量基线和现场联调为未完成项。最终汇报必须区分代码侧门禁结果和需要用户/运维环境提供的正式凭据、证书、恢复、容量与现场联调证据。
