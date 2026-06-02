# Phase 4B 生产就绪 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 Docker Compose 生产化配置、健康检查增强、版本号管理和部署文档，使系统达到 v1.0 发布标准。

**Architecture:** 改进 docker-compose.yml 添加 TLS/持久化/健康检查；后端启动时自动运行数据库迁移；添加启动/存活/就绪三级探针；统一版本号 1.0.0；编写完整部署文档。

**Tech Stack:** Docker Compose, ASP.NET Core Health Checks, .NET EF Core CLI, Shell scripting

---

### Task 1: Docker Compose 生产化改进

**Files:**
- Modify: `docker/docker-compose.yml`（多处改进）

- [ ] **Step 1: 修改 frontend 服务支持 HTTPS + 健康检查**

将 `docker-compose.yml` 中 `frontend` 服务的 `ports` 和 `environment` 区域替换，并添加 healthcheck 和 volumes：

```yaml
  frontend:
    build:
      context: ..
      dockerfile: docker/Dockerfile.frontend
    container_name: equipai-frontend
    restart: unless-stopped
    ports:
      - "${FRONTEND_PORT:-80}:80"
      - "443:443"
    environment:
      BACKEND_URL: http://backend:8080
      SSL_CERT_PATH: "${SSL_CERT_PATH:-/etc/nginx/ssl/cert.pem}"
      SSL_KEY_PATH: "${SSL_KEY_PATH:-/etc/nginx/ssl/key.pem}"
    volumes:
      - ${SSL_CERT_HOST_PATH:-./ssl/cert.pem}:/etc/nginx/ssl/cert.pem:ro
      - ${SSL_KEY_HOST_PATH:-./ssl/key.pem}:/etc/nginx/ssl/key.pem:ro
    depends_on:
      backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
```

注意：nginx:alpine 镜像无 curl，使用 wget 替代。`/health` 端点在 phase4A Task 1 的 nginx.conf 中已定义。

- [ ] **Step 2: 修改 backend 服务添加 healthcheck**

在 `docker-compose.yml` 的 `backend` 服务中，将 `depends_on` 块之后（约第 90 行后）添加 healthcheck：

```yaml
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health/startup"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
```

同时修改 `depends_on` 中 backend 的 condition：
- `mosquitto` 改为 `condition: service_started`（mosquitto 无 healthcheck）

- [ ] **Step 3: Redis 添加持久化配置**

在 `redis` 服务的 `command` 行后添加 volume 映射和持久化参数：

```yaml
    command: redis-server --requirepass ${REDIS_PASSWORD:-} --appendonly yes
    volumes:
      - redis_data:/data
```

- [ ] **Step 4: PostgreSQL 添加备份 volume**

在 `postgres` 服务的 `volumes` 列表中添加备份目录：

```yaml
    volumes:
      - pgdata:/var/lib/postgresql/data
      - pg_backup:/backup
```

- [ ] **Step 5: Mosquitto 添加密码文件 volume**

在 `mosquitto` 服务的 `volumes` 中添加：

```yaml
    volumes:
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf:ro
      - mosquitto_data:/mosquitto/data
      - ./mosquitto_passwd:/mosquitto/config/passwd:ro
```

- [ ] **Step 6: 在 volumes 区域添加新卷**

将 `docker-compose.yml` 底部的 `volumes` 替换为：

```yaml
volumes:
  pgdata:
  pg_backup:
  redis_data:
  mosquitto_data:
```

- [ ] **Step 7: 创建 Mosquitto 生产配置文件**

创建 `docker/mosquitto.prod.conf`：

```conf
# Mosquitto MQTT Broker 配置 — 生产环境
listener 1883
allow_anonymous false
password_file /mosquitto/config/passwd
persistence true
persistence_location /mosquitto/data/
log_dest stdout
```

- [ ] **Step 8: 提交**

```bash
git add docker/docker-compose.yml docker/mosquitto.prod.conf
git commit -m "feat(docker): 生产化改进 — TLS、Redis 持久化、健康检查、Mosquitto 认证"
```

---

### Task 2: 后端启动脚本 — 自动迁移

**Files:**
- Create: `docker/entrypoint.sh`
- Modify: `docker/Dockerfile.backend:37-41`（末尾 ENTRYPOINT 替换）

- [ ] **Step 1: 创建后端 entrypoint 脚本**

创建 `docker/entrypoint.sh`：

```sh
#!/bin/sh
set -e

# 从连接字符串解析 PG 主机
PGHOST=$(echo "$ConnectionStrings__Default" | sed -n 's/.*Host=\([^;]*\).*/\1/p')

echo "等待 PostgreSQL 就绪 (${PGHOST:-postgres})..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if nc -z "${PGHOST:-postgres}" 5432 2>/dev/null; then
        echo "PostgreSQL 已就绪"
        break
    fi
    attempt=$((attempt + 1))
    echo "PostgreSQL 未就绪，2 秒后重试 ($attempt/$max_attempts)..."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "错误：等待 PostgreSQL 超时"
    exit 1
fi

echo "启动应用（自动迁移由应用代码执行，见 Task 3）..."
exec dotnet EquipAI.WebAPI.dll
```

注意：数据库迁移不在此脚本中执行，而是由 Task 3 的应用启动代码 `db.Database.Migrate()` 完成。这样避免在 Docker 镜像中安装 EF Core 工具。

- [ ] **Step 2: 修改 Dockerfile.backend — 安装 netcat + 使用 entrypoint**

将 `Dockerfile.backend` 中的以下内容替换：

将第 22-23 行（安装 ICU 库）改为同时安装 netcat-openbsd：

```dockerfile
# 安装 ICU 库（中文等 Unicode 排序所需）和 netcat（用于 PG 等待）
RUN apt-get update && apt-get install -y --no-install-recommends libicu-dev netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*
```

将最后两行（EXPOSE 和 ENTRYPOINT）替换为：

```dockerfile
COPY docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh && chown equipai:equipai /app/entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/app/entrypoint.sh"]
```

- [ ] **Step 3: 提交**

```bash
git add docker/entrypoint.sh docker/Dockerfile.backend
git commit -m "feat(docker): 后端启动脚本 — 等待 PG 就绪 + 自动迁移准备"
```

---

### Task 3: 应用启动时自动迁移

**Files:**
- Modify: `src/EquipAI.WebAPI/Program.cs:135-153`（种子数据区域之后）

- [ ] **Step 1: 在 Program.cs 中添加自动迁移逻辑**

在 `Program.cs` 的 `app.Run()` 之前（约第 154 行，TimescaleDB 初始化之后），添加自动迁移代码：

```csharp
    // 生产环境自动迁移：启动时检查并应用待执行的 EF Core 迁移
    if (!app.Environment.IsDevelopment() || args.Contains("--migrate"))
    {
        using var migrateScope = app.Services.CreateScope();
        var db = migrateScope.ServiceProvider.GetRequiredService<AppDbContext>();
        try
        {
            Log.Information("正在检查数据库迁移...");
            db.Database.Migrate();
            Log.Information("数据库迁移完成");
        }
        catch (Exception ex)
        {
            Log.Error(ex, "数据库迁移失败");
            throw;
        }
    }
```

注意：需在文件顶部确认已有 `using Microsoft.EntityFrameworkCore;`，如果没有需要添加。检查 `AppDbContext` 的 using 是否已通过隐式引用可用。

- [ ] **Step 2: 构建验证**

Run: `dotnet build EquipAI.slnx`
Expected: BUILD SUCCEEDED

- [ ] **Step 3: 提交**

```bash
git add src/EquipAI.WebAPI/Program.cs
git commit -m "feat: 生产环境启动时自动执行 EF Core 数据库迁移"
```

---

### Task 4: 健康检查端点增强 — 三级探针

**Files:**
- Modify: `src/EquipAI.WebAPI/Program.cs:46-51`（健康检查注册区域）
- Modify: `src/EquipAI.WebAPI/Program.cs:110-133`（MapHealthChecks 区域）

- [ ] **Step 1: 添加启动探针和就绪探针的健康检查注册**

在 `Program.cs` 的健康检查注册区域（第 46-51 行），替换为：

```csharp
    // 健康检查注册：分离启动探针、存活探针和就绪探针
    builder.Services.AddHealthChecks()
        .AddNpgSql(builder.Configuration.GetConnectionString("Default")!, name: "postgresql")
        .AddRedis(builder.Configuration["Redis:ConnectionString"]!, name: "redis")
        .AddCheck<MqttHealthCheck>("mqtt", tags: new[] { "infra", "ready" })
        .AddCheck<LlmHealthCheck>(
            "llm", tags: new[] { "infra", "ready" }, timeout: TimeSpan.FromSeconds(5));

    // 启动探针标签 — 仅检查数据库连接（用于 Docker start_period）
    builder.Services.AddHealthChecks()
        .AddNpgSql(builder.Configuration.GetConnectionString("Default")!, name: "startup-db", tags: new[] { "startup" });
```

- [ ] **Step 2: 替换 MapHealthChecks 为三级探针端点**

将 `Program.cs` 中第 110-133 行的 `MapHealthChecks` 调用替换为：

```csharp
    // 启动探针：仅检查数据库连接（Docker start_period 使用）
    app.MapHealthChecks("/health/startup", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
    {
        Predicate = check => check.Tags.Contains("startup"),
        ResponseWriter = async (context, report) =>
        {
            context.Response.ContentType = "application/json";
            var result = System.Text.Json.JsonSerializer.Serialize(new
            {
                status = report.Status.ToString(),
                checks = report.Entries.Select(e => new { name = e.Key, status = e.Value.Status.ToString() })
            }, new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase });
            await context.Response.WriteAsync(result);
        }
    });

    // 存活探针：检查数据库 + Redis
    app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
    {
        Predicate = check => !check.Tags.Contains("startup") && !check.Tags.Contains("ready"),
        ResponseWriter = async (context, report) =>
        {
            context.Response.ContentType = "application/json";
            var result = System.Text.Json.JsonSerializer.Serialize(new
            {
                status = report.Status.ToString(),
                checks = report.Entries.Select(e => new { name = e.Key, status = e.Value.Status.ToString() })
            }, new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase });
            await context.Response.WriteAsync(result);
        }
    });

    // 就绪探针：检查所有依赖（数据库 + Redis + MQTT + LLM）
    app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
    {
        Predicate = _ => true,
        ResponseWriter = async (context, report) =>
        {
            context.Response.ContentType = "application/json";
            var result = System.Text.Json.JsonSerializer.Serialize(new
            {
                status = report.Status.ToString(),
                duration = report.TotalDuration.TotalMilliseconds,
                checks = report.Entries.Select(e => new
                {
                    name = e.Key,
                    status = e.Value.Status.ToString(),
                    description = e.Value.Description,
                    duration = e.Value.Duration.TotalMilliseconds
                })
            }, new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase });
            await context.Response.WriteAsync(result);
        }
    });
```

注意：移除了原来的 `/health/detail` 端点，其功能由 `/health/ready` 替代。

- [ ] **Step 3: 构建验证**

Run: `dotnet build EquipAI.slnx`
Expected: BUILD SUCCEEDED

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.WebAPI/Program.cs
git commit -m "feat(health): 三级健康探针 — startup/liveness/ready"
```

---

### Task 5: 版本号统一管理

**Files:**
- Modify: `src/EquipAI.WebAPI/EquipAI.WebAPI.csproj:22-26`（PropertyGroup）
- Modify: `frontend/package.json:4`（version 字段）

- [ ] **Step 1: 后端 csproj 添加版本号**

在 `EquipAI.WebAPI.csproj` 的 `<PropertyGroup>` 中添加 `<Version>` 和 `<SourceRevisionId>`：

```xml
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <Version>1.0.0</Version>
    <SourceRevisionId>$(GitCommitId)</SourceRevisionId>
  </PropertyGroup>
```

- [ ] **Step 2: 前端 package.json 更新版本号**

将 `frontend/package.json` 第 4 行的 `"version": "0.0.0"` 改为 `"version": "1.0.0"`。

- [ ] **Step 3: 提交**

```bash
git add src/EquipAI.WebAPI/EquipAI.WebAPI.csproj frontend/package.json
git commit -m "chore: 统一版本号为 1.0.0"
```

---

### Task 6: 构建信息注入 + 系统信息端点

**Files:**
- Create: `src/EquipAI.WebAPI/Controllers/SystemController.cs`
- Modify: `frontend/vite.config.ts`（添加构建信息环境变量注入）

- [ ] **Step 1: 创建 SystemController**

创建 `src/EquipAI.WebAPI/Controllers/SystemController.cs`：

```csharp
using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 系统信息控制器 — 返回版本号、构建时间、运行环境等
/// </summary>
[ApiController]
[Route("api/v1/system")]
public class SystemController : ControllerBase
{
    /// <summary>
    /// 获取系统版本和构建信息
    /// </summary>
    [HttpGet("info")]
    [AllowAnonymous]
    public IActionResult GetInfo()
    {
        var assembly = Assembly.GetExecutingAssembly();
        var version = assembly.GetName().Version?.ToString() ?? "1.0.0";
        var informationalVersion = assembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion ?? version;

        return Ok(new
        {
            version = informationalVersion.Split('+')[0],
            commitHash = informationalVersion.Contains('+') ? informationalVersion.Split('+')[1] : "unknown",
            environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
            buildTime = assembly.GetCustomAttribute<AssemblyConfigurationAttribute>()?.Configuration ?? "Release",
            runtime = $".NET {Environment.Version}",
            machineName = Environment.MachineName,
            uptime = DateTime.UtcNow - System.Diagnostics.Process.GetCurrentProcess().StartTime.ToUniversalTime()
        });
    }
}
```

- [ ] **Step 2: 前端 vite.config.ts 注入构建时间**

在 `frontend/vite.config.ts` 的 `defineConfig` 中添加 `define` 字段：

```typescript
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify('1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    // ... 现有插件
  ],
  // ... 其余配置
})
```

注意：放在 `plugins` 之前。

- [ ] **Step 3: 构建验证**

Run: `dotnet build EquipAI.slnx`
Expected: BUILD SUCCEEDED

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.WebAPI/Controllers/SystemController.cs frontend/vite.config.ts
git commit -m "feat: 系统信息端点 /api/v1/system/info + 构建信息注入"
```

---

### Task 7: 部署文档

**Files:**
- Create: `docs/DEPLOY.md`

- [ ] **Step 1: 创建 DEPLOY.md**

创建 `docs/DEPLOY.md`，内容如下：

````markdown
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
````

- [ ] **Step 2: 提交**

```bash
git add docs/DEPLOY.md
git commit -m "docs: 添加完整部署文档 DEPLOY.md"
```

---

### Task 8: Docker Compose frontend depends_on 修正 + 证书目录创建

**Files:**
- Create: `docker/ssl/.gitkeep`
- Modify: `docker/docker-compose.yml`（frontend volumes 路径修正）

- [ ] **Step 1: 创建 SSL 证书占位目录**

```bash
mkdir -p docker/ssl
touch docker/ssl/.gitkeep
```

- [ ] **Step 2: 修正 docker-compose.yml 中 SSL volume 挂载方式**

将 Task 1 中 frontend 的 SSL volume 改为使用目录映射更简单的方式：

```yaml
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
```

这样 `.env` 中的 `SSL_CERT_PATH`/`SSL_KEY_PATH` 不再需要（Nginx 配置中使用默认路径），简化部署。

- [ ] **Step 3: 提交**

```bash
git add docker/ssl/.gitkeep docker/docker-compose.yml
git commit -m "chore(docker): 创建 SSL 证书目录占位 + 简化 volume 挂载"
```
