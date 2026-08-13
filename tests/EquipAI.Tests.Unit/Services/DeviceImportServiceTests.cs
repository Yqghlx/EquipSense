using EquipAI.Application.DTOs.Devices;
using EquipAI.Application.Services;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace EquipAI.Tests.Unit.Services;

/// <summary>
/// 设备批量导入服务单元测试
///
/// 设备导入是工业客户交付的 P0 阻塞项（客户首次上线需批量录入现有设备清单），
/// 该功能此前零测试覆盖。本测试覆盖：CSV/JSON 解析、必填校验、字段长度、
/// 关键等级/日期/成本格式校验、文件内与库内去重、租户配额、实际写入。
/// </summary>
public class DeviceImportServiceTests
{
    private readonly AppDbContext _db;
    private readonly DeviceImportService _sut;
    private readonly Mock<IAuditLogService> _auditLogMock;
    private readonly Guid _tenantId;

    public DeviceImportServiceTests()
    {
        // 使用固定的租户 ID，确保测试数据与全局过滤器一致
        _tenantId = Guid.NewGuid();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestDeviceImport_{Guid.NewGuid()}")
            // 生产环境使用 PostgreSQL 真实事务；InMemory 提供程序不支持事务，
            // 此处忽略其 TransactionIgnoredWarning，使导入的事务包装代码在测试中可执行
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        _db = new AppDbContext(options, new TestTenantContext(_tenantId));
        _auditLogMock = new Mock<IAuditLogService>();

        var logger = LoggerFactory.Create(_ => { }).CreateLogger<DeviceImportService>();
        _sut = new DeviceImportService(_db, _auditLogMock.Object, logger);
    }

    // ========================================================================
    // CSV 预览测试
    // ========================================================================

    [Fact]
    public void PreviewImport_当CSV格式正确时_应返回有效预览项()
    {
        // Arrange — 含必填列与若干可选列
        var csv = """
                  device_code,name,type,manufacturer,criticality,install_date,downtime_cost_per_hour
                  PUMP-001,一号循环泵,泵,南方泵业,Critical,2024-01-15,5000
                  MOTOR-002,主驱动电机,电机,ABB,High,2024-03-01,8000
                  """;

        // Act
        var result = _sut.PreviewImport(csv, "devices.csv");

        // Assert
        result.ValidCount.Should().Be(2);
        result.ErrorCount.Should().Be(0);
        result.ValidItems[0].DeviceCode.Should().Be("PUMP-001");
        result.ValidItems[0].Criticality.Should().Be("Critical");
        result.ValidItems[0].InstallDate.Should().Be("2024-01-15");
        result.ValidItems[0].DowntimeCostPerHour.Should().Be(5000m);
    }

    [Fact]
    public void PreviewImport_当缺少必填列时_应报错()
    {
        // Arrange — 缺少 device_code 列
        var csv = "name,type\n一号循环泵,泵\n";

        // Act
        var result = _sut.PreviewImport(csv, "devices.csv");

        // Assert
        result.ValidCount.Should().Be(0);
        result.Errors.Should().Contain(e => e.Message.Contains("device_code"));
    }

    [Fact]
    public void PreviewImport_当必填字段为空时_应收集所有错误()
    {
        // Arrange — 某行三个必填字段全空
        var csv = "device_code,name,type\n,,\n";

        // Act
        var result = _sut.PreviewImport(csv, "devices.csv");

        // Assert — 一次性报出三个缺失错误，方便用户修正
        result.ValidCount.Should().Be(0);
        var rowErrors = result.Errors.Where(e => e.RowNumber == 2).ToList();
        rowErrors.Should().HaveCount(3);
        rowErrors.Select(e => e.Message).Should().ContainMatch("*device_code*")
            .And.ContainMatch("*name*")
            .And.ContainMatch("*type*");
    }

    [Theory]
    [InlineData("BAD", "关键等级")] // 关键等级枚举值非法
    [InlineData("2024/01/15", "安装日期")] // 日期格式非 yyyy-MM-dd
    [InlineData("-100", "停机成本")] // 停机成本为负数
    public void PreviewImport_当可选字段格式错误时_应报对应错误(string badValue, string errorKeyword)
    {
        // Arrange — criticality / install_date / downtime_cost 分别置入非法值
        var csv = $"device_code,name,type,criticality,install_date,downtime_cost_per_hour\nD-001,设备,泵,{badValue},{badValue},{badValue}\n";

        // Act
        var result = _sut.PreviewImport(csv, "devices.csv");

        // Assert
        result.ValidCount.Should().Be(0);
        result.Errors.Should().Contain(e => e.Message.Contains(errorKeyword));
    }

    [Fact]
    public void PreviewImport_当文件内设备编码重复时_应报重复错误()
    {
        // Arrange — 第二行与第一行编码相同（大小写不同也算重复）
        var csv = "device_code,name,type\nPUMP-001,一号泵,泵\npump-001,重复泵,泵\n";

        // Act
        var result = _sut.PreviewImport(csv, "devices.csv");

        // Assert — 第二行重复被识别（错误消息中的编码为该行原始大小写 pump-001）
        result.ValidCount.Should().Be(1);
        result.Errors.Should().Contain(e =>
            e.Message.Contains("重复") &&
            e.Message.Contains("pump-001", StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// 回归：被拒的无效行不得"占用"其设备编码，否则后续有效的同名行被误报重复而丢弃。
    ///
    /// 历史缺陷：ValidateRow 在判断 name/type 等其余字段之前，就先把 device_code 加入 seenCodes，
    /// 导致即便该行因缺 name 被拒，编码也已被"占用"。随后真正完整的同名行命中 seenCodes，
    /// 被误报"文件内设备编码重复"并跳过。对批量上线（数百台设备）的客户，CSV 中一处笔误会连锁误杀
    /// 有效行，且报错信息（"重复"）完全误导——客户看到编码只出现一次却报重复，无法理解。
    /// </summary>
    [Fact]
    public void PreviewImport_当无效行与后续有效行编码相同时_不应误报重复()
    {
        // Arrange — 第一数据行 PUMP-001 缺 name（无效），第二数据行 PUMP-001 完整有效
        var csv = "device_code,name,type\nPUMP-001,,泵\nPUMP-001,一号泵,泵\n";

        // Act
        var result = _sut.PreviewImport(csv, "devices.csv");

        // Assert — 无效行照常报缺 name，但有效的第二行必须被接受，不得误判重复
        result.ValidCount.Should().Be(1, "被拒的无效行不应占用编码，后续有效同名行应被接受");
        result.ValidItems[0].DeviceCode.Should().Be("PUMP-001");
        result.ValidItems[0].Name.Should().Be("一号泵");
        result.Errors.Should().NotContain(e => e.Message.Contains("重复"),
            "有效的同名行不应因前序无效行占用编码而被误报为重复");
        result.Errors.Should().Contain(e => e.RowNumber == 2 && e.Message.Contains("name"),
            "第一行缺 name 应照常报错");
    }

    /// <summary>
    /// JSON 导入路径与 CSV 共用 ValidateRow，须同样不误杀（防止修复只覆盖 CSV 路径）。
    /// </summary>
    [Fact]
    public void PreviewImport_当JSON无效项与后续有效项编码相同时_不应误报重复()
    {
        // Arrange — 第一项缺 name（无效），第二项完整有效，编码相同
        var json = """
                   [
                     { "device_code": "PUMP-001", "name": "", "type": "泵" },
                     { "device_code": "PUMP-001", "name": "一号泵", "type": "泵" }
                   ]
                   """;

        // Act
        var result = _sut.PreviewImport(json, "devices.json");

        // Assert
        result.ValidCount.Should().Be(1);
        result.ValidItems[0].Name.Should().Be("一号泵");
        result.Errors.Should().NotContain(e => e.Message.Contains("重复"));
    }

    [Fact]
    public void PreviewImport_当含BOM和CRLF时_应正常解析()
    {
        // Arrange — 中文 Excel 导出的 CSV 常带 UTF-8 BOM 头与 \r\n 换行
        var bom = "﻿";
        var csv = bom + "device_code,name,type\r\nPUMP-001,一号循环泵,泵\r\n";

        // Act
        var result = _sut.PreviewImport(csv, "devices.csv");

        // Assert
        result.ValidCount.Should().Be(1);
        result.ValidItems[0].DeviceCode.Should().Be("PUMP-001");
        result.ValidItems[0].Name.Should().Be("一号循环泵");
    }

    [Fact]
    public void PreviewImport_当含引号内逗号时_应正确切分()
    {
        // Arrange — location 字段含 JSON，内有逗号，需用引号包裹
        var csv = "device_code,name,type,location\nD-001,设备,泵,\"{\\\"workshop\\\":\\\"A\\\",\\\"line\\\":\\\"1\\\"}\"\n";

        // Act
        var result = _sut.PreviewImport(csv, "devices.csv");

        // Assert
        result.ValidCount.Should().Be(1);
        result.ValidItems[0].Location.Should().Contain("workshop");
    }

    [Fact]
    public void PreviewImport_当内容为空时_应报错()
    {
        // Act
        var result = _sut.PreviewImport("   ", "devices.csv");

        // Assert
        result.ValidCount.Should().Be(0);
        result.Errors.Should().NotBeEmpty();
    }

    // ========================================================================
    // JSON 预览测试
    // ========================================================================

    [Fact]
    public void PreviewImport_当JSON为snake_case时_应正确解析()
    {
        // Arrange
        var json = """
                   [
                     { "device_code": "PUMP-001", "name": "一号泵", "type": "泵", "criticality": "Critical" }
                   ]
                   """;

        // Act
        var result = _sut.PreviewImport(json, "devices.json");

        // Assert
        result.ValidCount.Should().Be(1);
        result.ValidItems[0].DeviceCode.Should().Be("PUMP-001");
    }

    [Fact]
    public void PreviewImport_当JSON为camelCase时_应兼容解析()
    {
        // Arrange — camelCase 字段名
        var json = """
                   [
                     { "deviceCode": "M-001", "name": "电机", "type": "电机", "serialNumber": "SN001" }
                   ]
                   """;

        // Act
        var result = _sut.PreviewImport(json, "devices.json");

        // Assert
        result.ValidCount.Should().Be(1);
        result.ValidItems[0].SerialNumber.Should().Be("SN001");
    }

    [Fact]
    public void PreviewImport_当JSON格式非法时_应报解析错误()
    {
        // Arrange — 缺少闭合括号
        var json = "[{ device_code: ";

        // Act
        var result = _sut.PreviewImport(json, "devices.json");

        // Assert
        result.ValidCount.Should().Be(0);
        result.Errors.Should().Contain(e => e.Message.Contains("JSON"));
    }

    [Fact]
    public void PreviewImport_当JSON数组为空时_应报错()
    {
        // Act
        var result = _sut.PreviewImport("[]", "devices.json");

        // Assert
        result.ValidCount.Should().Be(0);
        result.Errors.Should().NotBeEmpty();
    }

    // ========================================================================
    // 实际导入测试（写入数据库）
    // ========================================================================

    [Fact]
    public async Task ExecuteImportAsync_当数据合法时_应写入设备并记录审计()
    {
        // Arrange
        var csv = "device_code,name,type\nPUMP-001,一号泵,泵\nMOTOR-002,主电机,电机\n";
        var userId = Guid.NewGuid();

        // Act
        var result = await _sut.ExecuteImportAsync(csv, "devices.csv", _tenantId, userId, default);

        // Assert — 两台设备均已写入，状态为离线（导入时尚未接入遥测）
        result.Imported.Should().Be(2);
        result.Failed.Should().Be(0);
        var devices = await _db.Devices.ToListAsync();
        devices.Should().HaveCount(2);
        devices.Should().AllSatisfy(d => d.Status.Should().Be(DeviceStatus.Offline));
        devices.Should().AllSatisfy(d => d.TenantId.Should().Be(_tenantId));
        // 审计日志被调用（事务外，导入成功后记录）
        _auditLogMock.Verify(a => a.LogFromContextAsync(
            "DevicesImported", "Device", It.IsAny<string>(), It.IsAny<string>(), default), Times.Once);
    }

    [Fact]
    public async Task ExecuteImportAsync_当设备编码库内已存在时_应跳过而非报错()
    {
        // Arrange — 预置一条已存在的设备
        _db.Devices.Add(new Device
        {
            TenantId = _tenantId,
            DeviceCode = "PUMP-001",
            Name = "已有泵",
            Type = "泵",
            Status = DeviceStatus.Offline,
        });
        await _db.SaveChangesAsync();

        var csv = "device_code,name,type\nPUMP-001,新泵,泵\nMOTOR-002,电机,电机\n";

        // Act
        var result = await _sut.ExecuteImportAsync(csv, "devices.csv", _tenantId, Guid.NewGuid(), default);

        // Assert — 已存在的跳过，新设备正常导入
        result.Imported.Should().Be(1);
        result.Skipped.Should().BeGreaterThanOrEqualTo(1);
        (await _db.Devices.CountAsync()).Should().Be(2);
    }

    [Fact]
    public async Task ExecuteImportAsync_当超出租户配额时_应拒绝并不写入()
    {
        // Arrange — 租户配额设为 1，预置 1 台设备，再导入 1 台应超额
        var tenant = new Tenant
        {
            Id = _tenantId,
            Name = "测试租户",
            MaxDevices = 1,
            CurrentDeviceCount = 1,
        };
        _db.Add(tenant);
        _db.Devices.Add(new Device
        {
            TenantId = _tenantId,
            DeviceCode = "EXIST-001",
            Name = "已有",
            Type = "泵",
            Status = DeviceStatus.Offline,
        });
        await _db.SaveChangesAsync();

        var csv = "device_code,name,type\nNEW-001,新设备,泵\n";

        // Act
        var result = await _sut.ExecuteImportAsync(csv, "devices.csv", _tenantId, Guid.NewGuid(), default);

        // Assert — 配额不足，全部失败，无新增写入
        result.Imported.Should().Be(0);
        result.Errors.Should().Contain(e => e.Message.Contains("配额"));
        (await _db.Devices.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task ExecuteImportAsync_重复设备不应消耗剩余配额()
    {
        // 导入文件可能包含客户重复上传的完整清单；已存在的编码会被跳过，不应因为配额已满而误报整批失败。
        var tenant = new Tenant
        {
            Id = _tenantId,
            Name = "测试租户",
            MaxDevices = 1,
            CurrentDeviceCount = 1,
        };
        _db.Add(tenant);
        _db.Devices.Add(new Device
        {
            TenantId = _tenantId,
            DeviceCode = "EXIST-001",
            Name = "已有",
            Type = "泵",
            Status = DeviceStatus.Offline,
        });
        await _db.SaveChangesAsync();

        var result = await _sut.ExecuteImportAsync(
            "device_code,name,type\nEXIST-001,重复设备,泵\n",
            "devices.csv", _tenantId, Guid.NewGuid(), default);

        result.Imported.Should().Be(0);
        result.Skipped.Should().BeGreaterThanOrEqualTo(1);
        result.Errors.Should().NotContain(e => e.Message.Contains("配额"));
        (await _db.Devices.CountAsync()).Should().Be(1);
    }

    [Fact]
    public void GenerateCsvTemplate_应包含所有必填列和示例()
    {
        // Act
        var template = DeviceImportService.GenerateCsvTemplate();

        // Assert — 模板含必填列名与示例数据行
        template.Should().Contain("device_code");
        template.Should().Contain("name");
        template.Should().Contain("type");
        template.Should().Contain("PUMP-001"); // 示例数据
    }

    // ========================================================================
    // Location 规范化测试（jsonb 列防崩溃）
    // ========================================================================

    /// <summary>
    /// location 列为 jsonb，纯文本会触发 PG 校验失败回滚整批。
    /// 此缺陷在 InMemory/SQLite 测试库上无法复现（两者不强制 jsonb），仅真实 PostgreSQL 暴露，
    /// 因此直接断言规范化逻辑产出合法 JSON。
    /// </summary>
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void NormalizeLocation_当为空或空白时_应返回空对象(string? location)
    {
        DeviceImportService.NormalizeLocation(location).Should().Be("{}");
    }

    [Fact]
    public void NormalizeLocation_当为纯文本时_应包装为合法JSON且不丢数据()
    {
        // 客户最常见场景：不知道 JSON 语法，直接填中文位置
        var result = DeviceImportService.NormalizeLocation("A厂1车间3工位");

        // 产出必须是合法 JSON（这是 jsonb 列的唯一硬性要求）
        FluentActions.Invoking(() => System.Text.Json.JsonDocument.Parse(result))
            .Should().NotThrow("规范化结果必须是合法 JSON，否则 jsonb 列校验失败");
        // 原始文本不得丢失
        result.Should().Contain("A厂1车间3工位");
        result.Should().StartWith("{");
    }

    [Fact]
    public void NormalizeLocation_当已是合法JSON时_应原样保留()
    {
        // 模板示例形态，JSON 熟练客户不应被改写
        var json = "{\"workshop\":\"A\",\"line\":\"1\"}";
        DeviceImportService.NormalizeLocation(json).Should().Be(json);
    }

    [Fact]
    public void NormalizeLocation_当文本含特殊字符时_应正确转义产出合法JSON()
    {
        // 含引号、反斜杠的文本——必须被 JSON 转义，否则产出非法 JSON
        var result = DeviceImportService.NormalizeLocation("A\"厂\\1线");

        FluentActions.Invoking(() => System.Text.Json.JsonDocument.Parse(result))
            .Should().NotThrow("含特殊字符的文本经转义后仍须是合法 JSON");
    }

    [Fact]
    public async Task ExecuteImportAsync_当location为纯文本时_应正常导入不崩溃且存为合法JSON()
    {
        // 回归：历史上此场景会在真实 PG 上抛 invalid json 并回滚整批；
        // 修复后位置被规范化为合法 JSON，导入成功。
        var csv = "device_code,name,type,location\nD-001,设备,泵,A厂1车间\n";

        var result = await _sut.ExecuteImportAsync(csv, "devices.csv", _tenantId, Guid.NewGuid(), default);

        result.Imported.Should().Be(1);
        result.Failed.Should().Be(0);
        var device = await _db.Devices.FirstAsync();
        // 存储值必须是合法 JSON（jsonb 列硬性要求）
        FluentActions.Invoking(() => System.Text.Json.JsonDocument.Parse(device.Location))
            .Should().NotThrow();
        device.Location.Should().Contain("A厂1车间", "纯文本位置不得丢失");
    }

    public async ValueTask DisposeAsync()
    {
        await _db.DisposeAsync();
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
