using EquipAI.Core.Constants;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.Application.Devices;

/// <summary>
/// 设备类型模板管理服务。
/// 封装模板的查询（含跨租户系统预置模板）和创建，使 Controller 不直接依赖 <c>AppDbContext</c>。
/// </summary>
public class DeviceTypeTemplateService
{
    private readonly AppDbContext _dbContext;
    private readonly ITenantContext _tenantContext;

    public DeviceTypeTemplateService(AppDbContext dbContext, ITenantContext tenantContext)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 查询设备类型模板列表（当前租户自定义 + 系统租户预置）。
    /// 使用 IgnoreQueryFilters 跨租户查询，确保系统预置模板对所有租户可见。
    /// </summary>
    /// <param name="industry">可选：按行业筛选</param>
    /// <param name="ct">取消令牌</param>
    public async Task<List<DeviceTypeTemplate>> ListAsync(string? industry = null, CancellationToken ct = default)
    {
        var query = _dbContext.DeviceTypeTemplates
            .IgnoreQueryFilters()
            .Where(t => t.TenantId == _tenantContext.TenantId
                     || t.TenantId == SystemConstants.SystemTenantId);

        if (!string.IsNullOrEmpty(industry))
            query = query.Where(t => t.Industry == industry);

        return await query
            .OrderByDescending(t => t.TenantId == _tenantContext.TenantId)
            .ThenBy(t => t.Name)
            .ToListAsync(ct);
    }

    /// <summary>
    /// 创建租户自定义设备类型模板。
    /// </summary>
    public async Task<DeviceTypeTemplate> CreateAsync(CreateDeviceTypeTemplateRequest request, CancellationToken ct = default)
    {
        var template = new DeviceTypeTemplate
        {
            TenantId = _tenantContext.TenantId,
            Name = request.Name,
            Industry = request.Industry,
            Parameters = request.Parameters ?? "{}"
        };

        _dbContext.DeviceTypeTemplates.Add(template);
        await _dbContext.SaveChangesAsync(ct);

        return template;
    }
}

/// <summary>
/// 创建设备类型模板请求 DTO。
/// </summary>
public class CreateDeviceTypeTemplateRequest
{
    /// <summary>模板名称（如 "三相异步电机"、"离心泵"）</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>所属行业（如 "制造业"、"化工"、"电力"）</summary>
    public string? Industry { get; set; }

    /// <summary>设备参数定义（JSONB），描述该类型设备的监控指标、单位、范围等</summary>
    public string? Parameters { get; set; }
}
