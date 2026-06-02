# 3A: 工单完整工作流 + 多级审批链 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development

**Goal:** 在现有工单生命周期管理基础上，实现多级审批链机制。当工单提交验收时，系统根据工单类型和优先级自动匹配审批链模板，创建多级审批记录，逐级审批通过后工单才能流转到验收通过状态；任一级驳回则工单返工。

**Architecture:** 新增三个实体层（ApprovalChainTemplate / ApprovalStep / WorkOrderApproval），一个服务层（ApprovalChainService 负责模板匹配、审批记录创建和多级审批逻辑），两个 Controller（WorkOrdersController 增强 + ApprovalChainsController 新增），前端三个改动（审批进度面板 + 派工看板增强 + 设置页审批链配置 Tab）。

**Tech Stack:** .NET 8, EF Core 8, React 19, TypeScript, TanStack Query, shadcn/ui

**前置依赖:** Phase 3A-workflow-dispatch（智能派工 + SLA 追踪，已完成）

---

## 文件结构总览

```
新增文件：

src/EquipAI.Core/
├── Entities/
│   ├── ApprovalChainTemplate.cs              — 审批链模板实体
│   ├── ApprovalStep.cs                       — 审批步骤实体
│   └── WorkOrderApproval.cs                  — 工单审批记录实体
├── Enums/
│   └── ApprovalAction.cs                     — 审批动作枚举

src/EquipAI.Application/
├── Approvals/
│   ├── IApprovalChainService.cs              — 审批链服务接口
│   ├── ApprovalChainService.cs               — 审批链服务实现
│   └── DTOs/
│       ├── ApprovalChainTemplateDto.cs       — 审批链模板 DTO
│       ├── CreateApprovalChainRequest.cs     — 创建审批链请求
│       ├── UpdateApprovalChainRequest.cs     — 更新审批链请求
│       ├── WorkOrderApprovalDto.cs           — 工单审批记录 DTO
│       └── ApprovalActionRequest.cs          — 审批操作请求

src/EquipAI.Infrastructure/Data/Configurations/
├── ApprovalChainTemplateConfiguration.cs     — 审批链模板 EF 配置
├── ApprovalStepConfiguration.cs              — 审批步骤 EF 配置
├── WorkOrderApprovalConfiguration.cs         — 工单审批记录 EF 配置

src/EquipAI.WebAPI/Controllers/
├── ApprovalChainsController.cs               — 审批链 CRUD API

tests/EquipAI.Tests.Unit/
├── Approvals/
│   └── ApprovalChainServiceTests.cs          — 审批链服务单元测试

frontend/src/
├── hooks/useApprovals.ts                     — 审批链 hooks
├── components/workorder/ApprovalProgressPanel.tsx — 审批进度面板组件

修改文件：

src/EquipAI.Core/Enums/WorkOrderLogAction.cs              — 新增 Submitted 枚举值
src/EquipAI.Core/Enums/WorkOrderStatus.cs                 — 新增 SubmittedForApproval 状态
src/EquipAI.Infrastructure/Data/AppDbContext.cs           — 新增 DbSet
src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs — 注册服务
src/EquipAI.Application/WorkOrders/WorkOrderService.cs    — 新增 SubmitAsync + 修改状态流转
src/EquipAI.Application/WorkOrders/IWorkOrderService.cs   — 接口新增方法
src/EquipAI.WebAPI/Controllers/WorkOrdersController.cs    — 新增 submit 端点 + 增强 approve/reject
frontend/src/types/index.ts                               — 新增审批相关类型
frontend/src/pages/WorkOrderDetailPage.tsx                — 集成审批进度面板
frontend/src/pages/SettingsPage.tsx                       — 新增审批链配置 Tab
```

---

### Task 1: ApprovalChainTemplate + ApprovalStep 实体 + EF 配置 + 迁移

**Files:**
- Create: `src/EquipAI.Core/Entities/ApprovalChainTemplate.cs`
- Create: `src/EquipAI.Core/Entities/ApprovalStep.cs`
- Create: `src/EquipAI.Core/Enums/ApprovalAction.cs`
- Create: `src/EquipAI.Infrastructure/Data/Configurations/ApprovalChainTemplateConfiguration.cs`
- Create: `src/EquipAI.Infrastructure/Data/Configurations/ApprovalStepConfiguration.cs`
- Modify: `src/EquipAI.Infrastructure/Data/AppDbContext.cs`
- Modify: `src/EquipAI.Core/Enums/WorkOrderStatus.cs` — 新增 SubmittedForApproval
- Modify: `src/EquipAI.Core/Enums/WorkOrderLogAction.cs` — 新增 Submitted

- [ ] **Step 1: 创建 ApprovalAction 枚举**

```csharp
// src/EquipAI.Core/Enums/ApprovalAction.cs
namespace EquipAI.Core.Enums;

/// <summary>
/// 审批动作枚举，定义审批链中每一步可执行的操作
/// </summary>
public enum ApprovalAction
{
    /// <summary>
    /// 待审批（初始状态）
    /// </summary>
    Pending,

    /// <summary>
    /// 审批通过
    /// </summary>
    Approved,

    /// <summary>
    /// 审批驳回
    /// </summary>
    Rejected
}
```

- [ ] **Step 2: 新增 WorkOrderStatus 枚举值**

在 `src/EquipAI.Core/Enums/WorkOrderStatus.cs` 中，在 `Completed` 之后、`Accepted` 之前新增：

```csharp
// src/EquipAI.Core/Enums/WorkOrderStatus.cs
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
    /// 已完成（等待提交验收）
    /// </summary>
    Completed,

    /// <summary>
    /// 已提交验收（审批链流转中）
    /// </summary>
    SubmittedForApproval,

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

- [ ] **Step 3: 新增 WorkOrderLogAction 枚举值**

在 `src/EquipAI.Core/Enums/WorkOrderLogAction.cs` 中新增：

```csharp
// src/EquipAI.Core/Enums/WorkOrderLogAction.cs
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
    CommentAdded,

    /// <summary>
    /// 提交验收
    /// </summary>
    Submitted,

    /// <summary>
    /// 审批通过
    /// </summary>
    Approved,

    /// <summary>
    /// 审批驳回
    /// </summary>
    ApprovalRejected
}
```

- [ ] **Step 4: 创建 ApprovalChainTemplate 实体**

```csharp
// src/EquipAI.Core/Entities/ApprovalChainTemplate.cs
using EquipAI.Core.Enums;

namespace EquipAI.Core.Entities;

/// <summary>
/// 审批链模板 — 定义不同工单类型和优先级对应的审批流程
/// 每个模板包含多个有序的审批步骤（ApprovalStep）
///
/// 匹配规则优先级：
/// 1. 精确匹配 (WorkOrderType + WorkOrderPriority)
/// 2. 回退到工单类型默认链 (WorkOrderType 匹配 + IsDefault=true)
/// 3. 回退到全局默认链 (WorkOrderType=null + IsDefault=true)
/// </summary>
public class ApprovalChainTemplate : BaseEntity
{
    /// <summary>
    /// 所属租户 ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 适用的工单类型（null 表示不限定类型，作为全局默认模板）
    /// </summary>
    public WorkOrderType? WorkOrderType { get; set; }

    /// <summary>
    /// 适用的工单优先级（null 表示不限定优先级）
    /// </summary>
    public WorkOrderPriority? WorkOrderPriority { get; set; }

    /// <summary>
    /// 审批链名称（如"纠正性紧急审批"、"通用审批流程"）
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 是否为默认模板
    /// 当精确匹配不到时，回退到同类型下 IsDefault=true 的模板
    /// </summary>
    public bool IsDefault { get; set; }

    /// <summary>
    /// 是否启用
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// 审批步骤列表（按 StepOrder 排序）
    /// </summary>
    public List<ApprovalStep> Steps { get; set; } = [];
}
```

- [ ] **Step 5: 创建 ApprovalStep 实体**

```csharp
// src/EquipAI.Core/Entities/ApprovalStep.cs
using EquipAI.Core.Enums;

namespace EquipAI.Core.Entities;

/// <summary>
/// 审批步骤 — 审批链模板中的单级审批配置
/// 每一步可指定角色审批或具体人员审批
/// </summary>
public class ApprovalStep : BaseEntity
{
    /// <summary>
    /// 所属审批链模板 ID
    /// </summary>
    public Guid ChainId { get; set; }

    /// <summary>
    /// 步骤顺序（从 1 开始，越小越先执行）
    /// </summary>
    public int StepOrder { get; set; }

    /// <summary>
    /// 审批角色（如 MaintenanceLead、SystemAdmin）
    /// 当 SpecificApproverId 为空时，拥有此角色的任何用户均可审批
    /// </summary>
    public UserRole Role { get; set; }

    /// <summary>
    /// 指定审批人 ID（优先于 Role 匹配）
    /// 当此字段有值时，只有该用户才能执行此步审批
    /// </summary>
    public Guid? SpecificApproverId { get; set; }

    /// <summary>
    /// 是否必须（保留字段，当前所有步骤均为必须）
    /// </summary>
    public bool IsRequired { get; set; } = true;
}
```

- [ ] **Step 6: 创建 EF 配置 — ApprovalChainTemplate**

```csharp
// src/EquipAI.Infrastructure/Data/Configurations/ApprovalChainTemplateConfiguration.cs
using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// ApprovalChainTemplate 实体的 EF Core 配置
/// </summary>
public class ApprovalChainTemplateConfiguration : IEntityTypeConfiguration<ApprovalChainTemplate>
{
    public void Configure(EntityTypeBuilder<ApprovalChainTemplate> builder)
    {
        builder.ToTable("approval_chain_templates");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.TenantId).HasColumnName("tenant_id");
        builder.Property(e => e.WorkOrderType).HasColumnName("work_order_type");
        builder.Property(e => e.WorkOrderPriority).HasColumnName("work_order_priority");
        builder.Property(e => e.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
        builder.Property(e => e.IsDefault).HasColumnName("is_default");
        builder.Property(e => e.Enabled).HasColumnName("enabled");
        builder.Property(e => e.CreatedAt).HasColumnName("created_at");

        // 一对多关系：模板包含多个步骤
        builder.HasMany(e => e.Steps)
            .WithOne()
            .HasForeignKey(s => s.ChainId)
            .OnDelete(DeleteBehavior.Cascade);

        // 索引：用于审批链匹配查询
        builder.HasIndex(e => new { e.TenantId, e.WorkOrderType, e.WorkOrderPriority });
        builder.HasIndex(e => new { e.TenantId, e.WorkOrderType, e.IsDefault });
        builder.HasIndex(e => new { e.TenantId, e.Enabled });
    }
}
```

- [ ] **Step 7: 创建 EF 配置 — ApprovalStep**

```csharp
// src/EquipAI.Infrastructure/Data/Configurations/ApprovalStepConfiguration.cs
using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// ApprovalStep 实体的 EF Core 配置
/// </summary>
public class ApprovalStepConfiguration : IEntityTypeConfiguration<ApprovalStep>
{
    public void Configure(EntityTypeBuilder<ApprovalStep> builder)
    {
        builder.ToTable("approval_steps");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.ChainId).HasColumnName("chain_id");
        builder.Property(e => e.StepOrder).HasColumnName("step_order");
        builder.Property(e => e.Role).HasColumnName("role");
        builder.Property(e => e.SpecificApproverId).HasColumnName("specific_approver_id");
        builder.Property(e => e.IsRequired).HasColumnName("is_required");
        builder.Property(e => e.CreatedAt).HasColumnName("created_at");

        builder.HasIndex(e => new { e.ChainId, e.StepOrder }).IsUnique();
    }
}
```

- [ ] **Step 8: 在 AppDbContext 中添加 DbSet**

在 `src/EquipAI.Infrastructure/Data/AppDbContext.cs` 的 DbSet 区域添加：

```csharp
/// <summary>
/// 审批链模板表
/// </summary>
public DbSet<Core.Entities.ApprovalChainTemplate> ApprovalChainTemplates => Set<Core.Entities.ApprovalChainTemplate>();

/// <summary>
/// 审批步骤表
/// </summary>
public DbSet<Core.Entities.ApprovalStep> ApprovalSteps => Set<Core.Entities.ApprovalStep>();
```

- [ ] **Step 9: 生成 EF Core 迁移**

Run:
```bash
cd /Users/yqgmac/yqg/project/EquipSense/src/EquipAI.Infrastructure
dotnet ef migrations add AddApprovalChainEntities \
  --startup-project ../EquipAI.WebAPI/EquipAI.WebAPI.csproj \
  --context AppDbContext \
  --output-dir Data/Migrations
```

Expected: 迁移文件生成成功，包含 `approval_chain_templates` 和 `approval_steps` 表创建

- [ ] **Step 10: 编译确认**

Run: `cd /Users/yqgmac/yqg/project/EquipSense && dotnet build EquipAI.slnx`

Expected: 编译成功

- [ ] **Step 11: 提交**

```bash
git add src/EquipAI.Core/Entities/ApprovalChainTemplate.cs \
  src/EquipAI.Core/Entities/ApprovalStep.cs \
  src/EquipAI.Core/Enums/ApprovalAction.cs \
  src/EquipAI.Core/Enums/WorkOrderStatus.cs \
  src/EquipAI.Core/Enums/WorkOrderLogAction.cs \
  src/EquipAI.Infrastructure/Data/Configurations/ApprovalChainTemplateConfiguration.cs \
  src/EquipAI.Infrastructure/Data/Configurations/ApprovalStepConfiguration.cs \
  src/EquipAI.Infrastructure/Data/AppDbContext.cs \
  src/EquipAI.Infrastructure/Data/Migrations/
git commit -m "feat: 审批链模板实体 ApprovalChainTemplate + ApprovalStep + EF 配置"
```

---

### Task 2: WorkOrderApproval 实体 + EF 配置

**Files:**
- Create: `src/EquipAI.Core/Entities/WorkOrderApproval.cs`
- Create: `src/EquipAI.Infrastructure/Data/Configurations/WorkOrderApprovalConfiguration.cs`
- Modify: `src/EquipAI.Infrastructure/Data/AppDbContext.cs`

- [ ] **Step 1: 创建 WorkOrderApproval 实体**

```csharp
// src/EquipAI.Core/Entities/WorkOrderApproval.cs
using EquipAI.Core.Enums;

namespace EquipAI.Core.Entities;

/// <summary>
/// 工单审批记录 — 记录工单在审批链中的每一步审批状态
/// 每条记录对应审批链模板中一个步骤的一次实例化
/// </summary>
public class WorkOrderApproval : BaseEntity
{
    /// <summary>
    /// 所属租户 ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 关联工单 ID
    /// </summary>
    public Guid WorkOrderId { get; set; }

    /// <summary>
    /// 步骤顺序（对应审批链模板中的 StepOrder）
    /// </summary>
    public int StepOrder { get; set; }

    /// <summary>
    /// 期望审批角色（来自模板）
    /// </summary>
    public UserRole ExpectedRole { get; set; }

    /// <summary>
    /// 指定审批人 ID（来自模板，可为空表示角色内任何人）
    /// </summary>
    public Guid? SpecificApproverId { get; set; }

    /// <summary>
    /// 实际审批人 ID（审批操作时填入）
    /// </summary>
    public Guid? ApproverId { get; set; }

    /// <summary>
    /// 审批动作（Pending / Approved / Rejected）
    /// </summary>
    public ApprovalAction Action { get; set; } = ApprovalAction.Pending;

    /// <summary>
    /// 审批意见
    /// </summary>
    public string? Comment { get; set; }

    /// <summary>
    /// 审批操作时间
    /// </summary>
    public DateTime? ActedAt { get; set; }
}
```

- [ ] **Step 2: 创建 EF 配置**

```csharp
// src/EquipAI.Infrastructure/Data/Configurations/WorkOrderApprovalConfiguration.cs
using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// WorkOrderApproval 实体的 EF Core 配置
/// </summary>
public class WorkOrderApprovalConfiguration : IEntityTypeConfiguration<WorkOrderApproval>
{
    public void Configure(EntityTypeBuilder<WorkOrderApproval> builder)
    {
        builder.ToTable("work_order_approvals");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.TenantId).HasColumnName("tenant_id");
        builder.Property(e => e.WorkOrderId).HasColumnName("work_order_id");
        builder.Property(e => e.StepOrder).HasColumnName("step_order");
        builder.Property(e => e.ExpectedRole).HasColumnName("expected_role");
        builder.Property(e => e.SpecificApproverId).HasColumnName("specific_approver_id");
        builder.Property(e => e.ApproverId).HasColumnName("approver_id");
        builder.Property(e => e.Action).HasColumnName("action");
        builder.Property(e => e.Comment).HasColumnName("comment");
        builder.Property(e => e.ActedAt).HasColumnName("acted_at");
        builder.Property(e => e.CreatedAt).HasColumnName("created_at");

        // 索引：按工单查询审批记录
        builder.HasIndex(e => new { e.WorkOrderId, e.StepOrder });
        // 索引：按租户和状态查询待审批记录
        builder.HasIndex(e => new { e.TenantId, e.Action });
        // 索引：查询指定审批人的待审批记录
        builder.HasIndex(e => new { e.SpecificApproverId, e.Action });
    }
}
```

- [ ] **Step 3: 在 AppDbContext 中添加 DbSet**

在 `src/EquipAI.Infrastructure/Data/AppDbContext.cs` 的 DbSet 区域添加：

```csharp
/// <summary>
/// 工单审批记录表
/// </summary>
public DbSet<Core.Entities.WorkOrderApproval> WorkOrderApprovals => Set<Core.Entities.WorkOrderApproval>();
```

- [ ] **Step 4: 生成 EF Core 迁移**

Run:
```bash
cd /Users/yqgmac/yqg/project/EquipSense/src/EquipAI.Infrastructure
dotnet ef migrations add AddWorkOrderApprovals \
  --startup-project ../EquipAI.WebAPI/EquipAI.WebAPI.csproj \
  --context AppDbContext \
  --output-dir Data/Migrations
```

Expected: 迁移文件生成成功，包含 `work_order_approvals` 表创建

- [ ] **Step 5: 编译确认**

Run: `cd /Users/yqgmac/yqg/project/EquipSense && dotnet build EquipAI.slnx`

Expected: 编译成功

- [ ] **Step 6: 提交**

```bash
git add src/EquipAI.Core/Entities/WorkOrderApproval.cs \
  src/EquipAI.Infrastructure/Data/Configurations/WorkOrderApprovalConfiguration.cs \
  src/EquipAI.Infrastructure/Data/AppDbContext.cs \
  src/EquipAI.Infrastructure/Data/Migrations/
git commit -m "feat: 工单审批记录实体 WorkOrderApproval + EF 配置"
```

---

### Task 3: ApprovalChainService — 模板匹配 + 审批记录创建 + 多级审批逻辑

**Files:**
- Create: `src/EquipAI.Application/Approvals/IApprovalChainService.cs`
- Create: `src/EquipAI.Application/Approvals/ApprovalChainService.cs`
- Create: `src/EquipAI.Application/Approvals/DTOs/ApprovalChainTemplateDto.cs`
- Create: `src/EquipAI.Application/Approvals/DTOs/CreateApprovalChainRequest.cs`
- Create: `src/EquipAI.Application/Approvals/DTOs/UpdateApprovalChainRequest.cs`
- Create: `src/EquipAI.Application/Approvals/DTOs/WorkOrderApprovalDto.cs`
- Create: `src/EquipAI.Application/Approvals/DTOs/ApprovalActionRequest.cs`
- Create: `tests/EquipAI.Tests.Unit/Approvals/ApprovalChainServiceTests.cs`

- [ ] **Step 1: 创建 DTOs**

```csharp
// src/EquipAI.Application/Approvals/DTOs/ApprovalChainTemplateDto.cs
namespace EquipAI.Application.Approvals.DTOs;

/// <summary>
/// 审批链模板 DTO
/// </summary>
public class ApprovalChainTemplateDto
{
    /// <summary>模板 ID</summary>
    public Guid Id { get; set; }

    /// <summary>适用的工单类型（null 表示不限）</summary>
    public string? WorkOrderType { get; set; }

    /// <summary>适用的工单优先级（null 表示不限）</summary>
    public string? WorkOrderPriority { get; set; }

    /// <summary>审批链名称</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>是否为默认模板</summary>
    public bool IsDefault { get; set; }

    /// <summary>是否启用</summary>
    public bool Enabled { get; set; }

    /// <summary>创建时间</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>审批步骤列表</summary>
    public List<ApprovalStepDto> Steps { get; set; } = [];
}

/// <summary>
/// 审批步骤 DTO
/// </summary>
public class ApprovalStepDto
{
    /// <summary>步骤 ID</summary>
    public Guid Id { get; set; }

    /// <summary>步骤顺序</summary>
    public int StepOrder { get; set; }

    /// <summary>审批角色</summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>指定审批人 ID</summary>
    public Guid? SpecificApproverId { get; set; }

    /// <summary>是否必须</summary>
    public bool IsRequired { get; set; }
}
```

```csharp
// src/EquipAI.Application/Approvals/DTOs/CreateApprovalChainRequest.cs
namespace EquipAI.Application.Approvals.DTOs;

/// <summary>
/// 创建审批链请求
/// </summary>
public class CreateApprovalChainRequest
{
    /// <summary>适用的工单类型（null 表示不限）</summary>
    public string? WorkOrderType { get; set; }

    /// <summary>适用的工单优先级（null 表示不限）</summary>
    public string? WorkOrderPriority { get; set; }

    /// <summary>审批链名称</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>是否为默认模板</summary>
    public bool IsDefault { get; set; }

    /// <summary>是否启用</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>审批步骤列表</summary>
    public List<CreateApprovalStepRequest> Steps { get; set; } = [];
}

/// <summary>
/// 创建审批步骤请求
/// </summary>
public class CreateApprovalStepRequest
{
    /// <summary>步骤顺序（从 1 开始）</summary>
    public int StepOrder { get; set; }

    /// <summary>审批角色</summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>指定审批人 ID</summary>
    public Guid? SpecificApproverId { get; set; }

    /// <summary>是否必须</summary>
    public bool IsRequired { get; set; } = true;
}
```

```csharp
// src/EquipAI.Application/Approvals/DTOs/UpdateApprovalChainRequest.cs
namespace EquipAI.Application.Approvals.DTOs;

/// <summary>
/// 更新审批链请求
/// </summary>
public class UpdateApprovalChainRequest
{
    /// <summary>审批链名称</summary>
    public string? Name { get; set; }

    /// <summary>是否为默认模板</summary>
    public bool? IsDefault { get; set; }

    /// <summary>是否启用</summary>
    public bool? Enabled { get; set; }

    /// <summary>审批步骤列表（传入则整体替换）</summary>
    public List<CreateApprovalStepRequest>? Steps { get; set; }
}
```

```csharp
// src/EquipAI.Application/Approvals/DTOs/WorkOrderApprovalDto.cs
namespace EquipAI.Application.Approvals.DTOs;

/// <summary>
/// 工单审批记录 DTO
/// </summary>
public class WorkOrderApprovalDto
{
    /// <summary>审批记录 ID</summary>
    public Guid Id { get; set; }

    /// <summary>工单 ID</summary>
    public Guid WorkOrderId { get; set; }

    /// <summary>步骤顺序</summary>
    public int StepOrder { get; set; }

    /// <summary>期望审批角色</summary>
    public string ExpectedRole { get; set; } = string.Empty;

    /// <summary>指定审批人 ID</summary>
    public Guid? SpecificApproverId { get; set; }

    /// <summary>实际审批人 ID</summary>
    public Guid? ApproverId { get; set; }

    /// <summary>审批动作（Pending / Approved / Rejected）</summary>
    public string Action { get; set; } = "Pending";

    /// <summary>审批意见</summary>
    public string? Comment { get; set; }

    /// <summary>审批操作时间</summary>
    public DateTime? ActedAt { get; set; }

    /// <summary>创建时间</summary>
    public DateTime CreatedAt { get; set; }
}
```

```csharp
// src/EquipAI.Application/Approvals/DTOs/ApprovalActionRequest.cs
namespace EquipAI.Application.Approvals.DTOs;

/// <summary>
/// 审批操作请求（通过或驳回）
/// </summary>
public class ApprovalActionRequest
{
    /// <summary>
    /// 审批动作（Approved / Rejected）
    /// </summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// 审批意见
    /// </summary>
    public string? Comment { get; set; }
}
```

- [ ] **Step 2: 创建 IApprovalChainService 接口**

```csharp
// src/EquipAI.Application/Approvals/IApprovalChainService.cs
using EquipAI.Application.Approvals.DTOs;
using EquipAI.Core.Models;

namespace EquipAI.Application.Approvals;

/// <summary>
/// 审批链服务接口
/// 提供审批链模板管理、工单审批记录创建和多级审批逻辑
/// </summary>
public interface IApprovalChainService
{
    // ========== 审批链模板 CRUD ==========

    /// <summary>
    /// 获取审批链模板列表（分页）
    /// </summary>
    Task<PagedResult<ApprovalChainTemplateDto>> ListTemplatesAsync(
        Guid tenantId, int page, int pageSize, CancellationToken ct = default);

    /// <summary>
    /// 获取审批链模板详情
    /// </summary>
    Task<ApprovalChainTemplateDto> GetTemplateByIdAsync(Guid tenantId, Guid id, CancellationToken ct = default);

    /// <summary>
    /// 创建审批链模板
    /// </summary>
    Task<ApprovalChainTemplateDto> CreateTemplateAsync(
        Guid tenantId, CreateApprovalChainRequest request, CancellationToken ct = default);

    /// <summary>
    /// 更新审批链模板
    /// </summary>
    Task<ApprovalChainTemplateDto> UpdateTemplateAsync(
        Guid tenantId, Guid id, UpdateApprovalChainRequest request, CancellationToken ct = default);

    /// <summary>
    /// 删除审批链模板
    /// </summary>
    Task DeleteTemplateAsync(Guid tenantId, Guid id, CancellationToken ct = default);

    // ========== 工单审批 ==========

    /// <summary>
    /// 为工单创建审批记录（提交验收时调用）
    /// 根据工单类型和优先级匹配审批链模板，创建对应的审批记录
    /// 如果没有匹配到审批链，则跳过审批流程（直接变为可验收状态）
    /// </summary>
    /// <returns>创建的审批记录数量（0 表示无审批链，跳过审批）</returns>
    Task<int> CreateApprovalsForWorkOrderAsync(
        Guid tenantId, Guid workOrderId, CancellationToken ct = default);

    /// <summary>
    /// 获取工单的审批记录列表
    /// </summary>
    Task<List<WorkOrderApprovalDto>> GetWorkOrderApprovalsAsync(
        Guid tenantId, Guid workOrderId, CancellationToken ct = default);

    /// <summary>
    /// 执行审批操作（通过或驳回）
    /// 审批通过时：如果还有后续步骤，保持 SubmittedForApproval 状态；
    ///            如果是最后一步，返回 true 表示所有审批通过。
    /// 审批驳回时：返回 false。
    /// </summary>
    /// <returns>true 表示所有审批步骤通过（工单可流转到 Accepted），false 表示驳回或还有后续步骤</returns>
    Task<ApprovalResult> ProcessApprovalAsync(
        Guid tenantId, Guid workOrderId, Guid approverId,
        ApprovalActionRequest request, CancellationToken ct = default);

    /// <summary>
    /// 获取当前用户待审批的工单列表
    /// </summary>
    Task<List<WorkOrderApprovalDto>> GetPendingApprovalsAsync(
        Guid tenantId, Guid approverId, CancellationToken ct = default);
}

/// <summary>
/// 审批处理结果
/// </summary>
public class ApprovalResult
{
    /// <summary>
    /// 是否全部审批通过（工单可流转到 Accepted）
    /// </summary>
    public bool AllApproved { get; set; }

    /// <summary>
    /// 是否被驳回
    /// </summary>
    public bool Rejected { get; set; }

    /// <summary>
    /// 当前步骤顺序（1-based）
    /// </summary>
    public int CurrentStep { get; set; }

    /// <summary>
    /// 总步骤数
    /// </summary>
    public int TotalSteps { get; set; }

    /// <summary>
    /// 结果描述
    /// </summary>
    public string Message { get; set; } = string.Empty;
}
```

- [ ] **Step 3: 编写测试（先写测试，再实现）**

```csharp
// tests/EquipAI.Tests.Unit/Approvals/ApprovalChainServiceTests.cs
using EquipAI.Application.Approvals;
using EquipAI.Application.Approvals.DTOs;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace EquipAI.Tests.Unit.Approvals;

public class ApprovalChainServiceTests : IAsyncDisposable
{
    private readonly ServiceProvider _sp;
    private readonly Guid _tenantId = Guid.NewGuid();

    public ApprovalChainServiceTests()
    {
        var dbName = $"ApprovalTest_{Guid.NewGuid()}";
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(dbName));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(_tenantId));
        services.AddLogging();
        services.AddScoped<IApprovalChainService, ApprovalChainService>();
        _sp = services.BuildServiceProvider();
    }

    private async Task<(AppDbContext db, IApprovalChainService service)> GetServiceAsync()
    {
        var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var service = scope.ServiceProvider.GetRequiredService<IApprovalChainService>();
        return (db, service);
    }

    private async Task SeedWorkOrderAsync(AppDbContext db, WorkOrderStatus status = WorkOrderStatus.InProgress)
    {
        var deviceId = Guid.NewGuid();
        db.Devices.Add(new Device
        {
            Id = deviceId,
            TenantId = _tenantId,
            DeviceCode = "DEV-TEST",
            Name = "测试设备",
            Type = "电机"
        });

        var woId = Guid.NewGuid();
        db.WorkOrders.Add(new WorkOrder
        {
            Id = woId,
            TenantId = _tenantId,
            WorkOrderCode = "WO-20260602-0001",
            Title = "测试工单",
            Type = WorkOrderType.Corrective,
            Priority = WorkOrderPriority.Critical,
            Status = status,
            DeviceId = deviceId
        });

        await db.SaveChangesAsync();
        return;
    }

    [Fact]
    public async Task CreateTemplateAsync_应创建带步骤的审批链()
    {
        var (_, service) = await GetServiceAsync();

        var result = await service.CreateTemplateAsync(_tenantId, new CreateApprovalChainRequest
        {
            Name = "紧急审批链",
            WorkOrderType = "Corrective",
            WorkOrderPriority = "Critical",
            IsDefault = false,
            Enabled = true,
            Steps =
            [
                new() { StepOrder = 1, Role = "MaintenanceLead" },
                new() { StepOrder = 2, Role = "SystemAdmin" }
            ]
        });

        result.Name.Should().Be("紧急审批链");
        result.Steps.Should().HaveCount(2);
        result.Steps[0].StepOrder.Should().Be(1);
        result.Steps[1].StepOrder.Should().Be(2);
    }

    [Fact]
    public async Task CreateApprovalsForWorkOrderAsync_精确匹配应为工单创建审批记录()
    {
        var (db, service) = await GetServiceAsync();
        await SeedWorkOrderAsync(db);

        // 创建精确匹配模板
        await service.CreateTemplateAsync(_tenantId, new CreateApprovalChainRequest
        {
            Name = "纠正性紧急审批",
            WorkOrderType = "Corrective",
            WorkOrderPriority = "Critical",
            Steps =
            [
                new() { StepOrder = 1, Role = "MaintenanceLead" },
                new() { StepOrder = 2, Role = "SystemAdmin" }
            ]
        });

        var woId = db.WorkOrders.First().Id;
        var count = await service.CreateApprovalsForWorkOrderAsync(_tenantId, woId);

        count.Should().Be(2);

        var approvals = await service.GetWorkOrderApprovalsAsync(_tenantId, woId);
        approvals.Should().HaveCount(2);
        approvals[0].StepOrder.Should().Be(1);
        approvals[0].Action.Should().Be("Pending");
        approvals[1].StepOrder.Should().Be(2);
    }

    [Fact]
    public async Task CreateApprovalsForWorkOrderAsync_无匹配模板应返回0()
    {
        var (db, service) = await GetServiceAsync();
        await SeedWorkOrderAsync(db);

        // 不创建任何模板
        var woId = db.WorkOrders.First().Id;
        var count = await service.CreateApprovalsForWorkOrderAsync(_tenantId, woId);

        count.Should().Be(0);
    }

    [Fact]
    public async Task CreateApprovalsForWorkOrderAsync_应回退到类型默认链()
    {
        var (db, service) = await GetServiceAsync();
        await SeedWorkOrderAsync(db);

        // 只创建类型默认链（不匹配优先级）
        await service.CreateTemplateAsync(_tenantId, new CreateApprovalChainRequest
        {
            Name = "纠正性默认审批",
            WorkOrderType = "Corrective",
            WorkOrderPriority = null,
            IsDefault = true,
            Steps =
            [
                new() { StepOrder = 1, Role = "MaintenanceLead" }
            ]
        });

        var woId = db.WorkOrders.First().Id;
        var count = await service.CreateApprovalsForWorkOrderAsync(_tenantId, woId);

        count.Should().Be(1);
    }

    [Fact]
    public async Task CreateApprovalsForWorkOrderAsync_应回退到全局默认链()
    {
        var (db, service) = await GetServiceAsync();
        await SeedWorkOrderAsync(db);

        // 只创建全局默认链
        await service.CreateTemplateAsync(_tenantId, new CreateApprovalChainRequest
        {
            Name = "全局默认审批",
            WorkOrderType = null,
            WorkOrderPriority = null,
            IsDefault = true,
            Steps =
            [
                new() { StepOrder = 1, Role = "SystemAdmin" }
            ]
        });

        var woId = db.WorkOrders.First().Id;
        var count = await service.CreateApprovalsForWorkOrderAsync(_tenantId, woId);

        count.Should().Be(1);
    }

    [Fact]
    public async Task ProcessApprovalAsync_最后一步通过应返回AllApproved()
    {
        var (db, service) = await GetServiceAsync();
        await SeedWorkOrderAsync(db);
        var woId = db.WorkOrders.First().Id;

        // 单步审批链
        await service.CreateTemplateAsync(_tenantId, new CreateApprovalChainRequest
        {
            Name = "单步审批",
            WorkOrderType = "Corrective",
            WorkOrderPriority = "Critical",
            Steps = [new() { StepOrder = 1, Role = "MaintenanceLead" }]
        });

        await service.CreateApprovalsForWorkOrderAsync(_tenantId, woId);

        var approverId = Guid.NewGuid();
        var result = await service.ProcessApprovalAsync(_tenantId, woId, approverId, new ApprovalActionRequest
        {
            Action = "Approved",
            Comment = "同意"
        });

        result.AllApproved.Should().BeTrue();
        result.Rejected.Should().BeFalse();
        result.CurrentStep.Should().Be(1);
        result.TotalSteps.Should().Be(1);
    }

    [Fact]
    public async Task ProcessApprovalAsync_多步审批中间通过应返回AllApprovedFalse()
    {
        var (db, service) = await GetServiceAsync();
        await SeedWorkOrderAsync(db);
        var woId = db.WorkOrders.First().Id;

        // 两步审批链
        await service.CreateTemplateAsync(_tenantId, new CreateApprovalChainRequest
        {
            Name = "两步审批",
            WorkOrderType = "Corrective",
            WorkOrderPriority = "Critical",
            Steps =
            [
                new() { StepOrder = 1, Role = "MaintenanceLead" },
                new() { StepOrder = 2, Role = "SystemAdmin" }
            ]
        });

        await service.CreateApprovalsForWorkOrderAsync(_tenantId, woId);

        var approverId = Guid.NewGuid();
        var result = await service.ProcessApprovalAsync(_tenantId, woId, approverId, new ApprovalActionRequest
        {
            Action = "Approved",
            Comment = "第一步通过"
        });

        result.AllApproved.Should().BeFalse();
        result.CurrentStep.Should().Be(1);
        result.TotalSteps.Should().Be(2);

        // 第二步审批
        var approver2Id = Guid.NewGuid();
        var result2 = await service.ProcessApprovalAsync(_tenantId, woId, approver2Id, new ApprovalActionRequest
        {
            Action = "Approved",
            Comment = "第二步通过"
        });

        result2.AllApproved.Should().BeTrue();
    }

    [Fact]
    public async Task ProcessApprovalAsync_驳回应返回RejectedTrue()
    {
        var (db, service) = await GetServiceAsync();
        await SeedWorkOrderAsync(db);
        var woId = db.WorkOrders.First().Id;

        await service.CreateTemplateAsync(_tenantId, new CreateApprovalChainRequest
        {
            Name = "两步审批-驳回测试",
            WorkOrderType = "Corrective",
            WorkOrderPriority = "Critical",
            Steps =
            [
                new() { StepOrder = 1, Role = "MaintenanceLead" },
                new() { StepOrder = 2, Role = "SystemAdmin" }
            ]
        });

        await service.CreateApprovalsForWorkOrderAsync(_tenantId, woId);

        var approverId = Guid.NewGuid();
        var result = await service.ProcessApprovalAsync(_tenantId, woId, approverId, new ApprovalActionRequest
        {
            Action = "Rejected",
            Comment = "验收不通过，需返工"
        });

        result.AllApproved.Should().BeFalse();
        result.Rejected.Should().BeTrue();
    }

    [Fact]
    public async Task ProcessApprovalAsync_指定审批人应限制操作权限()
    {
        var (db, service) = await GetServiceAsync();
        await SeedWorkOrderAsync(db);
        var woId = db.WorkOrders.First().Id;
        var specificApproverId = Guid.NewGuid();

        await service.CreateTemplateAsync(_tenantId, new CreateApprovalChainRequest
        {
            Name = "指定审批人测试",
            WorkOrderType = "Corrective",
            WorkOrderPriority = "Critical",
            Steps =
            [
                new() { StepOrder = 1, Role = "MaintenanceLead", SpecificApproverId = specificApproverId }
            ]
        });

        await service.CreateApprovalsForWorkOrderAsync(_tenantId, woId);

        // 非指定审批人尝试审批应抛出异常
        var wrongApproverId = Guid.NewGuid();
        var act = () => service.ProcessApprovalAsync(_tenantId, woId, wrongApproverId, new ApprovalActionRequest
        {
            Action = "Approved"
        });

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task DeleteTemplateAsync_应级联删除步骤()
    {
        var (_, service) = await GetServiceAsync();

        var created = await service.CreateTemplateAsync(_tenantId, new CreateApprovalChainRequest
        {
            Name = "待删除审批链",
            Steps = [new() { StepOrder = 1, Role = "SystemAdmin" }]
        });

        await service.DeleteTemplateAsync(_tenantId, created.Id);

        var list = await service.ListTemplatesAsync(_tenantId, 1, 10);
        list.Items.Should().NotContain(t => t.Id == created.Id);
    }

    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }

    public async ValueTask DisposeAsync() => await _sp.DisposeAsync();
}
```

- [ ] **Step 4: 运行测试确认编译失败**

Run: `cd /Users/yqgmac/yqg/project/EquipSense && dotnet build EquipAI.slnx`

Expected: 编译失败（ApprovalChainService 不存在）

- [ ] **Step 5: 实现 ApprovalChainService**

```csharp
// src/EquipAI.Application/Approvals/ApprovalChainService.cs
using EquipAI.Application.Approvals.DTOs;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Approvals;

/// <summary>
/// 审批链服务实现
///
/// 核心职责：
/// 1. 审批链模板 CRUD（含步骤的增删改）
/// 2. 审批链匹配：精确匹配 → 类型默认 → 全局默认
/// 3. 为工单创建审批记录
/// 4. 多级审批通过/驳回逻辑
///
/// 设计要点：
/// - 使用 IServiceScopeFactory 获取 scoped AppDbContext，与 WorkOrderService 保持一致
/// - 审批操作前校验审批人权限（指定审批人 或 角色匹配）
/// - 逐步审批，每步通过后推进到下一步，最后一步通过后返回 AllApproved=true
/// </summary>
public class ApprovalChainService : IApprovalChainService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ApprovalChainService> _logger;

    public ApprovalChainService(
        IServiceScopeFactory scopeFactory,
        ILogger<ApprovalChainService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    // ===================================================================
    // 审批链模板 CRUD
    // ===================================================================

    /// <inheritdoc />
    public async Task<PagedResult<ApprovalChainTemplateDto>> ListTemplatesAsync(
        Guid tenantId, int page, int pageSize, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 使用 UnfilteredSet 并手动过滤租户，避免 InMemoryDatabase 全局过滤器问题
        var query = db.UnfilteredSet<ApprovalChainTemplate>()
            .Where(t => t.TenantId == tenantId)
            .OrderByDescending(t => t.CreatedAt);

        var total = await query.CountAsync(ct);
        var items = await query
            .Include(t => t.Steps.OrderBy(s => s.StepOrder))
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<ApprovalChainTemplateDto>
        {
            Items = items.Select(MapTemplateToDto).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    /// <inheritdoc />
    public async Task<ApprovalChainTemplateDto> GetTemplateByIdAsync(
        Guid tenantId, Guid id, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var template = await db.UnfilteredSet<ApprovalChainTemplate>()
            .Include(t => t.Steps.OrderBy(s => s.StepOrder))
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId, ct);

        if (template is null)
            throw new KeyNotFoundException($"审批链模板不存在: {id}");

        return MapTemplateToDto(template);
    }

    /// <inheritdoc />
    public async Task<ApprovalChainTemplateDto> CreateTemplateAsync(
        Guid tenantId, CreateApprovalChainRequest request, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var template = new ApprovalChainTemplate
        {
            TenantId = tenantId,
            WorkOrderType = ParseEnum<WorkOrderType>(request.WorkOrderType),
            WorkOrderPriority = ParseEnum<WorkOrderPriority>(request.WorkOrderPriority),
            Name = request.Name,
            IsDefault = request.IsDefault,
            Enabled = request.Enabled,
            Steps = request.Steps.Select(s => new ApprovalStep
            {
                StepOrder = s.StepOrder,
                Role = ParseEnum<UserRole>(s.Role) ?? UserRole.MaintenanceLead,
                SpecificApproverId = s.SpecificApproverId,
                IsRequired = s.IsRequired
            }).ToList()
        };

        db.ApprovalChainTemplates.Add(template);
        await db.SaveChangesAsync(ct);

        _logger.LogInformation("审批链模板已创建: {Name}（租户: {TenantId}）", request.Name, tenantId);

        return MapTemplateToDto(template);
    }

    /// <inheritdoc />
    public async Task<ApprovalChainTemplateDto> UpdateTemplateAsync(
        Guid tenantId, Guid id, UpdateApprovalChainRequest request, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var template = await db.UnfilteredSet<ApprovalChainTemplate>()
            .Include(t => t.Steps)
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId, ct);

        if (template is null)
            throw new KeyNotFoundException($"审批链模板不存在: {id}");

        if (request.Name is not null) template.Name = request.Name;
        if (request.IsDefault.HasValue) template.IsDefault = request.IsDefault.Value;
        if (request.Enabled.HasValue) template.Enabled = request.Enabled.Value;

        // 如果传入了新的步骤列表，整体替换
        if (request.Steps is not null)
        {
            db.ApprovalSteps.RemoveRange(template.Steps);
            template.Steps = request.Steps.Select(s => new ApprovalStep
            {
                StepOrder = s.StepOrder,
                Role = ParseEnum<UserRole>(s.Role) ?? UserRole.MaintenanceLead,
                SpecificApproverId = s.SpecificApproverId,
                IsRequired = s.IsRequired
            }).ToList();
        }

        await db.SaveChangesAsync(ct);

        _logger.LogInformation("审批链模板已更新: {Id}", id);

        return MapTemplateToDto(template);
    }

    /// <inheritdoc />
    public async Task DeleteTemplateAsync(Guid tenantId, Guid id, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var template = await db.UnfilteredSet<ApprovalChainTemplate>()
            .Include(t => t.Steps)
            .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId, ct);

        if (template is null)
            throw new KeyNotFoundException($"审批链模板不存在: {id}");

        db.ApprovalChainTemplates.Remove(template);
        await db.SaveChangesAsync(ct);

        _logger.LogInformation("审批链模板已删除: {Id}", id);
    }

    // ===================================================================
    // 工单审批
    // ===================================================================

    /// <inheritdoc />
    public async Task<int> CreateApprovalsForWorkOrderAsync(
        Guid tenantId, Guid workOrderId, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 查询工单信息，用于匹配审批链
        var workOrder = await db.UnfilteredSet<WorkOrder>()
            .Where(wo => wo.Id == workOrderId && wo.TenantId == tenantId)
            .Select(wo => new { wo.Id, wo.Type, wo.Priority })
            .FirstOrDefaultAsync(ct);

        if (workOrder is null)
            throw new KeyNotFoundException($"工单不存在: {workOrderId}");

        // 匹配审批链模板
        var template = await MatchTemplateAsync(db, tenantId, workOrder.Type, workOrder.Priority, ct);

        if (template is null)
        {
            _logger.LogInformation("工单 {WorkOrderId} 未匹配到审批链，跳过审批流程", workOrderId);
            return 0;
        }

        // 加载模板的审批步骤
        var steps = await db.ApprovalSteps
            .Where(s => s.ChainId == template.Id)
            .OrderBy(s => s.StepOrder)
            .ToListAsync(ct);

        if (steps.Count == 0)
        {
            _logger.LogWarning("审批链模板 {TemplateId} 没有审批步骤", template.Id);
            return 0;
        }

        // 为每个步骤创建审批记录
        var approvals = steps.Select(s => new WorkOrderApproval
        {
            TenantId = tenantId,
            WorkOrderId = workOrderId,
            StepOrder = s.StepOrder,
            ExpectedRole = s.Role,
            SpecificApproverId = s.SpecificApproverId,
            Action = ApprovalAction.Pending
        }).ToList();

        db.WorkOrderApprovals.AddRange(approvals);
        await db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "工单 {WorkOrderId} 已创建 {Count} 条审批记录（模板: {TemplateName}）",
            workOrderId, approvals.Count, template.Name);

        return approvals.Count;
    }

    /// <inheritdoc />
    public async Task<List<WorkOrderApprovalDto>> GetWorkOrderApprovalsAsync(
        Guid tenantId, Guid workOrderId, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var approvals = await db.UnfilteredSet<WorkOrderApproval>()
            .Where(a => a.WorkOrderId == workOrderId && a.TenantId == tenantId)
            .OrderBy(a => a.StepOrder)
            .ToListAsync(ct);

        return approvals.Select(MapApprovalToDto).ToList();
    }

    /// <inheritdoc />
    public async Task<ApprovalResult> ProcessApprovalAsync(
        Guid tenantId, Guid workOrderId, Guid approverId,
        ApprovalActionRequest request, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var action = ParseEnum<ApprovalAction>(request.Action)
            ?? throw new ArgumentException($"无效的审批动作: {request.Action}");

        if (action == ApprovalAction.Pending)
            throw new ArgumentException("审批动作不能为 Pending");

        // 获取当前待审批的步骤（按步骤顺序取第一个 Pending 的记录）
        var pendingApproval = await db.UnfilteredSet<WorkOrderApproval>()
            .Where(a => a.WorkOrderId == workOrderId
                && a.TenantId == tenantId
                && a.Action == ApprovalAction.Pending)
            .OrderBy(a => a.StepOrder)
            .FirstOrDefaultAsync(ct);

        if (pendingApproval is null)
            throw new InvalidOperationException($"工单 {workOrderId} 没有待审批的记录");

        // 校验审批人权限
        ValidateApprover(pendingApproval, approverId);

        // 获取总步骤数
        var totalSteps = await db.UnfilteredSet<WorkOrderApproval>()
            .CountAsync(a => a.WorkOrderId == workOrderId && a.TenantId == tenantId, ct);

        // 执行审批操作
        pendingApproval.ApproverId = approverId;
        pendingApproval.Action = action;
        pendingApproval.Comment = request.Comment;
        pendingApproval.ActedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        var result = new ApprovalResult
        {
            CurrentStep = pendingApproval.StepOrder,
            TotalSteps = totalSteps
        };

        if (action == ApprovalAction.Rejected)
        {
            result.Rejected = true;
            result.AllApproved = false;
            result.Message = $"第 {pendingApproval.StepOrder} 步审批已驳回";

            _logger.LogInformation(
                "工单 {WorkOrderId} 第 {Step} 步审批被驳回（审批人: {ApproverId}）",
                workOrderId, pendingApproval.StepOrder, approverId);
        }
        else
        {
            // 检查是否还有后续待审批步骤
            var hasMoreSteps = await db.UnfilteredSet<WorkOrderApproval>()
                .AnyAsync(a => a.WorkOrderId == workOrderId
                    && a.TenantId == tenantId
                    && a.Action == ApprovalAction.Pending, ct);

            result.AllApproved = !hasMoreSteps;
            result.Rejected = false;
            result.Message = hasMoreSteps
                ? $"第 {pendingApproval.StepOrder} 步审批通过，等待第 {pendingApproval.StepOrder + 1} 步审批"
                : "所有审批步骤已通过";

            _logger.LogInformation(
                "工单 {WorkOrderId} 第 {Step} 步审批通过（审批人: {ApproverId}，全部通过: {AllApproved}）",
                workOrderId, pendingApproval.StepOrder, approverId, result.AllApproved);
        }

        return result;
    }

    /// <inheritdoc />
    public async Task<List<WorkOrderApprovalDto>> GetPendingApprovalsAsync(
        Guid tenantId, Guid approverId, CancellationToken ct = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 查询指定审批人为当前用户的待审批记录
        var specificApprovals = await db.UnfilteredSet<WorkOrderApproval>()
            .Where(a => a.TenantId == tenantId
                && a.Action == ApprovalAction.Pending
                && a.SpecificApproverId == approverId)
            .OrderBy(a => a.StepOrder)
            .ToListAsync(ct);

        if (specificApprovals.Count > 0)
            return specificApprovals.Select(MapApprovalToDto).ToList();

        // 没有指定审批人的记录时，返回空列表
        // 实际角色匹配在 ProcessApprovalAsync 中按需校验
        return [];
    }

    // ===================================================================
    // 私有辅助方法
    // ===================================================================

    /// <summary>
    /// 匹配审批链模板
    /// 匹配优先级：精确匹配(Type+Priority) > 类型默认(Type+IsDefault) > 全局默认(null+IsDefault)
    /// </summary>
    private static async Task<ApprovalChainTemplate?> MatchTemplateAsync(
        AppDbContext db, Guid tenantId,
        WorkOrderType workOrderType, WorkOrderPriority workOrderPriority,
        CancellationToken ct)
    {
        // 1. 精确匹配 (Type + Priority)
        var exactMatch = await db.UnfilteredSet<ApprovalChainTemplate>()
            .Where(t => t.TenantId == tenantId
                && t.WorkOrderType == workOrderType
                && t.WorkOrderPriority == workOrderPriority
                && t.Enabled)
            .FirstOrDefaultAsync(ct);

        if (exactMatch is not null) return exactMatch;

        // 2. 类型默认链 (Type + IsDefault)
        var typeDefault = await db.UnfilteredSet<ApprovalChainTemplate>()
            .Where(t => t.TenantId == tenantId
                && t.WorkOrderType == workOrderType
                && t.WorkOrderPriority == null
                && t.IsDefault
                && t.Enabled)
            .FirstOrDefaultAsync(ct);

        if (typeDefault is not null) return typeDefault;

        // 3. 全局默认链 (null + IsDefault)
        var globalDefault = await db.UnfilteredSet<ApprovalChainTemplate>()
            .Where(t => t.TenantId == tenantId
                && t.WorkOrderType == null
                && t.IsDefault
                && t.Enabled)
            .FirstOrDefaultAsync(ct);

        return globalDefault;
    }

    /// <summary>
    /// 校验审批人权限
    /// 如果步骤指定了 SpecificApproverId，则只有该用户可审批
    /// </summary>
    private static void ValidateApprover(WorkOrderApproval approval, Guid approverId)
    {
        if (approval.SpecificApproverId.HasValue
            && approval.SpecificApproverId.Value != approverId)
        {
            throw new UnauthorizedAccessException(
                $"步骤 {approval.StepOrder} 指定了审批人 {approval.SpecificApproverId.Value}，当前用户 {approverId} 无权审批");
        }
    }

    /// <summary>
    /// 安全解析枚举，解析失败返回 null
    /// </summary>
    private static T? ParseEnum<T>(string? value) where T : struct, Enum
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return Enum.TryParse<T>(value, ignoreCase: true, out var result) ? result : null;
    }

    /// <summary>
    /// 审批链模板实体映射为 DTO
    /// </summary>
    private static ApprovalChainTemplateDto MapTemplateToDto(ApprovalChainTemplate template)
    {
        return new ApprovalChainTemplateDto
        {
            Id = template.Id,
            WorkOrderType = template.WorkOrderType?.ToString(),
            WorkOrderPriority = template.WorkOrderPriority?.ToString(),
            Name = template.Name,
            IsDefault = template.IsDefault,
            Enabled = template.Enabled,
            CreatedAt = template.CreatedAt,
            Steps = template.Steps.Select(s => new ApprovalStepDto
            {
                Id = s.Id,
                StepOrder = s.StepOrder,
                Role = s.Role.ToString(),
                SpecificApproverId = s.SpecificApproverId,
                IsRequired = s.IsRequired
            }).ToList()
        };
    }

    /// <summary>
    /// 工单审批记录实体映射为 DTO
    /// </summary>
    private static WorkOrderApprovalDto MapApprovalToDto(WorkOrderApproval approval)
    {
        return new WorkOrderApprovalDto
        {
            Id = approval.Id,
            WorkOrderId = approval.WorkOrderId,
            StepOrder = approval.StepOrder,
            ExpectedRole = approval.ExpectedRole.ToString(),
            SpecificApproverId = approval.SpecificApproverId,
            ApproverId = approval.ApproverId,
            Action = approval.Action.ToString(),
            Comment = approval.Comment,
            ActedAt = approval.ActedAt,
            CreatedAt = approval.CreatedAt
        };
    }
}
```

- [ ] **Step 6: 运行测试**

Run: `cd /Users/yqgmac/yqg/project/EquipSense && dotnet test tests/EquipAI.Tests.Unit --filter "ApprovalChainServiceTests" --verbosity normal`

Expected: 9/9 通过

- [ ] **Step 7: 提交**

```bash
git add src/EquipAI.Application/Approvals/ \
  tests/EquipAI.Tests.Unit/Approvals/
git commit -m "feat: 审批链服务 ApprovalChainService — 模板匹配 + 多级审批逻辑"
```

---

### Task 4: WorkOrdersController 增强 — submit + 多级审批 approve/reject

**Files:**
- Modify: `src/EquipAI.Application/WorkOrders/IWorkOrderService.cs` — 新增 SubmitAsync
- Modify: `src/EquipAI.Application/WorkOrders/WorkOrderService.cs` — 新增 SubmitAsync + 修改状态流转 + 增强 AcceptAsync/RejectAsync
- Modify: `src/EquipAI.Application/WorkOrders/DTOs/WorkOrderDto.cs` — 新增审批相关字段
- Modify: `src/EquipAI.WebAPI/Controllers/WorkOrdersController.cs` — 新增 submit + 增强 approve/reject
- Modify: `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs` — 注册 ApprovalChainService

- [ ] **Step 1: 增强 WorkOrderDto**

```csharp
// src/EquipAI.Application/WorkOrders/DTOs/WorkOrderDto.cs
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

    /// <summary>
    /// 是否有审批链（工单处于审批流程中）
    /// </summary>
    public bool HasApprovalChain { get; set; }

    /// <summary>
    /// 当前审批步骤（1-based，0 表示无审批链或已完成审批）
    /// </summary>
    public int CurrentApprovalStep { get; set; }

    /// <summary>
    /// 审批总步骤数
    /// </summary>
    public int TotalApprovalSteps { get; set; }
}
```

- [ ] **Step 2: 更新 IWorkOrderService 接口**

在 `src/EquipAI.Application/WorkOrders/IWorkOrderService.cs` 中新增方法：

```csharp
// 在 IWorkOrderService 接口中新增方法（添加到 CloseAsync 之后）

/// <summary>
/// 提交验收：工单从 Completed 状态提交到审批流程
/// 如果匹配到审批链，状态变为 SubmittedForApproval；
/// 如果没有审批链，状态直接变为 Accepted（跳过审批）
/// </summary>
Task<WorkOrderDto> SubmitAsync(
    Guid tenantId, Guid id, Guid userId, string? note = null, CancellationToken ct = default);
```

- [ ] **Step 3: 更新 WorkOrderService 状态流转映射**

在 `src/EquipAI.Application/WorkOrders/WorkOrderService.cs` 中：

1. 修改 `_validTransitions` 字典以支持新增的 `SubmittedForApproval` 状态
2. 注入 `IApprovalChainService`
3. 新增 `SubmitAsync` 方法
4. 增强 `AcceptAsync` 和 `RejectAsync` 方法

修改 `_validTransitions`：

```csharp
/// <summary>
/// 合法的状态流转映射表
/// Key: 当前状态, Value: 允许转换到的状态集合
/// </summary>
private static readonly Dictionary<WorkOrderStatus, HashSet<WorkOrderStatus>> _validTransitions = new()
{
    [WorkOrderStatus.PendingDispatch] = [WorkOrderStatus.Assigned, WorkOrderStatus.Cancelled],
    [WorkOrderStatus.Assigned] = [WorkOrderStatus.InProgress, WorkOrderStatus.Cancelled],
    [WorkOrderStatus.InProgress] = [WorkOrderStatus.Completed, WorkOrderStatus.Cancelled],
    [WorkOrderStatus.Completed] = [WorkOrderStatus.SubmittedForApproval, WorkOrderStatus.Accepted, WorkOrderStatus.Cancelled],
    [WorkOrderStatus.SubmittedForApproval] = [WorkOrderStatus.Accepted, WorkOrderStatus.Rejected, WorkOrderStatus.Cancelled],
    [WorkOrderStatus.Accepted] = [WorkOrderStatus.Closed],
    [WorkOrderStatus.Rejected] = [WorkOrderStatus.InProgress],
    // Closed 和 Cancelled 为终态，不允许再变更
};
```

修改构造函数，注入 `IApprovalChainService`：

```csharp
public class WorkOrderService : IWorkOrderService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IEventBus _eventBus;
    private readonly IMapper _mapper;
    private readonly ILogger<WorkOrderService> _logger;
    private readonly IApprovalChainService _approvalChainService;

    // ... _validTransitions 不变 ...

    public WorkOrderService(
        IServiceScopeFactory scopeFactory,
        IEventBus eventBus,
        IMapper mapper,
        ILogger<WorkOrderService> logger,
        IApprovalChainService approvalChainService)
    {
        _scopeFactory = scopeFactory;
        _eventBus = eventBus;
        _mapper = mapper;
        _logger = logger;
        _approvalChainService = approvalChainService;
    }

    // ... 现有方法不变，新增 SubmitAsync ...
```

新增 `SubmitAsync` 方法（放在 `CancelAsync` 方法之后、辅助方法区域之前）：

```csharp
/// <inheritdoc />
public async Task<WorkOrderDto> SubmitAsync(
    Guid tenantId, Guid id, Guid userId, string? note = null, CancellationToken ct = default)
{
    using var scope = _scopeFactory.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    var workOrder = await dbContext.WorkOrders.FirstOrDefaultAsync(wo => wo.Id == id, ct);
    if (workOrder == null)
        throw new KeyNotFoundException($"工单不存在: {id}");

    var oldStatus = workOrder.Status;

    // 尝试为工单创建审批记录
    var approvalCount = await _approvalChainService.CreateApprovalsForWorkOrderAsync(tenantId, id, ct);

    if (approvalCount > 0)
    {
        // 有审批链：流转到 SubmittedForApproval
        TransitionStatus(workOrder, WorkOrderStatus.SubmittedForApproval);

        await WriteLogAsync(dbContext, workOrder.Id, WorkOrderLogAction.Submitted,
            oldStatus.ToString(), WorkOrderStatus.SubmittedForApproval.ToString(),
            userId, note ?? "已提交验收，等待审批", ct);

        _logger.LogInformation(
            "工单 {WorkOrderCode} 已提交验收，进入审批流程（共 {Count} 步）",
            workOrder.WorkOrderCode, approvalCount);
    }
    else
    {
        // 无审批链：直接流转到 Accepted（跳过审批）
        TransitionStatus(workOrder, WorkOrderStatus.Accepted);

        await WriteLogAsync(dbContext, workOrder.Id, WorkOrderLogAction.StatusChanged,
            oldStatus.ToString(), WorkOrderStatus.Accepted.ToString(),
            userId, note ?? "已提交验收（无审批链，直接通过）", ct);

        _logger.LogInformation(
            "工单 {WorkOrderCode} 已提交验收，无审批链直接通过",
            workOrder.WorkOrderCode);
    }

    await dbContext.SaveChangesAsync(ct);
    await PublishStatusChangedEvent(tenantId, workOrder.Id, oldStatus, workOrder.Status, userId, ct);

    return MapToDto(workOrder);
}
```

更新 `MapToDto` 方法以包含审批信息：

```csharp
/// <summary>
/// 手动映射 WorkOrder 实体为 WorkOrderDto
/// </summary>
private static WorkOrderDto MapToDto(WorkOrder workOrder)
{
    return new WorkOrderDto
    {
        Id = workOrder.Id,
        WorkOrderCode = workOrder.WorkOrderCode,
        Title = workOrder.Title,
        Type = workOrder.Type.ToString(),
        Status = workOrder.Status.ToString(),
        Priority = workOrder.Priority.ToString(),
        DeviceId = workOrder.DeviceId,
        AlertId = workOrder.AlertId,
        AnalysisId = workOrder.AnalysisId,
        RootCause = workOrder.RootCause,
        Resolution = workOrder.Resolution,
        AssignedTo = workOrder.AssignedTo,
        DueDate = workOrder.DueDate,
        CompletedAt = workOrder.CompletedAt,
        CreatedAt = workOrder.CreatedAt,
        // 审批信息由 Controller 层通过 ApprovalChainService 补充
        HasApprovalChain = false,
        CurrentApprovalStep = 0,
        TotalApprovalSteps = 0
    };
}
```

- [ ] **Step 4: 更新 WorkOrdersController**

在 `src/EquipAI.WebAPI/Controllers/WorkOrdersController.cs` 中：

1. 注入 `IApprovalChainService`
2. 新增 `SubmitWorkOrder` 端点
3. 增强 `AcceptWorkOrder` 和 `RejectWorkOrder` 以处理审批流程

修改后的完整 Controller：

```csharp
// src/EquipAI.WebAPI/Controllers/WorkOrdersController.cs
using EquipAI.Application.Approvals;
using EquipAI.Application.Approvals.DTOs;
using EquipAI.Application.DTOs.Common;
using EquipAI.Application.WorkOrders;
using EquipAI.Application.WorkOrders.DTOs;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 工单管理控制器
/// 提供工单的完整生命周期管理：创建、派工、执行、验收和关闭
/// 支持多级审批链机制：提交验收后可进入多级审批流程
/// </summary>
[ApiController]
[Route("api/v1/work-orders")]
[Authorize]
public class WorkOrdersController : ControllerBase
{
    private readonly IWorkOrderService _workOrderService;
    private readonly IApprovalChainService _approvalChainService;
    private readonly ITenantContext _tenantContext;

    public WorkOrdersController(
        IWorkOrderService workOrderService,
        IApprovalChainService approvalChainService,
        ITenantContext tenantContext)
    {
        _workOrderService = workOrderService;
        _approvalChainService = approvalChainService;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 分页查询工单列表，支持按状态和设备 ID 筛选
    /// </summary>
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

    /// <summary>
    /// 根据 ID 获取工单详情（含审批进度信息）
    /// </summary>
    [HttpGet("{id:guid}")]
    [RequirePermission("workorder:read")]
    [ProducesResponseType(typeof(WorkOrderDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkOrderDetailResponse>> GetWorkOrder(Guid id)
    {
        var wo = await _workOrderService.GetByIdAsync(_tenantContext.TenantId, id);
        if (wo == null)
            return NotFound(new { code = 404, message = "工单不存在" });

        // 查询审批记录，补充审批进度信息
        var approvals = await _approvalChainService.GetWorkOrderApprovalsAsync(
            _tenantContext.TenantId, id);

        var response = new WorkOrderDetailResponse
        {
            WorkOrder = wo,
            Approvals = approvals
        };

        return Ok(response);
    }

    /// <summary>
    /// 手动创建工单
    /// </summary>
    [HttpPost]
    [RequirePermission("workorder:create")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<WorkOrderDto>> CreateWorkOrder([FromBody] CreateWorkOrderRequest request)
    {
        var wo = await _workOrderService.CreateAsync(_tenantContext.TenantId, request, _tenantContext.UserId);
        return CreatedAtAction(nameof(GetWorkOrder), new { id = wo.Id }, wo);
    }

    /// <summary>
    /// 派工：将工单指派给指定技术人员
    /// </summary>
    [HttpPut("{id:guid}/assign")]
    [RequirePermission("workorder:dispatch")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkOrderDto>> AssignWorkOrder(Guid id, [FromBody] AssignWorkOrderRequest request)
    {
        return Ok(await _workOrderService.AssignAsync(_tenantContext.TenantId, id, request, _tenantContext.UserId));
    }

    /// <summary>
    /// 开始执行工单
    /// </summary>
    [HttpPut("{id:guid}/start")]
    [RequirePermission("workorder:execute")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkOrderDto>> StartWorkOrder(Guid id)
    {
        return Ok(await _workOrderService.StartAsync(_tenantContext.TenantId, id, _tenantContext.UserId));
    }

    /// <summary>
    /// 完成工单：提交处理结果
    /// </summary>
    [HttpPut("{id:guid}/complete")]
    [RequirePermission("workorder:execute")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkOrderDto>> CompleteWorkOrder(Guid id, [FromBody] CompleteWorkOrderRequest request)
    {
        return Ok(await _workOrderService.CompleteAsync(_tenantContext.TenantId, id, request, _tenantContext.UserId));
    }

    /// <summary>
    /// 提交验收：将已完成的工单提交到审批流程
    /// 如果匹配到审批链，进入多级审批；否则直接通过验收
    /// </summary>
    [HttpPut("{id:guid}/submit")]
    [RequirePermission("workorder:execute")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkOrderDto>> SubmitWorkOrder(Guid id, [FromBody] NoteRequest? note = null)
    {
        return Ok(await _workOrderService.SubmitAsync(
            _tenantContext.TenantId, id, _tenantContext.UserId, note?.Note));
    }

    /// <summary>
    /// 审批通过：对处于 SubmittedForApproval 状态的工单执行审批
    /// 如果是最后一步审批通过，工单自动流转到 Accepted
    /// </summary>
    [HttpPut("{id:guid}/approve")]
    [RequirePermission("workorder:accept")]
    [ProducesResponseType(typeof(ApproveWorkOrderResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApproveWorkOrderResponse>> ApproveWorkOrder(
        Guid id, [FromBody] ApprovalActionRequest request)
    {
        request.Action = "Approved";

        var approvalResult = await _approvalChainService.ProcessApprovalAsync(
            _tenantContext.TenantId, id, _tenantContext.UserId, request);

        if (approvalResult.AllApproved)
        {
            // 所有审批通过，流转工单到 Accepted
            await _workOrderService.AcceptAsync(
                _tenantContext.TenantId, id, _tenantContext.UserId,
                $"审批链全部通过（共 {approvalResult.TotalSteps} 步）");
        }

        return Ok(new ApproveWorkOrderResponse
        {
            WorkOrderId = id,
            ApprovalResult = approvalResult
        });
    }

    /// <summary>
    /// 审批驳回：驳回当前审批步骤，工单流转到 Rejected 状态
    /// </summary>
    [HttpPut("{id:guid}/reject")]
    [RequirePermission("workorder:accept")]
    [ProducesResponseType(typeof(ApproveWorkOrderResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApproveWorkOrderResponse>> RejectWorkOrder(
        Guid id, [FromBody] ApprovalActionRequest request)
    {
        request.Action = "Rejected";

        var approvalResult = await _approvalChainService.ProcessApprovalAsync(
            _tenantContext.TenantId, id, _tenantContext.UserId, request);

        if (approvalResult.Rejected)
        {
            // 审批驳回，流转工单到 Rejected
            await _workOrderService.RejectAsync(
                _tenantContext.TenantId, id, _tenantContext.UserId,
                request.Comment ?? "审批驳回，返工");
        }

        return Ok(new ApproveWorkOrderResponse
        {
            WorkOrderId = id,
            ApprovalResult = approvalResult
        });
    }

    /// <summary>
    /// 关闭工单
    /// </summary>
    [HttpPut("{id:guid}/close")]
    [RequirePermission("workorder:close")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkOrderDto>> CloseWorkOrder(Guid id, [FromBody] NoteRequest? note = null)
    {
        return Ok(await _workOrderService.CloseAsync(_tenantContext.TenantId, id, _tenantContext.UserId, note?.Note));
    }

    /// <summary>
    /// 取消工单
    /// </summary>
    [HttpPut("{id:guid}/cancel")]
    [RequirePermission("workorder:cancel")]
    [ProducesResponseType(typeof(WorkOrderDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkOrderDto>> CancelWorkOrder(Guid id, [FromBody] NoteRequest? note = null)
    {
        return Ok(await _workOrderService.CancelAsync(_tenantContext.TenantId, id, _tenantContext.UserId, note?.Note));
    }

    /// <summary>
    /// 获取工单的审批记录列表
    /// </summary>
    [HttpGet("{id:guid}/approvals")]
    [RequirePermission("workorder:read")]
    [ProducesResponseType(typeof(List<WorkOrderApprovalDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<WorkOrderApprovalDto>>> GetWorkOrderApprovals(Guid id)
    {
        var approvals = await _approvalChainService.GetWorkOrderApprovalsAsync(
            _tenantContext.TenantId, id);
        return Ok(approvals);
    }
}

/// <summary>
/// 工单详情响应（含审批进度）
/// </summary>
public class WorkOrderDetailResponse
{
    /// <summary>
    /// 工单基本信息
    /// </summary>
    public WorkOrderDto WorkOrder { get; set; } = null!;

    /// <summary>
    /// 审批记录列表
    /// </summary>
    public List<WorkOrderApprovalDto> Approvals { get; set; } = [];
}

/// <summary>
/// 审批工单响应
/// </summary>
public class ApproveWorkOrderResponse
{
    /// <summary>
    /// 工单 ID
    /// </summary>
    public Guid WorkOrderId { get; set; }

    /// <summary>
    /// 审批处理结果
    /// </summary>
    public ApprovalResult ApprovalResult { get; set; } = null!;
}

/// <summary>
/// 通用备注请求，用于验收、关闭、取消等操作
/// </summary>
public class NoteRequest
{
    /// <summary>
    /// 备注内容
    /// </summary>
    public string? Note { get; set; }
}
```

注意：删除旧的 `NoteRequest` 类（已移到新 Controller 文件中）。旧的 `AcceptWorkOrder` 和 `RejectWorkOrder` 端点已被 `approve` 和 `reject` 替代，但保留了原有的 accept 端点用于向后兼容（直接验收，不需要审批链）。

- [ ] **Step 5: 注册 ApprovalChainService 到 DI**

在 `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs` 的 `AddApplication` 方法中添加：

```csharp
// 审批链服务（Scoped — 需要 DbContext）
services.AddScoped<IApprovalChainService, ApprovalChainService>();
```

同时添加 `using EquipAI.Application.Approvals;`。

- [ ] **Step 6: 编译确认**

Run: `cd /Users/yqgmac/yqg/project/EquipSense && dotnet build EquipAI.slnx`

Expected: 编译成功

- [ ] **Step 7: 提交**

```bash
git add src/EquipAI.Application/WorkOrders/IWorkOrderService.cs \
  src/EquipAI.Application/WorkOrders/WorkOrderService.cs \
  src/EquipAI.Application/WorkOrders/DTOs/WorkOrderDto.cs \
  src/EquipAI.WebAPI/Controllers/WorkOrdersController.cs \
  src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs
git commit -m "feat: 工单提交验收 + 多级审批 — submit/approve/reject 端点"
```

---

### Task 5: ApprovalChainsController — 审批链 CRUD API

**Files:**
- Create: `src/EquipAI.WebAPI/Controllers/ApprovalChainsController.cs`

- [ ] **Step 1: 创建 ApprovalChainsController**

```csharp
// src/EquipAI.WebAPI/Controllers/ApprovalChainsController.cs
using EquipAI.Application.Approvals;
using EquipAI.Application.Approvals.DTOs;
using EquipAI.Core.Models;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 审批链管理控制器
/// 提供审批链模板的 CRUD 操作，支持管理员配置多级审批流程
/// </summary>
[ApiController]
[Route("api/v1/approval-chains")]
[Authorize]
public class ApprovalChainsController : ControllerBase
{
    private readonly IApprovalChainService _approvalChainService;
    private readonly ITenantContext _tenantContext;

    public ApprovalChainsController(
        IApprovalChainService approvalChainService,
        ITenantContext tenantContext)
    {
        _approvalChainService = approvalChainService;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 分页查询审批链模板列表
    /// </summary>
    [HttpGet]
    [RequirePermission("workorder:read")]
    [ProducesResponseType(typeof(PagedResult<ApprovalChainTemplateDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<ApprovalChainTemplateDto>>> GetApprovalChains(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _approvalChainService.ListTemplatesAsync(
            _tenantContext.TenantId, page, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// 获取审批链模板详情
    /// </summary>
    [HttpGet("{id:guid}")]
    [RequirePermission("workorder:read")]
    [ProducesResponseType(typeof(ApprovalChainTemplateDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApprovalChainTemplateDto>> GetApprovalChain(Guid id)
    {
        var template = await _approvalChainService.GetTemplateByIdAsync(
            _tenantContext.TenantId, id);
        if (template == null)
            return NotFound(new { code = 404, message = "审批链模板不存在" });

        return Ok(template);
    }

    /// <summary>
    /// 创建审批链模板
    /// </summary>
    [HttpPost]
    [RequirePermission("workorder:create")]
    [ProducesResponseType(typeof(ApprovalChainTemplateDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApprovalChainTemplateDto>> CreateApprovalChain(
        [FromBody] CreateApprovalChainRequest request)
    {
        var template = await _approvalChainService.CreateTemplateAsync(
            _tenantContext.TenantId, request);
        return CreatedAtAction(nameof(GetApprovalChain), new { id = template.Id }, template);
    }

    /// <summary>
    /// 更新审批链模板
    /// </summary>
    [HttpPut("{id:guid}")]
    [RequirePermission("workorder:create")]
    [ProducesResponseType(typeof(ApprovalChainTemplateDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApprovalChainTemplateDto>> UpdateApprovalChain(
        Guid id, [FromBody] UpdateApprovalChainRequest request)
    {
        var template = await _approvalChainService.UpdateTemplateAsync(
            _tenantContext.TenantId, id, request);
        return Ok(template);
    }

    /// <summary>
    /// 删除审批链模板
    /// </summary>
    [HttpDelete("{id:guid}")]
    [RequirePermission("workorder:create")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteApprovalChain(Guid id)
    {
        await _approvalChainService.DeleteTemplateAsync(_tenantContext.TenantId, id);
        return NoContent();
    }

    /// <summary>
    /// 获取当前用户待审批的工单列表
    /// </summary>
    [HttpGet("pending")]
    [RequirePermission("workorder:read")]
    [ProducesResponseType(typeof(List<WorkOrderApprovalDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<WorkOrderApprovalDto>>> GetPendingApprovals()
    {
        var approvals = await _approvalChainService.GetPendingApprovalsAsync(
            _tenantContext.TenantId, _tenantContext.UserId);
        return Ok(approvals);
    }
}
```

- [ ] **Step 2: 编译确认**

Run: `cd /Users/yqgmac/yqg/project/EquipSense && dotnet build EquipAI.slnx`

Expected: 编译成功

- [ ] **Step 3: 运行全部后端测试**

Run: `cd /Users/yqgmac/yqg/project/EquipSense && dotnet test tests/EquipAI.Tests.Unit --verbosity normal`

Expected: 所有测试通过（包括新增的 ApprovalChainServiceTests）

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.WebAPI/Controllers/ApprovalChainsController.cs
git commit -m "feat: 审批链 CRUD API — ApprovalChainsController"
```

---

### Task 6: 前端 — 审批进度面板 + 审批链配置 Tab + hooks

**Files:**
- Create: `frontend/src/hooks/useApprovals.ts`
- Create: `frontend/src/components/workorder/ApprovalProgressPanel.tsx`
- Modify: `frontend/src/types/index.ts` — 新增审批相关类型
- Modify: `frontend/src/pages/WorkOrderDetailPage.tsx` — 集成审批进度面板 + 新增提交验收按钮
- Modify: `frontend/src/pages/SettingsPage.tsx` — 新增审批链配置 Tab

- [ ] **Step 1: 在 types/index.ts 中新增审批相关类型**

在 `frontend/src/types/index.ts` 文件末尾添加：

```typescript
// ============================================================================
// 审批链管理
// ============================================================================

/** 审批动作 */
export type ApprovalAction = 'Pending' | 'Approved' | 'Rejected';

/** 审批步骤配置 */
export interface ApprovalStepConfig {
  /** 步骤 ID */
  id: string;
  /** 步骤顺序 */
  stepOrder: number;
  /** 审批角色 */
  role: string;
  /** 指定审批人 ID */
  specificApproverId?: string;
  /** 是否必须 */
  isRequired: boolean;
}

/** 审批链模板 */
export interface ApprovalChainTemplate {
  /** 模板 ID */
  id: string;
  /** 适用的工单类型（null 表示不限） */
  workOrderType?: string;
  /** 适用的工单优先级（null 表示不限） */
  workOrderPriority?: string;
  /** 审批链名称 */
  name: string;
  /** 是否为默认模板 */
  isDefault: boolean;
  /** 是否启用 */
  enabled: boolean;
  /** 创建时间 */
  createdAt: string;
  /** 审批步骤列表 */
  steps: ApprovalStepConfig[];
}

/** 创建审批链请求 */
export interface CreateApprovalChainRequest {
  /** 适用的工单类型 */
  workOrderType?: string;
  /** 适用的工单优先级 */
  workOrderPriority?: string;
  /** 审批链名称 */
  name: string;
  /** 是否为默认模板 */
  isDefault: boolean;
  /** 是否启用 */
  enabled?: boolean;
  /** 审批步骤列表 */
  steps: CreateApprovalStepRequest[];
}

/** 创建审批步骤请求 */
export interface CreateApprovalStepRequest {
  /** 步骤顺序 */
  stepOrder: number;
  /** 审批角色 */
  role: string;
  /** 指定审批人 ID */
  specificApproverId?: string;
  /** 是否必须 */
  isRequired?: boolean;
}

/** 更新审批链请求 */
export interface UpdateApprovalChainRequest {
  /** 审批链名称 */
  name?: string;
  /** 是否为默认模板 */
  isDefault?: boolean;
  /** 是否启用 */
  enabled?: boolean;
  /** 审批步骤列表（传入则整体替换） */
  steps?: CreateApprovalStepRequest[];
}

/** 工单审批记录 */
export interface WorkOrderApproval {
  /** 审批记录 ID */
  id: string;
  /** 工单 ID */
  workOrderId: string;
  /** 步骤顺序 */
  stepOrder: number;
  /** 期望审批角色 */
  expectedRole: string;
  /** 指定审批人 ID */
  specificApproverId?: string;
  /** 实际审批人 ID */
  approverId?: string;
  /** 审批动作 */
  action: ApprovalAction;
  /** 审批意见 */
  comment?: string;
  /** 审批操作时间 */
  actedAt?: string;
  /** 创建时间 */
  createdAt: string;
}

/** 工单详情响应（含审批进度） */
export interface WorkOrderDetailResponse {
  /** 工单基本信息 */
  workOrder: WorkOrder;
  /** 审批记录列表 */
  approvals: WorkOrderApproval[];
}

/** 审批操作请求 */
export interface ApprovalActionRequest {
  /** 审批动作 */
  action: 'Approved' | 'Rejected';
  /** 审批意见 */
  comment?: string;
}
```

- [ ] **Step 2: 创建 useApprovals hooks**

```typescript
// frontend/src/hooks/useApprovals.ts
/**
 * 审批链管理 TanStack Query Hooks
 *
 * 提供审批链模板的 CRUD 操作、工单审批记录查询和审批操作。
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type {
  ApprovalChainTemplate,
  CreateApprovalChainRequest,
  UpdateApprovalChainRequest,
  WorkOrderApproval,
  WorkOrderDetailResponse,
  ApprovalActionRequest,
  PagedResult,
} from '../types';

// ========== 审批链模板 CRUD ==========

/**
 * 获取审批链模板列表
 */
export function useApprovalChains(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['approval-chains', page, pageSize],
    queryFn: async () => {
      const { data } = await api.get<PagedResult<ApprovalChainTemplate>>(
        `/approval-chains?page=${page}&pageSize=${pageSize}`
      );
      return data;
    },
  });
}

/**
 * 获取审批链模板详情
 */
export function useApprovalChain(id: string) {
  return useQuery({
    queryKey: ['approval-chains', id],
    queryFn: async () => {
      const { data } = await api.get<ApprovalChainTemplate>(`/approval-chains/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

/**
 * 创建审批链模板
 */
export function useCreateApprovalChain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: CreateApprovalChainRequest) => {
      const { data } = await api.post<ApprovalChainTemplate>('/approval-chains', req);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-chains'] });
    },
  });
}

/**
 * 更新审批链模板
 */
export function useUpdateApprovalChain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...req }: UpdateApprovalChainRequest & { id: string }) => {
      const { data } = await api.put<ApprovalChainTemplate>(`/approval-chains/${id}`, req);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['approval-chains'] });
      queryClient.invalidateQueries({ queryKey: ['approval-chains', variables.id] });
    },
  });
}

/**
 * 删除审批链模板
 */
export function useDeleteApprovalChain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/approval-chains/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-chains'] });
    },
  });
}

// ========== 工单审批 ==========

/**
 * 获取工单详情（含审批进度）
 * 替代原来的 useWorkOrder，增加审批记录信息
 */
export function useWorkOrderDetail(id: string) {
  return useQuery({
    queryKey: ['work-orders', id, 'detail'],
    queryFn: async () => {
      const { data } = await api.get<WorkOrderDetailResponse>(`/work-orders/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

/**
 * 获取工单审批记录列表
 */
export function useWorkOrderApprovals(workOrderId: string) {
  return useQuery({
    queryKey: ['work-orders', workOrderId, 'approvals'],
    queryFn: async () => {
      const { data } = await api.get<WorkOrderApproval[]>(
        `/work-orders/${workOrderId}/approvals`
      );
      return data;
    },
    enabled: !!workOrderId,
  });
}

/**
 * 提交验收（将已完成的工单提交到审批流程）
 */
export function useSubmitWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      const { data } = await api.put(`/work-orders/${id}/submit`, { note });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.id, 'detail'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.id, 'approvals'] });
    },
  });
}

/**
 * 审批通过
 */
export function useApproveWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      const { data } = await api.put(`/work-orders/${id}/approve`, {
        action: 'Approved',
        comment,
      } as ApprovalActionRequest);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.id, 'detail'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.id, 'approvals'] });
    },
  });
}

/**
 * 审批驳回
 */
export function useRejectWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      const { data } = await api.put(`/work-orders/${id}/reject`, {
        action: 'Rejected',
        comment,
      } as ApprovalActionRequest);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.id, 'detail'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.id, 'approvals'] });
    },
  });
}

/**
 * 获取当前用户待审批列表
 */
export function usePendingApprovals() {
  return useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async () => {
      const { data } = await api.get<WorkOrderApproval[]>('/approval-chains/pending');
      return data;
    },
  });
}
```

- [ ] **Step 3: 创建审批进度面板组件**

```tsx
// frontend/src/components/workorder/ApprovalProgressPanel.tsx
/**
 * 审批进度面板组件
 *
 * 展示工单的多级审批流程进度，包括每步的审批状态、审批人和审批意见。
 * 支持在当前步骤执行审批操作（通过/驳回）。
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Circle, XCircle, Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { useApproveWorkOrder, useRejectWorkOrder } from '../../hooks/useApprovals';
import type { WorkOrderApproval } from '../../types';

/** 审批进度面板属性 */
interface ApprovalProgressPanelProps {
  /** 工单 ID */
  workOrderId: string;
  /** 工单当前状态 */
  workOrderStatus: string;
  /** 审批记录列表 */
  approvals: WorkOrderApproval[];
}

/** 角色中文标签映射 */
const roleLabels: Record<string, string> = {
  SystemAdmin: '系统管理员',
  MaintenanceLead: '维保主管',
  Technician: '维保技师',
  Operator: '操作员',
  Viewer: '查看者',
};

/**
 * 审批进度面板
 *
 * 以时间线形式展示审批链各步骤的状态：
 * - 已通过：绿色对勾 + 审批人和意见
 * - 已驳回：红色叉 + 驳回原因
 * - 待审批：灰色圆圈 + 等待中
 */
export function ApprovalProgressPanel({
  workOrderId,
  workOrderStatus,
  approvals,
}: ApprovalProgressPanelProps) {
  const { t } = useTranslation();
  const approveMutation = useApproveWorkOrder();
  const rejectMutation = useRejectWorkOrder();
  const [rejectComment, setRejectComment] = useState('');
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);

  // 工单不在审批状态时不显示面板
  if (!approvals || approvals.length === 0) {
    if (workOrderStatus === 'SubmittedForApproval') {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('approval.title', '审批进度')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t('approval.loading', '正在加载审批信息...')}</p>
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  /** 判断指定步骤是否可以操作 */
  const canActOnStep = (approval: WorkOrderApproval): boolean => {
    if (workOrderStatus !== 'SubmittedForApproval') return false;
    if (approval.action !== 'Pending') return false;

    // 只有当前步骤（第一个 Pending 的步骤）可以操作
    const firstPendingStep = approvals.find(a => a.action === 'Pending');
    return firstPendingStep?.id === approval.id;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t('approval.title', '审批进度')}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({approvals.filter(a => a.action === 'Approved').length}/{approvals.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {approvals.map((approval, idx) => (
            <div key={approval.id} className="relative flex gap-3 pb-4 last:pb-0">
              {/* 连接线 */}
              {idx < approvals.length - 1 && (
                <div className="absolute left-[11px] top-6 h-full w-px bg-border" />
              )}

              {/* 状态图标 */}
              <div className="relative z-10 mt-0.5 shrink-0">
                {approval.action === 'Approved' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : approval.action === 'Rejected' ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              {/* 步骤内容 */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {t('approval.step', '第 {{order}} 步', { order: approval.stepOrder })}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {roleLabels[approval.expectedRole] ?? approval.expectedRole}
                  </Badge>
                  {approval.action === 'Pending' && (
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="mr-1 h-3 w-3" />
                      {t('approval.pending', '待审批')}
                    </Badge>
                  )}
                  {approval.action === 'Approved' && (
                    <Badge variant="outline" className="border-green-500/30 text-xs text-green-500">
                      {t('approval.approved', '已通过')}
                    </Badge>
                  )}
                  {approval.action === 'Rejected' && (
                    <Badge variant="destructive" className="text-xs">
                      {t('approval.rejected', '已驳回')}
                    </Badge>
                  )}
                </div>

                {/* 审批人信息 */}
                {approval.approverId && (
                  <p className="text-xs text-muted-foreground">
                    {t('approval.approver', '审批人')}: {approval.approverId}
                  </p>
                )}

                {/* 审批意见 */}
                {approval.comment && (
                  <p className="text-sm text-muted-foreground">"{approval.comment}"</p>
                )}

                {/* 审批时间 */}
                {approval.actedAt && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(approval.actedAt).toLocaleString()}
                  </p>
                )}

                {/* 操作按钮（仅当前待审批步骤显示） */}
                {canActOnStep(approval) && (
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate({ id: workOrderId })}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        {t('approval.approve', '通过')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowRejectInput(
                          showRejectInput === approval.id ? null : approval.id
                        )}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        {t('approval.reject', '驳回')}
                      </Button>
                    </div>

                    {/* 驳回原因输入框 */}
                    {showRejectInput === approval.id && (
                      <div className="flex items-center gap-2">
                        <Textarea
                          value={rejectComment}
                          onChange={(e) => setRejectComment(e.target.value)}
                          placeholder={t('approval.rejectReasonPlaceholder', '请输入驳回原因...')}
                          rows={2}
                          className="flex-1"
                        />
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={!rejectComment || rejectMutation.isPending}
                            onClick={() => {
                              rejectMutation.mutate({
                                id: workOrderId,
                                comment: rejectComment,
                              });
                              setRejectComment('');
                              setShowRejectInput(null);
                            }}
                          >
                            {t('common.submit', '提交')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowRejectInput(null)}
                          >
                            {t('common.cancel', '取消')}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: 更新 WorkOrderDetailPage — 集成审批进度面板**

修改 `frontend/src/pages/WorkOrderDetailPage.tsx`，主要改动：

1. 使用 `useWorkOrderDetail` 替代 `useWorkOrder` 以获取审批信息
2. 在 Completed 状态显示"提交验收"按钮
3. 在 SubmittedForApproval 状态显示审批进度面板
4. 更新状态标签映射

关键改动摘要（具体修改时替换对应部分）：

```tsx
// 新增导入
import { useWorkOrderDetail, useSubmitWorkOrder, useApproveWorkOrder, useRejectWorkOrder } from '../hooks/useApprovals';
import { ApprovalProgressPanel } from '../components/workorder/ApprovalProgressPanel';

// 在 WorkOrderDetailPage 组件内部：
// 替换 useWorkOrder 为 useWorkOrderDetail
const { data: detailData, isLoading } = useWorkOrderDetail(id ?? '');
const workOrder = detailData?.workOrder;
const approvals = detailData?.approvals ?? [];

// 新增 hooks
const submitOrder = useSubmitWorkOrder();
const approveOrder = useApproveWorkOrder();
const rejectOrder = useRejectWorkOrder();

// 新增状态标签
const statusLabels: Record<string, string> = {
  PendingDispatch: t('workorder.status.pendingDispatch'),
  Assigned: t('workorder.status.assigned'),
  InProgress: t('workorder.status.inProgress'),
  Completed: t('workorder.status.completed'),
  SubmittedForApproval: t('workorder.status.submittedForApproval', '待审批'),
  Accepted: t('workorder.status.accepted'),
  Rejected: t('workorder.status.rejected'),
  Closed: t('workorder.status.closed'),
  Cancelled: t('workorder.status.cancelled'),
};

// 在 ActionButtons 的 buttons 映射中更新：
const buttons: Record<string, Array<{ label: string; action: () => void; variant?: 'default' | 'outline' | 'destructive' }>> = {
  PendingDispatch: [{ label: t('workorder.dispatch'), action: onStart }],
  Assigned: [{ label: t('workorder.startExecution'), action: onStart }],
  InProgress: [],
  Completed: [
    { label: t('workorder.submitForApproval', '提交验收'), action: onSubmit },
  ],
  SubmittedForApproval: [],  // 审批操作在 ApprovalProgressPanel 中
  Accepted: [{ label: t('workorder.close'), action: onClose }],
  Rejected: [],
  Closed: [],
  Cancelled: [],
};

// ActionButtons 新增 onSubmit 属性
interface ActionButtonsProps {
  workOrder: WorkOrder;
  onStart: () => void;
  onSubmit: () => void;  // 新增
  onAccept: () => void;
  onReject: (reason: string) => void;
  onClose: () => void;
  onCancel: () => void;
}

// 在主页面布局中，在审计日志卡片旁新增审批进度面板：
{workOrder.status === 'SubmittedForApproval' && (
  <ApprovalProgressPanel
    workOrderId={workOrder.id}
    workOrderStatus={workOrder.status}
    approvals={approvals}
  />
)}

// 同时在 ActionButtons 调用处传入 onSubmit:
<ActionButtons
  workOrder={workOrder}
  onStart={() => startOrder.mutate(workOrder.id)}
  onSubmit={() => submitOrder.mutate({ id: workOrder.id })}
  onAccept={() => approveOrder.mutate({ id: workOrder.id })}
  onReject={(reason) => rejectOrder.mutate({ id: workOrder.id, comment: reason })}
  onClose={() => closeOrder.mutate(workOrder.id)}
  onCancel={() => setCancelDialogOpen(true)}
/>
```

- [ ] **Step 5: 更新 SettingsPage — 新增审批链配置 Tab**

在 `frontend/src/pages/SettingsPage.tsx` 中新增一个 `ApprovalChainSettings` 组件和对应的 Tab：

```tsx
// 新增导入（在 SettingsPage.tsx 顶部）
import { useApprovalChains, useCreateApprovalChain, useDeleteApprovalChain } from '../hooks/useApprovals';

// 在 SettingsPage 组件的 Tabs 组件中，新增 TabsTrigger 和 TabsContent：

// 在 TabsList 中新增：
<TabsTrigger value="approval-chains">{t('settings.approvalChains', '审批链配置')}</TabsTrigger>

// 新增 TabsContent：
<TabsContent value="approval-chains">
  <ApprovalChainSettings />
</TabsContent>
```

新增 `ApprovalChainSettings` 组件（在 SettingsPage.tsx 文件内部，`SettingsPage` 组件之后）：

```tsx
/**
 * 审批链配置面板
 *
 * 展示当前租户的所有审批链模板，支持创建、启用/禁用和删除操作。
 * 每个模板展示适用的工单类型、优先级和审批步骤列表。
 */
function ApprovalChainSettings() {
  const { t } = useTranslation();
  const { data: chainsData } = useApprovalChains(1, 50);
  const createMutation = useCreateApprovalChain();
  const deleteMutation = useDeleteApprovalChain();

  const chains = chainsData?.items ?? [];

  /** 角色中文标签 */
  const roleLabels: Record<string, string> = {
    SystemAdmin: '系统管理员',
    MaintenanceLead: '维保主管',
    Technician: '维保技师',
    Operator: '操作员',
    Viewer: '查看者',
  };

  /** 创建默认审批链 */
  const handleCreateDefault = () => {
    createMutation.mutate({
      name: '默认审批流程',
      isDefault: true,
      enabled: true,
      steps: [
        { stepOrder: 1, role: 'MaintenanceLead', isRequired: true },
      ],
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('settings.approvalChains', '审批链配置')}</CardTitle>
            <CardDescription>{t('settings.approvalChainsDesc', '配置工单验收的多级审批流程')}</CardDescription>
          </div>
          <Button onClick={handleCreateDefault} disabled={createMutation.isPending}>
            {t('common.create', '创建审批链')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {chains.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">{t('settings.noApprovalChains', '暂无审批链模板')}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('settings.noApprovalChainsHint', '没有审批链时，工单提交验收后将直接通过')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {chains.map((chain) => (
              <div key={chain.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{chain.name}</span>
                    {chain.isDefault && (
                      <Badge variant="secondary">{t('approval.default', '默认')}</Badge>
                    )}
                    <Badge variant={chain.enabled ? 'outline' : 'destructive'}>
                      {chain.enabled ? t('common.enabled', '启用') : t('common.disabled', '禁用')}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(chain.id)}
                    disabled={deleteMutation.isPending}
                  >
                    {t('common.delete', '删除')}
                  </Button>
                </div>

                <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                  {chain.workOrderType && (
                    <span>{t('approval.workOrderType', '工单类型')}: {chain.workOrderType}</span>
                  )}
                  {chain.workOrderPriority && (
                    <span>{t('approval.priority', '优先级')}: {chain.workOrderPriority}</span>
                  )}
                  {!chain.workOrderType && !chain.workOrderPriority && (
                    <span>{t('approval.globalDefault', '全局默认')}</span>
                  )}
                </div>

                {/* 审批步骤列表 */}
                <div className="mt-3 flex items-center gap-2">
                  {chain.steps
                    .sort((a, b) => a.stepOrder - b.stepOrder)
                    .map((step, idx) => (
                      <span key={step.id} className="flex items-center gap-2">
                        {idx > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        <Badge variant="outline" className="text-xs">
                          {step.stepOrder}. {roleLabels[step.role] ?? step.role}
                        </Badge>
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

需要在 SettingsPage.tsx 顶部新增导入：
```tsx
import { ChevronRight } from 'lucide-react';
import { useApprovalChains, useCreateApprovalChain, useDeleteApprovalChain } from '../hooks/useApprovals';
```

- [ ] **Step 6: TypeScript 编译确认**

Run: `cd /Users/yqgmac/yqg/project/EquipSense/frontend && npx tsc --noEmit`

Expected: 无错误

- [ ] **Step 7: 提交**

```bash
git add frontend/src/types/index.ts \
  frontend/src/hooks/useApprovals.ts \
  frontend/src/components/workorder/ApprovalProgressPanel.tsx \
  frontend/src/pages/WorkOrderDetailPage.tsx \
  frontend/src/pages/SettingsPage.tsx
git commit -m "feat: 前端审批进度面板 + 审批链配置 + 提交验收操作"
```

---

## 验证清单

完成所有 Task 后，按以下清单验证：

- [ ] `dotnet build EquipAI.slnx` — 编译成功
- [ ] `dotnet test tests/EquipAI.Tests.Unit --verbosity normal` — 所有测试通过
- [ ] `cd frontend && npx tsc --noEmit` — TypeScript 无错误
- [ ] 工单工作流完整路径：创建 -> 派工 -> 开始 -> 完成 -> 提交验收 -> 审批通过/驳回 -> 关闭
- [ ] 无审批链时：提交验收直接通过
- [ ] 有审批链时：多级审批逐步推进
- [ ] 驳回后：工单回到 Rejected 状态，可重新执行
- [ ] 前端审批进度面板正确显示各步骤状态
- [ ] 设置页审批链配置 Tab 可创建/删除模板
