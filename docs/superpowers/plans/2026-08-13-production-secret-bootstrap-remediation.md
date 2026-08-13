# 生产凭据初始化与整改门禁实施计划

> **执行说明：** 实施本计划时必须使用 `superpowers:test-driven-development`，每个行为先补充失败契约测试，再进行最小实现，最后运行 `superpowers:verification-before-completion`。

## 目标

为生产部署增加一个明确、可审计的本地凭据初始化入口，降低首次部署因 `.env` 占位值、缺失本地密钥或重复键而失败时的排障成本，同时保持生产门禁 fail-closed：证书、许可证、真实租户、域名、SMTP、LLM 和 OTLP 等生产专属配置仍必须由部署方提供，不由脚本猜测或生成。

## 架构与边界

- `docker/setup.sh` 继续作为生产初始化主入口；默认行为保持不变。
- 仅当用户显式传入 `--bootstrap-local-secrets` 时，`setup.sh` 才调用现有 `bootstrap-production-secrets.sh`。
- `--repair-identical-duplicates` 只能与上述 bootstrap 选项一起使用；只允许归一化值完全相同的重复键，冲突值永不自动选择。
- 凭据初始化复用现有的原子临时文件、`600` 权限、目录锁和符号链接保护，不新建第二套凭据生成逻辑。
- bootstrap 或环境校验失败时，必须在生成 MQTT 密码文件、修改证书、启动容器或执行最终运行时检查前退出。
- 输出只能包含变量名、错误类别和下一步动作，不得打印密钥值、密码、许可证或完整敏感配置行。
- 不修改真实 `docker/.env`，不生成生产 TLS/MQTT 证书，不伪造许可证、租户 UUID、域名或外部服务凭据。

## 具体改动文件

- 修改 `docker/setup.sh`：增加参数解析、显式 bootstrap 调用和 fail-closed 错误提示。
- 修改 `docker/bootstrap-production-secrets.sh`：保留现有安全写入逻辑，增加脱敏、按类别组织的整改提示，并明确 bootstrap 后仍需执行的生产专属步骤。
- 修改 `tests/scripts/production-scripts-test.sh`：增加 setup 参数契约、调用顺序、输出脱敏和模板/校验器一致性测试，并接入 `setup` 与 `all` 分组。
- 修改 `docs/DEPLOY.md`：把推荐流程统一为 `setup.sh --bootstrap-local-secrets`，说明默认不自动改写、同值重复键修复和失败处置。
- 修改 `docs/environment-variables.md`：按“本机可生成”和“必须外部提供”划分变量，并记录 bootstrap 的安全边界。
- 修改 `docs/OPS_RUNBOOK.md`：增加初始化失败分类、整改命令和上线前复验顺序。
- 不修改 `.env.example`，除非契约测试证明模板缺少校验器要求的键；当前模板应覆盖校验器的必填键。

## 实施步骤

### 1. 先补充失败契约测试

在 `tests/scripts/production-scripts-test.sh` 中增加以下测试，并在现有 `setup`、`all` 分支中注册：

1. `test_setup_rejects_repair_without_bootstrap`：仅传入 `--repair-identical-duplicates` 时返回参数错误，不创建或修改 `.env`。
2. `test_setup_bootstraps_local_secrets_when_explicit`：使用临时目录和可记录参数的 bootstrap 替身，确认 `setup.sh --bootstrap-local-secrets` 在环境校验前调用 bootstrap，bootstrap 非零时立即停止，且未触发证书、Mosquitto 密码文件或 Docker 后续动作。
3. `test_bootstrap_reports_redacted_remediation_categories`：在临时副本上触发本地凭据、重复键和生产专属配置问题，确认输出包含“本机随机凭据”“重复键”“外部生产配置”“TLS/MQTT”等整改类别，但不包含生成的密钥值。
4. `test_production_env_template_matches_validator_required_keys`：从 `validate-env.sh` 的 `REQUIRED_ENV_VARS` 与 `.env.example` 中提取键名，验证模板覆盖所有生产必填键，避免校验器和模板逐步漂移。

测试必须使用临时目录和现有脚本副本，不读取或写入真实 `docker/.env`，并继续验证失败时文件内容不变、权限为 `600`、锁目录被清理。

### 2. 实现 `setup.sh` 的显式初始化入口

在 `docker/setup.sh` 顶部增加 `--help`、`--bootstrap-local-secrets` 和 `--repair-identical-duplicates` 参数解析；未知参数返回非零。解析结果必须在创建 `.env` 前确定，避免错误参数造成半初始化状态。

在 `.env` 创建/权限收紧后、读取 `ASPNETCORE_ENVIRONMENT` 和首次 `validate-env.sh` 之前：

- 组装 `--env-file "${ENV_FILE}"` 参数调用同目录 bootstrap 脚本。
- 按需追加 `--repair-identical-duplicates`。
- bootstrap 返回非零时打印不含敏感值的失败原因并立即退出。
- 未传 `--bootstrap-local-secrets` 时不自动修改已有 `.env`，但保留现有校验和建议命令。

保持现有 Production 检查、证书检查、Mosquitto 密码配置、必需文件检查和最终 `--check-runtime-files` 顺序；bootstrap 不能绕过任何现有门禁。

### 3. 增强 bootstrap 的脱敏整改提示

在 `docker/bootstrap-production-secrets.sh` 的最终校验处捕获校验器输出和退出码，原样转发已确认不含值的变量名/错误类别后，追加固定的整改提示：

- 本机随机凭据：提示重新使用 `setup.sh --bootstrap-local-secrets` 或直接运行 bootstrap。
- 重复键：同值重复键可显式使用 `--repair-identical-duplicates`，冲突值必须人工清理。
- 外部生产配置：提示许可证、真实租户、域名、SMTP、LLM、OTLP 等必须由部署方或密钥管理系统提供。
- TLS/MQTT：提示预置正式证书、私钥和 CA 链，并重新运行运行时门禁。
- Docker/Compose/运行时文件：提示检查依赖和文件权限后重新执行 `setup.sh`/`production-readiness.sh`。

不得通过 `env`、`set -x`、完整 `.env` 输出或命令参数暴露任何生成值。已有原子替换、锁、重复键和符号链接保护保持不变。

### 4. 更新生产部署与运维文档

在 `docs/DEPLOY.md` 记录推荐命令、参数组合、失败时的分类处理和“初始化成功不等于可以上线”的边界；保留直接运行 bootstrap 的高级用法，但明确其不会配置外部生产项。

在 `docs/environment-variables.md` 增加变量分类表：本机可生成的随机凭据、必须由外部系统提供的凭据/身份/域名、必须预置的证书；说明生成后的 `.env` 应导入密钥管理系统，日志不应记录值。

在 `docs/OPS_RUNBOOK.md` 增加初始化失败处置流程：先运行只读 readiness，再按错误类别修复，最后按 `validate-env.sh --check-runtime-files`、Compose preflight 和运行时健康检查顺序复验。

### 5. 分层验证

完成实现后依次执行：

```bash
bash -n docker/setup.sh docker/bootstrap-production-secrets.sh docker/validate-env.sh
bash tests/scripts/production-scripts-test.sh setup
bash tests/scripts/production-scripts-test.sh all
git diff --check
```

随后复核工作区变更，确认没有真实 `.env`、证书、临时锁目录、密钥日志或无关源码改动。由于本次只改生产脚本和文档，后端/前端既有测试作为整体回归门禁继续保留，不因脚本测试通过而宣称已经完成真实域名、证书、外部 SMTP/OTLP、镜像发布和生产演练验收。

## 验收标准

- `setup.sh --bootstrap-local-secrets` 能在临时测试中调用 bootstrap；失败时不进入后续运行时动作。
- 默认 `setup.sh` 不会自动改写用户已有 `.env`。
- 同值重复键只有显式修复参数才会归一化；冲突重复键在任何模式下都不会自动覆盖。
- bootstrap 输出始终脱敏，测试捕获不到生成的随机值。
- `.env.example` 覆盖校验器要求的所有生产必填键。
- 脚本语法、生产脚本全量契约测试和 `git diff --check` 通过。
- 文档明确区分“本机凭据初始化完成”和“生产环境具备上线资格”。
