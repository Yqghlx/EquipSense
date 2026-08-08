using AutoMapper;
using EquipAI.Application.Analysis.DTOs;
using EquipAI.Application.DTOs.Common;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.Application.Analysis;

/// <summary>
/// AI 分析结果查询服务。
/// 封装分析结果的列表/详情查询，使 Controller 不直接依赖 <c>AppDbContext</c>。
/// 多租户隔离由 AppDbContext 全局查询过滤器自动处理。
/// </summary>
public class AnalysisQueryService
{
    private readonly AppDbContext _dbContext;
    private readonly IMapper _mapper;

    public AnalysisQueryService(AppDbContext dbContext, IMapper mapper)
    {
        _dbContext = dbContext;
        _mapper = mapper;
    }

    /// <summary>
    /// 分页查询分析结果，支持按设备 ID 筛选。
    /// </summary>
    public async Task<PagedResult<AnalysisDto>> ListAsync(PagedQuery query, Guid? deviceId = null, CancellationToken ct = default)
    {
        var analyses = _dbContext.Analyses.AsQueryable();

        if (deviceId.HasValue)
            analyses = analyses.Where(a => a.DeviceId == deviceId.Value);

        var (items, total) = await analyses.ToPagedAsync(query, ct);

        return new PagedResult<AnalysisDto>
        {
            Items = _mapper.Map<List<AnalysisDto>>(items)!,
            Total = total,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }

    /// <summary>
    /// 按 ID 查询单条分析结果。返回 null 表示未找到。
    /// </summary>
    public async Task<AnalysisDto?> GetAsync(Guid id, CancellationToken ct = default)
    {
        var analysis = await _dbContext.Analyses.FindAsync(new object?[] { id }, ct);
        return analysis is null ? null : _mapper.Map<AnalysisDto>(analysis);
    }
}
