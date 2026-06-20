using System.Globalization;
using System.Text;
using EquipAI.Application.Services;
using EquipAI.Core.Enums;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.Application.Services;

/// <summary>
/// 数据导出服务 — 生成告警、审计日志的 CSV 内容，供前端下载
///
/// CSV 格式：UTF-8 with BOM（确保 Excel 中文不乱码），逗号分隔，含表头。
/// 复用项目内已有的 CSV 转义规则（与 DeviceImportService 一致）。
/// </summary>
public class DataExportService
{
    private readonly AppDbContext _db;

    public DataExportService(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// 导出告警为 CSV（支持按状态/级别/设备筛选，最多 10000 条）
    /// </summary>
    public async Task<byte[]> ExportAlertsAsync(
        Guid tenantId,
        AlertStatus? status = null,
        AlertSeverity? severity = null,
        Guid? deviceId = null,
        CancellationToken ct = default)
    {
        var query = _db.Alerts.AsQueryable();

        if (deviceId.HasValue)
            query = query.Where(a => a.DeviceId == deviceId.Value);
        if (status.HasValue)
            query = query.Where(a => a.Status == status.Value);
        if (severity.HasValue)
            query = query.Where(a => a.Severity == severity.Value);

        // 限制导出条数，防止超大文件拖垮内存
        var alerts = await query
            .OrderByDescending(a => a.OccurredAt)
            .Take(10000)
            .Select(a => new
            {
                a.AlertCode,
                a.DeviceId,
                a.Metric,
                Severity = a.Severity.ToString(),
                Status = a.Status.ToString(),
                a.Value,
                a.Message,
                OccurredAt = a.OccurredAt,
                AcknowledgedAt = a.AcknowledgedAt,
                ResolvedAt = a.ResolvedAt,
            })
            .ToListAsync(ct);

        var sb = new StringBuilder();
        sb.AppendLine("告警编码,设备ID,指标,级别,状态,触发值,告警信息,触发时间,确认时间,解决时间");

        foreach (var a in alerts)
        {
            sb.AppendLine(string.Join(',',
                Escape(a.AlertCode),
                a.DeviceId,
                Escape(a.Metric),
                a.Severity,
                a.Status,
                a.Value.ToString(CultureInfo.InvariantCulture),
                Escape(a.Message),
                FormatTime(a.OccurredAt),
                FormatTime(a.AcknowledgedAt),
                FormatTime(a.ResolvedAt)));
        }

        return ToCsvBytes(sb.ToString());
    }

    /// <summary>
    /// 导出审计日志为 CSV（最多 10000 条）
    /// </summary>
    public async Task<byte[]> ExportAuditLogsAsync(
        Guid tenantId,
        string? action = null,
        string? resourceType = null,
        CancellationToken ct = default)
    {
        var query = _db.UnfilteredSet<Core.Entities.AuditLog>()
            .Where(a => a.TenantId == tenantId);

        if (!string.IsNullOrWhiteSpace(action))
            query = query.Where(a => a.Action == action);
        if (!string.IsNullOrWhiteSpace(resourceType))
            query = query.Where(a => a.ResourceType == resourceType);

        var logs = await query
            .OrderByDescending(a => a.CreatedAt)
            .Take(10000)
            .Select(a => new
            {
                a.UserId,
                a.Action,
                a.ResourceType,
                a.ResourceId,
                a.Description,
                a.IpAddress,
                a.RequestPath,
                a.HttpMethod,
                a.CreatedAt,
            })
            .ToListAsync(ct);

        var sb = new StringBuilder();
        sb.AppendLine("操作用户ID,动作,资源类型,资源ID,描述,IP地址,请求路径,HTTP方法,操作时间");

        foreach (var l in logs)
        {
            sb.AppendLine(string.Join(',',
                l.UserId,
                Escape(l.Action),
                Escape(l.ResourceType),
                l.ResourceId ?? "",
                Escape(l.Description),
                Escape(l.IpAddress),
                Escape(l.RequestPath),
                Escape(l.HttpMethod),
                FormatTime(l.CreatedAt)));
        }

        return ToCsvBytes(sb.ToString());
    }

    /// <summary>CSV 字段转义：含逗号/引号/换行时用双引号包裹并转义内部引号</summary>
    private static string Escape(string? field)
    {
        if (string.IsNullOrEmpty(field)) return string.Empty;
        if (field.Contains(',') || field.Contains('"') || field.Contains('\n') || field.Contains('\r'))
            return $"\"{field.Replace("\"", "\"\"")}\"";
        return field;
    }

    /// <summary>时间格式化为本地可读格式</summary>
    private static string FormatTime(DateTime? time) =>
        time.HasValue ? time.Value.ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture) : "";

    /// <summary>转 UTF-8 with BOM 字节数组（Excel 中文兼容）</summary>
    private static byte[] ToCsvBytes(string content)
    {
        // BOM 头确保 Excel 双击打开 CSV 时中文不乱码
        var bom = new byte[] { 0xEF, 0xBB, 0xBF };
        var body = Encoding.UTF8.GetBytes(content);
        var result = new byte[bom.Length + body.Length];
        Buffer.BlockCopy(bom, 0, result, 0, bom.Length);
        Buffer.BlockCopy(body, 0, result, bom.Length, body.Length);
        return result;
    }

    /// <summary>
    /// 导出设备列表为 CSV（最多 10000 条）
    ///
    /// 字段选择：与前端 DeviceListPage 表格列对齐，确保用户导出后能直接看到熟悉的数据结构
    /// </summary>
    public async Task<byte[]> ExportDevicesAsync(
        Guid tenantId,
        string? status = null,
        string? type = null,
        CancellationToken ct = default)
    {
        // status 字符串解析为枚举：避免 EF Core 翻译枚举失败 + 友好错误
        DeviceStatus? statusEnum = null;
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<DeviceStatus>(status, ignoreCase: true, out var parsed))
            statusEnum = parsed;

        var query = _db.Devices.AsQueryable();
        if (statusEnum.HasValue)
            query = query.Where(d => d.Status == statusEnum.Value);
        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(d => d.Type == type);

        var devices = await query
            .OrderByDescending(d => d.CreatedAt)
            .Take(10000)
            .Select(d => new
            {
                d.DeviceCode,
                d.Name,
                d.Type,
                d.Manufacturer,
                d.Model,
                d.SerialNumber,
                Status = d.Status.ToString(),
                d.HealthScore,
                Criticality = d.Criticality.ToString(),
                CreatedAt = d.CreatedAt,
                LastDataAt = d.LastDataAt,
            })
            .ToListAsync(ct);

        var sb = new StringBuilder();
        sb.AppendLine("设备编码,名称,类型,制造商,型号,序列号,状态,健康度,关键等级,创建时间,最后数据时间");

        foreach (var d in devices)
        {
            sb.AppendLine(string.Join(',',
                Escape(d.DeviceCode),
                Escape(d.Name),
                Escape(d.Type),
                Escape(d.Manufacturer),
                Escape(d.Model),
                Escape(d.SerialNumber),
                Escape(d.Status),
                d.HealthScore.ToString(CultureInfo.InvariantCulture),
                Escape(d.Criticality),
                FormatTime(d.CreatedAt),
                FormatTime(d.LastDataAt)));
        }

        return ToCsvBytes(sb.ToString());
    }

    /// <summary>
    /// 导出工单列表为 CSV（最多 10000 条）
    ///
    /// 字段选择：覆盖工单生命周期关键节点（创建/派工/完成/关闭），适合月度运维报表
    /// </summary>
    public async Task<byte[]> ExportWorkOrdersAsync(
        Guid tenantId,
        string? status = null,
        string? priority = null,
        Guid? deviceId = null,
        CancellationToken ct = default)
    {
        var query = _db.WorkOrders.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(w => w.Status.ToString() == status);
        if (!string.IsNullOrWhiteSpace(priority))
            query = query.Where(w => w.Priority.ToString() == priority);
        if (deviceId.HasValue)
            query = query.Where(w => w.DeviceId == deviceId.Value);

        var workOrders = await query
            .OrderByDescending(w => w.CreatedAt)
            .Take(10000)
            .Select(w => new
            {
                w.WorkOrderCode,
                w.Title,
                Type = w.Type.ToString(),
                Status = w.Status.ToString(),
                Priority = w.Priority.ToString(),
                w.DeviceId,
                w.AssignedTo,
                RootCause = w.RootCause,
                Resolution = w.Resolution,
                ActualHours = w.ActualHours,
                CreatedAt = w.CreatedAt,
                StartedAt = w.StartedAt,
                CompletedAt = w.CompletedAt,
                ClosedAt = w.ClosedAt,
            })
            .ToListAsync(ct);

        var sb = new StringBuilder();
        sb.AppendLine("工单编码,标题,类型,状态,优先级,设备ID,负责人ID,根因,解决措施,实际工时,创建时间,开始时间,完成时间,关闭时间");

        foreach (var w in workOrders)
        {
            sb.AppendLine(string.Join(',',
                Escape(w.WorkOrderCode),
                Escape(w.Title),
                w.Type,
                w.Status,
                w.Priority,
                w.DeviceId,
                w.AssignedTo.HasValue ? w.AssignedTo.Value.ToString() : "",
                Escape(w.RootCause),
                Escape(w.Resolution),
                w.ActualHours?.ToString(CultureInfo.InvariantCulture) ?? "",
                FormatTime(w.CreatedAt),
                FormatTime(w.StartedAt),
                FormatTime(w.CompletedAt),
                FormatTime(w.ClosedAt)));
        }

        return ToCsvBytes(sb.ToString());
    }
}
