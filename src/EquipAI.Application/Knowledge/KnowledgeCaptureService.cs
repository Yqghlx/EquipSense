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
    private readonly IAuditLogService _auditLogService;
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
        IAuditLogService auditLogService,
        ILogger<KnowledgeCaptureService> logger)
    {
        _scopeFactory = scopeFactory;
        _llmService = llmService;
        _auditLogService = auditLogService;
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

        // 本服务由后台事件处理器（KnowledgeCaptureHandler）调用，运行在独立 DI scope 中，无 HttpContext，
        // ITenantContext 走回退分支 → TenantId == Guid.Empty。若沿用默认全局租户过滤器，下列查询恒为
        // TenantId == Guid.Empty 而查不到真实租户的数据（FindAsync/FirstOrDefaultAsync 均应用过滤器），
        // 知识沉淀将整体失效。故必须 IgnoreQueryFilters 并按事件载荷中的 tenantId 显式限定（服务端可信）。
        // 查询工单（需要关联设备信息获取设备类型）
        var wo = await db.WorkOrders
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(wo => wo.Id == workOrderId && wo.TenantId == tenantId, ct);

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

        // 查询关联设备（WorkOrder 没有导航属性，需手动查询；IgnoreQueryFilters + 显式租户）
        var device = await db.Devices
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(d => d.Id == wo.DeviceId && d.TenantId == tenantId, ct);
        var deviceType = device?.Type ?? "未知";

        // === 回归 #259：补全故障案例核心检索字段（Symptoms/FaultData/Operator/Tags）===
        // 这四字段是知识库故障案例的核心检索维度（症状检索/指标回放/维修人追溯/分类），FaultCaseResponse DTO
        // 已投影、前端已展示，但原创建点从不填充 → 四列永远空白，经验传承价值大打折扣。数据源均来自已有关联链，
        // 无需新增用户输入：
        //   - FaultData  ← 关联告警的 DataSnapshot（#258 复活字段：告警触发时刻全量指标快照，jsonb，根因回放更准）
        //   - Symptoms   ← 关联告警的 Metric + AlertCode（哪个指标如何异常 = 故障现象）
        //   - Operator   ← 工单指派技术员 AssignedTo → User.DisplayName ?? Username（维修执行人姓名）
        //   - Tags       ← 设备类型 + 工单优先级（数据源恒在，总能生成分类标签）
        // 注意：本服务运行在后台 scope（ITenantContext.TenantId == Guid.Empty），下列查询必须 IgnoreQueryFilters
        // 并显式按 tenantId 限定，否则全局租户过滤器会吞掉真实租户数据（与上面 wo/device 查询同理）。
        Alert? alert = null;
        if (wo.AlertId.HasValue)
        {
            alert = await db.Alerts
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(a => a.Id == wo.AlertId!.Value && a.TenantId == tenantId, ct);
        }

        string? operatorName = null;
        if (wo.AssignedTo.HasValue)
        {
            // 取实体后内存运算 ?? 而非 Select 投影 COALESCE，规避 InMemory 掩盖关系型翻译差异的风险
            var technician = await db.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Id == wo.AssignedTo!.Value && u.TenantId == tenantId, ct);
            operatorName = technician?.DisplayName ?? technician?.Username;
        }

        // 1. 创建故障案例
        var faultCase = new FaultCase
        {
            TenantId = tenantId,
            DeviceId = wo.DeviceId,
            DeviceType = deviceType,
            FaultOccurredAt = wo.CreatedAt,
            FaultDescription = wo.Title,
            // 故障现象：从关联告警构造（指标异常描述 + 告警编码）；手动建单无告警关联则留空
            Symptoms = alert is not null ? $"指标 {alert.Metric} 异常（{alert.AlertCode}）" : null,
            RootCause = wo.RootCause ?? "未记录",
            Solution = wo.ExecutionReport ?? wo.Resolution ?? "未记录",
            RepairDurationMinutes = (int?)((wo.ActualHours ?? 0) * 60),
            PartsUsed = wo.RequiredParts,
            // 故障时刻指标快照（jsonb）：直接复用告警快照，根因回放比事后查遥测更准；无关联告警则留空
            FaultData = alert?.DataSnapshot,
            // 维修执行人姓名：工单指派技术员；无指派则留空
            Operator = operatorName,
            SourceWorkorderId = wo.Id,
            // 分类标签：设备类型 + 工单优先级派生（数据源恒在，总能生成，便于按类检索）
            Tags = $"{deviceType},{wo.Priority}",
            IsVerified = false
        };

        db.FaultCases.Add(faultCase);

        // 2. 查询关联的分析结果（工单有 AnalysisId 直接属性；IgnoreQueryFilters + 显式租户）
        Core.Entities.Analysis? analysis = null;
        if (wo.AnalysisId.HasValue)
        {
            analysis = await db.Analyses
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(a => a.Id == wo.AnalysisId.Value && a.TenantId == tenantId, ct);
        }

        // 3. 高置信度 -> 尝试通过 LLM 生成候选规则
        bool ruleGenerated = false;
        if (analysis?.Confidence >= ConfidenceThreshold)
        {
            ruleGenerated = await TryGenerateRuleAsync(db, wo, deviceType, analysis, faultCase.Id, ct);
        }

        await db.SaveChangesAsync(ct);

        // 推送候选规则产生事件，让停留在「知识库审核」页面的专家实时看到新候选（回归 #251）。
        // 仅在确实生成候选规则时推送（避免无新候选也触发刷新）；轻量推送仅 SignalR，与 AppDbContext 同 scope 解析。
        if (ruleGenerated)
        {
            var notificationService = scope.ServiceProvider.GetService<ISignalRNotificationService>();
            if (notificationService is not null)
            {
                await notificationService.SendPendingRuleCreatedAsync(tenantId, ct);
            }
        }

        _logger.LogInformation("知识沉淀完成: WorkOrderId={WorkOrderId}", workOrderId);
    }

    /// <summary>
    /// 通过 LLM 从工单中提炼候选规则
    /// </summary>
    private async Task<bool> TryGenerateRuleAsync(
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
            return false;
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
            return false;
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
        return true;
    }

    /// <summary>
    /// 批准候选规则：将候选规则转化为正式知识规则
    /// </summary>
    /// <param name="pendingRuleId">候选规则 ID</param>
    /// <param name="tenantId">当前租户 ID</param>
    /// <param name="reviewerId">审核人 ID</param>
    /// <param name="comment">审核意见</param>
    /// <param name="ct">取消令牌</param>
    public async Task ApproveRuleAsync(
        Guid pendingRuleId, Guid tenantId, Guid reviewerId, string? comment, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 审批会创建正式规则并改变候选规则状态，资源定位必须显式绑定事件/请求租户。
        var pending = await db.PendingRules
            .FirstOrDefaultAsync(
                p => p.Id == pendingRuleId && p.TenantId == tenantId,
                ct);
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
            CreatedBy = $"AI (专家验证: {reviewerId})",
            // 复制 AI 置信度到正式规则权重（回归 #257）：下游 RootCauseAnalysisEngine.cs:85 直接用
            // ConfidenceWeight 作根因分析的最终置信度，漏复制会让所有 AI 规则权重恒为默认 0.5，
            // 致高/低置信规则在根因分析中权重相同，AI 置信度优势未体现。审计日志已展示 pending.Confidence
            // 却未复制到规则，确认是遗漏（非有意丢弃）
            ConfidenceWeight = pending.Confidence ?? 0.5m
        };

        db.KnowledgeRules.Add(rule);

        // 更新候选规则审核状态
        pending.ReviewStatus = ReviewStatus.Approved;
        pending.ReviewedBy = reviewerId;
        pending.ReviewComment = comment;
        pending.ReviewedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        await _auditLogService.LogFromContextAsync(
            "KnowledgeRuleApproved", "PendingRule", pendingRuleId.ToString(),
            $"批准候选规则「{pending.Name}」为正式知识规则，置信度: {pending.Confidence:P}", ct);

        _logger.LogInformation("候选规则已批准: {PendingRuleId} -> {KnowledgeRuleId}", pendingRuleId, rule.Id);
    }

    /// <summary>
    /// 驳回候选规则
    /// </summary>
    /// <param name="pendingRuleId">候选规则 ID</param>
    /// <param name="tenantId">当前租户 ID</param>
    /// <param name="reviewerId">审核人 ID</param>
    /// <param name="comment">驳回原因</param>
    /// <param name="ct">取消令牌</param>
    public async Task RejectRuleAsync(
        Guid pendingRuleId, Guid tenantId, Guid reviewerId, string? comment, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var pending = await db.PendingRules
            .FirstOrDefaultAsync(
                p => p.Id == pendingRuleId && p.TenantId == tenantId,
                ct);
        if (pending is null)
            throw new KeyNotFoundException($"候选规则不存在: {pendingRuleId}");

        pending.ReviewStatus = ReviewStatus.Rejected;
        pending.ReviewedBy = reviewerId;
        pending.ReviewComment = comment;
        pending.ReviewedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        await _auditLogService.LogFromContextAsync(
            "KnowledgeRuleRejected", "PendingRule", pendingRuleId.ToString(),
            $"驳回候选规则「{pending.Name}」，原因: {comment ?? "无"}", ct);

        _logger.LogInformation("候选规则已驳回: {PendingRuleId}", pendingRuleId);
    }

    /// <summary>
    /// 批量批准候选规则
    /// 逐条处理，跳过已审核的规则，返回成功/失败统计
    /// </summary>
    /// <param name="pendingRuleIds">候选规则 ID 列表</param>
    /// <param name="tenantId">当前租户 ID</param>
    /// <param name="reviewerId">审核人 ID</param>
    /// <param name="comment">审核意见</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>批量审核结果</returns>
    public async Task<Application.Knowledge.DTOs.BatchReviewResult> BatchApproveAsync(
        List<Guid> pendingRuleIds, Guid tenantId, Guid reviewerId, string? comment, CancellationToken ct)
    {
        var result = new DTOs.BatchReviewResult();

        foreach (var id in pendingRuleIds)
        {
            try
            {
                await ApproveRuleAsync(id, tenantId, reviewerId, comment, ct);
                result.SuccessCount++;
            }
            catch (KeyNotFoundException)
            {
                result.FailCount++;
                result.Errors.Add(new DTOs.BatchReviewError { Id = id, Reason = "候选规则不存在" });
            }
            catch (InvalidOperationException ex)
            {
                result.FailCount++;
                result.Errors.Add(new DTOs.BatchReviewError { Id = id, Reason = ex.Message });
            }
        }

        _logger.LogInformation("批量批准完成: 成功={Success}, 失败={Fail}",
            result.SuccessCount, result.FailCount);

        return result;
    }

    /// <summary>
    /// 批量驳回候选规则
    /// 逐条处理，跳过不存在的规则，返回成功/失败统计
    /// </summary>
    /// <param name="pendingRuleIds">候选规则 ID 列表</param>
    /// <param name="tenantId">当前租户 ID</param>
    /// <param name="reviewerId">审核人 ID</param>
    /// <param name="comment">驳回原因</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>批量审核结果</returns>
    public async Task<DTOs.BatchReviewResult> BatchRejectAsync(
        List<Guid> pendingRuleIds, Guid tenantId, Guid reviewerId, string? comment, CancellationToken ct)
    {
        var result = new DTOs.BatchReviewResult();

        foreach (var id in pendingRuleIds)
        {
            try
            {
                await RejectRuleAsync(id, tenantId, reviewerId, comment, ct);
                result.SuccessCount++;
            }
            catch (KeyNotFoundException)
            {
                result.FailCount++;
                result.Errors.Add(new DTOs.BatchReviewError { Id = id, Reason = "候选规则不存在" });
            }
        }

        _logger.LogInformation("批量驳回完成: 成功={Success}, 失败={Fail}",
            result.SuccessCount, result.FailCount);

        return result;
    }
}
