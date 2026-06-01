using System.Text.Json;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Knowledge;

/// <summary>
/// 知识沉淀服务
/// 工单关闭时自动生成故障案例，高置信度时通过 LLM 生成候选规则
/// </summary>
public class KnowledgeCaptureService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILLMService _llmService;
    private readonly ILogger<KnowledgeCaptureService> _logger;

    /// <summary>
    /// 最低维修时长阈值（小时），低于此值不进行知识沉淀
    /// </summary>
    private const double MinHoursForCapture = 0.5;

    /// <summary>
    /// AI 分析置信度阈值，高于此值才触发候选规则生成
    /// </summary>
    private const double ConfidenceThreshold = 0.8;

    public KnowledgeCaptureService(
        IServiceScopeFactory scopeFactory,
        ILLMService llmService,
        ILogger<KnowledgeCaptureService> logger)
    {
        _scopeFactory = scopeFactory;
        _llmService = llmService;
        _logger = logger;
    }

    /// <summary>
    /// 处理工单关闭事件：生成故障案例，高置信度时生成候选规则
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="workOrderId">工单 ID</param>
    /// <param name="ct">取消令牌</param>
    public async Task ProcessWorkOrderClosedAsync(
        Guid tenantId, Guid workOrderId, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 查询工单（需要关联设备信息获取设备类型）
        var wo = await db.WorkOrders
            .FirstOrDefaultAsync(wo => wo.Id == workOrderId, ct);

        if (wo is null)
        {
            _logger.LogWarning("工单不存在: {WorkOrderId}", workOrderId);
            return;
        }

        // 维修时长不足则跳过，避免低价值案例
        if ((wo.ActualHours ?? 0) < MinHoursForCapture)
        {
            _logger.LogDebug("工单时长不足，跳过知识沉淀: {WorkOrderId}", workOrderId);
            return;
        }

        // 查询关联设备（WorkOrder 没有导航属性，需手动查询）
        var device = await db.Devices.FindAsync([wo.DeviceId], ct);
        var deviceType = device?.Type ?? "未知";

        // 1. 创建故障案例
        var faultCase = new FaultCase
        {
            TenantId = tenantId,
            DeviceId = wo.DeviceId,
            DeviceType = deviceType,
            FaultOccurredAt = wo.CreatedAt,
            FaultDescription = wo.Title,
            RootCause = wo.RootCause ?? "未记录",
            Solution = wo.ExecutionReport ?? wo.Resolution ?? "未记录",
            RepairDurationMinutes = (int?)((wo.ActualHours ?? 0) * 60),
            PartsUsed = wo.RequiredParts,
            SourceWorkorderId = wo.Id,
            IsVerified = false
        };

        db.FaultCases.Add(faultCase);

        // 2. 查询关联的分析结果（工单有 AnalysisId 直接属性）
        Core.Entities.Analysis? analysis = null;
        if (wo.AnalysisId.HasValue)
        {
            analysis = await db.Analyses.FindAsync([wo.AnalysisId.Value], ct);
        }

        // 3. 高置信度 -> 尝试通过 LLM 生成候选规则
        if (analysis?.Confidence >= ConfidenceThreshold)
        {
            await TryGenerateRuleAsync(db, wo, deviceType, analysis, faultCase.Id, ct);
        }

        await db.SaveChangesAsync(ct);
        _logger.LogInformation("知识沉淀完成: WorkOrderId={WorkOrderId}", workOrderId);
    }

    /// <summary>
    /// 通过 LLM 从工单中提炼候选规则
    /// </summary>
    private async Task TryGenerateRuleAsync(
        AppDbContext db,
        WorkOrder wo,
        string deviceType,
        Core.Entities.Analysis analysis,
        Guid caseId,
        CancellationToken ct)
    {
        // 使用 string.Format 构建提示词，避免内插字符串与 JSON 大括号冲突
        var promptTemplate = """
            从以下维修工单中提炼一条故障诊断规则：

            故障现象：{0}
            根因分析：{1}
            处理措施：{2}
            设备类型：{3}

            请输出 JSON 格式（直接输出 JSON，不要用 markdown 代码块）：
            {{"conditions":[{{"metric":"指标名","operator":">","threshold":0}}],"conclusion":"诊断结论","recommendedActions":["操作1"],"checkSteps":["步骤1"]}}
            """;
        var prompt = string.Format(promptTemplate,
            wo.Title,
            wo.RootCause ?? "未知",
            wo.ExecutionReport ?? wo.Resolution ?? "未记录",
            deviceType);

        var response = await _llmService.AnalyzeAsync(
            new LLMRequest("你是工业设备故障诊断专家。", prompt), ct);

        if (!response.Success)
        {
            _logger.LogWarning("LLM 规则生成失败: {Error}", response.ErrorMessage);
            return;
        }

        string conditions;
        string conclusion;
        string? recommendedActions = null;
        string? checkSteps = null;

        try
        {
            var json = JsonDocument.Parse(response.Content);
            var root = json.RootElement;
            conditions = root.TryGetProperty("conditions", out var c) ? c.GetRawText() : "[]";
            conclusion = root.TryGetProperty("conclusion", out var cl) ? cl.GetString() ?? "" : "";
            recommendedActions = root.TryGetProperty("recommendedActions", out var ra) ? ra.GetRawText() : null;
            checkSteps = root.TryGetProperty("checkSteps", out var cs) ? cs.GetRawText() : null;
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "LLM 响应 JSON 解析失败，跳过规则生成");
            return;
        }

        var pendingRule = new PendingRule
        {
            TenantId = wo.TenantId,
            DeviceType = deviceType,
            Name = $"自动生成-{deviceType}-{DateTime.UtcNow:yyyyMMdd}",
            Conditions = conditions,
            Conclusion = conclusion,
            RecommendedActions = recommendedActions,
            CheckSteps = checkSteps,
            SourceWorkorderId = wo.Id,
            SourceCaseId = caseId,
            Confidence = (decimal?)analysis.Confidence,
            ReviewStatus = ReviewStatus.Pending
        };

        db.PendingRules.Add(pendingRule);
    }

    /// <summary>
    /// 批准候选规则：将候选规则转化为正式知识规则
    /// </summary>
    /// <param name="pendingRuleId">候选规则 ID</param>
    /// <param name="reviewerId">审核人 ID</param>
    /// <param name="comment">审核意见</param>
    /// <param name="ct">取消令牌</param>
    public async Task ApproveRuleAsync(
        Guid pendingRuleId, Guid reviewerId, string? comment, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var pending = await db.PendingRules.FindAsync([pendingRuleId], ct);
        if (pending is null)
            throw new KeyNotFoundException($"候选规则不存在: {pendingRuleId}");

        if (pending.ReviewStatus != ReviewStatus.Pending)
            throw new InvalidOperationException($"规则已审核，当前状态: {pending.ReviewStatus}");

        // 创建正式规则
        var rule = new KnowledgeRule
        {
            TenantId = pending.TenantId,
            DeviceType = pending.DeviceType,
            Name = pending.Name,
            Conditions = pending.Conditions,
            Conclusion = pending.Conclusion,
            RecommendedActions = pending.RecommendedActions,
            CheckSteps = pending.CheckSteps,
            Source = "ai_generated",
            CreatedBy = $"AI (专家验证: {reviewerId})"
        };

        db.KnowledgeRules.Add(rule);

        // 更新候选规则审核状态
        pending.ReviewStatus = ReviewStatus.Approved;
        pending.ReviewedBy = reviewerId;
        pending.ReviewComment = comment;
        pending.ReviewedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        _logger.LogInformation("候选规则已批准: {PendingRuleId} -> {KnowledgeRuleId}", pendingRuleId, rule.Id);
    }

    /// <summary>
    /// 驳回候选规则
    /// </summary>
    /// <param name="pendingRuleId">候选规则 ID</param>
    /// <param name="reviewerId">审核人 ID</param>
    /// <param name="comment">驳回原因</param>
    /// <param name="ct">取消令牌</param>
    public async Task RejectRuleAsync(
        Guid pendingRuleId, Guid reviewerId, string? comment, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var pending = await db.PendingRules.FindAsync([pendingRuleId], ct);
        if (pending is null)
            throw new KeyNotFoundException($"候选规则不存在: {pendingRuleId}");

        pending.ReviewStatus = ReviewStatus.Rejected;
        pending.ReviewedBy = reviewerId;
        pending.ReviewComment = comment;
        pending.ReviewedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        _logger.LogInformation("候选规则已驳回: {PendingRuleId}", pendingRuleId);
    }
}
