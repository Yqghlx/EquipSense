using EquipAI.Core.Validation;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Validation;

/// <summary>
/// 未来时间戳校验边界：历史数据不限（断网补传），未来只允许时钟偏差容忍度。
/// </summary>
public class TelemetryInputValidatorFutureTimestampTests
{
    [Fact]
    public void 超前恰好等于容忍度_应通过()
    {
        var now = DateTime.UtcNow;
        var at = now.AddMinutes(TelemetryInputValidator.MaxFutureClockSkewMinutes);

        TelemetryInputValidator.ValidateNotInFuture(at, now).Should().BeNull();
    }

    [Fact]
    public void 超前超过容忍度_应拒绝并给出可读原因()
    {
        var now = DateTime.UtcNow;
        var at = now.AddMinutes(TelemetryInputValidator.MaxFutureClockSkewMinutes).AddSeconds(1);

        var error = TelemetryInputValidator.ValidateNotInFuture(at, now);

        error.Should().NotBeNull().And.Contain("时钟");
    }

    [Fact]
    public void 历史时间戳不受限制_断网补传场景应通过()
    {
        var now = DateTime.UtcNow;
        var sevenDaysAgo = now.AddDays(-7);

        TelemetryInputValidator.ValidateNotInFuture(sevenDaysAgo, now).Should().BeNull();
    }

    [Fact]
    public void 未注入时钟时_默认使用系统UTC时间()
    {
        var future = DateTime.UtcNow.AddHours(1);

        TelemetryInputValidator.ValidateNotInFuture(future).Should().NotBeNull();
        TelemetryInputValidator.ValidateNotInFuture(DateTime.UtcNow).Should().BeNull();
    }
}
