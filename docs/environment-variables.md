# 环境变量说明

EquipSense 后端通过环境变量或 `appsettings.json` 配置运行参数。Docker 部署时优先使用环境变量（`docker/.env` 文件）。

## 数据库

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `ConnectionStrings__Default` | PostgreSQL 连接字符串 | `Host=localhost;Port=5432;Database=equipai;Username=equipai;Password=...` | 是 |
| `PG_PASSWORD` | Docker 部署中的 PostgreSQL 密码 | — | Docker 部署必填 |

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
| `Gateway__DefaultGatewayId` | 默认网关标识 | `gateway-001` | 否 |
| `Gateway__HealthPort` | 网关健康端点端口 | `8081` | 否 |
| `Gateway__Host` | 网关主机地址 | `localhost` | 否 |

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
