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

    /// <summary>
    /// CSV 字段转义：先中和公式注入（CWE-1236），再做 RFC 4180 转义。
    ///
    /// 顺序很重要：必须先 <see cref="SanitizeFormula"/> 再判定是否需要引号包裹——
    /// 公式触发符（= + - @）本身不含逗号/引号，若先转义会原样写入，注入仍在。
    /// </summary>
    private static string Escape(string? field)
    {
        if (string.IsNullOrEmpty(field)) return string.Empty;

        // 第一步：中和 CSV 公式注入（详见 SanitizeFormula）
        var sanitized = SanitizeFormula(field);

        // 第二步：RFC 4180 转义——含逗号/引号/换行时用双引号包裹并转义内部引号
        if (sanitized.Contains(',') || sanitized.Contains('"') || sanitized.Contains('\n') || sanitized.Contains('\r'))
            return $"\"{sanitized.Replace("\"", "\"\"")}\"";
        return sanitized;
    }

    /// <summary>
    /// 中和 CSV 公式注入（CWE-1236 / OWASP：CSV Injection）。
    ///
    /// 为什么需要：导出的字段（告警消息、工单标题/根因/解决措施、审计日志的请求路径与描述等）
    /// 部分源自用户或外部输入。攻击者可构造以 <c>=</c> 开头的载荷（如 <c>=cmd|'/c calc'!A1</c>、
    /// <c>=HYPERLINK("http://evil")</c>）写入这些字段；最现实的向量是审计日志的 RequestPath——
    /// 攻击者直接探测 <c>GET /=cmd|...</c> 即被记录。管理员随后导出 CSV 并用 Excel/LibreOffice/WPS 打开时，
    /// 这些单元格会被当作公式求值，触发命令执行或外链钓鱼。
    ///
    /// 防护：若单元格首个字符为制表/回车（部分表格软件的 DDE 触发符），或首个非空白字符为
    /// 公式触发符（<c>=</c> <c>+</c> <c>-</c> <c>@</c>），在内容前前置单引号 <c>'</c>。
    /// Excel 将前置单引号视为"强制文本"标记：不在界面显示、亦不求值，从而把载荷降级为纯文本。
    /// 前导空白也要检查，以封堵 <c>" =cmd"</c> 这类绕过。
    /// </summary>
    private static string SanitizeFormula(string field)
    {
        if (string.IsNullOrEmpty(field)) return field;

        // 首字符为制表/回车——直接前置单引号
        var first = field[0];
        if (first == '\t' || first == '\r')
            return "'" + field;

        // 跳过前导空白后检查首个字符是否为公式触发符（兼容前置空格绕过）
        var trimmed = field.AsSpan().TrimStart();
        if (!trimmed.IsEmpty)
        {
            var c = trimmed[0];
            if (c == '=' || c == '+' || c == '-' || c == '@')
                return "'" + field;
        }

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
                // 补全导入可录入但导出遗漏的配置字段，保证「导出-备份-迁移」不丢数据（回归 BUG-6）：
                // location（车间/产线/工位层级，jsonb 存为 JSON 字符串）、gateway_id（网关绑定）、
                // install_date（安装日期）、downtime_cost_per_hour（停机成本，ROI 分析基础）。
                // 原导出漏掉这 4 个字段，客户导出 CSV 做备份或报表时丢失关键运维配置。
                Location = d.Location,
                GatewayId = d.GatewayId,
                InstallDate = d.InstallDate,
                DowntimeCostPerHour = d.DowntimeCostPerHour,
            })
            .ToListAsync(ct);

        var sb = new StringBuilder();
        sb.AppendLine("设备编码,名称,类型,制造商,型号,序列号,状态,健康度,关键等级,创建时间,最后数据时间,安装位置,网关ID,安装日期,停机成本(元/小时)");

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
                FormatTime(d.LastDataAt),
                // 4 个配置字段（location 是 JSON 字符串，Escape 已处理公式中和 + RFC 4180 转义）
                Escape(d.Location),
                Escape(d.GatewayId),
                d.InstallDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? "",
                d.DowntimeCostPerHour?.ToString(CultureInfo.InvariantCulture) ?? ""));
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

        // status/priority 字符串先在客户端解析为枚举，再在查询内做枚举比较（可翻译为 SQL 整数比较）。
        // 不可用 w.Status.ToString() == status：枚举以 int 存储（无 HasConversion），
        // 查询内 ToString() 既无法翻译（抛 InvalidOperationException）、即使能翻译得到的也是数值字符串而非枚举名。
        // 与 ExportDevicesAsync 的 status 处理保持一致。
        WorkOrderStatus? statusEnum = null;
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<WorkOrderStatus>(status, ignoreCase: true, out var parsedStatus))
            statusEnum = parsedStatus;
        WorkOrderPriority? priorityEnum = null;
        if (!string.IsNullOrWhiteSpace(priority) && Enum.TryParse<WorkOrderPriority>(priority, ignoreCase: true, out var parsedPriority))
            priorityEnum = parsedPriority;

        if (statusEnum.HasValue)
            query = query.Where(w => w.Status == statusEnum.Value);
        if (priorityEnum.HasValue)
            query = query.Where(w => w.Priority == priorityEnum.Value);
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
