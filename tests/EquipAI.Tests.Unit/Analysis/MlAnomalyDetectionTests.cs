using FluentAssertions;
using Microsoft.ML;

namespace EquipAI.Tests.Unit.Analysis;

/// <summary>
/// ML.NET SrCnn 异常检测算法验证测试（Phase 4 L4 智能告警）
///
/// ️ SrCnn 依赖 Intel MKL 原生库，仅在 x64 平台可用。
/// 在 arm64 平台（如 Apple Silicon）会自动跳过 SrCnn 测试。
/// 部署到生产环境时需使用 x64 架构的服务器。
/// </summary>
public class MlAnomalyDetectionTests
{
    private static readonly MLContext _mlContext = new(seed: 42);
    private const double AnomalyThreshold = 0.5;

    private static List<float> GenerateNormalSeries(int count, float mean, float stddev, int seed = 42)
    {
        var rand = new Random(seed);
        return Enumerable.Range(0, count)
            .Select(_ => mean + stddev * ((float)rand.NextDouble() * 2f - 1f))
            .ToList();
    }

    /// <summary>验证 ML.NET 环境能正常初始化（任何平台）</summary>
    [Fact]
    public void MLContext_Should_Initialize_On_Any_Platform()
    {
        var ctx = new MLContext(seed: 0);
        ctx.Should().NotBeNull();
    }

    [Fact]
    public void SrCnn_Should_Process_Normal_Data()
    {
        // SrCnn 在 arm64 不可用，测试应优雅跳过
        try
        {
            var normalData = GenerateNormalSeries(100, 50f, 2f);
            var seriesData = normalData.Select(v => new TimeSeriesData(v)).ToList();
            var dataView = _mlContext.Data.LoadFromEnumerable(seriesData);
            var windowSize = Math.Max(16, Math.Min(64, seriesData.Count / 2));
            var pipeline = BuildSrCnnPipeline(windowSize);
            var model = pipeline.Fit(dataView);
            var transformed = model.Transform(dataView);
            var predictions = _mlContext.Data
                .CreateEnumerable<PredictionResult>(transformed, reuseRowObject: false).ToList();

            predictions.Should().HaveCount(100);
            predictions.All(p => p.Prediction != null && p.Prediction.Length >= 3).Should().BeTrue();
        }
        catch (DllNotFoundException) { return; }
        catch (TypeInitializationException)
        {
            // arm64 平台跳过 - 预期行为
            return;
        }
    }

    [Fact]
    public void SrCnn_Should_Process_Data_With_Anomaly()
    {
        try
        {
            var normalData = GenerateNormalSeries(99, 50f, 2f);
            normalData.Add(200f);
            var seriesData = normalData.Select(v => new TimeSeriesData(v)).ToList();
            var dataView = _mlContext.Data.LoadFromEnumerable(seriesData);
            var windowSize = Math.Max(16, Math.Min(64, seriesData.Count / 2));
            var pipeline = BuildSrCnnPipeline(windowSize);
            var model = pipeline.Fit(dataView);
            var transformed = model.Transform(dataView);
            var predictions = _mlContext.Data
                .CreateEnumerable<PredictionResult>(transformed, reuseRowObject: false).ToList();

            predictions.Should().HaveCount(100);
            predictions.All(p => p.Prediction != null && p.Prediction.Length >= 3).Should().BeTrue();
        }
        catch (DllNotFoundException) { return; }
        catch (TypeInitializationException)
        {
            return;
        }
    }

    [Fact]
    public void SrCnn_WindowSize_Should_Adapt_To_Sample_Count()
    {
        Math.Max(16, Math.Min(64, 100 / 2)).Should().Be(50);
        Math.Max(16, Math.Min(64, 30 / 2)).Should().Be(16);
        Math.Max(16, Math.Min(64, 200 / 2)).Should().Be(64);
    }

    private IEstimator<ITransformer> BuildSrCnnPipeline(int windowSize) =>
        _mlContext.Transforms.DetectAnomalyBySrCnn(
            outputColumnName: nameof(PredictionResult.Prediction),
            inputColumnName: nameof(TimeSeriesData.Value),
            windowSize: windowSize,
            backAddWindowSize: Math.Max(8, windowSize / 2),
            lookaheadWindowSize: Math.Max(4, windowSize / 4),
            averagingWindowSize: Math.Max(4, windowSize / 4),
            judgementWindowSize: Math.Max(4, windowSize / 4),
            threshold: AnomalyThreshold);

    private record TimeSeriesData(float Value);
    private class PredictionResult { public double[]? Prediction { get; set; } }
}
