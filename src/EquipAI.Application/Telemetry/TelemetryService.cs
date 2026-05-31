using System.Collections.Concurrent;
using EquipAI.Core.Events;
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

            var rows = items.Select(i => new DeviceTelemetry
            {
                Time = i.Timestamp,
                TenantId = i.TenantId,
                DeviceId = i.DeviceId,
                Metric = i.Metric,
                Value = i.Value,
                Quality = i.Quality,
                Source = i.Source
            }).ToList();

            dbContext.DeviceTelemetry.AddRange(rows);
            await dbContext.SaveChangesAsync();

            _logger.LogDebug("已写入 {Count} 条遥测数据", rows.Count);

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
