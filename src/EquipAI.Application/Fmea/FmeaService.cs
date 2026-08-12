using EquipAI.Application.Fmea.DTOs;
using EquipAI.Core.Constants;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.Application.Fmea;

/// <summary>
/// FMEA 故障模式库服务（Phase 5 新增）
/// </summary>
public class FmeaService
{
    private readonly AppDbContext _db;
    private readonly ITenantContext _tenantContext;

    public FmeaService(AppDbContext db, ITenantContext tenantContext)
    {
        _db = db;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 分页查询 FMEA 条目
    /// </summary>
    public async Task<(List<FmeaEntryResponse> Items, int Total)> GetEntriesAsync(
        int page, int pageSize, string? deviceType = null, bool? isEnabled = null)
    {
        var query = _db.FmeaLibrary
            .Where(e => e.TenantId == _tenantContext.TenantId);

        if (!string.IsNullOrWhiteSpace(deviceType))
        {
            query = query.Where(e => e.DeviceType.Contains(deviceType));
        }

        if (isEnabled.HasValue)
        {
            query = query.Where(e => e.IsEnabled == isEnabled.Value);
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(e => e.Rpn)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new FmeaEntryResponse
            {
                Id = e.Id,
                TenantId = e.TenantId,
                DeviceType = e.DeviceType,
                FailureMode = e.FailureMode,
                Cause = e.Cause,
                Effect = e.Effect,
                Detection = e.Detection,
                RecommendedAction = e.RecommendedAction,
                Severity = e.Severity,
                Occurrence = e.Occurrence,
                Detectability = e.Detectability,
                Rpn = e.Rpn,
                KnowledgeRuleId = e.KnowledgeRuleId,
                CreatedBy = e.CreatedBy,
                IsEnabled = e.IsEnabled,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt,
            })
            .ToListAsync();

        return (items, total);
    }

    /// <summary>
    /// 按 ID 查询单个 FMEA 条目，并显式限定当前租户。
    /// 详情查询不能复用分页列表的第一页，否则排序靠后的合法条目会被误判为不存在。
    /// </summary>
    /// <param name="id">FMEA 条目 ID。</param>
    /// <returns>当前租户可见的条目；不存在或不属于当前租户时返回 null。</returns>
    public async Task<FmeaEntryResponse?> GetByIdAsync(Guid id)
    {
        var entry = await _db.FmeaLibrary
            .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == _tenantContext.TenantId);

        return entry is null ? null : MapToResponse(entry);
    }

    /// <summary>
    /// 创建 FMEA 条目
    /// </summary>
    public async Task<FmeaEntryResponse> CreateAsync(CreateFmeaEntryRequest request)
    {
        await EnsureKnowledgeRuleIsAccessibleAsync(request.KnowledgeRuleId);

        var entry = new FmeaEntry
        {
            TenantId = _tenantContext.TenantId,
            DeviceType = request.DeviceType,
            FailureMode = request.FailureMode,
            Cause = request.Cause,
            Effect = request.Effect,
            Detection = request.Detection,
            RecommendedAction = request.RecommendedAction,
            Severity = request.Severity,
            Occurrence = request.Occurrence,
            Detectability = request.Detectability,
            Rpn = request.Severity * request.Occurrence * request.Detectability,
            KnowledgeRuleId = request.KnowledgeRuleId,
            CreatedBy = _tenantContext.UserId,
            IsEnabled = true,
        };

        _db.FmeaLibrary.Add(entry);
        await _db.SaveChangesAsync();

        return MapToResponse(entry);
    }

    /// <summary>
    /// 更新 FMEA 条目
    /// </summary>
    public async Task<FmeaEntryResponse?> UpdateAsync(Guid id, UpdateFmeaEntryRequest request)
    {
        var entry = await _db.FmeaLibrary
            .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == _tenantContext.TenantId);

        if (entry is null) return null;

        await EnsureKnowledgeRuleIsAccessibleAsync(request.KnowledgeRuleId);

        entry.DeviceType = request.DeviceType;
        entry.FailureMode = request.FailureMode;
        entry.Cause = request.Cause;
        entry.Effect = request.Effect;
        entry.Detection = request.Detection;
        entry.RecommendedAction = request.RecommendedAction;
        entry.Severity = request.Severity;
        entry.Occurrence = request.Occurrence;
        entry.Detectability = request.Detectability;
        entry.Rpn = request.Severity * request.Occurrence * request.Detectability;
        entry.KnowledgeRuleId = request.KnowledgeRuleId;
        entry.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return MapToResponse(entry);
    }

    /// <summary>
    /// 校验 FMEA 关联的知识规则属于当前租户或系统租户。
    /// 关联字段本身是可选的，但不能接受任意租户的规则 ID，避免跨租户关系污染后续诊断链路。
    /// </summary>
    private async Task EnsureKnowledgeRuleIsAccessibleAsync(Guid? knowledgeRuleId)
    {
        if (!knowledgeRuleId.HasValue) return;

        var isAccessible = await _db.KnowledgeRules
            .IgnoreQueryFilters()
            .AnyAsync(rule => rule.Id == knowledgeRuleId.Value
                && (rule.TenantId == _tenantContext.TenantId
                    || rule.TenantId == SystemConstants.SystemTenantId));

        if (!isAccessible)
        {
            throw new FmeaValidationException(
                "KNOWLEDGE_RULE_NOT_ACCESSIBLE",
                "关联的知识规则不存在或不属于当前租户。");
        }
    }

    /// <summary>
    /// 删除 FMEA 条目
    /// </summary>
    public async Task<bool> DeleteAsync(Guid id)
    {
        var entry = await _db.FmeaLibrary
            .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == _tenantContext.TenantId);

        if (entry is null) return false;

        _db.FmeaLibrary.Remove(entry);
        await _db.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// 切换启用/禁用状态
    /// </summary>
    public async Task<bool> ToggleEnabledAsync(Guid id)
    {
        var entry = await _db.FmeaLibrary
            .FirstOrDefaultAsync(e => e.Id == id && e.TenantId == _tenantContext.TenantId);

        if (entry is null) return false;

        entry.IsEnabled = !entry.IsEnabled;
        entry.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    private static FmeaEntryResponse MapToResponse(FmeaEntry entry) => new()
    {
        Id = entry.Id,
        TenantId = entry.TenantId,
        DeviceType = entry.DeviceType,
        FailureMode = entry.FailureMode,
        Cause = entry.Cause,
        Effect = entry.Effect,
        Detection = entry.Detection,
        RecommendedAction = entry.RecommendedAction,
        Severity = entry.Severity,
        Occurrence = entry.Occurrence,
        Detectability = entry.Detectability,
        Rpn = entry.Rpn,
        KnowledgeRuleId = entry.KnowledgeRuleId,
        CreatedBy = entry.CreatedBy,
        IsEnabled = entry.IsEnabled,
        CreatedAt = entry.CreatedAt,
        UpdatedAt = entry.UpdatedAt,
    };
}

/// <summary>
/// FMEA 请求引用校验异常。
/// </summary>
public sealed class FmeaValidationException : InvalidOperationException
{
    public FmeaValidationException(string code, string message)
        : base(message)
    {
        Code = code;
    }

    /// <summary>供 API 返回的稳定错误编码。</summary>
    public string Code { get; }
}
