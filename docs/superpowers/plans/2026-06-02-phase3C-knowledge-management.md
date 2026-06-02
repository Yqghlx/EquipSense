# Phase 3C：知识库管理 — 规则 CRUD、CSV/JSON 批量导入导出、版本管理

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完善知识库管理功能，包括规则编辑/启用禁用、CSV/JSON 批量导入导出（含校验+预览+错误报告）、版本管理（快照+回滚），实现完整的知识规则生命周期管理。

**Architecture:** 在现有 KnowledgeRule 实体基础上新增 Version 字段和 KnowledgeRuleVersion 版本快照实体。新建 KnowledgeImportService 处理 CSV/JSON 解析与校验，KnowledgeController 增强 CRUD/toggle/export/import/版本 API。前端新增规则编辑对话框、导入导出工具栏、版本历史面板。

**Tech Stack:** .NET 8、EF Core 8、PostgreSQL (JSONB)、React 19 + TanStack Query + shadcn/ui + React Hook Form + Zod

---

## 文件结构

```
src/EquipAI.Core/
├── Entities/KnowledgeRuleVersion.cs              -- NEW 版本快照实体
├── Entities/KnowledgeRule.cs                     -- MODIFY 新增 Version 字段
src/EquipAI.Application/
├── Knowledge/
│   ├── KnowledgeImportService.cs                 -- NEW CSV/JSON 导入+校验+预览
│   ├── KnowledgeVersionService.cs                -- NEW 版本管理服务
│   ├── DTOs/UpdateKnowledgeRuleRequest.cs        -- NEW 编辑规则请求
│   ├── DTOs/ImportPreviewResult.cs               -- NEW 导入预览结果
│   ├── DTOs/KnowledgeRuleVersionDto.cs            -- NEW 版本 DTO
src/EquipAI.Infrastructure/Data/
├── Configurations/KnowledgeRuleVersionConfiguration.cs  -- NEW 版本表 EF 配置
├── Configurations/KnowledgeRuleConfiguration.cs         -- MODIFY 添加 Version 列
├── Migrations/AddKnowledgeRuleVersion.cs                -- NEW EF 迁移
├── AppDbContext.cs                                      -- MODIFY 添加 DbSet
src/EquipAI.WebAPI/Controllers/
├── KnowledgeController.cs                          -- MODIFY 增强 CRUD + 版本 API
frontend/src/
├── types/index.ts                                  -- MODIFY 新增版本相关类型
├── hooks/useKnowledge.ts                          -- MODIFY 新增 hooks
├── components/knowledge/
│   ├── RuleEditDialog.tsx                          -- NEW 规则编辑对话框
│   ├── ConditionEditor.tsx                         -- NEW 条件编辑器
│   ├── ImportExportToolbar.tsx                     -- NEW 导入导出工具栏
│   ├── ImportPreviewDialog.tsx                     -- NEW 导入预览对话框
│   ├── VersionHistoryPanel.tsx                     -- NEW 版本历史面板
├── pages/KnowledgePage.tsx                         -- MODIFY 集成新组件
```

---

### Task 1: KnowledgeRuleVersion 实体 + KnowledgeRule 增加 Version + EF 迁移

**Files:**
- Create: `src/EquipAI.Core/Entities/KnowledgeRuleVersion.cs`
- Modify: `src/EquipAI.Core/Entities/KnowledgeRule.cs` — 新增 `Version` 属性
- Create: `src/EquipAI.Infrastructure/Data/Configurations/KnowledgeRuleVersionConfiguration.cs`
- Modify: `src/EquipAI.Infrastructure/Data/Configurations/KnowledgeRuleConfiguration.cs` — 添加 Version 列配置
- Modify: `src/EquipAI.Infrastructure/Data/AppDbContext.cs` — 添加 `KnowledgeRuleVersions` DbSet
- Create: `src/EquipAI.Application/Knowledge/DTOs/KnowledgeRuleVersionDto.cs`
- Create: `src/EquipAI.Application/Knowledge/KnowledgeVersionService.cs`
- Generate: EF Migration

- [ ] **Step 1: 创建 KnowledgeRuleVersion 实体**

遵循项目 BaseEntity 模式（Id: Guid, CreatedAt: DateTime），所有属性使用中文注释。

```csharp
// src/EquipAI.Core/Entities/KnowledgeRuleVersion.cs
namespace EquipAI.Core.Entities;

/// <summary>
/// 知识规则版本快照 — 记录每次编辑的历史版本，支持版本回滚
/// </summary>
public class KnowledgeRuleVersion : BaseEntity
{
    /// <summary>
    /// 租户 ID（用于多租户隔离）
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 关联的知识规则 ID
    /// </summary>
    public Guid RuleId { get; set; }

    /// <summary>
    /// 版本号（从 1 开始递增）
    /// </summary>
    public int Version { get; set; }

    /// <summary>
    /// 规则完整快照（JSONB 格式，包含编辑时刻的所有规则字段）
    /// </summary>
    public string Snapshot { get; set; } = string.Empty;

    /// <summary>
    /// 本次变更的操作人 ID
    /// </summary>
    public Guid? ChangedBy { get; set; }

    /// <summary>
    /// 变更摘要（如 "编辑条件"、"修改阈值"、"回滚至版本 3"）
    /// </summary>
    public string? ChangeSummary { get; set; }
}
```

- [ ] **Step 2: 修改 KnowledgeRule 实体 — 新增 Version 字段**

在 `src/EquipAI.Core/Entities/KnowledgeRule.cs` 的 `CreatedBy` 属性之后添加：

```csharp
    /// <summary>
    /// 当前版本号（从 1 开始，每次编辑递增）
    /// </summary>
    public int Version { get; set; } = 1;
```

- [ ] **Step 3: 创建 KnowledgeRuleVersionConfiguration**

遵循项目 IEntityTypeConfiguration 模式，snake_case 表名和列名。

```csharp
// src/EquipAI.Infrastructure/Data/Configurations/KnowledgeRuleVersionConfiguration.cs
using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// 知识规则版本表 EF Core 配置
/// </summary>
public class KnowledgeRuleVersionConfiguration : IEntityTypeConfiguration<KnowledgeRuleVersion>
{
    public void Configure(EntityTypeBuilder<KnowledgeRuleVersion> builder)
    {
        builder.ToTable("knowledge_rule_versions");

        // Snapshot 存储规则完整快照，使用 JSONB 便于后续对比和回滚
        builder.Property(e => e.Snapshot).HasColumnType("jsonb");

        // 变更摘要默认长度限制
        builder.Property(e => e.ChangeSummary).HasMaxLength(500);

        // 按租户+规则 ID 查询：用于获取某条规则的全部版本历史
        builder.HasIndex(e => new { e.TenantId, e.RuleId });

        // 按租户+规则 ID+版本号唯一约束：防止同一规则出现重复版本号
        builder.HasIndex(e => new { e.RuleId, e.Version }).IsUnique();
    }
}
```

- [ ] **Step 4: 修改 KnowledgeRuleConfiguration — 添加 Version 列**

在 `src/EquipAI.Infrastructure/Data/Configurations/KnowledgeRuleConfiguration.cs` 的 `Configure` 方法末尾追加：

```csharp
        // Version 字段默认值和索引（用于版本追踪）
        builder.Property(e => e.Version).HasDefaultValue(1);
```

- [ ] **Step 5: 修改 AppDbContext — 添加 KnowledgeRuleVersions DbSet**

在 `src/EquipAI.Infrastructure/Data/AppDbContext.cs` 中，在 `FaultCases` DbSet 之后添加：

```csharp
    /// <summary>
    /// 知识规则版本历史表
    /// </summary>
    public DbSet<KnowledgeRuleVersion> KnowledgeRuleVersions => Set<KnowledgeRuleVersion>();
```

- [ ] **Step 6: 创建 KnowledgeRuleVersionDto**

```csharp
// src/EquipAI.Application/Knowledge/DTOs/KnowledgeRuleVersionDto.cs
namespace EquipAI.Application.Knowledge.DTOs;

/// <summary>
/// 知识规则版本 DTO
/// </summary>
public class KnowledgeRuleVersionDto
{
    /// <summary>版本记录 ID</summary>
    public Guid Id { get; set; }

    /// <summary>关联规则 ID</summary>
    public Guid RuleId { get; set; }

    /// <summary>版本号</summary>
    public int Version { get; set; }

    /// <summary>规则快照（JSON）</summary>
    public string Snapshot { get; set; } = string.Empty;

    /// <summary>变更人 ID</summary>
    public Guid? ChangedBy { get; set; }

    /// <summary>变更摘要</summary>
    public string? ChangeSummary { get; set; }

    /// <summary>创建时间</summary>
    public DateTime CreatedAt { get; set; }
}
```

- [ ] **Step 7: 创建 KnowledgeVersionService**

此服务负责版本快照创建和回滚逻辑。遵循项目 DI 注入模式。

```csharp
// src/EquipAI.Application/Knowledge/KnowledgeVersionService.cs
using System.Text.Json;
using EquipAI.Application.Knowledge.DTOs;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Knowledge;

/// <summary>
/// 知识规则版本管理服务
/// 负责版本快照的创建、查询和回滚操作
/// </summary>
public class KnowledgeVersionService
{
    private readonly AppDbContext _dbContext;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<KnowledgeVersionService> _logger;

    public KnowledgeVersionService(
        AppDbContext dbContext,
        IAuditLogService auditLogService,
        ILogger<KnowledgeVersionService> logger)
    {
        _dbContext = dbContext;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    /// <summary>
    /// 创建版本快照 — 在规则编辑前调用，保存当前状态
    /// </summary>
    /// <param name="rule">即将被修改的规则（修改前的状态）</param>
    /// <param name="changedBy">变更人 ID</param>
    /// <param name="changeSummary">变更摘要</param>
    /// <param name="ct">取消令牌</param>
    public async Task<KnowledgeRuleVersion> CreateVersionSnapshotAsync(
        KnowledgeRule rule, Guid? changedBy, string? changeSummary, CancellationToken ct)
    {
        var snapshot = new KnowledgeRuleVersion
        {
            TenantId = rule.TenantId,
            RuleId = rule.Id,
            Version = rule.Version,
            Snapshot = SerializeRuleSnapshot(rule),
            ChangedBy = changedBy,
            ChangeSummary = changeSummary
        };

        _dbContext.KnowledgeRuleVersions.Add(snapshot);
        _logger.LogInformation(
            "创建规则版本快照: RuleId={RuleId}, Version={Version}", rule.Id, rule.Version);
        return snapshot;
    }

    /// <summary>
    /// 获取规则的全部版本历史（按版本号降序排列）
    /// </summary>
    /// <param name="ruleId">规则 ID</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>版本历史列表</returns>
    public async Task<List<KnowledgeRuleVersionDto>> GetVersionHistoryAsync(
        Guid ruleId, CancellationToken ct)
    {
        return await _dbContext.KnowledgeRuleVersions
            .Where(v => v.RuleId == ruleId)
            .OrderByDescending(v => v.Version)
            .Select(v => new KnowledgeRuleVersionDto
            {
                Id = v.Id,
                RuleId = v.RuleId,
                Version = v.Version,
                Snapshot = v.Snapshot,
                ChangedBy = v.ChangedBy,
                ChangeSummary = v.ChangeSummary,
                CreatedAt = v.CreatedAt
            })
            .ToListAsync(ct);
    }

    /// <summary>
    /// 回滚规则到指定版本
    /// 1. 先保存当前状态为版本快照
    /// 2. 从目标版本快照中恢复规则内容
    /// 3. 递增版本号
    /// </summary>
    /// <param name="ruleId">规则 ID</param>
    /// <param name="targetVersion">目标版本号</param>
    /// <param name="changedBy">操作人 ID</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>回滚后的规则</returns>
    /// <exception cref="KeyNotFoundException">规则或目标版本不存在</exception>
    public async Task<KnowledgeRule> RollbackToVersionAsync(
        Guid ruleId, int targetVersion, Guid? changedBy, CancellationToken ct)
    {
        var rule = await _dbContext.KnowledgeRules.FindAsync([ruleId], ct);
        if (rule is null)
            throw new KeyNotFoundException($"规则不存在: {ruleId}");

        var targetSnapshot = await _dbContext.KnowledgeRuleVersions
            .FirstOrDefaultAsync(
                v => v.RuleId == ruleId && v.Version == targetVersion, ct);
        if (targetSnapshot is null)
            throw new KeyNotFoundException($"版本不存在: RuleId={ruleId}, Version={targetVersion}");

        // 先保存当前状态为快照
        await CreateVersionSnapshotAsync(
            rule, changedBy, $"回滚至版本 {targetVersion}", ct);

        // 从快照恢复规则内容（保留 Id、TenantId、Version、CreatedAt）
        RestoreRuleFromSnapshot(rule, targetSnapshot.Snapshot);
        rule.Version++;

        await _dbContext.SaveChangesAsync(ct);

        await _auditLogService.LogFromContextAsync(
            "KnowledgeRuleRolledBack", "KnowledgeRule", ruleId.ToString(),
            $"规则「{rule.Name}」回滚至版本 {targetVersion}，当前版本 {rule.Version}", ct);

        _logger.LogInformation(
            "规则已回滚: RuleId={RuleId}, TargetVersion={TargetVersion}, NewVersion={NewVersion}",
            ruleId, targetVersion, rule.Version);

        return rule;
    }

    /// <summary>
    /// 将规则序列化为 JSON 快照
    /// </summary>
    private static string SerializeRuleSnapshot(KnowledgeRule rule)
    {
        return JsonSerializer.Serialize(new
        {
            rule.DeviceType,
            rule.Name,
            rule.Conditions,
            rule.Conclusion,
            rule.RecommendedActions,
            rule.CheckSteps,
            rule.ConfidenceWeight,
            rule.Source,
            rule.AccuracyRate,
            rule.SuccessCount,
            rule.Enabled,
            rule.CreatedBy,
            rule.Version
        }, new JsonSerializerOptions { WriteIndented = false });
    }

    /// <summary>
    /// 从 JSON 快照恢复规则字段
    /// </summary>
    private static void RestoreRuleFromSnapshot(KnowledgeRule rule, string snapshot)
    {
        var doc = JsonDocument.Parse(snapshot);
        var root = doc.RootElement;

        rule.DeviceType = root.TryGetProperty("DeviceType", out var dt) ? dt.GetString() ?? rule.DeviceType : rule.DeviceType;
        rule.Name = root.TryGetProperty("Name", out var n) ? n.GetString() ?? rule.Name : rule.Name;
        rule.Conditions = root.TryGetProperty("Conditions", out var c) ? c.GetRawText() : rule.Conditions;
        rule.Conclusion = root.TryGetProperty("Conclusion", out var cl) ? cl.GetString() ?? rule.Conclusion : rule.Conclusion;
        rule.RecommendedActions = root.TryGetProperty("RecommendedActions", out var ra) ? ra.GetString() : rule.RecommendedActions;
        rule.CheckSteps = root.TryGetProperty("CheckSteps", out var cs) ? cs.GetString() : rule.CheckSteps;
        rule.ConfidenceWeight = root.TryGetProperty("ConfidenceWeight", out var cw) ? cw.GetDecimal() : rule.ConfidenceWeight;
        rule.Enabled = root.TryGetProperty("Enabled", out var en) ? en.GetBoolean() : rule.Enabled;
    }
}
```

- [ ] **Step 8: 注册 KnowledgeVersionService 到 DI**

在 `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs` 中添加：

```csharp
builder.Services.AddScoped<KnowledgeVersionService>();
```

- [ ] **Step 9: 生成 EF 迁移**

```bash
cd src/EquipAI.Infrastructure
dotnet ef migrations add AddKnowledgeRuleVersion \
  --startup-project ../EquipAI.WebAPI \
  --context AppDbContext
```

- [ ] **Step 10: 验证迁移**

确认迁移文件包含：
1. 创建 `knowledge_rule_versions` 表（id UUID PK, tenant_id UUID, rule_id UUID, version INT, snapshot JSONB, changed_by UUID, change_summary VARCHAR(500), created_at TIMESTAMP）
2. `knowledge_rules` 表新增 `version INT NOT NULL DEFAULT 1`
3. 唯一索引 `(rule_id, version)`
4. 查询索引 `(tenant_id, rule_id)`

- [ ] **Step 11: 单元测试 — KnowledgeVersionService**

创建 `tests/EquipAI.Tests.Unit/Knowledge/KnowledgeVersionServiceTests.cs`：

```csharp
// 测试用例清单：
// 1. CreateVersionSnapshotAsync_当传入规则时_应创建快照并序列化所有字段
// 2. GetVersionHistoryAsync_当规则有多个版本时_应按版本号降序返回
// 3. RollbackToVersionAsync_当目标版本存在时_应恢复规则内容并递增版本号
// 4. RollbackToVersionAsync_当目标版本不存在时_应抛出KeyNotFoundException
// 5. RollbackToVersionAsync_回滚前应保存当前状态为快照
```

使用 InMemoryDatabase + 手动构建 DbContext 进行测试，遵循项目现有测试模式。

---

### Task 2: KnowledgeImportService (CSV/JSON 导入 + 校验 + 预览)

**Files:**
- Create: `src/EquipAI.Application/Knowledge/KnowledgeImportService.cs`
- Create: `src/EquipAI.Application/Knowledge/DTOs/ImportPreviewResult.cs`
- Create: `src/EquipAI.Application/Knowledge/DTOs/UpdateKnowledgeRuleRequest.cs`

- [ ] **Step 1: 创建 ImportPreviewResult DTO**

```csharp
// src/EquipAI.Application/Knowledge/DTOs/ImportPreviewResult.cs
namespace EquipAI.Application.Knowledge.DTOs;

/// <summary>
/// 导入预览结果 — 导入前的校验报告
/// </summary>
public class ImportPreviewResult
{
    /// <summary>预览模式下的解析成功数据（不会写入数据库）</summary>
    public List<ImportPreviewItem> ValidItems { get; set; } = [];

    /// <summary>校验失败的项目列表</summary>
    public List<ImportErrorItem> Errors { get; set; } = [];

    /// <summary>解析到的总行数</summary>
    public int TotalRows { get; set; }

    /// <summary>有效行数</summary>
    public int ValidCount => ValidItems.Count;

    /// <summary>错误行数</summary>
    public int ErrorCount => Errors.Count;
}

/// <summary>
/// 预览项 — 一条解析成功的规则数据
/// </summary>
public class ImportPreviewItem
{
    /// <summary>行号（原始文件中的行号，用于展示）</summary>
    public int RowNumber { get; set; }

    /// <summary>设备类型</summary>
    public string DeviceType { get; set; } = string.Empty;

    /// <summary>规则名称</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>触发条件</summary>
    public string Conditions { get; set; } = "[]";

    /// <summary>结论</summary>
    public string Conclusion { get; set; } = string.Empty;

    /// <summary>推荐措施</summary>
    public string? RecommendedActions { get; set; }

    /// <summary>检查步骤</summary>
    public string? CheckSteps { get; set; }

    /// <summary>置信度权重</summary>
    public decimal ConfidenceWeight { get; set; } = 0.5m;
}

/// <summary>
/// 导入错误项
/// </summary>
public class ImportErrorItem
{
    /// <summary>行号</summary>
    public int RowNumber { get; set; }

    /// <summary>错误信息</summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>原始行内容（用于展示）</summary>
    public string? RawContent { get; set; }
}

/// <summary>
/// 批量导入执行结果
/// </summary>
public class ImportResult
{
    /// <summary>成功导入数量</summary>
    public int Imported { get; set; }

    /// <summary>跳过数量（重复或错误）</summary>
    public int Skipped { get; set; }

    /// <summary>失败数量</summary>
    public int Failed { get; set; }

    /// <summary>失败详情</summary>
    public List<ImportErrorItem> Errors { get; set; } = [];
}
```

- [ ] **Step 2: 创建 UpdateKnowledgeRuleRequest DTO**

```csharp
// src/EquipAI.Application/Knowledge/DTOs/UpdateKnowledgeRuleRequest.cs
namespace EquipAI.Application.Knowledge.DTOs;

/// <summary>
/// 编辑知识规则请求
/// </summary>
public class UpdateKnowledgeRuleRequest
{
    /// <summary>规则名称</summary>
    public string? Name { get; set; }

    /// <summary>适用设备类型</summary>
    public string? DeviceType { get; set; }

    /// <summary>触发条件（JSONB 格式）</summary>
    public string? Conditions { get; set; }

    /// <summary>结论描述</summary>
    public string? Conclusion { get; set; }

    /// <summary>推荐处理措施</summary>
    public string? RecommendedActions { get; set; }

    /// <summary>检查步骤</summary>
    public string? CheckSteps { get; set; }

    /// <summary>置信度权重（0-1）</summary>
    public decimal? ConfidenceWeight { get; set; }

    /// <summary>变更摘要（用于版本记录）</summary>
    public string? ChangeSummary { get; set; }
}
```

- [ ] **Step 3: 创建 KnowledgeImportService**

```csharp
// src/EquipAI.Application/Knowledge/KnowledgeImportService.cs
using System.Globalization;
using System.Text;
using System.Text.Json;
using EquipAI.Application.Knowledge.DTOs;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Knowledge;

/// <summary>
/// 知识规则导入导出服务
/// 支持 CSV 和 JSON 格式的批量导入，包含预览校验和错误报告
/// </summary>
public class KnowledgeImportService
{
    private readonly AppDbContext _dbContext;
    private readonly KnowledgeVersionService _versionService;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<KnowledgeImportService> _logger;

    /// <summary>
    /// CSV 所需的列头（英文，匹配导入模板）
    /// </summary>
    private static readonly string[] CsvRequiredHeaders = ["device_type", "name", "conditions", "conclusion"];

    /// <summary>
    /// CSV 可选的列头
    /// </summary>
    private static readonly string[] CsvOptionalHeaders = ["recommended_actions", "check_steps", "confidence_weight"];

    public KnowledgeImportService(
        AppDbContext dbContext,
        KnowledgeVersionService versionService,
        IAuditLogService auditLogService,
        ILogger<KnowledgeImportService> logger)
    {
        _dbContext = dbContext;
        _versionService = versionService;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    /// <summary>
    /// 预览导入文件 — 解析但不写入数据库
    /// 支持 CSV 和 JSON 两种格式（通过文件内容自动检测）
    /// </summary>
    /// <param name="content">文件原始内容</param>
    /// <param name="fileName">文件名（用于格式检测和错误提示）</param>
    /// <returns>预览结果（含校验错误信息）</returns>
    public ImportPreviewResult PreviewImport(string content, string fileName)
    {
        if (string.IsNullOrWhiteSpace(content))
            throw new ArgumentException("文件内容不能为空");

        var isJson = fileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase)
                     || content.TrimStart().StartsWith('[')
                     || content.TrimStart().StartsWith('{');

        return isJson ? PreviewJson(content) : PreviewCsv(content);
    }

    /// <summary>
    /// 执行导入 — 根据预览结果写入数据库
    /// </summary>
    /// <param name="content">文件原始内容</param>
    /// <param name="fileName">文件名</param>
    /// <param name="tenantId">目标租户 ID</param>
    /// <param name="userId">操作人 ID</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>导入结果</returns>
    public async Task<ImportResult> ExecuteImportAsync(
        string content, string fileName, Guid tenantId, Guid userId, CancellationToken ct)
    {
        var preview = PreviewImport(content, fileName);
        var result = new ImportResult();

        foreach (var item in preview.ValidItems)
        {
            try
            {
                var rule = new KnowledgeRule
                {
                    TenantId = tenantId,
                    DeviceType = item.DeviceType,
                    Name = item.Name,
                    Conditions = item.Conditions,
                    Conclusion = item.Conclusion,
                    RecommendedActions = item.RecommendedActions,
                    CheckSteps = item.CheckSteps,
                    ConfidenceWeight = item.ConfidenceWeight,
                    Source = "imported",
                    CreatedBy = userId.ToString()
                };

                _dbContext.KnowledgeRules.Add(rule);
                result.Imported++;
            }
            catch (Exception ex)
            {
                result.Failed++;
                result.Errors.Add(new ImportErrorItem
                {
                    RowNumber = item.RowNumber,
                    Message = $"导入失败: {ex.Message}"
                });
            }
        }

        // 追加校验阶段发现的错误
        result.Skipped = preview.ErrorCount;
        result.Errors.AddRange(preview.Errors);

        if (result.Imported > 0)
            await _dbContext.SaveChangesAsync(ct);

        await _auditLogService.LogFromContextAsync(
            "KnowledgeRulesImported", "KnowledgeRule", "",
            $"批量导入知识规则：成功 {result.Imported} 条，跳过 {result.Skipped} 条，失败 {result.Failed} 条", ct);

        _logger.LogInformation(
            "批量导入完成: Imported={Imported}, Skipped={Skipped}, Failed={Failed}",
            result.Imported, result.Skipped, result.Failed);

        return result;
    }

    /// <summary>
    /// 导出规则为 JSON 格式
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="deviceType">可选：按设备类型过滤</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>JSON 字符串</returns>
    public async Task<string> ExportAsJsonAsync(Guid tenantId, string? deviceType, CancellationToken ct)
    {
        var query = _dbContext.KnowledgeRules.AsQueryable();

        if (!string.IsNullOrWhiteSpace(deviceType))
            query = query.Where(r => r.DeviceType == deviceType);

        var rules = await query.Select(r => new
        {
            r.DeviceType,
            r.Name,
            r.Conditions,
            r.Conclusion,
            r.RecommendedActions,
            r.CheckSteps,
            r.ConfidenceWeight
        }).ToListAsync(ct);

        return JsonSerializer.Serialize(rules, new JsonSerializerOptions { WriteIndented = true });
    }

    /// <summary>
    /// 导出规则为 CSV 格式
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="deviceType">可选：按设备类型过滤</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>CSV 字符串</returns>
    public async Task<string> ExportAsCsvAsync(Guid tenantId, string? deviceType, CancellationToken ct)
    {
        var query = _dbContext.KnowledgeRules.AsQueryable();

        if (!string.IsNullOrWhiteSpace(deviceType))
            query = query.Where(r => r.DeviceType == deviceType);

        var rules = await query.ToListAsync(ct);

        var sb = new StringBuilder();
        // CSV 表头
        sb.AppendLine("device_type,name,conditions,conclusion,recommended_actions,check_steps,confidence_weight");

        foreach (var r in rules)
        {
            sb.AppendLine(string.Join(',',
                EscapeCsvField(r.DeviceType),
                EscapeCsvField(r.Name),
                EscapeCsvField(r.Conditions),
                EscapeCsvField(r.Conclusion),
                EscapeCsvField(r.RecommendedActions ?? ""),
                EscapeCsvField(r.CheckSteps ?? ""),
                r.ConfidenceWeight.ToString(CultureInfo.InvariantCulture)
            ));
        }

        return sb.ToString();
    }

    /// <summary>
    /// 导入行业预置规则（一键导入到当前租户）
    /// </summary>
    /// <param name="tenantId">目标租户 ID</param>
    /// <param name="userId">操作人 ID</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>导入结果</returns>
    public async Task<ImportResult> ImportIndustryPresetAsync(
        Guid tenantId, Guid userId, CancellationToken ct)
    {
        var presetRules = IndustryPresetData.AllRules(Core.Constants.SystemConstants.SystemTenantId);

        // 检查当前租户是否已导入同名规则，避免重复
        var existingNames = await _dbContext.KnowledgeRules
            .Where(r => r.TenantId == tenantId)
            .Select(r => r.Name)
            .ToHashSetAsync(ct);

        var result = new ImportResult();

        foreach (var preset in presetRules)
        {
            if (existingNames.Contains(preset.Name))
            {
                result.Skipped++;
                continue;
            }

            var rule = new KnowledgeRule
            {
                TenantId = tenantId,
                DeviceType = preset.DeviceType,
                Name = preset.Name,
                Conditions = preset.Conditions,
                Conclusion = preset.Conclusion,
                RecommendedActions = preset.RecommendedActions,
                CheckSteps = preset.CheckSteps,
                ConfidenceWeight = preset.ConfidenceWeight,
                Source = "imported",
                CreatedBy = userId.ToString()
            };

            _dbContext.KnowledgeRules.Add(rule);
            result.Imported++;
        }

        if (result.Imported > 0)
            await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation(
            "行业预置导入: Tenant={TenantId}, Imported={Imported}, Skipped={Skipped}",
            tenantId, result.Imported, result.Skipped);

        return result;
    }

    // ========================================================================
    // 私有方法：CSV / JSON 解析与校验
    // ========================================================================

    /// <summary>
    /// 预览 CSV 文件内容
    /// CSV 格式：device_type,name,conditions,conclusion,recommended_actions,check_steps,confidence_weight
    /// </summary>
    private static ImportPreviewResult PreviewCsv(string content)
    {
        var result = new ImportPreviewResult();
        var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        if (lines.Length == 0)
        {
            result.Errors.Add(new ImportErrorItem { RowNumber = 0, Message = "CSV 文件为空" });
            return result;
        }

        // 解析表头，建立列索引映射
        var headers = ParseCsvLine(lines[0])
            .Select(h => h.Trim().ToLowerInvariant())
            .ToArray();

        var headerIndex = new Dictionary<string, int>();
        for (var i = 0; i < headers.Length; i++)
            headerIndex[headers[i]] = i;

        // 校验必填列是否存在
        foreach (var required in CsvRequiredHeaders)
        {
            if (!headerIndex.ContainsKey(required))
            {
                result.Errors.Add(new ImportErrorItem
                {
                    RowNumber = 1,
                    Message = $"缺少必填列: {required}",
                    RawContent = lines[0]
                });
                return result;
            }
        }

        result.TotalRows = lines.Length - 1;

        // 逐行解析数据
        for (var i = 1; i < lines.Length; i++)
        {
            var rowNumber = i + 1;
            var fields = ParseCsvLine(lines[i]);

            // 校验必填字段
            var deviceType = GetFieldValue(fields, headerIndex, "device_type");
            var name = GetFieldValue(fields, headerIndex, "name");
            var conditions = GetFieldValue(fields, headerIndex, "conditions") ?? "[]";
            var conclusion = GetFieldValue(fields, headerIndex, "conclusion");

            if (string.IsNullOrWhiteSpace(deviceType) || string.IsNullOrWhiteSpace(name))
            {
                result.Errors.Add(new ImportErrorItem
                {
                    RowNumber = rowNumber,
                    Message = "必填字段缺失 (device_type, name)",
                    RawContent = lines[i].Trim()
                });
                continue;
            }

            if (string.IsNullOrWhiteSpace(conclusion))
            {
                result.Errors.Add(new ImportErrorItem
                {
                    RowNumber = rowNumber,
                    Message = "必填字段缺失 (conclusion)",
                    RawContent = lines[i].Trim()
                });
                continue;
            }

            // 解析置信度权重
            var confidenceWeightStr = GetFieldValue(fields, headerIndex, "confidence_weight");
            var confidenceWeight = 0.5m;
            if (!string.IsNullOrWhiteSpace(confidenceWeightStr))
            {
                if (!decimal.TryParse(confidenceWeightStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var cw)
                    || cw < 0 || cw > 1)
                {
                    result.Errors.Add(new ImportErrorItem
                    {
                        RowNumber = rowNumber,
                        Message = $"confidence_weight 格式错误或超出范围 [0,1]: {confidenceWeightStr}",
                        RawContent = lines[i].Trim()
                    });
                    continue;
                }
                confidenceWeight = cw;
            }

            result.ValidItems.Add(new ImportPreviewItem
            {
                RowNumber = rowNumber,
                DeviceType = deviceType,
                Name = name,
                Conditions = conditions,
                Conclusion = conclusion,
                RecommendedActions = GetFieldValue(fields, headerIndex, "recommended_actions"),
                CheckSteps = GetFieldValue(fields, headerIndex, "check_steps"),
                ConfidenceWeight = confidenceWeight
            });
        }

        return result;
    }

    /// <summary>
    /// 预览 JSON 文件内容
    /// JSON 格式：数组，每个元素包含 deviceType, name, conditions, conclusion 等字段
    /// </summary>
    private static ImportPreviewResult PreviewJson(string content)
    {
        var result = new ImportPreviewResult();

        try
        {
            var items = JsonSerializer.Deserialize<List<JsonElement>>(content);
            if (items is null || items.Count == 0)
            {
                result.Errors.Add(new ImportErrorItem { RowNumber = 0, Message = "JSON 数组为空" });
                return result;
            }

            result.TotalRows = items.Count;

            for (var i = 0; i < items.Count; i++)
            {
                var rowNumber = i + 1;
                var item = items[i];

                // 字段名兼容 snake_case 和 camelCase
                var deviceType = GetJsonString(item, "device_type", "deviceType");
                var name = GetJsonString(item, "name");
                var conditions = GetJsonString(item, "conditions") ?? "[]";
                var conclusion = GetJsonString(item, "conclusion");

                if (string.IsNullOrWhiteSpace(deviceType) || string.IsNullOrWhiteSpace(name))
                {
                    result.Errors.Add(new ImportErrorItem
                    {
                        RowNumber = rowNumber,
                        Message = "必填字段缺失 (deviceType/device_type, name)",
                        RawContent = item.GetRawText()
                    });
                    continue;
                }

                if (string.IsNullOrWhiteSpace(conclusion))
                {
                    result.Errors.Add(new ImportErrorItem
                    {
                        RowNumber = rowNumber,
                        Message = "必填字段缺失 (conclusion)",
                        RawContent = item.GetRawText()
                    });
                    continue;
                }

                var confidenceWeight = 0.5m;
                var cwStr = GetJsonString(item, "confidence_weight", "confidenceWeight");
                if (!string.IsNullOrWhiteSpace(cwStr) &&
                    (!decimal.TryParse(cwStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var cw) || cw < 0 || cw > 1))
                {
                    result.Errors.Add(new ImportErrorItem
                    {
                        RowNumber = rowNumber,
                        Message = $"confidenceWeight 格式错误或超出范围 [0,1]: {cwStr}",
                        RawContent = item.GetRawText()
                    });
                    continue;
                }
                else if (!string.IsNullOrWhiteSpace(cwStr))
                {
                    confidenceWeight = decimal.Parse(cwStr, NumberStyles.Any, CultureInfo.InvariantCulture);
                }

                result.ValidItems.Add(new ImportPreviewItem
                {
                    RowNumber = rowNumber,
                    DeviceType = deviceType,
                    Name = name,
                    Conditions = conditions,
                    Conclusion = conclusion!,
                    RecommendedActions = GetJsonString(item, "recommended_actions", "recommendedActions"),
                    CheckSteps = GetJsonString(item, "check_steps", "checkSteps"),
                    ConfidenceWeight = confidenceWeight
                });
            }
        }
        catch (JsonException ex)
        {
            result.Errors.Add(new ImportErrorItem
            {
                RowNumber = 0,
                Message = $"JSON 解析失败: {ex.Message}"
            });
        }

        return result;
    }

    /// <summary>
    /// 解析 CSV 一行（处理引号内的逗号）
    /// </summary>
    private static List<string> ParseCsvLine(string line)
    {
        var fields = new List<string>();
        var inQuotes = false;
        var current = new StringBuilder();

        foreach (var ch in line)
        {
            if (ch == '"')
            {
                inQuotes = !inQuotes;
            }
            else if (ch == ',' && !inQuotes)
            {
                fields.Add(current.ToString().Trim());
                current.Clear();
            }
            else
            {
                current.Append(ch);
            }
        }

        fields.Add(current.ToString().Trim());
        return fields;
    }

    /// <summary>
    /// 获取 CSV 字段值（安全索引访问）
    /// </summary>
    private static string? GetFieldValue(List<string> fields, Dictionary<string, int> headerIndex, string columnName)
    {
        if (!headerIndex.TryGetValue(columnName, out var index) || index >= fields.Count)
            return null;
        return fields[index];
    }

    /// <summary>
    /// 获取 JSON 字符串字段（支持多个候选字段名）
    /// </summary>
    private static string? GetJsonString(JsonElement element, params string[] fieldNames)
    {
        foreach (var name in fieldNames)
        {
            if (element.TryGetProperty(name, out var prop))
            {
                return prop.ValueKind == JsonValueKind.String ? prop.GetString() : prop.GetRawText();
            }
        }
        return null;
    }

    /// <summary>
    /// CSV 字段转义（处理逗号、引号、换行）
    /// </summary>
    private static string EscapeCsvField(string field)
    {
        if (string.IsNullOrEmpty(field))
            return "";

        if (field.Contains(',') || field.Contains('"') || field.Contains('\n') || field.Contains('\r'))
            return $"\"{field.Replace("\"", "\"\"")}\"";

        return field;
    }
}
```

- [ ] **Step 4: 注册 KnowledgeImportService 到 DI**

在 `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs` 中添加：

```csharp
builder.Services.AddScoped<KnowledgeImportService>();
```

- [ ] **Step 5: 单元测试 — KnowledgeImportService**

创建 `tests/EquipAI.Tests.Unit/Knowledge/KnowledgeImportServiceTests.cs`：

```csharp
// 测试用例清单：
// 1. PreviewImport_当CSV格式正确时_应返回有效预览项
// 2. PreviewImport_当CSV缺少必填列时_应返回错误
// 3. PreviewImport_当CSV某行缺少必填字段时_应标记该行为错误
// 4. PreviewImport_当JSON格式正确时_应返回有效预览项
// 5. PreviewImport_当JSON字段名为camelCase时_应兼容解析
// 6. PreviewImport_当JSON解析失败时_应返回解析错误
// 7. PreviewImport_当confidenceWeight超出范围时_应返回错误
// 8. PreviewImport_当文件内容为空时_应抛出ArgumentException
// 9. ExportAsCsvAsync_应生成包含表头和数据的CSV
// 10. ExportAsJsonAsync_应生成格式化的JSON数组
// 11. ImportIndustryPresetAsync_应跳过已存在的同名规则
// 12. ParseCsvLine_当字段包含引号和逗号时_应正确解析
```

测试使用 InMemoryDatabase，构建 CSV/JSON 测试数据验证解析和校验逻辑。

---

### Task 3: KnowledgeController 增强 (CRUD + toggle + export + import + 版本 API)

**Files:**
- Modify: `src/EquipAI.WebAPI/Controllers/KnowledgeController.cs` — 新增多个端点

- [ ] **Step 1: 注入新依赖**

在 `KnowledgeController` 构造函数中添加 `KnowledgeImportService` 和 `KnowledgeVersionService` 参数：

```csharp
    private readonly KnowledgeImportService _importService;
    private readonly KnowledgeVersionService _versionService;

    public KnowledgeController(
        AppDbContext dbContext,
        KnowledgeCaptureService captureService,
        ITenantContext tenantContext,
        KnowledgeImportService importService,
        KnowledgeVersionService versionService)
    {
        _dbContext = dbContext;
        _captureService = captureService;
        _tenantContext = tenantContext;
        _importService = importService;
        _versionService = versionService;
    }
```

- [ ] **Step 2: 新增 PUT /rules/{id} — 编辑规则**

在 `CreateRule` 方法之后添加。编辑前先创建版本快照。

```csharp
    /// <summary>
    /// 编辑正式知识规则
    /// 修改前自动保存版本快照，支持版本回滚
    /// </summary>
    /// <param name="id">规则 ID</param>
    /// <param name="request">编辑请求（仅非空字段会被更新）</param>
    /// <returns>更新后的规则信息</returns>
    [HttpPut("rules/{id:guid}")]
    [RequirePermission("knowledge:update")]
    [ProducesResponseType(typeof(KnowledgeRuleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<KnowledgeRuleResponse>> UpdateRule(
        Guid id, [FromBody] UpdateKnowledgeRuleRequest request)
    {
        var rule = await _dbContext.KnowledgeRules.FindAsync([id]);
        if (rule is null)
            return NotFound(new { code = 404, message = "规则不存在" });

        // 编辑前创建版本快照
        await _versionService.CreateVersionSnapshotAsync(
            rule, _tenantContext.UserId, request.ChangeSummary, HttpContext.RequestAborted);

        // 仅更新非空字段
        if (!string.IsNullOrWhiteSpace(request.Name))
            rule.Name = request.Name;
        if (!string.IsNullOrWhiteSpace(request.DeviceType))
            rule.DeviceType = request.DeviceType;
        if (!string.IsNullOrWhiteSpace(request.Conditions))
            rule.Conditions = request.Conditions;
        if (!string.IsNullOrWhiteSpace(request.Conclusion))
            rule.Conclusion = request.Conclusion;
        if (request.RecommendedActions is not null)
            rule.RecommendedActions = request.RecommendedActions;
        if (request.CheckSteps is not null)
            rule.CheckSteps = request.CheckSteps;
        if (request.ConfidenceWeight.HasValue)
            rule.ConfidenceWeight = request.ConfidenceWeight.Value;

        rule.Version++;

        await _dbContext.SaveChangesAsync(HttpContext.RequestAborted);

        return Ok(MapToRuleResponse(rule));
    }
```

- [ ] **Step 3: 新增 PATCH /rules/{id}/toggle — 启用/禁用**

```csharp
    /// <summary>
    /// 切换规则启用/禁用状态
    /// </summary>
    /// <param name="id">规则 ID</param>
    /// <returns>更新后的规则信息</returns>
    [HttpPatch("rules/{id:guid}/toggle")]
    [RequirePermission("knowledge:update")]
    [ProducesResponseType(typeof(KnowledgeRuleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<KnowledgeRuleResponse>> ToggleRule(Guid id)
    {
        var rule = await _dbContext.KnowledgeRules.FindAsync([id]);
        if (rule is null)
            return NotFound(new { code = 404, message = "规则不存在" });

        rule.Enabled = !rule.Enabled;
        await _dbContext.SaveChangesAsync(HttpContext.RequestAborted);

        return Ok(MapToRuleResponse(rule));
    }
```

- [ ] **Step 4: 新增 POST /rules/import — CSV/JSON 批量导入**

替换现有的简单 `ImportRules` 方法，改为支持文件上传和预览。

```csharp
    /// <summary>
    /// 批量导入知识规则（CSV 或 JSON 格式）
    /// 支持 preview=true 参数进行预览校验，不写入数据库
    /// </summary>
    /// <param name="file">上传的文件（CSV 或 JSON）</param>
    /// <param name="preview">是否仅预览（不写入数据库）</param>
    /// <returns>预览结果或导入结果</returns>
    [HttpPost("rules/import")]
    [RequirePermission("knowledge:create")]
    [ProducesResponseType(typeof(ImportPreviewResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ImportResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ImportRules(
        IFormFile file, [FromQuery] bool preview = false)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { code = 400, message = "请上传文件" });

        if (file.Length > 5 * 1024 * 1024) // 5MB 限制
            return BadRequest(new { code = 400, message = "文件大小不能超过 5MB" });

        var fileName = file.FileName;
        if (!fileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase)
            && !fileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { code = 400, message = "仅支持 CSV 和 JSON 格式" });
        }

        using var reader = new StreamReader(file.OpenReadStream());
        var content = await reader.ReadToEndAsync();

        if (preview)
        {
            var previewResult = _importService.PreviewImport(content, fileName);
            return Ok(previewResult);
        }

        var result = await _importService.ExecuteImportAsync(
            content, fileName, _tenantContext.TenantId, _tenantContext.UserId,
            HttpContext.RequestAborted);

        return Ok(result);
    }
```

- [ ] **Step 5: 新增 GET /rules/export — 批量导出**

```csharp
    /// <summary>
    /// 批量导出知识规则
    /// </summary>
    /// <param name="format">导出格式（csv 或 json，默认 json）</param>
    /// <param name="deviceType">可选：按设备类型过滤</param>
    /// <returns>文件下载</returns>
    [HttpGet("rules/export")]
    [RequirePermission("knowledge:read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportRules(
        [FromQuery] string format = "json",
        [FromQuery] string? deviceType = null)
    {
        var tenantId = _tenantContext.TenantId;

        if (format.Equals("csv", StringComparison.OrdinalIgnoreCase))
        {
            var csv = await _importService.ExportAsCsvAsync(tenantId, deviceType, HttpContext.RequestAborted);
            var bytes = System.Text.Encoding.UTF8.GetBytes(csv);
            return File(bytes, "text/csv", $"knowledge_rules_{DateTime.UtcNow:yyyyMMdd}.csv");
        }

        var json = await _importService.ExportAsJsonAsync(tenantId, deviceType, HttpContext.RequestAborted);
        var jsonBytes = System.Text.Encoding.UTF8.GetBytes(json);
        return File(jsonBytes, "application/json", $"knowledge_rules_{DateTime.UtcNow:yyyyMMdd}.json");
    }
```

- [ ] **Step 6: 新增 PUT /rules/preset-import — 行业预置一键导入**

替换旧的 `ImportRules` 方法（接受 JSON body 的那个），改为调用 KnowledgeImportService：

```csharp
    /// <summary>
    /// 一键导入行业预置知识规则
    /// 自动跳过当前租户已存在的同名规则
    /// </summary>
    /// <returns>导入结果</returns>
    [HttpPost("rules/preset-import")]
    [RequirePermission("knowledge:create")]
    [ProducesResponseType(typeof(ImportResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<ImportResult>> ImportPresetRules()
    {
        var result = await _importService.ImportIndustryPresetAsync(
            _tenantContext.TenantId, _tenantContext.UserId, HttpContext.RequestAborted);
        return Ok(result);
    }
```

- [ ] **Step 7: 新增 GET /rules/{id}/versions — 版本历史**

```csharp
    /// <summary>
    /// 获取规则的版本历史
    /// 按版本号降序返回所有历史版本快照
    /// </summary>
    /// <param name="id">规则 ID</param>
    /// <returns>版本历史列表</returns>
    [HttpGet("rules/{id:guid}/versions")]
    [RequirePermission("knowledge:read")]
    [ProducesResponseType(typeof(List<KnowledgeRuleVersionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<KnowledgeRuleVersionDto>>> GetRuleVersions(Guid id)
    {
        var rule = await _dbContext.KnowledgeRules.FindAsync([id]);
        if (rule is null)
            return NotFound(new { code = 404, message = "规则不存在" });

        var versions = await _versionService.GetVersionHistoryAsync(id, HttpContext.RequestAborted);
        return Ok(versions);
    }
```

- [ ] **Step 8: 新增 POST /rules/{id}/rollback — 回滚到指定版本**

```csharp
    /// <summary>
    /// 回滚规则到指定版本
    /// 回滚前自动保存当前状态为快照
    /// </summary>
    /// <param name="id">规则 ID</param>
    /// <param name="version">目标版本号</param>
    /// <returns>回滚后的规则信息</returns>
    [HttpPost("rules/{id:guid}/rollback")]
    [RequirePermission("knowledge:update")]
    [ProducesResponseType(typeof(KnowledgeRuleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<KnowledgeRuleResponse>> RollbackRule(
        Guid id, [FromQuery] int version)
    {
        if (version < 1)
            return BadRequest(new { code = 400, message = "版本号必须大于 0" });

        try
        {
            var rule = await _versionService.RollbackToVersionAsync(
                id, version, _tenantContext.UserId, HttpContext.RequestAborted);
            return Ok(MapToRuleResponse(rule));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { code = 404, message = ex.Message });
        }
    }
```

- [ ] **Step 9: 更新 KnowledgeRuleResponse DTO — 新增 Version 字段**

在 `KnowledgeRuleResponse` 类中添加：

```csharp
        /// <summary>当前版本号</summary>
        public int Version { get; set; }
```

同时更新 `MapToRuleResponse` 方法：

```csharp
    private static KnowledgeRuleResponse MapToRuleResponse(Core.Entities.KnowledgeRule rule) => new()
    {
        Id = rule.Id,
        DeviceType = rule.DeviceType,
        Name = rule.Name,
        Conditions = rule.Conditions,
        Conclusion = rule.Conclusion,
        RecommendedActions = rule.RecommendedActions,
        CheckSteps = rule.CheckSteps,
        ConfidenceWeight = rule.ConfidenceWeight,
        Source = rule.Source,
        AccuracyRate = rule.AccuracyRate,
        SuccessCount = rule.SuccessCount,
        Enabled = rule.Enabled,
        CreatedBy = rule.CreatedBy,
        CreatedAt = rule.CreatedAt,
        Version = rule.Version          // 新增
    };
```

- [ ] **Step 10: 删除旧的 ImportRules 方法**

删除旧的 `[HttpPost("import")]` + `List<CreateKnowledgeRuleRequest>` 参数的 `ImportRules` 方法（已被 Task 4 的文件上传版本替代）。保留 `BatchImportResponse` 类可删除或标记 `[Obsolete]`。

- [ ] **Step 11: 添加必要的 using**

在 `KnowledgeController.cs` 顶部添加：

```csharp
using EquipAI.Application.Knowledge;
using EquipAI.Application.Knowledge.DTOs;
```

- [ ] **Step 12: 集成测试 — KnowledgeController 新端点**

创建 `tests/EquipAI.Tests.Integration/Controllers/KnowledgeControllerTests.cs`：

```csharp
// 测试用例清单：
// 1. UpdateRule_当规则存在时_应更新字段并递增版本号
// 2. UpdateRule_当规则不存在时_应返回404
// 3. ToggleRule_应切换启用状态
// 4. ImportRules_当preview=true时_应返回预览结果不写入数据库
// 5. ImportRules_当preview=false时_应写入数据库返回导入结果
// 6. ImportRules_当文件格式不支持时_应返回400
// 7. ExportRules_当format=csv时_应返回CSV文件
// 8. ExportRules_当format=json时_应返回JSON文件
// 9. GetRuleVersions_应返回版本历史列表
// 10. RollbackRule_应恢复规则到指定版本
// 11. RollbackRule_当目标版本不存在时_应返回404
// 12. ImportPresetRules_应跳过已存在的同名规则
```

使用 `CustomWebApplicationFactory` + `SharedTestCollection` 模式（参照项目已有的集成测试）。

---

### Task 4: 前端 — 规则编辑对话框 + 导入导出工具栏

**Files:**
- Create: `frontend/src/components/knowledge/RuleEditDialog.tsx`
- Create: `frontend/src/components/knowledge/ConditionEditor.tsx`
- Create: `frontend/src/components/knowledge/ImportExportToolbar.tsx`
- Create: `frontend/src/components/knowledge/ImportPreviewDialog.tsx`
- Modify: `frontend/src/types/index.ts` — 新增类型
- Modify: `frontend/src/hooks/useKnowledge.ts` — 新增 hooks
- Modify: `frontend/src/pages/KnowledgePage.tsx` — 集成新组件

- [ ] **Step 1: 扩展 types/index.ts**

在知识库类型区域末尾添加：

```typescript
/** 知识规则版本快照 */
export interface KnowledgeRuleVersion {
  /** 版本记录 ID */
  id: string;
  /** 关联规则 ID */
  ruleId: string;
  /** 版本号 */
  version: number;
  /** 规则快照（JSON 字符串） */
  snapshot: string;
  /** 变更人 ID */
  changedBy?: string;
  /** 变更摘要 */
  changeSummary?: string;
  /** 创建时间（ISO 8601） */
  createdAt: string;
}

/** 导入预览项 */
export interface ImportPreviewItem {
  /** 行号 */
  rowNumber: number;
  /** 设备类型 */
  deviceType: string;
  /** 规则名称 */
  name: string;
  /** 触发条件 */
  conditions: string;
  /** 结论 */
  conclusion: string;
  /** 推荐措施 */
  recommendedActions?: string;
  /** 检查步骤 */
  checkSteps?: string;
  /** 置信度权重 */
  confidenceWeight: number;
}

/** 导入错误项 */
export interface ImportErrorItem {
  /** 行号 */
  rowNumber: number;
  /** 错误信息 */
  message: string;
  /** 原始内容 */
  rawContent?: string;
}

/** 导入预览结果 */
export interface ImportPreviewResult {
  /** 有效项 */
  validItems: ImportPreviewItem[];
  /** 错误项 */
  errors: ImportErrorItem[];
  /** 总行数 */
  totalRows: number;
  /** 有效行数 */
  validCount: number;
  /** 错误行数 */
  errorCount: number;
}

/** 批量导入结果 */
export interface ImportResult {
  /** 成功导入数量 */
  imported: number;
  /** 跳过数量 */
  skipped: number;
  /** 失败数量 */
  failed: number;
  /** 失败详情 */
  errors: ImportErrorItem[];
}

/** 编辑知识规则请求 */
export interface UpdateKnowledgeRuleRequest {
  /** 规则名称 */
  name?: string;
  /** 设备类型 */
  deviceType?: string;
  /** 触发条件 */
  conditions?: string;
  /** 结论 */
  conclusion?: string;
  /** 推荐措施 */
  recommendedActions?: string;
  /** 检查步骤 */
  checkSteps?: string;
  /** 置信度权重 */
  confidenceWeight?: number;
  /** 变更摘要 */
  changeSummary?: string;
}

/** 条件项（用于条件编辑器的表单结构） */
export interface ConditionItem {
  /** 指标名称 */
  metric: string;
  /** 比较运算符 */
  operator: string;
  /** 阈值 */
  threshold: number;
}
```

同时在 `KnowledgeRule` 接口中添加 `version` 字段：

```typescript
  /** 当前版本号 */
  version: number;
```

- [ ] **Step 2: 扩展 useKnowledge.ts — 新增 hooks**

在文件末尾添加：

```typescript
// ============================================================================
// 规则编辑 + 启用禁用
// ============================================================================

/**
 * 编辑知识规则 Mutation Hook
 *
 * 修改前自动创建版本快照，成功后使规则列表缓存失效。
 */
export function useUpdateKnowledgeRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...request }: { id: string } & UpdateKnowledgeRuleRequest) => {
      const { data } = await api.put<KnowledgeRule>(`/knowledge/rules/${id}`, request);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-rules'] });
    },
  });
}

/**
 * 切换规则启用/禁用状态 Mutation Hook
 */
export function useToggleKnowledgeRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch<KnowledgeRule>(`/knowledge/rules/${id}/toggle`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-rules'] });
    },
  });
}

// ============================================================================
// 导入导出
// ============================================================================

/**
 * 导入预览 Mutation Hook — 上传文件并获取校验结果（不写入数据库）
 */
export function useImportPreview() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<ImportPreviewResult>(
        '/knowledge/rules/import?preview=true',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data;
    },
  });
}

/**
 * 执行导入 Mutation Hook — 上传文件并写入数据库
 */
export function useImportRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<ImportResult>(
        '/knowledge/rules/import',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-rules'] });
    },
  });
}

/**
 * 导出规则 Hook — 下载文件
 */
export function useExportRules() {
  return useMutation({
    mutationFn: async ({ format, deviceType }: { format: 'csv' | 'json'; deviceType?: string }) => {
      const params = new URLSearchParams({ format });
      if (deviceType) params.set('deviceType', deviceType);
      const response = await api.get(`/knowledge/rules/export?${params}`, {
        responseType: 'blob',
      });
      // 触发浏览器下载
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `knowledge_rules_${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
  });
}

/**
 * 行业预置一键导入 Mutation Hook（替换旧的 useImportPresetData）
 */
export function useImportPresetRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ImportResult>('/knowledge/rules/preset-import');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-rules'] });
    },
  });
}

// ============================================================================
// 版本管理
// ============================================================================

/**
 * 规则版本历史查询 Hook
 */
export function useRuleVersions(ruleId: string | null) {
  return useQuery({
    queryKey: ['knowledge-rule-versions', ruleId],
    queryFn: async () => {
      const { data } = await api.get<KnowledgeRuleVersion[]>(
        `/knowledge/rules/${ruleId}/versions`,
      );
      return data;
    },
    enabled: !!ruleId,
  });
}

/**
 * 回滚规则到指定版本 Mutation Hook
 */
export function useRollbackRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ruleId, version }: { ruleId: string; version: number }) => {
      const { data } = await api.post<KnowledgeRule>(
        `/knowledge/rules/${ruleId}/rollback?version=${version}`,
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-rules'] });
      queryClient.invalidateQueries({
        queryKey: ['knowledge-rule-versions', variables.ruleId],
      });
    },
  });
}
```

- [ ] **Step 3: 创建 ConditionEditor 组件**

条件编辑器将 JSON 格式的条件数组转换为可编辑的表单字段。

```tsx
// frontend/src/components/knowledge/ConditionEditor.tsx
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { ConditionItem } from '../../types';

/** 支持的比较运算符 */
const OPERATORS = [
  { value: '>', label: '> 大于' },
  { value: '>=', label: '>= 大于等于' },
  { value: '<', label: '< 小于' },
  { value: '<=', label: '<= 小于等于' },
  { value: '==', label: '== 等于' },
  { value: '!=', label: '!= 不等于' },
];

interface ConditionEditorProps {
  /** 条件列表 */
  conditions: ConditionItem[];
  /** 条件变更回调 */
  onChange: (conditions: ConditionItem[]) => void;
}

/**
 * 条件编辑器组件
 *
 * 将 JSON 条件数组转换为可编辑的表单字段。
 * 每个条件包含指标名、运算符和阈值，支持动态增删。
 */
export function ConditionEditor({ conditions, onChange }: ConditionEditorProps) {
  /** 添加一条空条件 */
  const handleAdd = () => {
    onChange([...conditions, { metric: '', operator: '>', threshold: 0 }]);
  };

  /** 删除指定索引的条件 */
  const handleRemove = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  /** 更新指定索引条件的某个字段 */
  const handleUpdate = (index: number, field: keyof ConditionItem, value: string | number) => {
    const updated = conditions.map((c, i) =>
      i === index ? { ...c, [field]: value } : c,
    );
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {conditions.map((condition, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={condition.metric}
            onChange={(e) => handleUpdate(index, 'metric', e.target.value)}
            placeholder="指标名"
            className="flex-1"
          />
          <Select
            value={condition.operator}
            onValueChange={(v) => handleUpdate(index, 'operator', v ?? '>')}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATORS.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={condition.threshold}
            onChange={(e) => handleUpdate(index, 'threshold', parseFloat(e.target.value) || 0)}
            placeholder="阈值"
            className="w-24"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleRemove(index)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
        <Plus className="mr-1 h-4 w-4" />
        添加条件
      </Button>
    </div>
  );
}

/** 将 JSON 字符串解析为 ConditionItem 数组 */
export function parseConditions(json: string): ConditionItem[] {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

/** 将 ConditionItem 数组序列化为 JSON 字符串 */
export function serializeConditions(conditions: ConditionItem[]): string {
  return JSON.stringify(conditions);
}
```

- [ ] **Step 4: 创建 RuleEditDialog 组件**

```tsx
// frontend/src/components/knowledge/RuleEditDialog.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '../ui/dialog';
import {
  ConditionEditor,
  parseConditions,
  serializeConditions,
} from './ConditionEditor';
import { useUpdateKnowledgeRule } from '../../hooks/useKnowledge';
import type { KnowledgeRule, ConditionItem } from '../../types';

interface RuleEditDialogProps {
  rule: KnowledgeRule;
  children?: React.ReactNode;
}

/**
 * 规则编辑对话框
 *
 * 支持编辑规则名称、设备类型、条件（可视化编辑器）、
 * 结论、推荐措施、检查步骤和置信度权重。
 * 修改后自动创建版本快照。
 */
export function RuleEditDialog({ rule, children }: RuleEditDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const updateRule = useUpdateKnowledgeRule();

  // 表单状态
  const [name, setName] = useState(rule.name);
  const [deviceType, setDeviceType] = useState(rule.deviceType);
  const [conditions, setConditions] = useState<ConditionItem[]>([]);
  const [conclusion, setConclusion] = useState(rule.conclusion);
  const [recommendedActions, setRecommendedActions] = useState(rule.recommendedActions ?? '');
  const [checkSteps, setCheckSteps] = useState(rule.checkSteps ?? '');
  const [confidenceWeight, setConfidenceWeight] = useState(rule.confidenceWeight);
  const [changeSummary, setChangeSummary] = useState('');

  // 打开对话框时初始化表单
  useEffect(() => {
    if (open) {
      setName(rule.name);
      setDeviceType(rule.deviceType);
      setConditions(parseConditions(rule.conditions));
      setConclusion(rule.conclusion);
      setRecommendedActions(rule.recommendedActions ?? '');
      setCheckSteps(rule.checkSteps ?? '');
      setConfidenceWeight(rule.confidenceWeight);
      setChangeSummary('');
    }
  }, [open, rule]);

  /** 提交编辑 */
  const handleSubmit = () => {
    updateRule.mutate(
      {
        id: rule.id,
        name: name !== rule.name ? name : undefined,
        deviceType: deviceType !== rule.deviceType ? deviceType : undefined,
        conditions: serializeConditions(conditions),
        conclusion: conclusion !== rule.conclusion ? conclusion : undefined,
        recommendedActions: recommendedActions || undefined,
        checkSteps: checkSteps || undefined,
        confidenceWeight: confidenceWeight !== rule.confidenceWeight ? confidenceWeight : undefined,
        changeSummary: changeSummary || undefined,
      },
      {
        onSuccess: () => setOpen(false),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('knowledge.editRule', { defaultValue: '编辑规则' })}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 规则名称 */}
          <div>
            <Label>{t('knowledge.ruleName', { defaultValue: '规则名称' })}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>

          {/* 设备类型 */}
          <div>
            <Label>{t('knowledge.deviceType', { defaultValue: '设备类型' })}</Label>
            <Input value={deviceType} onChange={(e) => setDeviceType(e.target.value)} className="mt-1" />
          </div>

          {/* 条件编辑器 */}
          <div>
            <Label>{t('knowledge.conditions', { defaultValue: '触发条件' })}</Label>
            <div className="mt-1">
              <ConditionEditor conditions={conditions} onChange={setConditions} />
            </div>
          </div>

          {/* 结论 */}
          <div>
            <Label>{t('knowledge.conclusion', { defaultValue: '诊断结论' })}</Label>
            <Textarea value={conclusion} onChange={(e) => setConclusion(e.target.value)} rows={2} className="mt-1" />
          </div>

          {/* 推荐措施 */}
          <div>
            <Label>{t('knowledge.recommendedActions', { defaultValue: '推荐措施' })}</Label>
            <Textarea value={recommendedActions} onChange={(e) => setRecommendedActions(e.target.value)} rows={2} className="mt-1" />
          </div>

          {/* 检查步骤 */}
          <div>
            <Label>{t('knowledge.checkSteps', { defaultValue: '检查步骤' })}</Label>
            <Textarea value={checkSteps} onChange={(e) => setCheckSteps(e.target.value)} rows={2} className="mt-1" />
          </div>

          {/* 置信度权重 */}
          <div>
            <Label>{t('knowledge.confidenceWeight', { defaultValue: '置信度权重' })}</Label>
            <Input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={confidenceWeight}
              onChange={(e) => setConfidenceWeight(parseFloat(e.target.value) || 0.5)}
              className="mt-1 w-32"
            />
          </div>

          {/* 变更摘要 */}
          <div>
            <Label>{t('knowledge.changeSummary', { defaultValue: '变更说明（可选）' })}</Label>
            <Input
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              placeholder={t('knowledge.changeSummaryPlaceholder', { defaultValue: '简要描述本次修改内容' })}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t('common.cancel', { defaultValue: '取消' })}</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={updateRule.isPending}>
            {updateRule.isPending ? t('common.loading', { defaultValue: '保存中...' }) : t('common.save', { defaultValue: '保存' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 5: 创建 ImportPreviewDialog 组件**

```tsx
// frontend/src/components/knowledge/ImportPreviewDialog.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle2, FileUp } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { useImportRules } from '../../hooks/useKnowledge';
import type { ImportPreviewResult, ImportResult } from '../../types';

interface ImportPreviewDialogProps {
  /** 是否显示对话框 */
  open: boolean;
  /** 关闭对话框回调 */
  onOpenChange: (open: boolean) => void;
  /** 预览结果 */
  preview: ImportPreviewResult;
  /** 待导入的文件 */
  file: File;
}

/**
 * 导入预览对话框
 *
 * 显示导入文件校验后的预览结果：
 * - 有效数据列表
 * - 校验错误列表
 * - 确认导入按钮
 */
export function ImportPreviewDialog({
  open,
  onOpenChange,
  preview,
  file,
}: ImportPreviewDialogProps) {
  const { t } = useTranslation();
  const importRules = useImportRules();
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  /** 执行导入 */
  const handleImport = () => {
    importRules.mutate(file, {
      onSuccess: (result) => {
        setImportResult(result);
      },
    });
  };

  const isImported = importResult !== null;

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) setImportResult(null);
      onOpenChange(v);
    }}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            {t('knowledge.importPreview', { defaultValue: '导入预览' })}
          </DialogTitle>
        </DialogHeader>

        {isImported ? (
          /* 导入结果 */
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>{t('knowledge.importSuccess', { defaultValue: '导入成功' })}: {importResult.imported}</span>
              </div>
              {importResult.skipped > 0 && (
                <Badge variant="secondary">
                  {t('knowledge.skipped', { defaultValue: '跳过' })}: {importResult.skipped}
                </Badge>
              )}
              {importResult.failed > 0 && (
                <Badge variant="destructive">
                  {t('knowledge.failed', { defaultValue: '失败' })}: {importResult.failed}
                </Badge>
              )}
            </div>
            {importResult.errors.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">错误详情：</p>
                {importResult.errors.map((err, i) => (
                  <p key={i} className="text-sm text-muted-foreground">
                    行 {err.rowNumber}: {err.message}
                  </p>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* 预览信息 */
          <div className="space-y-4">
            {/* 统计摘要 */}
            <div className="flex items-center gap-4">
              <Badge variant="default">
                {t('knowledge.totalRows', { defaultValue: '总行数' })}: {preview.totalRows}
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {t('knowledge.valid', { defaultValue: '有效' })}: {preview.validCount}
              </Badge>
              {preview.errorCount > 0 && (
                <Badge variant="destructive">
                  {t('knowledge.errors', { defaultValue: '错误' })}: {preview.errorCount}
                </Badge>
              )}
            </div>

            {/* 有效数据预览 */}
            {preview.validItems.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">
                  {t('knowledge.validData', { defaultValue: '有效数据预览' })}:
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {preview.validItems.map((item) => (
                    <div key={item.rowNumber} className="text-sm flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">行 {item.rowNumber}</Badge>
                      <span>{item.deviceType} - {item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 错误列表 */}
            {preview.errors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-destructive mb-2 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {t('knowledge.errorDetails', { defaultValue: '错误详情' })}:
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {preview.errors.map((err, i) => (
                    <div key={i} className="text-sm text-muted-foreground">
                      <Badge variant="destructive" className="text-xs mr-1">行 {err.rowNumber}</Badge>
                      {err.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">
              {isImported ? t('common.close', { defaultValue: '关闭' }) : t('common.cancel', { defaultValue: '取消' })}
            </Button>
          </DialogClose>
          {!isImported && (
            <Button
              onClick={handleImport}
              disabled={importRules.isPending || preview.validCount === 0}
            >
              {importRules.isPending
                ? t('common.importing', { defaultValue: '导入中...' })
                : `${t('knowledge.confirmImport', { defaultValue: '确认导入' })} (${preview.validCount})`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 6: 创建 ImportExportToolbar 组件**

```tsx
// frontend/src/components/knowledge/ImportExportToolbar.tsx
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileUp, FileDown, Database } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  useImportPreview,
  useExportRules,
  useImportPresetRules,
} from '../../hooks/useKnowledge';
import { ImportPreviewDialog } from './ImportPreviewDialog';
import type { ImportPreviewResult } from '../../types';

interface ImportExportToolbarProps {
  /** 可选：按设备类型过滤导出 */
  deviceType?: string;
}

/**
 * 导入导出工具栏
 *
 * 提供：
 * - 文件导入（CSV/JSON）+ 预览
 * - 文件导出（CSV/JSON）
 * - 行业预置一键导入
 */
export function ImportExportToolbar({ deviceType }: ImportExportToolbarProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importPreview = useImportPreview();
  const exportRules = useExportRules();
  const importPreset = useImportPresetRules();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewResult, setPreviewResult] = useState<ImportPreviewResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  /** 处理文件选择 */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    importPreview.mutate(file, {
      onSuccess: (result) => {
        setPreviewResult(result);
        setShowPreview(true);
      },
    });

    // 重置 input，允许再次选择同一文件
    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-2">
      {/* 导入按钮 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json"
        className="hidden"
        onChange={handleFileSelect}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={importPreview.isPending}
      >
        <FileUp className="mr-2 h-4 w-4" />
        {importPreview.isPending
          ? t('knowledge.parsing', { defaultValue: '解析中...' })
          : t('knowledge.importFile', { defaultValue: '导入文件' })}
      </Button>

      {/* 导出下拉菜单 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            {t('knowledge.export', { defaultValue: '导出' })}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => exportRules.mutate({ format: 'json', deviceType })}>
            <FileDown className="mr-2 h-4 w-4" />
            {t('knowledge.exportJson', { defaultValue: '导出 JSON' })}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportRules.mutate({ format: 'csv', deviceType })}>
            <FileDown className="mr-2 h-4 w-4" />
            {t('knowledge.exportCsv', { defaultValue: '导出 CSV' })}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 行业预置一键导入 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => importPreset.mutate()}
        disabled={importPreset.isPending}
      >
        <Database className="mr-2 h-4 w-4" />
        {importPreset.isPending
          ? t('common.loading', { defaultValue: '导入中...' })
          : t('knowledge.importPreset', { defaultValue: '行业预置' })}
      </Button>

      {/* 导入预览对话框 */}
      {selectedFile && previewResult && (
        <ImportPreviewDialog
          open={showPreview}
          onOpenChange={setShowPreview}
          preview={previewResult}
          file={selectedFile}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 7: 创建 knowledge 目录并确认组件结构**

```bash
mkdir -p frontend/src/components/knowledge
```

- [ ] **Step 8: 修改 KnowledgePage.tsx — 集成新组件**

修改 `KnowledgePage` 的页头部分，替换现有的导入按钮为 `ImportExportToolbar`。在 `RuleCard` 中添加编辑按钮和启用/禁用切换。

```tsx
// 在 KnowledgePage.tsx 中：
// 1. 添加新的 import
import { RuleEditDialog } from '../components/knowledge/RuleEditDialog';
import { ImportExportToolbar } from '../components/knowledge/ImportExportToolbar';
import { useToggleKnowledgeRule } from '../hooks/useKnowledge';

// 2. 替换页头中的导入按钮
// 删除:
//   <Button onClick={() => importMutation.mutate()} ...>
// 替换为:
//   <ImportExportToolbar />

// 3. 在 RuleCard 中添加操作按钮
// 在 RuleCard 的 CardContent 底部（统计指标之后）添加:

function RuleCard({ rule }: RuleCardProps) {
  const { t } = useTranslation();
  const toggleRule = useToggleKnowledgeRule();

  // ... 现有的 sourceBadge 逻辑不变 ...

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{rule.name}</CardTitle>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge
              variant={rule.enabled ? 'default' : 'secondary'}
              className="cursor-pointer"
              onClick={() => toggleRule.mutate(rule.id)}
            >
              {rule.enabled ? t('knowledge.enabled') : t('knowledge.disabled')}
            </Badge>
            <Badge variant={sourceBadge.variant}>
              {sourceBadge.label}
            </Badge>
            <span className="text-xs text-muted-foreground">v{rule.version}</span>
          </div>
        </div>
        {/* ... 其余不变 ... */}
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {/* ... 条件、结论、推荐措施、统计指标区域不变 ... */}

        {/* 操作按钮 */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <RuleEditDialog rule={rule} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleRule.mutate(rule.id)}
          >
            {rule.enabled ? '禁用' : '启用'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 9: 更新 i18n 翻译文件**

在 `frontend/src/i18n/zh.json` 和 `en.json` 中添加知识库管理相关翻译键：

```json
// zh.json knowledge 区域追加:
"knowledge.editRule": "编辑规则",
"knowledge.deviceType": "设备类型",
"knowledge.ruleName": "规则名称",
"knowledge.changeSummary": "变更说明",
"knowledge.changeSummaryPlaceholder": "简要描述本次修改内容",
"knowledge.importFile": "导入文件",
"knowledge.export": "导出",
"knowledge.exportJson": "导出 JSON",
"knowledge.exportCsv": "导出 CSV",
"knowledge.parsing": "解析中...",
"knowledge.importPreview": "导入预览",
"knowledge.importSuccess": "导入成功",
"knowledge.skipped": "跳过",
"knowledge.failed": "失败",
"knowledge.totalRows": "总行数",
"knowledge.valid": "有效",
"knowledge.errors": "错误",
"knowledge.validData": "有效数据预览",
"knowledge.errorDetails": "错误详情",
"knowledge.confirmImport": "确认导入",
"knowledge.importing": "导入中...",
"knowledge.version": "版本",
"knowledge.versionHistory": "版本历史",
"knowledge.rollback": "回滚",
"knowledge.rollbackConfirm": "确认回滚到版本 {version}？",
"knowledge.noVersions": "暂无版本历史",
"knowledge.snapshot": "快照",
"knowledge.changedBy": "操作人",
"knowledge.checkSteps": "检查步骤"
```

---

### Task 5: 前端 — 版本历史面板

**Files:**
- Create: `frontend/src/components/knowledge/VersionHistoryPanel.tsx`
- Modify: `frontend/src/pages/KnowledgePage.tsx` — 在 RuleCard 中集成版本历史入口

- [ ] **Step 1: 创建 VersionHistoryPanel 组件**

```tsx
// frontend/src/components/knowledge/VersionHistoryPanel.tsx
import { useTranslation } from 'react-i18next';
import { History, RotateCcw, User } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  useRuleVersions,
  useRollbackRule,
} from '../../hooks/useKnowledge';
import type { KnowledgeRule, KnowledgeRuleVersion } from '../../types';

interface VersionHistoryPanelProps {
  /** 当前规则 */
  rule: KnowledgeRule;
}

/**
 * 版本历史面板（Sheet 抽屉形式）
 *
 * 显示规则的所有历史版本，每个版本包含：
 * - 版本号、变更摘要、变更人、时间
 * - 快照内容折叠展示
 * - 回滚操作按钮
 */
export function VersionHistoryPanel({ rule }: VersionHistoryPanelProps) {
  const { t } = useTranslation();
  const { data: versions, isLoading } = useRuleVersions(rule.id);
  const rollbackRule = useRollbackRule();

  /** 处理回滚 */
  const handleRollback = (version: number) => {
    if (!window.confirm(
      t('knowledge.rollbackConfirm', { defaultValue: `确认回滚到版本 ${version}？` }),
    )) return;

    rollbackRule.mutate(
      { ruleId: rule.id, version },
      { onSuccess: () => {} },
    );
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" title={t('knowledge.versionHistory', { defaultValue: '版本历史' })}>
          <History className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t('knowledge.versionHistory', { defaultValue: '版本历史' })}
            <Badge variant="outline" className="ml-2">
              {rule.name}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* 当前版本标记 */}
          <div className="rounded-md border bg-muted/50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="default">v{rule.version}</Badge>
                <span className="text-sm font-medium">{t('knowledge.currentVersion', { defaultValue: '当前版本' })}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* 版本历史列表 */}
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              {t('common.loading', { defaultValue: '加载中...' })}
            </div>
          ) : !versions?.length ? (
            <div className="py-8 text-center text-muted-foreground">
              {t('knowledge.noVersions', { defaultValue: '暂无版本历史' })}
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((v) => (
                <VersionItem
                  key={v.id}
                  version={v}
                  currentVersion={rule.version}
                  onRollback={handleRollback}
                  isRollingBack={rollbackRule.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** 单个版本条目 */
interface VersionItemProps {
  version: KnowledgeRuleVersion;
  currentVersion: number;
  onRollback: (version: number) => void;
  isRollingBack: boolean;
}

function VersionItem({ version, currentVersion, onRollback, isRollingBack }: VersionItemProps) {
  const { t } = useTranslation();
  const isCurrent = version.version === currentVersion;

  return (
    <div className={`rounded-md border p-3 ${isCurrent ? 'bg-primary/5 border-primary/20' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Badge variant={isCurrent ? 'default' : 'outline'}>v{version.version}</Badge>
          {version.changeSummary && (
            <span className="text-sm">{version.changeSummary}</span>
          )}
        </div>
        {!isCurrent && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRollback(version.version)}
            disabled={isRollingBack}
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            {t('knowledge.rollback', { defaultValue: '回滚' })}
          </Button>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <User className="h-3 w-3" />
          <span>{version.changedBy ?? '-'}</span>
        </div>
        <span>{new Date(version.createdAt).toLocaleString()}</span>
      </div>

      {/* 快照内容折叠展示 */}
      <details className="mt-2">
        <summary className="text-xs text-muted-foreground cursor-pointer">
          {t('knowledge.snapshot', { defaultValue: '查看快照' })}
        </summary>
        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto max-h-40">
          {JSON.stringify(JSON.parse(version.snapshot), null, 2)}
        </pre>
      </details>
    </div>
  );
}
```

- [ ] **Step 2: 在 RuleCard 中集成版本历史入口**

修改 `KnowledgePage.tsx` 中的 `RuleCard` 组件，在操作按钮区域添加版本历史按钮。

在 `RuleCard` 的操作按钮区域（编辑和启用/禁用按钮旁）添加：

```tsx
import { VersionHistoryPanel } from '../components/knowledge/VersionHistoryPanel';

// 在 RuleCard 的操作按钮区域：
<div className="flex items-center gap-2 pt-2 border-t">
  <RuleEditDialog rule={rule} />
  <Button
    variant="ghost"
    size="sm"
    onClick={() => toggleRule.mutate(rule.id)}
  >
    {rule.enabled ? '禁用' : '启用'}
  </Button>
  <VersionHistoryPanel rule={rule} />
</div>
```

- [ ] **Step 3: 前端类型安全验证**

确保以下类型和 hooks 正确关联：
1. `KnowledgeRule.version` 字段在 `RuleCard` 中显示
2. `useRuleVersions` 接收 `ruleId` 参数
3. `useRollbackRule` 的 `mutate` 参数包含 `ruleId` 和 `version`
4. `ImportExportToolbar` 的文件上传使用 `FormData`
5. `RuleEditDialog` 的 `ConditionEditor` 正确解析/序列化 JSON

运行 TypeScript 编译验证：

```bash
cd frontend
npx tsc --noEmit
```

- [ ] **Step 4: 前端单元测试 — hooks**

创建 `frontend/src/hooks/__tests__/useKnowledgeExtended.test.tsx`：

```typescript
// 测试用例清单：
// 1. useUpdateKnowledgeRule — 应调用 PUT /knowledge/rules/:id
// 2. useToggleKnowledgeRule — 应调用 PATCH /knowledge/rules/:id/toggle
// 3. useImportPreview — 应以 FormData 发送文件到 ?preview=true
// 4. useImportRules — 应以 FormData 发送文件并成功后失效缓存
// 5. useExportRules — 应触发浏览器文件下载
// 6. useRuleVersions — 应查询 GET /knowledge/rules/:id/versions
// 7. useRollbackRule — 应调用 POST /knowledge/rules/:id/rollback?version=N
// 8. parseConditions — 应正确解析 JSON 条件数组
// 9. serializeConditions — 应将条件数组序列化为 JSON
```

使用 `@tanstack/react-query` 的 `QueryClient` + `renderHook` + `msw` (Mock Service Worker) 进行测试，遵循项目现有的 hooks 测试模式。

---

## 实施顺序和依赖关系

```
Task 1 (实体+迁移) ← 无依赖，优先实施
    ↓
Task 2 (导入服务) ← 依赖 Task 1 的 KnowledgeRule.Version 字段（可选）
    ↓
Task 3 (Controller 增强) ← 依赖 Task 1 + Task 2
    ↓
Task 4 (前端编辑+导入导出) ← 依赖 Task 3 的 API 端点
    ↓
Task 5 (前端版本面板) ← 依赖 Task 3 的版本 API + Task 4 的 RuleEditDialog
```

Task 1 和 Task 2 可以并行开发（Task 2 不依赖 Version 字段）。Task 3 需要 Task 1 和 Task 2 完成后才能测试。Task 4 和 Task 5 可以合并到一个前端开发子代理中并行实施。

## 验收标准

1. **规则编辑**：编辑规则后，字段正确更新，版本号递增，版本快照自动保存
2. **启用/禁用**：点击切换按钮后规则状态立即更新
3. **CSV 导入**：上传 CSV 文件后显示预览，确认后写入数据库，错误行有明确提示
4. **JSON 导入**：上传 JSON 文件后显示预览，兼容 camelCase 和 snake_case 字段名
5. **导出**：导出的 CSV/JSON 文件内容完整，格式正确
6. **行业预置导入**：重复导入时跳过已存在的同名规则
7. **版本历史**：显示所有历史版本，支持查看快照内容和回滚
8. **回滚**：回滚后规则恢复到目标版本内容，自动创建新版本快照
9. **条件编辑器**：JSON 条件可转换为表单字段编辑，新增/删除条件正常工作
10. **权限控制**：所有新端点都有正确的 `RequirePermission` 标注
