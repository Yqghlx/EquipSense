# 多实例告警聚合生产化设计

> 状态：实施中  
> 日期：2026-08-09

## 目标

在后端横向扩展到多个实例时，保持告警防风暴窗口的全局一致性：同一租户设备、规则和指标在 30 分钟内仍遵循“第 1 次创建、第 2–3 次更新、第 4 次及以后静默”，避免每个实例各自放行 3 次而放大告警风暴。

## 范围与非目标

范围包括告警聚合状态的跨实例共享、Redis 故障降级、取消传播、DI 注册和回归测试。不改变告警聚合窗口长度、计数语义、数据库告警状态或通知渠道；不在本子项目中拆分告警评估服务的其他职责。

## 方案

在 Core 层定义两个稳定契约：`IAlertAggregationStateStore` 负责按键原子递增并设置窗口 TTL，`IAlertAggregator` 负责把计数转换为领域决策。Application 层的 `AlertAggregator` 依赖状态存储契约；Redis 可用时使用共享状态，Redis 调用失败时回退到现有进程内窗口，确保告警评估不会因为缓存故障整体中断。WebAPI 通过 DI 注册 Infrastructure 的 Redis 实现。

Redis 使用 Lua 脚本把 `INCR` 与“仅首次设置 PEXPIRE”放在同一原子操作中：

```lua
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
return count
```

键采用 `alert:aggregate:{deviceId}:{ruleId}:{escapedMetric}` 命名空间，规则 ID 保持在窗口维度中，避免同指标分层阈值互相吞并。Redis 异常仅触发一次受控的周期性警告并切换到本地窗口，不吞掉原始告警。

## 接口与数据流

```csharp
public interface IAlertAggregationStateStore
{
    Task<long> IncrementAsync(
        string key,
        TimeSpan window,
        CancellationToken cancellationToken = default);
}

public readonly record struct AlertAggregationDecision(
    bool ShouldCreate,
    bool ShouldUpdate,
    bool Silenced);

public interface IAlertAggregator
{
    Task<AlertAggregationDecision> EvaluateAsync(
        Guid deviceId,
        Guid ruleId,
        string metric,
        CancellationToken cancellationToken = default);
}
```

`AlertEvaluationService` 在评估器确认触发后 `await` 聚合器，并把自身的取消令牌继续向下传递。Redis 调用被取消时直接结束当前遥测处理；Redis 发生非取消异常时走本地降级，避免把基础设施短暂故障转化为告警丢失。

## 错误处理与一致性

- Redis Lua 脚本失败：记录限频警告，使用本地 `ConcurrentDictionary`，不中断当前告警。
- 本地降级只影响 Redis 故障期间的跨实例去重，不能保证全局计数；恢复后新窗口重新由 Redis 接管。
- 取消令牌已取消时不创建或更新本地计数，保持后台任务的停止语义。
- 继续保留数据库中“已有 Active 告警时创建降级为更新”的重启兜底，双重防止重复告警。

## 验证策略

- 单元测试验证原有 1/2–3/4+ 计数、设备/规则/指标隔离。
- 两个独立 `AlertAggregator` 共享同一个状态存储替身，验证跨实例计数。
- 状态存储抛异常时验证本地降级和当前调用不抛出基础设施异常。
- Redis 存储测试验证 Lua 调用包含单个键和窗口毫秒参数，并正确转换计数。
- Release 构建必须保持 0 警告/0 错误；完整单元测试必须通过。
