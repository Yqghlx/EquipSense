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

生产 Docker Compose 使用 8883/TLS，并要求 `MQTT_USERNAME`、`MQTT_PASSWORD` 显式配置；开发 Compose 仍使用 1883 明文。

## 生产种子账户

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `SEED_ADMIN_PASSWORD` | 系统管理员初始密码 | — | 生产环境必填 |
| `SEED_LEAD_PASSWORD` | 维保主管初始密码 | — | 生产环境必填 |
| `SEED_TECH_PASSWORD` | 技术员初始密码 | — | 生产环境必填 |
| `SEED_OPERATOR_PASSWORD` | 操作员初始密码 | — | 生产环境必填 |
| `SEED_VIEWER_PASSWORD` | 观察者初始密码 | — | 生产环境必填 |
| `SEED_TENANT2_ACCOUNT` | 是否创建测试用第二租户账户 | `false` | 否 |
| `SEED_TENANT2_PASSWORD` | 第二租户测试账户密码 | — | 启用第二租户账户时必填 |

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

Docker 生产环境默认使用本地文件系统和 `attachments_data` 命名卷；跨主机部署应替换为 S3/MinIO 等共享对象存储实现。

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `FileStorage__BasePath` / `FILE_STORAGE_BASE_PATH` | 工单附件物理存储目录；Docker 中必须与卷挂载点一致 | `/app/uploads` | 否 |

## 备份

`docker/backup.sh` 默认备份 PostgreSQL 和工单附件；Redis 为可选缓存备份。跨主机部署时应将备份目录同步到 S3/OSS，并定期执行恢复演练。

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `BACKUP_DIR` | 备份文件输出目录 | `./backups` | 否 |
| `RETAIN_DAYS` | 本地备份保留天数 | `7` | 否 |
| `BACKUP_ATTACHMENTS` | 是否归档后端 `/app/uploads` 工单附件 | `true` | 生产建议保持 `true` |
| `ATTACHMENTS_CONTAINER` | 附件所在容器名 | `equipai-backend` | 否 |
| `ATTACHMENTS_PATH` | 容器内附件目录 | `/app/uploads` | 否 |
| `BACKUP_REDIS` | 是否备份 Redis RDB | `true` | 否 |
| `S3_SYNC` / `S3_BUCKET` | 是否将备份同步到 S3/OSS 及目标桶；开启后缺少目标、aws-cli 或同步失败都会让备份返回非零 | `false` / — | 异地备份时必填 |

生产 Compose 的端口绑定默认遵循最小暴露原则：`INTERNAL_BIND_ADDRESS=127.0.0.1`
仅允许本机访问 PostgreSQL、Redis、RabbitMQ、后端和可观测性面板；
`PUBLIC_BIND_ADDRESS=0.0.0.0` 用于前端、MQTT 和蓝绿 router。若由外部负载均衡器统一对外，
可将 `PUBLIC_BIND_ADDRESS` 也设为 `127.0.0.1`，不要直接把内部服务改为公网监听。

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
| `GATEWAY_ALLOWED_HOSTS` | 后端代理网关状态/连接测试的精确主机白名单，多主机逗号分隔 | `edgegateway`（Docker） | 使用网关时必填 |
| `Gateway__DefaultGatewayId` | 默认网关标识 | `gateway-001` | 否 |
| `Gateway__HealthPort` | 网关健康端点端口 | `8081` | 否 |
| `Gateway__Host` | 网关主机地址 | `localhost` | 否 |

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

## 限流与调试

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `DISABLE_RATE_LIMITING` | 禁用 API 限流（测试环境用） | `false` | 否 |
| `ASPNETCORE_ENVIRONMENT` | 运行环境 | `Production` | 否 |
| `ASPNETCORE_URLS` | 监听地址 | `http://0.0.0.0:8080` | 否 |

## 边缘网关（EquipAI.EdgeGateway）

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `Gateway__Id` | 网关唯一标识 | `gateway-001` | 否 |
| `Gateway__TenantId` | 所属租户 ID | — | 是 |
| `Gateway__BackendUrl` | 后端 API 地址 | `http://localhost:8080` | 是 |
| `Gateway__RequireHttps` | 强制后端 API 走 HTTPS（AuthKey 经 `X-Gateway-Auth-Key` 头明文传输，HTTP 下会泄露密钥） | `false` | 网关独立部署（跨网络访问后端）时必填 `true`；Docker Compose 内网（容器间通信）可保持 `false` |
| `Gateway__MqttBroker` | MQTT Broker 地址 | `localhost:1883` | 否 |
| `Gateway__MqttUseTls` | 是否启用 MQTT TLS | `false` | 生产环境必填为 `true` |
| `Gateway__MqttAllowUntrustedCertificates` | 是否忽略服务端证书校验 | `false` | 生产环境必须为 `false` |
| `Gateway__MqttCaCertificatePath` | 自定义 CA 证书路径 | — | 否（未配置时使用系统信任链） |
| `Gateway__MqttUsername` | MQTT 用户名 | — | 生产环境必填 |
| `Gateway__MqttPassword` | MQTT 密码 | — | 生产环境必填 |
| `Gateway__UploadIntervalSeconds` | 数据上传间隔（秒） | `5` | 否 |
| `Gateway__BufferSize` | 内存队列容量 | `10000` | 否 |
| `Gateway__OpcUaSecurityMode` | OPC UA 安全模式（None/Sign/SignAndEncrypt） | `None` | 否 |
| `Gateway__OpcUaClientCertificatePath` | OPC UA 客户端证书路径（PFX） | — | 否 |
| `Gateway__OpcUaClientCertificatePassword` | 客户端证书密码 | — | 否 |
| `Gateway__OpcUaTrustedCertificatesPath` | 受信任服务器证书目录 | `certificates/trusted` | 否 |
