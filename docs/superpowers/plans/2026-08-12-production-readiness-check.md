# 生产上线只读自检入口实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 增加一个不会修改环境、不会启动服务、不会输出凭据的生产上线前只读自检入口，把配置、运行时文件、Compose 解析和可选运行中服务状态汇总为明确的成功/失败结果。

**Architecture:** 新增 `docker/production-readiness.sh` 作为运维入口，复用现有 `validate-env.sh` 作为生产环境和证书门禁，并调用 `docker compose config` 验证最终 Compose 配置可解析。默认执行部署前静态检查；显式传入 `--runtime` 时再读取 Compose 服务状态，要求除一次性 `jaeger-init` 外的服务已运行，且已有健康检查的服务必须为 healthy。脚本只读文件和 Docker 状态，不调用 up、start、restart、build、pull、exec 或任何写入命令。

**Tech Stack:** Bash、Docker Compose v2、现有 `validate-env.sh`、现有生产脚本回归测试。

## Global Constraints

- 所有脚本输出和新增注释使用简体中文。
- 不读取、打印或作为参数传递任何 `.env` 凭据值；失败输出只允许包含变量名、文件名、服务名和错误类别。
- 不修改真实 `docker/.env`、证书、密码文件、Docker 容器、卷或网络。
- 默认检查必须要求 Docker CLI、Docker Compose 和 Docker daemon 可用；不能在 Docker 不可用时误报生产就绪。
- `--runtime` 是显式运行态门禁；未传入时不因服务尚未启动而失败，但必须完成静态生产门禁和 Compose 解析。

---

### Task 1: 为只读自检入口建立失败回归测试

**Files:**
- Modify: `tests/scripts/production-scripts-test.sh`
- Test: `tests/scripts/production-scripts-test.sh readiness`

**Interfaces:**
- Consumes: `docker/production-readiness.sh` 的 `--env-file`、`--runtime`、`PRODUCTION_DOCKER_BIN` 和 `PRODUCTION_COMPOSE_FILE` 接口。
- Produces: 可验证静态通过、运行态通过、Docker 不可用失败、运行态服务不健康失败、输出不泄露敏感值的测试契约。

- [x] **Step 1: 写静态自检失败测试**

在测试脚本中新增 `test_production_readiness_requires_static_gate`：创建只含测试用 `.env` 的临时目录，伪造 `docker` 命令使 `compose version`、`info`、`config --quiet` 成功，使复制的 `validate-env.sh` 返回失败并输出一个变量名；断言入口返回非零、包含变量名、不包含测试凭据值，且没有调用 `up`/`start`/`restart`。

- [x] **Step 2: 写运行态通过测试**

新增 `test_production_readiness_accepts_healthy_runtime`：伪造 `docker` 命令返回 Compose 配置服务列表和 `ps --all --format` 的 healthy/running 状态，复制一个成功的 `validate-env.sh`，运行 `--runtime` 并断言返回 0、输出包含静态检查和运行态检查通过信息。

- [x] **Step 3: 写运行态失败和 Docker 不可用测试**

新增 `test_production_readiness_rejects_unhealthy_runtime` 与 `test_production_readiness_rejects_unavailable_docker`：前者让一个服务返回 `running unhealthy`，后者让 `docker info` 失败；分别断言返回非零并包含服务名或 Docker daemon 错误类别。

- [x] **Step 4: 运行测试确认它们先失败**

运行：

```bash
bash tests/scripts/production-scripts-test.sh readiness
```

预期：新增测试因 `docker/production-readiness.sh` 尚不存在而失败；失败原因必须是入口缺失，而不是测试脚本语法错误。

### Task 2: 实现生产只读自检脚本

**Files:**
- Create: `docker/production-readiness.sh`
- Test: `tests/scripts/production-scripts-test.sh`

**Interfaces:**
- Consumes: 默认 `${SCRIPT_DIR}/.env`，可由 `--env-file <路径>` 或 `PRODUCTION_ENV_FILE` 覆盖；默认 `${SCRIPT_DIR}/docker-compose.yml`，可由 `PRODUCTION_COMPOSE_FILE` 覆盖；Docker 命令可由 `PRODUCTION_DOCKER_BIN` 覆盖。
- Produces: `production-readiness.sh [--env-file <路径>] [--runtime]`，静态门禁或运行态门禁失败返回非零，成功返回 0。

- [x] **Step 1: 实现安全参数和依赖检查**

使用 `set -Eeuo pipefail`，解析有限参数集合，拒绝未知参数；解析环境文件和 Compose 文件的绝对路径，拒绝不存在的文件和环境文件符号链接；检查 `docker`、`docker compose`、Docker daemon 和同目录 `validate-env.sh` 是否可用。

- [x] **Step 2: 复用生产环境门禁并净化失败输出**

调用 `bash validate-env.sh <env-file> --check-runtime-files`，捕获其输出后仅打印原有不含值的诊断；同时用环境文件中读取到的敏感值做本地替换，防止未来校验器意外回显凭据。不得打印 `.env` 内容、Compose 展开配置或 Docker 命令行。

- [x] **Step 3: 验证 Compose 可解析但不执行变更操作**

在静态门禁通过且 Docker daemon 可用时调用：

```bash
docker compose --env-file <env-file> -f <compose-file> config --quiet
```

只根据退出码报告结果；不得调用 `up`、`start`、`restart`、`build`、`pull`、`create`、`run` 或 `exec`。

- [x] **Step 4: 实现显式运行态检查**

`--runtime` 时先读取 `docker compose ... config --services`，再读取 `docker compose ... ps --all --format '{{.Service}}\\t{{.State}}\\t{{.Health}}'`。除 `jaeger-init` 外，每个服务必须存在且状态为 `running`；如果健康状态非空，则必须为 `healthy`。状态异常只输出服务名、状态和健康类别，不输出环境变量或容器配置。

- [x] **Step 5: 运行测试确认通过**

运行：

```bash
bash tests/scripts/production-scripts-test.sh readiness
```

预期：静态通过、运行态通过、Docker 不可用和不健康服务四个场景均按预期返回。

### Task 3: 接入部署文件检查、文档和脚本总回归

**Files:**
- Modify: `docker/setup.sh`
- Modify: `docs/DEPLOY.md`
- Modify: `docs/OPS_RUNBOOK.md`
- Modify: `tests/scripts/production-scripts-test.sh`

**Interfaces:**
- Consumes: Task 2 的 `docker/production-readiness.sh`。
- Produces: 新部署文件会被 `setup.sh` 检查，运维文档包含静态和运行态的明确调用顺序，`all` 测试覆盖新入口。

- [x] **Step 1: 将脚本纳入 setup 完整性和可执行权限检查**

把 `production-readiness.sh` 加入 `REQUIRED_FILES` 和 `EXECUTABLE_SCRIPTS`，避免发布包缺失自检入口却仍被报告为完整。

- [x] **Step 2: 补充部署和故障手册**

在生产启动前加入 `bash docker/production-readiness.sh --env-file docker/.env`；服务启动后加入 `bash docker/production-readiness.sh --env-file docker/.env --runtime`。明确第一条命令不会启动服务，第二条命令只读取状态；失败时按变量名、证书文件或服务名整改后重试。

- [x] **Step 3: 将测试接入 `all` 和 CI 脚本契约**

把 readiness 测试加入 `all`，并断言 `setup.sh`、部署文档和脚本权限清单包含新入口。

- [x] **Step 4: 运行脚本门禁和静态校验**

运行：

```bash
bash tests/scripts/production-scripts-test.sh all
bash -n docker/production-readiness.sh docker/setup.sh tests/scripts/production-scripts-test.sh
git diff --check
```

预期：所有生产脚本测试通过，Shell 语法检查和差异空白检查通过。

### Task 4: 完成项目级验证

**Files:**
- Test: `tests/scripts/production-scripts-test.sh`
- Test: `docker/production-readiness.sh --help`

- [x] **Step 1: 验证新入口帮助和测试契约**

运行 `bash docker/production-readiness.sh --help` 与 `bash tests/scripts/production-scripts-test.sh all`，确认参数说明和返回码稳定。

- [x] **Step 2: 运行受影响的项目质量门禁**

运行 `docker compose --env-file docker/.env.example -f docker/docker-compose.yml config --quiet`、前端 lint/i18n/build、后端 Release build，以及与本次改动相关的生产脚本测试；如果真实 `.env` 或证书仍不满足门禁，只记录变量名/证书问题，不修改真实环境。

- [x] **Step 3: 更新执行计划状态并汇报证据**

将本计划勾选项更新为完成，并在最终回复中区分“代码和测试已验证”与“真实部署仍需人工补齐的许可证、租户、域名、证书及外部依赖”。本任务不创建提交、不暂存文件，也不启动或停止用户容器。
