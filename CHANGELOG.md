# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-06-03

### Added

#### 核心功能
- 设备管理 CRUD、类型模板、批量导入、设备配置向导
- 四级告警引擎（阈值 → 组合 → 基线 → ML），含聚合防风暴机制
- 工单管理（独立模式 + 智能派工），支持钉钉/飞书/Webhook/EAM 集成
- AI 根因分析引擎，四级自动降级（预测 → 统计 → 规则 → LLM）
- 知识库管理（规则 + 案例双表），AI 生成候选规则需专家验证
- 多租户 SaaS 架构，RBAC 五角色权限体系（SystemAdmin / MaintenanceLead / Technician / Operator / Viewer）
- 实时数据推送（SignalR 按租户分组隔离）
- MQTT 遥测数据接入（Mosquitto Broker）
- Web Push 通知（VAPID 协议）
- 离线支持（Service Worker + IndexedDB 队列 + PWA）

#### 边缘网关
- OPC UA 适配器（OPC Foundation SDK）
- Modbus TCP/RTU 适配器（FluentModbus）
- 数据管线：采集 → 标准化 → 环形队列 → SQLite 断网缓存 → MQTT/HTTPS 上传

#### 可观测性
- Seq 日志聚合
- Prometheus 指标采集
- Grafana 可视化仪表盘（自动配置数据源）

#### 安全
- JWT 认证 + 刷新令牌
- HSTS / CSP / Permissions-Policy / X-Frame-Options 安全头
- HTTPS 终止（Nginx + TLS）
- RBAC 权限中间件
- 租户隔离中间件
- 用量配额限制

#### 部署
- Docker Compose 一键部署（8 个服务）
- TimescaleDB 自动创建超级表 + 压缩 + 保留策略
- 生产环境启动脚本（等待依赖就绪 + 自动迁移）
- 三级健康探针（startup / liveness / ready）
- 版本信息端点 `/api/v1/system/info`

#### 测试（647 个测试全部通过）
- 后端单元测试 339 个（中间件、Hub、服务）
- 后端集成测试 85 个（11 个控制器）
- 前端单元测试 186 个（15 个 hook + 4 个组件）
- E2E 业务流程测试 37 个（设备、告警、工单、知识库）

#### CI/CD
- GitHub Actions 流水线（后端测试 + 前端测试 + Docker 构建验证）
- k6 API 性能压测脚本

### Technical Stack
- **后端**: C# / .NET 8 WebAPI + EF Core 8 + Npgsql + TimescaleDB
- **前端**: React 19 + TypeScript (strict) + Vite + shadcn/ui + TailwindCSS + TanStack Query + Zustand
- **数据库**: PostgreSQL 16 + TimescaleDB + Redis 7
- **消息**: MQTT (MQTTnet + Mosquitto)
- **AI**: LLM (Qwen via DashScope) + ML.NET (SrCnn 异常检测)
- **测试**: xUnit + Vitest + Playwright
- **日志**: Serilog + Seq
- **监控**: Prometheus + Grafana
