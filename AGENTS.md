# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## 项目概述

EquipSense（内部代号 EquipAI）是一个工业设备智能监控与预测维护平台。核心目标：**在故障发生前预警，在告警触发后秒级给出根因和建议，在确认问题后自动创建工单闭环。**

完整技术方案（2,457 行）见 `docs/FINAL_TECHNICAL_DESIGN.md`，涵盖系统架构、数据库 Schema、API 规范、安全设计、开发路线图等所有细节。

全面评估报告（25 份，5,468 行）见 `docs/evaluation/`，包括架构分析、代码质量、安全纵深、运维可观测性、DevOps/CI/CD 等 14 个专项领域，以及 ADR 决策记录、风险登记册、运维剧本等实操文档。快速入口：[`docs/evaluation/00-INDEX.md`](docs/evaluation/00-INDEX.md)。

## 开发命令

### 后端 (.NET 8)

```bash
# 构建项目
dotnet build EquipAI.sln

# 运行后端（监听 http://localhost:8080）
dotnet run --project src/EquipAI.WebAPI

# 运行单元测试
dotnet test tests/EquipAI.Tests.Unit

# 运行集成测试
dotnet test tests/EquipAI.Tests.Integration

# 运行单个测试类
dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~AlertEvaluationServiceTests"

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
# 注意：CI 限定范围并严格卡阈值 — `npx eslint src/ --max-warnings 1`，
# 改前端时务必满足「src/ 内 0 error、≤1 warning」，否则 CI 红。

# i18n 键覆盖检查（中英文键齐全）— CI 强制
npm run check:i18n

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

# 运行特定测试文件（E2E 按功能分目录存放在 e2e-comprehensive/ 下）
npx playwright test e2e-comprehensive/02-crud/devices-crud.spec.ts

# 调试模式
npx playwright test --debug

# 查看测试报告
npx playwright show-report
```

### 模拟器与遥测注入

模拟器有两个副本，**仅 `src/EquipAI.Simulator` 收录在 `EquipAI.sln` 中**（被解决方案构建编译）；`tools/EquipAI.Simulator` 是测试项目当前仍引用的旧副本，运行模拟器命令请用前者。

**注意两者能力不同：**

- `src/EquipAI.Simulator` 是 **OPC UA / Modbus TCP 模拟服务器**（供边缘网关协议适配器联调），**不直接发布 MQTT**。仅支持 `--headless` 参数，其余参数被静默忽略。
- `tools/EquipAI.Simulator` 旧副本支持直连 broker 发布 MQTT（`--tenant` / `--interval` / `--mqtt-username` 等），但没有 `--devices`、`--anomaly-rate` 参数。

```bash
# 启动 OPC UA (opc.tcp://localhost:4840) + Modbus TCP (localhost:5020) 模拟服务
dotnet run --project src/EquipAI.Simulator -- --headless
```

```bash
# 直接向后端注入一条遥测（后端订阅 factory/{tenantId}/telemetry/{deviceId}，
# payload 需含 timestamp 与 metrics；时间戳超前服务器不能超过 10 分钟）
docker exec equipai-mosquitto mosquitto_pub -h localhost \
  -t 'factory/<tenant-id>/telemetry/<device-id>' \
  -m '{"timestamp":"<UTC now>","quality":"good","metrics":{"temperature":95}}'
```

### Docker 环境

```bash
# 开发环境基础设施（PostgreSQL + TimescaleDB + Redis + Mosquitto）
docker compose -f docker/docker-compose.dev.yml up -d

# 生产环境全套服务（前端 + 后端 + 数据库 + Redis + Mosquitto）
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

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | .NET 8 WebAPI（模块化单体），EF Core 8 + Npgsql |
| 前端 | React 19 + TypeScript (strict) + Vite + shadcn/ui + TailwindCSS |
| 状态管理 | Zustand + TanStack Query |
| 数据库 | PostgreSQL 16 + TimescaleDB（业务 + 时序一体化） |
| 缓存 | Redis 7 |
| 实时通信 | SignalR（按租户分组隔离） |
| 工业协议 | MQTT（MQTTnet + Mosquitto） |
| AI/ML | LLM（通义千问 / GLM via DashScope） |
| 图表 | ECharts |
| 表单 | React Hook Form + Zod |
| 测试 | xUnit + Vitest + Playwright |
| 日志 | Serilog + Seq |
| 容器 | Docker Compose |
| CI/CD | GitHub Actions |

## 项目结构

```
EquipSense/
├── src/                           # 后端源码
│   ├── EquipAI.WebAPI/           # ASP.NET Core 入口（Controllers、Hub、中间件）
│   ├── EquipAI.Core/             # 领域层（实体、接口、事件、枚举）
│   ├── EquipAI.Application/      # 应用层（业务逻辑，按模块分文件夹）
│   ├── EquipAI.Infrastructure/   # 基础设施层（EF Core、Redis、MQTT、JWT）
│   ├── EquipAI.EdgeGateway/      # 边缘网关（独立部署）
│   └── EquipAI.Simulator/        # OPC UA / Modbus 模拟服务器（供边缘网关联调）
├── frontend/                      # 前端源码
│   └── src/
│       ├── pages/                # 页面组件
│       ├── components/           # 通用组件（ui/、charts/、alert/ 等）
│       ├── hooks/                # TanStack Query hooks
│       ├── stores/               # Zustand stores
│       ├── lib/                  # API 客户端、SignalR 连接
│       ├── i18n/                 # 国际化（中英文）
│       └── types/                # TypeScript 类型定义
├── tests/                         # 测试项目
│   ├── EquipAI.Tests.Unit/       # xUnit 单元测试
│   ├── EquipAI.Tests.Integration/ # Testcontainers 集成测试
│   ├── e2e/                      # Playwright E2E 测试（编排入口）
│   ├── load/                     # 负载测试脚本
│   └── stress/                   # 压力测试脚本
├── docker/                        # Docker 配置
│   ├── Dockerfile.backend        # 后端多阶段构建
│   ├── Dockerfile.frontend       # 前端 Nginx 构建
│   ├── nginx.conf                # Nginx 反向代理配置
│   ├── docker-compose.yml        # 生产环境
│   └ docker-compose.dev.yml      # 开发环境基础设施
│   └ .env.example                # 环境变量模板
├── docs/                          # 文档
│   └ FINAL_TECHNICAL_DESIGN.md   # 完整技术设计文档
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

### 后端模块划分

- **设备管理**：设备 CRUD、类型模板、批量导入
- **告警引擎**：三级告警（阈值 / 组合 / 基线），含聚合防风暴机制
- **工单管理**：完整生命周期管理，可插拔集成（钉钉/飞书/Maximo/Webhook）
- **AI 分析**：三级自动降级（统计分析 → 规则匹配 → LLM 诊断），数据质量联动置信度
- **知识库**：规则管理，AI 生成候选规则需专家验证
- **共享层**：JWT 认证、RBAC 权限、SignalR、事件总线、多租户、数据质量

### 关键设计约束

- **Day 1 多租户**：所有业务表都有 `tenant_id`，EF Core 全局查询过滤器，所有查询方法必须传入 tenant_id
- **时序窄表**：`device_telemetry` 一行一个指标，新增指标不改 schema
- **UUID 主键**：适合分布式场景
- **JSONB 灵活字段**：设备参数、规则条件等用 JSONB
- **告警聚合**：30 分钟窗口内，同设备同指标第 1 次立即告警、2-3 次更新已有、超过 3 次静默
- **AI 自动降级**：数据质量评分影响分析级别和置信度乘数
- **知识沉淀安全边界**：AI 生成的规则写入 `pending_rules`，专家批准后才移入 `knowledge_rules`
- **SignalR 租户隔离**：连接时自动加入 `tenant:{id}` 组

### 边缘网关

- 项目命名空间：`EquipAI.EdgeGateway`
- 协议适配器接口：`IProtocolAdapter`（ConnectAsync / ReadAsync / IsConnected / ProtocolType）
- 数据管线：采集 → 标准化 → 内存环形队列(10000) → SQLite(7天断网缓存) → MQTT/HTTPS 上传

### API 规范

- 前缀：`/api/v1/`
- 分页：`?page=1&pageSize=20&sort=created_at&order=desc`
- 统一错误响应：`{ code, message, details }`
- 认证：JWT（Header: `Authorization: Bearer {token}`）
- 多租户：JWT 中含 tenant_id，支持 Header `X-Tenant-Id` 和子域名
- 健康检查：`/health` 返回 PostgreSQL + Redis 连通性

### 数据库关键表

完整 Schema（含索引、约束、种子数据）见 `docs/FINAL_TECHNICAL_DESIGN.md` 第三章。核心表：

- `tenants` / `users` — 多租户与用户（RBAC 五角色）
- `devices` / `device_type_templates` — 设备管理（模板化设计，行业预置模板归属系统租户）
- `alert_rules` / `alerts` — 告警规则与告警实例
- `work_orders` / `work_order_logs` — 工单与流转日志
- `knowledge_rules` / `pending_rules` — 知识库（规则双表设计）
- `device_telemetry`（TimescaleDB 超级表）— 时序窄表，7 天自动压缩，90 天保留
- `telemetry_hourly`（连续聚合）— 小时级统计
- `notifications` / `audit_logs` / `system_configs` — 通知、审计、配置

**设备类型模板的租户策略：** 行业预置模板归属系统租户（`tenant_id = '00000000-0000-0000-0000-000000000000'`），查询时 `WHERE tenant_id = @current_tenant OR tenant_id = @system_tenant`。

## 实现阶段核心设计原则

1. **单体优先** — Phase 1 模块化单体 + Docker Compose，不拆微服务
2. **Day 1 多租户** — 所有业务表从第一条建表语句就有 `tenant_id`，EF Core 全局查询过滤器
3. **时序窄表** — `device_telemetry` 一行一个指标，新增指标不改 schema
4. **AI 自动降级** — 数据质量评分影响分析级别和置信度乘数（统计→规则→LLM）
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
5. 在 `tests/EquipAI.Tests.Unit` 中添加单元测试
6. 在 `frontend/src/hooks` 中添加 TanStack Query hook
7. 在 `frontend/src/pages` 中添加页面组件

### 运行数据库迁移

后端首次启动时自动执行迁移和种子数据初始化。如需手动迁移：

```bash
cd src/EquipAI.Infrastructure
dotnet ef migrations add <MigrationName> --startup-project ../EquipAI.WebAPI
dotnet ef database update --startup-project ../EquipAI.WebAPI
```

### 查看 API 文档

启动后端后访问 Swagger UI：http://localhost:8080/swagger

### 调试 SignalR 实时推送

前端 SignalR 连接配置在 `frontend/src/lib/signalr.ts`。后端 Hub 位于 `src/EquipAI.WebAPI/Hubs/IndustrialHub.cs`。

连接时自动加入租户分组：`tenant:{tenant_id}`，确保多租户隔离。

### 测试告警触发

向已注册设备发布超阈值的遥测（如 temperature > 80 触发 High 告警）：

```bash
docker exec equipai-mosquitto mosquitto_pub -h localhost \
  -t "factory/<your-tenant-id>/telemetry/<device-id>" \
  -m '{"timestamp":"<UTC now>","quality":"good","metrics":{"temperature":95}}'
```

首条命中立即建告警；30 分钟窗口内同设备同指标第 2-3 次更新已有告警，超过 3 次静默（防风暴聚合）。

前端告警中心页面会通过 SignalR 实时接收告警推送。

## 改动前必读的文档

修改敏感区域前先读对应文档，避免破坏既有约定：

- `docs/FINAL_TECHNICAL_DESIGN.md` — 全量技术设计（架构 / Schema / API / 安全 / 路线图）
- `docs/evaluation/00-INDEX.md` — 25 份专项评估入口（架构、代码质量、安全纵深、可观测性、DevOps 等）
- `docs/DEPLOY.md` — 部署步骤与环境变量
- `docs/OPS_RUNBOOK.md` — 运维剧本（故障演练、回滚）
- `docs/environment-variables.md` — 后端/前端环境变量清单（改配置先对齐此表）
- `docs/USER_GUIDE.md` — 用户操作手册

## 已知坑点

- **模拟器有两份**：只有 `src/EquipAI.Simulator` 作为正式运行入口收录在 `EquipAI.sln` 中（OPC UA/Modbus 模拟服务器，不发布 MQTT）；`tools/EquipAI.Simulator` 是测试项目使用的旧副本，支持直连 broker 发布 MQTT。两者都不存在 `--devices` / `--anomaly-rate` 参数；向 MQTT 注入遥测用 `mosquitto_pub`，见「测试告警触发」。
- **E2E 测试位置**：Playwright 配置在 `frontend/`，测试用例按功能分目录放 `frontend/e2e-comprehensive/` 下（不是 `tests/e2e/`）。运行前需 `cd frontend && npx playwright install`。
- **前端 lint 阈值严格**：CI 用 `npx eslint src/ --max-warnings 1`，新增 warning 也可能挂 CI。
- **i18n 双语必须齐全**：改文案需同步中英文，`npm run check:i18n` 在 CI 强制运行。
- **多租户查询不可漏 tenant_id**：所有业务表查询必须带 `tenant_id`（EF Core 全局过滤器），跨租户读取属于严重缺陷。
- **数据库迁移自动执行**：后端首次启动会跑迁移和种子；手动迁移命令见下文「运行数据库迁移」。

## CI/CD 流水线

GitHub Actions 流水线（`.github/workflows/ci.yml`）包含：

1. **后端测试**：单元测试 + 集成测试
2. **前端测试**：类型检查 + Lint + Vitest 单元测试 + 构建
3. **Docker 构建**：构建并推送前后端镜像（仅 main 分支）
4. **E2E 测试**：Playwright 端到端测试（仅 main 分支）

所有 Pull Request 到 main 分支会触发前两项测试，推送到 main 分支会执行完整流水线。
