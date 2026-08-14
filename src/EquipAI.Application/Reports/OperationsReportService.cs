using System.Globalization;
using System.Text;
using EquipAI.Application.Analysis;
using EquipAI.Core.Enums;
using EquipAI.Core.Extensions;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Reports;

/// <summary>
/// 运营报表服务（Phase 5 新增）
///
/// 生成月度/季度运营报告（CSV 格式，含 BOM 头 Excel 兼容）。
/// 报表内容：设备概览、告警统计、工单统计、OEE 指标、趋势预警。
/// </summary>
public class OperationsReportService
{
    /// <summary>
    /// 单次报表允许查询的最大时间跨度。
    /// 报表会聚合告警和工单数据；限制跨度可以避免恶意或误操作请求把多年数据一次性加载到内存。
    /// 一年加一天用于兼容闰年和按自然年导出的场景。
    /// </summary>
    public const int MaxReportRangeDays = 366;

    private readonly AppDbContext _db;
    private readonly OeeService _oeeService;
    private readonly ILogger<OperationsReportService> _logger;

    public OperationsReportService(AppDbContext db, OeeService oeeService, ILogger<OperationsReportService> logger)
    {
        _db = db;
        _oeeService = oeeService;
        _logger = logger;
    }

    /// <summary>
    /// 生成运营报告 CSV（月度/季度/自定义日期范围）
    /// </summary>
    public async Task<byte[]> GenerateReportAsync(
        Guid tenantId, DateTime startDate, DateTime endDate, CancellationToken ct = default)
    {
        // PostgreSQL timestamptz 列要求 DateTime.Kind 为 Utc；API/定时任务的输入可能是 Unspecified。
        startDate = startDate.ToSafeUtc();
        endDate = endDate.ToSafeUtc();

        var validationError = ValidateDateRange(startDate, endDate);
        if (validationError is not null)
        {
            if (startDate >= endDate)
            {
                throw new ArgumentException(validationError, nameof(startDate));
            }

            throw new ArgumentOutOfRangeException(nameof(endDate), endDate, validationError);
        }

        // 日期型 API 参数通常是当天 00:00:00；将它转换为次日零点，才能包含用户选择的结束日全天。
        // 带有明确时分秒的参数保持原有精确边界，统一使用半开区间 [start, endExclusive) 避免 tick 精度问题。
        var endDateExclusive = GetEndDateExclusive(endDate);
        var displayEndDate = endDateExclusive.AddTicks(-1);

        var sb = new StringBuilder();
        // BOM 头（Excel 中文兼容）
        sb.Append('\uFEFF');

        // === 报告标题 ===
        sb.AppendLine($"EquipSense 运营报告");
        sb.AppendLine($"日期范围: {startDate:yyyy-MM-dd} 至 {displayEndDate:yyyy-MM-dd}");
        sb.AppendLine($"生成时间: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
        sb.AppendLine();

        // === 1. 设备概览 ===
        sb.AppendLine("=== 设备概览 ===");
        var deviceQuery = _db.Devices.Where(d => d.TenantId == tenantId);
        var deviceSummary = await deviceQuery
            .GroupBy(_ => 1)
            .Select(group => new
            {
                Total = group.Count(),
                Online = group.Count(d => d.Status == DeviceStatus.Online),
                Offline = group.Count(d => d.Status == DeviceStatus.Offline),
                Maintenance = group.Count(d => d.Status == DeviceStatus.Maintenance),
                // 显式转 double：SQLite 不支持 decimal Average，PostgreSQL/TimescaleDB 则支持；
                // 报表只展示一位小数，double 足以覆盖健康度 0-100 的展示精度。
                AverageHealthScore = group.Average(d => (double)d.HealthScore),
            })
            .FirstOrDefaultAsync(ct);
        sb.AppendLine($"设备总数,在线,离线,维护中,平均健康度");
        AppendCsvRow(
            sb,
            deviceSummary?.Total ?? 0,
            deviceSummary?.Online ?? 0,
            deviceSummary?.Offline ?? 0,
            deviceSummary?.Maintenance ?? 0,
            deviceSummary is not null
                ? deviceSummary.AverageHealthScore.ToString("F1", CultureInfo.InvariantCulture)
                : "N/A");
        sb.AppendLine();

        // === 2. 告警统计 ===
        sb.AppendLine("=== 告警统计 ===");
        var alertQuery = _db.Alerts
            .IgnoreQueryFilters()
            .Where(a => a.TenantId == tenantId && a.OccurredAt >= startDate && a.OccurredAt < endDateExclusive);
        var alertSummary = await alertQuery
            .GroupBy(_ => 1)
            .Select(group => new
            {
                Total = group.Count(),
                Critical = group.Count(a => a.Severity == AlertSeverity.Critical),
                High = group.Count(a => a.Severity == AlertSeverity.High),
                Normal = group.Count(a => a.Severity == AlertSeverity.Normal),
                Low = group.Count(a => a.Severity == AlertSeverity.Low),
                Resolved = group.Count(a => a.Status == AlertStatus.Resolved),
                Active = group.Count(a => a.Status == AlertStatus.Active || a.Status == AlertStatus.Acknowledged),
                Acknowledged = group.Count(a => a.AcknowledgedAt != null),
            })
            .FirstOrDefaultAsync(ct);

        sb.AppendLine($"告警总数,Critical,High,Normal,Low,已解决,活跃,确认率");
        var alertTotal = alertSummary?.Total ?? 0;
        var ackRate = alertTotal > 0 ? (double)(alertSummary?.Acknowledged ?? 0) / alertTotal * 100 : 0;
        AppendCsvRow(
            sb,
            alertTotal,
            alertSummary?.Critical ?? 0,
            alertSummary?.High ?? 0,
            alertSummary?.Normal ?? 0,
            alertSummary?.Low ?? 0,
            alertSummary?.Resolved ?? 0,
            alertSummary?.Active ?? 0,
            $"{ackRate.ToString("F1", CultureInfo.InvariantCulture)}%");
        sb.AppendLine();

        // === 3. 工单统计 ===
        sb.AppendLine("=== 工单统计 ===");
        var workOrderQuery = _db.WorkOrders
            .Where(w => w.TenantId == tenantId && w.CreatedAt >= startDate && w.CreatedAt < endDateExclusive);
        var workOrderSummary = await workOrderQuery
            .GroupBy(_ => 1)
            .Select(group => new
            {
                Total = group.Count(),
                Completed = group.Count(w =>
                    w.Status == WorkOrderStatus.Completed
                    || w.Status == WorkOrderStatus.Accepted
                    || w.Status == WorkOrderStatus.Closed),
                InProgress = group.Count(w => w.Status == WorkOrderStatus.InProgress),
                PendingDispatch = group.Count(w => w.Status == WorkOrderStatus.PendingDispatch),
            })
            .FirstOrDefaultAsync(ct);

        // 已完成 = Completed（已完成）+ Accepted（已验收）+ Closed（已关闭），三者均代表维修工作已完成
        // （生命周期 Completed→Accepted→Closed，区别仅在审批/归档阶段）。
        // 修复历史：原代码只算 Closed（归档），致 Completed/Accepted 工单在报表凭空消失、completionRate
        // 严重偏低（客户看月报"已完成=1"误以为效率极低），与 WorkOrderStatisticsService（用 CompletedAt.HasValue
        // 涵盖 Completed 及之后）方向不一致。与 #262（活跃告警定义）同构的业务定义跨查询点不一致。
        var workOrderTotal = workOrderSummary?.Total ?? 0;
        var completionRate = workOrderTotal > 0
            ? (double)(workOrderSummary?.Completed ?? 0) / workOrderTotal * 100
            : 0;

        sb.AppendLine($"工单总数,已完成,执行中,待派工,完成率");
        AppendCsvRow(
            sb,
            workOrderTotal,
            workOrderSummary?.Completed ?? 0,
            workOrderSummary?.InProgress ?? 0,
            workOrderSummary?.PendingDispatch ?? 0,
            $"{completionRate.ToString("F1", CultureInfo.InvariantCulture)}%");
        sb.AppendLine();

        // === 4. OEE 指标 ===
        sb.AppendLine("=== OEE 设备综合效率 ===");
        try
        {
            var oee = await _oeeService.CalculateAsync(tenantId, ct);
            sb.AppendLine($"综合OEE(%),可用率(%),性能(%),质量(%),在线设备,总设备");
            AppendCsvRow(sb, oee.Oee, oee.Availability, oee.Performance, oee.Quality,
                oee.OnlineDevices, oee.TotalDevices);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "OEE 计算失败，报表中跳过");
            sb.AppendLine("OEE 数据暂不可用");
        }
        sb.AppendLine();

        // === 5. 设备健康度排名 ===
        sb.AppendLine("=== 设备健康度排名（最低 10 台）===");
        sb.AppendLine($"设备编码,设备名称,状态,健康度");
        var bottomDevices = await deviceQuery
            .OrderBy(d => (double)d.HealthScore)
            .Take(10)
            .Select(d => new
            {
                d.DeviceCode,
                d.Name,
                d.Status,
                d.HealthScore,
            })
            .ToListAsync(ct);
        foreach (var d in bottomDevices)
        {
            AppendCsvRow(sb, d.DeviceCode, d.Name ?? d.DeviceCode, d.Status.ToString(),
                d.HealthScore.ToString("F1", CultureInfo.InvariantCulture));
        }
        sb.AppendLine();

        // === 6. 按指标告警分布 ===
        sb.AppendLine("=== 告警按指标分布 ===");
        var byMetric = await alertQuery
            .GroupBy(a => a.Metric)
            .Select(g => new { Metric = g.Key, Count = g.Count() })
            .OrderByDescending(g => g.Count)
            .Take(10)
            .ToListAsync(ct);
        sb.AppendLine($"指标,告警数");
        foreach (var m in byMetric)
        {
            AppendCsvRow(sb, m.Metric, m.Count);
        }

        return ToUtf8Bytes(sb.ToString());
    }

    /// <summary>
    /// 校验报表查询窗口，供控制器在执行数据库查询前返回明确的 400。
    /// </summary>
    public static string? ValidateDateRange(DateTime startDate, DateTime endDate)
    {
        if (startDate >= endDate)
        {
            return "日期范围无效：开始时间必须早于结束时间";
        }

        if (GetEndDateExclusive(endDate) - startDate > TimeSpan.FromDays(MaxReportRangeDays))
        {
            return $"日期范围不能超过 {MaxReportRangeDays} 天";
        }

        return null;
    }

    /// <summary>
    /// 获取报表查询的排他结束边界。
    /// 只有零点日期被视为“按天查询”的结束值；带时分秒的输入仍表示精确时间点。
    /// </summary>
    public static DateTime GetEndDateExclusive(DateTime endDate)
    {
        if (endDate.TimeOfDay != TimeSpan.Zero)
        {
            return endDate;
        }

        return endDate.AddDays(1);
    }

    /// <summary>
    /// 追加一行 RFC 4180 兼容的 CSV。
    ///
    /// 文本字段来自设备、指标或租户配置，必须同时处理分隔符、引号和换行；
    /// 仅对文本字段执行公式前缀保护，避免把内部生成的负数误转成文本。
    /// </summary>
    private static void AppendCsvRow(StringBuilder builder, params object?[] fields)
    {
        for (var index = 0; index < fields.Length; index++)
        {
            if (index > 0)
            {
                builder.Append(',');
            }

            var field = fields[index];
            var text = field switch
            {
                null => string.Empty,
                IFormattable formattable => formattable.ToString(null, CultureInfo.InvariantCulture) ?? string.Empty,
                _ => field.ToString() ?? string.Empty,
            };

            builder.Append(EscapeCsvField(text, field is string));
        }

        builder.AppendLine();
    }

    /// <summary>
    /// 转义单个 CSV 字段，并阻止 Excel 将外部文本解释为公式。
    /// </summary>
    private static string EscapeCsvField(string value, bool protectFormula)
    {
        if (protectFormula)
        {
            var firstNonWhitespace = value.TrimStart();
            if (firstNonWhitespace.Length > 0
                && firstNonWhitespace[0] is '=' or '+' or '-' or '@')
            {
                value = "'" + value;
            }
        }

        if (value.IndexOfAny([',', '"', '\r', '\n']) >= 0)
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }

        return value;
    }

    private static byte[] ToUtf8Bytes(string content) => Encoding.UTF8.GetBytes(content);
}
