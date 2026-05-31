# Phase 1 Week 7-8: AI 根因分析 & 工单管理 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 AI 根因分析自动降级链（L1-L3）和工单独立管理模式，使告警触发后自动分析根因并可选创建工单闭环。

**Architecture:** 功能模块并行构建。AI 分析模块通过 RootCauseAnalysisEngine 实现降级链（L3 统计→L1 LLM），工单模块实现完整生命周期管理。两个模块通过事件总线解耦（AlertTriggeredEvent → 分析 + 工单创建，AnalysisCompletedEvent → 工单更新根因）。Semantic Kernel SDK 对接 DashScope LLM。

**Tech Stack:** C# / .NET 8, EF Core 8 + Npgsql, Semantic Kernel, xUnit + FluentAssertions + Moq

**Spec:** `docs/superpowers/specs/2026-05-31-phase1-week7-8-ai-workorder-design.md`

---

## 文件结构总览

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

src/EquipAI.Infrastructure/Data/AppDbContext.cs            — 新增 DbSets
src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs — 注册新服务
src/EquipAI.WebAPI/Program.cs                              — 事件订阅新增
src/EquipAI.WebAPI/appsettings.json                        — LLM 配置节
src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj   — 新增 SemanticKernel 包
src/EquipAI.Application/Mapping/MappingProfile.cs          — 新增 Analysis/WorkOrder 映射
```

---

### Task 1: Core 层枚举定义

**Files:**
- Create: `src/EquipAI.Core/Enums/AnalysisLevel.cs`
- Create: `src/EquipAI.Core/Enums/AnalysisStatus.cs`
- Create: `src/EquipAI.Core/Enums/WorkOrderType.cs`
- Create: `src/EquipAI.Core/Enums/WorkOrderStatus.cs`
- Create: `src/EquipAI.Core/Enums/WorkOrderPriority.cs`
- Create: `src/EquipAI.Core/Enums/WorkOrderLogAction.cs`

- [ ] **Step 1: 创建 AnalysisLevel 枚举**

`src/EquipAI.Core/Enums/AnalysisLevel.cs`:
```csharp
namespace EquipAI.Core.Enums;

/// <summary>
/// AI 分析级别，按自动降级链排列
/// </summary>
public enum AnalysisLevel
{
    /// <summary>
    /// Level 1 — LLM 对话诊断（兜底）
    /// </summary>
    L1,

    /// <summary>
    /// Level 2 — 规则引擎诊断（需知识库，暂不实现）
    /// </summary>
    L2,

    /// <summary>
    /// Level 3 — 统计分析（基于历史基线）
    /// </summary>
    L3
}
```

- [ ] **Step 2: 创建 AnalysisStatus 枚举**

`src/EquipAI.Core/Enums/AnalysisStatus.cs`:
```csharp
namespace EquipAI.Core.Enums;

/// <summary>
/// 分析状态
/// </summary>
public enum AnalysisStatus
{
    /// <summary>
    /// 分析中
    /// </summary>
    Running,

    /// <summary>
    /// 分析完成
    /// </summary>
    Completed,

    /// <summary>
    /// 分析失败
    /// </summary>
    Failed
}
```

- [ ] **Step 3: 创建 WorkOrderType 枚举**

`src/EquipAI.Core/Enums/WorkOrderType.cs`:
```csharp
namespace EquipAI.Core.Enums;

/// <summary>
/// 工单类型
/// </summary>
public enum WorkOrderType
{
    /// <summary>
    /// 纠正性 — 故障发生后修复
    /// </summary>
    Corrective,

    /// <summary>
    /// 预防性 — 定期维护保养
    /// </summary>
    Preventive,

    /// <summary>
    /// 预测性 — 基于预测分析提前干预
    /// </summary>
    Predictive
}
```

- [ ] **Step 4: 创建 WorkOrderStatus 枚举**

`src/EquipAI.Core/Enums/WorkOrderStatus.cs`:
```csharp
namespace EquipAI.Core.Enums;

/// <summary>
/// 工单状态
/// </summary>
public enum WorkOrderStatus
{
    /// <summary>
    /// 待派工
    /// </summary>
    PendingDispatch,

    /// <summary>
    /// 已派工
    /// </summary>
    Assigned,

    /// <summary>
    /// 执行中
    /// </summary>
    InProgress,

    /// <summary>
    /// 已完成
    /// </summary>
    Completed,

    /// <summary>
    /// 已验收
    /// </summary>
    Accepted,

    /// <summary>
    /// 验收不通过（返工）
    /// </summary>
    Rejected,

    /// <summary>
    /// 已关闭
    /// </summary>
    Closed,

    /// <summary>
    /// 已取消
    /// </summary>
    Cancelled
}
```

- [ ] **Step 5: 创建 WorkOrderPriority 枚举**

`src/EquipAI.Core/Enums/WorkOrderPriority.cs`:
```csharp
namespace EquipAI.Core.Enums;

/// <summary>
/// 工单优先级
/// </summary>
public enum WorkOrderPriority
{
    /// <summary>
    /// 紧急
    /// </summary>
    Critical,

    /// <summary>
    /// 高
    /// </summary>
    High,

    /// <summary>
    /// 中
    /// </summary>
    Medium,

    /// <summary>
    /// 低
    /// </summary>
    Low
}
```

- [ ] **Step 6: 创建 WorkOrderLogAction 枚举**

`src/EquipAI.Core/Enums/WorkOrderLogAction.cs`:
```csharp
namespace EquipAI.Core.Enums;

/// <summary>
/// 工单日志操作类型
/// </summary>
public enum WorkOrderLogAction
{
    /// <summary>
    /// 创建工单
    /// </summary>
    Created,

    /// <summary>
    /// 状态变更
    /// </summary>
    StatusChanged,

    /// <summary>
    /// 添加备注
    /// </summary>
    CommentAdded
}
```

- [ ] **Step 7: 编译验证**

Run: `dotnet build src/EquipAI.Core/EquipAI.Core.csproj`
Expected: BUILD SUCCEEDED

- [ ] **Step 8: 提交**

```bash
git add src/EquipAI.Core/Enums/AnalysisLevel.cs src/EquipAI.Core/Enums/AnalysisStatus.cs \
        src/EquipAI.Core/Enums/WorkOrderType.cs src/EquipAI.Core/Enums/WorkOrderStatus.cs \
        src/EquipAI.Core/Enums/WorkOrderPriority.cs src/EquipAI.Core/Enums/WorkOrderLogAction.cs
git commit -m "feat: add analysis and work order enums"
```

---

### Task 2: Core 层实体定义

**Files:**
- Create: `src/EquipAI.Core/Entities/Analysis.cs`
- Create: `src/EquipAI.Core/Entities/WorkOrder.cs`
- Create: `src/EquipAI.Core/Entities/WorkOrderLog.cs`

- [ ] **Step 1: 创建 Analysis 实体**

`src/EquipAI.Core/Entities/Analysis.cs`:
```csharp
using EquipAI.Core.Enums;

namespace EquipAI.Core.Entities;

/// <summary>
/// AI 分析结果实体，存储根因分析的输出
/// 由 RootCauseAnalysisEngine 在告警触发后自动创建
/// </summary>
public class Analysis : BaseEntity
{
    /// <summary>
    /// 所属租户 ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 关联告警 ID
    /// </summary>
    public Guid AlertId { get; set; }

    /// <summary>
    /// 设备 ID
    /// </summary>
    public Guid DeviceId { get; set; }

    /// <summary>
    /// 关联告警规则 ID
    /// </summary>
    public Guid? RuleId { get; set; }

    /// <summary>
    /// 分析级别（L1/L2/L3）
    /// </summary>
    public AnalysisLevel Level { get; set; }

    /// <summary>
    /// 分析状态
    /// </summary>
    public AnalysisStatus Status { get; set; }

    /// <summary>
    /// 置信度（0.0 - 1.0）
    /// </summary>
    public double? Confidence { get; set; }

    /// <summary>
    /// 数据质量评分（0.0 - 1.0）
    /// </summary>
    public double? DataQualityScore { get; set; }

    /// <summary>
    /// 根因描述
    /// </summary>
    public string? RootCause { get; set; }

    /// <summary>
    /// 建议措施
    /// </summary>
    public string? Suggestion { get; set; }

    /// <summary>
    /// LLM 原始响应（JSONB）
    /// </summary>
    public string? RawResponse { get; set; }

    /// <summary>
    /// 处理耗时（毫秒）
    /// </summary>
    public long? ProcessingTimeMs { get; set; }

    /// <summary>
    /// 分析完成时间
    /// </summary>
    public DateTime? CompletedAt { get; set; }
}
```

- [ ] **Step 2: 创建 WorkOrder 实体**

`src/EquipAI.Core/Entities/WorkOrder.cs`:
```csharp
using EquipAI.Core.Enums;

namespace EquipAI.Core.Entities;

/// <summary>
/// 工单实体，支持完整的工单生命周期管理
/// 可由告警自动创建或手动创建
/// </summary>
public class WorkOrder : BaseEntity
{
    /// <summary>
    /// 所属租户 ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 工单编码（格式：WO-{yyyyMMdd}-{4位序号}）
    /// </summary>
    public string WorkOrderCode { get; set; } = string.Empty;

    /// <summary>
    /// 工单标题
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// 工单类型（纠正性/预防性/预测性）
    /// </summary>
    public WorkOrderType Type { get; set; }

    /// <summary>
    /// 工单状态
    /// </summary>
    public WorkOrderStatus Status { get; set; }

    /// <summary>
    /// 优先级
    /// </summary>
    public WorkOrderPriority Priority { get; set; }

    /// <summary>
    /// 关联设备 ID
    /// </summary>
    public Guid DeviceId { get; set; }

    /// <summary>
    /// 关联告警 ID（告警自动创建时有值）
    /// </summary>
    public Guid? AlertId { get; set; }

    /// <summary>
    /// 关联分析 ID（分析完成后更新）
    /// </summary>
    public Guid? AnalysisId { get; set; }

    /// <summary>
    /// 根因描述（来自 AI 分析或人工填写）
    /// </summary>
    public string? RootCause { get; set; }

    /// <summary>
    /// 解决措施
    /// </summary>
    public string? Resolution { get; set; }

    /// <summary>
    /// 派工给谁（用户 ID）
    /// </summary>
    public Guid? AssignedTo { get; set; }

    /// <summary>
    /// 预计完成时间
    /// </summary>
    public DateTime? DueDate { get; set; }

    /// <summary>
    /// 开始执行时间
    /// </summary>
    public DateTime? StartedAt { get; set; }

    /// <summary>
    /// 完成时间
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// 关闭时间
    /// </summary>
    public DateTime? ClosedAt { get; set; }

    /// <summary>
    /// 创建者 ID
    /// </summary>
    public Guid? CreatedBy { get; set; }
}
```

- [ ] **Step 3: 创建 WorkOrderLog 实体**

`src/EquipAI.Core/Entities/WorkOrderLog.cs`:
```csharp
using EquipAI.Core.Enums;

namespace EquipAI.Core.Entities;

/// <summary>
/// 工单日志实体，记录工单的所有状态变更和操作（审计追踪）
/// </summary>
public class WorkOrderLog : BaseEntity
{
    /// <summary>
    /// 关联工单 ID
    /// </summary>
    public Guid WorkOrderId { get; set; }

    /// <summary>
    /// 操作类型
    /// </summary>
    public WorkOrderLogAction Action { get; set; }

    /// <summary>
    /// 变更前状态
    /// </summary>
    public string? OldStatus { get; set; }

    /// <summary>
    /// 变更后状态
    /// </summary>
    public string? NewStatus { get; set; }

    /// <summary>
    /// 操作人 ID
    /// </summary>
    public Guid? OperatorId { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    public string? Note { get; set; }
}
```

- [ ] **Step 4: 编译验证**

Run: `dotnet build src/EquipAI.Core/EquipAI.Core.csproj`
Expected: BUILD SUCCEEDED

- [ ] **Step 5: 提交**

```bash
git add src/EquipAI.Core/Entities/Analysis.cs src/EquipAI.Core/Entities/WorkOrder.cs \
        src/EquipAI.Core/Entities/WorkOrderLog.cs
git commit -m "feat: add Analysis, WorkOrder and WorkOrderLog entities"
```

---

### Task 3: Core 层事件和接口定义

**Files:**
- Create: `src/EquipAI.Core/Events/AnalysisCompletedEvent.cs`
- Create: `src/EquipAI.Core/Events/WorkOrderCreatedEvent.cs`
- Create: `src/EquipAI.Core/Events/WorkOrderStatusChangedEvent.cs`
- Create: `src/EquipAI.Core/Interfaces/IAnalysisService.cs`
- Create: `src/EquipAI.Core/Interfaces/IWorkOrderService.cs`
- Create: `src/EquipAI.Core/Interfaces/IDataQualityService.cs`
- Create: `src/EquipAI.Core/Interfaces/ILLMService.cs`

- [ ] **Step 1: 创建事件**

`src/EquipAI.Core/Events/AnalysisCompletedEvent.cs`:
```csharp
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;

namespace EquipAI.Core.Events;

/// <summary>
/// 分析完成事件，由 RootCauseAnalysisEngine 在分析完成后发布
/// 供工单模块更新根因信息
/// </summary>
public record AnalysisCompletedEvent(
    Guid EventId,
    DateTime OccurredAt,
    Guid TenantId,
    Guid AnalysisId,
    Guid AlertId,
    Guid DeviceId,
    string Metric,
    AnalysisLevel Level,
    double? Confidence,
    string? RootCause,
    string? Suggestion
) : IIntegrationEvent;
```

`src/EquipAI.Core/Events/WorkOrderCreatedEvent.cs`:
```csharp
using EquipAI.Core.Interfaces;

namespace EquipAI.Core.Events;

/// <summary>
/// 工单创建事件，由 WorkOrderService 在创建工单后发布
/// 供 SignalR 推送等下游模块消费
/// </summary>
public record WorkOrderCreatedEvent(
    Guid EventId,
    DateTime OccurredAt,
    Guid TenantId,
    Guid WorkOrderId,
    Guid DeviceId,
    string Title,
    string Priority
) : IIntegrationEvent;
```

`src/EquipAI.Core/Events/WorkOrderStatusChangedEvent.cs`:
```csharp
using EquipAI.Core.Interfaces;

namespace EquipAI.Core.Events;

/// <summary>
/// 工单状态变更事件，由 WorkOrderService 在状态变更后发布
/// </summary>
public record WorkOrderStatusChangedEvent(
    Guid EventId,
    DateTime OccurredAt,
    Guid TenantId,
    Guid WorkOrderId,
    string OldStatus,
    string NewStatus,
    Guid? OperatorId
) : IIntegrationEvent;
```

- [ ] **Step 2: 创建接口**

`src/EquipAI.Core/Interfaces/ILLMService.cs`:
```csharp
namespace EquipAI.Core.Interfaces;

/// <summary>
/// LLM 服务接口，封装大语言模型调用
/// </summary>
public interface ILLMService
{
    /// <summary>
    /// 发送分析请求到 LLM
    /// </summary>
    Task<LLMResponse> AnalyzeAsync(LLMRequest request, CancellationToken ct = default);
}

/// <summary>
/// LLM 请求
/// </summary>
/// <param name="SystemPrompt">系统提示词</param>
/// <param name="UserPrompt">用户提示词</param>
public record LLMRequest(string SystemPrompt, string UserPrompt);

/// <summary>
/// LLM 响应
/// </summary>
/// <param name="Content">响应内容</param>
/// <param name="Confidence">置信度</param>
/// <param name="Success">是否成功</param>
/// <param name="ErrorMessage">错误信息</param>
public record LLMResponse(string Content, double? Confidence, bool Success, string? ErrorMessage);
```

`src/EquipAI.Core/Interfaces/IDataQualityService.cs`:
```csharp
namespace EquipAI.Core.Interfaces;

/// <summary>
/// 数据质量评估服务，计算遥测数据的质量评分（0.0 - 1.0）
/// 5 维度加权：完整性 30%、准确性 25%、时效性 15%、一致性 15%、有效性 15%
/// </summary>
public interface IDataQualityService
{
    /// <summary>
    /// 计算指定设备指标的数据质量评分
    /// </summary>
    Task<double> CalculateScoreAsync(Guid tenantId, Guid deviceId, string metric, CancellationToken ct = default);
}
```

`src/EquipAI.Core/Interfaces/IAnalysisService.cs`:
```csharp
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;

namespace EquipAI.Core.Interfaces;

/// <summary>
/// 根因分析服务接口
/// </summary>
public interface IAnalysisService
{
    /// <summary>
    /// 执行根因分析（自动选择分析级别）
    /// </summary>
    Task<Entities.Analysis> AnalyzeAsync(Guid tenantId, Guid alertId, Guid deviceId,
        string metric, double value, MetricBaseline? baseline, CancellationToken ct = default);
}
```

`src/EquipAI.Core/Interfaces/IWorkOrderService.cs`:
```csharp
using EquipAI.Application.DTOs.Common;
using EquipAI.Application.WorkOrders.DTOs;

namespace EquipAI.Core.Interfaces;

/// <summary>
/// 工单服务接口，提供工单生命周期管理
/// </summary>
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

- [ ] **Step 3: 编译验证**

Run: `dotnet build src/EquipAI.Core/EquipAI.Core.csproj`
Expected: BUILD SUCCEEDED

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.Core/Events/ src/EquipAI.Core/Interfaces/ILLMService.cs \
        src/EquipAI.Core/Interfaces/IDataQualityService.cs \
        src/EquipAI.Core/Interfaces/IAnalysisService.cs \
        src/EquipAI.Core/Interfaces/IWorkOrderService.cs
git commit -m "feat: add analysis and work order events and interfaces"
```

---

### Task 4: EF 配置 + DbContext + NuGet 包

**Files:**
- Create: `src/EquipAI.Infrastructure/Data/Configurations/AnalysisConfiguration.cs`
- Create: `src/EquipAI.Infrastructure/Data/Configurations/WorkOrderConfiguration.cs`
- Create: `src/EquipAI.Infrastructure/Data/Configurations/WorkOrderLogConfiguration.cs`
- Modify: `src/EquipAI.Infrastructure/Data/AppDbContext.cs`
- Modify: `src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj`

- [ ] **Step 1: 添加 SemanticKernel NuGet 包**

Run: `dotnet add src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj package Microsoft.SemanticKernel`

- [ ] **Step 2: 创建 AnalysisConfiguration**

`src/EquipAI.Infrastructure/Data/Configurations/AnalysisConfiguration.cs`:
```csharp
using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// Analysis 实体的 EF Core 配置
/// </summary>
public class AnalysisConfiguration : IEntityTypeConfiguration<Analysis>
{
    public void Configure(EntityTypeBuilder<Analysis> builder)
    {
        builder.ToTable("analyses");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.TenantId).HasColumnName("tenant_id");
        builder.Property(e => e.AlertId).HasColumnName("alert_id");
        builder.Property(e => e.DeviceId).HasColumnName("device_id");
        builder.Property(e => e.RuleId).HasColumnName("rule_id");
        builder.Property(e => e.Level).HasColumnName("level");
        builder.Property(e => e.Status).HasColumnName("status");
        builder.Property(e => e.Confidence).HasColumnName("confidence");
        builder.Property(e => e.DataQualityScore).HasColumnName("data_quality_score");
        builder.Property(e => e.RootCause).HasColumnName("root_cause");
        builder.Property(e => e.Suggestion).HasColumnName("suggestion");
        builder.Property(e => e.RawResponse).HasColumnName("raw_response").HasColumnType("jsonb");
        builder.Property(e => e.ProcessingTimeMs).HasColumnName("processing_time_ms");
        builder.Property(e => e.CompletedAt).HasColumnName("completed_at");
        builder.Property(e => e.CreatedAt).HasColumnName("created_at");

        builder.HasIndex(e => new { e.TenantId, e.AlertId });
        builder.HasIndex(e => new { e.TenantId, e.DeviceId, e.CreatedAt });
    }
}
```

- [ ] **Step 3: 创建 WorkOrderConfiguration**

`src/EquipAI.Infrastructure/Data/Configurations/WorkOrderConfiguration.cs`:
```csharp
using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// WorkOrder 实体的 EF Core 配置
/// </summary>
public class WorkOrderConfiguration : IEntityTypeConfiguration<WorkOrder>
{
    public void Configure(EntityTypeBuilder<WorkOrder> builder)
    {
        builder.ToTable("work_orders");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.TenantId).HasColumnName("tenant_id");
        builder.Property(e => e.WorkOrderCode).HasColumnName("workorder_code").HasMaxLength(50);
        builder.Property(e => e.Title).HasColumnName("title").HasMaxLength(500);
        builder.Property(e => e.Type).HasColumnName("type");
        builder.Property(e => e.Status).HasColumnName("status");
        builder.Property(e => e.Priority).HasColumnName("priority");
        builder.Property(e => e.DeviceId).HasColumnName("device_id");
        builder.Property(e => e.AlertId).HasColumnName("alert_id");
        builder.Property(e => e.AnalysisId).HasColumnName("analysis_id");
        builder.Property(e => e.RootCause).HasColumnName("root_cause");
        builder.Property(e => e.Resolution).HasColumnName("resolution");
        builder.Property(e => e.AssignedTo).HasColumnName("assigned_to");
        builder.Property(e => e.DueDate).HasColumnName("due_date");
        builder.Property(e => e.StartedAt).HasColumnName("started_at");
        builder.Property(e => e.CompletedAt).HasColumnName("completed_at");
        builder.Property(e => e.ClosedAt).HasColumnName("closed_at");
        builder.Property(e => e.CreatedBy).HasColumnName("created_by");
        builder.Property(e => e.CreatedAt).HasColumnName("created_at");

        builder.HasIndex(e => e.WorkOrderCode).IsUnique();
        builder.HasIndex(e => new { e.TenantId, e.Status });
        builder.HasIndex(e => new { e.TenantId, e.DeviceId });
    }
}
```

- [ ] **Step 4: 创建 WorkOrderLogConfiguration**

`src/EquipAI.Infrastructure/Data/Configurations/WorkOrderLogConfiguration.cs`:
```csharp
using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// WorkOrderLog 实体的 EF Core 配置
/// </summary>
public class WorkOrderLogConfiguration : IEntityTypeConfiguration<WorkOrderLog>
{
    public void Configure(EntityTypeBuilder<WorkOrderLog> builder)
    {
        builder.ToTable("work_order_logs");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.WorkOrderId).HasColumnName("work_order_id");
        builder.Property(e => e.Action).HasColumnName("action");
        builder.Property(e => e.OldStatus).HasColumnName("old_status");
        builder.Property(e => e.NewStatus).HasColumnName("new_status");
        builder.Property(e => e.OperatorId).HasColumnName("operator_id");
        builder.Property(e => e.Note).HasColumnName("note");
        builder.Property(e => e.CreatedAt).HasColumnName("created_at");

        builder.HasIndex(e => e.WorkOrderId);
    }
}
```

- [ ] **Step 5: 在 AppDbContext 中添加 DbSets**

在 `src/EquipAI.Infrastructure/Data/AppDbContext.cs` 的 `MetricBaselines` DbSet 之后添加：

```csharp
    /// <summary>
    /// AI 分析结果表
    /// </summary>
    public DbSet<Core.Entities.Analysis> Analyses => Set<Core.Entities.Analysis>();

    /// <summary>
    /// 工单表
    /// </summary>
    public DbSet<Core.Entities.WorkOrder> WorkOrders => Set<Core.Entities.WorkOrder>();

    /// <summary>
    /// 工单日志表
    /// </summary>
    public DbSet<Core.Entities.WorkOrderLog> WorkOrderLogs => Set<Core.Entities.WorkOrderLog>();
```

- [ ] **Step 6: 编译验证**

Run: `dotnet build src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj`
Expected: BUILD SUCCEEDED

- [ ] **Step 7: 提交**

```bash
git add src/EquipAI.Infrastructure/
git commit -m "feat: add EF configurations, DbSets and SemanticKernel package"
```

---

### Task 5: EF Core 迁移

**Files:**
- Create: 自动生成的迁移文件

- [ ] **Step 1: 创建迁移**

Run: `dotnet ef migrations add AddAnalysisAndWorkOrders --project src/EquipAI.Infrastructure --startup-project src/EquipAI.WebAPI --output-dir Data/Migrations`
Expected: 迁移文件已创建

- [ ] **Step 2: 检查生成的迁移文件**

确认包含：
- `analyses` 表创建
- `work_orders` 表创建
- `work_order_logs` 表创建

- [ ] **Step 3: 编译验证**

Run: `dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.Infrastructure/Data/Migrations/
git commit -m "feat: add EF Core migration for analyses, work_orders and work_order_logs"
```

---

### Task 6: DataQualityService（TDD）

**Files:**
- Create: `tests/EquipAI.Tests.Unit/Analysis/DataQualityServiceTests.cs`
- Create: `src/EquipAI.Application/Analysis/DataQualityService.cs`

- [ ] **Step 1: 编写测试**

`tests/EquipAI.Tests.Unit/Analysis/DataQualityServiceTests.cs`:
```csharp
using EquipAI.Application.Analysis;
using FluentAssertions;
using Moq;
using Xunit;

namespace EquipAI.Tests.Unit.Analysis;

public class DataQualityServiceTests
{
    private readonly DataQualityService _service;

    public DataQualityServiceTests()
    {
        _service = new DataQualityService();
    }

    [Fact]
    public async Task CalculateScoreAsync_WithNoData_ReturnsDefaultValue()
    {
        // 无数据时返回保守默认值 0.5
        var score = await _service.CalculateScoreAsync(
            Guid.NewGuid(), Guid.NewGuid(), "temperature");

        score.Should().Be(0.5);
    }

    [Fact]
    public async Task CalculateScoreAsync_ReturnsValueBetweenZeroAndOne()
    {
        var score = await _service.CalculateScoreAsync(
            Guid.NewGuid(), Guid.NewGuid(), "temperature");

        score.Should().BeInRange(0.0, 1.0);
    }
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "DataQualityService" -v n`
Expected: FAIL

- [ ] **Step 3: 实现 DataQualityService**

`src/EquipAI.Application/Analysis/DataQualityService.cs`:
```csharp
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Analysis;

/// <summary>
/// 数据质量评估服务
/// 从 device_telemetry 查询最近 1 小时的数据，按 5 维度计算加权评分
/// 维度：完整性 30%、准确性 25%、时效性 15%、一致性 15%、有效性 15%
///
/// 当前实现返回保守默认值，后续集成测试时接入真实数据库查询
/// </summary>
public class DataQualityService : IDataQualityService
{
    private readonly ILogger<DataQualityService> _logger;

    public DataQualityService(ILogger<DataQualityService>? logger = null)
    {
        _logger = logger ?? Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance.CreateLogger<DataQualityService>();
    }

    /// <inheritdoc />
    public async Task<double> CalculateScoreAsync(Guid tenantId, Guid deviceId, string metric, CancellationToken ct = default)
    {
        // Phase 1 实现：返回保守默认值
        // 完整实现需要查询 device_telemetry 最近 1 小时数据并按 5 维度评分
        // 集成测试环境中可替换为真实数据库查询
        await Task.Yield();

        _logger.LogDebug("数据质量评分：设备={DeviceId}, 指标={Metric}, 默认评分=0.5", deviceId, metric);

        return 0.5;
    }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "DataQualityService" -v n`
Expected: 2 PASSED

- [ ] **Step 5: 提交**

```bash
git add tests/EquipAI.Tests.Unit/Analysis/DataQualityServiceTests.cs \
        src/EquipAI.Application/Analysis/DataQualityService.cs
git commit -m "feat: add DataQualityService with default scoring"
```

---

### Task 7: SemanticKernelLLMService

**Files:**
- Create: `src/EquipAI.Infrastructure/AI/SemanticKernelLLMService.cs`

- [ ] **Step 1: 创建 SemanticKernelLLMService**

`src/EquipAI.Infrastructure/AI/SemanticKernelLLMService.cs`:
```csharp
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;

namespace EquipAI.Infrastructure.AI;

/// <summary>
/// 基于 Semantic Kernel 的 LLM 服务实现
/// 通过 OpenAI 兼容接口连接 DashScope（通义千问）
/// 支持 30 秒超时和错误降级
/// </summary>
public class SemanticKernelLLMService : ILLMService
{
    private readonly IChatCompletionService _chatService;
    private readonly ILogger<SemanticKernelLLMService> _logger;
    private readonly int _timeoutSeconds;

    public SemanticKernelLLMService(IConfiguration configuration, ILogger<SemanticKernelLLMService> logger)
    {
        _logger = logger;
        _timeoutSeconds = configuration.GetValue("Llm:TimeoutSeconds", 30);

        var apiKey = configuration["Llm:ApiKey"] ?? "";
        var modelId = configuration["Llm:ModelId"] ?? "qwen-plus";
        var endpoint = configuration["Llm:Endpoint"] ?? "https://dashscope.aliyuncs.com/compatible-mode/v1";

        var builder = Kernel.CreateBuilder();
        builder.AddOpenAIChatCompletion(modelId, apiKey, new Uri(endpoint));
        var kernel = builder.Build();
        _chatService = kernel.GetRequiredService<IChatCompletionService>();
    }

    /// <inheritdoc />
    public async Task<LLMResponse> AnalyzeAsync(LLMRequest request, CancellationToken ct = default)
    {
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(TimeSpan.FromSeconds(_timeoutSeconds));

        try
        {
            var chatHistory = new ChatHistory();
            chatHistory.AddSystemMessage(request.SystemPrompt);
            chatHistory.AddUserMessage(request.UserPrompt);

            var response = await _chatService.GetChatMessageContentAsync(chatHistory, cancellationToken: cts.Token);

            _logger.LogInformation("LLM 响应成功，长度: {Length}", response.Content?.Length ?? 0);

            return new LLMResponse(
                Content: response.Content ?? "",
                Confidence: null,
                Success: true,
                ErrorMessage: null);
        }
        catch (OperationCanceledException) when (ct == CancellationToken.None || cts.Token.IsCancellationRequested)
        {
            _logger.LogWarning("LLM 请求超时（{Timeout}s）", _timeoutSeconds);
            return new LLMResponse("", null, false, $"请求超时（{_timeoutSeconds}秒）");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "LLM 请求失败");
            return new LLMResponse("", null, false, ex.Message);
        }
    }
}
```

- [ ] **Step 2: 编译验证**

Run: `dotnet build src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj`
Expected: BUILD SUCCEEDED

- [ ] **Step 3: 提交**

```bash
git add src/EquipAI.Infrastructure/AI/SemanticKernelLLMService.cs
git commit -m "feat: add SemanticKernelLLMService for DashScope integration"
```

---

### Task 8: RootCauseAnalysisEngine + 测试（TDD）

**Files:**
- Create: `tests/EquipAI.Tests.Unit/Analysis/RootCauseAnalysisEngineTests.cs`
- Create: `src/EquipAI.Application/Analysis/RootCauseAnalysisEngine.cs`

- [ ] **Step 1: 编写测试**

`tests/EquipAI.Tests.Unit/Analysis/RootCauseAnalysisEngineTests.cs`:
```csharp
using EquipAI.Application.Analysis;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace EquipAI.Tests.Unit.Analysis;

public class RootCauseAnalysisEngineTests
{
    private readonly Mock<ILLMService> _mockLLMService;
    private readonly Mock<IDataQualityService> _mockDataQuality;
    private readonly RootCauseAnalysisEngine _engine;

    public RootCauseAnalysisEngineTests()
    {
        _mockLLMService = new Mock<ILLMService>();
        _mockDataQuality = new Mock<IDataQualityService>();
        _engine = new RootCauseAnalysisEngine(_mockLLMService.Object, _mockDataQuality.Object);
    }

    private static MetricBaseline CreateBaseline(double avg = 50, double stdDev = 5, int count = 200)
    {
        return new MetricBaseline { AvgValue = avg, StdDev = stdDev, SampleCount = count };
    }

    [Fact]
    public async Task AnalyzeAsync_WithBaselineAndHighQuality_UsesL3()
    {
        var baseline = CreateBaseline();
        _mockDataQuality.Setup(d => d.CalculateScoreAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(0.8);

        var result = await _engine.AnalyzeAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "temperature", 75.0, baseline);

        result.Level.Should().Be(AnalysisLevel.L3);
        result.Status.Should().Be(AnalysisStatus.Completed);
        result.Confidence.Should().BeGreaterThan(0);
        _mockLLMService.Verify(l => l.AnalyzeAsync(It.IsAny<LLMRequest>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task AnalyzeAsync_WithBaselineButLowQuality_UsesL1()
    {
        var baseline = CreateBaseline();
        _mockDataQuality.Setup(d => d.CalculateScoreAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(0.4);
        _mockLLMService.Setup(l => l.AnalyzeAsync(It.IsAny<LLMRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new LLMResponse("根因：设备过热", 0.7, true, null));

        var result = await _engine.AnalyzeAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "temperature", 75.0, baseline);

        result.Level.Should().Be(AnalysisLevel.L1);
        _mockLLMService.Verify(l => l.AnalyzeAsync(It.IsAny<LLMRequest>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AnalyzeAsync_WithoutBaseline_UsesL1()
    {
        _mockDataQuality.Setup(d => d.CalculateScoreAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(0.9);
        _mockLLMService.Setup(l => l.AnalyzeAsync(It.IsAny<LLMRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new LLMResponse("根因：未知", 0.5, true, null));

        var result = await _engine.AnalyzeAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "temperature", 75.0, null);

        result.Level.Should().Be(AnalysisLevel.L1);
    }

    [Fact]
    public async Task AnalyzeAsync_LLMFailure_ReturnsFailedStatus()
    {
        _mockDataQuality.Setup(d => d.CalculateScoreAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(0.5);
        _mockLLMService.Setup(l => l.AnalyzeAsync(It.IsAny<LLMRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new LLMResponse("", null, false, "超时"));

        var result = await _engine.AnalyzeAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "temperature", 75.0, null);

        result.Status.Should().Be(AnalysisStatus.Failed);
        result.Level.Should().Be(AnalysisLevel.L1);
    }

    [Fact]
    public async Task AnalyzeAsync_SetsProcessingTime()
    {
        _mockDataQuality.Setup(d => d.CalculateScoreAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(0.5);
        _mockLLMService.Setup(l => l.AnalyzeAsync(It.IsAny<LLMRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new LLMResponse("分析结果", 0.6, true, null));

        var result = await _engine.AnalyzeAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "temperature", 75.0, null);

        result.ProcessingTimeMs.Should().BeGreaterOrEqualTo(0);
    }
}
```

- [ ] **Step 2: 运行测试确认失败**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "RootCauseAnalysisEngine" -v n`
Expected: FAIL

- [ ] **Step 3: 实现 RootCauseAnalysisEngine**

`src/EquipAI.Application/Analysis/RootCauseAnalysisEngine.cs`:
```csharp
using System.Diagnostics;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;

namespace EquipAI.Application.Analysis;

/// <summary>
/// 根因分析引擎，实现 L3→L1 自动降级分析链
/// L3 统计分析：有基线数据且数据质量 ≥ 0.6 时，基于历史统计基线计算偏离度
/// L1 LLM 诊断：兜底方案，调用大语言模型分析告警上下文
/// </summary>
public class RootCauseAnalysisEngine : IAnalysisService
{
    private readonly ILLMService _llmService;
    private readonly IDataQualityService _dataQualityService;

    public RootCauseAnalysisEngine(ILLMService llmService, IDataQualityService dataQualityService)
    {
        _llmService = llmService;
        _dataQualityService = dataQualityService;
    }

    /// <inheritdoc />
    public async Task<Analysis> AnalyzeAsync(Guid tenantId, Guid alertId, Guid deviceId,
        string metric, double value, MetricBaseline? baseline, CancellationToken ct = default)
    {
        var startTime = Stopwatch.GetTimestamp();

        // 计算数据质量评分
        var dataQuality = await _dataQualityService.CalculateScoreAsync(tenantId, deviceId, metric, ct);

        string rootCause;
        string suggestion;
        double confidence;
        AnalysisLevel level;
        AnalysisStatus status = AnalysisStatus.Completed;
        string? rawResponse = null;

        if (baseline != null && baseline.SampleCount >= 100 && dataQuality >= 0.6)
        {
            // L3 统计分析
            level = AnalysisLevel.L3;
            (rootCause, suggestion, confidence) = StatisticalAnalysis(value, baseline, metric, dataQuality);
        }
        else
        {
            // L1 LLM 诊断
            level = AnalysisLevel.L1;
            var result = await LLMDiagnosisAsync(deviceId, metric, value, baseline, ct);

            if (result.Success)
            {
                rootCause = result.RootCause;
                suggestion = result.Suggestion;
                confidence = result.Confidence ?? 0.5;
                rawResponse = result.RawContent;
            }
            else
            {
                status = AnalysisStatus.Failed;
                rootCause = $"LLM 分析失败：{result.ErrorMessage}";
                suggestion = "请人工排查";
                confidence = 0.0;
                rawResponse = null;
            }
        }

        var elapsed = Stopwatch.GetElapsedTime(startTime);

        return new Analysis
        {
            TenantId = tenantId,
            AlertId = alertId,
            DeviceId = deviceId,
            Level = level,
            Status = status,
            Confidence = confidence,
            DataQualityScore = dataQuality,
            RootCause = rootCause,
            Suggestion = suggestion,
            RawResponse = rawResponse,
            ProcessingTimeMs = (long)elapsed.TotalMilliseconds,
            CompletedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// L3 统计分析：基于历史基线计算偏离度并生成诊断
    /// </summary>
    private static (string rootCause, string suggestion, double confidence) StatisticalAnalysis(
        double value, MetricBaseline baseline, string metric, double dataQuality)
    {
        var avg = baseline.AvgValue ?? 0;
        var stdDev = baseline.StdDev ?? 1;
        var deviation = Math.Abs(value - avg) / stdDev;

        var rootCause = deviation switch
        {
            > 5 => $"指标 {metric} 当前值 {value:F2} 严重偏离历史基线（均值 {avg:F2}，{deviation:F1}σ）",
            > 3 => $"指标 {metric} 当前值 {value:F2} 显著偏离历史基线（均值 {avg:F2}，{deviation:F1}σ）",
            _ => $"指标 {metric} 当前值 {value:F2} 偏离历史基线（均值 {avg:F2}，{deviation:F1}σ）"
        };

        var suggestion = deviation switch
        {
            > 5 => "建议立即停机检查，排查严重异常原因",
            > 3 => "建议尽快排查异常原因，必要时安排维护",
            _ => "建议持续观察，如持续偏离则安排检查"
        };

        var confidence = Math.Min(1.0, dataQuality * 0.8 + 0.2);

        return (rootCause, suggestion, confidence);
    }

    /// <summary>
    /// L1 LLM 诊断：将告警上下文发送给大语言模型
    /// </summary>
    private async Task<(bool Success, string RootCause, string Suggestion, double? Confidence, string? RawContent, string? ErrorMessage)>
        LLMDiagnosisAsync(Guid deviceId, string metric, double value, MetricBaseline? baseline, CancellationToken ct)
    {
        var systemPrompt = @"你是工业设备故障诊断专家。根据提供的设备遥测数据和告警信息，分析可能的根因并给出建议措施。
请以 JSON 格式响应：
{
  ""rootCause"": ""根因描述"",
  ""suggestion"": ""建议措施"",
  ""confidence"": 0.0到1.0的置信度
}";

        var baselineInfo = baseline != null
            ? $"\n历史基线：均值={baseline.AvgValue:F2}, 标准差={baseline.StdDev:F2}, 样本数={baseline.SampleCount}"
            : "\n历史基线：无可用数据";

        var userPrompt = $"设备ID: {deviceId}\n异常指标: {metric}\n当前值: {value}{baselineInfo}\n\n请分析可能的根因并给出建议。";

        var response = await _llmService.AnalyzeAsync(new LLMRequest(systemPrompt, userPrompt), ct);

        if (!response.Success)
        {
            return (false, "", "", null, null, response.ErrorMessage);
        }

        // 尝试解析 JSON 响应
        try
        {
            var json = System.Text.Json.JsonDocument.Parse(response.Content);
            var root = json.RootElement;

            var rootCause = root.TryGetProperty("rootCause", out var rc) ? rc.GetString() ?? "" : response.Content;
            var suggestion = root.TryGetProperty("suggestion", out var sg) ? sg.GetString() ?? "" : "";
            var confidence = root.TryGetProperty("confidence", out var cf) ? cf.GetDouble() : 0.5;

            return (true, rootCause, suggestion, confidence, response.Content, null);
        }
        catch
        {
            // JSON 解析失败，使用原始内容作为根因
            return (true, response.Content, "请结合人工判断", 0.3, response.Content, null);
        }
    }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "RootCauseAnalysisEngine" -v n`
Expected: 5 PASSED

- [ ] **Step 5: 提交**

```bash
git add src/EquipAI.Application/Analysis/RootCauseAnalysisEngine.cs \
        tests/EquipAI.Tests.Unit/Analysis/RootCauseAnalysisEngineTests.cs
git commit -m "feat: add RootCauseAnalysisEngine with TDD (5 tests passing)"
```

---

### Task 9: DTOs + AutoMapper 映射

**Files:**
- Create: `src/EquipAI.Application/Analysis/DTOs/AnalysisDto.cs`
- Create: `src/EquipAI.Application/Analysis/DTOs/CreateAnalysisRequest.cs`
- Create: `src/EquipAI.Application/WorkOrders/DTOs/WorkOrderDto.cs`
- Create: `src/EquipAI.Application/WorkOrders/DTOs/CreateWorkOrderRequest.cs`
- Create: `src/EquipAI.Application/WorkOrders/DTOs/AssignWorkOrderRequest.cs`
- Create: `src/EquipAI.Application/WorkOrders/DTOs/CompleteWorkOrderRequest.cs`
- Modify: `src/EquipAI.Application/Mapping/MappingProfile.cs`

- [ ] **Step 1: 创建 DTOs**

`src/EquipAI.Application/Analysis/DTOs/AnalysisDto.cs`:
```csharp
namespace EquipAI.Application.Analysis.DTOs;

/// <summary>
/// 分析结果 DTO
/// </summary>
public class AnalysisDto
{
    public Guid Id { get; set; }
    public Guid AlertId { get; set; }
    public Guid DeviceId { get; set; }
    public string Level { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public double? Confidence { get; set; }
    public double? DataQualityScore { get; set; }
    public string? RootCause { get; set; }
    public string? Suggestion { get; set; }
    public long? ProcessingTimeMs { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

`src/EquipAI.Application/Analysis/DTOs/CreateAnalysisRequest.cs`:
```csharp
namespace EquipAI.Application.Analysis.DTOs;

/// <summary>
/// 手动触发分析请求
/// </summary>
public class CreateAnalysisRequest
{
    public Guid AlertId { get; set; }
}
```

`src/EquipAI.Application/WorkOrders/DTOs/WorkOrderDto.cs`:
```csharp
namespace EquipAI.Application.WorkOrders.DTOs;

/// <summary>
/// 工单 DTO
/// </summary>
public class WorkOrderDto
{
    public Guid Id { get; set; }
    public string WorkOrderCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public Guid DeviceId { get; set; }
    public Guid? AlertId { get; set; }
    public Guid? AnalysisId { get; set; }
    public string? RootCause { get; set; }
    public string? Resolution { get; set; }
    public Guid? AssignedTo { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

`src/EquipAI.Application/WorkOrders/DTOs/CreateWorkOrderRequest.cs`:
```csharp
namespace EquipAI.Application.WorkOrders.DTOs;

/// <summary>
/// 创建工单请求
/// </summary>
public class CreateWorkOrderRequest
{
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = "corrective";
    public string Priority { get; set; } = "medium";
    public Guid DeviceId { get; set; }
    public Guid? AlertId { get; set; }
    public string? RootCause { get; set; }
    public string? Description { get; set; }
    public DateTime? DueDate { get; set; }
}
```

`src/EquipAI.Application/WorkOrders/DTOs/AssignWorkOrderRequest.cs`:
```csharp
namespace EquipAI.Application.WorkOrders.DTOs;

/// <summary>
/// 派工请求
/// </summary>
public class AssignWorkOrderRequest
{
    public Guid AssignedTo { get; set; }
    public string? Note { get; set; }
}
```

`src/EquipAI.Application/WorkOrders/DTOs/CompleteWorkOrderRequest.cs`:
```csharp
namespace EquipAI.Application.WorkOrders.DTOs;

/// <summary>
/// 完成工单请求
/// </summary>
public class CompleteWorkOrderRequest
{
    public string Resolution { get; set; } = string.Empty;
}
```

- [ ] **Step 2: 更新 MappingProfile**

在 `src/EquipAI.Application/Mapping/MappingProfile.cs` 的 MappingProfile 构造函数末尾（`// ========== 告警实例映射 ==========` 部分之后）添加：

```csharp
        // ========== 分析映射 ==========

        CreateMap<Core.Entities.Analysis, Analysis.DTOs.AnalysisDto>()
            .ForMember(dest => dest.Level, opt => opt.MapFrom(src => src.Level.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));

        // ========== 工单映射 ==========

        CreateMap<Core.Entities.WorkOrder, WorkOrders.DTOs.WorkOrderDto>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type.ToString()))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.Priority, opt => opt.MapFrom(src => src.Priority.ToString()));

        CreateMap<WorkOrders.DTOs.CreateWorkOrderRequest, Core.Entities.WorkOrder>()
            .ForMember(dest => dest.Type, opt => opt.MapFrom((src, _) =>
                Enum.TryParse<Core.Enums.WorkOrderType>(src.Type, ignoreCase: true, out var t)
                    ? t : Core.Enums.WorkOrderType.Corrective))
            .ForMember(dest => dest.Priority, opt => opt.MapFrom((src, _) =>
                Enum.TryParse<Core.Enums.WorkOrderPriority>(src.Priority, ignoreCase: true, out var p)
                    ? p : Core.Enums.WorkOrderPriority.Medium))
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.TenantId, opt => opt.Ignore())
            .ForMember(dest => dest.WorkOrderCode, opt => opt.Ignore())
            .ForMember(dest => dest.Status, opt => opt.Ignore())
            .ForMember(dest => dest.AnalysisId, opt => opt.Ignore())
            .ForMember(dest => dest.AssignedTo, opt => opt.Ignore())
            .ForMember(dest => dest.StartedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CompletedAt, opt => opt.Ignore())
            .ForMember(dest => dest.ClosedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore());
```

- [ ] **Step 3: 编译验证**

Run: `dotnet build src/EquipAI.Application/EquipAI.Application.csproj`
Expected: BUILD SUCCEEDED

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.Application/Analysis/DTOs/ src/EquipAI.Application/WorkOrders/DTOs/ \
        src/EquipAI.Application/Mapping/MappingProfile.cs
git commit -m "feat: add analysis and work order DTOs with AutoMapper mappings"
```

---

### Task 10: Analysis 事件处理器 + DTOs

**Files:**
- Create: `src/EquipAI.Application/Analysis/Handlers/RootCauseAnalysisHandler.cs`

- [ ] **Step 1: 创建 RootCauseAnalysisHandler**

`src/EquipAI.Application/Analysis/Handlers/RootCauseAnalysisHandler.cs`:
```csharp
using EquipAI.Core.Entities;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Analysis.Handlers;

/// <summary>
/// 告警触发事件处理器 — 触发 AI 根因分析
/// 监听 AlertTriggeredEvent，查询基线数据后调用 RootCauseAnalysisEngine
/// 分析完成后发布 AnalysisCompletedEvent
/// </summary>
public class RootCauseAnalysisHandler : IEventHandler<AlertTriggeredEvent>
{
    private readonly IAnalysisService _analysisService;
    private readonly IEventBus _eventBus;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RootCauseAnalysisHandler> _logger;

    public RootCauseAnalysisHandler(
        IAnalysisService analysisService,
        IEventBus eventBus,
        IServiceScopeFactory scopeFactory,
        ILogger<RootCauseAnalysisHandler> logger)
    {
        _analysisService = analysisService;
        _eventBus = eventBus;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task HandleAsync(AlertTriggeredEvent @event, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("开始根因分析：AlertId={AlertId}, 设备={DeviceId}, 指标={Metric}",
            @event.AlertId, @event.DeviceId, @event.Metric);

        // 查询基线数据
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var baseline = await dbContext.MetricBaselines
            .FirstOrDefaultAsync(b => b.TenantId == @event.TenantId
                && b.DeviceId == @event.DeviceId
                && b.Metric == @event.Metric, cancellationToken);

        // 执行分析
        var analysis = await _analysisService.AnalyzeAsync(
            @event.TenantId, @event.AlertId, @event.DeviceId,
            @event.Metric, @event.Value, baseline, cancellationToken);

        // 保存分析结果
        dbContext.Set<Core.Entities.Analysis>().Add(analysis);
        await dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("根因分析完成：AnalysisId={AnalysisId}, 级别={Level}, 状态={Status}",
            analysis.Id, analysis.Level, analysis.Status);

        // 发布分析完成事件
        var completedEvent = new AnalysisCompletedEvent(
            Guid.NewGuid(), DateTime.UtcNow, @event.TenantId,
            analysis.Id, @event.AlertId, @event.DeviceId,
            @event.Metric, analysis.Level, analysis.Confidence,
            analysis.RootCause, analysis.Suggestion);

        await _eventBus.PublishAsync(completedEvent, cancellationToken);
    }
}
```

- [ ] **Step 2: 编译验证**

Run: `dotnet build src/EquipAI.Application/EquipAI.Application.csproj`
Expected: BUILD SUCCEEDED

- [ ] **Step 3: 提交**

```bash
git add src/EquipAI.Application/Analysis/Handlers/RootCauseAnalysisHandler.cs
git commit -m "feat: add RootCauseAnalysisHandler for automatic analysis on alert"
```

---

### Task 11: WorkOrderService

**Files:**
- Create: `src/EquipAI.Application/WorkOrders/WorkOrderService.cs`

- [ ] **Step 1: 创建 WorkOrderService**

`src/EquipAI.Application/WorkOrders/WorkOrderService.cs`:
```csharp
using AutoMapper;
using EquipAI.Application.DTOs.Common;
using EquipAI.Application.WorkOrders.DTOs;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders;

/// <summary>
/// 工单服务实现，提供完整的工单生命周期管理
/// 每次状态变更都写入 WorkOrderLog 审计日志
/// 状态变更后发布 WorkOrderStatusChangedEvent
/// </summary>
public class WorkOrderService : IWorkOrderService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IEventBus _eventBus;
    private readonly IMapper _mapper;
    private readonly ILogger<WorkOrderService> _logger;

    public WorkOrderService(
        IServiceScopeFactory scopeFactory,
        IEventBus eventBus,
        IMapper mapper,
        ILogger<WorkOrderService> logger)
    {
        _scopeFactory = scopeFactory;
        _eventBus = eventBus;
        _mapper = mapper;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<WorkOrderDto> CreateAsync(Guid tenantId, CreateWorkOrderRequest request, Guid? userId = null, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var wo = _mapper.Map<WorkOrder>(request);
        wo.TenantId = tenantId;
        wo.WorkOrderCode = await GenerateCodeAsync(dbContext, tenantId, ct);
        wo.Status = WorkOrderStatus.PendingDispatch;
        wo.CreatedBy = userId;

        dbContext.WorkOrders.Add(wo);
        await WriteLogAsync(dbContext, wo.Id, WorkOrderLogAction.Created, null, wo.Status.ToString(), userId, null, ct);
        await dbContext.SaveChangesAsync(ct);

        await _eventBus.PublishAsync(new WorkOrderCreatedEvent(
            Guid.NewGuid(), DateTime.UtcNow, tenantId, wo.Id, wo.DeviceId, wo.Title, wo.Priority.ToString()), ct);

        _logger.LogInformation("工单已创建: {Code}", wo.WorkOrderCode);
        return _mapper.Map<WorkOrderDto>(wo);
    }

    /// <inheritdoc />
    public async Task<WorkOrderDto> GetByIdAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var wo = await dbContext.WorkOrders.FindAsync([id], ct);
        if (wo == null) throw new KeyNotFoundException($"工单 {id} 不存在");

        return _mapper.Map<WorkOrderDto>(wo);
    }

    /// <inheritdoc />
    public async Task<PagedResult<WorkOrderDto>> ListAsync(Guid tenantId, int page, int pageSize, string? status = null, Guid? deviceId = null, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var query = dbContext.WorkOrders.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<WorkOrderStatus>(status, ignoreCase: true, out var s))
            query = query.Where(wo => wo.Status == s);

        if (deviceId.HasValue)
            query = query.Where(wo => wo.DeviceId == deviceId.Value);

        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(wo => wo.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<WorkOrderDto>
        {
            Items = _mapper.Map<List<WorkOrderDto>>(items)!,
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    /// <inheritdoc />
    public async Task<WorkOrderDto> AssignAsync(Guid tenantId, Guid id, AssignWorkOrderRequest request, Guid userId, CancellationToken ct = default) =>
        await TransitionStatusAsync(id, WorkOrderStatus.PendingDispatch, WorkOrderStatus.Assigned, userId,
            wo => wo.AssignedTo = request.AssignedTo, request.Note, ct);

    /// <inheritdoc />
    public async Task<WorkOrderDto> StartAsync(Guid tenantId, Guid id, Guid userId, CancellationToken ct = default) =>
        await TransitionStatusAsync(id, WorkOrderStatus.Assigned, WorkOrderStatus.InProgress, userId,
            wo => wo.StartedAt = DateTime.UtcNow, null, ct);

    /// <inheritdoc />
    public async Task<WorkOrderDto> CompleteAsync(Guid tenantId, Guid id, CompleteWorkOrderRequest request, Guid userId, CancellationToken ct = default) =>
        await TransitionStatusAsync(id, WorkOrderStatus.InProgress, WorkOrderStatus.Completed, userId,
            wo => { wo.CompletedAt = DateTime.UtcNow; wo.Resolution = request.Resolution; }, null, ct);

    /// <inheritdoc />
    public async Task<WorkOrderDto> AcceptAsync(Guid tenantId, Guid id, Guid userId, string? note = null, CancellationToken ct = default) =>
        await TransitionStatusAsync(id, WorkOrderStatus.Completed, WorkOrderStatus.Accepted, userId, null, note, ct);

    /// <inheritdoc />
    public async Task<WorkOrderDto> RejectAsync(Guid tenantId, Guid id, Guid userId, string? note = null, CancellationToken ct = default) =>
        await TransitionStatusAsync(id, WorkOrderStatus.Completed, WorkOrderStatus.Rejected, userId, null, note, ct);

    /// <inheritdoc />
    public async Task<WorkOrderDto> CloseAsync(Guid tenantId, Guid id, Guid userId, string? note = null, CancellationToken ct = default) =>
        await TransitionStatusAsync(id, WorkOrderStatus.Accepted, WorkOrderStatus.Closed, userId,
            wo => wo.ClosedAt = DateTime.UtcNow, note, ct);

    /// <inheritdoc />
    public async Task<WorkOrderDto> CancelAsync(Guid tenantId, Guid id, Guid userId, string? note = null, CancellationToken ct = default)
    {
        // 取消可从多个状态发起
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var wo = await dbContext.WorkOrders.FindAsync([id], ct)
            ?? throw new KeyNotFoundException($"工单 {id} 不存在");

        var allowedStatuses = new[] { WorkOrderStatus.PendingDispatch, WorkOrderStatus.Assigned, WorkOrderStatus.InProgress };
        if (!allowedStatuses.Contains(wo.Status))
            throw new InvalidOperationException($"工单状态 {wo.Status} 不允许取消");

        var oldStatus = wo.Status.ToString();
        wo.Status = WorkOrderStatus.Cancelled;

        await WriteLogAsync(dbContext, wo.Id, WorkOrderLogAction.StatusChanged, oldStatus, wo.Status.ToString(), userId, note, ct);
        await dbContext.SaveChangesAsync(ct);

        await PublishStatusChangedEvent(tenantId, wo.Id, oldStatus, wo.Status.ToString(), userId, ct);

        return _mapper.Map<WorkOrderDto>(wo);
    }

    /// <summary>
    /// 通用状态转换方法
    /// </summary>
    private async Task<WorkOrderDto> TransitionStatusAsync(Guid id, WorkOrderStatus expectedStatus,
        WorkOrderStatus newStatus, Guid userId, Action<WorkOrder>? updateAction, string? note, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var wo = await dbContext.WorkOrders.FindAsync([id], ct)
            ?? throw new KeyNotFoundException($"工单 {id} 不存在");

        if (wo.Status != expectedStatus)
            throw new InvalidOperationException($"工单状态必须是 {expectedStatus}，当前为 {wo.Status}");

        var oldStatus = wo.Status.ToString();
        wo.Status = newStatus;
        updateAction?.Invoke(wo);

        await WriteLogAsync(dbContext, wo.Id, WorkOrderLogAction.StatusChanged, oldStatus, newStatus.ToString(), userId, note, ct);
        await dbContext.SaveChangesAsync(ct);

        await PublishStatusChangedEvent(wo.TenantId, wo.Id, oldStatus, newStatus.ToString(), userId, ct);

        return _mapper.Map<WorkOrderDto>(wo);
    }

    /// <summary>
    /// 生成工单编码：WO-{yyyyMMdd}-{4位序号}
    /// </summary>
    private static async Task<string> GenerateCodeAsync(AppDbContext dbContext, Guid tenantId, CancellationToken ct)
    {
        var today = DateTime.UtcNow.ToString("yyyyMMdd");
        var prefix = $"WO-{today}-";

        var lastCode = await dbContext.WorkOrders
            .Where(wo => wo.WorkOrderCode.StartsWith(prefix))
            .OrderByDescending(wo => wo.WorkOrderCode)
            .Select(wo => wo.WorkOrderCode)
            .FirstOrDefaultAsync(ct);

        var seq = 1;
        if (lastCode != null && lastCode.Length > prefix.Length && int.TryParse(lastCode[prefix.Length..], out var lastSeq))
        {
            seq = lastSeq + 1;
        }

        return $"{prefix}{seq:D4}";
    }

    /// <summary>
    /// 写入工单审计日志
    /// </summary>
    private static async Task WriteLogAsync(AppDbContext dbContext, Guid workOrderId,
        WorkOrderLogAction action, string? oldStatus, string? newStatus, Guid? operatorId, string? note, CancellationToken ct)
    {
        dbContext.WorkOrderLogs.Add(new WorkOrderLog
        {
            WorkOrderId = workOrderId,
            Action = action,
            OldStatus = oldStatus,
            NewStatus = newStatus,
            OperatorId = operatorId,
            Note = note
        });
    }

    /// <summary>
    /// 发布工单状态变更事件
    /// </summary>
    private async Task PublishStatusChangedEvent(Guid tenantId, Guid workOrderId, string oldStatus, string newStatus, Guid? operatorId, CancellationToken ct)
    {
        await _eventBus.PublishAsync(new WorkOrderStatusChangedEvent(
            Guid.NewGuid(), DateTime.UtcNow, tenantId, workOrderId, oldStatus, newStatus, operatorId), ct);
    }
}
```

- [ ] **Step 2: 编译验证**

Run: `dotnet build src/EquipAI.Application/EquipAI.Application.csproj`
Expected: BUILD SUCCEEDED

- [ ] **Step 3: 提交**

```bash
git add src/EquipAI.Application/WorkOrders/WorkOrderService.cs
git commit -m "feat: add WorkOrderService with full lifecycle management"
```

---

### Task 12: WorkOrder 事件处理器

**Files:**
- Create: `src/EquipAI.Application/WorkOrders/Handlers/WorkOrderAutoCreateHandler.cs`
- Create: `src/EquipAI.Application/WorkOrders/Handlers/WorkOrderAnalysisHandler.cs`

- [ ] **Step 1: 创建 WorkOrderAutoCreateHandler**

`src/EquipAI.Application/WorkOrders/Handlers/WorkOrderAutoCreateHandler.cs`:
```csharp
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders.Handlers;

/// <summary>
/// 告警触发事件处理器 — 自动创建工单
/// 当告警规则的 AutoCreateWorkorder 为 true 时，自动创建纠正性工单
/// 防重复：同一告警不重复创建活跃工单
/// </summary>
public class WorkOrderAutoCreateHandler : IEventHandler<AlertTriggeredEvent>
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IEventBus _eventBus;
    private readonly ILogger<WorkOrderAutoCreateHandler> _logger;

    public WorkOrderAutoCreateHandler(
        IServiceScopeFactory scopeFactory,
        IEventBus eventBus,
        ILogger<WorkOrderAutoCreateHandler> logger)
    {
        _scopeFactory = scopeFactory;
        _eventBus = eventBus;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task HandleAsync(AlertTriggeredEvent @event, CancellationToken cancellationToken = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 查询告警规则，检查是否启用自动创建工单
        if (@event.RuleId == null) return;

        var rule = await dbContext.Set<Core.Entities.AlertRule>().FindAsync([@event.RuleId.Value], cancellationToken);
        if (rule?.AutoCreateWorkorder != true) return;

        // 防重复：同一告警不重复创建活跃工单
        var existing = await dbContext.WorkOrders
            .AnyAsync(wo => wo.AlertId == @event.AlertId
                && wo.Status != WorkOrderStatus.Closed
                && wo.Status != WorkOrderStatus.Cancelled, cancellationToken);

        if (existing)
        {
            _logger.LogDebug("告警 {AlertId} 已有关联工单，跳过自动创建", @event.AlertId);
            return;
        }

        // 创建工单
        var wo = new Core.Entities.WorkOrder
        {
            TenantId = @event.TenantId,
            WorkOrderCode = await GenerateCodeAsync(dbContext, @event.TenantId, cancellationToken),
            Title = $"告警工单：{@event.Metric} 异常",
            Type = WorkOrderType.Corrective,
            Priority = MapSeverity(@event.Severity),
            Status = WorkOrderStatus.PendingDispatch,
            DeviceId = @event.DeviceId,
            AlertId = @event.AlertId
        };

        dbContext.WorkOrders.Add(wo);
        dbContext.WorkOrderLogs.Add(new Core.Entities.WorkOrderLog
        {
            WorkOrderId = wo.Id,
            Action = WorkOrderLogAction.Created,
            NewStatus = wo.Status.ToString(),
            Note = "告警自动创建"
        });

        await dbContext.SaveChangesAsync(cancellationToken);

        await _eventBus.PublishAsync(new WorkOrderCreatedEvent(
            Guid.NewGuid(), DateTime.UtcNow, @event.TenantId, wo.Id,
            wo.DeviceId, wo.Title, wo.Priority.ToString()), cancellationToken);

        _logger.LogInformation("告警自动创建工单: {Code}（告警: {AlertId}）", wo.WorkOrderCode, @event.AlertId);
    }

    /// <summary>
    /// 将告警严重级别映射为工单优先级
    /// </summary>
    private static WorkOrderPriority MapSeverity(string severity) => severity.ToLowerInvariant() switch
    {
        "critical" => WorkOrderPriority.Critical,
        "high" => WorkOrderPriority.High,
        "normal" => WorkOrderPriority.Medium,
        _ => WorkOrderPriority.Low
    };

    /// <summary>
    /// 生成工单编码
    /// </summary>
    private static async Task<string> GenerateCodeAsync(AppDbContext dbContext, Guid tenantId, CancellationToken ct)
    {
        var today = DateTime.UtcNow.ToString("yyyyMMdd");
        var prefix = $"WO-{today}-";

        var lastCode = await dbContext.WorkOrders
            .Where(wo => wo.WorkOrderCode.StartsWith(prefix))
            .OrderByDescending(wo => wo.WorkOrderCode)
            .Select(wo => wo.WorkOrderCode)
            .FirstOrDefaultAsync(ct);

        var seq = 1;
        if (lastCode != null && lastCode.Length > prefix.Length && int.TryParse(lastCode[prefix.Length..], out var lastSeq))
        {
            seq = lastSeq + 1;
        }

        return $"{prefix}{seq:D4}";
    }
}
```

- [ ] **Step 2: 创建 WorkOrderAnalysisHandler**

`src/EquipAI.Application/WorkOrders/Handlers/WorkOrderAnalysisHandler.cs`:
```csharp
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders.Handlers;

/// <summary>
/// 分析完成事件处理器 — 更新关联工单的根因信息
/// 将 AI 分析的根因和建议同步到关联的活跃工单
/// </summary>
public class WorkOrderAnalysisHandler : IEventHandler<AnalysisCompletedEvent>
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<WorkOrderAnalysisHandler> _logger;

    public WorkOrderAnalysisHandler(
        IServiceScopeFactory scopeFactory,
        ILogger<WorkOrderAnalysisHandler> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task HandleAsync(AnalysisCompletedEvent @event, CancellationToken cancellationToken = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 查找关联告警的活跃工单
        var wo = await dbContext.WorkOrders
            .FirstOrDefaultAsync(wo => wo.AlertId == @event.AlertId
                && wo.Status != WorkOrderStatus.Closed
                && wo.Status != WorkOrderStatus.Cancelled, cancellationToken);

        if (wo == null)
        {
            _logger.LogDebug("分析完成但无关联活跃工单：AlertId={AlertId}", @event.AlertId);
            return;
        }

        wo.AnalysisId = @event.AnalysisId;
        wo.RootCause = @event.RootCause;

        await dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("工单 {Code} 已更新根因信息（分析级别: {Level}）", wo.WorkOrderCode, @event.Level);
    }
}
```

- [ ] **Step 3: 编译验证**

Run: `dotnet build src/EquipAI.Application/EquipAI.Application.csproj`
Expected: BUILD SUCCEEDED

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.Application/WorkOrders/Handlers/
git commit -m "feat: add work order event handlers (auto-create and analysis update)"
```

---

### Task 13: Controllers

**Files:**
- Create: `src/EquipAI.WebAPI/Controllers/AnalysesController.cs`
- Create: `src/EquipAI.WebAPI/Controllers/WorkOrdersController.cs`

- [ ] **Step 1: 创建 AnalysesController**

`src/EquipAI.WebAPI/Controllers/AnalysesController.cs`:
```csharp
using AutoMapper;
using EquipAI.Application.Analysis.DTOs;
using EquipAI.Application.DTOs.Common;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// AI 分析结果控制器
/// </summary>
[ApiController]
[Route("api/v1/analyses")]
[Authorize]
public class AnalysesController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IMapper _mapper;
    private readonly IAnalysisService _analysisService;

    public AnalysesController(AppDbContext dbContext, IMapper mapper, IAnalysisService analysisService)
    {
        _dbContext = dbContext;
        _mapper = mapper;
        _analysisService = analysisService;
    }

    [HttpGet]
    [RequirePermission("analysis:read")]
    [ProducesResponseType(typeof(PagedResult<AnalysisDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<AnalysisDto>>> GetAnalyses(
        [FromQuery] PagedQuery query,
        [FromQuery] Guid? deviceId = null,
        [FromQuery] string? level = null)
    {
        var analyses = _dbContext.Set<Core.Entities.Analysis>().AsQueryable();

        if (deviceId.HasValue)
            analyses = analyses.Where(a => a.DeviceId == deviceId.Value);

        var (items, total) = await analyses.ToPagedAsync(query);

        return Ok(new PagedResult<AnalysisDto>
        {
            Items = _mapper.Map<List<AnalysisDto>>(items)!,
            Total = total,
            Page = query.Page,
            PageSize = query.PageSize
        });
    }

    [HttpGet("{id:guid}")]
    [RequirePermission("analysis:read")]
    [ProducesResponseType(typeof(AnalysisDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AnalysisDto>> GetAnalysis(Guid id)
    {
        var analysis = await _dbContext.Set<Core.Entities.Analysis>().FindAsync(id);
        if (analysis == null)
            return NotFound(new { code = 404, message = "分析记录不存在" });

        return Ok(_mapper.Map<AnalysisDto>(analysis));
    }

    [HttpPost]
    [RequirePermission("analysis:trigger")]
    [ProducesResponseType(typeof(AnalysisDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AnalysisDto>> TriggerAnalysis([FromBody] CreateAnalysisRequest request)
    {
        var alert = await _dbContext.Alerts.FindAsync(request.AlertId);
        if (alert == null)
            return NotFound(new { code = 404, message = "告警不存在" });

        var baseline = await _dbContext.MetricBaselines
            .FirstOrDefaultAsync(b => b.DeviceId == alert.DeviceId && b.Metric == alert.Metric);

        var analysis = await _analysisService.AnalyzeAsync(
            alert.TenantId, alert.Id, alert.DeviceId,
            alert.Metric, (double)alert.Value, baseline);

        _dbContext.Set<Core.Entities.Analysis>().Add(analysis);
        await _dbContext.SaveChangesAsync();

        return Ok(_mapper.Map<AnalysisDto>(analysis));
    }
}
```

- [ ] **Step 2: 创建 WorkOrdersController**

`src/EquipAI.WebAPI/Controllers/WorkOrdersController.cs`:
```csharp
using EquipAI.Application.DTOs.Common;
using EquipAI.Application.WorkOrders.DTOs;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 工单管理控制器
/// </summary>
[ApiController]
[Route("api/v1/work-orders")]
[Authorize]
public class WorkOrdersController : ControllerBase
{
    private readonly IWorkOrderService _workOrderService;
    private readonly ITenantContext _tenantContext;

    public WorkOrdersController(IWorkOrderService workOrderService, ITenantContext tenantContext)
    {
        _workOrderService = workOrderService;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    [RequirePermission("workorder:read")]
    [ProducesResponseType(typeof(PagedResult<WorkOrderDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<WorkOrderDto>>> GetWorkOrders(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null, [FromQuery] Guid? deviceId = null)
    {
        var result = await _workOrderService.ListAsync(_tenantContext.TenantId, page, pageSize, status, deviceId);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [RequirePermission("workorder:read")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkOrderDto>> GetWorkOrder(Guid id)
    {
        var wo = await _workOrderService.GetByIdAsync(_tenantContext.TenantId, id);
        if (wo == null) return NotFound(new { code = 404, message = "工单不存在" });
        return Ok(wo);
    }

    [HttpPost]
    [RequirePermission("workorder:create")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<WorkOrderDto>> CreateWorkOrder([FromBody] CreateWorkOrderRequest request)
    {
        var wo = await _workOrderService.CreateAsync(_tenantContext.TenantId, request);
        return CreatedAtAction(nameof(GetWorkOrder), new { id = wo.Id }, wo);
    }

    [HttpPut("{id:guid}/assign")]
    [RequirePermission("workorder:dispatch")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkOrderDto>> AssignWorkOrder(Guid id, [FromBody] AssignWorkOrderRequest request)
    {
        return Ok(await _workOrderService.AssignAsync(_tenantContext.TenantId, id, request, _tenantContext.UserId));
    }

    [HttpPut("{id:guid}/start")]
    [RequirePermission("workorder:execute")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkOrderDto>> StartWorkOrder(Guid id)
    {
        return Ok(await _workOrderService.StartAsync(_tenantContext.TenantId, id, _tenantContext.UserId));
    }

    [HttpPut("{id:guid}/complete")]
    [RequirePermission("workorder:execute")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkOrderDto>> CompleteWorkOrder(Guid id, [FromBody] CompleteWorkOrderRequest request)
    {
        return Ok(await _workOrderService.CompleteAsync(_tenantContext.TenantId, id, request, _tenantContext.UserId));
    }

    [HttpPut("{id:guid}/accept")]
    [RequirePermission("workorder:accept")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkOrderDto>> AcceptWorkOrder(Guid id, [FromBody] NoteRequest? note = null)
    {
        return Ok(await _workOrderService.AcceptAsync(_tenantContext.TenantId, id, _tenantContext.UserId, note?.Note));
    }

    [HttpPut("{id:guid}/reject")]
    [RequirePermission("workorder:accept")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkOrderDto>> RejectWorkOrder(Guid id, [FromBody] NoteRequest? note = null)
    {
        return Ok(await _workOrderService.RejectAsync(_tenantContext.TenantId, id, _tenantContext.UserId, note?.Note));
    }

    [HttpPut("{id:guid}/close")]
    [RequirePermission("workorder:close")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkOrderDto>> CloseWorkOrder(Guid id, [FromBody] NoteRequest? note = null)
    {
        return Ok(await _workOrderService.CloseAsync(_tenantContext.TenantId, id, _tenantContext.UserId, note?.Note));
    }

    [HttpPut("{id:guid}/cancel")]
    [RequirePermission("workorder:cancel")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkOrderDto>> CancelWorkOrder(Guid id, [FromBody] NoteRequest? note = null)
    {
        return Ok(await _workOrderService.CancelAsync(_tenantContext.TenantId, id, _tenantContext.UserId, note?.Note));
    }
}

/// <summary>
/// 通用备注请求
/// </summary>
public class NoteRequest
{
    public string? Note { get; set; }
}
```

注意：WorkOrdersController 使用了 `_tenantContext.UserId`，需确认 ITenantContext 接口是否有此属性。如果没有，需在 Task 14 中添加。

- [ ] **Step 3: 编译验证**

Run: `dotnet build src/EquipAI.WebAPI/EquipAI.WebAPI.csproj`
Expected: BUILD SUCCEEDED（如果 ITenantContext 没有 UserId，需要先添加）

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.WebAPI/Controllers/AnalysesController.cs \
        src/EquipAI.WebAPI/Controllers/WorkOrdersController.cs
git commit -m "feat: add analyses and work orders API controllers"
```

---

### Task 14: DI 注册 + 配置 + 事件订阅

**Files:**
- Modify: `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs`
- Modify: `src/EquipAI.WebAPI/Program.cs`
- Modify: `src/EquipAI.WebAPI/appsettings.json`

- [ ] **Step 1: 检查 ITenantContext.UserId 属性**

读取 `src/EquipAI.Core/Interfaces/ITenantContext.cs`。如果没有 `UserId` 属性，需要添加：
```csharp
    /// <summary>
    /// 当前用户 ID
    /// </summary>
    Guid UserId { get; }
```
同时更新 `TenantContext` 实现类。

- [ ] **Step 2: 在 ServiceCollectionExtensions.AddInfrastructure 中注册 LLM 服务**

在 `// SignalR 实时推送服务` 之前添加：

```csharp
        // LLM 服务（Singleton — Semantic Kernel 内部有状态管理）
        services.AddSingleton<Core.Interfaces.ILLMService, AI.SemanticKernelLLMService>();
```

- [ ] **Step 3: 在 ServiceCollectionExtensions.AddApplication 中注册新服务**

在 `// 告警评估服务` 之后添加：

```csharp
        // 数据质量服务
        services.AddSingleton<IDataQualityService, Analysis.DataQualityService>();

        // 根因分析引擎
        services.AddScoped<IAnalysisService, Analysis.RootCauseAnalysisEngine>();

        // 工单服务
        services.AddScoped<IWorkOrderService, WorkOrders.WorkOrderService>();

        // 事件处理器
        services.AddScoped<Analysis.Handlers.RootCauseAnalysisHandler>();
        services.AddScoped<WorkOrders.Handlers.WorkOrderAutoCreateHandler>();
        services.AddScoped<WorkOrders.Handlers.WorkOrderAnalysisHandler>();
```

需要在文件顶部确认 using 是否包含：
```csharp
using EquipAI.Core.Interfaces;
```

- [ ] **Step 4: 在 Program.cs 中添加事件订阅**

在 `eventBus.Subscribe<AlertTriggeredEvent, AlertEventHandler>();` 之后添加：

```csharp
    eventBus.Subscribe<AlertTriggeredEvent, Application.Analysis.Handlers.RootCauseAnalysisHandler>();
    eventBus.Subscribe<AlertTriggeredEvent, Application.WorkOrders.Handlers.WorkOrderAutoCreateHandler>();
    eventBus.Subscribe<Core.Events.AnalysisCompletedEvent, Application.WorkOrders.Handlers.WorkOrderAnalysisHandler>();
```

- [ ] **Step 5: 在 appsettings.json 中添加 LLM 配置**

在 `"SignalR"` 配置节之后、`"AllowedHosts"` 之前添加：

```json
  "Llm": {
    "ApiKey": "",
    "ModelId": "qwen-plus",
    "Endpoint": "https://dashscope.aliyuncs.com/compatible-mode/v1",
    "TimeoutSeconds": 30
  },
```

- [ ] **Step 6: 编译验证**

Run: `dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 7: 提交**

```bash
git add src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs \
        src/EquipAI.WebAPI/Program.cs src/EquipAI.WebAPI/appsettings.json
git commit -m "feat: register AI analysis and work order services, add LLM config"
```

---

### Task 15: 全量编译 + 测试验证

**Files:**
- 无新增文件

- [ ] **Step 1: 全量编译**

Run: `dotnet build`
Expected: BUILD SUCCEEDED，0 错误 0 警告

- [ ] **Step 2: 运行全部单元测试**

Run: `dotnet test tests/EquipAI.Tests.Unit -v n`
Expected: 全部 PASSED（包含之前的 53 个 + 新增的 7 个 = 60 个）

- [ ] **Step 3: 如有测试失败，修复后重新运行**

---

## 自检清单

| 规格要求 | 对应任务 |
|---------|---------|
| AnalysisLevel/AnalysisStatus 枚举 | Task 1 |
| WorkOrderType/Status/Priority/LogAction 枚举 | Task 1 |
| Analysis 实体 | Task 2 |
| WorkOrder/WorkOrderLog 实体 | Task 2 |
| 事件定义（3个） | Task 3 |
| 接口定义（4个）+ LLMRequest/Response | Task 3 |
| EF 配置 + DbContext + NuGet | Task 4 |
| 数据库迁移 | Task 5 |
| DataQualityService + 测试 | Task 6 |
| SemanticKernelLLMService | Task 7 |
| RootCauseAnalysisEngine + 测试（TDD） | Task 8 |
| DTOs + AutoMapper 映射 | Task 9 |
| RootCauseAnalysisHandler | Task 10 |
| WorkOrderService | Task 11 |
| WorkOrderAutoCreateHandler | Task 12 |
| WorkOrderAnalysisHandler | Task 12 |
| AnalysesController | Task 13 |
| WorkOrdersController | Task 13 |
| DI 注册 + 配置 + 事件订阅 | Task 14 |
| 全量编译 + 测试验证 | Task 15 |
