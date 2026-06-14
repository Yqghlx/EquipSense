using EquipAI.Application.Reports;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Middleware;
using EquipAI.WebAPI.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 运营报表控制器（Phase 5 新增）
/// </summary>
[ApiController]
[Route("api/v1/reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly OperationsReportService _reportService;
    private readonly ITenantContext _tenantContext;

    public ReportsController(OperationsReportService reportService, ITenantContext tenantContext)
    {
        _reportService = reportService;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 生成运营报告 CSV（支持自定义日期范围）
    /// </summary>
    [HttpGet("operations")]
    [RequirePermission("report:read")]
    [Audit("GenerateReport", "Report")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> GenerateOperationsReport(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        CancellationToken ct = default)
    {
        // 默认本月
        var end = endDate?.ToUniversalTime() ?? DateTime.UtcNow;
        var start = startDate?.ToUniversalTime() ?? new DateTime(end.Year, end.Month, 1);

        var bytes = await _reportService.GenerateReportAsync(
            _tenantContext.TenantId, start, end, ct);

        var fileName = $"operations_report_{start:yyyyMMdd}_{end:yyyyMMdd}.csv";
        return File(bytes, "text/csv; charset=utf-8", fileName);
    }

    /// <summary>
    /// 生成本月运营报告（快捷端点）
    /// </summary>
    [HttpGet("operations/current-month")]
    [RequirePermission("report:read")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> GenerateCurrentMonthReport(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var start = new DateTime(now.Year, now.Month, 1);

        var bytes = await _reportService.GenerateReportAsync(
            _tenantContext.TenantId, start, now, ct);

        var fileName = $"operations_report_{now:yyyyMM}.csv";
        return File(bytes, "text/csv; charset=utf-8", fileName);
    }
}
