# EquipAI — 工业设备智能监控与预测维护平台（v5.0）

> 日期：2026-05-31  
> 技术栈：C#/.NET 8 + React 19 + PostgreSQL/TimescaleDB  
> 原则：单体优先、模块化边界、渐进式引入、Day 1 多租户安全

---

## 一、项目定位

### 1.1 核心价值

**"在故障发生前预警，在告警触发后秒级给出根因和建议，在确认问题后自动创建工单闭环。"**

三个关键承诺：
1. 兼容所有设备接入方式（OPC UA / Modbus / MQTT / HTTP / Excel / 手动）
2. AI 分析基于真实数据，有数据用数据，无数据用规则，无规则用对话
3. 工单系统可插拔，不强推替换客户现有系统

### 1.2 设计原则

1. **单体优先**——Phase 1 用模块化单体，Docker Compose 部署
2. **渐进式交付**——8-10 周核心闭环，逐步智能化
3. **AI 自动降级**——根据数据基础自动选择分析级别
4. **工单可插拔**——独立/中台/触发器三种模式
5. **知识沉淀**——每次闭环结果反馈到知识库
6. **Day 1 多租户**——所有表从第一天就有 tenant_id，代码始终多租户安全

### 1.3 商业模式

| 层级 | 模式 | 价格建议 | 设备数 |
|------|------|----------|--------|
| 免费试用 | SaaS | 0 元/月 | 5 台 |
| 专业版 | SaaS | 3000-5000 元/月 | 50 台 |
| 企业版 | SaaS | 按需定价 | 不限 |
| 私有化 | 授权 + 维保 | 按需定价 | 不限 |

---

## 二、系统架构

```
┌──────────────────────────────────────────────────────────────┐
│                      中小工厂现场                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │ PLC     │  │ 传感器   │  │ DCS     │                     │
│  └────┬────┘  └────┬────┘  └────┬────┘                     │
│       ▼            ▼            ▼                            │
│  ┌──────────────────────────────────────┐                   │
│  │   边缘网关（.NET 8）                  │                   │
│  │   OPC UA / Modbus / MQTT 协议适配     │                   │
│  │   数据标准化 + SQLite 缓存 + 断网保护 │                   │
│  └──────────────┬───────────────────────┘                   │
└─────────────────┼────────────────────────────────────────────┘
                  │ MQTT / HTTPS
┌─────────────────▼────────────────────────────────────────────┐
│            后端服务（ASP.NET Core 8 单体模块化）               │
│                                                               │
│  设备管理 │ 告警引擎 │ 工单管理 │ AI分析 │ 通知 │ 知识库 │ 报表│
│                                                               │
│  共享层：JWT / RBAC / SignalR / 事件总线 / 多租户 / 数据质量  │
│                                                               │
│  数据接入层：MQTT Ingress │ HTTP Ingress │ 批量导入            │
└──────────┬───────────────────────────────────┬───────────────┘
           ▼                                   ▼
┌─────────────────────┐           ┌─────────────────────┐
│ PostgreSQL + TimescaleDB│       │ Redis 7             │
│ 业务 + 时序（窄表）    │       │ 缓存/会话/告警冷却   │
└─────────────────────┘           └─────────────────────┘
           ▼                                   │
┌─────────────────────┐           ┌─────────────────────┐
│ Mosquitto (MQTT)    │           │ React 19 + PWA      │
└─────────────────────┘           └─────────────────────┘
```

**Phase 1 基础设施**：PG + TimescaleDB + Redis + Mosquitto + 后端 + 前端。

**当前部署边界**：生产事件总线使用 RabbitMQ 4.3，开发/测试保留进程内实现；附件存储默认使用本地命名卷，并提供显式可选的 S3 兼容后端用于跨主机/多副本部署；不在 Compose 中内置 MinIO、K8s 和 YARP。

### 2.1 后端项目结构

```
EquipAI.sln
├── src/
│   ├── EquipAI.WebAPI/                    -- ASP.NET Core 入口
│   │   ├── Program.cs                     -- 服务注册 + 中间件管线
│   │   ├── appsettings.json
│   │   └── Migrations/                    -- EF Core 迁移文件
│   │
│   ├── EquipAI.Core/                      -- 领域层（实体 + 接口 + 事件）
│   │   ├── Entities/                      -- 领域实体（Device, Alert, WorkOrder...）
│   │   ├── Interfaces/                    -- 仓储 + 服务接口
│   │   ├── Events/                        -- 领域事件定义
│   │   └── Enums/                         -- 枚举（Role, Severity, WorkOrderStatus...）
│   │
│   ├── EquipAI.Application/               -- 应用层（业务逻辑）
│   │   ├── Devices/                       -- 设备模块
│   │   │   ├── DeviceService.cs
│   │   │   ├── DeviceDto.cs
│   │   │   └── MappingProfile.cs
│   │   ├── Alerts/                        -- 告警模块
│   │   │   ├── AlertEvaluationService.cs
│   │   │   ├── AlertAggregator.cs
│   │   │   └── Evaluators/               -- Threshold/Baseline/Combined
│   │   ├── WorkOrders/                    -- 工单模块
│   │   ├── Analysis/                      -- AI 根因分析
│   │   ├── Knowledge/                     -- 知识库
│   │   ├── Telemetry/                     -- 遥测数据管道
│   │   └── Common/                        -- 共享（EventBus, ITenantContext...）
│   │
│   ├── EquipAI.Infrastructure/            -- 基础设施层
│   │   ├── Data/                          -- EF Core DbContext + 仓储实现
│   │   │   ├── AppDbContext.cs
│   │   │   ├── TenantQueryFilter.cs       -- 全局租户过滤器
│   │   │   └── Migrations/
│   │   ├── Cache/                         -- Redis 缓存实现
│   │   ├── Messaging/                     -- MQTT 客户端 + 事件总线实现
│   │   ├── Integrations/                  -- 钉钉/飞书/Maximo/Webhook
│   │   ├── AI/                            -- LLM 服务 + ML.NET
│   │   └── Identity/                      -- JWT + 密码哈希 + Token 版本控制
│   │
│   └── EquipAI.EdgeGateway/               -- 边缘网关（独立部署）
│       ├── Protocols/
│       ├── Pipeline/
│       └── Services/
│
├── tests/
│   ├── EquipAI.Tests.Unit/                -- 单元测试
│   ├── EquipAI.Tests.Integration/         -- 集成测试（Testcontainers）
│   └── EquipAI.Tests.E2E/                -- API 端到端测试
│
└── docker/
    ├── Dockerfile.backend
    ├── Dockerfile.frontend
    ├── docker-compose.yml                 -- 生产
    └── docker-compose.dev.yml             -- 开发
```

**命名规范：**
- 命名空间：`EquipAI.{Layer}.{Module}`（如 `EquipAI.Application.Alerts`）
- 接口：`I` 前缀（如 `IAlertEvaluationService`）
- DTO：`{Entity}Dto` / `Create{Entity}Request` / `Update{Entity}Request`
- 仓储：`I{Entity}Repository` → `{Entity}Repository`
- 事件：`{Verb}{Entity}Event`（如 `AlertTriggeredEvent`）

**模块化单体原则：**
- 每个业务模块（Devices/Alerts/WorkOrders/...）是一个独立文件夹，内部按职责分层
- 模块间通过 `IEventBus` 解耦，禁止直接调用其他模块的 Service
- 跨模块查询通过 `I{Module}QueryService` 接口，实现在 Application 层

---

## 三、数据库设计

### 3.1 设计原则

- **所有业务表都有 tenant_id**——从 Day 1 就是多租户安全的
- **时序表用窄表**（一行一个指标）——新增指标不改 schema
- **UUID 主键**——适合分布式、无序生成不锁表
- **JSONB 灵活字段**——设备参数、规则条件等用 JSONB，适应不同设备类型

### 3.2 业务表

```sql
-- ========================================
-- 多租户
-- ========================================

CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,
    slug            VARCHAR(50) UNIQUE NOT NULL,
    plan            VARCHAR(20) NOT NULL DEFAULT 'basic',
    isolation_mode  VARCHAR(20) NOT NULL DEFAULT 'shared',
    max_devices     INT NOT NULL DEFAULT 50,
    max_users       INT NOT NULL DEFAULT 20,
    data_retention_days INT NOT NULL DEFAULT 90,
    workorder_mode  VARCHAR(20) NOT NULL DEFAULT 'independent',
    settings        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    is_active       BOOLEAN DEFAULT TRUE
);

-- ========================================
-- 用户与权限
-- ========================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    username        VARCHAR(100) NOT NULL,
    password_hash   VARCHAR(256) NOT NULL,
    display_name    VARCHAR(100),
    role            VARCHAR(20) NOT NULL DEFAULT 'viewer',
    skills          TEXT[],
    locations       TEXT[],
    phone           VARCHAR(20),
    email           VARCHAR(200),
    language        VARCHAR(10) DEFAULT 'zh-CN',
    notification_prefs JSONB DEFAULT '{}',
    token_version   INT DEFAULT 0,
    must_change_password BOOLEAN DEFAULT FALSE,  -- 种子用户设为 TRUE，首次登录强制改密码
    is_active       BOOLEAN DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, username)
);

-- ========================================
-- 设备管理（模板化设计）
-- ========================================

-- 设备类型模板（行业预置 + 客户自定义）
-- 行业预置模板归属系统租户（tenant_id = '00000000-0000-0000-0000-000000000000'）
-- 查询时：WHERE tenant_id = @current_tenant OR tenant_id = @system_tenant
CREATE TABLE device_type_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    name            VARCHAR(100) NOT NULL,
    industry        VARCHAR(50),
    parameters      JSONB NOT NULL,
    default_alarm_rules  JSONB DEFAULT '[]',
    default_diagnosis_rules JSONB DEFAULT '[]',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 设备
CREATE TABLE devices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    device_code     VARCHAR(50) NOT NULL,
    name            VARCHAR(200) NOT NULL,
    type            VARCHAR(100) NOT NULL,
    type_template_id UUID REFERENCES device_type_templates(id),
    manufacturer    VARCHAR(200),
    model           VARCHAR(200),
    serial_number   VARCHAR(200),
    location        JSONB DEFAULT '{}',
    install_date    DATE,
    gateway_id      VARCHAR(64),
    connection      JSONB DEFAULT '{}',
    responsible_user_id UUID REFERENCES users(id),
    criticality     VARCHAR(20) DEFAULT 'normal',
    downtime_cost_per_hour DECIMAL(10,2),
    health_score    DECIMAL(5,2) DEFAULT 100,
    status          VARCHAR(20) DEFAULT 'offline',
    tags            TEXT[],
    custom_fields   JSONB DEFAULT '{}',
    last_data_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, device_code)
);

-- ========================================
-- 告警管理
-- ========================================

CREATE TABLE alert_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    name            VARCHAR(200) NOT NULL,
    device_type     VARCHAR(100),
    device_id       UUID REFERENCES devices(id),
    metric          VARCHAR(50) NOT NULL,
    rule_type       VARCHAR(20) NOT NULL,
    operator        VARCHAR(5),
    threshold       DECIMAL(10,2),
    baseline_window_hours INT DEFAULT 168,
    baseline_stddev_multiplier DECIMAL(5,2) DEFAULT 2.0,
    conditions      JSONB,
    duration_seconds INT,
    severity        VARCHAR(20) NOT NULL,
    category        VARCHAR(50),
    cooldown_seconds INT DEFAULT 300,
    suppression_config JSONB DEFAULT '{}',
    notification_config JSONB DEFAULT '{}',
    auto_create_workorder BOOLEAN DEFAULT FALSE,
    enabled         BOOLEAN DEFAULT TRUE,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    alert_code      VARCHAR(50) NOT NULL,  -- 格式：ALT-{设备编码}-{metric}-{yyyyMMddHHmmss}
    rule_id         UUID REFERENCES alert_rules(id),
    device_id       UUID NOT NULL REFERENCES devices(id),
    severity        VARCHAR(20) NOT NULL,
    category        VARCHAR(50),
    status          VARCHAR(20) DEFAULT 'active',
    metric          VARCHAR(50) NOT NULL,
    value           DECIMAL(10,4) NOT NULL,
    threshold       DECIMAL(10,4),
    message         TEXT,
    data_snapshot   JSONB,
    root_cause      TEXT,
    recommendation  TEXT,
    analysis_id     UUID,
    aggregated_from UUID[],
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMPTZ,
    resolved_by     UUID REFERENCES users(id),
    resolved_at     TIMESTAMPTZ,
    resolution      TEXT,
    work_order_id   UUID,
    occurred_at     TIMESTAMPTZ NOT NULL,
    UNIQUE(tenant_id, alert_code)
);

-- ========================================
-- AI 分析结果
-- ========================================

CREATE TABLE analyses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    alert_id        UUID REFERENCES alerts(id),
    device_id       UUID NOT NULL REFERENCES devices(id),
    level           INT NOT NULL,                -- 分析级别 1-4
    data_quality    DOUBLE PRECISION,            -- 分析时的数据质量评分
    possible_causes JSONB NOT NULL,              -- [{cause, probability}]
    root_cause      TEXT,
    confidence      DOUBLE PRECISION NOT NULL,   -- 0.0-1.0
    recommended_actions TEXT[],
    check_steps     TEXT[],
    required_parts  TEXT[],
    requires_expert_review BOOLEAN DEFAULT FALSE,
    llm_prompt      TEXT,                        -- 调试用：发送给 LLM 的 prompt（30天后自动清除）
    llm_response    TEXT,                        -- 调试用：LLM 原始返回（30天后自动清除）
    feedback_score  INT,                         -- 用户反馈 1-5 分
    feedback_comment TEXT,
    duration_ms     INT,                         -- 分析耗时（毫秒）
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 索引：按设备查询分析历史
CREATE INDEX idx_analyses_tenant_device_time
    ON analyses (tenant_id, device_id, created_at DESC);

-- ========================================
-- 工单管理
-- ========================================

CREATE TABLE work_orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    workorder_code  VARCHAR(50) NOT NULL,  -- 格式：WO-{yyyyMMdd}-{4位序号}，如 WO-20260531-0001
                                            -- 序号生成：SELECT COALESCE(MAX(CAST(RIGHT(workorder_code,4) AS INT)), 0) + 1
                                            --           FROM work_orders WHERE tenant_id = ? AND workorder_code LIKE 'WO-{date}%'
                                            -- 并发安全：在事务中执行 SELECT + INSERT
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    type            VARCHAR(30) NOT NULL DEFAULT 'corrective',
    priority        VARCHAR(20) NOT NULL DEFAULT 'medium',
    status          VARCHAR(20) DEFAULT 'pending_dispatch',

    device_id       UUID REFERENCES devices(id),
    alert_id        UUID REFERENCES alerts(id),
    analysis_id     UUID,
    root_cause      TEXT,

    creator_id      UUID REFERENCES users(id),
    assignee_id     UUID REFERENCES users(id),
    approver_id     UUID REFERENCES users(id),
    collaborators   UUID[],

    recommended_actions TEXT[],
    check_steps     TEXT[],
    required_parts  TEXT[],
    execution_plan  TEXT,
    acceptance_criteria TEXT,
    checklist       JSONB,
    spare_parts     JSONB,

    deadline        TIMESTAMPTZ,
    estimated_hours DECIMAL(5,1),
    actual_hours    DECIMAL(5,1),

    execution_report TEXT,
    result_summary  TEXT,
    fault_category  VARCHAR(50),
    safety_level    VARCHAR(20) DEFAULT 'normal',

    external_id     VARCHAR(200),
    external_system VARCHAR(50),
    sync_status     VARCHAR(20) DEFAULT 'none',
    last_sync_at    TIMESTAMPTZ,

    is_knowledge_candidate BOOLEAN DEFAULT FALSE,
    knowledge_case_id UUID,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    assigned_at     TIMESTAMPTZ,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    closed_at       TIMESTAMPTZ,
    UNIQUE(tenant_id, workorder_code)
);

CREATE TABLE work_order_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    work_order_id   UUID NOT NULL REFERENCES work_orders(id),
    action          VARCHAR(100) NOT NULL,
    from_status     VARCHAR(20),
    to_status       VARCHAR(20),
    comment         TEXT,
    operator_id     UUID REFERENCES users(id),
    attachments     JSONB DEFAULT '[]',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 知识库（规则 + 案例双表 + 安全边界）
-- ========================================

-- 正式规则表（专家验证后的规则）
-- 行业共享规则归属系统租户，所有租户可见
CREATE TABLE knowledge_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    device_type     VARCHAR(100) NOT NULL,
    name            VARCHAR(200) NOT NULL,
    conditions      JSONB NOT NULL,
    conclusion      JSONB NOT NULL,
    recommended_actions TEXT[],
    check_steps     TEXT[],
    confidence_weight DECIMAL(3,2) DEFAULT 0.5,
    source          VARCHAR(20) NOT NULL DEFAULT 'imported',
    accuracy_rate   DECIMAL(3,2),
    success_count   INT DEFAULT 0,
    enabled         BOOLEAN DEFAULT TRUE,
    created_by      VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 候选规则表（AI自动生成，专家验证前不进入正式规则库）
CREATE TABLE pending_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    device_type     VARCHAR(100) NOT NULL,
    name            VARCHAR(200) NOT NULL,
    conditions      JSONB NOT NULL,
    conclusion      JSONB NOT NULL,
    recommended_actions TEXT[],
    check_steps     TEXT[],
    source_workorder_id UUID REFERENCES work_orders(id),
    source_case_id  UUID,
    confidence      DECIMAL(3,2),
    review_status   VARCHAR(20) DEFAULT 'pending',
    reviewed_by     UUID REFERENCES users(id),
    review_comment  TEXT,
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 故障案例库
CREATE TABLE fault_cases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    device_id       UUID REFERENCES devices(id),
    device_type     VARCHAR(100) NOT NULL,
    fault_occurred_at TIMESTAMPTZ,
    fault_description TEXT NOT NULL,
    symptoms        TEXT[],
    root_cause      TEXT NOT NULL,
    solution        TEXT NOT NULL,
    repair_duration_minutes INT,
    parts_used      TEXT[],
    fault_data      JSONB,
    operator        VARCHAR(100),
    is_verified     BOOLEAN DEFAULT FALSE,
    verified_by     UUID REFERENCES users(id),
    source_workorder_id UUID REFERENCES work_orders(id),
    tags            TEXT[],
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 索引：告警看板核心查询
CREATE INDEX idx_alerts_tenant_status_time
    ON alerts (tenant_id, status, occurred_at DESC);
CREATE INDEX idx_alerts_tenant_device_time
    ON alerts (tenant_id, device_id, occurred_at DESC);

-- 索引：工单按状态/派工查询
CREATE INDEX idx_workorders_tenant_status
    ON work_orders (tenant_id, status);
CREATE INDEX idx_workorders_tenant_assignee
    ON work_orders (tenant_id, assignee_id);

-- ========================================
-- 通知 / 审计 / 配置
-- ========================================

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    user_id         UUID NOT NULL REFERENCES users(id),
    type            VARCHAR(30) NOT NULL,
    title           VARCHAR(200) NOT NULL,
    content         TEXT,
    related_id      UUID,
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    user_id         UUID,
    action          VARCHAR(100) NOT NULL,
    resource_type   VARCHAR(50) NOT NULL,
    resource_id     UUID,
    old_value       JSONB,
    new_value       JSONB,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE system_configs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID REFERENCES tenants(id),
    config_key      VARCHAR(200) NOT NULL,
    config_value    JSONB NOT NULL,
    description     TEXT,
    is_encrypted    BOOLEAN DEFAULT FALSE,
    updated_by      UUID REFERENCES users(id),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, config_key)
);

-- 索引：通知未读查询
CREATE INDEX idx_notifications_user_unread
    ON notifications (user_id, is_read, created_at DESC);

-- 索引：审计日志按租户+时间查询
CREATE INDEX idx_auditlogs_tenant_time
    ON audit_logs (tenant_id, created_at DESC);
```

### 3.3 时序表（TimescaleDB 窄表）

```sql
-- 窄表设计：一行一个指标，新增指标不改 schema
CREATE TABLE device_telemetry (
    time            TIMESTAMPTZ NOT NULL,
    tenant_id       UUID NOT NULL,
    device_id       UUID NOT NULL,
    metric          VARCHAR(100) NOT NULL,
    value           DOUBLE PRECISION,
    string_value    VARCHAR(500),
    quality         VARCHAR(20) DEFAULT 'good',
    source          VARCHAR(20) DEFAULT 'edge'
);

SELECT create_hypertable('device_telemetry', 'time',
    chunk_time_interval => INTERVAL '1 day');

-- 索引：tenant_id 在前支持多租户查询
CREATE INDEX idx_telemetry_tenant_device_time
    ON device_telemetry (tenant_id, device_id, time DESC);
CREATE INDEX idx_telemetry_tenant_device_metric
    ON device_telemetry (tenant_id, device_id, metric, time DESC);
CREATE INDEX idx_telemetry_tenant_metric_time
    ON device_telemetry (tenant_id, metric, time DESC);

-- 压缩：7天自动压缩，节省 90% 空间
ALTER TABLE device_telemetry SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'tenant_id, device_id',
    timescaledb.compress_orderby = 'time DESC'
);
SELECT add_compression_policy('device_telemetry', INTERVAL '7 days');

-- 保留：90天自动删除（按租户配置可调）
SELECT add_retention_policy('device_telemetry', INTERVAL '90 days');

-- 连续聚合：小时级统计
CREATE MATERIALIZED VIEW telemetry_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    tenant_id,
    device_id,
    metric,
    AVG(value) AS avg_value,
    STDDEV(value) AS std_dev,
    MIN(value) AS min_value,
    MAX(value) AS max_value,
    COUNT(*) AS sample_count,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) AS p95_value
FROM device_telemetry
WHERE value IS NOT NULL
GROUP BY 1, 2, 3, 4;

SELECT add_continuous_aggregate_policy('telemetry_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

-- 基线数据（告警引擎依赖此表）
CREATE TABLE metric_baselines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    device_id       UUID NOT NULL,
    metric          VARCHAR(100) NOT NULL,
    period_start    TIMESTAMPTZ NOT NULL,
    period_end      TIMESTAMPTZ NOT NULL,
    avg_value       DOUBLE PRECISION,
    std_dev         DOUBLE PRECISION,
    min_value       DOUBLE PRECISION,
    max_value       DOUBLE PRECISION,
    p95_value       DOUBLE PRECISION,
    sample_count    INT,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, device_id, metric)
);
```

---

## 四、边缘网关

### 4.1 项目结构

```
IndustrialAI.EdgeGateway/
├── Protocols/
│   ├── IProtocolAdapter.cs       -- 协议适配器接口
│   ├── OpcUaAdapter.cs           -- OPC Foundation SDK
│   ├── ModbusTcpAdapter.cs       -- FluentModbus
│   ├── ModbusRtuAdapter.cs       -- FluentModbus (串口)
│   └── MqttSubscriberAdapter.cs  -- MQTTnet
├── Pipeline/
│   ├── DataCollector.cs          -- 定时采集调度
│   ├── DataNormalizer.cs         -- 单位转换、缩放
│   ├── LocalBuffer.cs            -- 内存队列 + SQLite
│   └── CloudUploader.cs          -- MQTT/HTTPS 上传
├── Services/
│   ├── DeviceManager.cs          -- 连接管理、自动重连
│   └── HealthReporter.cs         -- 网关健康上报
└── appsettings.json
```

### 4.2 关键接口

```csharp
public interface IProtocolAdapter : IDisposable
{
    Task ConnectAsync(DeviceConfig config, CancellationToken ct);
    Task<List<DataPoint>> ReadAsync(string[] pointIds, CancellationToken ct);
    bool IsConnected { get; }
    string ProtocolType { get; }
}

public record TelemetryMessage(
    string DeviceId,
    string DeviceType,
    DateTime Timestamp,
    Dictionary<string, double> Metrics,
    string Status
);

public record DeviceConfig(
    string DeviceId,
    string Protocol,
    string ConnectionString,
    Dictionary<string, string> DataPoints,
    int PollIntervalMs
);
```

### 4.3 配置模板

```json
{
  "Gateway": {
    "Id": "gateway-factory-a-01",
    "TenantId": "default",
    "BackendUrl": "https://cloud.industrial-ai.com",
    "MqttBroker": "mqtts://cloud.industrial-ai.com:8883",
    "UploadIntervalSeconds": 5,
    "BufferSize": 10000,
    "AuthKey": "${GATEWAY_AUTH_KEY}"
  },
  "Devices": [
    {
      "DeviceId": "cnc-001",
      "Protocol": "opcua",
      "ConnectionString": "opc.tcp://192.168.1.100:4840",
      "PollIntervalMs": 3000,
      "DataPoints": {
        "temperature": "ns=2;s=Channel1.Device1.Temperature",
        "vibration": "ns=2;s=Channel1.Device1.Vibration",
        "pressure": "ns=2;s=Channel1.Device1.Pressure",
        "power": "ns=2;s=Channel1.Device1.Power"
      }
    },
    {
      "DeviceId": "inj-001",
      "Protocol": "modbus-tcp",
      "ConnectionString": "192.168.1.50:502",
      "PollIntervalMs": 5000,
      "DataPoints": {
        "temperature": "holding_register:100",
        "pressure": "holding_register:101",
        "status": "coil:0"
      }
    }
  ]
}
```

### 4.4 断网保护

```
正常：采集 → 标准化 → 有界内存环形队列(10000) → MQTT上报 → 确认 → 清除
断网：采集 → 标准化 → 内存队列满 → SQLite(7天) → 恢复后回放 → MQTT上报

LocalBuffer 的容量检查、FIFO 驱逐和入队在同一短临界区完成，避免多个设备采集器并发时突破
内存上限；被驱逐消息在锁外写入 SQLite。SQLite 单例的初始化、写入、回放查询、标记、清理
和释放通过同一异步闸门串行化，出队和释放同步更新网关缓冲深度指标。单例
`CloudUploader` 对完整的离线回放批次加异步闸门，串行保护读取积压、MQTT 发布、发送标记和
清理，避免多个设备采集器在网络恢复时重复发布同一条消息；该保护范围是单进程实例，不替代
跨进程消息租约。
```

---

## 五、数据接入管道

### 5.1 MQTT 接入

**MQTT 认证（Phase 1）：**

```
Mosquitto 配置用户名/密码认证 + ACL：
- 每个边缘网关注册时分配唯一的 username/password
- ACL 规则：网关只能发布到 factory/{自己的tenantId}/telemetry/+
- 防止跨租户伪造数据
- Phase 3 升级为 mTLS 双向证书认证
```

**MQTT 消息格式：**

```json
// 主题：factory/{tenantId}/telemetry/{deviceId}
{
  "device_id": "cnc-001",
  "device_type": "CNC",
  "timestamp": "2026-05-31T10:30:00Z",
  "metrics": {
    "temperature": 85.3,
    "vibration": 2.1,
    "pressure": 6.2,
    "power": 7500
  },
  "status": "running",
  "quality": "good"
}
```

**MQTT Ingress 处理流程：**

```
MQTTnet 订阅 factory/+/telemetry/+
    → 解析前消息体上限校验（≤256 KiB）
    → 反序列化 + Schema 校验（时间戳、质量、指标数量/名称/有限数值）
    → 去重（Redis SET 设备+时间戳，1分钟 TTL）
    → 租户验证（tenant_id 是否存在且活跃）
    → 设备验证（device_id 是否注册）
    → 单位转换（按设备类型模板配置）
    → 拆分为窄表行（每条 metric 一行）
    → 批量写入 TimescaleDB（每 500ms 或满 100 条 flush 一次）
    → 发布 TelemetryReceivedEvent（异步触发告警评估）
    → SignalR 推送实时数据到前端
```

### 5.2 HTTP 接入

```
POST /api/v1/telemetry
    → JWT 认证 + 租户隔离
    → 请求体上限（≤256 KiB）+ 统一 Core 遥测边界校验
    → 同样的去重/标准化流程
    → 写入 TimescaleDB
```

**遥测接入边界：**

- 单条消息最多包含 100 个指标，指标名最多 100 个字符，拒绝首尾空白和控制字符。
- 指标值必须是有限数字（拒绝 `NaN` 和正/负无穷），质量标记非空且最多 20 个字符。
- 设备编码/设备 ID 最多 50 个字符；时间戳必须有效，但不限制历史跨度，以支持边缘网关断网缓存后的补传。
- HTTP 与 MQTT 共用 `EquipAI.Core.Validation.TelemetryInputValidator`，防止某个接入通道绕过数据库和异步队列边界。

### 5.3 批量导入

```
POST /api/v1/import/telemetry（上传 Excel/CSV）
    → 后台任务解析文件（Hangfire/BackgroundService）
    → 逐行校验 + 去重
    → 批量写入（COPY 命令，高性能）
    → 返回任务 ID，前端轮询进度
```

### 5.4 基线计算

```
// 每小时执行一次（BackgroundService + Cron 表达式）
// 数据源：telemetry_hourly 连续聚合视图（小时级数据，非原始数据）
// 触发条件：该设备指标在小时聚合视图中有 >= 168 条记录（= 7天 × 24小时）
//   - 每小时上报一次的设备：7天恰好达标
//   - 每5秒上报的设备：24小时就有 17280 条原始数据，聚合后 24 条小时数据，需 7 天
// 滚动窗口：过去 7 天（period_start = now - 7d, period_end = now）
// 写入 metric_baselines 表（UPSERT）
// 计算：avg, std_dev, min, max, p95, sample_count
```

---

## 六、告警引擎

### 6.1 四级告警

| 级别 | 类型 | 数据要求 | 可用时机 |
|------|------|----------|----------|
| Level 1 | 静态阈值 | 无 | Day 1 |
| Level 2 | 组合条件 | 无 | Day 1 |
| Level 3 | 动态基线（均值±N倍标准差） | 100+样本 | 数据积累后自动启用 |
| Level 4 | ML 异常检测（ML.NET SrCnn） | 6个月+ | Phase 3 |

### 6.2 规则评估器

```csharp
public abstract class AlertRuleEvaluator
{
    public abstract string RuleType { get; }
    public abstract Task<bool> EvaluateAsync(
        double value, DeviceContext context, AlertRule rule);
}

public class ThresholdEvaluator : AlertRuleEvaluator
{
    public override string RuleType => "threshold";
    public override Task<bool> EvaluateAsync(double value, DeviceContext ctx, AlertRule rule)
    {
        var triggered = rule.Operator switch
        {
            ">"  => value > rule.Threshold,
            ">=" => value >= rule.Threshold,
            "<"  => value < rule.Threshold,
            "<=" => value <= rule.Threshold,
            "==" => Math.Abs(value - rule.Threshold) < 0.001,
            _    => false
        };
        return Task.FromResult(triggered);
    }
}

public class BaselineEvaluator : AlertRuleEvaluator
{
    public override string RuleType => "baseline";
    public override async Task<bool> EvaluateAsync(
        double value, DeviceContext ctx, AlertRule rule)
    {
        var baseline = ctx.Baseline;
        if (baseline == null || baseline.SampleCount < 100)
            return false;

        var deviation = Math.Abs(value - baseline.AvgValue) / baseline.StdDev;
        return deviation > rule.BaselineStddevMultiplier;
    }
}
```

### 6.3 告警聚合（防风暴）

```csharp
public class AlertAggregator
{
    private readonly ConcurrentDictionary<string, AlertWindow> _windows = new();
    private DateTime _lastCleanup = DateTime.UtcNow;

    // 定期清理超过 30 分钟无数据的窗口，防止内存泄漏
    private void CleanupStaleWindows()
    {
        if ((DateTime.UtcNow - _lastCleanup).TotalMinutes < 10) return;
        _lastCleanup = DateTime.UtcNow;

        foreach (var kvp in _windows)
        {
            if ((DateTime.UtcNow - kvp.Value.LastAccess).TotalMinutes > 30)
                _windows.TryRemove(kvp.Key, out _);
        }
    }

    public (bool ShouldCreate, bool UpdateExisting, bool Silenced) Evaluate(
        string deviceId, string metric)
    {
        CleanupStaleWindows();
        var key = $"{deviceId}:{metric}";
        // GetOrAdd 保证工厂只执行一次
        var window = _windows.GetOrAdd(key, _ => new AlertWindow());
        var count = window.IncrementAndMaybeReset(DateTime.UtcNow);

        return count switch
        {
            1 => (true, false, false),     // 第一次：立即告警
            <= 3 => (false, true, false),  // 2-3次：更新已有
            _ => (false, false, true)       // 超过3次：静默
        };
    }
}

// 聚合更新策略：
// 当 ShouldUpdateExisting = true 时，按以下条件定位已有告警：
//   SELECT * FROM alerts WHERE tenant_id = ? AND device_id = ? AND metric = ?
//     AND status = 'active' ORDER BY occurred_at DESC LIMIT 1
//   找到 → UPDATE（追加 aggregated_from UUID，刷新 value/occurred_at，保留原 alert_code）
//   未找到 → INSERT（聚合窗口可能已过期，当作新告警处理）

// 统一用 lock 保证线程安全，不混用 Interlocked 和 lock
public class AlertWindow
{
    private readonly object _lock = new();
    private int _count;
    private DateTime _windowStart = DateTime.UtcNow;
    public DateTime LastAccess { get; private set; } = DateTime.UtcNow;

    /// <summary>
    /// 原子操作：检查窗口过期 → 可能重置 → 递增计数 → 返回当前值
    /// </summary>
    public int IncrementAndMaybeReset(DateTime now)
    {
        lock (_lock)
        {
            LastAccess = now;
            if ((now - _windowStart).TotalMinutes > 30)
            {
                _windowStart = now;
                _count = 0;
            }
            return ++_count;
        }
    }
}
```

> **已知限制（Phase 1）：** `_windows` 是纯内存存储，进程重启后聚合窗口丢失。Phase 3 迁移到 Redis 持久化。

### 6.4 告警触发时机

```
遥测数据到达 → MQTT/HTTP Ingress
    → 数据校验 + 去重 + 标准化
    → 批量写入 TimescaleDB
    → 异步触发告警评估（每条遥测检查关联规则）
        → 规则匹配 → EvaluateAsync()
            → 未触发：结束
            → 触发：AlertAggregator.Evaluate() 判断创建/更新/静默
                → 创建/更新 → 发布 AlertTriggeredEvent
                    → EventHandler: 触发 AI 根因分析
                    → EventHandler: SignalR 推送前端
                    → EventHandler: 检查 auto_create_workorder → 创建工单
```

**Level 3 基线不足时自动降级：** `BaselineEvaluator` 检查 `SampleCount < 100` 直接返回 false，该规则不触发，退而匹配 Level 1/2 规则。无需额外逻辑。

---

## 七、模块间通信（事件总线）

### 7.1 事件总线接口

```csharp
/// <summary>
/// 模块间事件总线；生产使用 RabbitMQ，开发和测试可使用进程内实现
/// </summary>
public interface IEventBus
{
    Task PublishAsync<TEvent>(TEvent @event) where TEvent : IIntegrationEvent;
    void Subscribe<TEvent, THandler>()
        where TEvent : IIntegrationEvent
        where THandler : IEventHandler<TEvent>;
}

public interface IIntegrationEvent
{
    Guid EventId { get; }
    DateTime OccurredAt { get; }
    Guid TenantId { get; }
}

public interface IEventHandler<in TEvent> where TEvent : IIntegrationEvent
{
    Task HandleAsync(TEvent @event);
}
```

### 7.2 领域事件定义

```csharp
// 遥测数据已接收
public record TelemetryReceivedEvent(
    Guid EventId,
    DateTime OccurredAt,
    Guid TenantId,
    Guid DeviceId,
    string Metric,
    double Value,
    DateTime Timestamp
) : IIntegrationEvent;

// 告警已触发
public record AlertTriggeredEvent(
    Guid EventId,
    DateTime OccurredAt,
    Guid TenantId,
    Guid AlertId,
    Guid DeviceId,
    string Metric,
    double Value,
    string Severity
) : IIntegrationEvent;

// 告警已确认/解决
public record AlertStatusChangedEvent(
    Guid EventId,
    DateTime OccurredAt,
    Guid TenantId,
    Guid AlertId,
    string FromStatus,
    string ToStatus,
    Guid? OperatorId
) : IIntegrationEvent;

// AI 分析已完成
public record AnalysisCompletedEvent(
    Guid EventId,
    DateTime OccurredAt,
    Guid TenantId,
    Guid AnalysisId,
    Guid AlertId,
    Guid DeviceId,
    string RootCause,
    double Confidence
) : IIntegrationEvent;

// 工单已创建
public record WorkOrderCreatedEvent(
    Guid EventId,
    DateTime OccurredAt,
    Guid TenantId,
    Guid WorkOrderId,
    Guid? AlertId,
    string Type,
    string Priority
) : IIntegrationEvent;

// 工单状态已变更
public record WorkOrderStatusChangedEvent(
    Guid EventId,
    DateTime OccurredAt,
    Guid TenantId,
    Guid WorkOrderId,
    string FromStatus,
    string ToStatus,
    Guid? OperatorId
) : IIntegrationEvent;

// 工单已完成（触发知识沉淀）
public record WorkOrderCompletedEvent(
    Guid EventId,
    DateTime OccurredAt,
    Guid TenantId,
    Guid WorkOrderId,
    Guid DeviceId,
    double ActualHours,
    double AnalysisConfidence
) : IIntegrationEvent;
```

### 7.3 事件订阅关系

```
TelemetryReceivedEvent
    └→ AlertEvaluationHandler         -- 触发告警评估
    └→ BaselineCalculationHandler     -- 累积基线数据
    └→ DataQualityUpdateHandler       -- 更新数据质量评分

AlertTriggeredEvent
    └→ RootCauseAnalysisHandler       -- 触发 AI 分析
    └→ SignalRNotificationHandler     -- 推送前端
    └→ WorkOrderAutoCreateHandler     -- 自动创建工单（规则配置时）
    └→ ExternalNotificationHandler    -- 外部通知（邮件/钉钉）

AnalysisCompletedEvent
    └→ SignalRNotificationHandler     -- 推送分析结果
    └→ WorkOrderAutoCreateHandler     -- 根据分析结果创建工单

WorkOrderCreatedEvent
    └→ SignalRNotificationHandler     -- 推送前端
    └→ AutoAssignHandler              -- 智能派工
    └→ ExternalSyncHandler            -- 同步外部系统（中台模式）

WorkOrderCompletedEvent
    └→ KnowledgeCaptureHandler        -- 知识沉淀（生成案例 + 候选规则）
```

---

## 八、AI 根因分析

### 8.1 核心原则：自动降级 + 数据质量联动

```
评估链（数据质量评分 0.0-1.0 影响置信度加成）：
  有预测模型 且 数据质量≥0.8？ → Level 4 预测性AI
  有统计基线 且 数据质量≥0.6？ → Level 3 统计分析
  有匹配规则？                 → Level 2 规则诊断
  都没有？                     → Level 1 LLM对话诊断
```

规则命中后可通过 `KnowledgeRuleId` 关联 FMEA 故障模式库：诊断只读取当前租户或系统租户的启用条目，当前租户条目优先、按 RPN 降序最多取 3 条，并将故障模式、原因、影响、检测方式和维护建议作为可追溯上下文呈现；没有关联条目时保持原规则输出。FMEA 页面通过 `GET /api/v1/fmea/knowledge-rules` 提供当前设备类型的规则选择器，返回最小摘要并允许系统预置规则，服务端写入时仍执行租户归属校验。

### 8.2 分析引擎

```csharp
public class RootCauseAnalysisEngine
{
    public async Task<AnalysisResult> AnalyzeAsync(Alert alert)
    {
        // 1. 并行收集设备上下文
        var context = await CollectContextAsync(alert);

        // 2. 获取数据质量评分（影响分析级别和置信度，传入 tenant_id 保证多租户安全）
        var dataQuality = await _dataQualityService.GetScoreAsync(alert.TenantId, alert.DeviceId);

        // 3. 自动选择分析级别（降级机制）
        var level = DetermineLevel(alert, context, dataQuality);

        // 4. 按级别分析
        var result = level switch
        {
            4 => await AnalyzeByPrediction(alert, context),
            3 => await AnalyzeByStatistics(alert, context),
            2 => await AnalyzeByRule(alert, context),
            _ => await AnalyzeByLLM(alert, context)
        };

        // 5. 数据质量影响置信度（低质量数据降低置信度）
        result.Confidence *= GetQualityMultiplier(dataQuality);

        // 6. 置信度 < 0.7 标记需专家复核
        if (result.Confidence < 0.7)
            result.RequiresExpertReview = true;

        return result;
    }

    private int DetermineLevel(Alert alert, DeviceContext ctx, double dataQuality)
    {
        // 数据质量 < 0.4：只用 LLM 对话，避免垃圾数据导致误判
        if (dataQuality < 0.4) return 1;

        if (ctx.HasPredictionModel && dataQuality >= 0.8) return 4;
        if (ctx.Baseline?.SampleCount >= 100 && dataQuality >= 0.6) return 3;
        if (_knowledgeBase.HasRulesForDeviceType(alert.DeviceType)) return 2;
        return 1;
    }

    /// <summary>
    /// 数据质量 → 置信度乘数
    /// </summary>
    private double GetQualityMultiplier(double quality)
    {
        return quality switch
        {
            >= 0.8 => 1.0,    // 优秀数据：不降
            >= 0.6 => 0.9,    // 良好数据：轻微降
            >= 0.4 => 0.7,    // 一般数据：明显降
            _     => 0.5      // 差数据：大幅降
        };
    }

    // Level 1：数据驱动 LLM 诊断
    private async Task<AnalysisResult> AnalyzeByLLM(
        Alert alert, DeviceContext ctx)
    {
        var prompt = $"""
            你是工业设备故障分析专家。请基于以下真实数据进行分析。

            ## 告警信息
            - 设备：{ctx.Device.Name}（{ctx.Device.Type}）
            - 告警指标：{alert.Metric} = {alert.Value}，阈值 = {alert.Threshold}
            - 严重程度：{alert.Severity}

            ## 过去24小时{alert.Metric}趋势
            {FormatTelemetryTrend(ctx.RecentTelemetry, alert.Metric)}

            ## 正常基线
            - 平均值：{ctx.Baseline?.AvgValue}
            - 标准差：{ctx.Baseline?.StdDev}
            - 偏离：{Math.Abs(alert.Value - (ctx.Baseline?.AvgValue ?? 0))
                       / (ctx.Baseline?.StdDev ?? 1):F1} 倍标准差

            ## 该设备过去7天告警历史
            {FormatAlertHistory(ctx.AlertHistory)}

            ## 相关诊断规则
            {FormatDiagnosisRules(ctx.Rules)}

            请回答：
            1. 可能的根因（1-3个，按概率排序）
            2. 应急处理措施
            3. 是否需要创建工单？建议优先级和维护类型
            """;

        try
        {
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
            return await _llmService.QueryAsync(prompt, cts.Token);
        }
        catch (Exception ex) when (ex is TimeoutException or TaskCanceledException or HttpRequestException)
        {
            // LLM 不可用时降级为规则匹配结果
            _logger.LogWarning(ex, "LLM 服务不可用，降级为默认分析结果");
            return new AnalysisResult
            {
                PossibleCauses = [$"指标 {alert.Metric} 超出阈值，LLM 分析暂不可用"],
                Confidence = 0.3,
                RequiresExpertReview = true,
                RecommendedActions = ["人工检查设备状态", "联系维护工程师"],
            };
        }
    }

    // Level 2：规则引擎诊断（无匹配规则时降级到 LLM）
    private async Task<AnalysisResult> AnalyzeByRule(
        Alert alert, DeviceContext ctx)
    {
        var matched = ctx.Rules
            .Where(r => EvaluateRuleConditions(r, alert, ctx))
            .OrderByDescending(r => r.ConfidenceWeight)
            .ToList();

        if (!matched.Any())
            return await AnalyzeByLLM(alert, ctx);

        return new AnalysisResult
        {
            PossibleCauses = matched.Select(r => r.Conclusion).ToList(),
            Confidence = matched.First().ConfidenceWeight,
            RecommendedActions = matched.First().RecommendedActions,
            CheckSteps = matched.First().CheckSteps
        };
    }
}
```

### 8.3 数据质量评分

```csharp
public class DataQualityService
{
    // 所有方法必须传入 tenant_id，确保多租户安全
    public async Task<double> GetScoreAsync(Guid tenantId, Guid deviceId)
    {
        var completeness = await CalcCompletenessAsync(tenantId, deviceId);
        var accuracy = await CalcAccuracyAsync(tenantId, deviceId);
        var timeliness = await CalcTimelinessAsync(tenantId, deviceId);
        var consistency = await CalcConsistencyAsync(tenantId, deviceId);
        var validity = await CalcValidityAsync(tenantId, deviceId);

        return completeness * 0.30
             + accuracy * 0.25
             + timeliness * 0.15
             + consistency * 0.15
             + validity * 0.15;
    }

    // 完整性：期望数据点数 vs 实际数据点数
    private async Task<double> CalcCompletenessAsync(Guid tenantId, Guid deviceId)
    {
        // 过去24小时期望的样本数 vs 实际样本数
        // 期望 = 86400 / 设备上报间隔(秒)
        var expectedSamples = await GetExpectedSamplesAsync(tenantId, deviceId);
        var actualSamples = await _repo.GetSampleCountAsync(tenantId, deviceId, TimeSpan.FromHours(24));
        return Math.Min(1.0, (double)actualSamples / expectedSamples);
    }

    // 准确性：异常值（超出物理合理范围）比例
    private async Task<double> CalcAccuracyAsync(Guid tenantId, Guid deviceId)
    {
        var anomalies = await _repo.GetAnomalyCountAsync(tenantId, deviceId, TimeSpan.FromHours(24));
        var total = await _repo.GetSampleCountAsync(tenantId, deviceId, TimeSpan.FromHours(24));
        return total == 0 ? 0 : 1.0 - (double)anomalies / total;
    }

    // 时效性：数据延迟（统一返回 0.0-1.0，与其他维度一致）
    private async Task<double> CalcTimelinessAsync(Guid tenantId, Guid deviceId)
    {
        var latestDelay = await _repo.GetLatestDelayAsync(tenantId, deviceId);
        return latestDelay switch
        {
            < 1.0 => 1.0,    // <1秒
            < 10.0 => 0.8,   // <10秒
            < 60.0 => 0.5,   // <1分钟
            _ => 0.3          // >1分钟
        };
    }

    // 一致性：同一设备同一时间的多个数据源是否矛盾
    private async Task<double> CalcConsistencyAsync(Guid tenantId, Guid deviceId)
    {
        return await _repo.GetConsistencyScoreAsync(tenantId, deviceId);
    }

    // 有效性：超出设备合理范围的数据比例
    private async Task<double> CalcValidityAsync(Guid tenantId, Guid deviceId)
    {
        return await _repo.GetValidityScoreAsync(tenantId, deviceId);
    }
}
```

| 维度 | 权重 | 检测内容 |
|------|------|----------|
| 完整性 | 30% | 数据缺失比例 |
| 准确性 | 25% | 异常值比例 |
| 时效性 | 15% | 数据延迟（<1s=1.0, >1min=0.3） |
| 一致性 | 15% | 数据矛盾检测 |
| 有效性 | 15% | 超出合理范围比例 |

---

## 九、工单管理（三种可插拔模式）

### 9.1 三种定位

| 模式 | 说明 | 适合客户 |
|------|------|----------|
| 独立工单系统 | 完整工单管理，客户直接使用 | 无 CMMS |
| 工单中台 | 双向同步外部系统 | 有成熟 CMMS/审批 |
| 纯触发器 | 仅推送，不存储 | 不想引入新系统 |

### 9.2 工单服务

```csharp
public class WorkOrderService
{
    public async Task<WorkOrder> CreateFromAlert(
        Alert alert, AnalysisResult analysis)
    {
        var mode = _tenantConfig.GetWorkOrderMode(alert.TenantId);

        var wo = new WorkOrder
        {
            Title = $"[{alert.Severity}] {alert.DeviceName} - {alert.Metric}异常",
            Description = $"告警：{alert.Message}\n\n根因：{analysis.RootCause}\n\n建议：{analysis.Recommendation}",
            DeviceId = alert.DeviceId,
            AlertId = alert.Id,
            Priority = MapPriority(alert.Severity),
            Type = "corrective",
            RootCause = analysis.RootCause,
            RecommendedActions = analysis.RecommendedActions,
            CheckSteps = analysis.CheckSteps,
            RequiredParts = analysis.RequiredParts
        };

        switch (mode)
        {
            case WorkOrderMode.IndependentSystem:
                await _repo.CreateAsync(wo);
                await AutoAssign(wo);
                await _notification.NotifyAsync(wo.AssigneeId, wo);
                break;

            case WorkOrderMode.IntegrationHub:
                await _repo.CreateAsync(wo);
                var result = await _integration.PushAsync(wo);
                if (!result.Success)
                    await AutoAssign(wo);  // 推送失败降级为本地
                break;

            case WorkOrderMode.TriggerOnly:
                await _integration.PushAsync(wo);
                break;
        }

        return wo;
    }
}
```

### 9.3 状态机

**告警状态流转：**

```
active → acknowledged → resolved
  ↑            │
  │            └→（如果误确认，管理员可回退到 active）
  │
  └→（聚合告警自动更新，不改变状态）
```

| 状态 | 含义 | 可执行操作 | 允许转换到 |
|------|------|------------|------------|
| active | 告警触发中 | 确认 | acknowledged |
| acknowledged | 已确认，处理中 | 解决、回退 | resolved, active |
| resolved | 已解决 | — | — |

**工单状态流转：**

```
pending_dispatch → assigned → in_progress → completed → accepted → closed
       │              │            │             │
       │              │            │             └→ rejected → in_progress（返工）
       │              │            └→（暂停时可标记 pending_parts）
       │              └→ cancelled
       └→ cancelled
```

| 状态 | 含义 | 允许转换到 |
|------|------|------------|
| pending_dispatch | 待派工 | assigned, cancelled |
| assigned | 已派工待接单 | in_progress, cancelled |
| in_progress | 执行中 | completed, pending_parts |
| pending_parts | 等待备件 | in_progress |
| completed | 已完成待验收 | accepted, rejected |
| accepted | 验收通过 | closed |
| rejected | 验收驳回 | in_progress |
| closed | 已关闭 | — |
| cancelled | 已取消 | — |

### 9.4 外部系统集成适配器

```csharp
public interface IWorkOrderIntegration
{
    Task<IntegrationResult> CreateWorkOrderAsync(WorkOrder wo);
    Task UpdateStatusAsync(string externalId, string status);
}

// 钉钉集成适配器（完整实现示例）
public class DingTalkIntegration : IWorkOrderIntegration
{
    private readonly HttpClient _http;
    private readonly DingTalkConfig _config;
    // access_token 缓存（有效期2小时，提前5分钟刷新）
    private string _cachedToken;
    private DateTime _tokenExpiry = DateTime.MinValue;
    private readonly SemaphoreSlim _tokenLock = new(1, 1);

    /// <summary>
    /// 获取 access_token，带缓存避免频繁调用触发钉钉限流
    /// </summary>
    private async Task<string> GetAccessTokenAsync()
    {
        if (_cachedToken != null && DateTime.UtcNow < _tokenExpiry)
            return _cachedToken;

        await _tokenLock.WaitAsync();
        try
        {
            // 双检锁：等待锁期间可能已被其他线程刷新
            if (_cachedToken != null && DateTime.UtcNow < _tokenExpiry)
                return _cachedToken;

            var response = await _http.PostAsJsonAsync(
                "https://oapi.dingtalk.com/gettoken",
                new { appkey = _config.AppKey, appsecret = _config.AppSecret });
            var result = await response.Content.ReadFromJsonAsync<DingTalkTokenResponse>();

            _cachedToken = result?.AccessToken;
            _tokenExpiry = DateTime.UtcNow.AddSeconds((result?.ExpireIn ?? 7200) - 300);
            return _cachedToken;
        }
        finally { _tokenLock.Release(); }
    }

    public async Task<IntegrationResult> CreateWorkOrderAsync(WorkOrder wo)
    {
        var token = await GetAccessTokenAsync();

        // 创建审批实例
        var request = new
        {
            processCode = _config.ApprovalProcessCode,
            originatorUserId = await MapToDingTalkUserId(wo.CreatorId),
            formComponentValues = new[]
            {
                new { name = "设备名称", value = wo.DeviceName },
                new { name = "故障描述", value = wo.Description },
                new { name = "紧急程度", value = wo.Priority },
                new { name = "建议措施", value = string.Join("\n", wo.RecommendedActions ?? new List<string>()) },
                new { name = "预计工时", value = $"{wo.EstimatedHours}小时" }
            }
        };

        var response = await _http.PostAsJsonAsync(
            $"https://oapi.dingtalk.com/topapi/processinstance/create?access_token={token}",
            request);

        var result = await response.Content.ReadFromJsonAsync<DingTalkResponse>();

        if (result?.Errcode == 0)
            return IntegrationResult.Ok(result.ProcessInstanceId);
        else
            return IntegrationResult.Fail(result?.Errmsg ?? "未知错误");
    }

    public async Task UpdateStatusAsync(string externalId, string status)
    {
        // 钉钉审批不支持外部状态更新，仅记录同步日志
    }
}

// 飞书集成适配器
public class FeishuIntegration : IWorkOrderIntegration { ... }

// Maximo CMMS 集成适配器
public class MaximoIntegration : IWorkOrderIntegration { ... }

// 自定义 Webhook
public class WebhookIntegration : IWorkOrderIntegration { ... }
```

---

## 十、知识沉淀闭环（安全边界）

```csharp
public class KnowledgeCaptureService
{
    public async Task OnWorkOrderCompleted(WorkOrder wo)
    {
        if (wo.ActualHours <= 0.5 || string.IsNullOrEmpty(wo.ExecutionReport))
            return;

        // 通过 analysis_id 查询分析结果（不依赖导航属性）
        AnalysisResult? analysis = null;
        if (wo.AnalysisId.HasValue)
            analysis = await _analysisRepo.GetByIdAsync(wo.AnalysisId.Value);

        // 1. 创建故障案例
        var caseCandidate = new FaultCase
        {
            DeviceId = wo.DeviceId,
            DeviceType = wo.Device?.Type,
            FaultDescription = wo.Description,
            RootCause = wo.RootCause,
            Solution = wo.ExecutionReport,
            RepairDurationMinutes = (int)(wo.ActualHours * 60),
            PartsUsed = wo.RequiredParts,
            SourceWorkorderId = wo.Id,
            IsVerified = false
        };
        await _caseRepo.CreateAsync(caseCandidate);

        // 2. 高置信度时尝试自动生成规则（写入 pending_rules，不是正式规则）
        if (analysis?.Confidence >= 0.8)
        {
            await TryGenerateRule(wo, analysis, caseCandidate.Id);
        }
    }

    private async Task TryGenerateRule(WorkOrder wo, AnalysisResult analysis, Guid caseId)
    {
        var prompt = $"""
            从以下维修工单中提炼一条故障诊断规则：

            故障现象：{wo.Description}
            根因分析：{wo.RootCause}
            处理措施：{wo.ExecutionReport}
            设备类型：{wo.Device?.Type}

            请输出 JSON 格式的规则，包含：
            - conditions：触发条件（JSON数组）
            - conclusion：诊断结论
            - recommendedActions：建议操作（数组）
            - checkSteps：排查步骤（数组）
            """;

        var rule = await _llmService.ExtractRuleAsync(prompt);

        // 关键：写入 pending_rules，不写入正式 knowledge_rules
        // 专家批准后才移入正式规则库
        await _pendingRuleRepo.CreateAsync(new PendingRule
        {
            DeviceType = wo.Device?.Type,
            Name = $"自动生成-{wo.Device?.Type}-{DateTime.UtcNow:yyyyMMdd}",
            Conditions = rule.Conditions,
            Conclusion = rule.Conclusion,
            RecommendedActions = rule.RecommendedActions,
            CheckSteps = rule.CheckSteps,
            SourceWorkorderId = wo.Id,
            SourceCaseId = caseId,
            Confidence = analysis.Confidence,
            ReviewStatus = "pending"
        });
    }

    // 专家验证流程：将 pending_rule 批准后移入 knowledge_rules
    public async Task ApproveRuleAsync(Guid pendingRuleId, Guid reviewerId, string comment)
    {
        var pending = await _pendingRuleRepo.GetByIdAsync(pendingRuleId);

        await _ruleRepo.CreateAsync(new KnowledgeRule
        {
            DeviceType = pending.DeviceType,
            Name = pending.Name,
            Conditions = pending.Conditions,
            Conclusion = pending.Conclusion,
            RecommendedActions = pending.RecommendedActions,
            CheckSteps = pending.CheckSteps,
            Source = "auto_generated",
            CreatedBy = $"AI (专家验证: {reviewerId})"
        });

        pending.ReviewStatus = "approved";
        pending.ReviewedBy = reviewerId;
        pending.ReviewComment = comment;
        pending.ReviewedAt = DateTime.UtcNow;
        await _pendingRuleRepo.UpdateAsync(pending);
    }
}
```

---

## 十一、多租户

### 11.1 租户解析管线

```
请求进入 → TenantResolutionMiddleware
    → 按优先级解析 tenant_id：
        1. JWT Token 中的 tenant_id claim
        2. 请求头 X-Tenant-Id
        3. 子域名（tenant1.equipai.com → 查 tenants.slug）
    → 写入 ITenantContext（Scoped 生命周期）
    → 后续所有 Service/Repository 通过 ITenantContext 获取 tenant_id
```

```csharp
/// <summary>
/// 租户上下文（Scoped，每个请求独立）
/// </summary>
public interface ITenantContext
{
    Guid TenantId { get; }
    string IsolationMode { get; }  // shared / schema / database
    bool IsSystemAdmin { get; }    // system_admin 可跨租户操作
}

// EF Core 全局查询过滤器
// 所有实体自动注入 WHERE tenant_id = @current_tenant_id
// system_admin 请求跳过过滤器
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    foreach (var entity in modelBuilder.Model.GetEntityTypes())
    {
        if (entity.ClrType.GetProperty("TenantId") != null)
        {
            modelBuilder.Entity(entity.ClrType)
                .HasQueryFilter(
                    EF.Property<Guid>(entity.ClrType, "TenantId") == _tenantContext.TenantId);
        }
    }
}

// system_admin 跨租户操作时使用 IgnoreQueryFilters()
// var allDevices = _dbContext.Devices.IgnoreQueryFilters().Where(d => ...);

// 行业预置模板/规则归属系统租户（全零 UUID）
// 查询时需 UNION 当前租户和系统租户的数据：
// var templates = _dbContext.DeviceTypeTemplates.IgnoreQueryFilters()
//     .Where(t => t.TenantId == currentTenantId || t.TenantId == systemTenantId);
```

**系统租户：** 启动时自动创建 `tenant_id = '00000000-0000-0000-0000-000000000000'`，用于存放行业预置模板和共享规则。所有租户查询时 UNION 系统租户数据。

### 11.2 隔离策略

三种隔离策略按客户选择：shared（行级）、schema（独立 Schema）、database（独立库）。

| 策略 | 适用场景 | 实现方式 |
|------|----------|----------|
| shared | SaaS 中小客户 | 所有租户共享表，tenant_id 列过滤 |
| schema | 中等客户 | 同一 PG 实例，每个租户独立 Schema |
| database | 私有化大客户 | 独立 PG 数据库，连接字符串按租户切换 |

**Phase 1 只实现 shared 模式**。schema/database 模式预留接口（`ITenantDatabaseProvider`），Phase 3 实现。

### 11.3 数据库迁移策略

```bash
# 首次部署：创建数据库 + 应用所有迁移
dotnet ef database update

# 新版本发布：应用增量迁移
dotnet ef migrations add AddKnowledgeTables
dotnet ef database update

# 多租户 schema 模式（Phase 3）：
# 迁移脚本遍历所有租户，逐一执行
dotnet ef database update --schema=tenant_abc123
```

**TimescaleDB 注意事项：** hypertable 和连续聚合需要在迁移中通过 `migrationBuilder.Sql()` 执行原生 SQL（EF Core 不直接支持 TimescaleDB 扩展）。

---

## 十二、安全设计

### 12.1 安全层级

| 层级 | Phase 1 | Phase 3+ |
|------|---------|----------|
| 传输 | HTTPS (TLS 1.2+) | TLS 1.3 + mTLS (边缘) |
| 认证 | JWT + bcrypt | + OAuth2.0 + MFA |
| 授权 | RBAC 权限拦截器 | + 数据权限 |
| 限流 | 令牌桶 | + IP 黑名单 |
| 数据 | 参数化查询 | + TDE + 字段加密 |
| 审计 | 操作日志 | + 安全审计 + 合规报告 |
| 边缘 | API Key 认证 | + mTLS 双向证书 |

### 12.2 RBAC 权限拦截器

```csharp
[AttributeUsage(AttributeTargets.Method)]
public class RequirePermissionAttribute : Attribute
{
    public string Permission { get; }
    public RequirePermissionAttribute(string permission) => Permission = permission;
}

public class PermissionMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var endpoint = context.GetEndpoint();
        var attr = endpoint?.Metadata.GetMetadata<RequirePermissionAttribute>();
        if (attr != null)
        {
            var user = context.GetUser();
            if (!_roleService.HasPermission(user.Role, attr.Permission))
                throw new ForbiddenException($"缺少权限: {attr.Permission}");
        }
        await next(context);
    }
}
```

权限矩阵：

| 角色 | 设备 | 告警 | 工单 | 知识库 | 报表 | AI |
|------|------|------|------|--------|------|-----|
| system_admin | CRUD | CRUD | CRUD | CRUD | R | CRUD |
| maintenance_lead | RW | RW+配置 | RW+派工验收 | RW+验证 | R | R |
| technician | R | R+确认 | R+执行 | R | - | R+查询 |
| operator | R | R+确认 | R | - | R | R+查询 |
| viewer | R | R | R | R | R | - |

### 12.3 JWT 认证流程

**Token 结构：**

```json
{
  "sub": "user-uuid",
  "tenant_id": "tenant-uuid",
  "role": "maintenance_lead",
  "username": "zhangsan",
  "token_version": 3,
  "iat": 1717000000,
  "exp": 1717086400
}
```

**认证流程：**

```
登录 → 验证用户名密码（bcrypt）
    → 检查 token_version（密码修改后版本号递增，旧 Token 自动失效）
    → 生成 Access Token（默认 15min，配置钳制 10min-24h）+ Refresh Token（7d 有效，存 Redis）
    → 写入 HttpOnly Cookie；Production 浏览器响应体清空令牌，机器客户端需 X-API-Key 才返回令牌

请求 → JWT 中间件验证签名 + 过期时间
    → 从 token_version claim 与数据库比对（防止旧 Token 复用）
    → 写入 HttpContext.User（含 tenant_id、role claims）
    → TenantResolutionMiddleware 提取 tenant_id
    → PermissionMiddleware 检查权限

登出 → Redis 删除 Refresh Token
    → 无需黑名单（token_version 机制保证旧 Token 失效）

改密码 → users.token_version++
    → 所有已发放的 Token 自动失效（版本不匹配）
```

**Refresh Token 轮换：** 每次刷新时生成新的 Refresh Token，旧的立即删除，防止重放攻击。

---

## 十三、前端架构

### 13.1 技术栈

| 类别 | 选型 | 理由 |
|------|------|------|
| 框架 | React 19 + TypeScript (strict) | 团队熟悉 |
| 构建 | Vite | 快速 |
| 样式 | TailwindCSS + shadcn/ui | 轻量可定制 |
| 状态管理 | Zustand | 轻量，替代 Redux |
| 数据请求 | TanStack Query | 缓存+自动刷新+乐观更新 |
| 实时通信 | @microsoft/signalr | 自动重连+协议协商 |
| 图表 | ECharts | 工业仪表盘/热力图/3D |
| 国际化 | i18next | 中英文 |
| 表单 | React Hook Form + Zod | 类型安全校验 |

### 13.2 前端项目结构

```
frontend/src/
├── components/
│   ├── ui/                    -- shadcn/ui 基础组件
│   ├── charts/                -- ECharts 图表封装
│   ├── device/                -- 设备相关组件
│   ├── alert/                 -- 告警相关组件
│   ├── workorder/             -- 工单相关组件
│   └── layout/                -- 布局组件（Header/Sidebar/Footer）
│
├── pages/
│   ├── DashboardPage.tsx
│   ├── DeviceListPage.tsx
│   ├── DeviceDetailPage.tsx
│   ├── AlertCenterPage.tsx
│   ├── WorkOrderListPage.tsx
│   ├── WorkOrderDetailPage.tsx
│   ├── AnalyticsPage.tsx
│   ├── KnowledgePage.tsx      -- Phase 1 简版浏览，Phase 2 完整管理
│   └── SettingsPage.tsx
│
├── hooks/
│   ├── useDevices.ts          -- TanStack Query 设备数据
│   ├── useAlerts.ts           -- TanStack Query 告警数据
│   ├── useWorkOrders.ts       -- TanStack Query 工单数据
│   ├── useSignalR.ts          -- SignalR 连接管理
│   └── useDataQuality.ts      -- 数据质量评分
│
├── stores/
│   ├── authStore.ts           -- Zustand: 认证状态
│   └── notificationStore.ts   -- Zustand: 通知状态
│
├── lib/
│   ├── api.ts                 -- API 客户端（axios 封装）
│   ├── signalr.ts             -- SignalR 连接工厂
│   └── queryClient.ts         -- TanStack Query 配置
│
├── types/                     -- TypeScript 类型定义
└── i18n/                      -- 国际化配置
```

### 13.3 SignalR Hub（服务端）

```csharp
/// <summary>
/// 实时通信 Hub，按租户分组隔离
/// </summary>
public class IndustrialHub : Hub
{
    private readonly ITenantContext _tenantContext;

    public IndustrialHub(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    // 连接时自动加入租户组
    public override async Task OnConnectedAsync()
    {
        var tenantId = _tenantContext.TenantId;
        await Groups.AddToGroupAsync(
            Context.ConnectionId, $"tenant:{tenantId}");
        await base.OnConnectedAsync();
    }

    // 断开时自动离开租户组
    public override async Task OnDisconnectedAsync(Exception ex)
    {
        var tenantId = _tenantContext.TenantId;
        await Groups.RemoveFromGroupAsync(
            Context.ConnectionId, $"tenant:{tenantId}");
        await base.OnDisconnectedAsync(ex);
    }
}

// 使用方式（在 Service 层注入 IHubContext 推送）：
// _hubContext.Clients.Group($"tenant:{tenantId}")
//     .SendAsync("OnTelemetryUpdate", deviceId, metrics);
// _hubContext.Clients.Group($"tenant:{tenantId}")
//     .SendAsync("OnAlertTriggered", alert);
// _hubContext.Clients.Group($"tenant:{tenantId}")
//     .SendAsync("OnWorkOrderStatusChanged", workOrderId, status);
```

### 13.4 SignalR Hook（客户端）

```typescript
export function useSignalR(hubUrl: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl) // 浏览器自动携带 HttpOnly Cookie，不把令牌交给页面脚本
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();

    connection.on('OnTelemetryUpdate', (deviceId, metrics) => {
      queryClient.setQueryData(['telemetry', deviceId], metrics);
    });

    connection.on('OnAlertTriggered', (alert) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      showToast({ title: alert.message, severity: alert.severity });
    });

    connection.on('OnWorkOrderStatusChanged', (workOrderId, status) => {
      queryClient.invalidateQueries({ queryKey: ['workorders'] });
    });

    connection.start();
    return () => { connection.stop(); };
  }, [hubUrl]);
}
```

### 13.5 路由定义

```typescript
// router.tsx — React Router v6 嵌套路由
const routes = [
  { path: '/login', element: lazy(() => import('./pages/LoginPage')) },
  {
    path: '/',
    element: <AuthenticatedLayout />,    // 含 Sidebar + Header
    children: [
      { index: true, redirect: '/dashboard' },
      { path: 'dashboard', element: lazy(() => import('./pages/DashboardPage')) },
      {
        path: 'devices',
        children: [
          { index: true, element: lazy(() => import('./pages/DeviceListPage')) },
          { path: ':id', element: lazy(() => import('./pages/DeviceDetailPage')) },
        ],
      },
      { path: 'alerts', element: lazy(() => import('./pages/AlertCenterPage')) },
      {
        path: 'work-orders',
        children: [
          { index: true, element: lazy(() => import('./pages/WorkOrderListPage')) },
          { path: ':id', element: lazy(() => import('./pages/WorkOrderDetailPage')) },
        ],
      },
      { path: 'analytics', element: lazy(() => import('./pages/AnalyticsPage')) },
      { path: 'knowledge', element: lazy(() => import('./pages/KnowledgePage')) },
      { path: 'settings', element: lazy(() => import('./pages/SettingsPage')) },
    ],
  },
];
```

### 13.6 API 客户端层

```typescript
// lib/api.ts
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
});

// 请求拦截：认证 Cookie 由浏览器自动携带，不从 Web Storage 读取 JWT
api.interceptors.request.use((config) => {
  return config;
});

// 响应拦截：401 自动刷新 Token（加锁防止并发刷新）
let refreshPromise: Promise<number> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;

      // 多个请求同时 401 时，只刷新一次，其他请求排队等待
      if (!refreshPromise) {
        refreshPromise = (async () => {
          const { data } = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
          refreshPromise = null;
          return data.expiresIn;
        })();
      }

      await refreshPromise;
      return api(error.config);
    }
    return Promise.reject(error);
  }
);
```

> **当前安全说明：** 浏览器仅在 sessionStorage 保存用户信息和刷新调度时间戳；Access/Refresh Token 均由 HttpOnly + SameSite=Strict Cookie 管理，Production 响应体默认不返回 JWT。需要读取响应体 JWT 的机器客户端必须配置独立 `AUTH_MACHINE_API_KEY` 并发送 `X-API-Key`。

| 数据类型 | 管理方式 | 示例 |
|----------|----------|------|
| 服务端数据（设备/告警/工单） | TanStack Query | `useDevices()`, `useAlerts()` |
| 实时推送更新 | SignalR → invalidateQueries | 告警推送后刷新列表 |
| 全局 UI 状态（认证/通知） | Zustand | `authStore`, `notificationStore` |
| 表单临时状态 | React Hook Form | 创建/编辑表单 |

### 13.7 SignalR 消息协议

| 服务端方法名 | 方向 | 参数 | 触发场景 |
|-------------|------|------|----------|
| `OnTelemetryUpdate` | Server→Client | `(deviceId: string, metrics: Record<string, number>)` | 遥测数据到达 |
| `OnAlertTriggered` | Server→Client | `(alert: AlertDto)` | 告警触发/更新 |
| `OnAlertStatusChanged` | Server→Client | `(alertId: string, status: string)` | 告警确认/解决 |
| `OnWorkOrderCreated` | Server→Client | `(workOrder: WorkOrderDto)` | 工单创建 |
| `OnWorkOrderStatusChanged` | Server→Client | `(workOrderId: string, status: string)` | 工单状态变更 |
| `OnAnalysisCompleted` | Server→Client | `(analysisId: string, result: AnalysisResult)` | AI 分析完成 |
| `OnNotification` | Server→Client | `(notification: NotificationDto)` | 系统通知 |

所有消息按租户组隔离：服务端推送到 `tenant:{tenantId}` 组，客户端只收到自己租户的消息。

### 13.8 PWA

静态资源离线缓存 + 推送通知 + 添加到主屏幕 + 拍照上传 + 离线工单操作队列化（上线后自动同步）。
Service Worker 使用 `injectManifest`，由 `frontend/src/sw.ts` 同时管理 App Shell、认证 API 和 Background Sync：认证 API 使用 NetworkOnly，避免 Cache Storage 在 HttpOnly Cookie 场景下跨用户或跨租户复用响应；激活时及页面恢复会话前清理历史 `api-cache`。
离线操作条目必须绑定 `tenantId:userId`，查询、删除、重试和同步均按当前会话隔离；Background Sync 执行前通过 `/auth/me` 校验 Cookie 归属，页面会话切换通过 AbortController 中止旧同步。
登出或切换用户时清空 TanStack Query 缓存，避免 staleTime 内显示上一会话的服务端数据；无法归属的旧版本条目升级时安全清理。

---

## 十四、部署方案

### 14.1 本地开发环境

**前置要求：**

| 工具 | 版本 | 用途 |
|------|------|------|
| .NET SDK | 8.0+ | 后端开发 |
| Node.js | 20 LTS+ | 前端开发 |
| Docker | 24+ | 本地数据库/Redis/MQTT |
| Git | 2.40+ | 版本控制 |

**一键启动开发依赖（数据库 + Redis + MQTT）：**

```yaml
# docker-compose.dev.yml
services:
  postgres:
    image: timescale/timescaledb:latest-pg16
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: equipai_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: dev123
    volumes: [pgdev:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d equipai_dev"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  mosquitto:
    image: eclipse-mosquitto:2
    ports: ["1883:1883"]
    volumes:
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf

volumes:
  pgdev:
```

```bash
# 第一天：克隆项目 → 启动依赖 → 初始化数据库
git clone <repo> && cd EquipAI
docker compose -f docker/docker-compose.dev.yml up -d

# 数据库迁移（首次创建表结构）
cd src/EquipAI.WebAPI
dotnet ef database update

# 插入种子数据（默认租户 + admin 用户）
dotnet run --seed

# 启动后端（热重载）
dotnet watch

# 启动前端（另一个终端）
cd ../../frontend
npm install
npm run dev      # http://localhost:3000，代理 /api → localhost:8080

# 开发/测试管理员凭据由测试环境注入；生产环境管理员初始密码来自 `SEED_ADMIN_PASSWORD`，首次登录后必须修改
```

**前后端联调：** 前端 Vite 开发服务器（端口 3000）通过 `vite.config.ts` 代理 `/api` → `http://localhost:8080`，无需 CORS 配置。

### 14.2 生产部署（Docker Compose）

```yaml
services:
  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile
    ports: ["443:443"]
    environment:
      - VITE_API_URL=https://api.equipai.com
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    healthcheck:
      test: ["CMD", "curl", "-kf", "https://localhost"]

  backend:
    build:
      context: ../src
      dockerfile: ../../docker/Dockerfile.backend
    ports: ["8080:8080"]
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__Default=Host=postgres;Database=equipai;Username=postgres;Password=${PG_PASSWORD}
      - Redis__ConnectionString=redis:6379
      - Jwt__Secret=${JWT_SECRET}           # 必须 ≥ 32 字符，建议 64 字符随机字符串
      - Jwt__Issuer=EquipAI
      - Llm__ApiKey=${LLM_API_KEY}
      - Llm__BaseUrl=https://dashscope.aliyuncs.com/compatible-mode/v1
      - Llm__Model=qwen-plus
      - Mqtt__BrokerHost=mosquitto
      - Mqtt__BrokerPort=1883
      - Serilog__WriteTo__0__Args__serverUrl=http://seq:5341
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s

  postgres:
    image: timescale/timescaledb:latest-pg16
    environment:
      POSTGRES_DB: equipai
      POSTGRES_PASSWORD: ${PG_PASSWORD}
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d equipai"]

  redis:
    image: redis:7-alpine
    volumes: [redisdata:/data]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]

  mosquitto:
    image: eclipse-mosquitto:2
    ports: ["1883:1883"]
    volumes:
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf
      - mosquittodata:/mosquitto/data

  seq:
    image: datalust/seq:latest
    ports: ["5341:80"]
    environment:
      - ACCEPT_EULA=Y
    volumes: [seqdata:/data]

volumes:
  pgdata:
  redisdata:
  mosquittodata:
  seqdata:
```

| 方案 | 适用客户 | 架构 |
|------|----------|------|
| SaaS 云端 | 中小客户 | CDN + Docker Compose + RDS |
| 私有化 | 数据敏感客户 | 本地服务器 + Docker Compose |
| 混合部署 | 多工厂集团 | 边缘网关 + 云端聚合 |

---

## 十五、开发路线图

### Phase 1：核心闭环（8-10 周）

| 周 | 任务 | 交付 |
|----|------|------|
| 1-2 | 项目搭建 + 数据库 + 多租户 + JWT 认证 + RBAC | 可运行骨架 |
| 3-4 | 设备 CRUD + MQTT 接入 + 边缘网关基础版 | 数据流入系统 |
| 5-6 | 告警引擎（阈值 + 基线 + 聚合）+ SignalR + 基线计算 | 告警可用 |
| 7-8 | AI 根因分析（Level 1-3 + 降级）+ 工单独立模式 | AI + 工单可用 |
| 9-10 | 前端完整页面 + 知识库简版 + 联调 + Docker 部署 | **闭环可演示** |

### Phase 2：真实接入 + 知识沉淀（4-6 周）

| 周 | 任务 | 交付 |
|----|------|------|
| 1-3 | OPC UA + Modbus 适配器 | 接入真实 PLC |
| 4-5 | 断网保护 + 设备配置向导 + 工厂试点 | 真实设备接入 |
| 5-6 | 知识沉淀闭环（pending_rules + 专家验证） | 知识自进化 |

### Phase 3：产品化 + 集成（6-8 周）

| 周 | 任务 | 交付 |
|----|------|------|
| 1-2 | 工单完整工作流 + 智能派工 | 维护闭环完整 |
| 3-4 | 钉钉/飞书集成 + PWA 移动端 | 一线人员可用 |
| 5-6 | 知识库完整管理 + 行业知识预置 | 知识库丰富 |
| 7-8 | 多租户 SaaS + 数据质量监控 + 报表 | **SaaS 可运营** |

### Phase 4：智能化 + 生产化（4-6 周）

| 周 | 任务 | 交付 |
|----|------|------|
| 1-3 | ML.NET 异常检测（Level 4）+ 安全加固（mTLS/WAF） | 智能告警 + 安全达标 |
| 4-6 | 压力测试 + 性能优化 + 等保合规 + 生产部署 | **v1.0 发布** |

---

## 十六、团队分工（15 人）

| 小组 | 人数 | 职责 |
|------|------|------|
| 边缘接入组 | 3 | 边缘网关 + OPC UA + Modbus + 断网保护 |
| 后端业务组 | 4 | 设备/告警/工单/多租户/数据管道 |
| AI 知识组 | 2 | AI 根因 + 知识库 + 基线计算 + 数据质量 |
| 前端组 | 3 | Web 管理平台 + PWA + ECharts 仪表盘 |
| 集成运维组 | 2 | 外部系统集成 + 测试 + CI/CD + 部署 |
| 产品负责人 | 1 | 需求管理 + 客户对接 + 验收 |

---

## 十七、技术选型

| 类别 | 选型 | 理由 |
|------|------|------|
| 后端 | .NET 8 WebAPI | 团队技术栈 + 工业协议生态 |
| 前端 | React 19 + TypeScript + Vite | 团队技术栈 |
| UI | shadcn/ui + TailwindCSS | 轻量可定制 |
| 状态 | Zustand | 轻量 |
| 数据请求 | TanStack Query | 缓存+自动刷新 |
| 数据库 | PostgreSQL 16 + TimescaleDB | 业务+时序一体化 |
| 缓存 | Redis 7 | 标准 |
| 实时 | SignalR | 比原生 WebSocket 省心 |
| MQTT | MQTTnet + Mosquitto | 工业标准 |
| OPC UA | OPC Foundation SDK | 官方 |
| Modbus | FluentModbus | 活跃维护 |
| ML | ML.NET | C# 全栈统一 |
| LLM | GLM-5 / Qwen | 国内可用 |
| 图表 | ECharts | 工业场景功能全 |
| 表单 | React Hook Form + Zod | 类型安全 |
| 移动端 | PWA | 一套代码多端 |
| 容器 | Docker Compose → K8s | 渐进引入 |
| CI/CD | GitHub Actions | 团队已使用 |
| 边缘数据库 | SQLite | 轻量嵌入式 |
| ORM | EF Core 8 + Npgsql | .NET 标准 |
| 日志 | Serilog + Seq | .NET 生态 |
| 测试 | xUnit + Vitest + Playwright | 前后端统一 |

---

## 附录 A：业务流程全链路

```
设备数据采集（边缘 OPC UA/Modbus/MQTT / HTTP API / Excel / 手动录入）
    → 数据接入层（校验/去重/打标/单位转换）
    → 时序存储（TimescaleDB 窄表）+ 实时推送（SignalR）
    → 告警引擎评估（Level 1-4 + 聚合 + 抑制）
    → 告警触发
    → AI 根因分析（Level 1-4 自动降级，数据质量影响置信度）
    → 工单创建（独立/中台/触发器，推送失败自动降级）
    → 智能派工（技能匹配 + 位置就近 + 负载均衡）
    → 工单执行（PWA 移动端 / 拍照 / 日志）
    → 工单验收
    → 知识沉淀（AI 生成候选规则 → pending_rules → 专家验证 → knowledge_rules）
    → 知识库丰富 → 下次分析更准（正向循环）
```

## 附录 B：API 通用约定

### B.0 请求与响应规范

**分页参数（所有列表接口统一）：**

```
?page=1&pageSize=20&sort=created_at&order=desc
过滤参数：?status=active&severity=high&device_type=CNC
关键词搜索：?keyword=CNC-001
```

**分页响应格式：**

```json
{
  "items": [],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5
}
```

**错误响应格式（全局统一）：**

```json
{
  "code": "ALERT_NOT_FOUND",
  "message": "告警不存在",
  "details": null
}
```

| HTTP 状态码 | 含义 | 示例 |
|-------------|------|------|
| 400 | 参数校验失败 | `INVALID_PARAMETER` |
| 401 | 未认证 / Token 过期 | `UNAUTHORIZED` |
| 403 | 权限不足 | `FORBIDDEN: 缺少权限 device:delete` |
| 404 | 资源不存在 | `DEVICE_NOT_FOUND` |
| 409 | 资源冲突（重复创建） | `DEVICE_ALREADY_EXISTS` |
| 429 | 请求限流 | `RATE_LIMITED` |
| 500 | 服务器内部错误 | `INTERNAL_ERROR` |

---

## 附录 C：API 接口清单

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/auth/login | 登录（浏览器通过 HttpOnly Cookie；机器客户端携带 `X-API-Key` 时返回 JWT + Refresh Token） |
| POST | /api/v1/auth/refresh | 刷新 Token |
| POST | /api/v1/auth/logout | 登出（失效 Token） |
| POST | /api/v1/auth/change-password | 修改密码 |

### 用户管理（需管理员）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/admin/users | 用户列表 |
| POST | /api/v1/admin/users | 创建用户 |
| PUT | /api/v1/admin/users/{id} | 更新用户 |
| DELETE | /api/v1/admin/users/{id} | 禁用用户 |
| PUT | /api/v1/admin/users/{id}/role | 变更角色 |

### 租户管理（需系统管理员）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/admin/tenants | 租户列表 |
| POST | /api/v1/admin/tenants | 创建租户 |
| PUT | /api/v1/admin/tenants/{id} | 更新租户配置（含工单模式） |
| GET | /api/v1/admin/tenants/{id}/usage | 租户资源使用量（设备数/用户数/存储） |

### 系统配置

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/admin/configs/{key} | 获取系统配置 |
| PUT | /api/v1/admin/configs/{key} | 更新系统配置 |

### 健康检查

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /health | 服务健康检查（数据库/Redis/MQTT 连通性） |

### 设备管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/devices | 设备列表（分页/过滤） |
| GET | /api/v1/devices/{id} | 设备详情 |
| POST | /api/v1/devices | 创建设备 |
| PUT | /api/v1/devices/{id} | 更新设备 |
| DELETE | /api/v1/devices/{id} | 删除设备 |
| POST | /api/v1/devices/import | 批量导入（Excel/CSV/JSON） |
| GET | /api/v1/devices/{id}/telemetry | 获取遥测数据 |
| GET | /api/v1/devices/{id}/health | 设备健康度 + 数据质量评分 |
| GET | /api/v1/device-types | 设备类型模板列表 |
| POST | /api/v1/device-types | 创建设备类型模板 |

### 告警管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/alerts | 告警列表 |
| GET | /api/v1/alerts/{id} | 告警详情 |
| PUT | /api/v1/alerts/{id}/acknowledge | 确认告警 |
| PUT | /api/v1/alerts/{id}/resolve | 解决告警 |
| GET/POST | /api/v1/alert-rules | 告警规则 CRUD |
| PUT | /api/v1/alert-rules/{id}/toggle | 启用/禁用 |
| POST | /api/v1/alert-rules/{id}/test | 测试规则 |

### AI 分析

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/analyses | 请求 AI 分析 |
| GET | /api/v1/analyses/{id} | 分析结果 |
| POST | /api/v1/analyses/{id}/feedback | 反馈诊断准确性 |
| POST | /api/v1/ai/chat | AI 对话诊断 |
| GET | /api/v1/data-quality/{deviceId} | 数据质量评分 |

### 工单管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/work-orders | 工单列表 |
| GET | /api/v1/work-orders/{id} | 工单详情 |
| POST | /api/v1/work-orders | 创建工单 |
| PUT | /api/v1/work-orders/{id}/assign | 派工 |
| PUT | /api/v1/work-orders/{id}/status | 状态变更 |
| POST | /api/v1/work-orders/{id}/logs | 添加日志 |
| POST | /api/v1/work-orders/{id}/accept | 验收 |

### 知识库

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/knowledge/rules | 正式规则列表 |
| POST | /api/v1/knowledge/rules | 创建规则 |
| GET | /api/v1/knowledge/pending-rules | 候选规则列表 |
| PUT | /api/v1/knowledge/pending-rules/{id}/approve | 批准候选规则 |
| PUT | /api/v1/knowledge/pending-rules/{id}/reject | 驳回候选规则 |
| GET | /api/v1/knowledge/cases | 故障案例列表 |
| POST | /api/v1/knowledge/import | 导入行业知识库 |

### FMEA 故障模式库

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/fmea | 分页查询当前租户 FMEA 条目 |
| GET | /api/v1/fmea/knowledge-rules?deviceType=&selectedRuleId= | 获取 FMEA 表单可关联的当前租户/系统预置规则摘要，最多 100 条；编辑中的停用规则可通过 `selectedRuleId` 保留 |
| POST | /api/v1/fmea | 创建 FMEA 条目 |
| PUT | /api/v1/fmea/{id} | 更新 FMEA 条目 |
| PUT | /api/v1/fmea/{id}/toggle | 启用或停用 FMEA 条目 |
| DELETE | /api/v1/fmea/{id} | 删除 FMEA 条目 |

### 报表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/reports/dashboard | 仪表盘数据 |
| GET | /api/v1/reports/device-fault-ranking | 设备故障排行 |
| GET | /api/v1/reports/work-order-stats | 工单统计 |
| GET | /api/v1/reports/mtbf-mttr | MTBF/MTTR 看板 |

### 数据接入

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/telemetry | 遥测数据上报（HTTP） |
| MQTT | factory/{tenantId}/telemetry/{deviceId} | 遥测数据上报（MQTT） |
| POST | /api/v1/import/devices | 设备批量导入 |
| POST | /api/v1/import/telemetry | 遥测历史数据导入 |
