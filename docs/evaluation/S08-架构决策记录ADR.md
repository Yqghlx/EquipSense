# EquipSense 架构决策记录 (ADR)

> Architecture Decision Records — 记录关键架构决策的背景、方案和 trade-off  
> 格式：ADR-NNN | 日期 | 状态 (Proposed / Accepted / Deprecated)

---

## ADR-001: 后端架构风格 — 模块化单体

| 字段 | 值 |
|------|-----|
| 日期 | 2026-05-31 |
| 状态 | Accepted |
| 影响范围 | 全系统 |

**问题**：EquipSense 作为一个工业 IoT 平台，应该采用什么架构风格来平衡开发速度、可维护性和未来扩展性？

**备选方案**：

| 方案 | 优势 | 劣势 |
|------|------|------|
| **模块化单体** (选择) | 单进程部署简单、调试方便、事务一致、重构成本低 | 无独立扩缩容、技术栈绑定 |
| 纯单体 (无模块边界) | 最简单 | 无模块边界，代码混乱 |
| 微服务 | 独立部署、独立扩缩容、技术异构 | 分布式事务、网络延迟、运维复杂 (Phase 1 不适合) |

**决策**：采用**模块化单体**，内部通过 `IEventBus` 事件总线解耦。

**后果**：
- 正面：Phase 1 在 2 个月内完成全链路闭环 
- 正面：单进程部署，Docker Compose 即可运维
- 负面：Phase 3 如需独立扩缩容，需将高频模块（告警评估）拆为独立服务
- 负面：InMemoryEventBus 重启丢事件，长期需迁移 RabbitMQ

---

## ADR-002: 事件总线选型

| 字段 | 值 |
|------|-----|
| 日期 | 2026-05-31 |
| 状态 | Accepted (Phase 1) / Deprecated (Phase 3) |
| 影响范围 | Application 模块间通信 |

**问题**：模块间如何解耦通信？

**备选方案**：

| 方案 | 优势 | 劣势 |
|------|------|------|
| **InMemory Channel** (选择) | 零依赖、最低延迟、< 200 行代码实现 | 重启丢事件、无持久化、容量 1000 |
| RabbitMQ | 持久化、死信重试、多语言客户端 | 运维依赖、运维复杂 (Phase 1 太早引入) |
| Kafka | 高吞吐、持久化、日志回放 | 太重、工业场景通常不需要 |
| 直接 Service 调用 | 最简单 | 模块耦合 |

**决策**：Phase 1 使用 `InMemoryEventBus` (Channel<T>，容量 1000，DropOldest)，Phase 3 迁移 RabbitMQ。

**后果**：
- 正面：2 个月快速迭代中零事件总线问题
- 正面：事件发布者/消费者完全解耦，Handler 独立 DI Scope
- 负面：重启未处理事件全部丢失
- 负面：突发遥测 >1000/s 可能 DropOldest

**迁移计划**：将 `IEventBus` 接口替换为 RabbitMQ 实现，Handler 代码无需改动。

---

## ADR-003: 时序数据存储方案

| 字段 | 值 |
|------|-----|
| 日期 | 2026-05-31 |
| 状态 | Accepted |
| 影响范围 | Telemetry 存储 |

**问题**：设备遥测数据（时间序列数据）应该存在哪里？

**备选方案**：

| 方案 | 优势 | 劣势 |
|------|------|------|
| **PostgreSQL + TimescaleDB** (选择) | 业务+时序一套库、自动压缩、连续聚合、PG 生态 | 超大规模(>1 亿点/天)性能不如专用 TSDB |
| InfluxDB | 针对时序优化、压缩率更高 | 多一个运维组件、业务数据要分开 |
| 单独 PostgreSQL 时序表 | 简单 | 无自动分区/压缩/聚合 |
| MongoDB / Cassandra | 灵活 schema | 无时序优化 |

**决策**：PostgreSQL 16 + TimescaleDB 扩展，业务表和时序表在同一数据库。

**后果**：
- 正面：迁移、备份、监控都统一用 PG 工具
- 正面：7 天自动压缩、365 天保留策略、小时级连续聚合
- 正面：窄表设计（一行一个指标），新增指标不改 schema
- 负面：全局 `drop_chunks` 无法按租户区分保留期，需 `TelemetryCleanupService` 按租户精细 DELETE

---

## ADR-004: 多租户隔离策略

| 字段 | 值 |
|------|-----|
| 日期 | 2026-05-31 |
| 状态 | Accepted |
| 影响范围 | 全系统 |

**问题**：SaaS 平台的多租户数据如何隔离？

**备选方案**：

| 方案 | 优势 | 劣势 |
|------|------|------|
| **Shared (行级隔离)** (选择) | 最简单运维、共享资源利用率高、一个连接池 | 单库故障影响全部租户、数据量大后查询变慢 |
| Schema (PG 独立 schema) | 逻辑隔离、可独立备份 | 连接数翻倍、迁移脚本复杂 |
| Database (独立数据库) | 物理隔离、最强安全性 | 运维最重、成本最高 |

**决策**：Phase 1 使用 **Shared 模式**（所有租户同库同表，EF 全局过滤器行级隔离）。`TenantIsolationMode` 枚举已预留 `Schema` 和 `Database` 值。

**后果**：
- 正面：单 PostgreSQL 即可服务所有租户，运维简单
- 正面：EF Core 全局查询过滤器自动注入 `WHERE tenant_id = @current`，代码层面无感知
- 正面：`IgnoreQueryFilters()` 机制支持系统管理员跨租户操作
- 负面：大租户的查询可能影响小租户（通用 PG 调优减轻，`max_connections=200` 隔离连接）
- 负面：后台服务必须手动 `IgnoreQueryFilters()` + 显式 TenantId（约 100 处，是最大 Bug 源）

---

## ADR-005: 前端状态管理方案

| 字段 | 值 |
|------|-----|
| 日期 | 2026-05-31 |
| 状态 | Accepted |
| 影响范围 | 前端 |

**问题**：前端应用的状态应该用什么方案管理？

**备选方案**：

| 方案 | 优势 | 劣势 |
|------|------|------|
| **TanStack Query + Zustand** (选择) | Query 管服务端数据(缓存/失效/GC)、Zustand 管 UI 状态(轻量无样板) | 学习曲线 |
| Redux Toolkit | 中间件生态丰富、社区大 | 样板代码多、不适合"服务端数据"场景 |
| MobX | 响应式、可观测 | 隐式依赖、调试困难 |
| SWR + Context | 轻量 | 无 GC、Context 导致全树重渲染 |

**决策**：服务端数据全部走 **TanStack Query**（staleTime=5min, gcTime=10min），只有 3 个需要跨组件的 UI 状态走 **Zustand**（auth/notification/realtime）。

**后果**：
- 正面：30+ hooks 统一模式，组件零副作用
- 正面：SignalR 事件是唯一缓存失效触发器，不需要轮询
- 正面：分包后主 bundle 266KB（ECharts 1.1MB 独立加载）
- 正面：`authStore` 同步初始化解决了页面刷新的路由 race condition
- 负面：新开发者需要同时理解两个状态库的边界

---

## ADR-006: AI 分析策略 — 四级自动降级

| 字段 | 值 |
|------|-----|
| 日期 | 2026-05-31 |
| 状态 | Accepted |
| 影响范围 | Analysis 模块 |

**问题**：工业场景中，AI 分析应该如何处理数据不足或 LLM 不可用的情况？

**备选方案**：

| 方案 | 优势 | 劣势 |
|------|------|------|
| **四级降级** (选择) | 数据好时 ML 精确、数据差时 LLM 兜底、LLM 挂时规则兜底 | 实现复杂、4 条路径需维护 |
| 纯 LLM | 最智能 | API Key 未配/昂贵/慢/不可用就全挂 |
| 纯规则引擎 | 离线可用、可预测 | 不灵活、无法处理未知故障 |
| 纯 ML.NET | 本地快速 | 需大量训练数据 |

**决策**：按优先级 L4(ML) → L2(规则) → L3(统计) → L1(LLM)，数据质量评分联动置信度乘数。

**后果**：
- 正面：LLM API Key 未配置时自动降级，不影响业务
- 正面：ML.NET SrCnn 检测异常时置信度最高 (0.85+)
- 正面：LLM 超时/失败时降级为通用经验诊断（置信度 0.3），不把 API 错误暴露给用户
- 负面：4 条路径的测试和维护成本高
- 负面：置信度 0.3 的通用诊断可能误导运维

---

## ADR-007: 认证方案 — JWT + HttpOnly Cookie

| 字段 | 值 |
|------|-----|
| 日期 | 2026-06-03 (v1.3.0 升级) |
| 状态 | Accepted |
| 影响范围 | 认证模块 + 前端 |

**问题**：Web 应用的高安全性认证方案怎么选？

**方案演进**：

```
v1.0:  localStorage 存 JWT (XSS 可窃取)
v1.3:  HttpOnly Cookie + Refresh Token 轮换
v1.4:  + MFA/TOTP + 令牌重用检测 (OAuth 2.0 BCP)
```

**决策**：
- Access Token: JWT (HMAC-SHA256), 15 分钟有效期, HttpOnly Cookie (`SameSite=Strict`)
- Refresh Token: GUID, 7 天有效期, Redis 正向+反向索引, 含重用检测
- 三源 Token 读取: Cookie > Header > QueryString (SignalR)
- MFA: TOTP (RFC 6238), ±1 步时间窗口

**后果**：
- 正面：XSS 无法窃取 token（HttpOnly Cookie JS 不可读）
- 正面：刷新令牌重放检测（失窃时自动吊销整个会话）
- 正面：主动续期 + Page Visibility API 防止操作中 401
- 正面：Token 版本号支持主动失效（改密后递增）
- 负面：SignalR WebSocket 需要从 QueryString 取 token（浏览器限制）
- 负面：跨源开发环境需 withCredentials 支持

---

## ADR 索引

| 编号 | 决策 | 日期 | 状态 |
|------|------|------|------|
| ADR-001 | 模块化单体 | 5/31 | ✅ Accepted |
| ADR-002 | InMemoryEventBus → RabbitMQ | 5/31 | ⚠️ Phase 3 迁移 |
| ADR-003 | PostgreSQL + TimescaleDB | 5/31 | ✅ Accepted |
| ADR-004 | Shared 多租户行级隔离 | 5/31 | ✅ Accepted |
| ADR-005 | TanStack Query + Zustand | 5/31 | ✅ Accepted |
| ADR-006 | AI 四级自动降级 | 5/31 | ✅ Accepted |
| ADR-007 | JWT + HttpOnly Cookie + Refresh | 6/03 | ✅ Accepted (迭代中) |

---

**关联报告**：[02-后端架构分析](./02-后端架构分析.md) · [S06-Bug历史与演进故事](./S06-Bug历史与演进故事.md) · [S02-术语表](./S02-术语表.md)

---
*本文档属于 EquipSense 项目评估体系 · 生成日期：2026-06-24 · 版本：v3.0*
