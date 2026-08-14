using System.Collections.Concurrent;
using System.Threading;
using EquipAI.Core.Events;
using EquipAI.Core.Extensions;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Data.Entities;
using EquipAI.Infrastructure.Metrics;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Telemetry;

/// <summary>
/// 遥测数据服务实现
/// 使用内存队列批量写入 TimescaleDB，发布 TelemetryReceivedEvent 触发告警评估
/// Flush 策略：队列满 100 条或每 500ms
/// </summary>
public class TelemetryService : ITelemetryService, IDisposable, IAsyncDisposable
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IEventBus _eventBus;
    private readonly ILogger<TelemetryService> _logger;

    private readonly ConcurrentQueue<TelemetryQueueItem> _queue = new();
    private readonly Timer _flushTimer;
    private readonly object _lifecycleLock = new();

    /// <summary>
    /// flush 并发门闩。
    /// Timer(500ms) 与 EnqueueAsync 满批都会触发 flush；DB 慢时一次 flush 可能跨越多个 tick，
    /// 不加保护会导致多个 flush 并发重试，对已不堪重负的 DB 形成惊群效应。
    /// 释放流程也使用同一把门闩，确保关闭时会等待正在执行的 flush，而不是绕过保护直接访问数据库。
    /// </summary>
    private readonly SemaphoreSlim _flushGate = new(1, 1);
    private const int BatchSize = 100;

    /// <summary>
    /// 是否已经开始释放；设置后拒绝新的入队并让后续 flush 直接返回。
    /// </summary>
    private int _disposeStarted;

    public TelemetryService(
        IServiceScopeFactory scopeFactory,
        IEventBus eventBus,
        ILogger<TelemetryService> logger)
    {
        _scopeFactory = scopeFactory;
        _eventBus = eventBus;
        _logger = logger;

        // TimerCallback 本身是 void；不能直接传 async lambda，否则会隐式生成 async void，
        // 数据库校验异常会绕过 Task 观察机制，严重时触发进程级未处理异常。
        _flushTimer = new Timer(static state =>
        {
            var service = (TelemetryService)state!;
            _ = service.FlushSafelyAsync();
        }, this,
            TimeSpan.FromMilliseconds(500), TimeSpan.FromMilliseconds(500));
    }

    public Task EnqueueAsync(Guid tenantId, Guid deviceId, string metric, double value,
        DateTime timestamp, string quality = "good", string source = "mqtt")
        => EnqueueInternalAsync(
            tenantId, deviceId, metric, value, timestamp, quality, source,
            waitForPersistence: false);

    public Task EnqueueAndWaitForPersistenceAsync(Guid tenantId, Guid deviceId, string metric, double value,
        DateTime timestamp, string quality = "good", string source = "mqtt")
        => EnqueueInternalAsync(
            tenantId, deviceId, metric, value, timestamp, quality, source,
            waitForPersistence: true);

    /// <summary>
    /// 将一条遥测加入队列；需要可靠接收的调用方可等待该条数据所属批次完成。
    /// 普通 HTTP 入队保持原有异步接收语义，MQTT 则通过等待任务把数据库失败传回消息处理器。
    /// </summary>
    private async Task EnqueueInternalAsync(
        Guid tenantId,
        Guid deviceId,
        string metric,
        double value,
        DateTime timestamp,
        string quality,
        string source,
        bool waitForPersistence)
    {
        TaskCompletionSource<bool>? persistenceCompletion = waitForPersistence
            ? new(TaskCreationOptions.RunContinuationsAsynchronously)
            : null;
        bool shouldFlush;
        lock (_lifecycleLock)
        {
            // 关闭开始后不再接收新数据，避免排空完成后又有消息落入无人处理的队列。
            // MQTT 回调可能与宿主关闭并行到达，静默丢弃比向后台消息线程抛出 ObjectDisposedException 更安全。
            if (Volatile.Read(ref _disposeStarted) != 0)
            {
                _logger.LogDebug("遥测服务已开始关闭，丢弃设备 {DeviceId} 的新遥测", deviceId);
                persistenceCompletion?.TrySetException(new ObjectDisposedException(nameof(TelemetryService)));
                return;
            }

            _queue.Enqueue(new TelemetryQueueItem
            {
                TenantId = tenantId,
                DeviceId = deviceId,
                Metric = metric,
                Value = value,
                Timestamp = timestamp,
                Quality = quality,
                Source = source,
                PersistenceCompletion = persistenceCompletion
            });
            shouldFlush = _queue.Count >= BatchSize;
        }

        if (shouldFlush)
        {
            await FlushAsync();
        }

        if (persistenceCompletion is not null)
        {
            await persistenceCompletion.Task.ConfigureAwait(false);
        }
    }

    public async Task FlushAsync()
    {
        if (Volatile.Read(ref _disposeStarted) != 0)
            return;

        // 非阻塞获取：已有 flush 进行中时直接返回，数据留在队列由当前 flush 结束后的下一次 tick 处理。
        // 释放流程使用阻塞获取，因而能够在关闭时等待这次正在进行的 flush。
        if (!await _flushGate.WaitAsync(0).ConfigureAwait(false))
            return;

        try
        {
            // 在等待门闩期间可能已经开始关闭；此时让 DisposeAsync 负责最后一次排空。
            if (Volatile.Read(ref _disposeStarted) != 0)
                return;

            await FlushCoreAsync();
        }
        finally
        {
            _flushGate.Release();
        }
    }

    /// <summary>
    /// Timer 的安全异步入口。
    /// 即使未来 FlushAsync 增加了保护范围之外的逻辑，也不能让后台回调把异常抛到进程级。
    /// </summary>
    private async Task FlushSafelyAsync()
    {
        try
        {
            await FlushAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "定时排空遥测队列时发生未处理异常");
        }
    }

    /// <summary>
    /// 实际的批量写入逻辑（由 FlushAsync 或释放流程在 _flushGate 保护下调用）
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

        // 退避序列：首次失败后 200ms、500ms、1s 各重试一次，共 4 次尝试
        var backoffDelays = new[] { 200, 500, 1000 };
        var maxAttempts = backoffDelays.Length + 1;

        // 保存稳定的事件 ID，既能让 RabbitMQ/Outbox 幂等，又能让事务重试继续使用同一批事件。
        // 事件列表只在第一次确定待写入行后生成；后续重试不能重新生成事件 ID，否则会削弱 Inbox 幂等。
        var batchState = new TelemetryBatchState();

        for (var attempt = 0; ; attempt++)
        {
            try
            {
                var hasWork = await PersistBatchAndEventsAsync(items, batchState);
                if (!hasWork)
                {
                    _logger.LogDebug("批次遥测全部被拒绝或已去重，跳过写入与事件发布");
                }
                else
                {
                    _logger.LogDebug("已原子持久化 {Count} 条遥测及其事件（尝试 {Attempt}/{Total}）",
                        batchState.Events?.Count ?? 0, attempt + 1, maxAttempts);
                }

                CompletePersistence(items);
                return;
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

                // 事务重试耗尽：数据和事件均未得到确认，计入遥测丢弃指标。
                // 这样不会把“事件失败但遥测仍在库中”误报为可接受状态；边缘网关的本地缓冲
                // 会在后续重传，下一次成功时由事件总线重新建立完整闭环。
                BusinessMetrics.TelemetryDropped.Inc(items.Count);
                _logger.LogError(
                    ex,
                    "遥测批次原子持久化重试 {Total} 次仍失败，放弃 {Count} 条数据",
                    maxAttempts,
                    items.Count);
                CompletePersistence(items, ex);
                return;
            }
        }
    }

    /// <summary>
    /// 完成等待持久化的调用方任务。
    /// 失败批次仍按既有有界策略丢弃，避免数据库长时间不可用时内存无界增长；
    /// 但 MQTT 调用方会收到异常并可让 Broker 保留/重投消息，而不是把失败静默当成成功。
    /// </summary>
    private static void CompletePersistence(
        IReadOnlyList<TelemetryQueueItem> items,
        Exception? exception = null)
    {
        foreach (var item in items)
        {
            if (item.PersistenceCompletion is null)
                continue;

            if (exception is null)
                item.PersistenceCompletion.TrySetResult(true);
            else
                item.PersistenceCompletion.TrySetException(exception);
        }
    }

    /// <summary>
    /// 在同一个数据库事务中完成遥测批量写入和事件 Outbox 登记。
    ///
    /// 生产环境使用 Npgsql 可重试执行策略；必须让“开启事务、写入遥测、登记 Outbox、提交事务”
    /// 整体处于执行策略委托中，否则客户端在提交响应丢失时可能重复插入或留下半个闭环。
    /// 每次执行策略重试都创建新的作用域，避免失败事务污染旧 DbContext 的跟踪状态。
    /// InMemory 事件总线/数据库仅用于开发和测试，不具备生产级持久化语义，因此不强行伪造事务。
    /// </summary>
    private async Task<bool> PersistBatchAndEventsAsync(
        IReadOnlyList<TelemetryQueueItem> items,
        TelemetryBatchState batchState,
        CancellationToken cancellationToken = default)
    {
        using var strategyScope = _scopeFactory.CreateScope();
        var strategyDbContext = strategyScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var executionStrategy = strategyDbContext.Database.CreateExecutionStrategy();
        var hasWork = false;

        hasWork = await executionStrategy.ExecuteAsync(
            state: 0,
            operation: async (_, _, operationCancellationToken) =>
            {
                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                // TelemetryService 是 Singleton，不能把构造时解析的事件总线与当前写入 DbContext 混用。
                // 生产模式解析当前作用域的 Outbox 总线，测试/兼容容器没有注册时回退到注入实例。
                var eventBus = scope.ServiceProvider.GetService<IEventBus>() ?? _eventBus;

                IDbContextTransaction? transaction = null;
                if (dbContext.Database.IsRelational())
                {
                    transaction = await dbContext.Database.BeginTransactionAsync(operationCancellationToken);
                }

                var operationHasWork = false;
                try
                {
                    // 多租户纵深防御：校验每条遥测的设备存在且归属租户与上报租户一致。
                    var validItems = await ValidateItemsAsync(dbContext, items, operationCancellationToken);
                    if (validItems.Count == 0)
                    {
                        return false;
                    }

                    // 去重（批内 + DB 已存在）：覆盖 MQTT 重传和边缘网关重放，避免重复写入污染基线
                    // 或触发重复告警。执行策略重试时重新计算，能够识别上一次提交响应丢失的结果。
                    var toInsert = await DedupBatchAsync(dbContext, validItems, operationCancellationToken);
                    if (toInsert.Count > 0)
                    {
                        batchState.Events ??= CreateTelemetryEvents(toInsert);

                        // 多值 INSERT：一次 SQL 完成整批写入，避免逐行 INSERT 导致的 N 次网络往返。
                        await InsertBatchAsync(dbContext, toInsert, operationCancellationToken);
                        operationHasWork = true;
                    }

                    // 如果执行策略正在处理一次“提交成功但响应丢失”的重试，toInsert 可能为空；
                    // 仍需用同一批稳定事件调用事务 Outbox。TransactionalEventBus 会按 EventId 幂等跳过已存在项。
                    if (batchState.Events is not null)
                    {
                        foreach (var @event in batchState.Events)
                        {
                            await eventBus.PublishAsync(@event, operationCancellationToken);
                        }

                        operationHasWork = true;
                    }

                    if (transaction is not null)
                    {
                        await transaction.CommitAsync(operationCancellationToken);
                    }
                }
                catch
                {
                    if (transaction is not null)
                    {
                        try
                        {
                            await transaction.RollbackAsync(CancellationToken.None);
                        }
                        catch (Exception rollbackException)
                        {
                            // 原始异常通常意味着连接已断开，回滚也可能因事务状态未知而失败；
                            // 不能让清理异常覆盖原始异常，否则执行策略无法判断是否应重试。
                            _logger.LogWarning(rollbackException, "遥测批次事务回滚失败，保留原始异常继续重试");
                        }
                    }

                    throw;
                }
                finally
                {
                    if (transaction is not null)
                    {
                        try
                        {
                            await transaction.DisposeAsync();
                        }
                        catch (Exception disposeException)
                        {
                            _logger.LogWarning(disposeException, "遥测批次事务释放失败");
                        }
                    }
                }

                return operationHasWork;
            },
            verifySucceeded: null,
            cancellationToken: cancellationToken);

        return hasWork;
    }

    /// <summary>
    /// 批次去重：批内同键折叠 + 排除 DB 中已存在的同键行。
    ///
    /// 背景：device_telemetry 无唯一约束、INSERT 无 ON CONFLICT。MQTT QoS1 至少一次投递的重传、边缘网关断线
    /// 恢复后本地缓冲重放、以及写入重试的"模糊成功"（提交已落库但响应未送达客户端，重试再插一遍）都会产生
    /// 相同 (tenant, device, metric, time) 的重复行。后果：基线（AVG/STDDEV）被翻倍→告警阈值漂移、
    /// 数据质量评分失真、L3/L4 分析结果偏差、聚合防风暴被绕过触发重复告警。
    ///
    /// 为什么用应用层去重而非 DB 唯一约束 + ON CONFLICT：device_telemetry 是 TimescaleDB hypertable，
    /// 启用压缩后 compress_segmentby 须覆盖所有唯一约束列，对现有表加唯一约束需迁移验证且无法在单元测试中
    /// 盲测（InMemory/SQLite 不具备 hypertable 压缩语义）。应用层去重以一次按组 IN 查询兜底，覆盖绝大多数
    /// 重复来源，并可在 SQLite 上完整回归测试。
    ///
    /// 算法：
    ///   1. 批内去重：同 (tenant, device, metric, timestamp) 只保留首条；
    ///   2. 跨批去重：按 (tenant, device, metric) 分组，每组一次 time IN (...) 查询
    ///      （idx_telemetry_tenant_device_metric 索引支持），排除 DB 中已存在的行。
    /// 放在写入重试循环内（每次尝试都重新查），使"模糊成功"后的重试能排除已落库行，避免重复写入。
    /// 仅对实际写入的新行发布事件，避免重复数据触发重复告警/分析。
    /// </summary>
    /// <param name="dbContext">当前写入作用域的 DbContext（跨租户查询，已 IgnoreQueryFilters）</param>
    /// <param name="items">已通过设备↔租户校验的有效遥测项</param>
    /// <returns>去重后实际待写入的遥测项；重复项已计入 TelemetryDeduped 指标与日志</returns>
    internal async Task<List<TelemetryQueueItem>> DedupBatchAsync(
        AppDbContext dbContext,
        IReadOnlyList<TelemetryQueueItem> items,
        CancellationToken ct = default)
    {
        // 1. 批内去重（同键保留首条）
        var distinct = new List<TelemetryQueueItem>(items.Count);
        var seenKeys = new HashSet<(Guid TenantId, Guid DeviceId, string Metric, DateTime Time)>();
        var inBatchDupes = 0;
        foreach (var item in items)
        {
            // 时间戳统一为 UTC 作去重键，避免本地/UTC 同一时刻因 Kind 差异被当成两条
            var key = (item.TenantId, item.DeviceId, item.Metric, item.Timestamp.ToSafeUtc());
            if (seenKeys.Add(key))
                distinct.Add(item);
            else
                inBatchDupes++;
        }

        // 2. 跨批去重：排除 DB 中已存在的同键行。IgnoreQueryFilters：flush 处理跨多租户批次、后台无 HttpContext。
        // 按 (tenant, device, metric) 分组，每组一次 IN 查询摊薄成本（idx_telemetry_tenant_device_metric 支持）。
        var result = new List<TelemetryQueueItem>(distinct.Count);
        var crossBatchDupes = 0;
        foreach (var grp in distinct.GroupBy(i => (i.TenantId, i.DeviceId, i.Metric)))
        {
            var times = grp.Select(i => i.Timestamp.ToSafeUtc()).ToList();
            var existingTimes = await dbContext.DeviceTelemetry
                .IgnoreQueryFilters()
                .Where(t => t.TenantId == grp.Key.TenantId
                         && t.DeviceId == grp.Key.DeviceId
                         && t.Metric == grp.Key.Metric
                         && times.Contains(t.Time))
                .Select(t => t.Time)
                .ToListAsync(ct);
            var existingSet = new HashSet<DateTime>(existingTimes);

            foreach (var item in grp)
            {
                if (existingSet.Add(item.Timestamp.ToSafeUtc()))
                    result.Add(item);
                else
                    crossBatchDupes++;
            }
        }

        var totalDupes = inBatchDupes + crossBatchDupes;
        if (totalDupes > 0)
        {
            BusinessMetrics.TelemetryDeduped.WithLabels("in_batch").Inc(inBatchDupes);
            BusinessMetrics.TelemetryDeduped.WithLabels("cross_batch").Inc(crossBatchDupes);
            _logger.LogDebug("遥测去重：批内 {InBatch} 条 + DB 已存在 {CrossBatch} 条，共去除 {Total} 条重复",
                inBatchDupes, crossBatchDupes, totalDupes);
        }

        return result;
    }

    /// <summary>
    /// 为实际写入的遥测生成稳定批次事件。
    /// </summary>
    private static List<TelemetryReceivedEvent> CreateTelemetryEvents(
        IEnumerable<TelemetryQueueItem> items)
        => items
            .Select(item => new TelemetryReceivedEvent(
                Guid.NewGuid(), DateTime.UtcNow,
                item.TenantId, item.DeviceId,
                item.Metric, item.Value,
                item.Timestamp, item.Quality))
            .ToList();

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
        AppDbContext dbContext,
        IReadOnlyList<TelemetryQueueItem> items,
        CancellationToken cancellationToken = default)
    {
        var deviceIds = items.Select(i => i.DeviceId).Distinct().ToList();
        // IgnoreQueryFilters：flush 处理跨多租户的批次，后台无 HttpContext 租户上下文
        var deviceTenants = await dbContext.Devices
            .IgnoreQueryFilters()
            .Where(d => deviceIds.Contains(d.Id))
            .Select(d => new { d.Id, d.TenantId })
            .ToDictionaryAsync(d => d.Id, d => d.TenantId, cancellationToken);

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

    public async ValueTask DisposeAsync()
    {
        if (!BeginDispose())
            return;

        // Timer 已停止接受新回调；等待同一把门闩可确保已经开始的 Timer/手动 flush 完成后再排空剩余队列。
        // 异步路径：.NET Core 3.0+ 容器释放 Singleton 时优先调用 DisposeAsync，避免 sync-over-async 死锁。
        try
        {
            await _flushGate.WaitAsync().ConfigureAwait(false);
            try
            {
                await FlushCoreAsync().ConfigureAwait(false);
            }
            finally
            {
                _flushGate.Release();
            }
        }
        catch (Exception ex)
        {
            // 应用关闭阶段不应抛出未处理异常导致进程异常退出，仅记录
            _logger.LogError(ex, "应用关闭时排空遥测队列失败");
        }
    }

    public void Dispose()
    {
        if (!BeginDispose())
            return;

        // 同步兜底路径：仅在调用方未走异步释放（如某些宿主或显式 Dispose）时触发。
        // 用带超时的等待替代 GetAwaiter().GetResult()：FlushCoreAsync 含 DB 往返，
        // 若 DB 已不可达，无限等待会阻塞应用关闭进程；超时后残留数据由边缘网关 7 天缓冲兜底。
        try
        {
            if (!_flushGate.Wait(TimeSpan.FromSeconds(10)))
            {
                _logger.LogWarning("应用关闭时等待正在执行的遥测 flush 超时（10s），队列残留数据将丢弃（边缘网关会重传）");
                return;
            }

            try
            {
                if (!FlushCoreAsync().Wait(TimeSpan.FromSeconds(10)))
                {
                    _logger.LogWarning("应用关闭时排空遥测队列超时（10s），队列残留数据将丢弃（边缘网关会重传）");
                }
            }
            finally
            {
                _flushGate.Release();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "应用关闭时排空遥测队列失败");
        }
    }

    /// <summary>
    /// 原子地进入释放状态并停止定时器。
    /// 使用生命周期锁与入队操作形成互斥，保证排空之后不会再有新数据进入队列。
    /// </summary>
    private bool BeginDispose()
    {
        lock (_lifecycleLock)
        {
            if (_disposeStarted != 0)
                return false;

            _disposeStarted = 1;
            _flushTimer.Dispose();
            return true;
        }
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
    private static async Task InsertBatchAsync(
        AppDbContext dbContext,
        List<TelemetryQueueItem> items,
        CancellationToken cancellationToken = default)
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

        await dbContext.Database.ExecuteSqlRawAsync(sql, parameters, cancellationToken);
    }

    /// <summary>
    /// 保存一次批量遥测所需的稳定事件身份。
    /// </summary>
    private sealed class TelemetryBatchState
    {
        /// <summary>
        /// 已为本批次生成的事件；数据库事务重试时必须复用这些 ID。
        /// </summary>
        public List<TelemetryReceivedEvent>? Events { get; set; }
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

    /// <summary>
    /// MQTT 可靠接收路径等待的持久化结果；普通异步 HTTP 入队不创建此任务。
    /// </summary>
    public TaskCompletionSource<bool>? PersistenceCompletion { get; set; }
}
