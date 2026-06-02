# Phase 4A 安全加固 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成生产环境安全加固 — Nginx HTTPS + 增强安全头 + ASP.NET 安全中间件 + 依赖审计 + 敏感配置审计

**Architecture:** 在 Nginx 层终止 TLS 并注入 CSP/HSTS/Permissions-Policy 等安全头；ASP.NET 后端在 `BEHIND_PROXY=false` 时自行添加 HTTPS 重定向和 HSTS；通过 `dotnet list package --vulnerable` 和 `npm audit` 审计依赖安全；确保所有敏感配置通过环境变量注入。

**Tech Stack:** Nginx (TLS 终止 + 安全头), ASP.NET Core 8 (HSTS/HTTPS 重定向), .NET CLI, npm

---

### Task 1: Nginx HTTPS + 增强安全头

**Files:**
- Modify: `docker/nginx.conf` (完整重写)

- [ ] **Step 1: 重写 nginx.conf，添加 HTTPS 监听 + 安全头**

将 `docker/nginx.conf` 完整替换为以下内容：

```nginx
# HTTP → HTTPS 301 重定向
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}

# HTTPS 主服务
server {
    listen 443 ssl;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # TLS 证书路径（通过 Docker volume 挂载）
    ssl_certificate     ${SSL_CERT_PATH:/etc/nginx/ssl/cert.pem};
    ssl_certificate_key ${SSL_KEY_PATH:/etc/nginx/ssl/key.pem};

    # 仅允许 TLS 1.2+，禁用弱密码套件
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;

    # HSTS（Strict-Transport-Security）
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Content-Security-Policy
    # style-src 需要 'unsafe-inline' 因为 TailwindCSS/shadcn 使用内联样式
    # connect-src 需要 wss: 支持 SignalR WebSocket
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' wss: https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;

    # Permissions-Policy
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;

    # X-Permitted-Cross-Domain-Policies
    add_header X-Permitted-Cross-Domain-Policies "none" always;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 256;

    # SPA 路由：所有非文件请求回退到 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源长缓存（Vite 构建时文件名含 hash）
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 反向代理到后端
    location /api/ {
        proxy_pass ${BACKEND_URL};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SignalR WebSocket 反向代理
    location /hubs/ {
        proxy_pass ${BACKEND_URL};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Nginx 健康检查端点（供 Docker healthcheck 使用）
    location /health {
        access_log off;
        return 200 'ok';
        add_header Content-Type text/plain;
    }
}
```

- [ ] **Step 2: 更新 nginx-entrypoint.sh 支持新环境变量**

将 `docker/nginx-entrypoint.sh` 替换为：

```sh
#!/bin/sh
# Nginx 启动时用环境变量替换模板中的占位符
envsubst '${BACKEND_URL} ${SSL_CERT_PATH} ${SSL_KEY_PATH}' < /etc/nginx/conf.d/default.conf > /tmp/nginx.conf \
    && mv /tmp/nginx.conf /etc/nginx/conf.d/default.conf
```

- [ ] **Step 3: 提交**

```bash
git add docker/nginx.conf docker/nginx-entrypoint.sh
git commit -m "feat(security): Nginx HTTPS 终止 + CSP/HSTS/Permissions-Policy 安全头"
```

---

### Task 2: ASP.NET Core 安全中间件增强

**Files:**
- Modify: `src/EquipAI.WebAPI/Program.cs:77-100`（中间件管线区域）
- Modify: `src/EquipAI.Infrastructure/Middleware/SecurityHeadersMiddleware.cs`

- [ ] **Step 1: 在 Program.cs 中添加 HSTS 和 HTTPS 重定向（仅非代理模式）**

在 `Program.cs` 中，在 `app.UseMiddleware<ExceptionHandlingMiddleware>()` 之前（约第 77 行前），添加以下代码：

```csharp
    // 生产环境 HTTPS 安全（当不在反向代理之后时启用）
    // BEHIND_PROXY=true 时由 Nginx 负责 TLS 终止，后端不需要 HTTPS 重定向
    var behindProxy = builder.Configuration["BEHIND_PROXY"]?.Equals("true", StringComparison.OrdinalIgnoreCase) == true;
    if (!behindProxy && !app.Environment.IsDevelopment())
    {
        app.UseHsts();
        app.UseHttpsRedirection();
    }
```

同时修改 `builder` 变量声明为可访问：确认 `var builder = WebApplication.CreateBuilder(args);` 在作用域内，以上代码放在 `var app = builder.Build();` 之后、中间件管线之前。

- [ ] **Step 2: 更新 SecurityHeadersMiddleware 添加 Permissions-Policy 和 X-Permitted-Cross-Domain-Policies**

在 `SecurityHeadersMiddleware.cs` 的 `InvokeAsync` 方法中，在 `await _next(context);` 之前添加：

```csharp
        // 限制浏览器 API 访问（摄像头、麦克风、地理位置、支付）
        context.Response.Headers.Append("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
        // 禁止跨域策略文件
        context.Response.Headers.Append("X-Permitted-Cross-Domain-Policies", "none");
```

注意：CSP 和 HSTS 头已由 Nginx 添加，后端 SecurityHeadersMiddleware 不重复添加。当 `BEHIND_PROXY=false` 时（后端直接对外），SecurityHeadersMiddleware 也应添加这些头。但由于生产环境始终通过 Nginx，此处仅添加 Nginx 不覆盖的头。

- [ ] **Step 3: 构建验证**

Run: `dotnet build EquipAI.slnx`
Expected: BUILD SUCCEEDED，无错误

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.WebAPI/Program.cs src/EquipAI.Infrastructure/Middleware/SecurityHeadersMiddleware.cs
git commit -m "feat(security): ASP.NET HSTS/HTTPS 重定向 + 安全头增强"
```

---

### Task 3: 依赖安全审计

**Files:**
- 无代码修改（仅审计和升级依赖版本）

- [ ] **Step 1: 后端依赖漏洞扫描**

Run: `dotnet list package --vulnerable --include-transitive`
Expected: 无已知漏洞。如果有输出，逐个升级到安全版本。

- [ ] **Step 2: 前端依赖漏洞扫描**

Run: `cd frontend && npm audit`
Expected: 0 个高危漏洞。如果有高危，运行 `npm audit fix` 或手动升级。

- [ ] **Step 3: 如有修复，提交**

```bash
git add -A
git commit -m "fix: 修复安全审计发现的高危依赖漏洞"
```

如果没有发现漏洞，跳过此步骤。

---

### Task 4: 敏感配置审计

**Files:**
- Modify: `docker/.env.example`
- Modify: `docker/docker-compose.yml:69-83`（backend environment 区域）

- [ ] **Step 1: 补全 .env.example 缺失的敏感配置**

在 `docker/.env.example` 末尾追加：

```env
# VAPID 推送证书（Web Push 所需，使用 npx web-push generate-vapid-keys 生成）
VAPID__SUBJECT=mailto:admin@example.com
VAPID__PUBLICKEY=
VAPID__PRIVATEKEY=

# 域名（用于 HSTS 和 Cookie 配置）
DOMAIN=localhost

# 是否在反向代理（Nginx）之后
BEHIND_PROXY=true

# TLS 证书路径（容器内路径，通过 volume 挂载）
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem
```

- [ ] **Step 2: 在 docker-compose.yml backend environment 中补全 VAPID 配置**

在 `docker-compose.yml` 的 `backend` 服务的 `environment` 区域（`Llm__Endpoint` 之后）添加：

```yaml
      Vapid__Subject: "${VAPID__SUBJECT:-mailto:admin@example.com}"
      Vapid__PublicKey: "${VAPID__PUBLICKEY:-}"
      Vapid__PrivateKey: "${VAPID__PRIVATEKEY:-}"
      BEHIND_PROXY: "${BEHIND_PROXY:-true}"
```

在 `frontend` 服务的 `environment` 区域（`BACKEND_URL` 之后）添加：

```yaml
      SSL_CERT_PATH: "${SSL_CERT_PATH:-/etc/nginx/ssl/cert.pem}"
      SSL_KEY_PATH: "${SSL_KEY_PATH:-/etc/nginx/ssl/key.pem}"
```

- [ ] **Step 3: 审计确认所有敏感配置已环境变量化**

逐项检查：
- `JWT_SECRET` → `docker-compose.yml` 已通过 `${JWT_SECRET}` 注入 ✓
- `PG_PASSWORD` → 已通过 `${PG_PASSWORD}` 注入 ✓
- `LLM_API_KEY` → 已通过 `${LLM_API_KEY}` 注入 ✓
- `REDIS_PASSWORD` → 已通过 `${REDIS_PASSWORD}` 注入 ✓
- `VAPID__PUBLICKEY/PRIVATEKEY` → Step 2 已添加 ✓
- `GATEWAY_AUTH_KEY` → 仅在 EdgeGateway appsettings 中引用，EdgeGateway 不在 docker-compose 中部署（独立边缘设备），无需在 .env 中配置 ✓

- [ ] **Step 4: 提交**

```bash
git add docker/.env.example docker/docker-compose.yml
git commit -m "feat(config): 补全环境变量模板 — VAPID、TLS、BEHIND_PROXY"
```
