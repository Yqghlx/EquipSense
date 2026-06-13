namespace EquipAI.Simulator.Faults;

/// <summary>
/// 故障模式接口 — 定义某种故障对各指标的叠加偏差曲线
/// 实现类只关心"故障已持续多久时给某指标加多少"，不关心设备基线
/// </summary>
public interface IFaultPattern
{
    /// <summary>故障类型标识（如 "bearing_wear"）</summary>
    string FaultType { get; }

    /// <summary>受影响的指标名列表</summary>
    IReadOnlyList<string> AffectedMetrics { get; }

    /// <summary>预期根因诊断（标准答案）</summary>
    string ExpectedRootCause { get; }

    /// <summary>预期告警严重级别</summary>
    string ExpectedSeverity { get; }

    /// <summary>
    /// 给定故障已持续时间，返回某指标的叠加偏差值
    /// 正值表示升高，负值表示降低
    /// </summary>
    double Delta(string metric, TimeSpan elapsed);
}
