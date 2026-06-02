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
VAPID__PUBLICKEY=<由 web-push 生成的公钥>
VAPID__PRIVATEKEY=<由 web-push 生成的私钥>

# 可选修改
DOMAIN=your-domain.com
REDIS_PASSWORD=<Redis密码>
```

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
docker compose -f docker/docker-compose.yml up -d
```

首次启动约需 2-3 分钟（构建镜像 + 数据库迁移 + 种子数据）。

### 4. 验证部署

```bash
# 检查所有服务状态
docker compose -f docker/docker-compose.yml ps

# 检查后端健康
curl http://localhost:8080/health/startup

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
| `REDIS_PASSWORD` | Redis 密码 | 空 | 否 |
| `REDIS_PORT` | Redis 端口 | `6379` | 否 |
| `MQTT_PORT` | MQTT 端口 | `1883` | 否 |
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

默认管理员账户：
- 用户名：`admin`
- 密码：见启动日志输出

**重要：** 首次登录后请立即修改默认密码。

## 备份与恢复

### PostgreSQL 备份

```bash
# 手动备份
docker compose -f docker/docker-compose.yml exec postgres \
  pg_dump -U postgres equipai > backup_$(date +%Y%m%d).sql

# 恢复
docker compose -f docker/docker-compose.yml exec -T postgres \
  psql -U postgres equipai < backup_20260602.sql
```

### Volume 管理

```bash
# 列出所有 volume
docker volume ls | grep equipai

# 仅清理备份 volume
docker volume rm equipai_pg_backup
```

## 日志查看

```bash
# 查看所有服务日志
docker compose -f docker/docker-compose.yml logs -f

# 查看特定服务日志
docker compose -f docker/docker-compose.yml logs -f backend
docker compose -f docker/docker-compose.yml logs -f frontend

# 最近 100 行
docker compose -f docker/docker-compose.yml logs --tail 100 backend
```

## 升级步骤

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 备份数据库
docker compose -f docker/docker-compose.yml exec postgres \
  pg_dump -U postgres equipai > pre_upgrade_backup.sql

# 3. 重新构建并启动（自动迁移）
docker compose -f docker/docker-compose.yml up -d --build

# 4. 验证
docker compose -f docker/docker-compose.yml ps
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
docker compose -f docker/docker-compose.yml restart frontend
```
