# EquipSense 部署指南

> 需要打印或交付给实施工程师时，使用[生产安装与验收指南](INSTALLATION_GUIDE.md)和生成的 [PDF 版本](../output/pdf/equipsense-production-installation-guide.pdf)。PDF 源文档和生成脚本分别位于 `docs/INSTALLATION_GUIDE.md` 与 `docs/scripts/build-installation-guide-pdf.py`。

## 系统要求

| 组件 | 最低版本 | 推荐配置 |
|------|---------|---------|
| Docker | 24+ | 最新稳定版 |
| Docker Compose | v2+ | 随 Docker Desktop 安装 |
| CPU | 2 核 | 4 核 |
| 内存 | 4 GB | 8 GB |
| 磁盘 | 20 GB | 50 GB SSD |

## 快速启动

### 1. 克隆仓库并配置环境变量

```bash
git clone <仓库地址> && cd EquipSense
cp docker/.env.example docker/.env
```

为减少手工遗漏，可先运行本地凭据初始化工具。它只生成数据库、缓存、消息队列、MQTT、种子账户、JWT、MFA、PII、网关和监控所需的随机值；不会生成许可证、真实租户 UUID、生产域名或任何证书。命令在这些人工配置尚未完成时返回非零是预期行为，生成的密钥仍会安全保留在权限为 `600` 的 `docker/.env` 中，随后应纳入密钥管理系统并完成备份恢复策略：

```bash
cd docker
./bootstrap-production-secrets.sh
```

如果门禁报告重复键，可显式追加 `--repair-identical-duplicates` 只归一化值完全相同的重复项；值冲突的 `JWT_SECRET`、`REDIS_PASSWORD` 等仍会拒绝自动选择，必须由部署者依据密钥管理记录人工清理。该工具不会覆盖已有有效凭据，也不会打印凭据值。

编辑 `docker/.env`，填写以下必需配置：

```env
# 必须修改
PG_PASSWORD=<强密码，至少16位>
JWT_SECRET=<随机密钥，至少32位>
TOTP_ENCRYPTION_KEY=<openssl rand -base64 32 生成的 AES-256 密钥>
PII_ENCRYPTION_KEY=<openssl rand -base64 32 生成的独立 AES-256 密钥>
AUTOMAPPER_LICENSE_KEY=<Lucky Penny Software 签发的 AutoMapper 15+ 许可证密钥>
MQTT_USERNAME=<MQTT用户名>
MQTT_PASSWORD=<MQTT强密码>
GATEWAY_AUTH_KEY=<至少32位的纯ASCII网关认证密钥>
AUTH_MACHINE_API_KEY=<机器客户端需要响应体 JWT 时配置的独立至少32位 ASCII 密钥>
GATEWAY_ID=<与边缘网关一致的唯一网关标识，默认 gateway-001>
GATEWAY_TENANT_ID=<实际租户 UUID，边缘网关生产必填>
GATEWAY_BUFFER_PATH=/data/buffer.db
GATEWAY_BACKEND_URL=http://backend:8080
GATEWAY_ALLOWED_HOSTS=edgegateway
SEED_ADMIN_PASSWORD=<管理员初始密码>
SEED_LEAD_PASSWORD=<主管初始密码>
SEED_TECH_PASSWORD=<技术员初始密码>
SEED_OPERATOR_PASSWORD=<操作员初始密码>
SEED_VIEWER_PASSWORD=<观察者初始密码>
# 普通 Production 保持 false；隔离 smoke Compose 会显式覆盖为 full
# true/1 为兼容的最小验收种子；full 为完整演示数据集，只能用于隔离环境
SEED_DEMO_DATA=false
VAPID__PUBLICKEY=<由 web-push 生成的公钥>
VAPID__PRIVATEKEY=<由 web-push 生成的私钥>
REDIS_PASSWORD=<Redis强密码>
RABBITMQ_PASSWORD=<RabbitMQ强密码>
RABBITMQ_IMAGE=rabbitmq:4.3.4-management-alpine@sha256:44bf7eb50fe1765885659e49ccfdc775f8e531964d979321aee380a071f49f94
SEQ_ADMIN_PASSWORD=<Seq管理员密码>
GRAFANA_PASSWORD=<Grafana管理员密码>
# 可选：Alertmanager 外部告警接收地址（未配置时不发送外部通知）
# ALERT_WEBHOOK_URL=https://alert-receiver.example.com/api/alertmanager
JAEGER_SPAN_STORAGE_TYPE=badger
JAEGER_BADGER_EPHEMERAL=false

# 可选修改
DOMAIN=your-domain.com
```

生产部署先将正式 Nginx/MQTT 证书放入 `docker/ssl/` 和 `docker/mqtt-certs/`，再确认 `docker/.env` 中的必填项已替换占位值并创建 MQTT 密码文件：

```bash
cd docker
./setup.sh   # 占位凭据或证书未就绪时返回非零，这是预期行为
nano .env    # 填写许可证、真实租户、域名和其它部署专属配置
./setup.sh   # 生产环境不会自动生成自签名证书；配置通过后会创建/校验 MQTT 密码文件
cd ..
```

开发/测试只启动基础设施时使用 `docker-compose.dev.yml`；如需测试完整 Compose 的 TLS 挂载链路，可按“TLS 证书配置”中的自签名方案单独运行 `generate-cert.sh` 和 `generate-mqtt-cert.sh`，但不得将其用于生产环境。

`setup.sh` 仅支持 `Production`，会在创建认证文件前一次性校验生产 Compose 所需的凭证、JWT 长度、文件权限和固定镜像 digest，并确认 Mosquitto 密码文件包含当前 `MQTT_USERNAME`；它要求生产 TLS/MQTT 文件已预置，绝不会自动生成开发自签名证书。确认运行时文件后还会再次执行 `--check-runtime-files`，拒绝过期、主机名不匹配、私钥权限不安全、证书与私钥不匹配、生产叶子证书自签名或 CA 链无效的 TLS/MQTT 文件，同时拒绝符号链接形式的 `.env`、TLS 私钥和 Mosquitto 密码文件，避免仅打印 warning 后误报配置成功或把认证文件写入非预期目标。开发/测试请使用 `docker-compose.dev.yml`，需要完整 TLS 挂载测试时再单独生成临时证书。部署脚本会重复执行同一运行时门禁；校验器还会拒绝数据库、缓存、消息队列、监控服务、种子账户及安全密钥之间复用同一凭据、重复环境变量和非 `Production` 运行环境，只输出变量名，不输出凭据值。

直接启动生产 Compose 时统一使用 `docker/compose-production.sh`：它会在 `up`、`start`、`restart`、`build`、`pull`、`create`、`run` 和 `scale` 前执行同一套生产门禁，校验失败时不会调用 Docker，避免只启动部分服务。`ps`、`logs`、`exec`、`stop` 和 `down` 等观察或故障处置命令仍可在门禁失败时使用；这些命令使用仅包含显式安全变量白名单的临时恢复环境，未知变量默认丢弃，避免把新增的 API Key、密码或带认证信息的 URL 复制到临时文件。CI/CD 的正式镜像发布继续使用 `deploy-production.sh`，不要用本地构建入口替代滚动发布脚本。

上线前建议先执行只读自检入口。它不会启动、重启、构建或拉取任何服务；默认检查 `.env`、正式证书、Docker daemon 和最终 Compose 配置，服务启动后追加 `--runtime` 检查所有运行服务（一次性 `jaeger-init` 除外）及已有健康检查：

```bash
# 启动前静态检查；失败时按变量名、证书文件或 Compose 错误整改
bash docker/production-readiness.sh \
  --env-file docker/.env \
  --compose-file docker/docker-compose.yml \
  --compose-file docker/docker-compose.prod.yml

# 启动后运行态检查；不会修改容器
bash docker/production-readiness.sh \
  --env-file docker/.env \
  --compose-file docker/docker-compose.yml \
  --compose-file docker/docker-compose.prod.yml \
  --runtime
```

自检返回非零时不得继续发布；输出只包含变量名、文件名、服务名和错误类别，不包含 `.env` 的实际值。

`bootstrap-production-secrets.sh` 默认永不覆盖已有有效凭据，并拒绝重复键、符号链接环境文件和并发写入；它通过同目录临时文件原子替换配置，生成后仍调用 `validate-env.sh`。因此该工具是降低初始化错误的辅助工具，不是许可证、证书、租户和域名的替代品，也不会把“部分初始化”误报成可上线。

> 注意：生产 Compose 操作请从仓库根目录使用 `docker/compose-production.sh`。该入口会自动加载 `docker/.env`；恢复脚本等需要自行接收环境文件的工具仍必须显式传入 `--env-file docker/.env`。

生产 Compose 的基础设施镜像使用 digest 固定版本；升级镜像时应先更新 digest、完成全量验证，再进行部署。RabbitMQ 通过 `RABBITMQ_IMAGE` 显式注入，生产环境应使用带 digest 的镜像引用。

生成 VAPID 密钥：

```bash
npx web-push generate-vapid-keys
```

### 2. TLS 证书配置

#### 方案 A：Let's Encrypt（推荐）

```bash
# 安装 certbot
sudo apt install certbot

# 获取证书（替换 your-domain.com）
sudo certbot certonly --standalone -d your-domain.com

# 复制到 Docker 目录
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem docker/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem docker/ssl/key.pem
chmod 600 docker/ssl/key.pem
```

#### 方案 B：自签名证书（仅测试）

```bash
mkdir -p docker/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/ssl/key.pem -out docker/ssl/cert.pem \
  -subj "/CN=localhost"
```

### 3. 启动服务

```bash
# 启动前只读门禁
bash docker/production-readiness.sh \
  --env-file docker/.env \
  --compose-file docker/docker-compose.yml \
  --compose-file docker/docker-compose.prod.yml

docker/compose-production.sh up -d
```

首次启动约需 2-3 分钟（构建镜像 + 数据库迁移 + 用户 PII 历史数据加密回填 + 基础种子数据）。Production 默认只创建系统租户、引导租户、生产种子账户、行业模板和诊断知识，不创建测试租户或 `AC-001` 示例设备；`SEED_DEMO_DATA=true`/`1` 仅保留最小隔离验收兼容模式，`SEED_DEMO_DATA=full` 才会在临时隔离数据库创建固定的 10 台演示设备、24 小时遥测、告警和工单，三者都不允许进入普通生产库，普通生产校验会拒绝显式开启。生产 Compose 的 MQTT 连接使用 8883/TLS；CA 文件来自 `docker/mqtt-certs/ca.crt`。正式部署前必须使用 `bash docker/validate-env.sh docker/.env --check-runtime-files`，不能只检查文件路径是否存在。应用启动会用 PostgreSQL advisory lock 串行保护迁移、PII 回填、种子和 TimescaleDB 初始化；PII 回填或密文校验失败会阻止服务继续启动，蓝绿发布时不需要人工暂停旧实例。镜像构建使用仓库根目录 `.dockerignore` 排除 `node_modules`、编译产物、测试报告、备份、证书和 `.env`，不要用 `-f` 指向其他上下文，否则可能导致构建缓慢或把敏感文件发送给 Docker daemon。

### 4. 验证部署

```bash
# 汇总检查所有生产服务状态和健康检查
bash docker/production-readiness.sh \
  --env-file docker/.env \
  --compose-file docker/docker-compose.yml \
  --compose-file docker/docker-compose.prod.yml \
  --runtime

# 检查所有服务状态
docker/compose-production.sh ps

# 检查后端健康
curl http://localhost:8080/health/startup

# 检查生产就绪状态（包含 RabbitMQ 事件总线）
curl http://localhost:8080/health/ready

# 检查边缘网关健康
curl http://localhost:8081/health

# 检查前端
curl https://localhost/health

# 查看系统版本
curl http://localhost:8080/api/v1/system/info
```

## 环境变量清单

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `PG_PASSWORD` | PostgreSQL 密码 | - | 是 |
| `PG_DB` | 数据库名 | `equipai` | 否 |
| `PG_USER` | 数据库用户 | `postgres` | 否 |
| `PG_PORT` | PostgreSQL 端口 | `5432` | 否 |
| `INTERNAL_BIND_ADDRESS` | 内部服务宿主端口绑定地址 | `127.0.0.1` | 否 |
| `PUBLIC_BIND_ADDRESS` | 前端、MQTT、蓝绿路由宿主端口绑定地址 | `0.0.0.0` | 否 |
| `REDIS_PASSWORD` | Redis 密码 | - | 生产环境必填 |
| `REDIS_PORT` | Redis 端口 | `6379` | 否 |
| `RABBITMQ_IMAGE` | RabbitMQ 带 digest 的精确镜像引用 | 无默认值 | 生产环境必填 |
| `RABBITMQ_PASSWORD` | RabbitMQ 密码（至少 16 字符，禁止 guest） | - | 生产环境必填 |
| `SEQ_ADMIN_PASSWORD` | Seq 管理员密码 | - | 生产环境必填 |
| `GRAFANA_PASSWORD` | Grafana 管理员密码 | - | 生产环境必填 |
| `ALERT_WEBHOOK_URL` | Alertmanager 外部告警 Webhook；未配置时降级为仅在监控面板保留 | - | 否 |
| `JAEGER_SPAN_STORAGE_TYPE` | Jaeger trace 存储类型；单机生产默认 `badger` | `badger` | 否 |
| `JAEGER_BADGER_EPHEMERAL` | Badger 是否临时存储；生产必须关闭 | `false` | 否 |
| `MQTT_PORT` | MQTT 对外端口 | `8883` | 否 |
| `MQTT_USERNAME` | MQTT 用户名 | - | 生产环境必填 |
| `MQTT_PASSWORD` | MQTT 密码 | - | 生产环境必填 |
| `GATEWAY_AUTH_KEY` | 边缘网关认证密钥（至少 32 位纯 ASCII） | - | 使用边缘网关时必填 |
| `GATEWAY_ID` | 后端与边缘网关绑定的唯一网关标识；生产注册/配置拉取必须匹配 | `gateway-001` | 使用边缘网关时必填 |
| `GATEWAY_TENANT_ID` | 后端与边缘网关绑定的所属租户 UUID；生产环境缺失或无效时后端/网关拒绝启动 | - | 使用边缘网关时必填 |
| `GATEWAY_BUFFER_PATH` | 边缘网关 SQLite 断网缓冲路径，必须落在持久化卷 | `/data/buffer.db` | 否 |
| `GATEWAY_BACKEND_URL` | 边缘网关上传目标后端；蓝绿部署由脚本临时设置为目标颜色服务名 | `http://backend:8080` | 否 |
| `EDGE_BLUEGREEN_PORT` | 蓝绿部署边缘网关健康探针宿主端口 | `18081` | 否 |
| `FILE_STORAGE_PROVIDER` | 工单附件存储实现：`Local` / `S3` | `Local` | 否 |
| `FILE_STORAGE_BASE_PATH` | 工单附件目录，必须与 `attachments_data` 卷挂载点一致；Production 必须使用非根目录绝对路径 | `/app/uploads` | 否 |
| `FILE_STORAGE_S3_BUCKET` 等 | S3 桶、区域、可选自定义端点、访问凭据、路径风格和对象键前缀；自定义端点生产必须 HTTPS | - | Provider=S3 时按端点类型必填 |
| `OUTBOUND_HTTP_ALLOW_PRIVATE_NETWORKS` | 是否允许 Webhook/EAM 等租户集成访问 RFC1918 私网地址，开启前需完成网络隔离评审 | `false` | 否 |
| `SEED_ADMIN_PASSWORD` 等五项 | 种子账户初始密码（每项至少 16 个字符，不得使用占位值或公开默认值） | - | 生产环境必填 |
| `SEED_DEMO_DATA` | 演示数据模式：`false`/`0` 关闭，`true`/`1` 保留最小隔离验收种子，`full` 创建 10 台设备、遥测、告警和工单；普通 Production 必须关闭 | `false` | 否 |
| `JWT_SECRET` | JWT 签名密钥 | - | 是 |
| `TOTP_ENCRYPTION_KEY` | Base64 编码的 32 字节 AES-256 TOTP 密钥，必须由外部密钥管理系统保存 | - | 生产环境必填 |
| `PII_ENCRYPTION_KEY` | Base64 编码的 32 字节 AES-256-GCM 用户邮箱/手机号密钥，必须与 TOTP 密钥独立并由外部密钥管理系统保存 | - | 生产环境必填 |
| `AUTOMAPPER_LICENSE_KEY` | AutoMapper 15+ 供应商签发的许可证密钥，通过密钥管理系统注入 | - | 生产环境必填 |
| `LLM_API_KEY` | LLM API 密钥 | 空 | 否 |
| `LLM_MODEL` | LLM 模型 | `qwen-plus` | 否 |
| `LLM_ENDPOINT` | LLM 端点 | DashScope | 否 |
| `VAPID__PUBLICKEY` | Web Push 公钥 | - | 是 |
| `VAPID__PRIVATEKEY` | Web Push 私钥 | - | 是 |
| `DOMAIN` | 域名 | `localhost` | 否 |
| `BEHIND_PROXY` | 是否在反向代理后 | `true` | 否 |
| `TRUSTED_PROXY_NETWORKS` | 可信反向代理 CIDR 网段，多个网段用逗号分隔 | `172.16.0.0/12` | 使用反向代理时需按实际网络确认 |
| `SSL_CERT_PATH` | TLS 证书路径（容器内） | `/etc/nginx/ssl/cert.pem` | 否 |
| `SSL_KEY_PATH` | TLS 私钥路径（容器内） | `/etc/nginx/ssl/key.pem` | 否 |

## 首次启动

系统首次启动时会自动：
1. 创建数据库表（EF Core 迁移）
2. 创建 TimescaleDB 超级表和连续聚合
3. 基础种子数据（角色、权限、生产初始账户、行业模板和知识库）
4. 仅在隔离验收显式开启 `SEED_DEMO_DATA=true`/`1` 或 `full` 时创建验收数据；`full` 额外创建固定的 10 台演示设备、遥测、告警和工单

升级已有数据库时不会自动删除历史示例设备、测试租户或测试账户；如生产库曾误开启演示数据，先完成备份和审计，再按租户/设备/账户关系执行经审批的人工清理。

工单附件默认写入 `attachments_data` 命名卷，容器重建不会丢失文件；单机多实例共享该卷。跨主机、多副本或 Kubernetes 部署时应配置 `FILE_STORAGE_PROVIDER=S3` 使用共享对象存储。应用会在生产启动时校验桶、端点、凭据和安全对象键前缀；项目不会自动启动 MinIO，切换前必须完成历史附件迁移、最小权限配置和隔离恢复演练。

边缘网关在 Production 中不会回退到镜像内的开发设备列表。`Gateway__UseLocalDeviceConfigFallback` 必须保持 `false`，设备配置应先在后端网关设备管理中登记；后端暂时不可达时网关保持空采集配置并持续刷新，而不会误连接示例 PLC/OPC UA 地址。开发环境可显式设为 `true`。

Production 中实际启用 OPC UA 时必须使用 `SignAndEncrypt`；未配置安全模式或填写未知值会阻止网关启动。只有完成现场风险评估、网络隔离和防火墙限制后，才允许通过 `GATEWAY_ALLOW_INSECURE_OPCUA=true` 兼容无法升级的旧设备，并应将该 break-glass 配置纳入变更审批。

管理员账户的初始密码由 `SEED_ADMIN_PASSWORD` 提供，不再使用仓库内置默认密码。五个种子账户密码在部署校验和应用启动时都会检查，至少 16 个字符、彼此独立且不得包含占位值；所有种子用户首次登录后必须修改密码。数据库、Redis、RabbitMQ、MQTT、Seq、Grafana 和五个种子账户也必须分别使用不同的随机凭据，不能为了方便复制同一个密码；TOTP、PII、JWT 和网关认证密钥也必须彼此独立，直接通过编排平台注入环境变量时，应用启动校验仍会拒绝种子账户密码复用。

强制改密同时由后端执行，不依赖前端路由。JWT 会携带 `must_change_password` 声明，`PasswordChangeRequiredMiddleware` 会对业务 API 返回 `403` 和 `X-Password-Change-Required: true`，仅保留登录挑战、首次 MFA 注册、找回密码、`/auth/me`、刷新、登出和改密等认证闭环接口；MFA 设置、确认、禁用及恢复码重置等高风险管理接口必须先完成改密。改密成功后会吊销旧 refresh 会话并签发新的令牌对/HttpOnly Cookie。旧 access token 会在其短生命周期内自然过期，不能绕过该门禁继续调用业务接口。

`TOTP_ENCRYPTION_KEY` 用于保护数据库中的 MFA 密钥，应用启动时会校验它必须解码为 32 字节；该密钥必须与数据库备份分开保存并纳入密钥管理系统的备份策略。密钥丢失后，历史 MFA 密钥无法恢复；轮换前必须先制定批量重新加密和回滚方案。

`PII_ENCRYPTION_KEY` 用于保护 `users.email` 和 `users.phone`。应用层使用 AES-256-GCM 随机 nonce 加密，并用字段级盲索引支持密码重置等值查找；数据库不再保存联系方式明文。升级既有数据库时，应用在 PostgreSQL advisory lock 内执行原子回填，任何密文校验或盲索引校验失败都会阻止启动。该密钥必须和数据库备份分开保存并纳入密钥管理系统的备份策略；密钥丢失后联系方式无法解密，当前版本不支持在线密钥轮换，轮换前必须制定批量重新加密、停机窗口和回滚方案。

`AUTOMAPPER_LICENSE_KEY` 用于 AutoMapper 15+ 的生产许可证验证。部署前需完成采购或适用许可证资格审核，从供应商获取真实密钥后注入；应用和部署脚本都会拒绝缺失、模板占位或过短值。密钥不得提交到仓库，可参考 [Lucky Penny Software 许可证 FAQ](https://luckypennysoftware.com/faq)。当前固定的 AutoMapper 15.1.3 已包含递归拒绝服务漏洞修复，禁止为规避许可证而降级到受影响版本；漏洞范围见 [GHSA-rvv3-g6hj-g44x](https://github.com/advisories/GHSA-rvv3-g6hj-g44x)。

生产环境默认要求系统管理员和维保主管启用 TOTP MFA。首次登录或公开注册完成后，页面会进入 MFA 注册向导：使用 Authenticator 扫描二维码、输入 6 位验证码，验证成功后才会建立正式会话；注册令牌只在 Redis 中保留 10 分钟，成功后立即删除。注册成功会显示 8 个一次性恢复码，必须在离开页面前保存；登录时可使用恢复码代替 TOTP，每个恢复码成功使用后立即失效。已登录用户可在“安全与 MFA”中输入当前 TOTP 重新生成恢复码，旧码会全部失效。若覆盖 `Security__Mfa__RequiredRoles__*`，仍必须保留 `SystemAdmin` 和 `MaintenanceLead`，否则应用拒绝启动。

> `docker/generate-mqtt-cert.sh` 生成的证书仅适用于开发/测试。生产环境应替换 `docker/mqtt-certs/` 中的 CA、服务端证书和私钥，并确保服务端证书的 SAN 包含 Broker 主机名。

### RabbitMQ 既有部署升级

生产 Compose 默认使用 RabbitMQ，且 `RABBITMQ_IMAGE` 必须显式设置为带 digest 的镜像引用。已有 3.13 数据卷不得直接挂载到 4.3；有保留消息需求时按 `3.13 -> 4.2 -> 4.3` 升级，每一步先备份并启用稳定 feature flags。切换后验证 `equipai-v2-at-least-once-dlx` policy，再启动后端。完整迁移、排空和回滚步骤见 [`OPS_RUNBOOK.md`](OPS_RUNBOOK.md)。

生产 Compose 明确让 RabbitMQ 以 `rabbitmq` 服务账户运行。由于服务同时启用 `cap_drop: ALL`，若恢复为 root，健康检查将无法读取 Erlang cookie 并误报 broker 不健康；升级 Compose 时必须保留该 `user` 配置。

生产 Compose 默认将 PostgreSQL、Redis、RabbitMQ、后端 API 和可观测性面板绑定到 `127.0.0.1`，
避免数据库、管理端口和日志面板直接暴露到公网；前端、MQTT 和蓝绿 router 默认绑定 `0.0.0.0`。
如使用外部负载均衡器，可在 `.env` 中将 `PUBLIC_BIND_ADDRESS` 改为 `127.0.0.1`，并由负载均衡器负责公网入口。

### CI/CD 自动部署前置条件

GitHub Actions 的 `deploy` job 要求 `DEPLOY_PATH` 指向生产 Docker 文件目录本身（不是仓库根目录），该目录必须同时包含：

- `.env`（权限为 `600`，由密钥管理系统或人工安全注入）
- `validate-env.sh`
- `production-readiness.sh`
- `docker-compose.yml` 与 `docker-compose.prod.yml`
- `deploy-production.sh`（与仓库 `docker/deploy-production.sh` 保持一致并具备执行权限）

GitHub Actions 远程执行 `bash ./deploy-production.sh "$TARGET_VERSION"`。脚本会先获取 Compose 目录下的单实例部署锁，再执行
只读生产 readiness 静态门禁（包含基础 Compose 和生产 overlay）；只有生产凭据、镜像
digest 和 Compose 变量全部通过后，才会登录 GHCR、拉取镜像和重建容器。目标版本还必须
通过后端、边缘网关、前端三项应用探针和全量运行态 readiness，才会原子更新版本记录；
任一目标检查失败都会使用本机旧镜像回滚，并在回滚后再次执行全量 readiness。校验或
镜像拉取失败发生在运行态变更前，不触发回滚。

PR、main 推送和版本 tag 还会运行 `production-smoke` job：它用当前提交实际构建的
backend/frontend/edgegateway 镜像和临时 Production 配置启动核心 Compose 服务，验证迁移、三层
健康探针、观察者账户登录、受保护 API、HTTPS 和 Nginx API 代理。PR 执行快速门禁；main 推送和
版本 tag 还会在同一组 Production 镜像中执行默认 433 个业务 E2E；当前仅保留 1 个有明确架构原因的条件跳过点，本次隔离 Production smoke 实际为 432 通过、1 跳过、0 失败。Smoke Compose
会清除固定容器名、移除基础设施宿主端口绑定，并为应用探针分配独立端口，可与本机已有基础设施
或并发 smoke 任务并行运行。
Smoke Compose 仅在临时隔离数据库中显式设置 `SEED_DEMO_DATA=full`，用于提供固定的 10 台演示设备、遥测、告警、工单以及跨租户验收所需的测试租户；该开关不会进入生产 Compose。
全量验收在隔离数据库中通过真实 MFA 注册接口初始化系统管理员、维保主管和跨租户测试账户的 TOTP，
再执行登录与业务流程，不会通过关闭 MFA 来绕过生产安全策略；第二租户账户只在该隔离验收中临时开启。

首次重建 backend/frontend/edgegateway 后的任何失败都会进入统一回滚：脚本使用
`.last-deployed-tag` 对应的本机旧镜像（`--pull never`）恢复三个无状态应用服务，再次验证
后端 `/health/ready`、边缘网关 `/health`、前端容器 health 和回滚后的全量运行态 readiness。
只有目标版本的三项应用探针与全量运行态 readiness 都通过后才以临时文件加原子 `mv`
更新版本记录。同一 tag 重复触发时也必须通过全量 readiness，不重复重建。
部署脚本会从 `.env` 读取 `EDGE_PORT` 生成网关健康探针；若生产入口经过额外代理，可显式设置
`DEPLOY_EDGE_HEALTH_URL` 覆盖默认的 `http://localhost:<EDGE_PORT>/health`。

手动执行与 CI 使用同一入口：

```bash
cd "$DEPLOY_PATH"
./deploy-production.sh 1.2.3
```

脚本不会停止或重建 PostgreSQL、Redis、RabbitMQ、Mosquitto 和任何数据卷。并发部署会被锁拒绝；回滚失败时
仍返回非零并保留旧版本记录，按 [`OPS_RUNBOOK.md`](OPS_RUNBOOK.md) 的部署回滚故障剧本处理。
如需启用零停机蓝绿部署，再按 [`BLUE_GREEN_DEPLOY.md`](BLUE_GREEN_DEPLOY.md) 准备 `docker-compose.bluegreen.yml`、router 配置和部署脚本。

### 依赖审计说明

CI 会执行 `frontend/scripts/check-production-audit.mjs`，对生产依赖中的 high/critical 漏洞逐项阻断。脚本保留一个严格限定的 React Router RSC-only 公告应急例外：仅当包名、`7.18.x` 实际安装版本和公告 URL 全部精确匹配，且项目继续使用不涉及 RSC 的 `BrowserRouter` SPA 架构时才可接受；其他漏洞仍会阻断。npm 返回网络、鉴权或无效报告时同样 fail-closed，不能把审计失败误报成零漏洞。2026-08-09 当前锁文件的联网审计结果为 0 个漏洞，该例外未被实际触发。详见 [React Router 安全公告](https://github.com/advisories/GHSA-qwww-vcr4-c8h2)。

## 功能配置（按需启用）

### SMTP 邮件（密码重置必需）

密码重置流程依赖邮件发送重置链接。在 `docker/.env` 配置 SMTP 后即可启用：

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_FROM_EMAIL=noreply@example.com
SMTP_FROM_NAME=EquipSense
SMTP_USERNAME=your_username
SMTP_PASSWORD=your_password
SMTP_ENABLE_SSL=true
```

> 未配置 SMTP 时，密码重置请求仍会记录审计日志，但不会发送邮件。

### 钉钉/飞书告警机器人推送

通过租户管理界面或 API 配置（`PUT /api/v1/settings/integrations/{type}`），将告警推送到群：

**钉钉**（自定义机器人，加签模式）：
1. 在钉钉群创建自定义机器人，勾选"加签"，复制 Webhook URL 和 Secret
2. 调用 API 配置：`PUT /api/v1/settings/integrations/dingtalk`，body: `{"enabled": true, "webhookUrl": "...", "secret": "...", "atMobiles": []}`
3. 触发 Critical/High 告警后，ActionCard 卡片自动推送到群

**飞书**（自定义机器人）：
1. 在飞书群添加自定义机器人，复制 Webhook URL
2. 调用 API 配置：`PUT /api/v1/settings/integrations/feishu`，body: `{"enabled": true, "webhookUrl": "..."}`
3. 交互式卡片自动推送（红色=严重，橙色=高级）

> 仅 Critical/High 级别告警推送机器人，避免低级别刷屏。所有级别告警都会生成站内通知。

> 出于 SSRF 防护，集成 URL 默认不得指向回环、云元数据或私网地址；企业内网 EAM 需显式设置 `OUTBOUND_HTTP_ALLOW_PRIVATE_NETWORKS=true`。

> 安全约束：`GET /api/v1/settings/integrations` 只返回集成配置摘要，不返回 Secret、AppSecret、API Key、密码或 URL 查询令牌；凭证字段显示为“已配置/未配置”，URL 仅显示协议、主机和端口。更新配置时，空凭证和脱敏占位符会保留服务端已有值，避免页面刷新后误清空集成。

### Prometheus/Alertmanager 外部通知

如需把基础设施告警（后端不可用、错误率、资源耗尽等）发送到统一告警平台，在 `docker/.env` 设置：

```env
ALERT_WEBHOOK_URL=https://alert-receiver.example.com/api/alertmanager
```

然后重新创建 Alertmanager 容器并检查就绪状态：

```bash
bash docker/validate-env.sh docker/.env --check-runtime-files
docker/compose-production.sh up -d --no-deps --force-recreate alertmanager
docker/compose-production.sh ps alertmanager
```

未配置该地址时，Alertmanager 会保留告警但将外部路由降级为 `dev-null`，不会请求本机或未知默认地址。

### 设备健康度定时刷新

设备健康度（health_score）默认手动刷新。如需定时自动更新，可配置定时任务调用：

```bash
# 刷新所有设备健康度（建议每小时一次）
curl -X POST http://localhost:8080/api/v1/devices/health-score/refresh-all \
  -H "Authorization: Bearer <admin_token>"
```

## 备份与恢复

### 全量备份（推荐）

```bash
# 备份 PostgreSQL、工单附件和 Redis（生产默认要求配置 REDIS_PASSWORD）
cd docker
./backup.sh
cd ..
```

脚本会先在 `BACKUP_DIR/.backup.lock` 获取单实例锁，避免重叠任务并发导出、清理或同步；遗留锁必须确认没有备份进程后再人工处理。脚本会生成以下文件并逐个校验：`*.dump`（PostgreSQL custom format）、`attachments_*.tar.gz`（工单附件）以及 `redis_*.rdb`。`RETAIN_DAYS` 必须是大于 0 的整数，历史备份清理失败也会使脚本返回非零；Redis 备份会轮询 `INFO persistence`，确认后台快照完成并校验 RDB 文件头后才保存。生产环境默认启用 `BACKUP_REDIS=true`，因此未配置 `REDIS_PASSWORD` 会在备份开始前失败；如确实不需要 Redis 数据，必须显式设置 `BACKUP_REDIS=false`。历史版本生成的 `*.sql.gz` 仍可由恢复脚本兼容读取。生产环境保持 `BACKUP_ATTACHMENTS=true`，并将 `BACKUP_DIR` 或 `S3_BUCKET` 配置到异地存储。开启 `S3_SYNC=true` 后，如果本地任一备份不完整，脚本会跳过异地同步；目标未配置、主机未安装 `aws-cli` 或同步失败时也会以非零状态结束，避免把不完整或没有异地副本的备份误报为成功。

### PostgreSQL 与附件恢复

恢复请统一使用 [`docker/restore.sh`](../docker/restore.sh)。确认执行时脚本会在环境文件旁获取单实例锁，
不要手工把 SQL
追加到现有数据库或只覆盖附件而不清理旧文件。脚本默认只做 dry-run 校验；确认
备份批次、维护窗口和回滚预案后，才追加 `--confirm`。生产镜像部署需要同时传入
基础 Compose 与生产覆盖文件：

```bash
# 先校验（不会调用 Docker，也不会修改数据）
./docker/restore.sh \
  --env-file docker/.env \
  --compose-file docker/docker-compose.yml \
  --compose-file docker/docker-compose.prod.yml \
  --db-backup docker/backups/equipai_YYYYMMDD_HHMMSS.dump \
  --attachments-backup docker/backups/attachments_YYYYMMDD_HHMMSS.tar.gz

# 确认后执行数据库、附件恢复及健康检查
./docker/restore.sh \
  --env-file docker/.env \
  --compose-file docker/docker-compose.yml \
  --compose-file docker/docker-compose.prod.yml \
  --db-backup docker/backups/equipai_YYYYMMDD_HHMMSS.dump \
  --attachments-backup docker/backups/attachments_YYYYMMDD_HHMMSS.tar.gz \
  --confirm
```

Redis RDB 恢复是可选的，在两条命令中都追加
`--redis-backup docker/backups/redis_YYYYMMDD_HHMMSS.rdb`；脚本会清理旧 AOF
并修正 RDB 属主后再启动 Redis。如果暂不恢复附件，
必须显式使用 `--skip-attachments`。恢复会重建目标数据库并替换
附件卷；数据库使用单事务导入，附件替换不自动回滚，因此必须先在隔离环境演练并
记录 RTO/RPO。S3 模式下，`restore.sh` 会把归档同步回
`FILE_STORAGE_S3_KEY_PREFIX` 对应的对象前缀，不会把对象存储误当成本地附件卷。

### Volume 管理

```bash
# 列出所有 volume（确认 attachments_data 仍然存在）
docker volume ls | grep equipai

# 不要直接删除 pgdata、attachments_data 或 redis_data；先完成备份与恢复演练
```

## 日志查看

```bash
# 查看所有服务日志
docker/compose-production.sh logs -f

# 查看特定服务日志
docker/compose-production.sh logs -f backend
docker/compose-production.sh logs -f frontend

# 最近 100 行
docker/compose-production.sh logs --tail 100 backend
```

## 升级步骤

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 备份数据库
docker/compose-production.sh exec postgres \
  pg_dump -U postgres equipai > pre_upgrade_backup.sql

# 3. 重新构建并启动（自动迁移）
docker/compose-production.sh up -d --build

# 4. 验证
docker/compose-production.sh ps
curl http://localhost:8080/health/ready
```

## 常见问题排查

### 端口冲突

```
Error: Bind for 0.0.0.0:5432 failed: port is already allocated
```

修改 `.env` 中对应端口（如 `PG_PORT=5433`），或停止占用端口的服务。

### 数据库连接失败

```
检查 PostgreSQL 是否就绪：docker compose exec postgres pg_isready
检查密码是否匹配：确认 .env 中 PG_PASSWORD 与 docker-compose.yml 引用一致
```

### SignalR WebSocket 连接失败

```
确认 Nginx 配置中 /hubs/ 位置块包含 proxy_set_header Upgrade/Connection
确认前端使用 wss:// 协议连接（HTTPS 环境下）
```

### 证书过期

```bash
# Let's Encrypt 自动续期
sudo certbot renew

# 更新 Docker 中的证书
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem docker/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem docker/ssl/key.pem

# 上线前重新执行证书、主机名、私钥匹配和 MQTT CA 链门禁
bash docker/validate-env.sh docker/.env --check-runtime-files

# 让 Nginx、Mosquitto 和边缘网关重新加载证书；后端会从只读公钥挂载中刷新有效期指标
docker/compose-production.sh up -d --no-deps --force-recreate frontend mosquitto backend edgegateway

# 确认 Prometheus 指标已出现且所有证书均可读取（状态值应为 1）
curl --fail --silent "http://127.0.0.1:${BACKEND_PORT:-8080}/metrics" | grep -E '^equipai_certificate_(monitoring_status|expiry_timestamp_seconds|days_until_expiry)'
```

生产后端只挂载 `docker/ssl/cert.pem` 公钥和已有 MQTT 公钥证书，不挂载 Nginx 或 MQTT 私钥；后端会拒绝私钥/PFX、符号链接以及偏离固定容器路径的证书配置。Prometheus 会对 `nginx_tls`、`mqtt_server` 和 `mqtt_ca` 分别产生 30 天 warning、7 天 critical，以及文件缺失/损坏时的 `CertificateMonitoringUnavailable` critical 告警；该监控不能替代上线前的 `validate-env.sh` 校验。证书轮换应纳入证书供应商的自动续期任务，并在续期后执行上述校验和重载流程。

---

## v1.3+ 安全与数据准确性部署要求

### HttpOnly Cookie + SameSite=Strict（v1.3.0+）

浏览器认证 Token 通过 HttpOnly + SameSite=Strict + Secure Cookie 传递。Production 浏览器响应体默认清空 JWT；机器客户端如需读取响应体令牌，必须配置独立的 `AUTH_MACHINE_API_KEY` 并发送 `X-API-Key`。**部署时必须满足**：

1. **前后端必须同站点**（同源或同子域）
   - 推荐用 Nginx 反代：前端走 `/`，API 走 `/api/`，SignalR 走 `/hubs/`
   - 跨域部署（如前端 `app.example.com` + 后端 `api.example.com`）需要把 Cookie 的 Domain 设为 `.example.com`，并接受 SameSite=Lax（牺牲部分 CSRF 防护）
   - 当前实现是 SameSite=Strict，跨域部署需要修改 `AuthController.SetAuthCookies`

2. **必须 HTTPS**（生产环境）
   - Cookie 的 Secure=true 仅在 HTTPS 下传输
   - HTTP 部署会让浏览器拒绝设置 Secure Cookie（用户无法登录）

3. **Nginx 必须转发 `X-Forwarded-Proto`**
   - 后端通过这个 header 判断原始协议是 HTTPS
   - 不转发会导致后端把 Cookie 设为非 Secure
   - `docker/nginx.conf` 已正确配置

4. **XSS 防护收益**
   - sessionStorage 不再存储 token（仅 user 信息）
   - JavaScript 完全无法读取 token 字符串
   - XSS 即使能执行任意代码，也无法偷走 token 离线使用

### 租户时区字段（v1.4.0）

v1.4.0 起，`tenants.TimeZone` 字段（IANA 时区 ID）影响 Dashboard 趋势聚合：
- 留空或 "UTC" 时，趋势按 UTC 当天分组（v1.3 行为）
- 设为 "Asia/Shanghai" 等，趋势按本地当天分组（修复跨时区用户看到的趋势错位一天）

**部署后建议**：
```sql
-- 把现有租户的时区更新为实际所在时区
UPDATE tenants SET time_zone = 'Asia/Shanghai' WHERE slug = 'your-tenant-slug';

-- 新租户注册时由前端选择时区（SettingsPage 可加配置项）
```

### PostgreSQL 连接池（v1.3.0+）

`docker-compose.yml` 已设置 `max_connections=200`（TimescaleDB 容器默认只有 25）。
后端 Npgsql 连接池默认 `Maximum Pool Size=100`。

**生产监控**：
- 若出现 `53300: sorry, too many clients already`，说明连接被打满
- 检查是否有 long-running transaction 持有连接：
  ```bash
  docker exec equipai-postgres psql -U postgres -c \
    "SELECT pid, state, query_start FROM pg_stat_activity WHERE state != 'idle'"
  ```
- 必要时调高 `max_connections`（同时按 25% 比例调高 `shared_buffers`）

### 备份脚本依赖（v1.3.0+）

`docker/backup.sh` 通过 Docker 在容器内导出 PostgreSQL；本地附件模式通过 `docker cp` 归档后端的 `/app/uploads`，S3 模式则从配置的对象键前缀同步后归档，避免产生空的附件备份。
**主机不需要安装 PostgreSQL 客户端工具**，只需要 Docker 访问权限和主机 `tar`。

定时备份（推荐每天凌晨 2 点）：
```bash
crontab -e
# 加入：
0 2 * * * cd /path/to/EquipSense/docker && ./backup.sh >> /var/log/equipsense-backup.log 2>&1
```
