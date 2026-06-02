# Phase 4B+4D：压力测试 + 生产就绪 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建 k6 压力测试脚本验证系统性能，增强健康检查探针（MQTT、LLM 连通性），实现遥测数据自动清理后台服务，优化 Docker 生产配置。

**Architecture:** k6 脚本放在 `tests/stress/` 目录下模拟多用户并发场景；健康检查使用 ASP.NET Core `IHealthCheck` 接口扩展自定义探针；数据清理使用 `IHostedService` + 定时执行；Docker 优化添加资源限制和非 root 用户。

**Tech Stack:** k6（JavaScript 测试脚本）、ASP.NET Core HealthChecks、IHostedService、Docker Compose

---

## 文件结构

```
tests/
├── stress/
│   ├── k6/
│   │   ├── login.js                                  -- 登录压测
│   │   ├── devices.js                                -- 设备 API 压测
│   │   ├── telemetry.js                              -- 遥测数据写入压测
│   │   ├── alerts.js                                 -- 告警查询压测
│   │   ├── full-workflow.js                          -- 完整工作流压测
│   │   └── config.js                                 -- 共享配置（baseURL、登录函数）
│   ├── package.json                                  -- k6 依赖（k6 个别需要单独安装）
│   └── README.md                                     -- 压测说明文档
src/EquipAI.Infrastructure/
├── HealthChecks/
│   ├── MqttHealthCheck.cs                            -- MQTT 连通性检查
│   └── LlmHealthCheck.cs                             -- LLM API 连通性检查
├── Services/
│   └── TelemetryCleanupService.cs                    -- 遥测数据清理后台服务
src/EquipAI.WebAPI/
├── Extensions/ServiceCollectionExtensions.cs         -- 注册健康检查和清理服务
docker/
├── docker-compose.yml                                -- 添加资源限制
├── Dockerfile.backend                                -- 非 root 用户 + 安全优化
```

---

### Task 1: k6 压力测试脚本

**Files:**
- Create: `tests/stress/k6/config.js`
- Create: `tests/stress/k6/login.js`
- Create: `tests/stress/k6/devices.js`
- Create: `tests/stress/k6/telemetry.js`
- Create: `tests/stress/k6/alerts.js`
- Create: `tests/stress/k6/full-workflow.js`

- [ ] **Step 1: 创建共享配置**

```javascript
// tests/stress/k6/config.js
import http from 'k6/http';

/**
 * k6 压测共享配置
 * BASE_URL 从环境变量读取，默认 http://localhost:8080
 */
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

/**
 * 登录获取 JWT Token
 * 使用管理员账号登录（需确保 DataSeeder 已创建种子数据）
 */
export function login(username = 'admin', password = 'Admin@123') {
  const resp = http.post(`${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ username, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (resp.status !== 200) {
    throw new Error(`登录失败: ${resp.status} ${resp.body}`);
  }

  return resp.json('token');
}

/**
 * 创建带认证的请求头
 */
export function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}
```

- [ ] **Step 2: 创建登录压测脚本**

```javascript
// tests/stress/k6/login.js
import http from 'k6';
import { check, sleep } from 'k6';
import { BASE_URL } from './config.js';

// 测试场景：50 个虚拟用户，持续 30 秒
export const options = {
  stages: [
    { duration: '10s', target: 20 },
    { duration: '10s', target: 50 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  const resp = http.post(`${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ username: 'admin', password: 'Admin@123' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(resp, {
    '登录成功': (r) => r.status === 200,
    '返回 token': (r) => r.json('token') !== undefined,
    '响应时间 < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
```

- [ ] **Step 3: 创建设备 API 压测脚本**

```javascript
// tests/stress/k6/devices.js
import http from 'k6';
import { check, sleep } from 'k6';
import { BASE_URL, login, authHeaders } from './config.js';

export const options = {
  stages: [
    { duration: '15s', target: 30 },
    { duration: '30s', target: 30 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
  },
};

export function setup() {
  return { token: login() };
}

export default function (data) {
  const headers = authHeaders(data.token);

  // 查询设备列表
  const listResp = http.get(`${BASE_URL}/api/v1/devices?page=1&pageSize=20`, { headers });
  check(listResp, {
    '设备列表 200': (r) => r.status === 200,
    '返回分页数据': (r) => r.json('items') !== undefined,
  });

  sleep(0.5);
}
```

- [ ] **Step 4: 创建遥测数据写入压测**

```javascript
// tests/stress/k6/telemetry.js
import http from 'k6';
import { check, sleep } from 'k6';
import { BASE_URL, login, authHeaders } from './config.js';

export const options = {
  stages: [
    { duration: '10s', target: 10 },
    { duration: '60s', target: 50 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.02'],
  },
};

export function setup() {
  return { token: login() };
}

export default function (data) {
  const headers = authHeaders(data.token);
  const deviceId = __ENV.DEVICE_ID || '00000000-0000-0000-0000-000000000001';
  const metrics = ['temperature', 'pressure', 'vibration', 'humidity'];

  // 模拟遥测数据上报（通过 MQTT 代理或直接写入 API）
  // 这里测试的是设备详情页的遥测数据查询
  const resp = http.get(
    `${BASE_URL}/api/v1/devices/${deviceId}/telemetry?metric=${metrics[Math.floor(Math.random() * metrics.length)]}&range=24hours`,
    { headers }
  );

  check(resp, {
    '遥测查询 200': (r) => r.status === 200 || r.status === 404,
  });

  sleep(0.2);
}
```

- [ ] **Step 5: 创建告警查询压测**

```javascript
// tests/stress/k6/alerts.js
import http from 'k6';
import { check, sleep } from 'k6';
import { BASE_URL, login, authHeaders } from './config.js';

export const options = {
  stages: [
    { duration: '15s', target: 20 },
    { duration: '30s', target: 40 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export function setup() {
  return { token: login() };
}

export default function (data) {
  const headers = authHeaders(data.token);

  const resp = http.get(`${BASE_URL}/api/v1/alerts?page=1&pageSize=20`, { headers });
  check(resp, {
    '告警列表 200': (r) => r.status === 200,
  });

  sleep(0.5);
}
```

- [ ] **Step 6: 创建完整工作流压测**

```javascript
// tests/stress/k6/full-workflow.js
import http from 'k6';
import { check, sleep } from 'k6';
import { BASE_URL, login, authHeaders } from './config.js';

// 模拟真实用户操作流程：登录 → 查看仪表盘 → 查看设备 → 查看告警 → 查看工单
export const options = {
  stages: [
    { duration: '20s', target: 20 },
    { duration: '60s', target: 20 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.05'],
  },
};

export function setup() {
  return { token: login() };
}

export default function (data) {
  const headers = authHeaders(data.token);

  // 1. 仪表盘
  const dashResp = http.get(`${BASE_URL}/api/v1/dashboard/summary`, { headers });
  check(dashResp, { '仪表盘': (r) => r.status === 200 || r.status === 404 });

  sleep(1);

  // 2. 设备列表
  const devResp = http.get(`${BASE_URL}/api/v1/devices?page=1&pageSize=20`, { headers });
  check(devResp, { '设备列表': (r) => r.status === 200 });

  sleep(0.5);

  // 3. 告警中心
  const alertResp = http.get(`${BASE_URL}/api/v1/alerts?page=1&pageSize=20`, { headers });
  check(alertResp, { '告警列表': (r) => r.status === 200 });

  sleep(0.5);

  // 4. 工单列表
  const woResp = http.get(`${BASE_URL}/api/v1/work-orders?page=1&pageSize=20`, { headers });
  check(woResp, { '工单列表': (r) => r.status === 200 });

  sleep(2);
}
```

- [ ] **Step 7: 提交**

```bash
git add tests/stress/
git commit -m "feat: k6 压力测试脚本 — 登录、设备、遥测、告警、完整工作流"
```

---

### Task 2: 健康检查增强

**Files:**
- Create: `src/EquipAI.Infrastructure/HealthChecks/MqttHealthCheck.cs`
- Create: `src/EquipAI.Infrastructure/HealthChecks/LlmHealthCheck.cs`
- Modify: `src/EquipAI.WebAPI/Program.cs` — 注册自定义健康检查
- Modify: `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs` — 注册健康检查类

- [ ] **Step 1: 创建 MQTT 健康检查**

```csharp
// src/EquipAI.Infrastructure/HealthChecks/MqttHealthCheck.cs
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace EquipAI.Infrastructure.HealthChecks;

/// <summary>
/// MQTT 代理连通性健康检查
/// 通过尝试建立 TCP 连接验证 MQTT 代理可达性
/// </summary>
public class MqttHealthCheck : IHealthCheck
{
    private readonly string _host;
    private readonly int _port;

    public MqttHealthCheck(IConfiguration configuration)
    {
        _host = configuration["Mqtt:Host"] ?? "localhost";
        _port = int.TryParse(configuration["Mqtt:Port"], out var port) ? port : 1883;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken ct = default)
    {
        try
        {
            using var tcpClient = new System.Net.Sockets.TcpClient();
            await tcpClient.ConnectAsync(_host, _port, ct);

            return tcpClient.Connected
                ? HealthCheckResult.Healthy($"MQTT 代理 {_host}:{_port} 连接正常")
                : HealthCheckResult.Degraded($"MQTT 代理 {_host}:{_port} 未连接");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy($"MQTT 代理 {_host}:{_port} 不可达", ex);
        }
    }
}
```

- [ ] **Step 2: 创建 LLM 健康检查**

```csharp
// src/EquipAI.Infrastructure/HealthChecks/LlmHealthCheck.cs
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace EquipAI.Infrastructure.HealthChecks;

/// <summary>
/// LLM API 连通性健康检查
/// 通过发送一个极简请求验证 LLM 服务可达性
/// </summary>
public class LlmHealthCheck : IHealthCheck
{
    private readonly ILLMService _llmService;
    private readonly ILogger<LlmHealthCheck> _logger;

    public LlmHealthCheck(ILLMService llmService, ILogger<LlmHealthCheck> logger)
    {
        _llmService = llmService;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken ct = default)
    {
        try
        {
            var result = await _llmService.AnalyzeAsync(
                new LLMRequest("系统健康检查", "请回复 OK"), ct);

            if (!result.Success)
            {
                return HealthCheckResult.Degraded($"LLM 服务返回失败: {result.ErrorMessage}");
            }

            return HealthCheckResult.Healthy("LLM 服务正常");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "LLM 健康检查失败");
            return HealthCheckResult.Degraded($"LLM 服务不可达: {ex.Message}");
        }
    }
}
```

- [ ] **Step 3: 注册健康检查**

在 `Program.cs` 的健康检查注册区域（行 45-47），替换为：

```csharp
builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("Default")!, name: "postgresql")
    .AddRedis(builder.Configuration["Redis:ConnectionString"]!, name: "redis")
    .AddCheck<MqttHealthCheck>("mqtt", tags: new[] { "infra" })
    .AddCheck<LlmHealthCheck>("llm", tags: new[] { "infra" }, timeout: TimeSpan.FromSeconds(5));
```

添加 using:
```csharp
using EquipAI.Infrastructure.HealthChecks;
```

- [ ] **Step 4: 在 Program.cs 映射详细健康检查端点**

替换现有的 `app.MapHealthChecks("/health");`（行 97）为：

```csharp
// 基础健康检查（仅 PG + Redis）
app.MapHealthChecks("/health");

// 详细健康检查（包含 MQTT、LLM 等全部探针）
app.MapHealthChecks("/health/detail", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
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

- [ ] **Step 5: 注册 MqttClientService 和 LlmHealthCheck**

在 `ServiceCollectionExtensions.cs` 的 `AddInfrastructure` 方法中确认 `MqttClientService` 已注册为 Singleton（应该已有）。确认 `ILLMService` 也已注册。

- [ ] **Step 6: 编译确认**

Run: `dotnet build EquipAI.slnx`
Expected: 编译成功

- [ ] **Step 7: 提交**

```bash
git add src/EquipAI.Infrastructure/HealthChecks/ src/EquipAI.WebAPI/Program.cs src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs
git commit -m "feat: 健康检查增强 — MQTT/LLM 探针 + 详细健康报告端点"
```

---

### Task 3: 遥测数据清理后台服务

**Files:**
- Create: `src/EquipAI.Application/Telemetry/TelemetryCleanupService.cs`
- Modify: `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs` — 注册后台服务

- [ ] **Step 1: 创建 TelemetryCleanupService**

```csharp
// src/EquipAI.Application/Telemetry/TelemetryCleanupService.cs
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Telemetry;

/// <summary>
/// 遥测数据清理后台服务
/// 定期清理超过数据保留期限的遥测数据
/// 默认每天凌晨 3 点执行一次，清理租户设定保留天数之前的数据
/// </summary>
public class TelemetryCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TelemetryCleanupService> _logger;

    public TelemetryCleanupService(IServiceScopeFactory scopeFactory, ILogger<TelemetryCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("遥测数据清理服务已启动");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // 计算下次执行时间（次日凌晨 3 点）
                var now = DateTime.UtcNow;
                var nextRun = now.Date.AddDays(1).AddHours(3);
                var delay = nextRun - now;

                _logger.LogInformation("下次清理执行时间: {NextRun}（{Delay} 后）", nextRun, delay);

                await Task.Delay(delay, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            await CleanupAsync(stoppingToken);
        }

        _logger.LogInformation("遥测数据清理服务已停止");
    }

    private async Task CleanupAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        _logger.LogInformation("开始清理过期遥测数据...");

        try
        {
            // 获取所有租户的保留天数（不经过租户过滤器）
            var tenants = await db.UnfilteredSet<Core.Entities.Tenant>()
                .Where(t => t.IsActive)
                .Select(t => new { t.Id, t.DataRetentionDays })
                .ToListAsync(ct);

            var totalDeleted = 0;

            foreach (var tenant in tenants)
            {
                var cutoff = DateTime.UtcNow.AddDays(-tenant.DataRetentionDays);

                // 使用原始 SQL 批量删除（TimescaleDB 超级表高效删除）
                var deleted = await db.Database.ExecuteSqlRawAsync(
                    @"DELETE FROM device_telemetry
                      WHERE device_id IN (
                        SELECT id FROM devices WHERE tenant_id = {0}
                      ) AND time < {1}",
                    ct, tenant.Id, cutoff);

                if (deleted > 0)
                {
                    _logger.LogInformation("租户 {TenantId}: 清理 {Count} 条过期遥测数据（保留 {Days} 天）",
                        tenant.Id, deleted, tenant.DataRetentionDays);
                    totalDeleted += deleted;
                }
            }

            _logger.LogInformation("遥测数据清理完成，共清理 {Total} 条记录", totalDeleted);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "遥测数据清理失败");
        }
    }
}
```

- [ ] **Step 2: 注册后台服务**

在 `ServiceCollectionExtensions.cs` 的 `AddApplication` 方法中添加：

```csharp
// 遥测数据清理后台服务
services.AddHostedService<TelemetryCleanupService>();
```

添加 using: `using EquipAI.Application.Telemetry;`（应该已存在）

- [ ] **Step 3: 编译确认**

Run: `dotnet build EquipAI.slnx`
Expected: 编译成功

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.Application/Telemetry/TelemetryCleanupService.cs src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs
git commit -m "feat: 遥测数据清理后台服务 — 按租户保留天数自动清理过期数据"
```

---

### Task 4: Docker 生产优化

**Files:**
- Modify: `docker/Dockerfile.backend` — 非 root 用户 + 安全优化
- Modify: `docker/docker-compose.yml` — 添加资源限制

- [ ] **Step 1: 优化 Dockerfile.backend**

将当前 Dockerfile.backend 修改为：

```dockerfile
# 阶段1：构建
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 先复制项目文件并还原依赖（利用 Docker 层缓存）
COPY src/EquipAI.Core/EquipAI.Core.csproj EquipAI.Core/
COPY src/EquipAI.Application/EquipAI.Application.csproj EquipAI.Application/
COPY src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj EquipAI.Infrastructure/
COPY src/EquipAI.WebAPI/EquipAI.WebAPI.csproj EquipAI.WebAPI/
RUN dotnet restore EquipAI.WebAPI/EquipAI.WebAPI.csproj

# 复制完整源码并构建
COPY src/ ./
RUN dotnet publish EquipAI.WebAPI/EquipAI.WebAPI.csproj \
    -c Release -o /app/publish

# 阶段2：运行
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# 安装 ICU 库（中文等 Unicode 排序所需）
RUN apt-get update && apt-get install -y --no-install-recommends libicu-dev \
    && rm -rf /var/lib/apt/lists/*

# 创建非 root 用户运行应用
RUN groupadd -r equipai && useradd -r -g equipai equipai

COPY --from=build /app/publish .

# 设置文件所有权
RUN chown -R equipai:equipai /app

ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_System_Globalization_Invariant=false

# 切换到非 root 用户
USER equipai

EXPOSE 8080

ENTRYPOINT ["dotnet", "EquipAI.WebAPI.dll"]
```

- [ ] **Step 2: 优化 docker-compose.yml — 添加资源限制**

在每个服务下添加 `deploy.resources.limits`：

```yaml
# 在 postgres 服务下添加：
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G

# 在 redis 服务下添加：
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

# 在 backend 服务下添加：
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G

# 在 frontend 服务下添加：
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
```

- [ ] **Step 3: 提交**

```bash
git add docker/Dockerfile.backend docker/docker-compose.yml
git commit -m "feat: Docker 生产优化 — 非 root 用户 + 资源限制"
```
