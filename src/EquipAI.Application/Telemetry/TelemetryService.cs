using System.Collections.Concurrent;
using EquipAI.Core.Events;
using EquipAI.Core.Extensions;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Telemetry;

/// <summary>
/// 遥测数据服务实现
/// 使用内存队列批量写入 TimescaleDB，发布 TelemetryReceivedEvent 触发告警评估
/// Flush 策略：队列满 100 条或每 500ms
/// </summary>
public class TelemetryService : ITelemetryService, IDisposable
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IEventBus _eventBus;
    private readonly ILogger<TelemetryService> _logger;

    private readonly ConcurrentQueue<TelemetryQueueItem> _queue = new();
    private readonly Timer _flushTimer;
    private const int BatchSize = 100;

    public TelemetryService(
        IServiceScopeFactory scopeFactory,
        IEventBus eventBus,
        ILogger<TelemetryService> logger)
    {
        _scopeFactory = scopeFactory;
        _eventBus = eventBus;
        _logger = logger;

        _flushTimer = new Timer(async _ => await FlushAsync(), null,
            TimeSpan.FromMilliseconds(500), TimeSpan.FromMilliseconds(500));
    }

    public async Task EnqueueAsync(Guid tenantId, Guid deviceId, string metric, double value,
        DateTime timestamp, string quality = "good", string source = "mqtt")
    {
        _queue.Enqueue(new TelemetryQueueItem
        {
            TenantId = tenantId,
            DeviceId = deviceId,
            Metric = metric,
            Value = value,
            Timestamp = timestamp,
            Quality = quality,
            Source = source
        });

        if (_queue.Count >= BatchSize)
        {
            await FlushAsync();
        }
    }

    public async Task FlushAsync()
    {
        if (_queue.IsEmpty)
            return;

        var items = new List<TelemetryQueueItem>();
        while (_queue.TryDequeue(out var item))
        {
            items.Add(item);
        }

        if (items.Count == 0)
            return;

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // 多值 INSERT：一次 SQL 完成整批写入，避免逐行 INSERT 导致的 N 次网络往返
            // 修复历史：原实现 foreach 100 次 ExecuteSqlRawAsync，导致 100 设备写入 P95=1.38s
            await InsertBatchAsync(dbContext, items);

            _logger.LogDebug("已写入 {Count} 条遥测数据", items.Count);

            foreach (var item in items)
            {
                var evt = new TelemetryReceivedEvent(
                    Guid.NewGuid(), DateTime.UtcNow,
                    item.TenantId, item.DeviceId,
                    item.Metric, item.Value,
                    item.Timestamp, item.Quality);

                await _eventBus.PublishAsync(evt);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "遥测数据批量写入失败，丢弃 {Count} 条数据", items.Count);
        }
    }

    public void Dispose()
    {
        _flushTimer.Dispose();
        FlushAsync().GetAwaiter().GetResult();
    }

    /// <summary>
    /// 批量写入时序数据 — 用多值 INSERT 替代逐行 INSERT
    ///
    /// 为什么不用 EF Core AddRange：DeviceTelemetry 是 HasNoKey 实体，EF Core 不支持批量插入。
    /// 为什么不用 PostgreSQL COPY：当前规模（每批 ≤ 100 行）下多值 INSERT 已足够快，
    ///   若未来单批超过 1000 行可再升级到 Npgsql Binary COPY（性能可再提升 10×）。
    /// 为什么不用 foreach：每次 ExecuteSqlRawAsync 都是一次完整的网络往返 + commit，
    ///   100 条数据 = 100 次往返，理论耗时 500-1500ms（实测 P95=1.38s）。
    ///
    /// 单批限制：≤ 100 行 × 7 列 = 700 参数，远低于 PostgreSQL 65535 单 SQL 参数上限。
    /// </summary>
    private static async Task InsertBatchAsync(AppDbContext dbContext, List<TelemetryQueueItem> items)
    {
        const int columnCount = 7;
        var valueBuilders = new List<string>(items.Count);
        var parameters = new List<object>(items.Count * columnCount);

        for (var i = 0; i < items.Count; i++)
        {
            var baseIdx = i * columnCount;
            // 占位符 {0}..{6} 对应第一行、{7}..{13} 对应第二行，依此类推
            valueBuilders.Add(
                $"({{{baseIdx}}}, {{{baseIdx + 1}}}, {{{baseIdx + 2}}}, {{{baseIdx + 3}}}, " +
                $"{{{baseIdx + 4}}}, {{{baseIdx + 5}}}, {{{baseIdx + 6}}})");

            var row = items[i];
            // MQTT/HTTP 上报的时间戳可能 Kind=Unspecified（JSON 反序列化不带 Z），查 timestamptz 列会崩
            parameters.Add(row.Timestamp.ToSafeUtc());
            parameters.Add(row.TenantId);
            parameters.Add(row.DeviceId);
            parameters.Add(row.Metric);
            // double 不可能为 null，但保持原始代码的防御性写法
            parameters.Add((object)row.Value);
            parameters.Add(row.Quality);
            parameters.Add(row.Source);
        }

        var sql =
            "INSERT INTO device_telemetry (time, tenant_id, device_id, metric, value, quality, source) VALUES " +
            string.Join(",", valueBuilders);

        await dbContext.Database.ExecuteSqlRawAsync(sql, parameters);
    }
}

internal class TelemetryQueueItem
{
    public Guid TenantId { get; set; }
    public Guid DeviceId { get; set; }
    public string Metric { get; set; } = string.Empty;
    public double Value { get; set; }
    public DateTime Timestamp { get; set; }
    public string Quality { get; set; } = "good";
    public string Source { get; set; } = "mqtt";
}
