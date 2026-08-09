# EquipSense (EquipAI) 项目指南

## 项目概述
EquipSense 是一个端到端的工业 IoT 监控与预测维护平台。它通过 MQTT 采集遥测数据，利用 AI 进行根因分析，并提供工单闭环管理。

- **核心目标**：实现故障预警、秒级根因诊断、自动工单闭环。
- **架构模式**：模块化单体 (Modular Monolith)，事件驱动 (Event-Driven)。

## 技术栈

### 后端 (.NET 8)
- **核心框架**：ASP.NET Core 8 WebAPI
- **数据库**：PostgreSQL 16 + TimescaleDB (业务 + 时序)
- **持久化**：EF Core 8 (Npgsql)
- **缓存**：Redis 7
- **实时通信**：SignalR (租户分组隔离)
- **消息队列**：MQTT (MQTTnet + Mosquitto)
- **AI/ML**：LLM (DashScope: 通义千问/GLM) + ML.NET (L4 异常检测)
- **可观测性**：Serilog + Seq, OpenTelemetry (Tracing + Metrics), Prometheus + Grafana

### 前端 (React 19)
- **核心框架**：React 19 + TypeScript (Strict)
- **构建工具**：Vite 8
- **样式**：TailwindCSS 4 + shadcn/ui
- **状态管理**：TanStack Query 5 (服务端) + Zustand 5 (客户端)
- **图表**：ECharts
- **表单**：React Hook Form + Zod

---

## 核心规范与约束

### 1. 开发强约束 (后端)
- **零警告编译**：`TreatWarningsAsErrors=true`，任何警告都会导致构建失败。
- **可空引用类型**：`Nullable=enable`。
- **隐式命名空间**：`ImplicitUsings=enable`。
- **命名规范**：
    - 接口：`I` 前缀。
    - DTO：`Create{Entity}Request`, `Update{Entity}Request`, `{Entity}Dto`。
    - 命名空间：`EquipAI.{Layer}.{Module}`。

### 2. 多租户设计 (Day 1)
- **逻辑隔离**：所有业务表必须包含 `TenantId` 字段。
- **全局过滤**：通过 EF Core 全局查询过滤器自动隔离租户数据。
- **租户上下文**：使用 `ITenantContext` 获取当前请求的租户信息。
- **SignalR 隔离**：连接时自动加入 `tenant:{id}` 分组。

### 3. 事件驱动模型
- **内置总线**：基于 `System.Threading.Channels` 的内存事件总线。
- **集成事件**：模块间解耦必须通过 `IEventBus` 发布/订阅事件。
- **核心管线**：遥测采集 → 告警检测 → AI 分析 → 工单创建。

### 4. 注释与文档 (核心要求)
- **中文优先**：代码注释、日志信息、开发文档必须使用简体中文。
- **解释“为什么”**：对于复杂逻辑，注释应重点解释设计初衷和算法原理。

---

## 常用开发命令

### 后端
```bash
dotnet build EquipAI.sln                    # 构建项目（.NET 8 稳定入口）
dotnet run --project src/EquipAI.WebAPI      # 启动 WebAPI (http://localhost:8080)
dotnet test tests/EquipAI.Tests.Unit         # 运行单元测试
dotnet ef database update                    # 手动更新数据库
```

### 前端
```bash
cd frontend
npm install                                  # 安装依赖
npm run dev                                  # 开发模式 (http://localhost:5173)
npm run lint                                 # 代码检查
npm run build                                # 生产构建
```

### 模拟器 (发送测试数据)
```bash
dotnet run --project src/EquipAI.Simulator -- --tenant <ID> --devices 3 --interval 5
```

---

## 项目结构速查

- `src/EquipAI.WebAPI`: 请求入口、中间件、SignalR Hub、指标采集。
- `src/EquipAI.Core`: 领域层，定义实体、接口和核心事件。
- `src/EquipAI.Application`: 应用层，包含各模块业务逻辑和事件处理器。
- `src/EquipAI.Infrastructure`: 基础设施层，包含 EF Core 配置、AI 实现、MQTT/Redis 服务。
- `frontend/src/hooks`: TanStack Query Hooks，管理服务端状态。
- `frontend/src/lib/api.ts`: Axios 封装，处理 JWT 刷新和多租户 Header。
- `docker/`: 生产与开发环境的 Docker Compose 配置。

## 运维与监控
- **健康检查**：`/health` (存活), `/health/ready` (就绪)。
- **指标收集**：`/metrics` (Prometheus 格式)。
- **结构化日志**：Seq (默认端口 5341)。
- **数据库备份**：`docker/backup.sh` 脚本。

---
*本文件为项目核心上下文，修改代码前请务必阅读相关模块的设计细节。*
