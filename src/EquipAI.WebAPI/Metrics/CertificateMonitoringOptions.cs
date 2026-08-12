namespace EquipAI.WebAPI.Metrics;

/// <summary>
/// 运行时证书监控配置。
/// </summary>
public sealed class CertificateMonitoringOptions
{
    /// <summary>配置节名称。</summary>
    public const string SectionName = "Security:CertificateMonitoring";

    /// <summary>是否启用证书扫描。</summary>
    public bool Enabled { get; set; }

    /// <summary>两次扫描之间的间隔，单位为秒。</summary>
    public int IntervalSeconds { get; set; } = 300;

    /// <summary>证书显示名称到容器内证书路径的映射。</summary>
    public Dictionary<string, string> Certificates { get; set; } = new(StringComparer.Ordinal);

    /// <summary>
    /// 获取经过边界保护的扫描间隔。
    /// 最短一分钟可以避免错误配置造成高频磁盘访问，最长一天可以保证轮换后的状态及时刷新。
    /// </summary>
    public TimeSpan EffectiveInterval => TimeSpan.FromSeconds(Math.Clamp(IntervalSeconds, 60, 86_400));
}
