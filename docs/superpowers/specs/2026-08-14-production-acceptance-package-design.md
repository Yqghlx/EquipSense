# 生产发布验收包设计

## 背景

EquipSense 已经拥有多个相互独立的生产检查入口：环境与证书校验、Compose 只读 readiness、Production runtime smoke、备份恢复实演、滚动部署和回滚。但这些入口的结果仍分散在不同脚本和日志中，无法形成单一、可留档、可被 CI 与部署主机共同消费的发布结论。

当前工作区已经证明代码侧门禁可以通过，但 `docker/.env` 仍有 27 个真实发布问题。新的验收包必须保留这个区别：隔离 CI 可以验证可复现的代码和运行时契约；生产 profile 必须对真实凭据、证书和外部服务缺失保持阻断，不能用隔离凭据伪造上线通过。

## 目标

新增一个只读的统一验收入口，编排已有检查并输出脱敏的机器可读报告和人工摘要：

1. 在不启动、重启、拉取或删除生产服务的前提下，统一执行静态配置、运行态、制品和外部依赖检查。
2. 明确区分 `PASS`、`FAIL`、`BLOCKED` 和 `SKIPPED`，以退出码阻止误发布。
3. 让 CI、部署主机和运维人员使用同一套检查 ID、状态语义和报告格式。
4. 报告中不得出现密码、令牌、私钥、连接串凭据或 Compose 展开后的敏感值。

## 非目标

- 不由验收入口执行 `docker compose up/down/pull/build/exec`，不改变生产运行态。
- 不在仓库中生成或保存真实生产凭据、正式证书、许可证或外部服务密钥。
- 不把现场 PLC/OPC UA/Modbus、SMTP 到达率、正式 OTLP 存储和容量基线伪装成隔离测试通过。
- 不替换现有 `production-runtime-smoke.sh`、`backup-restore-rehearsal.sh` 或 `deploy-production.sh`；统一入口只编排并复用它们已有的契约。

## 设计

### 1. 入口与 profile

新增 `docker/production-acceptance.sh`，参数如下：

```text
production-acceptance.sh
  --profile isolated-ci|production
  --env-file <路径>
    [--compose-file <路径>]...
    [--runtime-dir <目录>]
    [--evidence-dir <目录>]
    [--output-dir <目录>]
    [--runtime]
```

- `isolated-ci`：验证仓库可控制的静态、Compose、运行态和报告契约；外部真实服务检查为 `SKIPPED`，不伪造为 `PASS`。
- `production`：所有适用的外部检查均为必需项；缺少真实配置、无法连通或无法提供证据时为 `BLOCKED`，已有明确错误时为 `FAIL`。
- `--runtime` 只读取当前服务状态，复用 `production-readiness.sh --runtime`；未传入时不访问 Docker 服务状态。
- `--runtime-dir` 指定 `validate-env.sh`、`production-readiness.sh` 和直接挂载运行时文件所在目录，默认使用入口脚本所在的 `docker` 目录；该目录及入口文件必须拒绝符号链接。这样隔离 smoke 可以在临时运行时目录中复用同一验收逻辑。
- `--evidence-dir` 可选指定外部验收证据目录。生产 profile 的 SMTP、OTLP、MQTT 和启用的集成只有在对应的 `<check_id>.pass` 文件通过安全边界、内容和 24 小时新鲜度检查后才记录为 `PASS`；缺少或过期证据仍为 `BLOCKED`。证据文件只允许包含 `status=PASS` 和 `observed_at=<UTC 时间>` 等非敏感元数据。
- 备份恢复不由统一入口调用；`data.backup-restore` 固定记录为 `SKIPPED`，并指向独立的 `tests/backup-restore-rehearsal.sh` 或生产运维演练，避免只读验收入口间接触发 Docker 状态变更。

入口必须拒绝符号链接环境文件、Compose 文件、校验器入口和输出目录；不 source `.env`，不把秘密作为命令行参数传递。

### 2. 检查分层

每个检查拥有稳定的 ID、类别、必需性和证据摘要：

| 检查 ID | 内容 | `isolated-ci` | `production` |
|---|---|---:|---:|
| `static.env` | `validate-env.sh --check-runtime-files` | 必需 | 必需 |
| `static.compose` | 最终 Compose 配置可解析且文件边界安全 | 必需 | 必需 |
| `runtime.services` | 当前服务状态与健康检查 | 传入 `--runtime` 时必需 | 必需 |
| `artifact.images` | 应用镜像 tag/digest 与 Compose 目标一致 | 必需 | 必需 |
| `data.backup-restore` | 独立备份恢复实演 | `SKIPPED`，由独立 CI job 执行 | `SKIPPED`，必须使用独立生产演练 |
| `external.smtp` | SMTP 配置、TLS 和可选探测证据 | `SKIPPED` | `EMAIL_DELIVERY_ENABLED=false` 时 `SKIPPED`，否则必需 |
| `external.otel` | OTLP 端点配置与可达性证据 | `SKIPPED` | 必需 |
| `external.mqtt` | MQTT TLS/CA/服务端证书和可达性证据 | 已由静态门禁覆盖 | 必需 |
| `external.integrations` | 钉钉、飞书、EAM/Webhook 的显式验收证据 | `SKIPPED` | 配置启用时必需 |

外部探测不在统一入口中执行网络写入或长时间重试；SMTP、OTLP、MQTT 和集成的探测由独立探测器、人工验收或受控运维流水线生成证据。统一入口只验证已注入配置的非敏感形态、证据文件的安全格式和 24 小时新鲜度，不把证据内容当作秘密配置。探测结果只记录端点主机、协议、HTTP/MQTT 状态码或错误类别，不记录 URL 查询参数、认证头和响应正文。

### 3. 报告与退出码

`--output-dir` 默认使用临时目录；显式输出目录必须是非符号链接且权限为 `700`。入口生成：

- `checks.tsv`：标题行固定为 `check_id\tcategory\trequired\tstatus\tevidence`，供 CI、脚本和审计系统读取。
- `summary.md`：面向运维人员的脱敏摘要，包含 profile、时间、版本标识、通过/失败/阻断/跳过数量和逐项结论。

退出码固定为：

- `0`：所有必需检查为 `PASS`，允许进入下一发布阶段。
- `1`：至少一个必需检查为 `FAIL`，表示存在已确认的错误。
- `2`：没有 `FAIL`，但至少一个必需检查为 `BLOCKED`，表示缺少外部条件或证据。
- `3`：参数、文件边界或运行环境错误，无法完成验收。

检查函数必须先写入临时报告，再以 `mv` 原子替换最终文件；中断时删除临时文件。所有子命令输出经过捕获和敏感值脱敏后才可写入报告或终端。

### 4. CI 与部署集成

- CI 的 Production smoke 完成后运行 `production-acceptance.sh --profile isolated-ci --runtime`，上传 `checks.tsv` 与 `summary.md` artifact。
- main/latest 与版本 tag 的发布 job 必须等待验收 job；验收 job 失败或报告缺失时不得扫描、推送或创建 Release。
- 生产部署主机在 `deploy-production.sh` 变更运行态前运行 `--profile production --runtime`，并通过 `PRODUCTION_ACCEPTANCE_EVIDENCE_DIR` 指向本次发布的外部证据目录；`BLOCKED` 和 `FAIL` 都阻止变更。
- 现有部署脚本继续负责变更、健康检查和回滚；验收包不改变其副作用边界。

## 错误处理与安全边界

- 任何未知 profile、重复参数、相对不安全路径、符号链接、缺少必需文件或不存在的依赖命令返回退出码 3。
- 子检查非零退出统一映射为 `FAIL`，但命令不存在、外部凭据缺失和未提供证据映射为 `BLOCKED`。
- 只允许显式白名单变量进入恢复或探测环境；未知环境变量不复制。
- 报告中只允许出现检查 ID、服务名、文件基名、非敏感配置键和脱敏错误类别。

## 验收标准

1. 真实工作区的 27 项生产配置问题会使 `production` profile 返回退出码 2 或 1，并明确列出检查 ID，不泄露秘密。
2. 合法的隔离临时 Compose 环境可使 `isolated-ci --runtime` 通过，外部检查显示 `SKIPPED` 而不是虚假的 `PASS`。
3. 模拟静态校验失败、Compose 解析失败、服务不健康、输出目录符号链接和外部证据缺失/过期，均能得到稳定的检查状态和预期退出码。
4. `checks.tsv` 具有固定列顺序、原子生成、正确 TSV 转义；`summary.md` 不含测试凭据、私钥、Token、查询参数或响应正文。
5. CI 质量门禁、生产脚本契约测试、Shell 语法检查和文档命令均通过；现有 runtime smoke、备份恢复、E2E 和部署回滚行为不回归。

## 影响文件

- 新增：`docker/production-acceptance.sh`
- 修改：`tests/scripts/production-scripts-test.sh`
- 修改：`.github/workflows/ci.yml`
- 修改：`docker/deploy-production.sh`
- 修改：`docs/DEPLOY.md`、`docs/OPS_RUNBOOK.md`、`docs/LANDING_READINESS_REPORT.md`
