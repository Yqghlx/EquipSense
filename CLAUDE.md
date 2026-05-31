# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

EquipSense 是一个工业设备智能监控与预测维护平台。核心目标：**在故障发生前预警，在告警触发后秒级给出根因和建议，在确认问题后自动创建工单闭环。**

当前状态：**设计阶段**，完整技术方案见 `docs/FINAL_TECHNICAL_DESIGN.md`。

## 技术栈

- **后端**：C# / .NET 8 WebAPI（模块化单体），EF Core 8 + Npgsql
- **前端**：React 19 + TypeScript (strict) + Vite + shadcn/ui + TailwindCSS
- **状态管理**：Zustand；数据请求：TanStack Query
- **数据库**：PostgreSQL 16 + TimescaleDB（业务+时序一体化）
- **缓存**：Redis 7
- **实时通信**：SignalR（按租户分组隔离）
- **工业协议**：OPC UA（OPC Foundation SDK）、Modbus（FluentModbus）、MQTT（MQTTnet + Mosquitto）
- **AI/ML**：LLM（GLM-5 / Qwen via DashScope）+ ML.NET（Phase 3 异常检测）
- **图表**：ECharts；表单：React Hook Form + Zod
- **测试**：xUnit + Vitest + Playwright
- **日志**：Serilog + Seq
- **容器**：Docker Compose（Phase 1），后续迁移 K8s
- **CI/CD**：GitHub Actions

## 架构要点

### 整体架构

```
边缘网关(.NET 8) → MQTT/HTTPS → 后端(ASP.NET Core 8 模块化单体) → PG+TimescaleDB / Redis
后端 SignalR Hub → React 19 PWA 前端
```

### 后端模块划分

- **设备管理**：设备 CRUD、类型模板、批量导入
- **告警引擎**：四级告警（阈值→组合→基线→ML），含聚合防风暴机制
- **工单管理**：三种可插拔模式（独立系统/中台中台/纯触发器）
- **AI 分析**：四级自动降级（预测→统计→规则→LLM），数据质量联动置信度
- **知识库**：双表设计（knowledge_rules + pending_rules），AI 生成候选规则需专家验证
- **共享层**：JWT 认证、RBAC 权限、SignalR、事件总线、多租户、数据质量

### 关键设计约束

- **Day 1 多租户**：所有业务表从第一天就有 `tenant_id`，EF Core 全局查询过滤器，所有查询方法必须传入 tenant_id
- **时序窄表**：`device_telemetry` 一行一个指标，新增指标不改 schema
- **UUID 主键**：适合分布式场景
- **JSONB 灵活字段**：设备参数、规则条件等用 JSONB
- **告警聚合**：30 分钟窗口内，同设备同指标第 1 次立即告警、2-3 次更新已有、超过 3 次静默
- **AI 自动降级**：数据质量评分影响分析级别和置信度乘数
- **知识沉淀安全边界**：AI 生成的规则写入 `pending_rules`，专家批准后才移入 `knowledge_rules`
- **工单可插拔**：`IWorkOrderIntegration` 接口适配钉钉/飞书/Maximo/Webhook
- **SignalR 租户隔离**：连接时自动加入 `tenant:{id}` 组

### 边缘网关

- 项目命名空间：`IndustrialAI.EdgeGateway`
- 协议适配器接口：`IProtocolAdapter`（ConnectAsync / ReadAsync / IsConnected / ProtocolType）
- 数据管线：采集 → 标准化 → 内存环形队列(10000) → SQLite(7天断网缓存) → MQTT/HTTPS 上传

### 前端结构

```
frontend/src/
├── components/    -- ui/ (shadcn) | charts/ (ECharts) | device/ | alert/ | workorder/ | layout/
├── pages/         -- Dashboard / DeviceList / DeviceDetail / AlertCenter / WorkOrder* / Analytics / Knowledge / Settings
├── hooks/         -- useDevices / useAlerts / useWorkOrders / useSignalR / useDataQuality
├── stores/        -- authStore (Zustand) / notificationStore
├── lib/           -- api.ts / signalr.ts / queryClient.ts
├── types/         -- TypeScript 类型定义
└── i18n/          -- 国际化（中英文，i18next）
```

### API 规范

- 前缀：`/api/v1/`
- 分页：`?page=1&pageSize=20&sort=created_at&order=desc`
- 统一错误响应：`{ code, message, details }`
- 认证：JWT（Header: Authorization: Bearer {token}）
- 多租户：JWT 中含 tenant_id，支持 Header `X-Tenant-Id` 和子域名

## 数据库关键表

- `tenants` / `users` — 多租户与用户（RBAC 五角色）
- `devices` / `device_type_templates` — 设备管理（模板化设计）
- `alert_rules` / `alerts` — 告警规则与告警实例
- `work_orders` / `work_order_logs` — 工单与流转日志
- `knowledge_rules` / `pending_rules` / `fault_cases` — 知识库（规则+案例双表）
- `device_telemetry`（TimescaleDB 超级表）— 时序窄表，7 天自动压缩，90 天保留
- `telemetry_hourly`（连续聚合）— 小时级统计
- `metric_baselines` — 告警引擎基线数据
- `notifications` / `audit_logs` / `system_configs` — 通知、审计、配置

## 部署

Phase 1 使用 Docker Compose：frontend + backend + postgres(timescaledb) + redis + mosquitto。
敏感配置通过环境变量注入（`PG_PASSWORD`、`JWT_SECRET`、`LLM_API_KEY`、`GATEWAY_AUTH_KEY`）。

## 开发路线图

- **Phase 1（8-10 周）**：核心闭环 — 项目骨架、设备 CRUD、MQTT 接入、告警引擎、AI 根因（L1-L3）、工单独立模式、前端完整页面、Docker 部署
- **Phase 2（4-6 周）**：真实接入 — OPC UA/Modbus 适配器、断网保护、知识沉淀闭环
- **Phase 3（6-8 周）**：产品化 — 工单完整工作流、钉钉/飞书集成、PWA、知识库管理、多租户 SaaS
- **Phase 4（4-6 周）**：智能化 — ML.NET 异常检测（L4）、安全加固、压力测试、v1.0 发布

## RBAC 权限矩阵

| 角色 | 设备 | 告警 | 工单 | 知识库 | 报表 | AI |
|------|------|------|------|--------|------|-----|
| system_admin | CRUD | CRUD | CRUD | CRUD | R | CRUD |
| maintenance_lead | RW | RW+配置 | RW+派工验收 | RW+验证 | R | R |
| technician | R | R+确认 | R+执行 | R | - | R+查询 |
| operator | R | R+确认 | R | - | R | R+查询 |
| viewer | R | R | R | R | R | - |
