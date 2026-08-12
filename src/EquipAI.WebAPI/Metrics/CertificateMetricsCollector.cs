using EquipAI.Infrastructure.Metrics;

namespace EquipAI.WebAPI.Metrics;

/// <summary>
/// 证书指标写入接口，便于后台服务在单元测试中与 Prometheus 全局注册表解耦。
/// </summary>
public interface ICertificateMetricsSink
{
    /// <summary>
    /// 写入一条证书监控结果。
    /// </summary>
    /// <param name="result">证书读取结果。</param>
    void Set(CertificateReadResult result);
}

/// <summary>
/// 将证书读取结果写入 Prometheus Gauge 的实现。
/// </summary>
public sealed class PrometheusCertificateMetricsSink : ICertificateMetricsSink
{
    /// <summary>
    /// 写入证书状态、到期时间和剩余天数。
    /// </summary>
    /// <param name="result">证书读取结果。</param>
    public void Set(CertificateReadResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        var certificate = result.Name;
        BusinessMetrics.CertificateMonitoringStatus
            .WithLabels(certificate)
            .Set(result.IsAvailable ? 1 : 0);
        BusinessMetrics.CertificateExpiryTimestamp
            .WithLabels(certificate)
            .Set(result.IsAvailable ? result.ExpiryTimestampSeconds : 0);
        BusinessMetrics.CertificateDaysUntilExpiry
            .WithLabels(certificate)
            .Set(result.IsAvailable ? result.DaysUntilExpiry : 0);
    }
}

/// <summary>
/// 周期性读取生产证书并更新监控指标。
/// </summary>
public sealed class CertificateMetricsCollector : BackgroundService
{
    private readonly CertificateMonitoringOptions _options;
    private readonly CertificateMetricsReader _reader;
    private readonly ICertificateMetricsSink _metricsSink;
    private readonly ILogger<CertificateMetricsCollector> _logger;

    /// <summary>
    /// 创建证书指标采集服务。
    /// </summary>
    public CertificateMetricsCollector(
        CertificateMonitoringOptions options,
        CertificateMetricsReader reader,
        ICertificateMetricsSink metricsSink,
        ILogger<CertificateMetricsCollector> logger)
    {
        _options = options ?? throw new ArgumentNullException(nameof(options));
        _reader = reader ?? throw new ArgumentNullException(nameof(reader));
        _metricsSink = metricsSink ?? throw new ArgumentNullException(nameof(metricsSink));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// 执行一次证书采集，供后台循环和单元测试复用。
    /// </summary>
    public void CollectOnce()
    {
        if (!_options.Enabled)
        {
            return;
        }

        IReadOnlyList<CertificateReadResult> results;
        try
        {
            results = _reader.Read(_options.Certificates);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogError(
                "证书监控采集失败，异常类型 {ErrorType}",
                exception.GetType().Name);
            return;
        }

        foreach (var result in results)
        {
            try
            {
                _metricsSink.Set(result);
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    "证书监控指标写入失败：{Certificate}，异常类型 {ErrorType}",
                    result.Name,
                    exception.GetType().Name);
                continue;
            }

            if (result.IsAvailable)
            {
                _logger.LogDebug(
                    "证书监控采集成功：{Certificate}，剩余 {DaysUntilExpiry:F1} 天",
                    result.Name,
                    result.DaysUntilExpiry);
            }
            else
            {
                _logger.LogError(
                    "证书监控不可用：{Certificate}，异常类型 {ErrorType}",
                    result.Name,
                    result.Error ?? "Unknown");
            }
        }
    }

    /// <summary>
    /// 启动后台循环，首次立即采集，后续按配置间隔刷新。
    /// </summary>
    /// <param name="stoppingToken">应用停止令牌。</param>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("证书生命周期监控已关闭");
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                CollectOnce();
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                // 这是最后一道边界，确保未来读取器或指标实现的意外异常不会终止整个 WebAPI。
                _logger.LogError(
                    "证书监控后台循环失败，异常类型 {ErrorType}",
                    exception.GetType().Name);
            }

            try
            {
                await Task.Delay(_options.EffectiveInterval, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }
}
