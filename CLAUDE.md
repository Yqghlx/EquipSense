# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

EquipSense（内部代号 EquipAI）是一个工业设备智能监控与预测维护平台。核心目标：**在故障发生前预警，在告警触发后秒级给出根因和建议，在确认问题后自动创建工单闭环。**

完整技术方案（2,457 行）见 `docs/FINAL_TECHNICAL_DESIGN.md`，涵盖系统架构、数据库 Schema、API 规范、安全设计、开发路线图等所有细节。

## 开发命令

### 后端 (.NET 8)

```bash
# 构建项目
dotnet build EquipAI.slnx

# 运行后端（监听 http://localhost:8080）
dotnet run --project src/EquipAI.WebAPI

# 运行单元测试
dotnet test tests/EquipAI.Tests.Unit

# 运行集成测试
dotnet test tests/EquipAI.Tests.Integration

# 运行单个测试类
dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~AlertServiceTests"

# 清理构建产物
dotnet clean
```

### 前端 (React 19 + TypeScript)

```bash
cd frontend

# 安装依赖
npm install

# 开发模式（监听 http://localhost:5173）
npm run dev

# 类型检查
npx tsc -p tsconfig.json --noEmit

# Lint 检查
npm run lint

# 运行单元测试 (Vitest)
npm run test

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### E2E 测试 (Playwright)

```bash
cd frontend

# 安装 Playwright 浏览器
npx playwright install

# 运行 E2E 测试
npx playwright test

# 运行特定测试文件
npx playwright test tests/e2e/device-management.spec.ts

# 调试模式
npx playwright test --debug

# 查看测试报告
npx playwright show-report
```

### 模拟器（发送测试遥测数据）

```bash
# 向指定租户的 3 个设备每 5 秒发送遥测数据（5% 概率触发异常）
dotnet run --project tools/EquipAI.Simulator -- \
  --tenant 11111111-1111-1111-1111-111111111111 \
  --devices 3 \
  --interval 5
```

### Docker 环境

```bash
# 开发环境基础设施（PostgreSQL + TimescaleDB + Redis + Mosquitto）
docker compose -f docker/docker-compose.dev.yml up -d

# 生产环境全套服务（前端 + 后端 + 数据库 + Redis + Mosquitto + Seq + Prometheus + Grafana + 边缘网关）
docker compose -f docker/docker-compose.yml up -d --build

# 停止服务
docker compose -f docker/docker-compose.yml down

# 查看日志
docker compose -f docker/docker-compose.yml logs -f backend
```

**环境变量配置：**
首次启动前需创建 `docker/.env` 文件（参考 `docker/.env.example`），设置：
- `PG_PASSWORD`（PostgreSQL 密码，必填）
- `JWT_SECRET`（JWT 签名密钥，≥32 字符，必填）
- `LLM_API_KEY`（可选，未配置时 AI 分析降级为规则匹配）
- 默认管理员账号：`admin / Admin@123`

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | .NET 8 WebAPI（模块化单体），EF Core 8 + Npgsql |
| 前端 | React 19 + TypeScript (strict) + Vite + shadcn/ui + TailwindCSS |
| 状态管理 | Zustand（仅 auth + notifications 两个 store）+ TanStack Query（服务端状态） |
| 数据库 | PostgreSQL 16 + TimescaleDB（业务 + 时序一体化） |
| 缓存 | Redis 7 |
| 实时通信 | SignalR（按租户分组隔离） |
| 工业协议 | MQTT（MQTTnet + Mosquitto） |
| AI/ML | LLM（通义千问 / GLM via DashScope）+ ML.NET（L4 异常检测） |
| 图表 | ECharts |
| 表单 | React Hook Form + Zod |
| 测试 | xUnit + Vitest + Playwright |
| 日志/监控 | Serilog + Seq + Prometheus + Grafana |
| 容器 | Docker Compose |
| CI/CD | GitHub Actions |

## 项目结构

```
EquipSense/
├── src/                           # 后端源码
│   ├── EquipAI.WebAPI/           # ASP.NET Core 入口（Controllers、Hub、中间件、DI 注册）
│   ├── EquipAI.Core/             # 领域层（实体、接口、事件、枚举）
│   ├── EquipAI.Application/      # 应用层（业务逻辑，按模块分文件夹）
│   ├── EquipAI.Infrastructure/   # 基础设施层（EF Core、Redis、MQTT、JWT）
│   ├── EquipAI.EdgeGateway/      # 边缘网关（独立部署，独立 Dockerfile）
│   └── EquipAI.Simulator/        # MQTT 遥测数据模拟器
├── frontend/                      # 前端源码
│   └── src/
│       ├── pages/                # 页面组件（22 个，全部懒加载）
│       ├── components/           # 通用组件（ui/、charts/、alert/ 等）
│       ├── hooks/                # TanStack Query hooks
│       ├── stores/               # Zustand stores（仅 authStore + notificationStore）
│       ├── lib/                  # API 客户端、SignalR 连接、QueryClient 配置
│       ├── i18n/                 # 国际化（中英文）
│       └── types/                # TypeScript 类型定义
├── tests/                         # 测试项目
│   ├── EquipAI.Tests.Unit/       # xUnit 单元测试
│   ├── EquipAI.Tests.Integration/ # Testcontainers 集成测试
│   ├── e2e/                      # Playwright E2E 测试
│   └── stress/                   # 压力测试脚本
├── docker/                        # Docker 配置
│   ├── Dockerfile.backend        # 后端多阶段构建
│   ├── Dockerfile.frontend       # 前端 Nginx 构建
│   ├── nginx.conf                # Nginx 反向代理配置
│   ├── docker-compose.yml        # 生产环境（10 个服务）
│   ├── docker-compose.dev.yml    # 开发环境基础设施
│   └── .env.example              # 环境变量模板
├── docs/                          # 文档
│   └── FINAL_TECHNICAL_DESIGN.md # 完整技术设计文档
└── .github/workflows/ci.yml      # CI/CD 流水线
```

## 架构要点

### 整体架构

```
边缘网关(.NET 8) → MQTT/HTTPS → 后端(ASP.NET Core 8 模块化单体) → PG+TimescaleDB / Redis
后端 SignalR Hub → React 19 PWA 前端
```

### 后端分层架构

**命名规范：**
- 命名空间：`EquipAI.{Layer}.{Module}`（如 `EquipAI.Application.Alerts`）
- 接口：`I` 前缀（如 `IAlertEvaluationService`）
- DTO：`{Entity}Dto` / `Create{Entity}Request` / `Update{Entity}Request`
- 仓储：`I{Entity}Repository` → `{Entity}Repository`
- 事件：`{Verb}{Entity}Event`（如 `AlertTriggeredEvent`）

**模块化单体原则：**
- 模块间通过 `IEventBus` 解耦，禁止直接调用其他模块的 Service
- 跨模块查询通过 `I{Module}QueryService` 接口，实现在 Application 层

**DI 注册：**
- `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs` 是唯一注册入口
- 三个扩展方法：`AddInfrastructure()`（DbContext、Redis、MQTT、JWT、仓储）、`AddApplication()`（~40+ 业务服务、事件总线、告警评估器、分析引擎、工单集成）、`AddJwtAuthentication()`

### 事件驱动管线（核心数据流）

`IEventBus` 实现为基于 Channel 的 `InMemoryEventBus`（容量 1000，DropOldest 策略），每个事件消费时创建独立 DI Scope。

**5 个集成事件** 及其处理器绑定（在 `Program.cs` 中注册）：

| 事件 | 处理器 | 说明 |
|------|--------|------|
| `TelemetryReceivedEvent` | `TelemetryEventHandler` | 遥测入库 |
| `AlertTriggeredEvent` | `AlertEventHandler` + `RootCauseAnalysisHandler` + `WorkOrderAutoCreateHandler` | 告警记录 + AI 分析 + 自动建单 |
| `AnalysisCompletedEvent` | `WorkOrderAnalysisHandler` | 分析结果写入工单 |
| `WorkOrderStatusChangedEvent` | `KnowledgeCaptureHandler` + `WorkOrderIntegrationHandler` | 知识沉淀 + 外部推送 |

**完整管线：** 遥测采集 → 告警检测 → AI 根因分析 → 工单创建 → 知识沉淀 + 外部集成

### 后端模块划分

- **设备管理**：设备 CRUD、类型模板、批量导入、网关管理
- **告警引擎**：三级告警（阈值 / 组合 / 基线），含聚合防风暴机制
- **工单管理**：完整生命周期管理，可插拔集成（钉钉/飞书/Maximo/Webhook）
- **AI 分析**：四级自动降级（L1 LLM 诊断 / L2 规则匹配 / L3 统计分析 / L4 ML.NET 异常检测），数据质量联动置信度
- **知识库**：规则管理、版本管理、冲突检测、AI 生成候选规则需专家验证
- **共享层**：JWT 认证、RBAC 权限、SignalR、事件总线、多租户、数据质量、订阅计费

### 多租户隔离机制（纵深防御）

```
请求 → 认证中间件(JWT) → TenantResolutionMiddleware(提取 tenant_id) → UsageLimitMiddleware → PermissionMiddleware → AuthorizationMiddleware → Controller
```

- **EF Core 全局查询过滤器**：所有含 `TenantId` 的实体自动附加 `WHERE TenantId = @current`
- **`ITenantContext`**（Scoped）：从 `HttpContext.Items` 读取，由 `TenantResolutionMiddleware` 设置
- **`UnfilteredSet<T>()`**：`AppDbContext` 提供的 `IgnoreQueryFilters()` 逃逸口，仅用于系统管理员跨租户操作
- **SignalR 租户隔离**：连接时自动加入 `tenant:{id}` 组

### 关键设计约束

- **Day 1 多租户**：所有业务表都有 `tenant_id`，EF Core 全局查询过滤器，所有查询方法必须传入 tenant_id
- **时序窄表**：`device_telemetry` 一行一个指标，新增指标不改 schema
- **UUID 主键**：适合分布式场景
- **JSONB 灵活字段**：设备参数、规则条件等用 JSONB
- **告警聚合**：30 分钟窗口内，同设备同指标第 1 次立即告警、2-3 次更新已有、超过 3 次静默
- **AI 自动降级**：数据质量评分影响分析级别和置信度乘数
- **知识沉淀安全边界**：AI 生成的规则写入 `pending_rules`，专家批准后才移入 `knowledge_rules`
- **工单可插拔**：`IWorkOrderIntegration` 接口适配钉钉/飞书/EAM/Webhook，通过 `GetServices<IWorkOrderIntegration>` 多态解析

### 边缘网关

- 项目命名空间：`EquipAI.EdgeGateway`（独立项目、独立 Dockerfile、独立 Docker Compose 服务）
- 协议适配器接口：`IProtocolAdapter`（ConnectAsync / ReadAsync / IsConnected / ProtocolType）
- 数据管线：采集 → 标准化 → 内存环形队列(10000) → SQLite(7天断网缓存) → MQTT/HTTPS 上传

### 前端架构

- **路由**：`App.tsx` 中定义，业务页面通过 `React.lazy` 懒加载，Auth 路由和业务路由分离
- **API 客户端**：`lib/api.ts` Axios 实例，自动 JWT 注入 + 刷新令牌队列（防止并发刷新）
- **SignalR**：`lib/signalr.ts` 单例连接，指数退避重连 [0, 2s, 5s, 10s, 30s]，通过 `accessTokenFactory` 传递 JWT
- **TanStack Query 配置**：5 分钟 staleTime、10 分钟 gcTime、retry=1、关闭 focus 时 refetch
- **状态管理**：仅 2 个 Zustand store（auth + notifications），所有服务端状态走 TanStack Query

### API 规范

- 前缀：`/api/v1/`
- 分页：`?page=1&pageSize=20&sort=created_at&order=desc`
- 统一错误响应：`{ code, message, details }`
- 认证：JWT（Header: `Authorization: Bearer {token}`）
- SignalR WebSocket：通过查询参数 `access_token` 传递 JWT
- 多租户：JWT 中含 tenant_id，支持 Header `X-Tenant-Id` 和子域名
- 健康检查：`/health` 返回 PostgreSQL + Redis 连通性
- API 文档：Swagger UI `http://localhost:8080/swagger`

### 数据库关键表

完整 Schema（含索引、约束、种子数据）见 `docs/FINAL_TECHNICAL_DESIGN.md` 第三章。核心表：

- `tenants` / `users` — 多租户与用户（RBAC 五角色）
- `devices` / `device_type_templates` — 设备管理（模板化设计，行业预置模板归属系统租户）
- `gateways` / `gateway_devices` — 网关与网关设备关联
- `alert_rules` / `alerts` — 告警规则与告警实例
- `work_orders` / `work_order_logs` / `work_order_approvals` — 工单、流转日志与审批
- `knowledge_rules` / `pending_rules` / `knowledge_rule_versions` — 知识库（规则双表 + 版本管理）
- `device_telemetry`（TimescaleDB 超级表）— 时序窄表，7 天自动压缩，90 天保留
- `telemetry_hourly`（连续聚合）— 小时级统计
- `analyses` / `fault_cases` — AI 分析记录与故障案例
- `notifications` / `audit_logs` / `system_configs` / `billing_records` — 通知、审计、配置、计费

**设备类型模板的租户策略：** 行业预置模板归属系统租户（`tenant_id = '00000000-0000-0000-0000-000000000000'`），查询时 `WHERE tenant_id = @current_tenant OR tenant_id = @system_tenant`。

### 安全设计

- **输入消毒中间件**：XSS 检测
- **安全头中间件**：自动添加安全响应头
- **IP 速率限制**：全局 60/min，认证端点 10/min
- **JWT 安全**：HMAC-SHA256，零时钟偏移，生产环境拒绝不安全密钥
- **CORS**：支持凭据（适配 SignalR WebSocket）

### 生产环境可观测性

Docker Compose 生产环境包含完整监控栈：
- **Seq**：结构化日志聚合（Serilog sink）
- **Prometheus**：指标采集（后端暴露 `/metrics`）
- **Grafana**：可视化仪表盘
- **健康检查**：三级探针（startup / liveness / ready），含依赖项检测

## 实现阶段核心设计原则

1. **单体优先** — Phase 1 模块化单体 + Docker Compose，不拆微服务
2. **Day 1 多租户** — 所有业务表从第一条建表语句就有 `tenant_id`，EF Core 全局查询过滤器
3. **时序窄表** — `device_telemetry` 一行一个指标，新增指标不改 schema
4. **AI 四级自动降级** — L1 LLM → L2 规则 → L3 统计 → L4 ML.NET，数据质量评分影响分析级别和置信度乘数
5. **知识沉淀安全边界** — AI 生成的规则写入 `pending_rules`，专家批准后才移入 `knowledge_rules`
6. **告警聚合防风暴** — 30 分钟窗口内，同设备同指标：第 1 次立即告警、2-3 次更新已有、超过 3 次静默
7. **工单可插拔** — `IWorkOrderIntegration` 接口适配钉钉/飞书/Maximo/Webhook

## 开发路线图

- **Phase 1（当前）**：核心闭环 — 设备 CRUD、MQTT 遥测、告警引擎、AI 根因、工单、前端完整页面、Docker 部署
- **Phase 2**：真实接入 — OPC UA / Modbus 适配器、边缘网关断网保护、知识沉淀闭环
- **Phase 3**：产品化 — 工单完整工作流、钉钉/飞书集成、PWA、多租户 SaaS 完善
- **Phase 4**：智能化 — ML.NET 异常检测、安全加固、压力测试、v1.0 发布

## RBAC 权限矩阵

| 角色 | 设备 | 告警 | 工单 | 知识库 | AI |
|------|------|------|------|--------|-----|
| 系统管理员 | CRUD | CRUD | CRUD | CRUD | CRUD |
| 维保主管 | RW | RW+配置 | RW+派工验收 | RW+验证 | R |
| 技术员 | R | R+确认 | R+执行 | R | R |
| 操作员 | R | R+确认 | R | - | R |
| 观察者 | R | R | R | R | - |

## 常用开发场景

### 添加新的业务模块

1. 在 `src/EquipAI.Core` 中定义实体、接口、事件
2. 在 `src/EquipAI.Application/{Module}` 中实现业务逻辑和事件处理器
3. 在 `src/EquipAI.Infrastructure` 中实现仓储和外部服务
4. 在 `src/EquipAI.WebAPI/Controllers` 中添加 API 端点
5. 在 `ServiceCollectionExtensions.cs` 的 `AddApplication()` 中注册新服务
6. 在 `Program.cs` 中绑定新的事件-处理器关系
7. 在 `tests/EquipAI.Tests.Unit` 中添加单元测试
8. 在 `frontend/src/hooks` 中添加 TanStack Query hook
9. 在 `frontend/src/pages` 中添加页面组件
10. 在 `App.tsx` 中添加路由（使用 `React.lazy` 懒加载）

### 运行数据库迁移

后端首次启动时自动执行迁移和种子数据初始化。如需手动迁移：

```bash
cd src/EquipAI.Infrastructure
dotnet ef migrations add <MigrationName> --startup-project ../EquipAI.WebAPI
dotnet ef database update --startup-project ../EquipAI.WebAPI
```

### 调试 SignalR 实时推送

前端 SignalR 连接配置在 `frontend/src/lib/signalr.ts`。后端 Hub 位于 `src/EquipAI.WebAPI/Hubs/IndustrialHub.cs`。

连接时自动加入租户分组：`tenant:{tenant_id}`，确保多租户隔离。

### 测试告警触发

使用模拟器发送异常数据：

```bash
dotnet run --project tools/EquipAI.Simulator -- \
  --tenant <your-tenant-id> \
  --devices 1 \
  --interval 2 \
  --anomaly-rate 20  # 20% 概率生成异常值
```

前端告警中心页面会通过 SignalR 实时接收告警推送。

## CI/CD 流水线

GitHub Actions 流水线（`.github/workflows/ci.yml`）**当前仅 `workflow_dispatch` 手动触发**（自动触发已注释）：

1. **backend**：dotnet restore + build Release + 单元测试 + 集成测试
2. **frontend**：npm ci + TypeScript 类型检查 + ESLint（最多 1 个警告）+ Vitest + 构建
3. **docker**（仅 main 分支）：构建并推送前后端镜像到 GHCR（`yqghlx/equipsense/backend`、`yqghlx/equipsense/frontend`）
4. **e2e**（仅 main 分支）：启动 TimescaleDB + Redis 服务，构建前后端，运行 Playwright E2E 测试（禁用速率限制）
