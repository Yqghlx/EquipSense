# EquipSense 部署指南

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

编辑 `docker/.env`，填写以下必需配置：

```env
# 必须修改
PG_PASSWORD=<强密码，至少16位>
JWT_SECRET=<随机密钥，至少32位>
TOTP_ENCRYPTION_KEY=<openssl rand -base64 32 生成的 AES-256 密钥>
AUTOMAPPER_LICENSE_KEY=<Lucky Penny Software 签发的 AutoMapper 15+ 许可证密钥>
MQTT_USERNAME=<MQTT用户名>
MQTT_PASSWORD=<MQTT强密码>
GATEWAY_AUTH_KEY=<至少32位的纯ASCII网关认证密钥>
GATEWAY_ALLOWED_HOSTS=edgegateway
SEED_ADMIN_PASSWORD=<管理员初始密码>
SEED_LEAD_PASSWORD=<主管初始密码>
SEED_TECH_PASSWORD=<技术员初始密码>
SEED_OPERATOR_PASSWORD=<操作员初始密码>
SEED_VIEWER_PASSWORD=<观察者初始密码>
VAPID__PUBLICKEY=<由 web-push 生成的公钥>
VAPID__PRIVATEKEY=<由 web-push 生成的私钥>
REDIS_PASSWORD=<Redis强密码>
RABBITMQ_PASSWORD=<RabbitMQ强密码>
RABBITMQ_IMAGE=rabbitmq:4.3.4-management-alpine@sha256:44bf7eb50fe1765885659e49ccfdc775f8e531964d979321aee380a071f49f94
SEQ_ADMIN_PASSWORD=<Seq管理员密码>
GRAFANA_PASSWORD=<Grafana管理员密码>

# 可选修改
DOMAIN=your-domain.com
```

确认 `docker/.env` 中的必填项已替换占位值后，生成开发/测试用 Nginx 与 MQTT TLS 证书，并创建 MQTT 密码文件：

```bash
cd docker
./setup.sh   # 首次运行会创建 .env 并因占位凭据返回非零，这是预期行为
nano .env    # 填写所有必填凭据
./setup.sh   # 配置通过后才会生成证书和 MQTT 密码文件
cd ..
```

`setup.sh` 会在生成任何证书或认证文件前，一次性校验生产 Compose 所需的凭证、JWT 长度、文件权限和固定镜像 digest，并确认 Mosquitto 密码文件包含当前 `MQTT_USERNAME`；任一项不满足都会返回非零状态，不会让服务以半配置状态启动。

> 注意：Docker Compose 默认只从当前工作目录加载 `.env`。本项目配置文件位于 `docker/.env`，因此从仓库根目录执行 Compose 命令时必须带 `--env-file docker/.env`；本手册的生产命令已统一显式指定该参数。

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
docker compose --env-file docker/.env -f docker/docker-compose.yml up -d
```

首次启动约需 2-3 分钟（构建镜像 + 数据库迁移 + 种子数据）。生产 Compose 的 MQTT 连接使用 8883/TLS；CA 文件来自 `docker/mqtt-certs/ca.crt`。

### 4. 验证部署

```bash
# 检查所有服务状态
docker compose --env-file docker/.env -f docker/docker-compose.yml ps

# 检查后端健康
curl http://localhost:8080/health/startup

# 检查生产就绪状态（包含 RabbitMQ 事件总线）
curl http://localhost:8080/health/ready

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
| `MQTT_PORT` | MQTT 对外端口 | `8883` | 否 |
| `MQTT_USERNAME` | MQTT 用户名 | - | 生产环境必填 |
| `MQTT_PASSWORD` | MQTT 密码 | - | 生产环境必填 |
| `GATEWAY_AUTH_KEY` | 边缘网关认证密钥（至少 32 位纯 ASCII） | - | 使用边缘网关时必填 |
| `FILE_STORAGE_BASE_PATH` | 工单附件目录，必须与 `attachments_data` 卷挂载点一致 | `/app/uploads` | 否 |
| `OUTBOUND_HTTP_ALLOW_PRIVATE_NETWORKS` | 是否允许 Webhook/EAM 等租户集成访问 RFC1918 私网地址，开启前需完成网络隔离评审 | `false` | 否 |
| `SEED_ADMIN_PASSWORD` 等五项 | 种子账户初始密码（每项至少 16 个字符，不得使用占位值或公开默认值） | - | 生产环境必填 |
| `JWT_SECRET` | JWT 签名密钥 | - | 是 |
| `TOTP_ENCRYPTION_KEY` | Base64 编码的 32 字节 AES-256 TOTP 密钥，必须由外部密钥管理系统保存 | - | 生产环境必填 |
| `AUTOMAPPER_LICENSE_KEY` | AutoMapper 15+ 供应商签发的许可证密钥，通过密钥管理系统注入 | - | 生产环境必填 |
| `LLM_API_KEY` | LLM API 密钥 | 空 | 否 |
| `LLM_MODEL` | LLM 模型 | `qwen-plus` | 否 |
| `LLM_ENDPOINT` | LLM 端点 | DashScope | 否 |
| `VAPID__PUBLICKEY` | Web Push 公钥 | - | 是 |
| `VAPID__PRIVATEKEY` | Web Push 私钥 | - | 是 |
| `DOMAIN` | 域名 | `localhost` | 否 |
| `BEHIND_PROXY` | 是否在反向代理后 | `true` | 否 |
| `SSL_CERT_PATH` | TLS 证书路径（容器内） | `/etc/nginx/ssl/cert.pem` | 否 |
| `SSL_KEY_PATH` | TLS 私钥路径（容器内） | `/etc/nginx/ssl/key.pem` | 否 |

## 首次启动

系统首次启动时会自动：
1. 创建数据库表（EF Core 迁移）
2. 创建 TimescaleDB 超级表和连续聚合
3. 种子数据（角色、权限、系统管理员）

工单附件写入 `attachments_data` 命名卷，容器重建不会丢失文件；单机多实例共享该卷。跨主机或 Kubernetes 部署时应改用 S3/MinIO 等共享对象存储，并将数据库备份与附件卷分别纳入备份策略。

管理员账户的初始密码由 `SEED_ADMIN_PASSWORD` 提供，不再使用仓库内置默认密码。五个种子账户密码在部署校验和应用启动时都会检查，至少 16 个字符且不得包含占位值；所有种子用户首次登录后必须修改密码。

`TOTP_ENCRYPTION_KEY` 用于保护数据库中的 MFA 密钥，应用启动时会校验它必须解码为 32 字节；该密钥必须与数据库备份分开保存并纳入密钥管理系统的备份策略。密钥丢失后，历史 MFA 密钥无法恢复；轮换前必须先制定批量重新加密和回滚方案。

`AUTOMAPPER_LICENSE_KEY` 用于 AutoMapper 15+ 的生产许可证验证。部署前需完成采购或适用许可证资格审核，从供应商获取真实密钥后注入；应用和部署脚本都会拒绝缺失、模板占位或过短值。密钥不得提交到仓库，可参考 [Lucky Penny Software 许可证 FAQ](https://luckypennysoftware.com/faq)。当前固定的 AutoMapper 15.1.3 已包含递归拒绝服务漏洞修复，禁止为规避许可证而降级到受影响版本；漏洞范围见 [GHSA-rvv3-g6hj-g44x](https://github.com/advisories/GHSA-rvv3-g6hj-g44x)。

生产环境默认要求系统管理员和维保主管启用 TOTP MFA。首次登录或公开注册完成后，页面会进入 MFA 注册向导：使用 Authenticator 扫描二维码、输入 6 位验证码，验证成功后才会建立正式会话；注册令牌只在 Redis 中保留 10 分钟，成功后立即删除。注册成功会显示 8 个一次性恢复码，必须在离开页面前保存；登录时可使用恢复码代替 TOTP，每个恢复码成功使用后立即失效。已登录用户可在“安全与 MFA”中输入当前 TOTP 重新生成恢复码，旧码会全部失效。若覆盖 `Security__Mfa__RequiredRoles__*`，仍必须保留 `SystemAdmin` 和 `MaintenanceLead`，否则应用拒绝启动。

> `docker/generate-mqtt-cert.sh` 生成的证书仅适用于开发/测试。生产环境应替换 `docker/mqtt-certs/` 中的 CA、服务端证书和私钥，并确保服务端证书的 SAN 包含 Broker 主机名。

### RabbitMQ 既有部署升级

生产 Compose 默认使用 RabbitMQ，且 `RABBITMQ_IMAGE` 必须显式设置为带 digest 的镜像引用。已有 3.13 数据卷不得直接挂载到 4.3；有保留消息需求时按 `3.13 -> 4.2 -> 4.3` 升级，每一步先备份并启用稳定 feature flags。切换后验证 `equipai-v2-at-least-once-dlx` policy，再启动后端。完整迁移、排空和回滚步骤见 [`OPS_RUNBOOK.md`](OPS_RUNBOOK.md)。

生产 Compose 默认将 PostgreSQL、Redis、RabbitMQ、后端 API 和可观测性面板绑定到 `127.0.0.1`，
避免数据库、管理端口和日志面板直接暴露到公网；前端、MQTT 和蓝绿 router 默认绑定 `0.0.0.0`。
如使用外部负载均衡器，可在 `.env` 中将 `PUBLIC_BIND_ADDRESS` 改为 `127.0.0.1`，并由负载均衡器负责公网入口。

### CI/CD 自动部署前置条件

GitHub Actions 的 `deploy` job 要求 `DEPLOY_PATH` 指向生产 Docker 文件目录本身（不是仓库根目录），该目录必须同时包含：

- `.env`（权限为 `600`，由密钥管理系统或人工安全注入）
- `validate-env.sh`
- `docker-compose.yml` 与 `docker-compose.prod.yml`
- `deploy-production.sh`（与仓库 `docker/deploy-production.sh` 保持一致并具备执行权限）

GitHub Actions 远程执行 `bash ./deploy-production.sh "$TARGET_VERSION"`。脚本会先执行
`bash ./validate-env.sh .env --check-runtime-files` 和 Compose 渲染门禁；只有生产凭据、
镜像 digest 和 Compose 变量全部通过后，才会登录 GHCR、拉取镜像和重建容器。校验或
镜像拉取失败发生在运行态变更前，不触发回滚。

首次重建 backend/frontend 后的任何失败都会进入统一回滚：脚本使用
`.last-deployed-tag` 对应的本机旧镜像（`--pull never`）恢复两个无状态服务，再次验证
后端 `/health/ready` 与前端容器 health。只有目标版本健康通过后才以临时文件加原子
`mv` 更新版本记录。同一 tag 重复触发时只验证现有服务健康，不重复重建。

手动执行与 CI 使用同一入口：

```bash
cd "$DEPLOY_PATH"
./deploy-production.sh 1.2.3
```

脚本不会停止或重建 PostgreSQL、Redis、RabbitMQ、Mosquitto 和任何数据卷。回滚失败时
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
# 备份 PostgreSQL、工单附件；如配置了 REDIS_PASSWORD，也会备份 Redis
cd docker
./backup.sh
cd ..
```

脚本会生成以下文件并逐个校验：`*.sql.gz`（数据库）、`attachments_*.tar.gz`（工单附件）以及可选的 `redis_*.rdb`。生产环境保持 `BACKUP_ATTACHMENTS=true`，并将 `BACKUP_DIR` 或 `S3_BUCKET` 配置到异地存储。显式启用 `BACKUP_REDIS=true` 后，如果 Redis 快照或复制失败，脚本也会以非零状态结束；开启 `S3_SYNC=true` 后，如果未配置目标、主机未安装 `aws-cli` 或同步失败，脚本会以非零状态结束，避免把不完整或没有异地副本的备份误报为成功。

### PostgreSQL 与附件恢复

恢复请统一使用 [`docker/restore.sh`](../docker/restore.sh)，不要手工把 SQL
追加到现有数据库或只覆盖附件而不清理旧文件。脚本默认只做 dry-run 校验；确认
备份批次、维护窗口和回滚预案后，才追加 `--confirm`。生产镜像部署需要同时传入
基础 Compose 与生产覆盖文件：

```bash
# 先校验（不会调用 Docker，也不会修改数据）
./docker/restore.sh \
  --env-file docker/.env \
  --compose-file docker/docker-compose.yml \
  --compose-file docker/docker-compose.prod.yml \
  --db-backup docker/backups/equipai_YYYYMMDD_HHMMSS.sql.gz \
  --attachments-backup docker/backups/attachments_YYYYMMDD_HHMMSS.tar.gz

# 确认后执行数据库、附件恢复及健康检查
./docker/restore.sh \
  --env-file docker/.env \
  --compose-file docker/docker-compose.yml \
  --compose-file docker/docker-compose.prod.yml \
  --db-backup docker/backups/equipai_YYYYMMDD_HHMMSS.sql.gz \
  --attachments-backup docker/backups/attachments_YYYYMMDD_HHMMSS.tar.gz \
  --confirm
```

Redis RDB 恢复是可选的，在两条命令中都追加
`--redis-backup docker/backups/redis_YYYYMMDD_HHMMSS.rdb`；脚本会清理旧 AOF
并修正 RDB 属主后再启动 Redis。如果暂不恢复附件，
必须显式使用 `--skip-attachments`。恢复会重建目标数据库并替换
附件卷；数据库使用单事务导入，附件替换不自动回滚，因此必须先在隔离环境演练并
记录 RTO/RPO。

### Volume 管理

```bash
# 列出所有 volume（确认 attachments_data 仍然存在）
docker volume ls | grep equipai

# 不要直接删除 pgdata、attachments_data 或 redis_data；先完成备份与恢复演练
```

## 日志查看

```bash
# 查看所有服务日志
docker compose --env-file docker/.env -f docker/docker-compose.yml logs -f

# 查看特定服务日志
docker compose --env-file docker/.env -f docker/docker-compose.yml logs -f backend
docker compose --env-file docker/.env -f docker/docker-compose.yml logs -f frontend

# 最近 100 行
docker compose --env-file docker/.env -f docker/docker-compose.yml logs --tail 100 backend
```

## 升级步骤

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 备份数据库
docker compose --env-file docker/.env -f docker/docker-compose.yml exec postgres \
  pg_dump -U postgres equipai > pre_upgrade_backup.sql

# 3. 重新构建并启动（自动迁移）
docker compose --env-file docker/.env -f docker/docker-compose.yml up -d --build

# 4. 验证
docker compose --env-file docker/.env -f docker/docker-compose.yml ps
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
docker compose --env-file docker/.env -f docker/docker-compose.yml restart frontend
```

---

## v1.3+ 安全与数据准确性部署要求

### HttpOnly Cookie + SameSite=Strict（v1.3.0）

v1.3.0 起，认证 Token 完全通过 HttpOnly + SameSite=Strict + Secure Cookie 传递。**部署时必须满足**：

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

`docker/backup.sh` 通过 Docker 在容器内导出 PostgreSQL，并通过 `docker cp` 归档后端的 `/app/uploads` 附件目录。
**主机不需要安装 PostgreSQL 客户端工具**，只需要 Docker 访问权限和主机 `tar`。

定时备份（推荐每天凌晨 2 点）：
```bash
crontab -e
# 加入：
0 2 * * * cd /path/to/EquipSense/docker && ./backup.sh >> /var/log/equipsense-backup.log 2>&1
```
