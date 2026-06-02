using EquipAI.Simulator;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Simulator;

public class SimulatedSensorTests
{
    [Fact]
    public void GetValue_无噪声时返回纯正弦值()
    {
        var config = new SensorConfig("test", 50.0, 10.0, 0.01, 0.0);
        var sensor = new SimulatedSensor(config, seed: 42);
        var timestamp = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var value = sensor.GetValue(timestamp);

        // 纯正弦值应在 [BaseValue - Amplitude, BaseValue + Amplitude] 范围内
        value.Should().BeInRange(40.0, 60.0);
    }

    [Fact]
    public void GetValue_有噪声时值在合理范围内()
    {
        var config = new SensorConfig("temperature", 65.0, 30.0, 0.01, 2.0);
        var sensor = new SimulatedSensor(config, seed: 42);

        // 采样 100 次，所有值都应在 [BaseValue - Amplitude - 5σ, BaseValue + Amplitude + 5σ] 内
        for (var i = 0; i < 100; i++)
        {
            var t = DateTime.UtcNow.AddSeconds(i);
            var value = sensor.GetValue(t);
            value.Should().BeInRange(65.0 - 30.0 - 10.0, 65.0 + 30.0 + 10.0);
        }
    }

    [Fact]
    public void GetValue_零振幅时返回恒定基线值()
    {
        var config = new SensorConfig("static", 42.0, 0.0, 0.01, 0.0);
        var sensor = new SimulatedSensor(config, seed: 42);

        var v1 = sensor.GetValue(DateTime.UtcNow);
        var v2 = sensor.GetValue(DateTime.UtcNow);

        v1.Should().BeApproximately(42.0, 0.001);
        v2.Should().BeApproximately(42.0, 0.001);
    }
}
