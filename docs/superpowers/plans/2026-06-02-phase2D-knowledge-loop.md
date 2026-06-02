# Phase 2D: 知识沉淀闭环 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完善根因分析→候选规则生成→专家审核→规则生效全链路。分析完成后自动生成候选规则，审核操作记录审计日志，前端增强审核交互和来源标识。

**Architecture:** 在 RootCauseAnalysisHandler 中分析完成后，当置信度 >= 0.7 且根因非空时自动生成 PendingRule。KnowledgeCaptureService 的 approve/reject 增加审计日志。前端 PendingRulesPage 增加编辑后批准功能，KnowledgePage 增加规则来源标识列。

**Tech Stack:** .NET 8 EF Core, PostgreSQL, React 19 + TanStack Query, xUnit, FluentAssertions

---

## File Structure

| 操作 | 文件 | 职责 |
|------|------|------|
| 修改 | `src/EquipAI.Core/Entities/PendingRule.cs` | 添加 SourceAlertId + SourceAnalysisId 字段 |
| 修改 | `src/EquipAI.Infrastructure/Data/AppDbContext.cs` | 确保 PendingRules DbSet |
| 修改 | `src/EquipAI.Application/Analysis/Handlers/RootCauseAnalysisHandler.cs` | 分析完成后生成候选规则 |
| 修改 | `src/EquipAI.Application/Knowledge/KnowledgeCaptureService.cs` | approve/reject 增加审计日志 |
| 修改 | `src/EquipAI.WebAPI/Controllers/KnowledgeController.cs` | 新增编辑后批准端点 |
| 修改 | `frontend/src/pages/PendingRulesPage.tsx` | 增加编辑后批准 + 来源标识 |
| 修改 | `frontend/src/pages/KnowledgePage.tsx` | 规则来源标识列 |
| 修改 | `frontend/src/hooks/useKnowledge.ts` | 新增编辑批准 API hook |
| 创建 | `src/EquipAI.Infrastructure/Data/Migrations/` | PendingRule 新字段迁移 |

---

### Task 1: PendingRule 实体增加来源字段 + 迁移

**Files:**
- Modify: `src/EquipAI.Core/Entities/PendingRule.cs`
- Modify: `src/EquipAI.Infrastructure/Data/AppDbContext.cs`（确认 PendingRules DbSet 存在）

- [ ] **Step 1: 在 PendingRule 实体中添加来源字段**

在 `src/EquipAI.Core/Entities/PendingRule.cs` 中，在现有 `SourceWorkorderId` 属性附近添加：

```csharp
/// <summary>
/// 来源告警 ID（分析引擎自动生成时关联的告警）
/// </summary>
public Guid? SourceAlertId { get; set; }

/// <summary>
/// 来源分析 ID（分析引擎自动生成时关联的分析记录）
/// </summary>
public Guid? SourceAnalysisId { get; set; }
```

- [ ] **Step 2: 确认 AppDbContext 有 PendingRules DbSet**

检查 `src/EquipAI.Infrastructure/Data/AppDbContext.cs` 中是否存在 `public DbSet<PendingRule> PendingRules { get; set; }`。如果不存在则添加。

- [ ] **Step 3: 创建并应用迁移**

Run: `cd /Users/yqgmac/yqg/project/EquipSense && dotnet ef migrations add AddPendingRuleSourceFields --project src/EquipAI.Infrastructure --startup-project src/EquipAI.WebAPI`
Run: `cd /Users/yqgmac/yqg/project/EquipSense && dotnet ef database update --project src/EquipAI.Infrastructure --startup-project src/EquipAI.WebAPI`

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.Core/Entities/PendingRule.cs src/EquipAI.Infrastructure/Data/AppDbContext.cs src/EquipAI.Infrastructure/Data/Migrations/
git commit -m "feat: PendingRule 增加 SourceAlertId + SourceAnalysisId 来源追踪字段"
```

---

### Task 2: RootCauseAnalysisHandler 分析后自动生成候选规则

**Files:**
- Modify: `src/EquipAI.Application/Analysis/Handlers/RootCauseAnalysisHandler.cs`

- [ ] **Step 1: 在分析完成后增加候选规则生成逻辑**

在 `RootCauseAnalysisHandler.cs` 的 `HandleAsync` 方法中，在 `await _eventBus.PublishAsync(new AnalysisCompletedEvent(...))` 之后、`catch` 之前添加：

```csharp
// 分析完成后自动生成候选规则（置信度 >= 0.7 且根因非空）
if (analysis.Confidence >= 0.7 && !string.IsNullOrWhiteSpace(analysis.RootCause))
{
    await GenerateCandidateRuleFromAnalysisAsync(
        @event.TenantId, @event.DeviceId, @event.Metric,
        @event.AlertId, analysis, cancellationToken);
}
```

在 `RootCauseAnalysisHandler` 类底部添加私有方法：

```csharp
/// <summary>
/// 从分析结果中提取因果模式，自动生成候选规则
/// 触发条件：置信度 >= 0.7 且根因描述非空
/// </summary>
private async Task GenerateCandidateRuleFromAnalysisAsync(
    Guid tenantId, Guid deviceId, string metric,
    Guid alertId, AnalysisEntity analysis, CancellationToken ct)
{
    try
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 查询设备类型（用于规则匹配）
        var device = await db.Devices.FindAsync([deviceId], ct);
        var deviceType = device?.Type ?? "通用";

        // 构建条件 JSONB：从分析结果中提取指标和偏离信息
        var conditions = new
        {
            metric,
            level = analysis.Level.ToString(),
            confidence = Math.Round(analysis.Confidence, 2)
        }.ToString();

        // 构建结论 JSONB
        var conclusion = new
        {
            rootCause = analysis.RootCause,
            suggestion = analysis.Suggestion
        }.ToString();

        var pendingRule = new PendingRule
        {
            TenantId = tenantId,
            DeviceType = deviceType,
            Name = $"AI推荐: {metric} 异常处理规则",
            Conditions = conditions,
            Conclusion = conclusion,
            RecommendedActions = analysis.Suggestion,
            Confidence = (decimal)analysis.Confidence,
            SourceAlertId = alertId,
            SourceAnalysisId = analysis.Id,
            ReviewStatus = ReviewStatus.Pending
        };

        // 使用 UnfilteredSet 绕过租户过滤器（后台事件处理器无 HttpContext）
        db.UnfilteredSet<PendingRule>().Add(pendingRule);
        await db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "已从分析结果生成候选规则: PendingRuleId={PendingRuleId}, 置信度={Confidence:F2}",
            pendingRule.Id, analysis.Confidence);
    }
    catch (Exception ex)
    {
        // 候选规则生成失败不应阻塞分析流程
        _logger.LogWarning(ex, "生成候选规则失败: AlertId={AlertId}", alertId);
    }
}
```

需要在文件顶部添加 using：

```csharp
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
```

注意：`AnalysisEntity` 别名已存在（`using AnalysisEntity = EquipAI.Core.Entities.Analysis;`），但 `PendingRule` 和 `ReviewStatus` 需要引入。

- [ ] **Step 2: 构建确认编译通过**

Run: `cd /Users/yqgmac/yqg/project/EquipSense && dotnet build src/EquipAI.Application`
Expected: Build succeeded

- [ ] **Step 3: 提交**

```bash
git add src/EquipAI.Application/Analysis/Handlers/RootCauseAnalysisHandler.cs
git commit -m "feat: 根因分析后自动生成候选规则（置信度>=0.7时触发）

- 在 RootCauseAnalysisHandler 中增加 GenerateCandidateRuleFromAnalysisAsync
- 从分析结果提取指标、根因、建议生成 PendingRule
- 使用 UnfilteredSet 绕过租户过滤器
- 失败不阻塞分析流程"
```

---

### Task 3: KnowledgeCaptureService 增加审计日志

**Files:**
- Modify: `src/EquipAI.Application/Knowledge/KnowledgeCaptureService.cs`

- [ ] **Step 1: 注入 IAuditLogService 并在 approve/reject 中记录审计日志**

修改 `KnowledgeCaptureService` 构造函数，增加 `IAuditLogService` 依赖：

```csharp
private readonly IAuditLogService _auditLogService;

public KnowledgeCaptureService(
    IServiceScopeFactory scopeFactory,
    ILLMService llmService,
    IAuditLogService auditLogService,
    ILogger<KnowledgeCaptureService> logger)
{
    _scopeFactory = scopeFactory;
    _llmService = llmService;
    _auditLogService = auditLogService;
    _logger = logger;
}
```

在 `ApproveRuleAsync` 方法末尾（`await db.SaveChangesAsync(ct)` 之后）添加：

```csharp
await _auditLogService.LogFromContextAsync(
    "KnowledgeRuleApproved",
    "PendingRule",
    pendingRuleId.ToString(),
    $"批准候选规则「{pending.Name}」为正式知识规则，置信度: {pending.Confidence:P}",
    ct);
```

在 `RejectRuleAsync` 方法末尾（`await db.SaveChangesAsync(ct)` 之后）添加：

```csharp
await _auditLogService.LogFromContextAsync(
    "KnowledgeRuleRejected",
    "PendingRule",
    pendingRuleId.ToString(),
    $"驳回候选规则「{pending.Name}」，原因: {comment ?? "无"}",
    ct);
```

需要在文件顶部确认 using：

```csharp
using EquipAI.Core.Interfaces;
```

- [ ] **Step 2: 构建确认编译通过**

Run: `cd /Users/yqgmac/yqg/project/EquipSense && dotnet build src/EquipAI.Application`
Expected: Build succeeded

- [ ] **Step 3: 提交**

```bash
git add src/EquipAI.Application/Knowledge/KnowledgeCaptureService.cs
git commit -m "feat: 知识规则审核操作增加审计日志

- 注入 IAuditLogService
- 批准规则记录 KnowledgeRuleApproved 审计
- 驳回规则记录 KnowledgeRuleRejected 审计"
```

---

### Task 4: KnowledgeController 编辑后批准端点

**Files:**
- Modify: `src/EquipAI.WebAPI/Controllers/KnowledgeController.cs`

- [ ] **Step 1: 新增编辑后批准端点**

在 `KnowledgeController.cs` 的现有 approve 端点附近添加：

```csharp
/// <summary>
/// 编辑后批准候选规则 — 允许专家修改条件后转为正式规则
/// </summary>
[HttpPut("pending-rules/{id:guid}/approve-with-edit")]
[Authorize]
public async Task<ActionResult> ApproveWithEdit(
    Guid id, [FromBody] ApproveWithEditRequest request)
{
    try
    {
        var reviewerId = _tenantContext.UserId;

        // 先更新候选规则的条件
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var pending = await db.PendingRules.FindAsync([id]);

        if (pending is null)
            return NotFound(new { code = 404, message = "候选规则不存在" });

        if (pending.ReviewStatus != ReviewStatus.Pending)
            return BadRequest(new { code = 400, message = $"规则已审核，当前状态: {pending.ReviewStatus}" });

        // 应用专家修改
        if (!string.IsNullOrWhiteSpace(request.AdjustedConditions))
            pending.Conditions = request.AdjustedConditions;
        if (!string.IsNullOrWhiteSpace(request.AdjustedConclusion))
            pending.Conclusion = request.AdjustedConclusion;
        if (!string.IsNullOrWhiteSpace(request.AdjustedName))
            pending.Name = request.AdjustedName;

        await db.SaveChangesAsync();

        // 调用批准流程
        await _captureService.ApproveRuleAsync(id, reviewerId, request.Comment, HttpContext.RequestAborted);

        return Ok(new { message = "规则已编辑并批准" });
    }
    catch (KeyNotFoundException)
    {
        return NotFound(new { code = 404, message = "候选规则不存在" });
    }
    catch (InvalidOperationException ex)
    {
        return BadRequest(new { code = 400, message = ex.Message });
    }
}
```

在 Controller 同文件或 DTO 文件中添加请求模型：

```csharp
/// <summary>
/// 编辑后批准请求
/// </summary>
public class ApproveWithEditRequest
{
    /// <summary>
    /// 修改后的条件（JSONB 字符串）
    /// </summary>
    public string? AdjustedConditions { get; set; }

    /// <summary>
    /// 修改后的结论（JSONB 字符串）
    /// </summary>
    public string? AdjustedConclusion { get; set; }

    /// <summary>
    /// 修改后的规则名称
    /// </summary>
    public string? AdjustedName { get; set; }

    /// <summary>
    /// 审核意见
    /// </summary>
    public string? Comment { get; set; }
}
```

需要在文件顶部确认 using：

```csharp
using EquipAI.Core.Enums;
```

- [ ] **Step 2: 构建确认编译通过**

Run: `cd /Users/yqgmac/yqg/project/EquipSense && dotnet build src/EquipAI.WebAPI`
Expected: Build succeeded

- [ ] **Step 3: 提交**

```bash
git add src/EquipAI.WebAPI/Controllers/KnowledgeController.cs
git commit -m "feat: KnowledgeController 新增编辑后批准端点 approve-with-edit

- 允许专家修改条件/结论/名称后批准
- 应用修改后调用 ApproveRuleAsync 完成批准流程"
```

---

### Task 5: 前端增强 — 审核 UI + 来源标识

**Files:**
- Modify: `frontend/src/hooks/useKnowledge.ts`
- Modify: `frontend/src/pages/PendingRulesPage.tsx`
- Modify: `frontend/src/pages/KnowledgePage.tsx`

- [ ] **Step 1: 在 useKnowledge.ts 中添加编辑后批准 hook**

在 `frontend/src/hooks/useKnowledge.ts` 中添加：

```typescript
/** 编辑后批准参数 */
export interface ApproveWithEditParams {
  adjustedConditions?: string;
  adjustedConclusion?: string;
  adjustedName?: string;
  comment?: string;
}

/** 编辑后批准候选规则 */
export function useApproveWithEdit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...params }: { id: string } & ApproveWithEditParams) => {
      const { data } = await api.put(`/knowledge/pending-rules/${id}/approve-with-edit`, params);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-rules'] });
      qc.invalidateQueries({ queryKey: ['knowledge-rules'] });
    },
  });
}
```

- [ ] **Step 2: 增强 PendingRulesPage 审核交互**

在 `frontend/src/pages/PendingRulesPage.tsx` 中，为每张 Pending 卡片增加：

1. **来源标识**：如果有 `sourceAlertId` 显示 "AI 分析自动推荐" + 置信度百分比，否则显示 "工单关闭生成"

2. **编辑后批准按钮**：点击后弹窗展示可编辑的字段（条件、结论、名称），确认后调用 `useApproveWithEdit`

在现有批准按钮旁添加编辑后批准按钮的示例改动：

```tsx
// 在每张 Pending 卡片的操作区增加
{rule.reviewStatus === 'Pending' && (
  <>
    {/* 已有批准按钮 */}
    <Button size="sm" onClick={() => handleApprove(rule.id)}>批准</Button>

    {/* 新增：编辑后批准 */}
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">编辑后批准</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑并批准规则</DialogTitle>
          <DialogDescription>修改规则条件后批准为正式知识规则</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>规则名称</Label>
            <Input defaultValue={rule.name} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <div>
            <Label>条件</Label>
            <Textarea defaultValue={formatConditions(rule.conditions)} onChange={(e) => setEditConditions(e.target.value)} />
          </div>
          <div>
            <Label>结论</Label>
            <Textarea defaultValue={rule.conclusion} onChange={(e) => setEditConclusion(e.target.value)} />
          </div>
          <div>
            <Label>审核意见</Label>
            <Input placeholder="可选" onChange={(e) => setEditComment(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => handleApproveWithEdit(rule.id)}>确认批准</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* 已有驳回按钮 */}
    <Button size="sm" variant="destructive" onClick={() => handleReject(rule.id)}>驳回</Button>
  </>
)}

{/* 来源标识 */}
{rule.sourceAlertId && (
  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
    <Bot className="h-3 w-3" />
    AI 分析推荐 · 置信度 {rule.confidence ? `${(rule.confidence * 100).toFixed(0)}%` : 'N/A'}
  </div>
)}
```

需要在文件顶部添加 `Dialog` 相关组件的 import：

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Bot } from 'lucide-react';
import { useApproveWithEdit } from '../hooks/useKnowledge';
```

- [ ] **Step 3: 增强 KnowledgePage 规则来源标识**

在 `frontend/src/pages/KnowledgePage.tsx` 的正式规则列表中，增加来源标识列：

```tsx
{/* 在规则卡片中添加来源信息 */}
<div className="text-xs text-muted-foreground">
  {rule.source === 'ai_generated' ? (
    <span className="flex items-center gap-1">
      <Bot className="h-3 w-3" /> AI 推荐 · 审核通过
    </span>
  ) : rule.source === 'expert' ? (
    <span>专家创建 · {rule.createdBy ?? '未知'}</span>
  ) : (
    <span>行业导入</span>
  )}
</div>
```

- [ ] **Step 4: 构建确认前端编译**

Run: `cd /Users/yqgmac/yqg/project/EquipSense/frontend && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors（少量类型问题按提示修复）

- [ ] **Step 5: 提交**

```bash
git add frontend/src/hooks/useKnowledge.ts frontend/src/pages/PendingRulesPage.tsx frontend/src/pages/KnowledgePage.tsx
git commit -m "feat: 知识沉淀前端增强 — 编辑后批准 + 来源标识

- useKnowledge: 新增 useApproveWithEdit hook
- PendingRulesPage: 编辑后批准弹窗 + AI 推荐来源标识
- KnowledgePage: 规则来源标识列（AI 推荐/专家创建/行业导入）"
```
