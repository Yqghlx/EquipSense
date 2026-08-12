# 环境变量说明

EquipSense 后端通过环境变量或 `appsettings.json` 配置运行参数。Docker 部署时优先使用环境变量（`docker/.env` 文件）。

本地开发配置中的数据库、JWT 和网关密钥仅保留占位符。请使用 `dotnet user-secrets` 或环境变量注入真实值，避免把凭据写入仓库；生产 Docker 部署必须使用 `docker/.env` 中的强随机值。

## 数据库

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `ConnectionStrings__Default` | PostgreSQL 连接字符串（读写主库） | 无（本地开发使用 User Secrets） | 是 |
| `ConnectionStrings__ReadOnly` | PostgreSQL 只读副本连接串（CQRS 读路径）。未配置或等于 Default 时退化为单库（只读上下文指向主库，行为零变化）。配置独立副本后纯读 QueryService（遥测、分析）路由到此库 | 同 Default | 否 |
| `READONLY_DB_HOST` | docker-compose 中只读副本的主机（覆盖 ReadOnly 连接的 Host） | `postgres`（同主库） | 否 |
| `READONLY_DB_PORT` | docker-compose 中只读副本的端口 | `5432`（同主库） | 否 |
| `PG_PASSWORD` | Docker 部署中的 PostgreSQL 密码 | — | Docker 部署必填 |
| `DEV_PG_PASSWORD` | 开发 Compose 中 PostgreSQL 密码 | 无 | 开发 Compose 必填 |

## 认证

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `Jwt__Secret` | JWT 签名密钥（≥32 字符） | — | 是 |
| `Jwt__Issuer` | JWT 签发者 | `EquipAI` | 否 |
| `Jwt__Audience` | JWT 受众 | `EquipAI` | 否 |
| `Jwt__AccessTokenExpirationMinutes` | 访问令牌有效期（分钟） | `120` | 否 |

TOTP 密钥使用 AES-256-GCM 加密后写入数据库。生产环境必须注入稳定的外部密钥；密钥丢失会导致已保存的 MFA 密钥无法解密，密钥轮换必须配套停机窗口、重新加密和回滚方案：

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `TOTP_ENCRYPTION_KEY` / `Security__TotpEncryptionKey` | Base64 编码的 32 字节 AES-256 密钥；通过密钥管理系统注入，不进入镜像或数据库备份 | — | 生产环境必填 |

生成示例：

```bash
openssl rand -base64 32
```

用户邮箱和手机号使用独立的 AES-256-GCM 密钥加密写入 `users` 表，同时保存字段级 HMAC-SHA256 盲索引供等值查找。生产环境必须注入稳定的 PII 密钥；应用会在数据库迁移完成后先将历史明文联系方式原子迁移为密文，再执行种子初始化。密钥丢失会导致联系方式无法解密，轮换前必须设计批量重新加密和回滚方案；该密钥不能与 TOTP、JWT 或基础设施凭据复用：

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `PII_ENCRYPTION_KEY` / `Security__PiiEncryptionKey` | Base64 编码的 32 字节 AES-256-GCM 用户联系方式密钥；通过密钥管理系统注入，不进入镜像或数据库备份 | — | 生产环境必填 |

开发/测试环境在未配置时使用固定的开发专用后备密钥；Production 会在应用启动和部署脚本两处拒绝缺失、非法 Base64 或非 32 字节密钥。数据库中保存的是 `enc:v1:` 密文和盲索引，不支持按邮箱或手机号模糊搜索。

生产环境 `appsettings.Production.json` 默认强制 `SystemAdmin` 和 `MaintenanceLead` 启用 TOTP MFA。也可以使用配置数组环境变量覆盖角色列表，但生产门禁要求这两个高权限角色都必须保留：

```bash
Security__Mfa__RequiredRoles__0=SystemAdmin
Security__Mfa__RequiredRoles__1=MaintenanceLead
```

高权限账户首次登录或公开注册后不会直接获得 JWT，而是进入 10 分钟的 MFA 注册流程；扫码并验证成功后才会建立会话，并只显示一次 8 个一次性恢复码。登录时可用恢复码代替 TOTP，普通角色仍可在“安全与 MFA”页面自助启用，强制角色不能禁用 MFA。

## 反向代理与客户端来源

生产 Compose 默认由 Nginx 终止 TLS。后端只在 `BEHIND_PROXY=true` 时处理
`X-Forwarded-For`/`X-Forwarded-Proto`，并且仅信任 `TRUSTED_PROXY_NETWORKS` 中的
CIDR 网段；这样认证限流可以按真实客户端 IP 工作，同时不会接受公网客户端伪造的来源头。

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `BEHIND_PROXY` | 是否位于反向代理之后 | `true`（Docker） | 否 |
| `TRUSTED_PROXY_NETWORKS` | 可信代理 CIDR 网段，多个网段用逗号分隔 | `172.16.0.0/12` | 使用反向代理时需按实际网络确认 |

## 证书生命周期监控

生产后端只读取公钥证书，并将 Nginx TLS、MQTT 服务端和 MQTT CA 的有效期暴露到 Prometheus。生产环境使用固定的三项容器内路径，不能通过配置覆盖到其他文件；读取器还会拒绝私钥/PFX 和符号链接。Compose 只把 Nginx `cert.pem` 单文件只读挂载到后端，不挂载私钥。

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `CERTIFICATE_MONITORING_ENABLED` / `Security__CertificateMonitoring__Enabled` | 是否启用证书有效期监控；生产默认开启，关闭只允许开发/隔离测试 | `true`（Docker Production）/ `false`（本地开发） | 生产环境必须保持 `true` |
| `CERTIFICATE_MONITORING_INTERVAL_SECONDS` / `Security__CertificateMonitoring__IntervalSeconds` | 证书文件扫描间隔，应用限制在 60 秒至 24 小时 | `300` | 否 |

指标包括 `equipai_certificate_monitoring_status`、`equipai_certificate_expiry_timestamp_seconds` 和 `equipai_certificate_days_until_expiry`；监控不可用、7 天内到期和 30 天内到期分别由 Prometheus/Alertmanager 告警。运行时监控不替代部署前的 `bash docker/validate-env.sh docker/.env --check-runtime-files`。

## 依赖许可证

项目固定使用已修复递归拒绝服务漏洞的 AutoMapper 15.1.3。AutoMapper 15+ 的生产使用需要完成许可证治理，密钥必须由供应商控制台签发并通过密钥管理系统注入；不要把密钥写进镜像、仓库或日志。应用启动门禁与 `docker/validate-env.sh` 会拒绝缺失、占位或少于 32 个字符的值。

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `AUTOMAPPER_LICENSE_KEY` / `AutoMapper__LicenseKey` | AutoMapper 15+ 供应商签发的许可证密钥 | — | 生产环境必填 |

许可证政策见 [Lucky Penny Software FAQ](https://luckypennysoftware.com/faq)，版本安全状态见 [GHSA-rvv3-g6hj-g44x](https://github.com/advisories/GHSA-rvv3-g6hj-g44x)。

## Redis

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `Redis__ConnectionString` | Redis 连接字符串 | `localhost:6379` | 否 |

## MQTT

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `Mqtt__Host` | MQTT Broker 地址 | `localhost` | 否 |
| `Mqtt__Port` | MQTT Broker 端口 | `1883` | 否 |
| `Mqtt__UseTls` | 是否启用 MQTT TLS | `false` | 生产环境必填为 `true` |
| `Mqtt__AllowUntrustedCertificates` | 是否忽略服务端证书校验 | `false` | 生产环境必须为 `false` |
| `Mqtt__CaCertificatePath` | 自定义 CA 证书路径 | — | 否（未配置时使用系统信任链） |
| `Mqtt__Username` | MQTT 用户名 | — | 生产环境必填 |
| `Mqtt__Password` | MQTT 密码 | — | 生产环境必填 |

生产 Docker Compose 使用 8883/TLS，并要求 `MQTT_USERNAME`、`MQTT_PASSWORD` 显式配置；开发 Compose 仍使用 1883 明文。生产校验器会拒绝 `MQTT_PASSWORD` 与其他基础设施密码、安全密钥或种子账户密码复用，拒绝重复环境变量和非 `Production` 运行环境，且不会在错误输出中打印凭据值。部署门禁还会校验 Nginx/MQTT 证书的格式、30 天有效期、生产叶子证书不能自签名、证书-私钥匹配关系和 MQTT CA 链；证书文件存在但为空、过期、自签名或错配时仍会阻断部署。

## 生产种子账户

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `SEED_DEMO_DATA` | 演示数据模式：`false`/`0` 关闭，`true`/`1` 为最小隔离验收种子，`full` 创建 10 台设备、遥测、告警和工单；普通 Production 必须关闭 | `false` | 否 |
| `SEED_ADMIN_PASSWORD` | 系统管理员初始密码（至少 16 个字符，不得使用占位值或公开默认值） | — | 生产环境必填 |
| `SEED_LEAD_PASSWORD` | 维保主管初始密码（至少 16 个字符，不得使用占位值或公开默认值） | — | 生产环境必填 |
| `SEED_TECH_PASSWORD` | 技术员初始密码（至少 16 个字符，不得使用占位值或公开默认值） | — | 生产环境必填 |
| `SEED_OPERATOR_PASSWORD` | 操作员初始密码（至少 16 个字符，不得使用占位值或公开默认值） | — | 生产环境必填 |
| `SEED_VIEWER_PASSWORD` | 观察者初始密码（至少 16 个字符，不得使用占位值或公开默认值，并且不能与其他生产凭据复用） | — | 生产环境必填 |
| `SEED_TENANT2_ACCOUNT` | 是否创建测试用第二租户账户 | `false` | 否 |
| `SEED_TENANT2_PASSWORD` | 第二租户测试账户密码 | — | 启用第二租户账户时必填 |

五个 `SEED_*_PASSWORD` 必须分别生成，不能在不同账户之间复用；同样不能与 PG、Redis、RabbitMQ、MQTT、Seq、Grafana、JWT、TOTP、PII 或网关认证密钥相同。`docker/validate-env.sh` 会在部署前执行这项 fail-closed 检查，并仅报告发生冲突的变量名。

隔离验收或 CI 需要覆盖第二租户时，测试进程使用 `E2E_TENANT2_PASSWORD`，其值必须与 `SEED_TENANT2_PASSWORD` 一致；该变量只注入 Playwright，不应写入生产业务环境，也不应在生产业务数据库开启 `SEED_TENANT2_ACCOUNT`。

Production 应保持 `SEED_DEMO_DATA=false`。应用对缺失、`false`、`0` 按关闭处理，`true`/`1` 和 `full` 只允许在显式隔离授权下使用；`full` 会按固定 ID 重建 10 台演示设备的最近 24 小时遥测、5 条告警和 4 张工单，重复启动不会累积数据。升级既有数据库不会自动删除历史演示数据。

## AI/LLM

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `LLM__Provider` | LLM 提供商（DashScope） | `DashScope` | 否 |
| `LLM__ApiKey` | LLM API 密钥 | — | 否（未配置时 AI 分析降级为规则匹配） |
| `LLM__Model` | LLM 模型名称 | `qwen-plus` | 否 |

## AI 评估上报

标准答案上报属于内部评估能力，生产默认关闭。开启时必须固定归属租户并使用独立 API Key，不能复用 JWT、网关或 RabbitMQ 凭证。

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `EVALUATION_ALLOW_GROUND_TRUTH_INGESTION` | 是否启用生产标准答案上报 | `false` | 否 |
| `EVALUATION_INGESTION_API_KEY` | 标准答案上报 API Key（至少 32 字符） | — | 开启时必填 |
| `EVALUATION_TENANT_ID` | 标准答案固定归属租户 ID | — | 开启时必填 |

## 出站集成安全

Webhook、钉钉、飞书和 EAM 配置会触发后端出站 HTTP 请求。应用默认拒绝回环、链路本地、云元数据和 RFC1918 私网地址；若企业 EAM 位于内网，必须由部署者显式开启，并配合网络层最小权限控制。

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `OUTBOUND_HTTP_ALLOW_PRIVATE_NETWORKS` | 是否允许租户集成访问 RFC1918/IPv6 ULA 私网地址 | `false` | 否 |

## 工单附件存储

Docker 生产环境默认使用本地文件系统和 `attachments_data` 命名卷；跨主机、多副本或 Kubernetes 部署应切换为 S3/MinIO 等共享对象存储。项目不会自动启动或创建 MinIO，启用 S3 前必须由运维准备桶、最小权限服务账号、生命周期策略和恢复演练。

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `FILE_STORAGE_PROVIDER` | 附件存储实现：`Local` / `S3`；未知值会阻止后端启动 | `Local` | 否 |
| `FileStorage__BasePath` / `FILE_STORAGE_BASE_PATH` | 工单附件物理存储目录；Docker 中必须与卷挂载点一致，Production 必须使用非根目录绝对路径 | `/app/uploads` | 否 |
| `FILE_STORAGE_S3_BUCKET` | S3 对象存储桶名称 | — | Provider=S3 时必填 |
| `FILE_STORAGE_S3_REGION` | S3 签名区域 | `us-east-1` | Provider=S3 时建议显式配置 |
| `FILE_STORAGE_S3_ENDPOINT` | 自定义 S3 兼容端点；为空时使用 AWS 标准端点 | — | 使用 MinIO/OSS 网关时必填 |
| `FILE_STORAGE_S3_ACCESS_KEY` / `FILE_STORAGE_S3_SECRET_KEY` | 对象存储访问凭据；自定义端点必须同时配置，标准 AWS 端点可使用任务角色 | — | 按端点类型 |
| `FILE_STORAGE_S3_USE_PATH_STYLE` | 是否使用路径风格地址；MinIO 通常为 `true` | `false` | 否 |
| `FILE_STORAGE_S3_KEY_PREFIX` | 对象键安全前缀，不允许绝对路径或 `..` | `attachments` | 否 |

S3 模式下，实际对象键为 `KeyPrefix/{tenantId}/{category}/{uniqueName}`。应用会校验文件扩展名、MIME 类型、20 MiB 大小上限和对象键路径；生产自定义端点必须使用 HTTPS。切换 Provider 前先迁移历史附件并完成隔离恢复演练，确认后才能移除旧的 `attachments_data` 卷。

## 备份

`docker/backup.sh` 默认备份 PostgreSQL 和工单附件；Redis 为可选缓存备份，并为每个成功批次
生成 `backup-manifest_*.tsv`，记录启用组件的文件名、大小和 SHA-256。恢复统一使用
`docker/restore.sh`：它默认只执行备份完整性校验和 dry-run，必须显式传入 `--manifest` 和
`--confirm` 才会在生产路径停止服务、覆盖数据库和附件；脚本会在副作用前拒绝串批次或被篡改的文件。
无清单的历史备份只能显式使用 `--legacy`。跨主机部署时应将备份目录同步到 S3/OSS，并定期在
隔离环境执行恢复演练、记录 RTO/RPO。

PostgreSQL 新备份使用 custom format（文件名为 `*.dump`，由容器内 `pg_restore --list`
校验），恢复时自动执行 TimescaleDB `pre_restore`/`post_restore` 生命周期；历史
`*.sql.gz` 纯文本备份仍兼容恢复。

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `BACKUP_DIR` | 备份文件输出目录 | `./backups` | 否 |
| `RETAIN_DAYS` | 本地备份保留天数 | `7` | 否 |
| `BACKUP_ATTACHMENTS` | 是否归档后端 `/app/uploads` 工单附件 | `true` | 生产建议保持 `true` |
| `ATTACHMENTS_CONTAINER` | 附件所在容器名 | `equipai-backend` | 否 |
| `ATTACHMENTS_PATH` | 容器内附件目录 | `/app/uploads` | 否 |
| `REDIS_CONTAINER` | Redis 容器名 | `equipai-redis` | 否 |
| `BACKUP_REDIS` | 是否备份 Redis RDB；开启后快照或复制失败会使备份返回非零 | `true` | 否 |
| `S3_SYNC` / `S3_BUCKET` | 是否将备份同步到 S3/OSS 及目标桶；开启后缺少目标、aws-cli 或同步失败都会让备份返回非零 | `false` / — | 异地备份时必填 |

生产 Compose 的端口绑定默认遵循最小暴露原则：`INTERNAL_BIND_ADDRESS=127.0.0.1`
仅允许本机访问 PostgreSQL、Redis、RabbitMQ、后端和可观测性面板；
`PUBLIC_BIND_ADDRESS=0.0.0.0` 用于前端、MQTT 和蓝绿 router。若由外部负载均衡器统一对外，
可将 `PUBLIC_BIND_ADDRESS` 也设为 `127.0.0.1`，不要直接把内部服务改为公网监听。
开发依赖 Compose 同样默认使用 `DEV_BIND_ADDRESS=127.0.0.1`；只有确需让局域网设备接入开发 Broker 时，才显式设置为 `0.0.0.0`。

## SMTP 邮件

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `Smtp__Host` | SMTP 服务器地址 | — | 否（未配置时跳过邮件发送） |
| `Smtp__Port` | SMTP 端口 | `587` | 否 |
| `Smtp__FromEmail` | 发件人邮箱 | — | 否 |
| `Smtp__FromName` | 发件人显示名称 | `EquipSense` | 否 |
| `Smtp__Username` | SMTP 用户名 | — | 否 |
| `Smtp__Password` | SMTP 密码 | — | 否 |
| `Smtp__EnableSsl` | 是否启用 SSL | `true` | 否 |

## Web Push 通知

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `Vapid__Subject` | VAPID 联系邮箱（mailto:xxx@xxx.com） | — | 否 |
| `Vapid__PublicKey` | VAPID 公钥 | — | 否 |
| `Vapid__PrivateKey` | VAPID 私钥 | — | 否 |

## 网关

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `Gateway__AuthKey` | 网关认证密钥 | — | 使用网关时必填 |
| `Gateway__Id` / `GATEWAY_ID` | 后端允许注册和拉取配置的唯一网关标识；生产必须与边缘网关一致 | `gateway-001` | 生产环境必填 |
| `Gateway__TenantId` / `GATEWAY_TENANT_ID` | 后端允许注册和拉取配置的唯一租户 UUID；生产必须与边缘网关一致 | — | 生产环境必填 |
| `GATEWAY_ALLOWED_HOSTS` | 后端代理网关状态/连接测试的精确主机白名单，多主机逗号分隔 | `edgegateway`（Docker） | 使用网关时必填 |
| `Gateway__DefaultGatewayId` | 默认网关标识 | `gateway-001` | 否 |
| `Gateway__HealthPort` | 网关健康端点端口 | `8081` | 否 |
| `Gateway__Host` | 网关主机地址 | `localhost` | 否 |
| `Gateway__BackendUrl` / `GATEWAY_BACKEND_URL` | 网关上传目标后端；蓝绿部署由编排脚本临时切到目标颜色；Production 必须是不带用户信息的绝对 `http://`/`https://` 地址 | `http://backend:8080` | 否 |
| `EDGE_BLUEGREEN_PORT` | 蓝绿部署边缘网关健康探针宿主端口 | `18081` | 否 |

## 认证响应

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `AUTH_MACHINE_API_KEY` | 机器客户端读取登录/刷新响应体 JWT 所需的独立 API Key；浏览器不需要，生产配置时至少 32 位可打印 ASCII，不能复用其他凭据 | — | 机器客户端需要响应体令牌时必填 |

## 事件总线

Production 默认 RabbitMQ；Development 和 Testing 默认 InMemory。生产使用 InMemory 必须显式开启 break-glass，且进程重启会丢未处理事件。详见 [`docs/EVENT_BUS.md`](EVENT_BUS.md)。

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `EventBus__Provider` | 事件总线实现：`InMemory` / `RabbitMQ` | 开发 `InMemory`，生产 `RabbitMQ` | 否 |
| `EventBus__AllowInMemoryInProduction` | 允许生产紧急降级到进程内总线 | `false` | 否 |
| `EventBus__RabbitMq__Host` | RabbitMQ 主机 | `localhost` | Provider=RabbitMQ 时必填 |
| `EventBus__RabbitMq__Port` | RabbitMQ AMQP 端口 | `5672` | 否 |
| `EventBus__RabbitMq__ConnectionTimeoutSeconds` | 初始连接超时（秒） | `10` | 否 |
| `EventBus__RabbitMq__Username` | RabbitMQ 用户名；生产禁止 guest | `guest` | Provider=RabbitMQ 时必填 |
| `EventBus__RabbitMq__Password` | RabbitMQ 密码；生产至少 16 字符且禁止 guest | `guest` | Provider=RabbitMQ 时必填 |
| `EventBus__RabbitMq__MaxRetryCount` | 最大重试次数（含首次） | `5` | 否 |
| `EventBus__RabbitMq__RetryIntervalSeconds` | 重试间隔（秒） | `30` | 否 |
| `EventBus__Outbox__Enabled` | 启用事务 Outbox 后台分发器 | `true` | 生产必须保持开启 |
| `EventBus__Outbox__PollIntervalSeconds` | Outbox 轮询间隔（秒） | `1` | 否 |
| `EventBus__Outbox__BatchSize` | 每轮最多分发的消息数 | `50` | 否 |
| `EventBus__Outbox__LeaseSeconds` | 单条消息分发租约（秒） | `60` | 否 |
| `EventBus__Outbox__MaxBackoffSeconds` | 发布失败最大退避（秒） | `300` | 否 |
| `EventBus__Outbox__RetentionDays` | 已发布 Outbox 保留天数 | `7` | 否 |
| `RABBITMQ_PASSWORD` | docker-compose RabbitMQ 服务密码（服务始终启动，禁止使用公开默认值） | — | Docker 生产必填 |
| `RABBITMQ_IMAGE` | RabbitMQ 带 digest 的精确镜像引用 | 无默认值 | Docker 生产必填 |
| `ALLOW_INMEMORY_EVENTBUS_IN_PRODUCTION` | Compose 生产紧急降级开关 | `false` | 否 |
| `RABBITMQ_USER` | docker-compose rabbitmq 服务默认用户 | `equipai` | 否 |
| `SEQ_ADMIN_PASSWORD` | Seq 管理员密码 | — | Docker 生产必填 |
| `GRAFANA_PASSWORD` | Grafana 管理员密码 | — | Docker 生产必填 |
| `ALERT_WEBHOOK_URL` | Alertmanager 外部告警接收地址；为空时告警仅保留在 Alertmanager/Grafana | — | 否 |
| `JAEGER_SPAN_STORAGE_TYPE` | Jaeger trace 存储类型；单机生产默认 `badger`，多副本可切换外部存储 | `badger` | 否 |
| `JAEGER_BADGER_EPHEMERAL` | 是否使用临时 Badger 存储；生产必须为 `false` | `false` | 否 |

## 限流与调试

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `RATE_LIMITING_PERMIT_LIMIT` | 普通 API 在时间窗口内的请求额度 | `60` | 否 |
| `RATE_LIMITING_AUTH_PERMIT_LIMIT` | 登录、注册等认证 API 在时间窗口内的请求额度 | `10` | 否 |
| `RATE_LIMITING_TENANT_PERMIT_LIMIT` | 单租户所有 API 在时间窗口内的总请求额度 | `1000` | 否 |
| `RATE_LIMITING_WINDOW` | 限流时间窗口，格式为 `hh:mm:ss` | `00:01:00` | 否 |
| `DISABLE_RATE_LIMITING` | 仅 Testing/本地调试环境可禁用 API 限流；Production 会强制忽略该变量 | `false` | 否 |
| `ASPNETCORE_ENVIRONMENT` | 运行环境 | `Production` | 否 |
| `ASPNETCORE_URLS` | 监听地址 | `http://0.0.0.0:8080` | 否 |

生产镜像始终启用限流；隔离 Production E2E 只会在临时 Compose 环境把三个额度调高，避免并行
验收请求被误判为暴力破解，限流中间件本身仍然运行。生产环境不得通过环境变量关闭限流。

## 边缘网关（EquipAI.EdgeGateway）

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `Gateway__Id` | 网关唯一标识 | `gateway-001` | 否 |
| `Gateway__TenantId` | 所属租户 ID | — | 是 |
| `Gateway__BackendUrl` | 后端 API 地址 | `http://localhost:8080` | 是 |
| `Gateway__BufferPath` | SQLite 断网缓冲数据库路径；Docker 生产必须指向 `/data` 持久化卷 | `data/buffer.db`（开发） | 生产环境必须为绝对路径 |
| `Gateway__UseLocalDeviceConfigFallback` | 后端配置不可达时是否回退到镜像内 `appsettings.json` 设备列表 | `true`（开发）/ `false`（生产） | 生产环境必须为 `false` |
| `Gateway__RequireHttps` | 强制后端 API 走 HTTPS（AuthKey 经 `X-Gateway-Auth-Key` 头明文传输，HTTP 下会泄露密钥） | `false` | 网关独立部署（跨网络访问后端）时必填 `true`；Docker Compose 内网（容器间通信）可保持 `false` |
| `Gateway__MqttBroker` | MQTT Broker 地址（`host[:port]`；Production 端口必须为 1-65535 的数字） | `localhost:1883` | 否 |
| `Gateway__MqttUseTls` | 是否启用 MQTT TLS | `false` | 生产环境必填为 `true` |
| `Gateway__MqttAllowUntrustedCertificates` | 是否忽略服务端证书校验 | `false` | 生产环境必须为 `false` |
| `Gateway__MqttCaCertificatePath` | 自定义 CA 证书路径 | — | 否（未配置时使用系统信任链） |
| `Gateway__MqttUsername` | MQTT 用户名 | — | 生产环境必填 |
| `Gateway__MqttPassword` | MQTT 密码 | — | 生产环境必填 |
| `Gateway__UploadIntervalSeconds` | 数据上传间隔（秒） | `5` | 否 |
| `Gateway__BufferSize` | 内存队列容量 | `10000` | 否 |
| `Gateway__OpcUaSecurityMode` | OPC UA 安全模式（None/Sign/SignAndEncrypt） | `None` | 否 |
| `Gateway__AllowInsecureOpcUa` | 是否显式允许 OPC UA None 明文模式；仅供完成网络隔离和风险评估后的旧设备兼容 | `true`（开发）/ `false`（生产） | 生产环境默认必须为 `false` |
| `Gateway__OpcUaClientCertificatePath` | OPC UA 客户端证书路径（PFX） | — | 否 |
| `Gateway__OpcUaClientCertificatePassword` | 客户端证书密码 | — | 否 |
| `Gateway__OpcUaTrustedCertificatesPath` | 受信任服务器证书目录 | `certificates/trusted` | 否 |

生产环境还会统一注入 `DOTNET_ENVIRONMENT=Production`，并在启动时校验租户 UUID、网关认证密钥和 SQLite 绝对路径；缺失配置会以非零退出码结束进程，交给容器编排系统重启和告警。
