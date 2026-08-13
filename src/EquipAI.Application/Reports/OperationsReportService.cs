using System.Globalization;
using System.Text;
using EquipAI.Application.Analysis;
using EquipAI.Core.Enums;
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
        // PostgreSQL timestamptz 列要求 DateTime.Kind 为 Utc，否则抛 ArgumentException
        // Controller 传入的 startDate/endDate 可能是 Kind=Unspecified（如 new DateTime(year,month,1)）
        startDate = DateTime.SpecifyKind(startDate, DateTimeKind.Utc);
        endDate = DateTime.SpecifyKind(endDate, DateTimeKind.Utc);

        var sb = new StringBuilder();
        // BOM 头（Excel 中文兼容）
        sb.Append('\uFEFF');

        // === 报告标题 ===
        sb.AppendLine($"EquipSense 运营报告");
        sb.AppendLine($"日期范围: {startDate:yyyy-MM-dd} 至 {endDate:yyyy-MM-dd}");
        sb.AppendLine($"生成时间: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
        sb.AppendLine();

        // === 1. 设备概览 ===
        sb.AppendLine("=== 设备概览 ===");
        var devices = await _db.Devices.Where(d => d.TenantId == tenantId).ToListAsync(ct);
        var onlineCount = devices.Count(d => d.Status == DeviceStatus.Online);
        var offlineCount = devices.Count(d => d.Status == DeviceStatus.Offline);
        var maintenanceCount = devices.Count(d => d.Status == DeviceStatus.Maintenance);
        sb.AppendLine($"设备总数,在线,离线,维护中,平均健康度");
        AppendCsvRow(
            sb,
            devices.Count,
            onlineCount,
            offlineCount,
            maintenanceCount,
            devices.Any()
                ? devices.Average(d => d.HealthScore).ToString("F1", CultureInfo.InvariantCulture)
                : "N/A");
        sb.AppendLine();

        // === 2. 告警统计 ===
        sb.AppendLine("=== 告警统计 ===");
        var alerts = await _db.Alerts
            .IgnoreQueryFilters()
            .Where(a => a.TenantId == tenantId && a.OccurredAt >= startDate && a.OccurredAt <= endDate)
            .ToListAsync(ct);

        sb.AppendLine($"告警总数,Critical,High,Normal,Low,已解决,活跃,确认率");
        var critical = alerts.Count(a => a.Severity == AlertSeverity.Critical);
        var high = alerts.Count(a => a.Severity == AlertSeverity.High);
        var normal = alerts.Count(a => a.Severity == AlertSeverity.Normal);
        var low = alerts.Count(a => a.Severity == AlertSeverity.Low);
        var resolved = alerts.Count(a => a.Status == AlertStatus.Resolved);
        // 活跃告警定义 = Active（已触发未确认）+ Acknowledged（已确认未解决），与 DashboardStatsService/OeeService 一致。
        // 修复历史：原代码只算 Active 漏算 Acknowledged，致报表活跃数 < Dashboard 活跃数，
        // 且"已解决 + 活跃" ≠ 告警总数（Acknowledged 状态告警凭空消失）。#243 已统一 Dashboard/OEE 定义，此处为对称遗漏。
        var active = alerts.Count(a => a.Status == AlertStatus.Active || a.Status == AlertStatus.Acknowledged);
        var ackRate = alerts.Count > 0 ? (double)alerts.Count(a => a.AcknowledgedAt != null) / alerts.Count * 100 : 0;
        AppendCsvRow(sb, alerts.Count, critical, high, normal, low, resolved, active,
            $"{ackRate.ToString("F1", CultureInfo.InvariantCulture)}%");
        sb.AppendLine();

        // === 3. 工单统计 ===
        sb.AppendLine("=== 工单统计 ===");
        var workOrders = await _db.WorkOrders
            .Where(w => w.TenantId == tenantId && w.CreatedAt >= startDate && w.CreatedAt <= endDate)
            .ToListAsync(ct);

        // 已完成 = Completed（已完成）+ Accepted（已验收）+ Closed（已关闭），三者均代表维修工作已完成
        // （生命周期 Completed→Accepted→Closed，区别仅在审批/归档阶段）。
        // 修复历史：原代码只算 Closed（归档），致 Completed/Accepted 工单在报表凭空消失、completionRate
        // 严重偏低（客户看月报"已完成=1"误以为效率极低），与 WorkOrderStatisticsService（用 CompletedAt.HasValue
        // 涵盖 Completed 及之后）方向不一致。与 #262（活跃告警定义）同构的业务定义跨查询点不一致。
        var woCompleted = workOrders.Count(w =>
            w.Status == WorkOrderStatus.Completed
            || w.Status == WorkOrderStatus.Accepted
            || w.Status == WorkOrderStatus.Closed);
        var woInProgress = workOrders.Count(w => w.Status == WorkOrderStatus.InProgress);
        var woPending = workOrders.Count(w => w.Status == WorkOrderStatus.PendingDispatch);
        var completionRate = workOrders.Count > 0 ? (double)woCompleted / workOrders.Count * 100 : 0;

        sb.AppendLine($"工单总数,已完成,执行中,待派工,完成率");
        AppendCsvRow(sb, workOrders.Count, woCompleted, woInProgress, woPending,
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
        var bottomDevices = devices
            .OrderBy(d => d.HealthScore)
            .Take(10)
            .ToList();
        foreach (var d in bottomDevices)
        {
            AppendCsvRow(sb, d.DeviceCode, d.Name ?? d.DeviceCode, d.Status.ToString(),
                d.HealthScore.ToString("F1", CultureInfo.InvariantCulture));
        }
        sb.AppendLine();

        // === 6. 按指标告警分布 ===
        sb.AppendLine("=== 告警按指标分布 ===");
        var byMetric = alerts
            .GroupBy(a => a.Metric)
            .Select(g => new { Metric = g.Key, Count = g.Count() })
            .OrderByDescending(g => g.Count)
            .Take(10);
        sb.AppendLine($"指标,告警数");
        foreach (var m in byMetric)
        {
            AppendCsvRow(sb, m.Metric, m.Count);
        }

        return ToUtf8Bytes(sb.ToString());
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
