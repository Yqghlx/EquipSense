# Phase 1 Week 1-2：后端骨架设计规格

> 日期：2026-05-31
> 范围：EquipAI 解决方案结构、数据库、多租户、JWT 认证、RBAC
> 参考：`docs/FINAL_TECHNICAL_DESIGN.md`

## 目标

搭建可运行的后端骨架，包含完整的多租户基础设施、JWT 认证、RBAC 权限、设备管理 CRUD。后续周的告警引擎、AI 分析、工单管理等模块可在此基础上快速集成。

## 解决方案结构

```
EquipAI.sln
├── src/
│   ├── EquipAI.Core/                    -- 领域层（纯 C#，无外部依赖）
│   ├── EquipAI.Application/             -- 应用层（依赖 Core）
│   ├── EquipAI.Infrastructure/          -- 基础设施层（依赖 Core）
│   └── EquipAI.WebAPI/                  -- 入口（依赖所有层）
├── tests/
│   ├── EquipAI.Tests.Unit/
│   └── EquipAI.Tests.Integration/
└── docker/
    └── docker-compose.dev.yml           -- PG + Redis + Mosquitto
```

项目依赖关系：Core 零外部依赖；Application 和 Infrastructure 均引用 Core；WebAPI 引用全部三层并通过 DI 注册具体实现。Application 通过 Core 层定义的接口（如 `IRepository<T>`）访问数据，不直接引用 Infrastructure。

### 项目配置

- 所有项目目标 .NET 8
- 全局启用 `<Nullable>enable</Nullable>`、`<ImplicitUsings>enable</ImplicitUsings>`
- WebAPI 引用 Serilog、Swashbuckle（Swagger UI）
- Infrastructure 引用 EF Core 8、Npgsql、StackExchange.Redis、MQTTnet

## Core 层

### 实体

对应数据库表，UUID 主键，所有业务实体含 `TenantId` 字段：

- **Tenant** — 租户（name、slug、plan、isolation_mode、max_devices、max_users、data_retention_days、workorder_mode、settings JSONB）
- **User** — 用户（username、password_hash、display_name、role、skills[]、locations[]、phone、email、language、notification_prefs JSONB、token_version、must_change_password）
- **Device** — 设备（device_code、name、type、type_template_id、manufacturer、model、serial_number、location JSONB、install_date、gateway_id、connection JSONB、responsible_user_id、criticality、downtime_cost_per_hour、health_score、status、tags[]、custom_fields JSONB）
- **DeviceTypeTemplate** — 设备类型模板（name、industry、parameters JSONB、default_alarm_rules JSONB、default_diagnosis_rules JSONB）

### 枚举

- `UserRole`：system_admin / maintenance_lead / technician / operator / viewer
- `DeviceStatus`：online / offline / maintenance / warning
- `DeviceCriticality`：critical / high / normal / low
- `TenantPlan`：trial / basic / professional / enterprise
- `TenantIsolationMode`：shared / schema / database
- `WorkOrderMode`：independent / integration_hub / trigger_only

### 接口

- `ITenantContext`（Scoped）— TenantId、IsolationMode、IsSystemAdmin
- `IEventBus` — PublishAsync / Subscribe（进程内实现）
- `IIntegrationEvent` — EventId、OccurredAt、TenantId
- `IEventHandler<TEvent>` — HandleAsync
- `IRepository<T>` — GetByIdAsync、GetAllAsync、CreateAsync、UpdateAsync、DeleteAsync

## Infrastructure 层

### EF Core 数据访问

- `AppDbContext` — 接受 `ITenantContext`，在 `OnModelCreating` 中为所有含 `TenantId` 属性的实体注册全局查询过滤器
- Fluent API 配置：实体映射、索引（遵循设计文档第三章的 SQL 定义）、JSONB 列转换
- 系统租户 ID 常量：`00000000-0000-0000-0000-000000000000`

### 身份认证

- JWT Token 结构：sub（用户 ID）、tenant_id、role、username、token_version、iat、exp
- Access Token 有效期 24 小时，Refresh Token 有效期 7 天存 Redis
- 密码使用 bcrypt 哈希
- Refresh Token 轮换机制：每次刷新生成新 Token，旧的立即删除

### 中间件

**TenantResolutionMiddleware**（按优先级解析 tenant_id）：
1. JWT Token 中的 `tenant_id` claim
2. 请求头 `X-Tenant-Id`
3. 子域名（预留，Phase 3 实现）

**PermissionMiddleware**：
- 检查端点上的 `[RequirePermission("device:delete")]` 特性
- 通过 `IRbacService.HasPermission(role, permission)` 校验

### 种子数据

- 系统租户（全零 UUID，slug: "system"）
- 默认演示租户（slug: "default"，plan: trial）
- admin 用户（首次登录强制改密码，`must_change_password = true`）
- 行业预置设备类型模板（CNC、注塑机、空压机等，归属系统租户）

## Application 层

### 服务

| 服务 | 职责 |
|------|------|
| AuthService | 登录/登出/刷新 Token/修改密码 |
| UserService | 用户 CRUD、角色变更（仅管理员） |
| TenantService | 租户 CRUD、资源使用量统计 |
| DeviceService | 设备 CRUD、批量导入基础框架 |
| RbacService | 权限矩阵校验 |

### DTO

- 请求：`LoginRequest`、`CreateUserRequest`、`UpdateUserRequest`、`CreateDeviceRequest`、`UpdateDeviceRequest`、`CreateTenantRequest`
- 响应：`AuthResponse`（accessToken + refreshToken）、`UserDto`、`DeviceDto`、`TenantDto`、`PagedResult<T>`
- 统一错误响应：`{ code, message, details }`

### 事件总线

进程内实现（`InMemoryEventBus`），使用 `Channel<T>` 异步分发。定义事件接口和处理器接口，后续周添加具体事件（TelemetryReceivedEvent、AlertTriggeredEvent 等）。

## WebAPI 层

### API 端点

**认证（前缀 /api/v1/auth）：**
- `POST /login` — 登录
- `POST /refresh` — 刷新 Token
- `POST /logout` — 登出（需认证）
- `POST /change-password` — 修改密码（需认证）

**用户管理（前缀 /api/v1/admin/users，需 system_admin）：**
- `GET /` — 用户列表（分页）
- `POST /` — 创建用户
- `PUT /{id}` — 更新用户
- `DELETE /{id}` — 禁用用户
- `PUT /{id}/role` — 变更角色

**租户管理（前缀 /api/v1/admin/tenants，需 system_admin）：**
- `GET /` — 租户列表
- `POST /` — 创建租户
- `PUT /{id}` — 更新租户配置
- `GET /{id}/usage` — 资源使用量（设备数/用户数/存储）

**设备管理（前缀 /api/v1/devices）：**
- `GET /` — 设备列表（分页/过滤/搜索）
- `GET /{id}` — 设备详情
- `POST /` — 创建设备
- `PUT /{id}` — 更新设备
- `DELETE /{id}` — 删除设备

**设备类型模板（前缀 /api/v1/device-types）：**
- `GET /` — 模板列表（含系统租户预置模板）
- `POST /` — 创建模板

**健康检查：**
- `GET /health` — 数据库 + Redis 连通性

### 中间件管线

```
异常处理中间件 → Serilog 请求日志 → CORS → TenantResolution → JWT 认证 → 权限检查 → 路由
```

### 分页与过滤

- 分页参数：`?page=1&pageSize=20&sort=created_at&order=desc`
- 过滤参数：`?status=active&severity=high&device_type=CNC`
- 关键词搜索：`?keyword=CNC-001`
- 分页响应：`{ items: [], total, page, pageSize, totalPages }`

## Docker 开发环境

`docker/docker-compose.dev.yml` 提供三个服务：
- PostgreSQL 16 + TimescaleDB（端口 5432，数据库 equipai_dev）
- Redis 7（端口 6379）
- Mosquitto MQTT（端口 1883）

启动命令：`docker compose -f docker/docker-compose.dev.yml up -d`

## RBAC 权限矩阵

| 角色 | 设备 | 告警 | 工单 | 知识库 | 报表 | AI |
|------|------|------|------|--------|------|-----|
| system_admin | CRUD | CRUD | CRUD | CRUD | R | CRUD |
| maintenance_lead | RW | RW+配置 | RW+派工验收 | RW+验证 | R | R |
| technician | R | R+确认 | R+执行 | R | - | R+查询 |
| operator | R | R+确认 | R | - | R | R+查询 |
| viewer | R | R | R | R | R | - |

Week 1-2 实现设备、用户、租户相关权限检查。告警/工单/知识库/AI 权限在对应模块实现时添加。

## 不包含在 Week 1-2 的范围

- 告警引擎、AI 分析、工单管理（Week 3-8）
- 前端（Week 9-10，或后续并行）
- SignalR Hub（Week 5-6 随告警引擎一起）
- MQTT 数据接入管道（Week 3-4）
- TimescaleDB 超级表和连续聚合（Week 3-4 随遥测数据）
- 边缘网关项目（Week 3-4）
