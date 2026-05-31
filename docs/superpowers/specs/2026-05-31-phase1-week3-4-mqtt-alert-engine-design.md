# Phase 1 Week 3-4: MQTT 接入 & 告警引擎设计规格

> 日期：2026-05-31
> 范围：MQTT 数据接入管道、TimescaleDB 时序表、阈值告警、聚合防风暴
> 参考：`docs/FINAL_TECHNICAL_DESIGN.md`

## 目标

实现 MQTT 数据接入管道和告警引擎核心闭环：
- 数据能通过 MQTT 流入系统
- 阈值告警能正确触发
- 告警风暴能被有效抑制
- HTTP 接入作为备用通道

**不包含**：Level 3 基线告警、SignalR 实时推送、连续聚合视图（留待 Week 5-6）

## 文件结构

```
EquipAI.slnx
├── src/
│   ├── EquipAI.Core/
│   │   ├── Entities/
│   │   │   ├── AlertRule.cs
│   │   │   └── Alert.cs
│   │   ├── Events/
│   │   │   ├── TelemetryReceivedEvent.cs
│   │   │   └── AlertTriggeredEvent.cs
│   │   ├── Enums/
│   │   │   ├── AlertSeverity.cs
│   │   │   ├── AlertStatus.cs
│   │   │   ├── RuleType.cs
│   │   ├── Interfaces/
│   │   │   ├── ITelemetryService.cs
│   │   │   ├── IAlertEvaluationService.cs
│   │   │   ├── IAlertRuleEvaluator.cs
│   │   │   ├── IAlertAggregator.cs
│   │
│   ├── EquipAI.Application/
│   │   ├── Telemetry/
│   │   │   ├── TelemetryService.cs
│   │   │   ├── TelemetryIngestHandler.cs
│   │   │   ├── DTOs/TelemetryMessageDto.cs
│   │   ├── Alerts/
│   │   │   ├── AlertEvaluationService.cs
│   │   │   ├── AlertAggregator.cs
│   │   │   ├── Evaluators/
│   │   │   │   ├── ThresholdEvaluator.cs
│   │   │   │   ├── CombinedEvaluator.cs
│   │   │   ├── Handlers/
│   │   │   │   ├── TelemetryEventHandler.cs
│   │   │   │   ├── AlertEventHandler.cs
│   │   │   ├── DTOs/
│   │   │   │   ├── AlertRuleDto.cs
│   │   │   │   ├── CreateAlertRuleRequest.cs
│   │   │   │   ├── UpdateAlertRuleRequest.cs
│   │   │   │   ├── AlertDto.cs
│   │
│   ├── EquipAI.Infrastructure/
│   │   ├── Messaging/
│   │   │   ├── MqttClientService.cs
│   │   │   ├── MqttBackgroundService.cs
│   │   │   ├── MqttMessageHandler.cs
│   │   ├── Data/
│   │   │   ├── Entities/DeviceTelemetry.cs
│   │   │   ├── Configurations/
│   │   │   │   ├── AlertRuleConfiguration.cs
│   │   │   │   ├── AlertConfiguration.cs
│   │   │   │   ├── DeviceTelemetryConfiguration.cs
│   │   │   ├── TimescaleDbSetup.cs
│   │
│   ├── EquipAI.WebAPI/
│   │   ├── Controllers/
│   │   │   ├── TelemetryController.cs
│   │   │   ├── AlertRulesController.cs
│   │   │   ├── AlertsController.cs
│
│   └── tests/
│       ├── EquipAI.Tests.Unit/
│       │   ├── Alerts/
│       │   │   ├── ThresholdEvaluatorTests.cs
│       │   │   ├── CombinedEvaluatorTests.cs
│       │   │   ├── AlertAggregatorTests.cs
│       │   ├── Telemetry/
│       │   │   ├── TelemetryServiceTests.cs
```

## MQTT 数据接入管道

### 主题格式

```
factory/{tenantId}/telemetry/{deviceId}
```

示例：`factory/11111111-1111-1111-1111-111111111111/telemetry/CNC-001`

### 消息格式

```json
{
  "device_id": "CNC-001",
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

### 处理流程

```
MQTT 消息到达 (MqttBackgroundService)
  → 解析主题提取 tenantId/deviceId (MqttMessageHandler)
  → Schema 校验（必填字段：device_id, timestamp, metrics）
  → 租户验证（tenantId 存在且活跃）
  → 设备验证（deviceId 已注册）
  → 去重检查（Redis SET: {tenantId}:{deviceId}:{timestamp}, TTL 60s）
  → 拆分为窄表行（每条 metric 一行）
  → 批量写入 TimescaleDB（内存队列，500ms 或 100 条 flush）
  → 发布 TelemetryReceivedEvent（异步触发告警评估）
```

### 关键实现

**MqttBackgroundService**：
- 使用 MQTTnet 订阅 `factory/+/telemetry/+`
- 连接 Mosquitto（localhost:1883）
- 断线自动重连（30秒间隔）
- 消息分发到 MqttMessageHandler

**TelemetryService**：
- 批量写入队列（ConcurrentQueue）
- 定时 flush（BackgroundTimer 每 500ms）
- 条件 flush（队列满 100 条）
- 发布 TelemetryReceivedEvent 到 EventBus

**去重策略**：
- Redis SET 存储 `{tenantId}:{deviceId}:{timestamp}`
- TTL 60 秒
- 相同 timestamp 的消息视为重复

## TimescaleDB 时序数据库

### device_telemetry 窄表

```sql
CREATE TABLE device_telemetry (
    time            TIMESTAMPTZ NOT NULL,
    tenant_id       UUID NOT NULL,
    device_id       UUID NOT NULL,
    metric          VARCHAR(100) NOT NULL,
    value           DOUBLE PRECISION,
    string_value    VARCHAR(500),
    quality         VARCHAR(20) DEFAULT 'good',
    source          VARCHAR(20) DEFAULT 'mqtt'
);
```

**窄表设计**：一行一个指标，新增指标不改 Schema。

### TimescaleDB 配置

```sql
-- 创建超级表（按天分区）
SELECT create_hypertable('device_telemetry', 'time',
    chunk_time_interval => INTERVAL '1 day');

-- 索引
CREATE INDEX idx_telemetry_tenant_device_time
    ON device_telemetry (tenant_id, device_id, time DESC);
CREATE INDEX idx_telemetry_tenant_device_metric
    ON device_telemetry (tenant_id, device_id, metric, time DESC);

-- 压缩策略
ALTER TABLE device_telemetry SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'tenant_id, device_id',
    timescaledb.compress_orderby = 'time DESC'
);
SELECT add_compression_policy('device_telemetry', INTERVAL '7 days');

-- 保留策略
SELECT add_retention_policy('device_telemetry', INTERVAL '90 days');
```

### EF Core 配置

**DeviceTelemetry 实体**（无主键）：
- 无 TenantId 全局过滤器（时序数据量大，查询时手动过滤）
- `HasNoKey()` 配置

**TimescaleDbSetup**：
- 应用启动时执行超级表创建
- 检测已存在则跳过

## 告警引擎基础

### AlertRule 实体

```csharp
public class AlertRule : BaseEntity
{
    public Guid TenantId { get; set; }
    public string Name { get; set; }           // 规则名称
    public string? DeviceType { get; set; }    // 设备类型过滤（可选）
    public Guid? DeviceId { get; set; }        // 特定设备（可选）
    public string Metric { get; set; }         // 监控指标
    public RuleType RuleType { get; set; }     // threshold/combined
    public string? Operator { get; set; }      // > >= < <= ==
    public decimal? Threshold { get; set; }    // 阈值
    public string? Conditions { get; set; }    // JSONB 组合条件
    public AlertSeverity Severity { get; set; }// critical/high/normal/low
    public int CooldownSeconds { get; set; } = 300;
    public bool AutoCreateWorkorder { get; set; }
    public bool Enabled { get; set; } = true;
    public Guid? CreatedBy { get; set; }
}
```

### Alert 实体

```csharp
public class Alert : BaseEntity
{
    public Guid TenantId { get; set; }
    public string AlertCode { get; set; }      // ALT-{device_code}-{metric}-{yyyyMMddHHmmss}
    public Guid? RuleId { get; set; }
    public Guid DeviceId { get; set; }
    public AlertSeverity Severity { get; set; }
    public AlertStatus Status { get; set; }    // active/acknowledged/resolved
    public string Metric { get; set; }
    public decimal Value { get; set; }
    public decimal? Threshold { get; set; }
    public string? Message { get; set; }
    public string? DataSnapshot { get; set; }  // JSONB
    public Guid[]? AggregatedFrom { get; set; } // 聚合来源
    public DateTime OccurredAt { get; set; }
    public Guid? AcknowledgedBy { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public string? AcknowledgementNote { get; set; }
    public Guid? ResolvedBy { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? Resolution { get; set; }
}
```

### 阈值评估器（ThresholdEvaluator）

```csharp
public interface IAlertRuleEvaluator
{
    RuleType RuleType { get; }
    bool Evaluate(double value, AlertRule rule, DeviceContext? context = null);
}

public class ThresholdEvaluator : IAlertRuleEvaluator
{
    public RuleType RuleType => RuleType.Threshold;

    public bool Evaluate(double value, AlertRule rule, DeviceContext? context = null)
    {
        if (rule.Threshold == null || rule.Operator == null)
            return false;

        return rule.Operator switch
        {
            ">"  => value > (double)rule.Threshold,
            ">=" => value >= (double)rule.Threshold,
            "<"  => value < (double)rule.Threshold,
            "<=" => value <= (double)rule.Threshold,
            "==" => Math.Abs(value - (double)rule.Threshold) < 0.001,
            _    => false
        };
    }
}
```

### 组合条件评估器（CombinedEvaluator）

```csharp
public class CombinedEvaluator : IAlertRuleEvaluator
{
    public RuleType RuleType => RuleType.Combined;

    public bool Evaluate(double value, AlertRule rule, DeviceContext? context = null)
    {
        if (context == null || rule.Conditions == null)
            return false;

        // Conditions JSONB 格式：
        // [{"metric": "temperature", "operator": ">", "threshold": 80},
        //  {"metric": "vibration", "operator": ">", "threshold": 3}]
        // 所有条件必须同时满足

        var conditions = JsonSerializer.Deserialize<List<Condition>>(rule.Conditions);
        if (conditions == null || conditions.Count == 0)
            return false;

        return conditions.All(c => EvaluateCondition(c, context));
    }

    private bool EvaluateCondition(Condition condition, DeviceContext context)
    {
        var metricValue = context.GetMetricValue(condition.Metric);
        if (metricValue == null) return false;

        return condition.Operator switch
        {
            ">"  => metricValue > condition.Threshold,
            ">=" => metricValue >= condition.Threshold,
            "<"  => metricValue < condition.Threshold,
            "<=" => metricValue <= condition.Threshold,
            "==" => Math.Abs(metricValue.Value - condition.Threshold) < 0.001,
            _    => false
        };
    }
}
```

### 告警聚合防风暴

**30 分钟窗口规则**：
- Key: `{deviceId}:{metric}`
- 第 1 次：立即创建新告警
- 第 2-3 次：更新已有告警（追加 AggregatedFrom）
- 超过 3 次：静默，不处理

```csharp
public class AlertAggregator : IAlertAggregator
{
    private readonly ConcurrentDictionary<string, AlertWindow> _windows = new();
    private DateTime _lastCleanup = DateTime.UtcNow;
    
    public (bool ShouldCreate, bool ShouldUpdate, bool Silenced) Evaluate(
        Guid deviceId, string metric)
    {
        CleanupStaleWindows();
        var key = $"{deviceId}:{metric}";
        var window = _windows.GetOrAdd(key, _ => new AlertWindow());
        var count = window.Increment();
        
        return count switch
        {
            1 => (true, false, false),
            <= 3 => (false, true, false),
            _ => (false, false, true)
        };
    }
    
    private void CleanupStaleWindows()
    {
        if ((DateTime.UtcNow - _lastCleanup).TotalMinutes < 10) return;
        _lastCleanup = DateTime.UtcNow;
        
        foreach (var kvp in _windows.ToList())
        {
            if ((DateTime.UtcNow - kvp.Value.LastAccess).TotalMinutes > 30)
                _windows.TryRemove(kvp.Key, out _);
        }
    }
}

public class AlertWindow
{
    private readonly object _lock = new();
    private int _count;
    private DateTime _windowStart = DateTime.UtcNow;
    public DateTime LastAccess { get; private set; } = DateTime.UtcNow;
    
    public int Increment()
    {
        lock (_lock)
        {
            var now = DateTime.UtcNow;
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

### 告警触发流程

```
TelemetryReceivedEvent 发布
  → TelemetryEventHandler.HandleAsync()
  → AlertEvaluationService.EvaluateForDeviceAsync()
      → 查询匹配 AlertRules（Metric + DeviceType/DeviceId）
      → 遍历规则调用 Evaluator.Evaluate()
      → 触发时调用 AlertAggregator.Evaluate()
          → ShouldCreate: 创建 Alert + 发布 AlertTriggeredEvent
          → ShouldUpdate: 更新已有 Alert（追加 AggregatedFrom）
          → Silenced: 不处理
```

## 事件定义

### TelemetryReceivedEvent

```csharp
public record TelemetryReceivedEvent(
    Guid EventId,
    DateTime OccurredAt,
    Guid TenantId,
    Guid DeviceId,
    string Metric,
    double Value,
    DateTime Timestamp,
    string Quality
) : IIntegrationEvent;
```

### AlertTriggeredEvent

```csharp
public record AlertTriggeredEvent(
    Guid EventId,
    DateTime OccurredAt,
    Guid TenantId,
    Guid AlertId,
    Guid DeviceId,
    Guid? RuleId,
    string Metric,
    double Value,
    string Severity
) : IIntegrationEvent;
```

## API 端点

### 告警规则管理（`/api/v1/alert-rules`）

| 方法 | 端点 | 权限 | 说明 |
|------|------|------|------|
| GET | `/` | alert:read | 规则列表（分页） |
| GET | `/`{id}` | alert:read | 规则详情 |
| POST | `/` | alert:config | 创建规则 |
| PUT | `/`{id}` | alert:config | 更新规则 |
| DELETE | `/`{id}` | alert:delete | 删除规则 |

### 告警管理（`/api/v1/alerts`）

| 方法 | 端点 | 权限 | 说明 |
|------|------|------|------|
| GET | `/` | alert:read | 告警列表（分页、状态过滤） |
| GET | `/`{id}` | alert:read | 告警详情 |
| PUT | `/`{id}`/acknowledge | alert:acknowledge | 确认告警 |
| PUT | `/`{id}`/resolve | alert:update | 解决告警 |

### 遥测 HTTP 接入（`/api/v1/telemetry`）

| 方法 | 端点 | 权限 | 说明 |
|------|------|------|------|
| POST | `/` | device:read | HTTP 上报遥测数据 |

## DTO 定义

### CreateAlertRuleRequest

```json
{
  "name": "温度过高告警",
  "deviceType": "CNC",
  "deviceId": null,
  "metric": "temperature",
  "ruleType": "threshold",
  "operator": ">",
  "threshold": 90,
  "conditions": null,
  "severity": "high",
  "cooldownSeconds": 300,
  "autoCreateWorkorder": false
}
```

### TelemetryUploadRequest

```json
{
  "deviceId": "uuid-or-device-code",
  "metrics": {
    "temperature": 85.3,
    "vibration": 2.1
  },
  "timestamp": "2026-05-31T10:30:00Z",
  "quality": "good"
}
```

### AlertDto

```json
{
  "id": "uuid",
  "alertCode": "ALT-CNC-001-temperature-20260531103000",
  "deviceId": "uuid",
  "deviceName": "CNC 数控机床 1号",
  "severity": "high",
  "status": "active",
  "metric": "temperature",
  "value": 95.2,
  "threshold": 90,
  "message": "温度超过阈值 90°C",
  "occurredAt": "2026-05-31T10:30:00Z",
  "acknowledged": false,
  "resolved": false
}
```

## 数据库迁移

新增表：
- `alert_rules`
- `alerts`
- `device_telemetry`（TimescaleDB 超级表）

迁移步骤：
1. EF Core 创建业务表（alert_rules、alerts）
2. TimescaleDbSetup 创建超级表和策略

## 测试范围

### 单元测试

- ThresholdEvaluator：各操作符测试（> >= < <= ==）
- CombinedEvaluator：多条件组合测试
- AlertAggregator：创建/更新/静默策略测试、窗口过期重置测试

### 集成测试

- MQTT 接入流程：消息订阅→解析→存储→事件发布
- 告警触发流程：遥测→规则匹配→告警创建

## 不包含在 Week 3-4

- Level 3 基线告警（需要基线计算服务）
- SignalR Hub 实时推送
- telemetry_hourly 连续聚合视图
- metric_baselines 表和基线计算服务
- AI 根因分析触发

这些功能将在 Week 5-6 实现。