# 生产发布验收包实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 新增统一的生产发布验收入口，把现有配置、Compose、运行态、备份和外部依赖检查汇总为不泄露秘密的可审计结论。

**架构：** 保持 Bash 作为部署主机运行时，新增 `docker/production-acceptance.sh` 作为只读编排器。它不复制现有检查逻辑，而是调用 `runtime-dir` 下的 `validate-env.sh`、`production-readiness.sh`，并以检查 ID 记录独立备份演练和外部验收证据的状态；CI 和生产部署分别使用 `isolated-ci`、`production` profile。报告采用固定列顺序的 TSV 和脱敏 Markdown，不引入新的生产运行时依赖。

**技术栈：** Bash、Docker Compose、现有生产脚本、GitHub Actions、Shell 契约测试。

## 全局约束

- 所有新增代码注释、日志和文档使用简体中文。
- 不 source `.env`，不把密码、令牌、私钥或带凭据 URL 作为子进程参数传递。
- 验收入口绝不执行 `docker compose up/down/start/restart/pull/build/exec`。
- `isolated-ci` 允许外部依赖为 `SKIPPED`；`production` 对适用外部依赖使用 `BLOCKED`，绝不将缺证据写成 `PASS`。
- 退出码固定为：`0` 全部必需检查通过，`1` 存在失败，`2` 仅存在阻断，`3` 参数/文件/运行环境错误。
- 输出目录和最终报告文件必须拒绝符号链接，并以临时文件加原子 `mv` 写入。
- 不修改 `docker/.env`，不进行提交、推送或不可逆生产操作。

---

### 任务 1：建立验收报告协议的失败测试

**文件：**
- 新建：`tests/scripts/production-acceptance-test.sh`
- 修改：`tests/scripts/production-scripts-test.sh` 的 `ci|all` 分支

**接口：**
- 消费：待新增的 `docker/production-acceptance.sh` 命令行接口。
- 产出：可单独运行的 Bash 回归脚本，以及 `production-scripts-test.sh all` 的统一入口。

- [x] **步骤 1：写失败测试**

在测试脚本中创建临时合法 `.env`、伪造 Docker 可执行文件和临时 Compose 文件，先覆盖以下契约：

```bash
run_acceptance() {
  PRODUCTION_DOCKER_BIN="$TEST_ROOT/fake-docker" \
    bash "$PROJECT_ROOT/docker/production-acceptance.sh" "$@"
}

test_report_protocol_is_stable() {
  local output_dir="$TEST_ROOT/report"
  set +e
  run_acceptance --profile isolated-ci --env-file "$TEST_ROOT/valid.env" \
    --compose-file "$TEST_ROOT/compose.yml" --output-dir "$output_dir"
  local result_code=$?
  set -e
  [[ "$result_code" -eq 0 ]] || fail "隔离 profile 的合法静态验收应通过"
  [[ "$(sed -n '1p' "$output_dir/checks.tsv")" = $'check_id\tcategory\trequired\tstatus\tevidence' ]] \
    || fail "TSV 标题不稳定"
  assert_contains "$(cat "$output_dir/summary.md")" "profile: isolated-ci"
}

test_production_missing_external_is_blocked() {
  local output_dir="$TEST_ROOT/production-report"
  set +e
  run_acceptance --profile production --env-file "$TEST_ROOT/valid.env" \
    --compose-file "$TEST_ROOT/compose.yml" --output-dir "$output_dir"
  local result_code=$?
  set -e
  [[ "$result_code" -eq 2 ]] || fail "缺少外部生产证据时应返回 BLOCKED 退出码 2"
  assert_contains "$(cat "$output_dir/checks.tsv")" $'external.smtp\texternal\ttrue\tBLOCKED'
}
```

- [x] **步骤 2：运行测试确认失败**

运行：`bash tests/scripts/production-acceptance-test.sh`

预期：因 `docker/production-acceptance.sh` 尚不存在而失败，且失败原因指向入口缺失。

- [x] **步骤 3：将独立测试接入总测试入口**

在 `tests/scripts/production-scripts-test.sh` 的 `ci|all` 分支调用：

```bash
bash "$PROJECT_ROOT/tests/scripts/production-acceptance-test.sh"
```

不得把测试密码写入命令行参数或报告断言输出。

- [x] **步骤 4：再次运行测试确认仍按预期失败**

运行：`bash tests/scripts/production-scripts-test.sh ci`

预期：新测试仍因实现缺失失败，旧 CI 契约测试保持可执行。

### 任务 2：实现安全参数解析和报告写入

**文件：**
- 新建：`docker/production-acceptance.sh`
- 测试：`tests/scripts/production-acceptance-test.sh`

**接口：**
- 输入：`--profile isolated-ci|production`、`--env-file`、重复的 `--compose-file`、`--runtime-dir`、`--output-dir`、`--runtime`。
- 输入：`--profile isolated-ci|production`、`--env-file`、重复的 `--compose-file`、`--runtime-dir`、`--evidence-dir`、`--output-dir`、`--runtime`。
- 输出：`checks.tsv`、`summary.md`；函数 `record_check`、`finish_acceptance`、`fail_usage`。

- [x] **步骤 1：补充失败测试**

覆盖未知 profile、重复参数、符号链接 env/Compose/runtime-dir/evidence/output 目录、输出目录权限、报告中秘密值和中断临时文件清理。

- [x] **步骤 2：运行测试确认失败**

运行：`bash tests/scripts/production-acceptance-test.sh`

预期：新协议测试继续失败。

- [x] **步骤 3：实现报告核心**

实现以下固定结构：

```bash
record_check() {
  local check_id="$1" category="$2" required="$3" status="$4" evidence="$5"
  # evidence 只允许经过 sanitize_evidence 的单行内容。
  printf '%s\t%s\t%s\t%s\t%s\n' \
    "$check_id" "$category" "$required" "$status" "$(sanitize_evidence "$evidence")" \
    >> "$REPORT_TEMP_FILE"
}
```

使用 `set -Eeuo pipefail`、`umask 077`、临时报告文件和 `mv -f` 原子替换。`finish_acceptance` 按 FAIL→BLOCKED→PASS 的优先级计算退出码；`SKIPPED` 不计入失败，但必需的生产 `SKIPPED` 必须在记录前转换为 `BLOCKED`。

- [x] **步骤 4：运行测试确认通过**

运行：`bash tests/scripts/production-acceptance-test.sh`

预期：报告协议、参数拒绝、退出码优先级和秘密脱敏测试通过。

### 任务 3：编排静态、Compose、运行态和制品检查

**文件：**
- 修改：`docker/production-acceptance.sh`
- 测试：`tests/scripts/production-acceptance-test.sh`

**接口：**
- 消费：`runtime-dir/validate-env.sh`、`runtime-dir/production-readiness.sh`、`PRODUCTION_DOCKER_BIN`。
- 产出：`static.env`、`static.compose`、`runtime.services`、`artifact.images` 检查记录。

- [x] **步骤 1：写失败测试**

使用 fake Docker 按调用参数返回成功、Compose 解析失败、服务不健康和 `config --images` 含浮动 tag 四种结果，验证每种结果对应固定状态和退出码。

- [x] **步骤 2：运行测试确认失败**

运行：`bash tests/scripts/production-acceptance-test.sh`

预期：静态/Compose/运行态/制品检查因入口尚未编排而失败。

- [x] **步骤 3：实现检查编排**

按以下顺序执行且每一步都先捕获输出再记录：

1. `runtime-dir/validate-env.sh <env> --check-runtime-files` → `static.env`。
2. `docker compose --env-file <env> -f <file> config --quiet` → `static.compose`。
3. `docker compose ... config --images`，逐项拒绝空镜像或未解析的变量；若传入 `EXPECTED_TAG`，校验三个应用镜像包含该 tag → `artifact.images`。
4. 仅传入 `--runtime` 时调用 `runtime-dir/production-readiness.sh` 的同一 Compose 文件集合和 `--runtime` → `runtime.services`；未传入时记录 `SKIPPED`。

Docker 命令必须来自 `PRODUCTION_DOCKER_BIN`，不得直接执行 `exec` 或任何改变容器状态的动作。

- [x] **步骤 4：运行测试确认通过**

运行：`bash tests/scripts/production-acceptance-test.sh` 和 `bash tests/scripts/production-scripts-test.sh ci`

预期：四类检查以及旧生产脚本契约均通过。

### 任务 4：实现隔离备份和外部依赖状态语义

**文件：**
- 修改：`docker/production-acceptance.sh`
- 修改：`tests/scripts/production-acceptance-test.sh`
- 参考：`tests/backup-restore-rehearsal.sh`、`docker/backup.sh`、`docker/restore.sh`

**接口：**
- 输入：`EMAIL_DELIVERY_ENABLED`、`SMTP_HOST`、`OTEL_EXPORTER_OTLP_ENDPOINT`、外部集成启用配置。
- 产出：`data.backup-restore`、`external.smtp`、`external.otel`、`external.mqtt`、`external.integrations` 检查记录。

- [x] **步骤 1：写失败测试**

覆盖：

- `data.backup-restore` 始终为 `SKIPPED`，且报告指向独立实演脚本；验收入口不调用 Docker 状态变更脚本。
- isolated profile 将 SMTP/OTLP/集成检查记录为 `SKIPPED`。
- production profile 中邮件已启用但缺少 SMTP 主机、OTLP 缺失、集成已启用但没有验收证据时记录 `BLOCKED`。
- MQTT 证书静态校验失败时保持 `FAIL`，不能降级为 `BLOCKED`。

- [x] **步骤 2：运行测试确认失败**

运行：`bash tests/scripts/production-acceptance-test.sh`

预期：外部依赖状态测试因实现缺失失败。

- [x] **步骤 3：实现状态映射**

规则固定为：配置格式/证书已知错误为 `FAIL`；生产 profile 缺配置、外部服务不可达或没有人工验收证据为 `BLOCKED`；isolated profile 的真实外部依赖为 `SKIPPED`。SMTP 只有在 `EMAIL_DELIVERY_ENABLED` 明确为 false 时可记录 `SKIPPED`，否则必须具备主机、发件人、TLS 配置以及 `--evidence-dir/external.smtp.pass` 的新鲜 PASS 证据；OTLP、MQTT 和启用的集成遵循同一证据规则。证据文件不得为符号链接、不得被组或其他用户写入，且修改时间不得超过 24 小时。

`data.backup-restore` 不在统一入口中执行，isolated profile 指向由独立 CI job 调用的 `tests/backup-restore-rehearsal.sh`，production profile 指向正式 RPO/RTO 演练；该检查不作为统一入口的通过条件，避免验收脚本误触真实数据。

- [x] **步骤 4：运行测试确认通过**

运行：`bash tests/scripts/production-acceptance-test.sh`

预期：隔离 profile 通过且生产 profile 明确返回 BLOCKED/FAIL，不出现伪造 PASS。

### 任务 5：接入 Production smoke、CI 和部署前门禁

**文件：**
- 修改：`tests/scripts/production-runtime-smoke.sh`
- 修改：`.github/workflows/ci.yml`
- 修改：`docker/deploy-production.sh`
- 测试：`tests/scripts/production-acceptance-test.sh`

**接口：**
- CI 调用：`production-acceptance.sh --profile isolated-ci --runtime --output-dir <artifact-dir>`。
- 部署调用：`production-acceptance.sh --profile production --runtime --evidence-dir "$PRODUCTION_ACCEPTANCE_EVIDENCE_DIR"`，返回 `0` 才允许拉取镜像或重建容器。

- [x] **步骤 1：写失败契约测试**

断言 CI workflow 在 `production-smoke` 完成后运行验收、上传 `checks.tsv`/`summary.md`，发布 job 等待验收；断言 `deploy-production.sh` 在 `docker login`、`compose pull` 和 `compose up` 之前执行 production profile。

- [x] **步骤 2：运行测试确认失败**

运行：`bash tests/scripts/production-acceptance-test.sh`

预期：接线契约因 workflow 和部署脚本尚未引用统一入口而失败。

- [x] **步骤 3：实现接线**

将验收报告保存到 CI workspace 的独立 artifact 目录，并在 smoke 清理前完成上传；`deploy-production.sh` 复用已解析的 Compose 文件集合，不重复 source `.env`，在任何网络登录或运行态变更前执行 production acceptance，并用 `PRODUCTION_ACCEPTANCE_EVIDENCE_DIR` 接收外部验收证据。

- [x] **步骤 4：运行测试确认通过**

运行：`bash tests/scripts/production-acceptance-test.sh`、`bash tests/scripts/production-scripts-test.sh all`。

预期：CI/部署顺序契约、旧脚本测试和报告生成全部通过。

### 任务 6：补齐部署文档、运维剧本和就绪报告

**文件：**
- 修改：`docs/DEPLOY.md`
- 修改：`docs/OPS_RUNBOOK.md`
- 修改：`docs/LANDING_READINESS_REPORT.md`
- 修改：`docs/evaluation/S09-风险登记册.md`

**接口：**
- 文档必须提供可复制的 `isolated-ci` 和 `production` 命令、退出码含义、报告文件位置和“外部验收不等于隔离 smoke”边界。

- [x] **步骤 1：写文档契约测试**

在 `production-acceptance-test.sh` 中读取四份文档，断言出现入口命令、`BLOCKED`、27 项环境问题和不执行生产备份恢复的安全说明。

- [x] **步骤 2：运行测试确认失败**

运行：`bash tests/scripts/production-acceptance-test.sh`

预期：文档尚未出现统一入口命令时失败。

- [x] **步骤 3：更新文档**

补充部署前、CI、回滚和故障处置章节，并把风险登记册新增风险状态写成“代码侧验收包完成，真实环境条件仍需 production profile 清零”。

- [x] **步骤 4：运行最终脚本验证**

运行：

```bash
bash -n docker/production-acceptance.sh tests/scripts/production-acceptance-test.sh
bash tests/scripts/production-acceptance-test.sh
bash tests/scripts/production-scripts-test.sh all
git -c core.fsmonitor=false -c core.untrackedCache=false diff --check
```

预期：命令全部退出 0；生产 `.env` 仍有问题时，测试使用临时环境验证脚本行为，不修改 `docker/.env`。
