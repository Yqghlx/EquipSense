# EquipSense — 工业设备智能监控与预测维护平台

## 项目简介

EquipSense（内部代号 EquipAI）是一个端到端的工业 IoT 监控平台，核心能力：

- **实时监控**：通过 MQTT 接收设备遥测数据，SignalR 实时推送到前端
- **智能告警**：三级告警引擎（阈值 / 组合 / 基线），含 30 分钟聚合防风暴
- **AI 根因分析**：四级自动降级策略（L4 ML 异常检测 → L2 规则 → L3 统计 → L1 LLM），数据质量影响置信度
- **工单闭环**：告警触发后自动创建工单，支持完整生命周期管理
- **多租户 SaaS**：Day 1 多租户隔离，RBAC 五角色权限矩阵

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | .NET 8 WebAPI（模块化单体） |
| 前端 | React 19 + TypeScript + Vite + shadcn/ui + TailwindCSS |
| 数据库 | PostgreSQL 16 + TimescaleDB（业务 + 时序一体化） |
| 缓存 | Redis 7 |
| 可靠事件 | RabbitMQ 4.3（生产默认，处理器独立重试/死信） |
| 实时通信 | SignalR（按租户分组隔离） |
| 工业协议 | MQTT（MQTTnet + Mosquitto） |
| AI/ML | LLM（通义千问 / GLM via DashScope） |
| 图表 | ECharts |
| 状态管理 | Zustand + TanStack Query |
| 容器 | Docker Compose |

## 快速开始

### 前置条件

- Docker & Docker Compose
- （开发模式）.NET 8 SDK、Node.js 22+、PostgreSQL 16 + TimescaleDB、Redis 7、Mosquitto

### 方式一：Docker Compose 一键启动（推荐）

```bash
# 1. 克隆仓库
git clone https://github.com/your-org/EquipSense.git
cd EquipSense

# 2. 创建环境变量文件
cp docker/.env.example docker/.env
# 首次校验会因占位值返回非零，这是预期行为；先编辑 .env 填写所有必填凭据
cd docker
./setup.sh
nano .env
./setup.sh
cd ..

# 3. 启动全套服务
docker compose --env-file docker/.env -f docker/docker-compose.yml up -d --build

# 4. 访问应用
# 前端：https://localhost:8443（默认 8443 HTTPS，可通过 FRONTEND_PORT 修改）
# 后端 API：http://localhost:8080/swagger
# 管理员初始密码由 docker/.env 中的 SEED_ADMIN_PASSWORD 设置（首次登录后强制修改密码）
```

### 方式二：本地开发

#### 1. 启动基础设施

```bash
DEV_PG_PASSWORD='<本地数据库密码>' docker compose -f docker/docker-compose.dev.yml up -d
```

这会启动 PostgreSQL（5432）、Redis（6379）和 Mosquitto（1883）。

#### 2. 启动后端

```bash
cd src
# 首次本地开发需把数据库、JWT 和网关密钥写入 .NET User Secrets，不要写入 appsettings.json
dotnet user-secrets set --project EquipAI.WebAPI "ConnectionStrings:Default" "Host=localhost;Port=5432;Database=equipai_dev;Username=postgres;Password=<本地数据库密码>;Maximum Pool Size=100"
dotnet user-secrets set --project EquipAI.WebAPI "ConnectionStrings:ReadOnly" "Host=localhost;Port=5432;Database=equipai_dev;Username=postgres;Password=<本地数据库密码>;Maximum Pool Size=100"
dotnet user-secrets set --project EquipAI.WebAPI "Jwt:Secret" "<至少32位的本地开发密钥>"
dotnet user-secrets set --project EquipAI.WebAPI "Gateway:AuthKey" "<至少32位的本地网关密钥>"
dotnet run --project EquipAI.WebAPI
# 后端监听 http://localhost:8080
```

首次启动自动执行数据库迁移和种子数据初始化。

#### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
# 前端监听 http://localhost:5173，自动代理 API 和 SignalR 到后端
```

#### 4. 发送模拟数据（可选）

```bash
dotnet run --project src/EquipAI.Simulator -- \
  --tenant 11111111-1111-1111-1111-111111111111 --devices 3 --interval 5
```

正式模拟器位于 `src/EquipAI.Simulator`；`tools/EquipAI.Simulator` 仅保留给现有故障场景单元测试使用，不作为运行入口。模拟器每 5 秒向 3 个虚拟设备发送遥测数据，5% 概率生成异常值触发告警。

## 项目结构

```
EquipSense/
├── src/
│   ├── EquipAI.Core/              # 领域层：实体、接口、事件、枚举
│   ├── EquipAI.Application/       # 应用层：业务逻辑（按模块分文件夹）
│   ├── EquipAI.Infrastructure/    # 基础设施层：EF Core、Redis、MQTT、JWT
│   └── EquipAI.WebAPI/            # ASP.NET Core 入口：Controllers、Hub、中间件
├── frontend/
│   └── src/
│       ├── pages/                 # 页面组件
│       ├── components/            # 通用组件（ui/、charts/、alert/ 等）
│       ├── hooks/                 # TanStack Query hooks
│       ├── stores/                # Zustand stores
│       ├── lib/                   # API 客户端、SignalR 连接
│       ├── i18n/                  # 国际化（中英文）
│       └── types/                 # TypeScript 类型定义
├── tools/
│   └── EquipAI.Simulator/         # 测试用故障场景库（非运行入口）
├── docker/
│   ├── Dockerfile.backend         # 后端多阶段构建
│   ├── Dockerfile.frontend        # 前端 Nginx 构建
│   ├── nginx.conf                 # Nginx 反向代理配置
│   ├── docker-compose.yml         # 生产环境全套服务
│   └── docker-compose.dev.yml     # 开发环境基础设施
└── docs/
    └── FINAL_TECHNICAL_DESIGN.md  # 完整技术设计文档
```

## 环境变量

| 变量 | 说明 | 必填 | 默认值 |
|------|------|------|--------|
| `PG_PASSWORD` | PostgreSQL 密码 | 是 | - |
| `JWT_SECRET` | JWT 签名密钥（≥32 字符） | 是 | - |
| `GATEWAY_AUTH_KEY` | 边缘网关认证密钥（≥32 位纯 ASCII） | 使用网关时必填 | - |
| `PG_DB` | 数据库名 | 否 | `equipai` |
| `PG_USER` | 数据库用户 | 否 | `postgres` |
| `BACKEND_PORT` | 后端端口 | 否 | `8080` |
| `FRONTEND_PORT` | 前端端口 | 否 | `80` |
| `LLM_API_KEY` | LLM API 密钥 | 否 | 空（AI 分析降级为通用经验诊断） |
| `LLM_MODEL` | LLM 模型 ID | 否 | `qwen-plus` |
| `LLM_ENDPOINT` | LLM API 端点 | 否 | `https://dashscope.aliyuncs.com/compatible-mode/v1` |

## API 概览

| 路径前缀 | 模块 | 说明 |
|----------|------|------|
| `/api/v1/auth` | 认证 | 登录、刷新令牌 |
| `/api/v1/devices` | 设备管理 | CRUD、批量操作 |
| `/api/v1/alerts` | 告警中心 | 查询、确认、解决 |
| `/api/v1/alert-rules` | 告警规则 | CRUD（阈值/组合/基线） |
| `/api/v1/work-orders` | 工单管理 | 完整生命周期 |
| `/api/v1/analyses` | AI 分析 | 触发分析、查看结果 |
| `/api/v1/data-quality` | 数据质量 | 五维度评分报告 |
| `/hubs/industrial` | SignalR | 实时告警和遥测推送 |
| `/health` | 健康检查 | PG + Redis 连通性 |

## RBAC 权限矩阵

| 角色 | 设备 | 告警 | 工单 | 知识库 | AI |
|------|------|------|------|--------|-----|
| 系统管理员 | CRUD | CRUD | CRUD | CRUD | CRUD |
| 维保主管 | RW | RW+配置 | RW+派工验收 | RW+验证 | R |
| 技术员 | R | R+确认 | R+执行 | R | R |
| 操作员 | R | R+确认 | R | - | R |
| 观察者 | R | R | R | R | - |

## 开发路线图

- **Phase 1（当前）**：核心闭环 — 设备 CRUD、MQTT 遥测、告警引擎、AI 根因（L1-L4）、工单、前端完整页面、Docker 部署
- **Phase 2**：真实接入 — OPC UA / Modbus 适配器、边缘网关断网保护、知识沉淀闭环
- **Phase 3**：产品化 — 工单完整工作流、钉钉/飞书集成、PWA、多租户 SaaS 完善
- **Phase 4**：智能化 — ML.NET 异常检测（L4）、安全加固、压力测试、v1.0 发布

## 项目评估文档

项目代码和架构的全面评估报告位于 [`docs/evaluation/`](./docs/evaluation/)：

| 类别 | 文档 |
|------|------|
| **快速上手** | [执行摘要](./docs/evaluation/S03-执行摘要.md) · [上手指南](./docs/evaluation/S07-开发者快速上手指南.md) · [术语表](./docs/evaluation/S02-术语表.md) |
| **架构分析** | [后端](./docs/evaluation/02-后端架构分析.md) · [前端](./docs/evaluation/03-前端架构分析.md) · [边缘网关](./docs/evaluation/04-边缘网关架构分析.md) |
| **领域评估** | [代码质量](./docs/evaluation/05-代码质量分析.md) · [安全纵深](./docs/evaluation/06-安全纵深分析.md) · [运维](./docs/evaluation/07-运维与可观测性分析.md) · [DevOps](./docs/evaluation/08-DevOps与CI_CD分析.md) |
| **专题** | [数据库](./docs/evaluation/09-数据库与数据架构分析.md) · [API](./docs/evaluation/10-API面与接口契约分析.md) · [性能](./docs/evaluation/11-性能与可扩展性基准分析.md) · [依赖](./docs/evaluation/12-依赖与供应链安全分析.md) |
| **行动** | [ADR 决策记录](./docs/evaluation/S08-架构决策记录ADR.md) · [风险登记册](./docs/evaluation/S09-风险登记册.md) · [技术债务路线图](./docs/evaluation/13-技术债务与改进路线图.md) · [测试策略](./docs/evaluation/14-测试策略与金字塔分析.md) |
| **运维** | [运维剧本](./docs/evaluation/S10-运维剧本.md) · [Bug 演进故事](./docs/evaluation/S06-Bug历史与演进故事.md) |

> 完整索引见 [`docs/evaluation/00-INDEX.md`](./docs/evaluation/00-INDEX.md)

## License

Private — All rights reserved.
