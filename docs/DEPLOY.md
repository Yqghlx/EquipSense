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

部署会先执行 `bash ./validate-env.sh .env --check-runtime-files` 和 `docker compose --env-file .env ... config --quiet`，
只有生产凭据、镜像 digest 和 Compose 变量全部通过后，才会登录 GHCR、拉取镜像和重启容器。校验失败会在任何容器变更前退出。
如需启用零停机蓝绿部署，再按 [`BLUE_GREEN_DEPLOY.md`](BLUE_GREEN_DEPLOY.md) 准备 `docker-compose.bluegreen.yml`、router 配置和部署脚本。

### 依赖审计说明

CI 会执行 `frontend/scripts/check-production-audit.mjs`，对生产依赖中的 high/critical 漏洞逐项阻断。当前仅登记一项 React Router 例外：官方公告影响不稳定的 RSC API，而本项目是使用 `BrowserRouter` 的 SPA，不使用该 API；脚本同时锁定 `react-router` 与 `react-router-dom` 的实际安装版本为 `7.18.x`，并校验公告 URL，其他漏洞仍会阻断流水线。详见 [React Router 安全公告](https://github.com/advisories/GHSA-qwww-vcr4-c8h2)。

React Router DOM 包尚未提供对应的 `8.3.0` 修复版本，因此当前不降级到旧版本（旧版本会引入其他漏洞），待 DOM 包提供修复版本后重新评估升级路径。

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

```bash
# 1. 先停止后端，避免恢复过程中产生新写入
docker compose --env-file docker/.env -f docker/docker-compose.yml stop backend

# 2. 自动选择最近一次已生成的数据库和附件备份（也可手动替换为指定文件）
LATEST_DB_BACKUP="$(ls -t docker/backups/equipai_*.sql.gz | head -n1)"
LATEST_ATTACHMENTS_BACKUP="$(ls -t docker/backups/attachments_*.tar.gz | head -n1)"
test -n "$LATEST_DB_BACKUP" && test -n "$LATEST_ATTACHMENTS_BACKUP"

# 3. 恢复 PostgreSQL
gunzip -c "$LATEST_DB_BACKUP" | \
docker compose --env-file docker/.env -f docker/docker-compose.yml exec -T postgres \
  sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

# 4. 校验并解压附件备份到临时目录，再复制回持久卷
ATTACHMENTS_TMP="$(mktemp -d)"
tar -tzf "$LATEST_ATTACHMENTS_BACKUP" >/dev/null
tar -xzf "$LATEST_ATTACHMENTS_BACKUP" -C "$ATTACHMENTS_TMP"
docker compose --env-file docker/.env -f docker/docker-compose.yml cp \
  "$ATTACHMENTS_TMP/." backend:/app/uploads/
rm -rf "$ATTACHMENTS_TMP"

# 5. 恢复 Redis（可选）并启动后端
docker compose --env-file docker/.env -f docker/docker-compose.yml restart redis
docker compose --env-file docker/.env -f docker/docker-compose.yml start backend
```

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
