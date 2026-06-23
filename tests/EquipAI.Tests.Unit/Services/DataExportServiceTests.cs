using System.Text;
using EquipAI.Application.Services;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Xunit;

namespace EquipAI.Tests.Unit.Services;

/// <summary>
/// 数据导出服务单元测试
///
/// 核心验证点：CSV 公式注入防护（CWE-1236 / OWASP CSV Injection）。
/// 导出字段部分源自用户或外部输入——审计日志的请求路径（攻击者直接探测 <c>GET /=cmd|...</c> 即被记录）、
/// 告警消息、工单标题/根因/解决措施等。若这些字段以 <c>= + - @</c> 开头，管理员导出 CSV 后用
/// Excel/LibreOffice/WPS 打开时会被当作公式求值，触发命令执行或外链钓鱼。
/// 同时回归 RFC 4180 转义（逗号/引号）未被公式防护逻辑破坏。
/// </summary>
public class DataExportServiceTests
{
    private readonly AppDbContext _db;
    private readonly DataExportService _sut;
    private readonly Guid _tenantId;

    public DataExportServiceTests()
    {
        _tenantId = Guid.NewGuid();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestDataExport_{Guid.NewGuid()}")
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        _db = new AppDbContext(options, new TestTenantContext(_tenantId));
        _sut = new DataExportService(_db);
    }

    /// <summary>
    /// 公式注入载荷必须被前置单引号中和——Excel 将前置单引号视为"强制文本"标记，不求值。
    /// 覆盖 OWASP 列举的全部公式触发符：= + - @。
    /// </summary>
    [Theory]
    [InlineData("=cmd|'/c calc'!A1")] // 经典 DDE 命令注入载荷
    [InlineData("+1+1")]              // 算术公式触发符 +
    [InlineData("-2+cmd|'/c calc'!A1")] // 负号触发符 -
    [InlineData("@SUM(A1:A2)")]       // 函数触发符 @
    public async Task ExportAlertsAsync_当消息为公式注入载荷时_应前置单引号中和(string payload)
    {
        // Arrange — 告警消息写入攻击载荷
        _db.Alerts.Add(MakeAlert(message: payload));
        await _db.SaveChangesAsync();

        // Act
        var csv = Encoding.UTF8.GetString(await _sut.ExportAlertsAsync(_tenantId));

        // Assert — 载荷前被前置单引号，Excel 识别为纯文本不求值
        csv.Should().Contain("'" + payload,
            "以公式触发符开头的单元格必须前置单引号中和，防止 Excel 求值执行");
    }

    [Fact]
    public async Task ExportAlertsAsync_当消息含前置空格的公式载荷时_也应中和()
    {
        // Arrange — 攻击者常用前置空格绕过朴素的首字符检查（" =cmd"）
        _db.Alerts.Add(MakeAlert(message: " =HYPERLINK(\"http://evil\")"));
        await _db.SaveChangesAsync();

        var csv = Encoding.UTF8.GetString(await _sut.ExportAlertsAsync(_tenantId));

        // 前置单引号加在原始内容最前，覆盖前导空格绕过
        csv.Should().Contain("' =HYPERLINK");
    }

    [Fact]
    public async Task ExportAuditLogsAsync_当请求路径为公式载荷时_应中和()
    {
        // Arrange — 最现实的攻击向量：攻击者直接探测 GET /=cmd|... 即被审计记录
        _db.AuditLogs.Add(new AuditLog
        {
            TenantId = _tenantId,
            Action = "ApiAccess",
            ResourceType = "Api",
            Description = "可疑请求",
            RequestPath = "=cmd|'/c calc'!A1",
            HttpMethod = "GET",
            IpAddress = "203.0.113.1",
        });
        await _db.SaveChangesAsync();

        var csv = Encoding.UTF8.GetString(await _sut.ExportAuditLogsAsync(_tenantId));

        // 管理员导出审计日志、Excel 打开时，该路径单元格不得被求值
        csv.Should().Contain("'=cmd|", "被审计的恶意请求路径导出时必须中和，防止管理员 Excel 中招");
    }

    [Fact]
    public async Task ExportAlertsAsync_当消息含逗号时_应RFC4180引号包裹()
    {
        // Arrange — 含逗号的合法文本（回归：公式防护不得破坏既有 RFC 4180 转义）
        _db.Alerts.Add(MakeAlert(message: "温度,已超限"));
        await _db.SaveChangesAsync();

        var csv = Encoding.UTF8.GetString(await _sut.ExportAlertsAsync(_tenantId));

        csv.Should().Contain("\"温度,已超限\"", "含逗号字段必须按 RFC 4180 用双引号包裹，否则列错位");
    }

    [Fact]
    public async Task ExportAlertsAsync_当消息为普通文本时_不应被篡改()
    {
        // Arrange — 正常告警消息，不应被前置单引号影响展示
        _db.Alerts.Add(MakeAlert(message: "温度超过阈值90度"));
        await _db.SaveChangesAsync();

        var csv = Encoding.UTF8.GetString(await _sut.ExportAlertsAsync(_tenantId));

        csv.Should().Contain("温度超过阈值90度");
        csv.Should().NotContain("'温度", "不以公式触发符开头的普通文本不应被前置单引号");
    }

    /// <summary>
    /// 工单按状态过滤导出——必须用关系型提供程序（SQLite）验证。
    /// 工单状态/优先级枚举以 int 存储（无 HasConversion），导出代码用 w.Status.ToString() == status 在查询内比较，
    /// SQL 端得到的是数值字符串 "0" 而非枚举名 "PendingDispatch"，故在真实 PG/SQLite 上要么抛翻译异常、要么静默返回空。
    /// InMemory 提供程序客户端求值会让该比较在内存里成立，掩盖此缺陷（又一处测试提供程序盲点）。
    /// </summary>
    [Fact]
    public async Task ExportWorkOrdersAsync_当按状态过滤时_应返回匹配工单()
    {
        // 用 SQLite 内存库强制 SQL 翻译（关系型），而非 InMemory（客户端求值会掩盖缺陷）
        using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;
        await using var db = new AppDbContext(options, new TestTenantContext(_tenantId));
        await db.Database.EnsureCreatedAsync();

        db.WorkOrders.Add(new WorkOrder
        {
            TenantId = _tenantId,
            WorkOrderCode = "WO-REG-001",
            Title = "回归测试工单",
            Type = WorkOrderType.Corrective,
            Status = WorkOrderStatus.PendingDispatch,
            Priority = WorkOrderPriority.Medium,
            DeviceId = Guid.NewGuid(),
        });
        await db.SaveChangesAsync();

        var sqliteSut = new DataExportService(db);
        var csv = Encoding.UTF8.GetString(await sqliteSut.ExportWorkOrdersAsync(_tenantId, status: "PendingDispatch"));

        csv.Should().Contain("WO-REG-001", "按状态过滤应返回匹配的工单，而非静默返回空");
    }

    /// <summary>
    /// 设备导出必须包含导入可录入的全部配置字段，保证「导出-备份-迁移」工作流不丢数据。
    /// 回归 BUG-6：导入模板含 location/gateway_id/install_date/downtime_cost_per_hour（导入写入这 4 个字段），
    /// 但 ExportDevicesAsync 漏掉这 4 个字段 → 导入导出不对称，客户导出 CSV 做备份或报表时丢失
    /// 车间位置、网关绑定、安装日期、停机成本（ROI 分析基础）等关键运维配置。
    /// </summary>
    [Fact]
    public async Task ExportDevicesAsync_应导出完整配置字段_含位置网关安装日期停机成本()
    {
        _db.Devices.Add(new Device
        {
            TenantId = _tenantId,
            DeviceCode = "PUMP-EXPORT-001",
            Name = "一号循环泵",
            Type = "泵",
            Location = "{\"workshop\":\"A\",\"line\":\"1\"}",
            GatewayId = "gateway-001",
            InstallDate = new DateOnly(2024, 1, 15),
            DowntimeCostPerHour = 5000m,
            Status = DeviceStatus.Online,
        });
        await _db.SaveChangesAsync();

        var csv = Encoding.UTF8.GetString(await _sut.ExportDevicesAsync(_tenantId));

        csv.Should().Contain("PUMP-EXPORT-001");
        // 修复前：导出缺这 4 个配置字段，备份/报表丢失关键运维数据
        csv.Should().Contain("workshop", "导出应包含 location（车间/产线/工位层级配置）");
        csv.Should().Contain("gateway-001", "导出应包含 gateway_id（网关绑定）");
        csv.Should().Contain("2024-01-15", "导出应包含 install_date（安装日期）");
        csv.Should().Contain("5000", "导出应包含 downtime_cost_per_hour（停机成本，ROI 分析基础）");
    }

    /// <summary>构造一条最小可用告警，便于各测试聚焦于被测字段</summary>
    private Alert MakeAlert(string? message = null)
    {
        return new Alert
        {
            TenantId = _tenantId,
            AlertCode = "ALT-TEST-001",
            DeviceId = Guid.NewGuid(),
            Severity = AlertSeverity.Low,
            Status = AlertStatus.Active,
            Metric = "temperature",
            Value = 95m,
            Message = message,
            OccurredAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
        };
    }

    /// <summary>测试用租户上下文 — 固定 TenantId，模拟请求级租户隔离</summary>
    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode { get; } = "Shared";
        public bool IsSystemAdmin { get; } = false;
        public Guid UserId { get; } = Guid.Empty;
    }
}
