# 生产环境模板漂移安全同步实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: 使用 `superpowers:executing-plans` 逐项实施。每个实现步骤先写失败测试，再写最小生产代码；本工作区不执行提交、暂存或推送。

**Goal:** 为生产 `.env` 增加显式、原子且不覆盖既有值的非秘密模板默认值同步能力，降低配置漂移导致的上线失败。

**Architecture:** 复用 `bootstrap-production-secrets.sh` 的重复键检查、目录锁、临时文件和原子替换流程；新增只读白名单 `SYNCABLE_TEMPLATE_KEYS`，只从同目录 `.env.example` 追加缺失的非秘密默认项。 `setup.sh --sync-template-defaults` 作为推荐入口，成功同步后仍必须经过凭据、证书、Compose 和运行时门禁。

**Tech Stack:** Bash、awk、openssl、Docker Compose、`tests/scripts/production-scripts-test.sh` 契约测试、Markdown 部署文档。

## Global Constraints

- 默认不传同步参数时，两个生产脚本的行为保持不变。
- 只追加代码白名单中的非秘密默认值；已有键（包括空值、非法值和有效值）永不覆盖。
- 禁止自动同步密码、秘密、API Key、私钥、许可证、租户 UUID、域名、证书路径和 `FRONTEND_URL`。
- 冲突重复键、符号链接、模板缺键/重复/占位值和原子替换失败必须 fail-closed 且不修改原 `.env`。
- 同值重复键只有显式 `--repair-identical-duplicates` 才能归一化；冲突重复键永不自动选择。
- 不读取或写入真实生产秘密，不启动/重启 Docker，不把凭据值写入日志或命令参数。
- 同步/生成失败时不得处理证书、Mosquitto 密码文件或运行时服务。
- 新增注释、日志和文档使用简体中文。

---

### Task 1: 为模板同步补充失败契约测试

**Files:**
- Modify: `tests/scripts/production-scripts-test.sh`，在现有 bootstrap/setup 测试附近增加行为测试，并注册到 `setup` 与 `all` 分支。

**Interfaces:**
- 调用 `bootstrap-production-secrets.sh --env-file <临时文件> --sync-template-defaults`。
- 调用 `setup.sh --sync-template-defaults`，通过临时 bootstrap 替身记录参数。

- [x] **Step 1: 写同步和原值保护测试**

新增 `test_bootstrap_syncs_only_whitelisted_template_defaults`：复制模板和脚本到临时目录，构造缺少 `RABBITMQ_IMAGE`、`ASPNETCORE_ENVIRONMENT`、`OTEL_EXPORTER_OTLP_ENDPOINT` 的旧式 `.env`，运行同步模式，断言这些非秘密默认项被追加，`AUTOMAPPER_LICENSE_KEY`、`GATEWAY_TENANT_ID`、`FRONTEND_URL` 的占位/已有内容不被新增或替换，并且输出不含随机凭据值。

新增 `test_bootstrap_sync_does_not_overwrite_existing_default_or_empty_value`：预置自定义 `RABBITMQ_IMAGE` 与空的 `OTEL_EXPORTER_OTLP_ENDPOINT`，运行同步后断言原值逐字保留且没有第二个同名键。

- [x] **Step 2: 写模板错误和敏感白名单测试**

新增 `test_bootstrap_sync_rejects_invalid_template_before_mutation`：分别使用缺少白名单键、重复白名单键、白名单值含 `PLEASE_CHANGE` 的模板，断言命令非零、`.env` 与备份完全一致、无锁目录残留。

新增 `test_bootstrap_sync_allowlist_excludes_sensitive_keys`：从脚本 `SYNCABLE_TEMPLATE_KEYS` 数组提取键名，断言不包含 `PASSWORD`、`SECRET`、`API_KEY`、`PRIVATEKEY`、`LICENSE`、`TENANT`、`DOMAIN`、`FRONTEND_URL`；并断言模板敏感项不会被同步新增。

- [x] **Step 3: 写 setup 调用顺序测试并观察 RED**

新增 `test_setup_syncs_template_defaults_when_explicit`：运行 `setup.sh --sync-template-defaults`，断言 bootstrap 替身收到该参数、非零失败立即返回，且未创建 TLS/MQTT 后续目录。扩展现有非法参数测试，确认未知参数和单独的 `--repair-identical-duplicates` 在任何文件写入前失败。

注册测试后运行：

```bash
bash -n tests/scripts/production-scripts-test.sh
bash tests/scripts/production-scripts-test.sh setup
```

预期新增测试因脚本尚未识别同步参数而失败；如果立即通过，先修正测试夹具或断言。

### Task 2: 在 bootstrap 中实现安全模板同步

**Files:**
- Modify: `docker/bootstrap-production-secrets.sh` 的参数、模板检查、重写和结果摘要部分。

**Interfaces:**
- 新状态：`SYNC_TEMPLATE_DEFAULTS=false`、`TEMPLATE_FILE="${SCRIPT_DIR}/.env.example"`、`SYNCED_DEFAULT_COUNT=0`。
- 新数组：`SYNCABLE_TEMPLATE_KEYS=(ASPNETCORE_ENVIRONMENT EVENTBUS_PROVIDER ALLOW_INMEMORY_EVENTBUS_IN_PRODUCTION EVENTBUS_OUTBOX_ENABLED EVENTBUS_OUTBOX_POLL_INTERVAL_SECONDS EVENTBUS_OUTBOX_BATCH_SIZE EVENTBUS_OUTBOX_LEASE_SECONDS EVENTBUS_OUTBOX_MAX_BACKOFF_SECONDS EVENTBUS_OUTBOX_RETENTION_DAYS RABBITMQ_IMAGE RABBITMQ_USER RABBITMQ_PORT RABBITMQ_MGMT_PORT GATEWAY_ID GATEWAY_BUFFER_PATH GATEWAY_BACKEND_URL GATEWAY_ALLOWED_HOSTS GATEWAY_UPLOAD_INTERVAL EDGE_PORT EDGE_BLUEGREEN_PORT INTERNAL_BIND_ADDRESS PUBLIC_BIND_ADDRESS BACKEND_PORT FRONTEND_PORT FILE_STORAGE_PROVIDER FILE_STORAGE_BASE_PATH WAF_RULES_PATH WAF_REQUIRE_EXTERNAL_RULES JAEGER_SPAN_STORAGE_TYPE JAEGER_BADGER_EPHEMERAL OTEL_EXPORTER_OTLP_ENDPOINT SMTP_PORT SMTP_FROM_NAME SMTP_ENABLE_SSL EMAIL_DELIVERY_ENABLED EMAIL_DELIVERY_POLL_INTERVAL_SECONDS EMAIL_DELIVERY_BATCH_SIZE EMAIL_DELIVERY_LEASE_SECONDS EMAIL_DELIVERY_MAX_ATTEMPTS EMAIL_DELIVERY_MAX_BACKOFF_SECONDS EMAIL_DELIVERY_RETENTION_DAYS BEHIND_PROXY TRUSTED_PROXY_NETWORKS OUTBOUND_HTTP_ALLOW_PRIVATE_NETWORKS LLM_MODEL LLM_ENDPOINT SEED_DEMO_DATA)`，只包含设计规格列出的非秘密键；`VAPID__SUBJECT`、`SSL_CERT_PATH` 和 `SSL_KEY_PATH` 分别绑定发件身份或证书部署，不进入同步白名单。
- 新函数：`is_syncable_template_key`、`read_template_value`、`validate_sync_template`，只输出键名和错误类别。

- [x] **Step 1: 增加参数和模板前置校验**

在 usage 增加 `--sync-template-defaults`。同步模式要求模板存在、不是符号链接且可读；逐一检查白名单键在模板中恰好出现一次、值非空且不含 `请修改`、`PLEASE_CHANGE`、`CHANGE_ME`、`SET_VIA_ENVIRONMENT`。任何失败在锁目录和临时文件创建前退出。

白名单必须采用精确 `case` 匹配，不能使用“排除 PASSWORD 后全部同步”的负向规则。模板值使用 `awk -F=` 读取，不打印完整配置行。

- [x] **Step 2: 在同一临时文件中只追加缺失项**

保留现有重复键扫描和随机凭据生成。随机值处理完成后，仅当同步模式开启且 `key_was_seen` 返回 false 时，从模板追加白名单键；已有键为空也视为已存在。追加说明注释只在实际追加数量大于零时写入，并更新 `SEEN_KEYS` 与 `SYNCED_DEFAULT_COUNT`。

继续使用既有 `chmod 600`、同目录 `mv` 和退出清理逻辑，不建立第二套写入器。

- [x] **Step 3: 更新脱敏摘要并运行 GREEN 检查**

成功时输出追加的非秘密默认值数量和本地随机凭据数量；数量为零时不输出误导性成功项。同步失败仍运行现有分类整改提示并返回非零。

运行：

```bash
bash -n docker/bootstrap-production-secrets.sh
bash tests/scripts/production-scripts-test.sh setup
```

### Task 3: 将同步接入 setup 主入口

**Files:**
- Modify: `docker/setup.sh` 的状态变量、usage、参数校验和 bootstrap 调用。
- Test: `tests/scripts/production-scripts-test.sh` 的 setup 参数契约。

**Interfaces:**
- `setup.sh --sync-template-defaults` 自动进入 bootstrap；`--repair-identical-duplicates` 可与同步参数组合。
- 单独使用 `--repair-identical-duplicates` 或未知参数仍在创建 `.env` 前返回非零。

- [x] **Step 1: 增加同步状态和参数解析**

新增 `SYNC_TEMPLATE_DEFAULTS=false` 与 usage 文案；将 bootstrap 条件扩展为本地凭据或模板同步任一显式启用。同步模式传递 `--env-file "${ENV_FILE}" --sync-template-defaults`，按需追加修复参数，不通过 `source` 或环境变量注入配置。

- [x] **Step 2: 保持 fail-closed 顺序并运行脚本全量测试**

bootstrap 返回非零时输出“本地凭据/模板默认值初始化失败”并立即退出；不进入证书、Mosquitto 密码文件或 Docker 后续动作。运行：

```bash
bash -n docker/setup.sh tests/scripts/production-scripts-test.sh
bash tests/scripts/production-scripts-test.sh setup
bash tests/scripts/production-scripts-test.sh all
```

### Task 4: 更新部署、环境变量和运维文档

**Files:**
- Modify: `docs/DEPLOY.md`：首次部署和旧 `.env` 升级命令。
- Modify: `docs/environment-variables.md`：同步项与外部生产项分类。
- Modify: `docs/OPS_RUNBOOK.md`：备份、同步、冲突处理和复验顺序。
- Modify: `docs/LANDING_READINESS_REPORT.md`、`docs/evaluation/S09-风险登记册.md`：说明同步能力不等于风险关闭。

- [x] **Step 1: 更新推荐操作**

文档推荐 `bash docker/setup.sh --sync-template-defaults`，先备份 `.env`，明确同步只追加白名单非秘密默认值；域名、许可证、租户、SMTP/LLM/OTLP 和证书仍需人工配置。

- [x] **Step 2: 更新失败处置和发布状态**

记录模板错误、重复冲突和外部配置的不同处理方式；明确真实 `validate-env.sh --check-runtime-files` 返回 0 之前不得上线。示例不包含真实秘密。

### Task 5: 分层验证与工作区审计

**Files:**
- No new source files; review only files listed above and preserve unrelated existing changes.

- [x] **Step 1: 运行脚本门禁**

```bash
bash -n docker/setup.sh docker/bootstrap-production-secrets.sh docker/validate-env.sh tests/scripts/production-scripts-test.sh
bash tests/scripts/production-scripts-test.sh all
git diff --check
```

- [x] **Step 2: 运行后端/前端既有质量门禁**

本轮增量仅修改生产 Bash 脚本、脚本契约测试和 Markdown；后端/前端质量门禁沿用本轮开始前已实测的全量基线（后端单测 1680/1680、集成 187 通过/6 跳过、前端 494/494、类型/Lint/i18n/生产构建通过）。

```bash
dotnet test tests/EquipAI.Tests.Unit --no-restore
dotnet test tests/EquipAI.Tests.Integration --no-restore --logger "console;verbosity=minimal"
dotnet build EquipAI.sln --configuration Release --no-restore -m:1 --disable-build-servers
cd frontend && npm test && npm run build && npm run check:i18n && npx tsc -p tsconfig.json --noEmit && npx eslint src/ --max-warnings 1
```

- [x] **Step 3: 复核真实环境安全边界**

只读运行 `validate-env.sh docker/.env --check-runtime-files` 仍报告 27 项问题；确认未产生真实 `.env.lock` 或 `.env.tmp.*`，未修改真实 `docker/.env`。

确认测试未修改真实 `docker/.env`，没有 `.env.lock`、`.env.tmp.*`、密钥输出或证书变更；只读运行 `bash docker/validate-env.sh docker/.env --check-runtime-files`，若仍非零则逐类记录剩余外部阻塞，不得宣称生产就绪。
