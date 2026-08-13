# 生产环境模板漂移安全同步设计

## 背景

当前 `docker/bootstrap-production-secrets.sh` 能够安全生成本机随机凭据，但不会把历史 `.env` 中缺失的非秘密生产默认项补回模板基线。实测当前工作区的 `docker/.env` 只有 49 个非空配置键，而 `docker/.env.example` 有 89 个；同时存在 `ASPNETCORE_ENVIRONMENT`、`JWT_SECRET`、`REDIS_PASSWORD` 和 `MQTT_PORT` 四组重复定义，生产门禁共报告 27 项错误。

这类配置漂移不能通过“取最后一项”或自动覆盖解决：旧值可能是有意配置，秘密值不能从模板复制，冲突值必须由部署者依据密钥管理记录处理。但固定的 RabbitMQ 镜像 digest、Production 环境标识、事件总线和运行时默认值等非秘密配置可以在显式授权下安全追加，从而减少人工漏配。

## 目标

1. 为生产初始化提供显式的模板默认值同步入口，降低旧 `.env` 升级和首次部署的漏配概率。
2. 只追加经过代码白名单确认的非秘密、非租户、非域名、非外部凭据默认值。
3. 保留当前原子替换、目录锁、`600` 权限、符号链接拒绝、重复键 fail-closed 和日志脱敏边界。
4. 同步完成后继续生成本机随机凭据并运行现有环境门禁；不降低 Production、TLS/MQTT、许可证和外部服务校验要求。
5. 让部署者能够区分“模板默认值已同步”“本机凭据已生成”和“生产环境已具备上线资格”。

## 非目标

- 不读取、生成或覆盖密码、JWT、TOTP、PII、网关密钥、API Key、许可证、真实租户 UUID、SMTP/LLM 凭据或 VAPID 私钥。
- 不自动修复已有键的空值、占位值、非法值或冲突重复定义；这些仍由现有 `validate-env.sh` 报告并要求人工处理。
- 不自动修改 `DOMAIN`、`FRONTEND_URL`、TLS/MQTT 证书、证书路径或任何与真实域名/证书绑定的配置。
- 不修改真实 `docker/.env`、不启动/重启容器、不执行 Compose `config` 以外的外部动作。
- 不新建独立的 `.env` 解析/原子写入实现；复用现有 bootstrap 的安全写入路径。

## 方案比较

### 方案 A：在现有 bootstrap 中增加显式模板同步（采用）

新增 `--sync-template-defaults` 参数，`setup.sh` 接受同名选项并将其传给现有 bootstrap。同步和随机凭据生成共享同一个锁、临时文件和原子替换流程；没有该参数时行为完全不变。

优点是安全边界集中、回滚语义简单、不会出现两个脚本分别修改同一 `.env` 的竞态。代价是 bootstrap 脚本职责略有扩大，需要维护一份小型非秘密白名单。

### 方案 B：新建独立模板迁移脚本

将同步逻辑拆成 `sync-env-template.sh`，由 `setup.sh` 串联调用。

优点是职责名称直观；但需要重复实现或共享锁/重复键/原子替换逻辑，两个写入器的调用顺序和失败恢复更容易出现差异，故不采用。

### 方案 C：只读漂移报告

仅报告缺失键并要求人工从模板复制。

优点是几乎没有写入风险；但当前问题的实际痛点正是升级时手工漏项，无法实质降低部署错误率，作为辅助报告保留在现有门禁中，不作为主方案。

## 详细设计

### 命令接口

`docker/setup.sh` 支持：

```bash
# 只生成本机随机凭据（既有行为）
./setup.sh --bootstrap-local-secrets

# 同步白名单非秘密默认值，并生成本机随机凭据
./setup.sh --sync-template-defaults

# 两项显式组合；同值重复键才允许额外归一化
./setup.sh --sync-template-defaults --repair-identical-duplicates
```

`--sync-template-defaults` 是一个明确的配置写入授权，会同时进入 bootstrap 流程；它不会在用户未明确选择时隐式运行。`--repair-identical-duplicates` 仍只能与 `--bootstrap-local-secrets` 或 `--sync-template-defaults` 一起使用。

底层 `bootstrap-production-secrets.sh` 增加同名参数，直接调用时也执行模板同步和本地凭据生成。`--help`、未知参数和非法参数组合必须在任何 `.env` 写入前返回非零。

### 非秘密默认值白名单

同步器只处理代码中显式列出的键，并从同目录 `.env.example` 读取其值。第一版白名单限于生产 Compose 解析和安全默认行为所需的非秘密配置：

- 运行环境和事件总线：`ASPNETCORE_ENVIRONMENT`、`EVENTBUS_PROVIDER`、`ALLOW_INMEMORY_EVENTBUS_IN_PRODUCTION`、`EVENTBUS_OUTBOX_*`。
- RabbitMQ 非秘密运行参数：`RABBITMQ_IMAGE`、`RABBITMQ_USER`、`RABBITMQ_PORT`、`RABBITMQ_MGMT_PORT`。
- 边缘网关/应用运行参数：`GATEWAY_ID`、`GATEWAY_BUFFER_PATH`、`GATEWAY_BACKEND_URL`、`GATEWAY_ALLOWED_HOSTS`、`GATEWAY_UPLOAD_INTERVAL`、`EDGE_PORT`、`EDGE_BLUEGREEN_PORT`、`INTERNAL_BIND_ADDRESS`、`PUBLIC_BIND_ADDRESS`、`BACKEND_PORT`、`FRONTEND_PORT`。
- 存储、WAF 和观测默认值：`FILE_STORAGE_PROVIDER`、`FILE_STORAGE_BASE_PATH`、`WAF_RULES_PATH`、`WAF_REQUIRE_EXTERNAL_RULES`、`JAEGER_SPAN_STORAGE_TYPE`、`JAEGER_BADGER_EPHEMERAL`、`OTEL_EXPORTER_OTLP_ENDPOINT`。TLS 证书路径也属于部署绑定配置，不自动同步。
- 邮件投递行为参数（不含 SMTP 主机、用户名和密码）：`SMTP_PORT`、`SMTP_FROM_NAME`、`SMTP_ENABLE_SSL`、`EMAIL_DELIVERY_*`。
- 其它非秘密网络/功能开关：`BEHIND_PROXY`、`TRUSTED_PROXY_NETWORKS`、`OUTBOUND_HTTP_ALLOW_PRIVATE_NETWORKS`、`LLM_MODEL`、`LLM_ENDPOINT`、`SEED_DEMO_DATA`。`VAPID__SUBJECT` 虽不是密钥，但绑定部署方发件身份和域名，因此不自动同步。

白名单的契约测试必须拒绝含有 `PASSWORD`、`SECRET`、`API_KEY`、`PRIVATEKEY`、`LICENSE`、`TENANT`、`DOMAIN` 或 `FRONTEND_URL` 的键，防止未来维护者误把敏感或部署绑定值加入自动同步。

### 同步算法与安全行为

1. 参数解析完成后检查模板文件存在、不是符号链接且可读；模板解析失败在创建临时文件前退出。
2. 先使用现有重复键扫描器检查 `.env`。任何冲突重复键都拒绝；同值重复键只有显式 `--repair-identical-duplicates` 才归一化。
3. 收集模板白名单键，要求每个键在模板中恰好出现一次，且值非空、不含现有占位标记。模板契约不满足时拒绝同步，避免把错误模板传播到生产文件。
4. 逐行保留 `.env` 原内容；已有键即使为空或非法也不覆盖。只对 `.env` 中完全不存在的白名单键追加值，并记录追加的键名，不记录值。
5. 在同一个临时文件中继续执行现有本地随机凭据生成逻辑；生成值仍不写日志、不作为子进程参数传递。
6. 以 `600` 权限在同目录原子替换 `.env`，释放锁后运行 `validate-env.sh`。门禁失败仍返回非零，并输出脱敏整改分类。
7. 输出明确区分“追加了 N 个非秘密默认值”“生成了 M 个本地凭据”和“仍需人工配置”；任何外部生产项或证书问题都不能被同步成功掩盖。

### setup 调用顺序

`setup.sh --sync-template-defaults` 的顺序为：参数解析 → 创建/收紧 `.env` → 调用 bootstrap（模板同步 + 本地凭据）→ `validate-env.sh` → TLS/MQTT 文件检查 → Mosquitto 密码文件 → 最终运行时门禁。bootstrap 失败时不创建认证文件、不访问证书、不调用 Docker 后续操作。

### 错误分类

- 模板缺键、模板重复或模板含占位默认值：报告“模板基线错误”，不修改 `.env`。
- `.env` 重复键：沿用“冲突拒绝、同值重复需显式修复”策略。
- 仅缺少白名单默认项：追加后继续验证。
- 已有键非法、外部凭据缺失、域名/TLS 不匹配：保留原值并报告对应整改类别。

## 测试设计

在 `tests/scripts/production-scripts-test.sh` 增加：

1. 同步模式只追加白名单默认项，并保留许可证、租户和域名占位项不变。
2. 已存在的白名单键值不被覆盖；空值也不被自动替换。
3. 模板缺键、模板重复键和模板占位值会在 `.env` 修改前失败。
4. 白名单不得包含密码、密钥、租户、许可证、域名或外部凭据类键。
5. `setup.sh --sync-template-defaults` 会显式传递参数，bootstrap 失败时不进入证书/MQTT/Docker 后续动作。
6. 同值重复键仅在显式修复时归一化，冲突重复键在同步模式下仍保持原文件不变。
7. 生成/同步输出不包含任何随机凭据值，锁目录和临时文件在成功/失败后均清理。

## 文档变更

- `docs/DEPLOY.md`：增加模板漂移升级命令、白名单边界和失败处置。
- `docs/environment-variables.md`：解释非秘密默认值同步与敏感/部署绑定值的区别。
- `docs/OPS_RUNBOOK.md`：增加旧 `.env` 升级和冲突重复键的人工确认流程。
- `docs/LANDING_READINESS_REPORT.md` 与风险登记册：同步说明该功能只降低配置漏项，不关闭真实凭据、证书和外部服务验收项。

## 验收标准

- 没有显式参数时，bootstrap 和 setup 的既有行为不变。
- `--sync-template-defaults` 只追加白名单非秘密默认值，原有键永不覆盖。
- 所有冲突重复键、模板错误和符号链接输入均 fail-closed 且不修改 `.env`。
- 同步后仍由现有完整生产门禁决定是否可上线；实际环境必须以 0 项问题为准。
- Bash 语法、生产脚本契约全量测试、后端/前端既有质量门禁和差异检查全部通过。
