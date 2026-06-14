using EquipAI.Application.Fmea.DTOs;
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
    /// 创建 FMEA 条目
    /// </summary>
    public async Task<FmeaEntryResponse> CreateAsync(CreateFmeaEntryRequest request)
    {
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
