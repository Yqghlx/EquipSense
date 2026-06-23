using System.Collections.Concurrent;
using System.Threading;
using EquipAI.Core.Events;
using EquipAI.Core.Extensions;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Data.Entities;
using EquipAI.Infrastructure.Metrics;
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

    /// <summary>
    /// flush 并发保护标志：0=空闲，1=正在 flush。
    /// Timer(500ms) 与 EnqueueAsync 满批都会触发 flush；DB 慢时一次 flush 可能跨越多个 tick，
    /// 不加保护会导致多个 flush 并发重试，对已不堪重负的 DB 形成惊群效应。用 Interlocked 保证
    /// 同一时刻只有一个 flush 执行，其余跳过（数据留在队列，下次 tick 再处理）。
    /// </summary>
    private int _isFlushing;

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
        // 并发保护：见 _isFlushing 注释。CompareExchange 原子地"尝试获取锁"，
        // 已有 flush 进行中则直接返回（数据留队列，下次 tick 处理）。
        if (Interlocked.CompareExchange(ref _isFlushing, 1, 0) != 0)
            return;

        try
        {
            await FlushCoreAsync();
        }
        finally
        {
            _isFlushing = 0;
        }
    }

    /// <summary>
    /// 实际的批量写入逻辑（无并发保护，由 FlushAsync 包装或 Dispose 直接调用）
    ///
    /// 关键改进：DB 写入带有限重试。瞬时错误（连接抖动、短暂锁竞争）是遥测落库最常见的失败，
    /// 原实现直接 catch 丢弃整批，造成数据盲区。现重试至多 4 次（退避 200ms→500ms→1s）覆盖绝大多数
    /// 瞬时故障；重试耗尽才计入 TelemetryDropped 指标并丢弃。
    /// 不 re-enqueue 失败批次：DB 长时间不可用时 re-enqueue 会让队列无限增长导致 OOM，
    /// 宁可丢弃并让运维通过指标告警，由边缘网关 7 天缓冲兜底后续重传。
    /// </summary>
    private async Task FlushCoreAsync()
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

        // 多租户纵深防御：校验每条遥测的设备存在且归属租户与上报租户一致。
        // 校验独立于写入重试（只做一次）：设备归属在写入重试窗口内不会变化。
        List<TelemetryQueueItem> validItems;
        using (var validateScope = _scopeFactory.CreateScope())
        {
            var validateDb = validateScope.ServiceProvider.GetRequiredService<AppDbContext>();
            validItems = await ValidateItemsAsync(validateDb, items);
        }

        if (validItems.Count == 0)
            return; // 全部被拒（未知设备/租户不符），无数据可写

        // 退避序列：首次失败后 200ms、500ms、1s 各重试一次，共 4 次尝试
        var backoffDelays = new[] { 200, 500, 1000 };
        var maxAttempts = backoffDelays.Length + 1;

        for (var attempt = 0; ; attempt++)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                // 多值 INSERT：一次 SQL 完成整批写入，避免逐行 INSERT 导致的 N 次网络往返
                // 修复历史：原实现 foreach 100 次 ExecuteSqlRawAsync，导致 100 设备写入 P95=1.38s
                await InsertBatchAsync(dbContext, validItems);

                _logger.LogDebug("已写入 {Count} 条遥测数据（尝试 {Attempt}/{Total}）",
                    validItems.Count, attempt + 1, maxAttempts);

                foreach (var item in validItems)
                {
                    var evt = new TelemetryReceivedEvent(
                        Guid.NewGuid(), DateTime.UtcNow,
                        item.TenantId, item.DeviceId,
                        item.Metric, item.Value,
                        item.Timestamp, item.Quality);

                    await _eventBus.PublishAsync(evt);
                }

                return; // 写入成功，退出重试循环
            }
            catch (Exception ex)
            {
                if (attempt < backoffDelays.Length)
                {
                    // 尚有重试机会：退避后重试（瞬时故障大概率下一次成功）
                    _logger.LogWarning(ex, "遥测批量写入失败（尝试 {Attempt}/{Total}），{Delay}ms 后重试",
                        attempt + 1, maxAttempts, backoffDelays[attempt]);
                    await Task.Delay(backoffDelays[attempt]);
                    continue;
                }

                // 重试耗尽：记录丢弃指标供运维告警，放弃本批（丢弃的是通过校验的有效数据）
                BusinessMetrics.TelemetryDropped.Inc(validItems.Count);
                _logger.LogError(ex, "遥测批量写入重试 {Total} 次仍失败，丢弃 {Count} 条数据",
                    maxAttempts, validItems.Count);
                return;
            }
        }
    }

    /// <summary>
    /// 校验批次内每条遥测的设备归属：设备必须存在，且其 tenant_id 与上报的 tenantId 一致。
    ///
    /// 安全背景：MQTT 主题 factory/{tenantId}/telemetry/{deviceId} 中的 tenantId 由发布方填写、不可信。
    /// 若匿名/共享 broker 下有客户端伪造主题，可向其他租户注入遥测（跨租户污染）。此处按设备实际归属
    /// 租户（devices.tenant_id，DB 权威）校验，拒绝未知设备与租户不匹配项——顺带阻止对已删除设备
    /// 的遥测写入（避免孤儿时序数据）。在 flush 层校验，覆盖 MQTT 与 HTTP 所有入口，且按批一次 IN
    /// 查询摊薄成本（一批 100 条仅 1 次查询）。
    /// </summary>
    /// <returns>通过校验的遥测项；未通过的已计入 TelemetryRejected 指标与日志</returns>
    internal async Task<List<TelemetryQueueItem>> ValidateItemsAsync(
        AppDbContext dbContext, List<TelemetryQueueItem> items)
    {
        var deviceIds = items.Select(i => i.DeviceId).Distinct().ToList();
        // IgnoreQueryFilters：flush 处理跨多租户的批次，后台无 HttpContext 租户上下文
        var deviceTenants = await dbContext.Devices
            .IgnoreQueryFilters()
            .Where(d => deviceIds.Contains(d.Id))
            .Select(d => new { d.Id, d.TenantId })
            .ToDictionaryAsync(d => d.Id, d => d.TenantId);

        var valid = new List<TelemetryQueueItem>(items.Count);
        var unknown = 0;
        var mismatch = 0;
        foreach (var item in items)
        {
            if (!deviceTenants.TryGetValue(item.DeviceId, out var deviceTenant))
            {
                unknown++;
                continue;
            }
            if (deviceTenant != item.TenantId)
            {
                mismatch++;
                continue;
            }
            valid.Add(item);
        }

        if (unknown > 0)
        {
            BusinessMetrics.TelemetryRejected.WithLabels("unknown_device").Inc(unknown);
            _logger.LogWarning("拒绝 {Count} 条遥测：设备未注册（可能误配置或伪造主题）", unknown);
        }
        if (mismatch > 0)
        {
            BusinessMetrics.TelemetryRejected.WithLabels("tenant_mismatch").Inc(mismatch);
            _logger.LogWarning("拒绝 {Count} 条遥测：设备归属租户与上报租户不符（跨租户注入企图）", mismatch);
        }

        return valid;
    }

    public void Dispose()
    {
        _flushTimer.Dispose();
        // 关闭时排空：Timer 已 Dispose 不会再触发新回调，此时直接调 FlushCoreAsync 绕过并发保护，
        // 确保关闭瞬间队列中残留的数据被写入（若走受保护的 FlushAsync，可能因上一次回调仍在执行而被跳过）。
        FlushCoreAsync().GetAwaiter().GetResult();
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
