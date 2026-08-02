using AutoMapper;
using EquipAI.Application.Alerts.DTOs;
using EquipAI.Application.Mapping;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using FluentAssertions;
using Xunit;

namespace EquipAI.Tests.Unit.Alerts;

/// <summary>
/// Alert → AlertDto 映射测试
/// 验证告警字段正确投影到 DTO（含 DataSnapshot 指标快照）
/// </summary>
public class AlertMappingTests
{
    private static IMapper CreateMapper()
    {
        var config = new MapperConfiguration(
            cfg => cfg.AddProfile<MappingProfile>(),
            Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        return config.CreateMapper();
    }

    /// <summary>
    /// 回归 #258：DataSnapshot 此前由 AlertEvaluationService 写入但全仓零消费（死字段）。
    /// 接入 DTO 投影后须确保 AutoMapper 默认名称映射正确投影，否则前端告警详情抽屉拿不到快照。
    /// </summary>
    [Fact]
    public void Map_Alert到AlertDto应投影DataSnapshot指标快照()
    {
        var mapper = CreateMapper();
        var snapshot = """{"temperature":95.3,"pressure":1.2,"vibration":0.5}""";
        var alert = new Alert
        {
            TenantId = Guid.NewGuid(),
            AlertCode = "ALT-DEV001-temperature-20260624",
            DeviceId = Guid.NewGuid(),
            Severity = AlertSeverity.High,
            Status = AlertStatus.Active,
            Metric = "temperature",
            Value = 95m,
            DataSnapshot = snapshot
        };

        var dto = mapper.Map<AlertDto>(alert)!;

        dto.DataSnapshot.Should().Be(snapshot,
            "DataSnapshot 须投影到 DTO 供前端告警详情展示告警时刻指标快照（复活死字段）");
    }

    /// <summary>
    /// DataSnapshot 为空时（旧告警或无快照场景）DTO 也应为空，前端优雅降级不展示快照区
    /// </summary>
    [Fact]
    public void Map_DataSnapshot为空时Dto应为空()
    {
        var mapper = CreateMapper();
        var alert = new Alert
        {
            AlertCode = "ALT-EMPTY",
            Severity = AlertSeverity.Low,
            Status = AlertStatus.Active,
            Metric = "temperature",
            Value = 50m,
            DataSnapshot = null
        };

        var dto = mapper.Map<AlertDto>(alert)!;

        dto.DataSnapshot.Should().BeNull();
    }
}
