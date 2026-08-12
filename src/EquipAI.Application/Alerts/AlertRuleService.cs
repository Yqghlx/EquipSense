using AutoMapper;
using EquipAI.Application.Alerts.DTOs;
using EquipAI.Application.DTOs.Common;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.Application.Alerts;

/// <summary>
/// 告警规则管理服务。
/// 封装规则的查询/创建/更新/删除/启停，使 Controller 不直接依赖 <c>AppDbContext</c>。
/// 全局查询过滤器作为纵深防御；业务查询仍显式匹配当前租户，新建规则时显式写入 TenantId。
/// </summary>
public class AlertRuleService
{
    private readonly AppDbContext _dbContext;
    private readonly IMapper _mapper;
    private readonly ITenantContext _tenantContext;

    public AlertRuleService(AppDbContext dbContext, IMapper mapper, ITenantContext tenantContext)
    {
        _dbContext = dbContext;
        _mapper = mapper;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 分页查询告警规则，支持按名称关键字模糊匹配。
    /// </summary>
    public async Task<PagedResult<AlertRuleDto>> ListAsync(PagedQuery query, CancellationToken ct = default)
    {
        // 规则决定告警覆盖范围，列表必须显式绑定当前租户，不能只依赖全局过滤器。
        var rules = _dbContext.AlertRules
            .Where(r => r.TenantId == _tenantContext.TenantId)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            var keyword = $"%{query.Keyword}%";
            rules = rules.Where(r => EF.Functions.ILike(r.Name, keyword));
        }

        var (items, total) = await rules.ToPagedAsync(query, ct);

        return new PagedResult<AlertRuleDto>
        {
            Items = _mapper.Map<List<AlertRuleDto>>(items)!,
            Total = total,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }

    /// <summary>
    /// 按 ID 查询单条规则。返回 null 表示未找到。
    /// </summary>
    public async Task<AlertRuleDto?> GetAsync(Guid id, CancellationToken ct = default)
    {
        var rule = await _dbContext.AlertRules
            .FirstOrDefaultAsync(
                r => r.Id == id && r.TenantId == _tenantContext.TenantId,
                ct);
        return rule is null ? null : _mapper.Map<AlertRuleDto>(rule);
    }

    /// <summary>
    /// 创建告警规则（自动写入当前租户 ID）。
    /// </summary>
    public async Task<AlertRuleDto> CreateAsync(CreateAlertRuleRequest request, CancellationToken ct = default)
    {
        var rule = _mapper.Map<AlertRule>(request)!;
        rule.TenantId = _tenantContext.TenantId;

        _dbContext.AlertRules.Add(rule);
        await _dbContext.SaveChangesAsync(ct);

        return _mapper.Map<AlertRuleDto>(rule)!;
    }

    /// <summary>
    /// 更新告警规则。规则不存在抛 <see cref="KeyNotFoundException"/>（由全局中间件转 404）。
    /// </summary>
    public async Task<AlertRuleDto> UpdateAsync(Guid id, UpdateAlertRuleRequest request, CancellationToken ct = default)
    {
        var rule = await _dbContext.AlertRules
            .FirstOrDefaultAsync(
                r => r.Id == id && r.TenantId == _tenantContext.TenantId,
                ct)
            ?? throw new KeyNotFoundException($"告警规则 {id} 不存在");

        _mapper.Map(request, rule);
        await _dbContext.SaveChangesAsync(ct);

        return _mapper.Map<AlertRuleDto>(rule)!;
    }

    /// <summary>
    /// 删除告警规则。规则不存在抛 <see cref="KeyNotFoundException"/>。
    /// </summary>
    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var rule = await _dbContext.AlertRules
            .FirstOrDefaultAsync(
                r => r.Id == id && r.TenantId == _tenantContext.TenantId,
                ct)
            ?? throw new KeyNotFoundException($"告警规则 {id} 不存在");

        _dbContext.AlertRules.Remove(rule);
        await _dbContext.SaveChangesAsync(ct);
    }

    /// <summary>
    /// 启用/停用告警规则。返回更新后的规则；规则不存在返回 null。
    /// </summary>
    public async Task<AlertRuleDto?> ToggleAsync(Guid id, CancellationToken ct = default)
    {
        var rule = await _dbContext.AlertRules
            .FirstOrDefaultAsync(
                r => r.Id == id && r.TenantId == _tenantContext.TenantId,
                ct);
        if (rule is null)
            return null;

        rule.Enabled = !rule.Enabled;
        await _dbContext.SaveChangesAsync(ct);

        return _mapper.Map<AlertRuleDto>(rule)!;
    }
}
