# Phase 1 Week 7-8: AI 根因分析 & 工单管理 设计规格

> 日期：2026-05-31
> 范围：AI 根因分析（L1-L3 自动降级）、工单管理（独立模式）、数据质量评估、Semantic Kernel LLM 集成
> 参考：`docs/FINAL_TECHNICAL_DESIGN.md`

## 目标

在 Week 5-6 的基线告警和 SignalR 推送基础上，完成两个核心模块：
- AI 根因分析能根据告警自动触发，按数据质量自动选择分析级别（统计→规则→LLM）
- 工单管理支持完整生命周期（创建→派工→执行→完成→验收→关闭），告警可自动创建工单

**不包含**：知识库（knowledge_rules / pending_rules / fault_cases）、外部系统集成（钉钉/飞书/Webhook）、Level 4 预测性 AI（ML.NET）

## 构建策略

功能模块并行构建，两个模块各自有完整的实体→服务→API 链路：
1. **AI 分析模块**：DataQualityService + RootCauseAnalysisEngine + Semantic Kernel + Analysis 实体
2. **工单模块**：WorkOrder/WorkOrderLog 实体 + WorkOrderService + 事件集成
3. 两个模块通过事件总线解耦（AnalysisCompletedEvent → 工单更新根因）

## 文件结构

```
新增文件：

src/EquipAI.Core/
├── Entities/
│   ├── Analysis.cs                     — 分析结果实体
│   ├── WorkOrder.cs                    — 工单实体
│   └── WorkOrderLog.cs                 — 工单日志实体
├── Enums/
│   ├── AnalysisLevel.cs                — 分析级别（L1/L2/L3）
│   ├── AnalysisStatus.cs               — 分析状态
│   ├── WorkOrderType.cs                — 工单类型
│   ├── WorkOrderStatus.cs              — 工单状态
│   ├── WorkOrderPriority.cs            — 工单优先级
│   └── WorkOrderLogAction.cs           — 工单日志操作类型
├── Events/
│   ├── AnalysisCompletedEvent.cs       — 分析完成事件
│   ├── WorkOrderCreatedEvent.cs        — 工单创建事件
│   └── WorkOrderStatusChangedEvent.cs  — 工单状态变更事件
├── Interfaces/
│   ├── IAnalysisService.cs             — 分析服务接口
│   ├── IWorkOrderService.cs            — 工单服务接口
│   ├── IDataQualityService.cs          — 数据质量服务接口
│   └── ILLMService.cs                  — LLM 服务接口

src/EquipAI.Application/
├── Analysis/
│   ├── RootCauseAnalysisEngine.cs      — 根因分析引擎（降级链）
│   ├── DataQualityService.cs           — 数据质量评分（5 维度）
│   ├── Handlers/
│   │   └── RootCauseAnalysisHandler.cs — 告警触发→触发分析
│   ├── DTOs/
│   │   ├── AnalysisDto.cs              — 分析结果 DTO
│   │   └── CreateAnalysisRequest.cs    — 手动触发分析请求
├── WorkOrders/
│   ├── WorkOrderService.cs             — 工单服务实现
│   ├── Handlers/
│   │   ├── WorkOrderAutoCreateHandler.cs     — 告警→自动创建工单
│   │   └── WorkOrderAnalysisHandler.cs       — 分析结果→更新工单
│   ├── DTOs/
│   │   ├── WorkOrderDto.cs             — 工单 DTO
│   │   ├── CreateWorkOrderRequest.cs   — 创建工单请求
│   │   ├── AssignWorkOrderRequest.cs   — 派工请求
│   │   └── CompleteWorkOrderRequest.cs — 完成工单请求

src/EquipAI.Infrastructure/
├── Data/
│   ├── Configurations/
│   │   ├── AnalysisConfiguration.cs    — 分析表 EF 配置
│   │   ├── WorkOrderConfiguration.cs   — 工单表 EF 配置
│   │   └── WorkOrderLogConfiguration.cs — 工单日志 EF 配置
├── AI/
│   └── SemanticKernelLLMService.cs     — Semantic Kernel LLM 服务

src/EquipAI.WebAPI/
├── Controllers/
│   ├── AnalysesController.cs           — 分析 API
│   └── WorkOrdersController.cs         — 工单 API

tests/EquipAI.Tests.Unit/
├── Analysis/
│   ├── DataQualityServiceTests.cs      — 数据质量服务测试
│   └── RootCauseAnalysisEngineTests.cs — 分析引擎测试
├── WorkOrders/
│   └── WorkOrderServiceTests.cs        — 工单服务测试

修改文件：

src/EquipAI.Infrastructure/Data/AppDbContext.cs            — 新增 Analysis, WorkOrder, WorkOrderLog DbSet
src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs — 注册新服务 + Semantic Kernel
src/EquipAI.WebAPI/Program.cs                              — 事件订阅新增
src/EquipAI.WebAPI/appsettings.json                        — LLM 配置节
src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj   — 新增 SemanticKernel 包
```

## 第一部分：AI 根因分析

### 分析级别降级链

```
告警触发
  → DataQualityService 评分（0.0 - 1.0）
  → RootCauseAnalysisEngine 选择级别：
    有基线数据 且 数据质量 ≥ 0.6？ → L3 统计分析
    都不满足？                       → L1 LLM 对话诊断
  → 写入 analyses 表
  → 发布 AnalysisCompletedEvent
```

L2（规则诊断）暂不实现（需要知识库模块），直接从 L3 降级到 L1。

### Analysis 实体

```csharp
public class Analysis : BaseEntity
{
    public Guid TenantId { get; set; }
    public Guid AlertId { get; set; }
    public Guid DeviceId { get; set; }
    public Guid? RuleId { get; set; }
    public AnalysisLevel Level { get; set; }      // L1/L2/L3
    public AnalysisStatus Status { get; set; }     // running/completed/failed
    public double? Confidence { get; set; }         // 置信度 0.0-1.0
    public double? DataQualityScore { get; set; }   // 数据质量评分
    public string? RootCause { get; set; }          // 根因描述
    public string? Suggestion { get; set; }         // 建议措施
    public string? RawResponse { get; set; }        // LLM 原始响应（JSONB）
    public long? ProcessingTimeMs { get; set; }     // 处理耗时（毫秒）
    public DateTime? CompletedAt { get; set; }
}
```

### 枚举定义

```csharp
public enum AnalysisLevel { L1, L2, L3 }
public enum AnalysisStatus { Running, Completed, Failed }
```

### DataQualityService

5 维度数据质量评分：

| 维度 | 权重 | 计算方式 |
|------|------|----------|
| 完整性 | 30% | 1 - (缺失数据点数 / 预期数据点数) |
| 准确性 | 25% | 1 - (异常值数 / 总数据点数) |
| 时效性 | 15% | 数据延迟 < 1s = 1.0, > 60s = 0.3, 线性插值 |
| 一致性 | 15% | 1 - (矛盾数据点数 / 总数据点数) |
| 有效性 | 15% | 1 - (超范围数据点数 / 总数据点数) |

```csharp
public interface IDataQualityService
{
    Task<double> CalculateScoreAsync(Guid tenantId, Guid deviceId, string metric, CancellationToken ct = default);
}
```

实现从 `device_telemetry` 查询最近 1 小时的数据，按 5 维度计算加权分数。

### ILLMService 接口

```csharp
public interface ILLMService
{
    Task<LLMResponse> AnalyzeAsync(LLMRequest request, CancellationToken ct = default);
}

public record LLMRequest(string SystemPrompt, string UserPrompt);
public record LLMResponse(string Content, double? Confidence, bool Success, string? ErrorMessage);
```

### SemanticKernelLLMService

使用 Semantic Kernel 的 OpenAI 兼容接口连接 DashScope：

```csharp
public class SemanticKernelLLMService : ILLMService
{
    private readonly Kernel _kernel;

    public SemanticKernelLLMService(IConfiguration configuration)
    {
        var builder = Kernel.CreateBuilder();
        builder.AddOpenAIChatCompletion(
            modelId: configuration["Llm:ModelId"] ?? "qwen-plus",
            apiKey: configuration["Llm:ApiKey"] ?? "",
            endpoint: new Uri(configuration["Llm:Endpoint"]
                ?? "https://dashscope.aliyuncs.com/compatible-mode/v1"));
        _kernel = builder.Build();
    }

    public async Task<LLMResponse> AnalyzeAsync(LLMRequest request, CancellationToken ct = default)
    {
        // 使用 Semantic Kernel 调用 LLM
        // 30 秒超时（通过 CancellationTokenSource）
        // 失败时返回 Success=false + ErrorMessage
    }
}
```

### RootCauseAnalysisEngine

```csharp
public class RootCauseAnalysisEngine : IAnalysisService
{
    public async Task<Analysis> AnalyzeAsync(Guid tenantId, Guid alertId, Guid deviceId,
        string metric, double value, MetricBaseline? baseline, CancellationToken ct = default)
    {
        var startTime = Stopwatch.GetTimestamp();

        // 1. 计算数据质量评分
        var dataQuality = await _dataQualityService.CalculateScoreAsync(tenantId, deviceId, metric, ct);

        // 2. 选择分析级别
        AnalysisLevel level;
        string rootCause, suggestion;
        double confidence;

        if (baseline != null && baseline.SampleCount >= 100 && dataQuality >= 0.6)
        {
            // L3 统计分析
            (rootCause, suggestion, confidence) = StatisticalAnalysis(value, baseline, metric);
            level = AnalysisLevel.L3;
        }
        else
        {
            // L1 LLM 诊断
            var result = await LLMDiagnosisAsync(tenantId, deviceId, metric, value, baseline, ct);
            rootCause = result.rootCause;
            suggestion = result.suggestion;
            confidence = result.confidence;
            level = AnalysisLevel.L1;
        }

        // 3. 写入 analyses 表并返回
    }
}
```

**L3 统计分析**（纯计算，不调用 LLM）：
- 计算当前值偏离均值的标准差倍数
- 根据偏离程度生成诊断文本
- 置信度 = min(1.0, dataQuality * 0.8 + 0.2)

**L1 LLM 诊断**（调用 Semantic Kernel）：
- System Prompt：工业设备故障诊断专家
- User Prompt：包含设备信息、指标、当前值、基线数据（如有）、告警历史
- 解析 LLM 结构化响应提取根因和建议
- 置信度由 LLM 返回或默认 0.5

### RootCauseAnalysisHandler

监听 AlertTriggeredEvent，触发分析：

```csharp
public class RootCauseAnalysisHandler : IEventHandler<AlertTriggeredEvent>
{
    public async Task HandleAsync(AlertTriggeredEvent @event, CancellationToken ct = default)
    {
        // 查询基线数据
        var baseline = await dbContext.MetricBaselines
            .FirstOrDefaultAsync(b => b.TenantId == @event.TenantId
                && b.DeviceId == @event.DeviceId && b.Metric == @event.Metric, ct);

        // 触发分析
        var analysis = await _analysisService.AnalyzeAsync(
            @event.TenantId, @event.AlertId, @event.DeviceId,
            @event.Metric, @event.Value, baseline, ct);

        // 发布分析完成事件
        await _eventBus.PublishAsync(new AnalysisCompletedEvent(...));
    }
}
```

### AnalysisCompletedEvent

```csharp
public record AnalysisCompletedEvent(
    Guid EventId, DateTime OccurredAt, Guid TenantId,
    Guid AnalysisId, Guid AlertId, Guid DeviceId,
    string Metric, AnalysisLevel Level, double? Confidence,
    string? RootCause, string? Suggestion
) : IIntegrationEvent;
```

## 第二部分：工单管理

### WorkOrder 实体

```csharp
public class WorkOrder : BaseEntity
{
    public Guid TenantId { get; set; }
    public string WorkOrderCode { get; set; }       // WO-{yyyyMMdd}-{4位序号}
    public string Title { get; set; }
    public WorkOrderType Type { get; set; }          // corrective/preventive/predictive
    public WorkOrderStatus Status { get; set; }
    public WorkOrderPriority Priority { get; set; }
    public Guid DeviceId { get; set; }
    public Guid? AlertId { get; set; }
    public Guid? AnalysisId { get; set; }
    public string? RootCause { get; set; }
    public string? Resolution { get; set; }
    public Guid? AssignedTo { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public Guid? CreatedBy { get; set; }
}
```

### WorkOrderLog 实体

```csharp
public class WorkOrderLog : BaseEntity
{
    public Guid WorkOrderId { get; set; }
    public WorkOrderLogAction Action { get; set; }   // created/status_changed/comment_added
    public string? OldStatus { get; set; }
    public string? NewStatus { get; set; }
    public Guid? OperatorId { get; set; }
    public string? Note { get; set; }
}
```

### 枚举定义

```csharp
public enum WorkOrderType { Corrective, Preventive, Predictive }
public enum WorkOrderStatus
{
    PendingDispatch,  // 待派工
    Assigned,         // 已派工
    InProgress,       // 执行中
    Completed,        // 已完成
    Accepted,         // 已验收
    Rejected,         // 验收不通过（返工）
    Closed,           // 已关闭
    Cancelled         // 已取消
}
public enum WorkOrderPriority { Critical, High, Medium, Low }
public enum WorkOrderLogAction { Created, StatusChanged, CommentAdded }
```

### 工单状态流转

```
pending_dispatch → assigned → in_progress → completed → accepted → closed
                     │            │             │
                     │            │             └→ rejected → in_progress（返工）
                     │            └→ cancelled
                     └→ cancelled
  └→ cancelled
```

每个状态变更都会写 WorkOrderLog（审计追踪）。

### IWorkOrderService

```csharp
public interface IWorkOrderService
{
    Task<WorkOrderDto> CreateAsync(Guid tenantId, CreateWorkOrderRequest request, Guid? userId = null, CancellationToken ct = default);
    Task<WorkOrderDto> GetByIdAsync(Guid tenantId, Guid id, CancellationToken ct = default);
    Task<PagedResult<WorkOrderDto>> ListAsync(Guid tenantId, int page, int pageSize, string? status = null, Guid? deviceId = null, CancellationToken ct = default);
    Task<WorkOrderDto> AssignAsync(Guid tenantId, Guid id, AssignWorkOrderRequest request, Guid userId, CancellationToken ct = default);
    Task<WorkOrderDto> StartAsync(Guid tenantId, Guid id, Guid userId, CancellationToken ct = default);
    Task<WorkOrderDto> CompleteAsync(Guid tenantId, Guid id, CompleteWorkOrderRequest request, Guid userId, CancellationToken ct = default);
    Task<WorkOrderDto> AcceptAsync(Guid tenantId, Guid id, Guid userId, string? note = null, CancellationToken ct = default);
    Task<WorkOrderDto> RejectAsync(Guid tenantId, Guid id, Guid userId, string? note = null, CancellationToken ct = default);
    Task<WorkOrderDto> CloseAsync(Guid tenantId, Guid id, Guid userId, string? note = null, CancellationToken ct = default);
    Task<WorkOrderDto> CancelAsync(Guid tenantId, Guid id, Guid userId, string? note = null, CancellationToken ct = default);
}
```

### WorkOrderAutoCreateHandler

监听 AlertTriggeredEvent，根据告警规则的 AutoCreateWorkorder 标记自动创建工单：

```csharp
public class WorkOrderAutoCreateHandler : IEventHandler<AlertTriggeredEvent>
{
    public async Task HandleAsync(AlertTriggeredEvent @event, CancellationToken ct = default)
    {
        // 查询告警规则，检查 AutoCreateWorkorder
        var rule = await dbContext.AlertRules.FindAsync(@event.RuleId);
        if (rule?.AutoCreateWorkorder != true) return;

        // 检查是否已有该告警的活跃工单，避免重复创建
        var existing = await dbContext.WorkOrders
            .AnyAsync(wo => wo.AlertId == @event.AlertId
                && wo.Status != WorkOrderStatus.Closed
                && wo.Status != WorkOrderStatus.Cancelled, ct);
        if (existing) return;

        // 创建工单
        var wo = new WorkOrder
        {
            TenantId = @event.TenantId,
            Title = $"告警工单：{@event.Metric} 异常",
            Type = WorkOrderType.Corrective,
            Priority = MapSeverity(@event.Severity),
            Status = WorkOrderStatus.PendingDispatch,
            DeviceId = @event.DeviceId,
            AlertId = @event.AlertId
        };
        // ... 保存 + 写日志 + 发布事件
    }
}
```

### WorkOrderAnalysisHandler

监听 AnalysisCompletedEvent，更新关联工单的根因信息：

```csharp
public class WorkOrderAnalysisHandler : IEventHandler<AnalysisCompletedEvent>
{
    public async Task HandleAsync(AnalysisCompletedEvent @event, CancellationToken ct = default)
    {
        // 查找关联告警的活跃工单
        var wo = await dbContext.WorkOrders
            .FirstOrDefaultAsync(wo => wo.AlertId == @event.AlertId
                && wo.Status != WorkOrderStatus.Closed
                && wo.Status != WorkOrderStatus.Cancelled, ct);

        if (wo == null) return;

        wo.AnalysisId = @event.AnalysisId;
        wo.RootCause = @event.RootCause;

        await dbContext.SaveChangesAsync(ct);
    }
}
```

### 事件定义

```csharp
public record WorkOrderCreatedEvent(
    Guid EventId, DateTime OccurredAt, Guid TenantId,
    Guid WorkOrderId, Guid DeviceId, string Title, string Priority
) : IIntegrationEvent;

public record WorkOrderStatusChangedEvent(
    Guid EventId, DateTime OccurredAt, Guid TenantId,
    Guid WorkOrderId, string OldStatus, string NewStatus, Guid? OperatorId
) : IIntegrationEvent;
```

## 第三部分：API 端点

### 分析 API（`/api/v1/analyses`）

| 方法 | 端点 | 权限 | 说明 |
|------|------|------|------|
| GET | `/` | analysis:read | 分析列表（分页） |
| GET | `/{id}` | analysis:read | 分析详情 |
| POST | `/` | analysis:trigger | 手动触发分析 |

### 工单 API（`/api/v1/work-orders`）

| 方法 | 端点 | 权限 | 说明 |
|------|------|------|------|
| GET | `/` | workorder:read | 工单列表（分页、状态/设备过滤） |
| GET | `/{id}` | workorder:read | 工单详情 |
| POST | `/` | workorder:create | 创建工单 |
| PUT | `/{id}/assign` | workorder:dispatch | 派工 |
| PUT | `/{id}/start` | workorder:execute | 开始执行 |
| PUT | `/{id}/complete` | workorder:execute | 完成 |
| PUT | `/{id}/accept` | workorder:accept | 验收通过 |
| PUT | `/{id}/reject` | workorder:accept | 验收不通过（返工） |
| PUT | `/{id}/close` | workorder:close | 关闭 |
| PUT | `/{id}/cancel` | workorder:cancel | 取消 |

## 数据库迁移

新增表：
- `analyses`
- `work_orders`
- `work_order_logs`

## 配置

**appsettings.json** 新增：
```json
"Llm": {
    "ApiKey": "",
    "ModelId": "qwen-plus",
    "Endpoint": "https://dashscope.aliyuncs.com/compatible-mode/v1",
    "TimeoutSeconds": 30
}
```

**NuGet 新增：**
- `Microsoft.SemanticKernel` — Infrastructure 项目

## 测试范围

### 单元测试

- **DataQualityServiceTests**：
  - 各维度评分计算正确性
  - 加权总分计算
  - 无数据时返回默认分数

- **RootCauseAnalysisEngineTests**（使用 Mock ILLMService）：
  - L3 分析选择（有基线 + 数据质量 >= 0.6）
  - L1 降级（无基线）
  - L1 降级（数据质量 < 0.6）
  - LLM 超时/失败时返回 failed 状态

- **WorkOrderServiceTests**：
  - 创建工单 + 日志记录
  - 状态流转（每个转换）
  - 非法状态转换抛出异常
  - 重复创建防护

## 不包含在 Week 7-8

- 知识库（knowledge_rules / pending_rules / fault_cases）
- 外部系统集成（钉钉/飞书/Webhook）
- Level 4 预测性 AI（ML.NET）
- 前端页面
