using System.Text;
using System.Text.Json;
using EquipAI.Application.Knowledge;
using EquipAI.Application.Knowledge.DTOs;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace EquipAI.Tests.Unit.Knowledge;

public class KnowledgeImportServiceTests
{
    private readonly AppDbContext _db;
    private readonly KnowledgeImportService _sut;
    private readonly Mock<IAuditLogService> _auditLogMock;
    private readonly Mock<KnowledgeVersionService> _versionServiceMock;
    private readonly Guid _tenantId;

    public KnowledgeImportServiceTests()
    {
        // 使用固定的租户 ID，确保测试数据与全局过滤器一致
        _tenantId = Guid.NewGuid();

        // 创建 InMemory 数据库
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestKnowledgeImport_{Guid.NewGuid()}")
            .Options;

        _db = new AppDbContext(options, new TestTenantContext(_tenantId));

        _auditLogMock = new Mock<IAuditLogService>();
        var versionLogger = LoggerFactory.Create(_ => { }).CreateLogger<KnowledgeVersionService>();
        _versionServiceMock = new Mock<KnowledgeVersionService>(
            _db, _auditLogMock.Object, versionLogger, new TestTenantContext(_tenantId));

        var logger = LoggerFactory.Create(_ => { }).CreateLogger<KnowledgeImportService>();
        _sut = new KnowledgeImportService(
            _db, _versionServiceMock.Object, _auditLogMock.Object, logger);
    }

    // ========================================================================
    // CSV 预览测试
    // ========================================================================

    [Fact]
    public void PreviewImport_当CSV格式正确时_应返回有效预览项()
    {
        // Arrange
        var csv = """
                  device_type,name,conditions,conclusion,recommended_actions,check_steps,confidence_weight
                  电机,电机过热,"[{""metric"":""temperature"",""operator"":"">"",""threshold"":80}]",温度过高,检查散热,1. 测温,0.85
                  泵,泵压力异常,"[{""metric"":""pressure"",""operator"":""<"",""threshold"":0.5}]",压力偏低,检查滤网,1. 测压,0.7
                  """;

        // Act
        var result = _sut.PreviewImport(csv, "rules.csv");

        // Assert
        result.Should().NotBeNull();
        result.TotalRows.Should().Be(2);
        result.ValidCount.Should().Be(2);
        result.ErrorCount.Should().Be(0);

        result.ValidItems[0].DeviceType.Should().Be("电机");
        result.ValidItems[0].Name.Should().Be("电机过热");
        result.ValidItems[0].Conclusion.Should().Be("温度过高");
        result.ValidItems[0].ConfidenceWeight.Should().Be(0.85m);
        result.ValidItems[0].RowNumber.Should().Be(2);

        result.ValidItems[1].DeviceType.Should().Be("泵");
        result.ValidItems[1].Name.Should().Be("泵压力异常");
        result.ValidItems[1].ConfidenceWeight.Should().Be(0.7m);
    }

    [Fact]
    public void PreviewImport_当CSV缺少必填列时_应返回错误()
    {
        // Arrange — 缺少 name 和 conclusion 列
        var csv = "device_type,conditions\n电机,[]\n";

        // Act
        var result = _sut.PreviewImport(csv, "rules.csv");

        // Assert
        result.ErrorCount.Should().BeGreaterThan(0);
        result.Errors.Should().Contain(e => e.Message.Contains("缺少必填列"));
    }

    [Fact]
    public void PreviewImport_当CSV某行缺少必填字段时_应标记该行为错误()
    {
        // Arrange — 第二行 device_type 为空
        var csv = """
                  device_type,name,conditions,conclusion
                  电机,正常规则,[],正常结论
                  ,缺设备类型,[],某个结论
                  泵,,[],泵结论
                  """;

        // Act
        var result = _sut.PreviewImport(csv, "rules.csv");

        // Assert
        result.TotalRows.Should().Be(3);
        result.ValidCount.Should().Be(1);
        result.ErrorCount.Should().Be(2);
        result.Errors.Should().Contain(e => e.RowNumber == 3 && e.Message.Contains("device_type"));
        result.Errors.Should().Contain(e => e.RowNumber == 4 && e.Message.Contains("name"));
    }

    // ========================================================================
    // JSON 预览测试
    // ========================================================================

    [Fact]
    public void PreviewImport_当JSON格式正确时_应返回有效预览项()
    {
        // Arrange
        var json = """
                   [
                     {
                       "device_type": "电机",
                       "name": "电机过热诊断",
                       "conditions": "[{\"metric\":\"temperature\",\"operator\":\">\",\"threshold\":80}]",
                       "conclusion": "电机温度过高",
                       "recommended_actions": "检查散热系统",
                       "check_steps": "1. 测温",
                       "confidence_weight": 0.85
                     }
                   ]
                   """;

        // Act
        var result = _sut.PreviewImport(json, "rules.json");

        // Assert
        result.TotalRows.Should().Be(1);
        result.ValidCount.Should().Be(1);
        result.ErrorCount.Should().Be(0);
        result.ValidItems[0].DeviceType.Should().Be("电机");
        result.ValidItems[0].Name.Should().Be("电机过热诊断");
        result.ValidItems[0].ConfidenceWeight.Should().Be(0.85m);
    }

    [Fact]
    public void PreviewImport_当JSON字段名为camelCase时_应兼容解析()
    {
        // Arrange — 使用 camelCase 字段名
        var json = """
                   [
                     {
                       "deviceType": "CNC",
                       "name": "主轴温度异常",
                       "conditions": "[]",
                       "conclusion": "主轴过热",
                       "recommendedActions": "检查冷却液",
                       "checkSteps": "1. 检查冷却系统",
                       "confidenceWeight": 0.9
                     }
                   ]
                   """;

        // Act
        var result = _sut.PreviewImport(json, "rules.json");

        // Assert
        result.ValidCount.Should().Be(1);
        result.ErrorCount.Should().Be(0);
        result.ValidItems[0].DeviceType.Should().Be("CNC");
        result.ValidItems[0].RecommendedActions.Should().Be("检查冷却液");
        result.ValidItems[0].ConfidenceWeight.Should().Be(0.9m);
    }

    [Fact]
    public void PreviewImport_当JSON解析失败时_应返回解析错误()
    {
        // Arrange — 无效的 JSON
        var invalidJson = "{ this is not valid json";

        // Act
        var result = _sut.PreviewImport(invalidJson, "rules.json");

        // Assert
        result.ErrorCount.Should().Be(1);
        result.Errors[0].Message.Should().Contain("JSON 解析失败");
    }

    // ========================================================================
    // confidence_weight 校验测试
    // ========================================================================

    [Fact]
    public void PreviewImport_当confidenceWeight超出范围时_应返回错误()
    {
        // Arrange — confidence_weight = 1.5 超出 [0,1] 范围
        var csv = """
                  device_type,name,conditions,conclusion,confidence_weight
                  电机,测试规则,[],结论,1.5
                  """;

        // Act
        var result = _sut.PreviewImport(csv, "rules.csv");

        // Assert
        result.ErrorCount.Should().Be(1);
        result.Errors[0].Message.Should().Contain("confidence_weight");
        result.Errors[0].Message.Should().Contain("[0,1]");
    }

    // ========================================================================
    // 空内容测试
    // ========================================================================

    [Fact]
    public void PreviewImport_当文件内容为空时_应抛出ArgumentException()
    {
        // Act
        var act = () => _sut.PreviewImport("", "rules.csv");

        // Assert
        act.Should().Throw<ArgumentException>().WithMessage("*文件内容不能为空*");
    }

    // ========================================================================
    // CSV 导出测试
    // ========================================================================

    [Fact]
    public async Task ExportAsCsvAsync_应生成包含表头和数据的CSV()
    {
        // Arrange
        var rules = new List<KnowledgeRule>
        {
            new()
            {
                TenantId = _tenantId,
                DeviceType = "电机",
                Name = "电机过热",
                Conditions = """[{"metric":"temperature","operator":">","threshold":80}]""",
                Conclusion = "温度过高",
                RecommendedActions = "检查散热",
                CheckSteps = "测温",
                ConfidenceWeight = 0.85m
            }
        };
        _db.KnowledgeRules.AddRange(rules);
        await _db.SaveChangesAsync();

        // Act
        var csv = await _sut.ExportAsCsvAsync(_tenantId, null, CancellationToken.None);

        // Assert
        csv.Should().Contain("device_type,name,conditions,conclusion");
        csv.Should().Contain("电机");
        csv.Should().Contain("电机过热");
        csv.Should().Contain("0.85");
    }

    // ========================================================================
    // JSON 导出测试
    // ========================================================================

    [Fact]
    public async Task ExportAsJsonAsync_应生成格式化的JSON数组()
    {
        // Arrange
        var rules = new List<KnowledgeRule>
        {
            new()
            {
                TenantId = _tenantId,
                DeviceType = "泵",
                Name = "泵压力异常",
                Conditions = """[{"metric":"pressure","operator":"<","threshold":0.5}]""",
                Conclusion = "压力偏低",
                ConfidenceWeight = 0.7m
            }
        };
        _db.KnowledgeRules.AddRange(rules);
        await _db.SaveChangesAsync();

        // Act
        var json = await _sut.ExportAsJsonAsync(_tenantId, null, CancellationToken.None);

        // Assert
        json.Should().StartWith("[");
        json.Should().Contain("\"DeviceType\": \"泵\"");
        json.Should().Contain("\"Name\": \"泵压力异常\"");
        json.Should().Contain("\"ConfidenceWeight\": 0.7");
    }

    /// <summary>
    /// 导出必须限制返回条数，避免租户规则长期增长后一次性把全部内容加载到应用内存。
    /// JSON 与 CSV 共用同一条数上限和稳定排序，防止两种格式导出结果边界不一致。
    /// </summary>
    [Fact]
    public async Task ExportAsJson和CsvAsync_超过上限时应只返回最新上限条规则()
    {
        var rules = Enumerable.Range(0, KnowledgeImportService.MaxExportRules + 1)
            .Select(index => new KnowledgeRule
            {
                TenantId = _tenantId,
                DeviceType = "电机",
                Name = $"规则-{index:D5}",
                Conditions = "[]",
                Conclusion = "测试结论",
                CreatedAt = DateTime.UnixEpoch.AddMinutes(index),
            })
            .ToList();
        _db.KnowledgeRules.AddRange(rules);
        await _db.SaveChangesAsync();

        var json = await _sut.ExportAsJsonAsync(_tenantId, null, CancellationToken.None);
        var csv = await _sut.ExportAsCsvAsync(_tenantId, null, CancellationToken.None);

        using var jsonDocument = JsonDocument.Parse(json);
        jsonDocument.RootElement.GetArrayLength().Should().Be(KnowledgeImportService.MaxExportRules);
        json.Should().Contain("规则-10000");
        json.Should().NotContain("规则-00000");
        csv.Split('\n', StringSplitOptions.RemoveEmptyEntries)
            .Should().HaveCount(KnowledgeImportService.MaxExportRules + 1);
        csv.Should().Contain("规则-10000");
        csv.Should().NotContain("规则-00000");
    }

    /// <summary>
    /// 安全边界：导出查询必须使用显式租户参数，不能只依赖当前 DbContext 的全局过滤器。
    /// </summary>
    [Fact]
    public async Task ExportAsJsonAsync_应按显式租户参数过滤()
    {
        var otherTenantId = Guid.NewGuid();
        _db.KnowledgeRules.AddRange(
            new KnowledgeRule
            {
                TenantId = _tenantId,
                DeviceType = "电机",
                Name = "当前租户规则",
                Conditions = "[]",
                Conclusion = "当前租户结论",
            },
            new KnowledgeRule
            {
                TenantId = otherTenantId,
                DeviceType = "泵",
                Name = "其他租户规则",
                Conditions = "[]",
                Conclusion = "其他租户结论",
            });
        await _db.SaveChangesAsync();

        var json = await _sut.ExportAsJsonAsync(otherTenantId, null, CancellationToken.None);

        json.Should().Be("[]");
    }

    /// <summary>
    /// CSV 导出也必须使用显式租户参数，避免与 JSON 导出产生不一致的隔离行为。
    /// </summary>
    [Fact]
    public async Task ExportAsCsvAsync_应按显式租户参数过滤()
    {
        _db.KnowledgeRules.Add(new KnowledgeRule
        {
            TenantId = _tenantId,
            DeviceType = "电机",
            Name = "当前租户规则",
            Conditions = "[]",
            Conclusion = "当前租户结论",
        });
        await _db.SaveChangesAsync();

        var csv = await _sut.ExportAsCsvAsync(Guid.NewGuid(), null, CancellationToken.None);

        csv.Should().Be("device_type,name,conditions,conclusion,recommended_actions,check_steps,confidence_weight\n");
    }

    // ========================================================================
    // CSV 行解析测试（静态方法间接测试）
    // ========================================================================

    [Fact]
    public void PreviewImport_当CSV字段包含引号和逗号时_应正确解析()
    {
        // Arrange — conditions 字段包含逗号，用引号包裹
        var csv = """
                  device_type,name,conditions,conclusion
                  电机,复杂条件,"[{""metric"":""a"",""op"":"">"",""val"":1}]",结论内容
                  """;

        // Act
        var result = _sut.PreviewImport(csv, "rules.csv");

        // Assert
        result.ValidCount.Should().Be(1);
        result.ValidItems[0].Conditions.Should().Contain("metric");
        result.ValidItems[0].Conditions.Should().Contain("op");
    }

    // ========================================================================
    // 行业预置导入测试
    // ========================================================================

    [Fact]
    public async Task ImportIndustryPresetAsync_应从系统租户复制规则到当前租户()
    {
        // Arrange — 向系统租户（Guid.Empty）添加预置规则
        var systemRules = new List<KnowledgeRule>
        {
            new()
            {
                TenantId = Guid.Empty,
                DeviceType = "电机",
                Name = "预置电机规则",
                Conditions = "[]",
                Conclusion = "预置结论",
                ConfidenceWeight = 0.8m,
                Source = "imported",
                CreatedBy = "system-preset"
            },
            new()
            {
                TenantId = Guid.Empty,
                DeviceType = "泵",
                Name = "预置泵规则",
                Conditions = "[]",
                Conclusion = "泵结论",
                ConfidenceWeight = 0.7m,
                Source = "imported",
                CreatedBy = "system-preset"
            }
        };

        // 绕过租户过滤器直接添加系统租户数据
        _db.KnowledgeRules.AddRange(systemRules);
        await _db.SaveChangesAsync();

        var userId = Guid.NewGuid();

        // Act
        var result = await _sut.ImportIndustryPresetAsync(_tenantId, userId, CancellationToken.None);

        // Assert
        result.Imported.Should().Be(2);
        result.Skipped.Should().Be(0);

        // 验证规则已复制到当前租户
        var tenantRules = await _db.KnowledgeRules
            .IgnoreQueryFilters()
            .Where(r => r.TenantId == _tenantId)
            .ToListAsync();
        tenantRules.Should().HaveCount(2);
        tenantRules.Should().Contain(r => r.Name == "预置电机规则");
        tenantRules.Should().Contain(r => r.Name == "预置泵规则");
    }

    [Fact]
    public async Task ImportIndustryPresetAsync_当规则已存在时应跳过()
    {
        // Arrange — 添加系统租户预置规则
        _db.KnowledgeRules.Add(new KnowledgeRule
        {
            TenantId = Guid.Empty,
            DeviceType = "电机",
            Name = "重复规则",
            Conditions = "[]",
            Conclusion = "结论",
            Source = "imported",
            CreatedBy = "system-preset"
        });

        // 当前租户已有同名规则
        _db.KnowledgeRules.Add(new KnowledgeRule
        {
            TenantId = _tenantId,
            DeviceType = "电机",
            Name = "重复规则",
            Conditions = "[]",
            Conclusion = "已有结论"
        });
        await _db.SaveChangesAsync();

        // Act
        var result = await _sut.ImportIndustryPresetAsync(_tenantId, Guid.NewGuid(), CancellationToken.None);

        // Assert
        result.Imported.Should().Be(0);
        result.Skipped.Should().Be(1);
    }

    [Fact]
    public void PreviewImport_JSON空数组应返回错误提示()
    {
        var result = _sut.PreviewImport("[]", "rules.json");
        result.TotalRows.Should().Be(0);
        result.ValidCount.Should().Be(0);
        result.ErrorCount.Should().Be(1);
        result.Errors[0].Message.Should().Contain("空");
    }

    [Fact]
    public void PreviewImport_confidenceWeight为负数应返回错误()
    {
        var csv = """
                  device_type,name,conditions,conclusion,confidence_weight
                  电机,负数权重,[],结论,-0.5
                  """;
        var result = _sut.PreviewImport(csv, "rules.csv");
        result.ErrorCount.Should().Be(1);
        result.Errors[0].Message.Should().Contain("confidence_weight");
    }

    [Fact]
    public async Task ExportAsCsvAsync_按设备类型过滤应只返回匹配规则()
    {
        _db.KnowledgeRules.AddRange(
            new KnowledgeRule
            {
                TenantId = _tenantId, DeviceType = "电机", Name = "电机规则",
                Conditions = "[]", Conclusion = "电机结论"
            },
            new KnowledgeRule
            {
                TenantId = _tenantId, DeviceType = "泵", Name = "泵规则",
                Conditions = "[]", Conclusion = "泵结论"
            });
        await _db.SaveChangesAsync();

        var csv = await _sut.ExportAsCsvAsync(_tenantId, "电机", CancellationToken.None);
        csv.Should().Contain("电机规则");
        csv.Should().NotContain("泵规则");
    }

    [Fact]
    public async Task ExportAsJsonAsync_按设备类型过滤应只返回匹配规则()
    {
        _db.KnowledgeRules.AddRange(
            new KnowledgeRule
            {
                TenantId = _tenantId, DeviceType = "CNC", Name = "CNC规则",
                Conditions = "[]", Conclusion = "CNC结论"
            },
            new KnowledgeRule
            {
                TenantId = _tenantId, DeviceType = "泵", Name = "泵规则",
                Conditions = "[]", Conclusion = "泵结论"
            });
        await _db.SaveChangesAsync();

        var json = await _sut.ExportAsJsonAsync(_tenantId, "CNC", CancellationToken.None);
        json.Should().Contain("CNC规则");
        json.Should().NotContain("泵规则");
    }

    /// <summary>
    /// 测试用租户上下文，使用指定的租户 ID
    /// </summary>
    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId)
        {
            TenantId = tenantId;
        }

        public Guid TenantId { get; }
        public string IsolationMode { get; } = "shared";
        public bool IsSystemAdmin { get; } = false;
        public Guid UserId { get; } = Guid.NewGuid();
    }
}
