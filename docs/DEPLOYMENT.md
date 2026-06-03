# EquipSense 部署手册

## 环境要求

| 组件 | 最低版本 |
|------|---------|
| Docker | 24.0+ |
| Docker Compose | v2.20+ |
| 内存 | 4 GB（推荐 8 GB） |
| 磁盘 | 20 GB（数据卷另计） |
| CPU | 2 核（推荐 4 核） |

## 快速部署

### 1. 克隆项目

```bash
git clone <repository-url> EquipSense
cd EquipSense
```

### 2. 配置环境变量

```bash
cp docker/.env.example docker/.env
```

编辑 `docker/.env`，**必须修改**以下项：

```env
# 数据库密码（至少 16 位随机字符串）
PG_PASSWORD=<你的强密码>

# JWT 密钥（至少 32 字符随机字符串）
JWT_SECRET=<你的随机密钥>

# LLM API 密钥（阿里云 DashScope 或兼容接口）
LLM_API_KEY=<你的API密钥>

# Web Push 证书（使用 npx web-push generate-vapid-keys 生成）
VAPID__PUBLICKEY=<你的公钥>
VAPID__PRIVATEKEY=<你的私钥>
```

### 3. 配置 TLS 证书（可选）

将 SSL 证书放置到 `docker/ssl/` 目录：

```bash
cp your-cert.pem docker/ssl/cert.pem
cp your-key.pem docker/ssl/key.pem
```

如果不需要 HTTPS，修改 `.env` 中 `BEHIND_PROXY=false`。

### 4. 启动服务

```bash
cd docker
docker compose up -d
```

首次启动约需 2-3 分钟（构建镜像 + 数据库迁移 + 种子数据初始化）。

### 5. 验证部署

```bash
# 检查所有容器状态
docker compose ps

# 检查后端健康状态
curl http://localhost:8080/health/startup

# 检查系统信息
curl http://localhost:8080/api/v1/system/info
```

### 6. 访问系统

| 服务 | 地址 |
|------|------|
| 前端（HTTP） | http://localhost |
| 前端（HTTPS） | https://localhost |
| 后端 API | http://localhost:8080 |
| Grafana | http://localhost:3000 |
| Seq 日志 | http://localhost:5341 |
| Prometheus | http://localhost:9090 |

**默认管理员账号**: admin / Admin@123（首次登录后请立即修改密码）

## 端口配置

默认端口可在 `.env` 中修改：

| 服务 | 变量 | 默认值 |
|------|------|--------|
| 前端 | FRONTEND_PORT | 80 |
| 后端 | BACKEND_PORT | 8080 |
| PostgreSQL | PG_PORT | 5432 |
| Redis | REDIS_PORT | 6379 |
| MQTT | MQTT_PORT | 1883 |
| Grafana | GRAFANA_PORT | 3000 |
| Prometheus | PROMETHEUS_PORT | 9090 |
| Seq | SEQ_PORT | 5341 |

## 数据管理

### 数据卷

Docker Compose 创建以下持久化卷：

| 卷名 | 用途 |
|------|------|
| pgdata | PostgreSQL 数据 |
| pg_backup | 数据库备份 |
| redis_data | Redis 持久化 |
| mosquitto_data | MQTT 消息持久化 |
| seq_data | Seq 日志存储 |
| prometheus_data | Prometheus 指标数据 |
| grafana_data | Grafana 仪表盘配置 |

### 数据库备份

```bash
docker exec equipai-postgres pg_dump -U postgres equipai > backup_$(date +%Y%m%d).sql
```

### 数据库恢复

```bash
cat backup_20260603.sql | docker exec -i equipai-postgres psql -U postgres equipai
```

## 运维操作

### 查看日志

```bash
# 后端日志
docker logs equipai-backend --tail 100 -f

# 特定服务日志
docker logs equipai-postgres --tail 50
```

### 重启服务

```bash
# 重启单个服务
docker compose restart backend

# 重建并重启（代码更新后）
docker compose up -d --build backend
```

### 扩缩容资源限制

在 `docker-compose.yml` 的 `deploy.resources.limits` 中调整各服务的 CPU 和内存限制。

### 更新部署

```bash
git pull
docker compose build --no-cache backend frontend
docker compose up -d
```

## 生产环境检查清单

- [ ] 修改 `.env` 中所有密码和密钥
- [ ] 配置 TLS 证书
- [ ] 设置 `BEHIND_PROXY=true`
- [ ] 设置 `DOMAIN` 为实际域名
- [ ] 修改 Grafana 默认密码
- [ ] 配置 MQTT Broker 认证（`mosquitto_passwd` 文件）
- [ ] 配置防火墙规则（仅开放 80/443）
- [ ] 设置 PostgreSQL 定期备份
- [ ] 监控磁盘空间（时序数据增长较快）
