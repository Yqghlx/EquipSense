# v1.0 发布准备：安全加固 + 生产化部署设计

## 背景

Phase 1-3 已全部完成，项目已具备完整的业务功能。经代码审查发现，Phase 2（OPC UA/Modbus 适配器、边缘网关、ML.NET L4 异常检测）和 Phase 4（压力测试套件、基础安全措施）的大部分工作也已在前期实现。

**当前已有的基础设施：**
- Docker Compose 生产配置（含 PostgreSQL/TimescaleDB、Redis、Mosquitto、Nginx 反向代理）
- 多阶段 Dockerfile（后端 .NET 8 + 前端 Node 22 + Nginx）
- SecurityHeadersMiddleware（X-Content-Type-Options、X-Frame-Options、X-XSS-Protection、Referrer-Policy）
- Rate Limiting（固定窗口 60 次/分钟）
- Health Checks（PostgreSQL、Redis、MQTT、LLM 连通性检查）
- K6 压力测试套件（遥测、告警、设备、登录、完整工作流）
- 非root 容器用户、资源限制

**缺失项（本次补齐）：**
- HTTPS 强制（生产环境 Nginx TLS 终止）
- 安全头完善（CSP、HSTS、Permissions-Policy）
- 依赖安全审计
- 自动数据库迁移
- 健康检查端点增强（启动探针 vs 存活探针）
- 版本号管理
- 部署文档

---

## 子计划 A：安全加固

### A1. Nginx HTTPS + 安全头增强

**修改文件：** `docker/nginx.conf`

**改动内容：**

1. **HTTPS 监听**：新增 443 端口监听，TLS 证书通过 volume 挂载
2. **HTTP → HTTPS 重定向**：80 端口请求 301 跳转到 HTTPS
3. **安全头增强**：
   - `Content-Security-Policy`：限制脚本/样式/图片来源
   - `Strict-Transport-Security`：`max-age=31536000; includeSubDomains`
   - `Permissions-Policy`：限制摄像头/麦克风/地理位置等浏览器 API
   - `X-Permitted-Cross-Domain-Policies`：`none`
4. **TLS 配置**：仅允许 TLS 1.2+，禁用弱密码套件
5. **Gzip 压缩**：启用静态资源压缩

**CSP 策略设计：**
```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self';
connect-src 'self' wss: https:;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

注意：`style-src` 需要 `'unsafe-inline'` 因为 TailwindCSS/shadcn 组件使用内联样式。`connect-src` 需要 `wss:` 支持 SignalR WebSocket。

### A2. ASP.NET Core 安全中间件增强

**修改文件：** `src/EquipAI.WebAPI/Program.cs`

1. 生产环境添加 `UseHsts()`（在 `UseHttpsRedirection()` 之前）
2. 生产环境添加 `UseHttpsRedirection()`
3. `SecurityHeadersMiddleware` 添加 CSP 和 HSTS 头（仅在非 Nginx 代理时生效）

**注意：** 当 Nginx 负责 TLS 终止时，后端不需要 HTTPS 重定向。通过环境变量 `BEHIND_PROXY=true`（默认 `false`）控制 — 当为 `true` 时跳过 `UseHsts()` 和 `UseHttpsRedirection()`。

### A3. 依赖安全审计

1. 后端：`dotnet list package --vulnerable` + 修复
2. 前端：`npm audit` + 修复高危漏洞
3. Docker 镜像：使用官方 slim/alpine 基础镜像，定期更新

### A4. 敏感配置审计

确保所有敏感配置通过环境变量注入，不在代码中硬编码：
- `JWT_SECRET` ✓ 已环境变量化
- `PG_PASSWORD` ✓ 已环境变量化
- `LLM_API_KEY` ✓ 已环境变量化
- `VAPID 公钥/私钥` ✓ 在 appsettings 中占位，生产通过环境变量
- `Redis 密码` ✓ 已环境变量化
- `GATEWAY_AUTH_KEY` — 需要检查是否已环境变量化

---

## 子计划 B：Docker Compose 生产化

### B1. docker-compose.prod.yml 改进

**修改文件：** `docker/docker-compose.yml`

1. **Nginx TLS 配置**：添加 443 端口映射和证书 volume
2. **Redis 持久化**：添加 `appendonly yes` 和 volume
3. **PostgreSQL 自动迁移**：后端启动时自动运行 `dotnet ef database update`
4. **日志配置**：JSON 日志输出到 stdout（Docker 日志驱动采集）
5. **Mosquitto 认证**：添加密码文件配置
6. **备份 volume**：PostgreSQL 备份目录

### B2. 后端 Dockerfile 启动脚本

**修改文件：** `docker/Dockerfile.backend`

添加 entrypoint 脚本：
1. 等待 PostgreSQL 就绪（循环检查 `pg_isready`）
2. 运行 `dotnet ef database update`（自动迁移）
3. 启动应用

### B3. 环境变量模板完善

**修改文件：** `docker/.env.example`

补充缺失的环境变量：
- `SSL_CERT_PATH` / `SSL_KEY_PATH`（TLS 证书路径）
- `VAPID__PUBLICKEY` / `VAPID__PRIVATEKEY`
- `DOMAIN`（域名配置）
- `BEHIND_PROXY`（是否在反向代理之后）

---

## 子计划 C：健康检查 + 监控端点

### C1. ASP.NET Core Health Checks 增强

**修改文件：** `src/EquipAI.WebAPI/Program.cs`

当前已有 `/health` 和 `/health/detail` 端点。增强：
1. 区分 **启动探针**（`/health/startup`）和 **存活探针**（`/health`）
   - 启动探针：仅检查数据库连接（用于 Docker healthcheck）
   - 存活探针：检查所有依赖（数据库 + Redis + MQTT）
2. 添加 `/health/ready` 就绪探针（含 SignalR Hub 可达性检查）
3. 响应格式统一为 JSON

### C2. Docker Health Check 配置

**修改文件：** `docker/docker-compose.yml`

后端服务添加 healthcheck：
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/health/startup"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

前端（Nginx）添加 healthcheck：
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:80/health"]
  interval: 30s
  timeout: 5s
  retries: 3
```

Nginx 需要添加 `/health` 端点（返回 200）。

---

## 子计划 D：版本号管理

### D1. 版本统一管理

1. 后端：在 `EquipAI.WebAPI.csproj` 中设置 `<Version>1.0.0</Version>`
2. 前端：在 `package.json` 中设置 `"version": "1.0.0"`
3. Docker 镜像标签：`equipai-backend:1.0.0`、`equipai-frontend:1.0.0`
4. `/api/v1/system/info` 端点：返回版本号、构建时间、运行环境

### D2. 构建信息注入

后端通过 `SourceRevisionId`（.NET 8 内置 git commit 注入）获取 commit hash。
前端通过 `import.meta.env.VITE_BUILD_TIME` 和 `VITE_GIT_HASH` 注入。

---

## 子计划 E：部署文档

### E1. DEPLOY.md

创建 `docs/DEPLOY.md`，包含：

1. **系统要求**：Docker 24+、Docker Compose v2、最低硬件配置
2. **快速启动**：
   ```bash
   cp docker/.env.example docker/.env
   # 编辑 .env 填入真实密码和密钥
   docker compose -f docker/docker-compose.yml up -d
   ```
3. **TLS 证书配置**：Let's Encrypt / 自签名证书步骤
4. **环境变量清单**：每个变量的说明和默认值
5. **首次启动**：管理员账户创建、默认配置
6. **备份与恢复**：PostgreSQL 备份命令、volume 管理
7. **日志查看**：`docker compose logs` 命令
8. **升级步骤**：版本升级流程
9. **常见问题排查**：端口冲突、权限问题、连接失败

---

## 实施顺序

```
A1 (Nginx HTTPS + 安全头) → A2 (ASP.NET 安全中间件) → A3 (依赖审计) → A4 (配置审计)
                                                                      ↓
B1 (Docker Compose 改进) → B2 (启动脚本) → B3 (环境变量模板)
                                              ↓
C1 (Health Checks 增强) → C2 (Docker Health Check)
                            ↓
D1 (版本管理) → D2 (构建信息注入)
                 ↓
E1 (DEPLOY.md)
```

推荐拆分为 3 个并行组：
- **组 1**：A1-A4（安全加固，改 nginx.conf + Program.cs + 审计）
- **组 2**：B1-B3 + C1-C2（Docker 生产化 + 健康检查）
- **组 3**：D1-D2 + E1（版本管理 + 文档）

## 验收标准

1. `docker compose up -d` 一键启动，所有服务健康
2. HTTPS 访问正常，HTTP 自动跳转
3. 浏览器安全头检查（如 securityheaders.com）达到 B+ 以上
4. `dotnet list package --vulnerable` 无已知漏洞
5. `npm audit` 无高危漏洞
6. `/health` 返回所有依赖状态
7. `/api/v1/system/info` 返回版本信息
8. DEPLOY.md 覆盖完整部署流程
