# RabbitMQ Production Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把现有 RabbitMQ 事件总线加固为生产默认、每处理器隔离、可确认发布、有限重试且由真实 broker 测试证明的可靠事件链路。

**Architecture:** 保留 `IEventBus` 业务接口，在基础设施层增加严格配置解析、v2 拓扑命名、重试头解析和连接状态边界。`RabbitMqEventBus` 先登记订阅、再由托管服务统一启动，每个处理器使用独立 quorum queue；发布端启用 confirm、mandatory 和通道互斥。Production Compose 固定 RabbitMQ 4.3.4 并加载 at-least-once DLX policy，CI 使用真实 broker 验证协议行为。

**Tech Stack:** .NET 8、ASP.NET Core Health Checks、RabbitMQ.Client 7.2.2、RabbitMQ 4.3.4、xUnit 2.9.3、Moq 4.20.72、Docker Compose、GitHub Actions

## Global Constraints

- 所有新增注释、日志、测试名和文档使用简体中文。
- Production 默认 `RabbitMQ`；Development 和 Testing 默认 `InMemory`。
- 只接受 `InMemory` 和 `RabbitMQ` 两个 Provider；未知值禁止降级。
- `MaxRetryCount=5` 表示首次处理在内总共最多尝试五次。
- 每个“事件类型 + 处理器类型”拥有独立 v2 main/retry/dead 队列。
- 发布必须同时使用持久化消息、`mandatory=true`、Publisher Confirms 和异步通道互斥。
- RabbitMQ 健康检查只进入 `ready`，不得进入 `liveness`。
- RabbitMQ 生产镜像固定 `rabbitmq:4.3.4-management-alpine`，不得使用浮动 `latest`。
- 不自动删除旧队列、死信、definitions 或 RabbitMQ 数据卷。
- 本计划不实现 Outbox/Inbox，不宣称恰好一次或数据库—消息原子性。
- 当前工作树位于 `main` 且包含既有未提交改动；不得 stage、覆盖或提交无关文件。Commit 步骤只在隔离功能分支执行，当前会话默认跳过。

---

## File Structure

### 新建文件

- `src/EquipAI.Infrastructure/Messaging/EventBusConfiguration.cs`：Provider 解析和环境安全校验。
- `src/EquipAI.Infrastructure/Messaging/RabbitMqTopologyNames.cs`：稳定、限长的 v2 拓扑命名。
- `src/EquipAI.Infrastructure/Messaging/RabbitMqRetryCountReader.cs`：精确解析 `x-death.count`。
- `src/EquipAI.Infrastructure/Messaging/IRabbitMqConnectionState.cs`：向健康检查暴露只读状态。
- `src/EquipAI.Infrastructure/HealthChecks/RabbitMqHealthCheck.cs`：RabbitMQ readiness 检查。
- `docker/rabbitmq/rabbitmq.conf`、`docker/rabbitmq/definitions.json`：加载 v2 at-least-once DLX policy。
- `tests/EquipAI.Tests.Unit/Eventing/EventBusConfigurationTests.cs`：配置解析测试。
- `tests/EquipAI.Tests.Unit/Eventing/RabbitMqTopologyNamesTests.cs`：拓扑命名测试。
- `tests/EquipAI.Tests.Unit/Eventing/RabbitMqRetryCountReaderTests.cs`：重试计数测试。
- `tests/EquipAI.Tests.Unit/Eventing/RabbitMqEventBusLifecycleTests.cs`：订阅生命周期测试。
- `tests/EquipAI.Tests.Unit/HealthChecks/RabbitMqHealthCheckTests.cs`：readiness 测试。
- `tests/EquipAI.Tests.Integration/Eventing/RabbitMqFactAttribute.cs`：真实 broker 测试开关。
- `tests/EquipAI.Tests.Integration/Eventing/RabbitMqEventBusIntegrationTests.cs`：RabbitMQ 协议测试。

### 修改文件

- `src/EquipAI.Infrastructure/Messaging/RabbitMqOptions.cs`
- `src/EquipAI.Infrastructure/Messaging/RabbitMqEventBus.cs`
- `src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj`
- `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs`
- `src/EquipAI.WebAPI/Program.cs`
- `src/EquipAI.WebAPI/appsettings.json`
- `src/EquipAI.WebAPI/appsettings.Production.json`
- `tests/EquipAI.Tests.Unit/Eventing/RabbitMqEventBusOptionsTests.cs`
- `tests/EquipAI.Tests.Integration/EquipAI.Tests.Integration.csproj`
- `.github/workflows/ci.yml`
- `docker/docker-compose.yml`、`docker/.env.example`
- `README.md`、`CHANGELOG.md`、`docs/EVENT_BUS.md`、`docs/DEPLOY.md`、`docs/OPS_RUNBOOK.md`、`docs/environment-variables.md`
- `docs/evaluation/S09-风险登记册.md`、`docs/evaluation/13-技术债务与改进路线图.md`

---

### Task 1: 严格解析事件总线配置

**Files:**
- Create: `src/EquipAI.Infrastructure/Messaging/EventBusConfiguration.cs`
- Modify: `src/EquipAI.Infrastructure/Messaging/RabbitMqOptions.cs`
- Modify: `src/EquipAI.WebAPI/Program.cs`
- Modify: `src/EquipAI.WebAPI/appsettings.Production.json`
- Test: `tests/EquipAI.Tests.Unit/Eventing/EventBusConfigurationTests.cs`
- Create: `tests/EquipAI.Tests.Unit/Eventing/RabbitMqEventBusLifecycleTests.cs`

**Interfaces:**
- Produces: `public enum EventBusProvider { InMemory, RabbitMQ }`
- Produces: `EventBusConfiguration.ResolveProvider(IConfiguration) -> EventBusProvider`
- Produces: `EventBusConfiguration.ValidateForEnvironment(IConfiguration, string) -> void`

- [ ] **Step 1: 写 Provider 和生产保护失败测试**

```csharp
[Theory]
[InlineData("InMemory", EventBusProvider.InMemory)]
[InlineData("rabbitmq", EventBusProvider.RabbitMQ)]
[InlineData(null, EventBusProvider.InMemory)]
public void ResolveProvider_合法配置_返回确定实现(string? raw, EventBusProvider expected)
{
    var configuration = BuildConfiguration(("EventBus:Provider", raw));
    EventBusConfiguration.ResolveProvider(configuration).Should().Be(expected);
}

[Fact]
public void ResolveProvider_未知值_抛出配置异常()
{
    var configuration = BuildConfiguration(("EventBus:Provider", "RabittMQ"));
    var action = () => EventBusConfiguration.ResolveProvider(configuration);
    action.Should().Throw<InvalidOperationException>().WithMessage("*RabittMQ*");
}

[Fact]
public void ValidateForEnvironment_生产使用InMemory且未授权_拒绝启动()
{
    var configuration = BuildConfiguration(("EventBus:Provider", "InMemory"));
    var action = () => EventBusConfiguration.ValidateForEnvironment(configuration, "Production");
    action.Should().Throw<InvalidOperationException>().WithMessage("*AllowInMemoryInProduction*");
}
```

- [ ] **Step 2: 运行测试并确认红灯**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~EventBusConfigurationTests"`

Expected: FAIL，提示 `EventBusConfiguration` 和 `EventBusProvider` 不存在。

- [ ] **Step 3: 实现真实解析器和边界校验**

```csharp
public enum EventBusProvider
{
    InMemory,
    RabbitMQ
}

public static class EventBusConfiguration
{
    public static EventBusProvider ResolveProvider(IConfiguration configuration)
    {
        var raw = configuration["EventBus:Provider"];
        if (string.IsNullOrWhiteSpace(raw)) return EventBusProvider.InMemory;
        if (raw.Equals("InMemory", StringComparison.OrdinalIgnoreCase)) return EventBusProvider.InMemory;
        if (raw.Equals("RabbitMQ", StringComparison.OrdinalIgnoreCase)) return EventBusProvider.RabbitMQ;
        throw new InvalidOperationException($"不支持的事件总线 Provider：{raw}，仅允许 InMemory 或 RabbitMQ");
    }

    public static void ValidateForEnvironment(IConfiguration configuration, string environmentName)
    {
        var provider = ResolveProvider(configuration);
        var isProduction = environmentName.Equals("Production", StringComparison.OrdinalIgnoreCase);
        if (isProduction && provider == EventBusProvider.InMemory
            && !configuration.GetValue("EventBus:AllowInMemoryInProduction", false))
        {
            throw new InvalidOperationException(
                "生产环境禁止使用 InMemory；紧急降级需显式设置 EventBus:AllowInMemoryInProduction=true");
        }

        if (provider == EventBusProvider.RabbitMQ)
        {
            var options = configuration.GetSection("EventBus:RabbitMq").Get<RabbitMqOptions>()
                ?? new RabbitMqOptions();
            ValidateRabbitMq(options, isProduction);
        }
    }
}
```

`ValidateRabbitMq` 逐项验证 Host、Port、Username、Password、MaxRetryCount、RetryIntervalSeconds、HandlerTimeoutSeconds 和 PrefetchCount；异常只包含字段名，不输出密码。

- [ ] **Step 4: 接入启动入口并设置生产默认值**

在 `Program.cs` 的 `AddInfrastructure` 前调用：

```csharp
EventBusConfiguration.ValidateForEnvironment(
    builder.Configuration,
    builder.Environment.EnvironmentName);
builder.Services.AddInfrastructure(builder.Configuration);
```

在 `appsettings.Production.json` 增加：

```json
"EventBus": {
  "Provider": "RabbitMQ",
  "AllowInMemoryInProduction": false
}
```

- [ ] **Step 5: 运行配置测试**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~EventBusConfigurationTests|FullyQualifiedName~RabbitMqEventBusOptionsTests"`

Expected: PASS；未知 Provider、弱生产密码、非法端口和未授权 InMemory 均被覆盖。

- [ ] **Step 6: Commit（仅隔离功能分支）**

```bash
git add src/EquipAI.Infrastructure/Messaging/EventBusConfiguration.cs \
  src/EquipAI.Infrastructure/Messaging/RabbitMqOptions.cs \
  src/EquipAI.WebAPI/Program.cs src/EquipAI.WebAPI/appsettings.Production.json \
  tests/EquipAI.Tests.Unit/Eventing/EventBusConfigurationTests.cs \
  tests/EquipAI.Tests.Unit/Eventing/RabbitMqEventBusOptionsTests.cs
git commit -m "fix(eventbus): 严格校验生产事件总线配置"
```

### Task 2: 实现稳定 v2 命名与精确重试计数

**Files:**
- Create: `src/EquipAI.Infrastructure/Messaging/RabbitMqTopologyNames.cs`
- Create: `src/EquipAI.Infrastructure/Messaging/RabbitMqRetryCountReader.cs`
- Modify: `src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj`
- Test: `tests/EquipAI.Tests.Unit/Eventing/RabbitMqTopologyNamesTests.cs`
- Test: `tests/EquipAI.Tests.Unit/Eventing/RabbitMqRetryCountReaderTests.cs`

**Interfaces:**
- Produces: `RabbitMqTopologyNames.GetExchangeName(Type)`
- Produces: `RabbitMqTopologyNames.GetMainQueueName(Type, Type)`、`GetRetryQueueName`、`GetDeadQueueName`
- Produces: `RabbitMqRetryCountReader.GetRejectedCount(IDictionary<string, object?>?, string) -> int`

- [ ] **Step 1: 写命名和压缩 x-death 测试**

```csharp
[Fact]
public void GetMainQueueName_相同类型输入_结果稳定且不超过255字节()
{
    var first = RabbitMqTopologyNames.GetMainQueueName(typeof(TestEvent), typeof(TestHandler));
    var second = RabbitMqTopologyNames.GetMainQueueName(typeof(TestEvent), typeof(TestHandler));
    first.Should().Be(second).And.StartWith("equipai.v2.");
    Encoding.UTF8.GetByteCount(first).Should().BeLessThanOrEqualTo(255);
}

[Fact]
public void GetRejectedCount_xDeath记录被压缩_读取count而非数组长度()
{
    IDictionary<string, object?> headers = new Dictionary<string, object?>
    {
        ["x-death"] = new List<object>
        {
            new Dictionary<string, object?>
            {
                ["queue"] = Encoding.UTF8.GetBytes("equipai.v2.main"),
                ["reason"] = Encoding.UTF8.GetBytes("rejected"),
                ["count"] = 4L
            }
        }
    };
    RabbitMqRetryCountReader.GetRejectedCount(headers, "equipai.v2.main").Should().Be(4);
}
```

- [ ] **Step 2: 运行测试确认红灯**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~RabbitMqTopologyNamesTests|FullyQualifiedName~RabbitMqRetryCountReaderTests"`

Expected: FAIL，两个生产类型尚不存在。

- [ ] **Step 3: 实现限长稳定命名器**

```csharp
internal static class RabbitMqTopologyNames
{
    private const string Prefix = "equipai.v2";

    internal static string GetExchangeName(Type eventType) =>
        $"{Prefix}.events.{BuildTypeKey(eventType)}";
    internal static string GetMainQueueName(Type eventType, Type handlerType) =>
        $"{Prefix}.{BuildTypeKey(eventType)}.{BuildTypeKey(handlerType)}";
    internal static string GetRetryQueueName(Type eventType, Type handlerType) =>
        $"{GetMainQueueName(eventType, handlerType)}.retry";
    internal static string GetDeadQueueName(Type eventType, Type handlerType) =>
        $"{GetMainQueueName(eventType, handlerType)}.dead";

    private static string BuildTypeKey(Type type)
    {
        var readable = new string(type.Name.Where(char.IsLetterOrDigit).ToArray()).ToLowerInvariant();
        readable = readable.Length <= 40 ? readable : readable[..40];
        var fullName = type.FullName ?? type.Name;
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(fullName)))
            .ToLowerInvariant()[..12];
        return $"{readable}.{hash}";
    }
}
```

- [ ] **Step 4: 实现健壮的 x-death 解码器**

支持 `byte[]`、`ReadOnlyMemory<byte>`、`string` 文本，以及 `byte`、`int`、`long`、`uint`、`ulong` 计数；只匹配指定 queue 且 `reason=rejected`，非法值返回 `0`，超出 `int.MaxValue` 时饱和。

```csharp
internal static int GetRejectedCount(IDictionary<string, object?>? headers, string queueName)
{
    if (headers is null || !headers.TryGetValue("x-death", out var raw)
        || raw is not IEnumerable<object> deaths) return 0;
    foreach (var item in deaths)
    {
        if (item is not IDictionary<string, object?> table) continue;
        if (DecodeText(table.GetValueOrDefault("queue")) != queueName) continue;
        if (DecodeText(table.GetValueOrDefault("reason")) != "rejected") continue;
        return ToBoundedInt(table.GetValueOrDefault("count"));
    }
    return 0;
}
```

- [ ] **Step 5: 开放集成测试 internal 访问并验证**

在 `EquipAI.Infrastructure.csproj` 增加：

```xml
<InternalsVisibleTo Include="EquipAI.Tests.Integration" />
```

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~RabbitMqTopologyNamesTests|FullyQualifiedName~RabbitMqRetryCountReaderTests"`

Expected: PASS；包含多记录、错误 reason、非法 count 和长类型名测试。

- [ ] **Step 6: Commit（仅隔离功能分支）**

```bash
git add src/EquipAI.Infrastructure/Messaging/RabbitMqTopologyNames.cs \
  src/EquipAI.Infrastructure/Messaging/RabbitMqRetryCountReader.cs \
  src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj \
  tests/EquipAI.Tests.Unit/Eventing/RabbitMqTopologyNamesTests.cs \
  tests/EquipAI.Tests.Unit/Eventing/RabbitMqRetryCountReaderTests.cs
git commit -m "feat(eventbus): 增加v2拓扑命名与重试计数解析"
```

### Task 3: 重构订阅生命周期和每处理器独立拓扑

**Files:**
- Modify: `src/EquipAI.Infrastructure/Messaging/RabbitMqEventBus.cs`
- Modify: `src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj`
- Create: `tests/EquipAI.Tests.Unit/Eventing/RabbitMqEventBusLifecycleTests.cs`

**Interfaces:**
- Consumes: Task 2 的 `RabbitMqTopologyNames`
- Produces: `RabbitMqEventBus : IEventBus, IHostedService, IAsyncDisposable, IDisposable`

- [ ] **Step 1: 写生命周期状态测试**

```csharp
[Fact]
public void Subscribe_同一事件不同处理器_登记两个独立订阅()
{
    using var bus = CreateUnstartedBus();
    bus.Subscribe<TestEvent, FirstHandler>();
    bus.Subscribe<TestEvent, SecondHandler>();
    bus.RegisteredSubscriptionCount.Should().Be(2);
}

[Fact]
public void Subscribe_总线启动后调用_拒绝动态修改拓扑()
{
    using var bus = CreateBusMarkedStartedForTest();
    var action = () => bus.Subscribe<TestEvent, FirstHandler>();
    action.Should().Throw<InvalidOperationException>().WithMessage("*启动后*");
}
```

- [ ] **Step 2: 运行测试确认旧实现失败**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~RabbitMqEventBusLifecycleTests"`

Expected: FAIL，旧实现没有独立订阅计数和启动门禁。

- [ ] **Step 3: 把连接创建迁移到 StartAsync**

增加显式依赖：

```xml
<PackageReference Include="Microsoft.Extensions.Hosting.Abstractions" Version="8.0.1" />
```

核心结构：

```csharp
private readonly ConcurrentDictionary<SubscriptionKey, SubscriptionRegistration> _subscriptions = new();
private IConnection? _connection;
private IChannel? _publishChannel;
private int _started;

public async Task StartAsync(CancellationToken cancellationToken)
{
    if (Interlocked.Exchange(ref _started, 1) == 1) return;
    try
    {
        _connection = await CreateConnectionAsync(cancellationToken);
        _publishChannel = await _connection.CreateChannelAsync(
            new CreateChannelOptions(
                publisherConfirmationsEnabled: true,
                publisherConfirmationTrackingEnabled: true),
            cancellationToken);
        foreach (var registration in _subscriptions.Values)
            await DeclareTopologyAndConsumeAsync(registration, cancellationToken);
        Volatile.Write(ref _ready, 1);
    }
    catch
    {
        Volatile.Write(ref _ready, 0);
        Interlocked.Exchange(ref _started, 0);
        await DisposeConnectionAsync();
        throw;
    }
}
```

- [ ] **Step 4: 将订阅登记改为事件—处理器二元键**

```csharp
public void Subscribe<TEvent, THandler>()
    where TEvent : IIntegrationEvent
    where THandler : IEventHandler<TEvent>
{
    if (Volatile.Read(ref _started) == 1)
        throw new InvalidOperationException("RabbitMQ 事件总线启动后禁止新增订阅");
    var key = new SubscriptionKey(typeof(TEvent), typeof(THandler));
    _subscriptions.TryAdd(key, new SubscriptionRegistration(key.EventType, key.HandlerType));
}
```

每个 registration 声明独立 main/retry/dead quorum queues。main 的 DLX 经默认交换机路由到 retry；retry 的 TTL DLX 只路由回同一 main；事件 fanout exchange 只绑定各处理器 main queue。

- [ ] **Step 5: 每个消费者只调用一个处理器并强制超时**

```csharp
using var scope = _serviceProvider.CreateScope();
var handler = scope.ServiceProvider.GetRequiredService(registration.HandlerType);
var method = registration.HandlerType.GetMethod(
    "HandleAsync", [registration.EventType, typeof(CancellationToken)])
    ?? throw new InvalidOperationException($"处理器缺少 HandleAsync：{registration.HandlerType.FullName}");
var task = (Task?)method.Invoke(handler, [integrationEvent, handlerCts.Token])
    ?? throw new InvalidOperationException("事件处理器返回了 null Task");
await task.WaitAsync(handlerCts.Token);
```

- [ ] **Step 6: 实现有界 StopAsync 和幂等释放**

`StopAsync` 先把 Ready 置零，再关闭消费者通道、发布通道和连接。`Dispose` 不执行无界等待；重复停止和重复释放必须幂等。

- [ ] **Step 7: 运行生命周期测试和构建**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~RabbitMqEventBusLifecycleTests"`

Run: `dotnet build EquipAI.sln -c Release --no-restore -m:1 --disable-build-servers`

Expected: PASS；构建零警告、零错误。

- [ ] **Step 8: Commit（仅隔离功能分支）**

```bash
git add src/EquipAI.Infrastructure/Messaging/RabbitMqEventBus.cs \
  src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj \
  tests/EquipAI.Tests.Unit/Eventing/RabbitMqEventBusLifecycleTests.cs
git commit -m "refactor(eventbus): 隔离RabbitMQ处理器消费拓扑"
```

### Task 4: 实现确认发布、有限重试和可靠死信

**Files:**
- Modify: `src/EquipAI.Infrastructure/Messaging/RabbitMqEventBus.cs`
- Test: `tests/EquipAI.Tests.Unit/Eventing/RabbitMqEventBusOptionsTests.cs`
- Test: `tests/EquipAI.Tests.Unit/Eventing/RabbitMqRetryCountReaderTests.cs`

**Interfaces:**
- Consumes: Task 2 的拓扑命名器和重试计数解析器
- Produces: `PublishCoreAsync(string, string, BasicProperties, ReadOnlyMemory<byte>, CancellationToken)`

- [ ] **Step 1: 写总尝试次数边界测试**

```csharp
[Theory]
[InlineData(0, 5, false)]
[InlineData(3, 5, false)]
[InlineData(4, 5, true)]
public void ShouldDeadLetter_达到总尝试次数后进入死信(
    int previousRejectedCount, int maxRetryCount, bool expected)
{
    RabbitMqEventBus.ShouldDeadLetter(previousRejectedCount, maxRetryCount)
        .Should().Be(expected);
}
```

- [ ] **Step 2: 运行边界测试确认红灯**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~ShouldDeadLetter"`

Expected: FAIL，`ShouldDeadLetter` 尚不存在。

- [ ] **Step 3: 串行化发布并等待 broker confirm**

```csharp
private readonly SemaphoreSlim _publishLock = new(1, 1);

private async Task PublishCoreAsync(
    string exchange,
    string routingKey,
    BasicProperties properties,
    ReadOnlyMemory<byte> body,
    CancellationToken cancellationToken)
{
    var channel = _publishChannel;
    if (Volatile.Read(ref _ready) != 1 || channel is null || !channel.IsOpen)
        throw new InvalidOperationException("RabbitMQ 事件总线尚未就绪");
    await _publishLock.WaitAsync(cancellationToken);
    try
    {
        await channel.BasicPublishAsync(
            exchange, routingKey, mandatory: true, properties, body, cancellationToken);
    }
    finally
    {
        _publishLock.Release();
    }
}
```

公开 `PublishAsync` 检查至少存在一个该事件类型订阅，设置 Persistent、ContentType、MessageId 和 Timestamp。Nack、Basic.Return、断连或取消必须向上传播。

- [ ] **Step 4: 用 x-death.count 判定总尝试次数**

```csharp
internal static bool ShouldDeadLetter(int previousRejectedCount, int maxRetryCount) =>
    previousRejectedCount + 1 >= maxRetryCount;
```

未达上限时执行 `BasicNackAsync(deliveryTag, false, false)`；达到上限时走死信发布。

- [ ] **Step 5: 确认写入死信后再确认原消息**

```csharp
await PublishCoreAsync(
    string.Empty,
    deadQueue,
    CreateDeadLetterProperties(ea.BasicProperties, eventType, handlerType, rootException),
    ea.Body,
    cancellationToken);
await consumeChannel.BasicAckAsync(ea.DeliveryTag, false, cancellationToken);
```

死信发布失败时不确认原消息。死信 header 只记录异常类型和限长消息，不记录事件载荷或凭证。

- [ ] **Step 6: 运行事件总线单元测试**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~RabbitMqEventBus|FullyQualifiedName~RabbitMqRetryCountReader"`

Expected: PASS；重试上限无 off-by-one。

- [ ] **Step 7: Commit（仅隔离功能分支）**

```bash
git add src/EquipAI.Infrastructure/Messaging/RabbitMqEventBus.cs \
  tests/EquipAI.Tests.Unit/Eventing/RabbitMqEventBusOptionsTests.cs \
  tests/EquipAI.Tests.Unit/Eventing/RabbitMqRetryCountReaderTests.cs
git commit -m "fix(eventbus): 确认RabbitMQ发布并限制失败重试"
```

### Task 5: 将 RabbitMQ 连接状态纳入就绪检查

**Files:**
- Create: `src/EquipAI.Infrastructure/Messaging/IRabbitMqConnectionState.cs`
- Create: `src/EquipAI.Infrastructure/HealthChecks/RabbitMqHealthCheck.cs`
- Modify: `src/EquipAI.Infrastructure/Messaging/RabbitMqEventBus.cs`
- Modify: `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs`
- Create: `tests/EquipAI.Tests.Unit/HealthChecks/RabbitMqHealthCheckTests.cs`
- Create: `tests/EquipAI.Tests.Unit/Extensions/ServiceCollectionExtensionsEventBusTests.cs`

- [ ] **Step 1: 先写 RabbitMQ 健康状态单元测试**

```csharp
[Fact]
public async Task CheckHealthAsync_事件总线已就绪_返回健康()
{
    var state = new Mock<IRabbitMqConnectionState>();
    state.SetupGet(x => x.IsReady).Returns(true);
    state.SetupGet(x => x.StatusDescription).Returns("RabbitMQ 连接与发布通道已就绪");
    var check = new RabbitMqHealthCheck(state.Object);

    var result = await check.CheckHealthAsync(new HealthCheckContext());

    result.Status.Should().Be(HealthStatus.Healthy);
}

[Fact]
public async Task CheckHealthAsync_事件总线未就绪_返回不健康()
{
    var state = new Mock<IRabbitMqConnectionState>();
    state.SetupGet(x => x.IsReady).Returns(false);
    state.SetupGet(x => x.StatusDescription).Returns("RabbitMQ 连接尚未建立");
    var check = new RabbitMqHealthCheck(state.Object);

    var result = await check.CheckHealthAsync(new HealthCheckContext());

    result.Status.Should().Be(HealthStatus.Unhealthy);
}
```

- [ ] **Step 2: 运行测试确认红灯**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~RabbitMqHealthCheckTests"`

Expected: FAIL，健康检查类型尚不存在。

- [ ] **Step 3: 实现只读连接状态和健康检查**

```csharp
public interface IRabbitMqConnectionState
{
    bool IsReady { get; }
    string StatusDescription { get; }
}

public sealed class RabbitMqHealthCheck(IRabbitMqConnectionState state) : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(state.IsReady
            ? HealthCheckResult.Healthy(state.StatusDescription)
            : HealthCheckResult.Unhealthy(state.StatusDescription));
}
```

`RabbitMqEventBus` 实现 `IRabbitMqConnectionState`。只有连接、发布通道和全部消费者均成功建立后，`IsReady` 才返回 `true`；连接恢复过程中返回 `false`。

- [ ] **Step 4: 以同一个单例注册总线、HostedService 和状态接口**

```csharp
services.Configure<RabbitMqOptions>(configuration.GetSection("EventBus:RabbitMq"));
services.AddSingleton<RabbitMqEventBus>();
services.AddSingleton<IEventBus>(sp => sp.GetRequiredService<RabbitMqEventBus>());
services.AddSingleton<IRabbitMqConnectionState>(
    sp => sp.GetRequiredService<RabbitMqEventBus>());
services.AddSingleton<IHostedService>(
    sp => sp.GetRequiredService<RabbitMqEventBus>());
services.AddHealthChecks().AddCheck<RabbitMqHealthCheck>(
    "rabbitmq-eventbus",
    tags: ["ready"]);
```

RabbitMQ HostedService 必须在 MQTT 等会发布领域事件的后台服务之前注册。InMemory 分支不注册 RabbitMQ HostedService 和 RabbitMQ 健康检查。

- [ ] **Step 5: 验证注册身份和 readiness 标签**

在 `ServiceCollectionExtensionsEventBusTests` 中断言 `IEventBus`、`IHostedService`、`IRabbitMqConnectionState` 指向同一实例；未知 provider 和生产 InMemory 非法配置继续抛异常。

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~RabbitMqHealthCheck|FullyQualifiedName~ServiceCollectionExtensionsEventBusTests"`

Expected: PASS。

- [ ] **Step 6: Commit（仅隔离功能分支）**

```bash
git add src/EquipAI.Infrastructure/Messaging/IRabbitMqConnectionState.cs \
  src/EquipAI.Infrastructure/HealthChecks/RabbitMqHealthCheck.cs \
  src/EquipAI.Infrastructure/Messaging/RabbitMqEventBus.cs \
  src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs \
  tests/EquipAI.Tests.Unit/HealthChecks/RabbitMqHealthCheckTests.cs \
  tests/EquipAI.Tests.Unit/Extensions/ServiceCollectionExtensionsEventBusTests.cs
git commit -m "feat(health): 将RabbitMQ纳入生产就绪检查"
```

### Task 6: 固化 RabbitMQ 4.3 镜像与可靠死信策略

**Files:**
- Create: `docker/rabbitmq/rabbitmq.conf`
- Create: `docker/rabbitmq/definitions.json`
- Modify: `docker/docker-compose.yml`
- Modify: `docker/.env.example`

- [ ] **Step 1: 先验证缺失镜像变量时 Compose 安全失败**

Run: `docker compose -f docker/docker-compose.yml config --quiet`

Expected: FAIL，并明确提示必须设置 `RABBITMQ_IMAGE`，不允许静默漂移到 `latest` 或旧版本。

- [ ] **Step 2: 添加版本化镜像变量**

在 `docker/.env.example` 中添加：

```dotenv
# RabbitMQ 使用精确版本，升级前先按运维手册完成备份、兼容性检查和滚动验证
RABBITMQ_IMAGE=rabbitmq:4.3.4-management-alpine
```

Compose 使用：

```yaml
rabbitmq:
  image: "${RABBITMQ_IMAGE:?请设置 RABBITMQ_IMAGE，例如 rabbitmq:4.3.4-management-alpine}"
```

- [ ] **Step 3: 通过 definitions 固化 v2 队列策略**

`docker/rabbitmq/rabbitmq.conf`：

```ini
management.load_definitions = /etc/rabbitmq/definitions.json
```

`docker/rabbitmq/definitions.json`：

```json
{
  "policies": [
    {
      "vhost": "/",
      "name": "equipai-v2-at-least-once-dlx",
      "pattern": "^equipai\\.v2\\.",
      "apply-to": "queues",
      "definition": {
        "dead-letter-strategy": "at-least-once",
        "overflow": "reject-publish"
      },
      "priority": 20
    }
  ]
}
```

将配置文件只读挂载到容器，并保留现有 RabbitMQ 数据卷；不得在本任务中删除旧队列或卷。

- [ ] **Step 4: 让生产后端默认使用 RabbitMQ 并等待其健康**

```yaml
backend:
  environment:
    EventBus__Provider: "${EVENTBUS_PROVIDER:-RabbitMQ}"
  depends_on:
    rabbitmq:
      condition: service_healthy
```

开发 Compose 继续显式使用 InMemory。生产 Compose 的 RabbitMQ healthcheck 只检查 broker 存活与可接受连接。

- [ ] **Step 5: 验证两套 Compose 配置**

Run:

```bash
RABBITMQ_IMAGE=rabbitmq:4.3.4-management-alpine \
PG_PASSWORD=compose-test-password \
JWT_SECRET=compose-test-jwt-secret-at-least-32-characters \
docker compose -f docker/docker-compose.yml config --quiet
docker compose -f docker/docker-compose.dev.yml config --quiet
```

Expected: PASS；输出配置中生产 provider 为 RabbitMQ，开发 provider 为 InMemory，RabbitMQ 镜像为精确版本。

- [ ] **Step 6: Commit（仅隔离功能分支）**

```bash
git add docker/rabbitmq/rabbitmq.conf docker/rabbitmq/definitions.json \
  docker/docker-compose.yml docker/.env.example
git commit -m "chore(rabbitmq): 固化4.3镜像和可靠死信策略"
```

### Task 7: 用真实 RabbitMQ 覆盖关键可靠性路径

**Files:**
- Create: `tests/EquipAI.Tests.Integration/Eventing/RabbitMqFactAttribute.cs`
- Create: `tests/EquipAI.Tests.Integration/Eventing/RabbitMqEventBusIntegrationTests.cs`
- Modify: `tests/EquipAI.Tests.Integration/EquipAI.Tests.Integration.csproj`
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: 添加本地可跳过、CI 强制执行的测试属性**

```csharp
public sealed class RabbitMqFactAttribute : FactAttribute
{
    public RabbitMqFactAttribute()
    {
        if (!string.Equals(
                Environment.GetEnvironmentVariable("RUN_RABBITMQ_INTEGRATION_TESTS"),
                "true",
                StringComparison.OrdinalIgnoreCase))
        {
            Skip = "设置 RUN_RABBITMQ_INTEGRATION_TESTS=true 后运行 RabbitMQ 集成测试";
        }
    }
}
```

集成测试项目显式引用与 Infrastructure 一致的 `RabbitMQ.Client` 7.2.2，避免隐式传递依赖造成编译漂移。

- [ ] **Step 2: 先写关键场景集成测试**

测试均使用唯一事件类型和队列后缀，并以 `CancellationTokenSource` 限定等待时间，逐项实现以下断言：

- 一个事件注册三个处理器后，三个处理器的计数都精确等于一。
- 一个处理器持续失败时，成功处理器只执行一次；失败处理器在 `MaxRetryCount=3` 时精确执行三次，随后 dead 队列消息数变为一。
- 用 `Task.WhenAll` 并发发布一百条不同 EventId 的事件，发布任务全部成功且消费者收到一百个唯一 EventId。
- 建立无绑定事件交换机并执行 mandatory publish，断言 `PublishAsync` 抛出可识别的路由失败异常。
- 发布完成后先关闭总线，再创建同拓扑总线和处理器，断言已确认的持久化消息继续被消费。
- 查询 v2 主队列的有效 policy，断言包含 `dead-letter-strategy=at-least-once` 和 `overflow=reject-publish`。

实现测试辅助类时不得用固定延迟断言，使用有上限的轮询或 `TaskCompletionSource`；测试结束只删除本测试创建的唯一 v2 队列和交换机。

- [ ] **Step 3: 在本地无 broker 环境确认测试可安全跳过**

Run: `dotnet test tests/EquipAI.Tests.Integration --filter "FullyQualifiedName~RabbitMqEventBusIntegrationTests"`

Expected: PASS with skipped tests，且不会连接或修改本地 RabbitMQ。

- [ ] **Step 4: 在 CI 后端测试 Job 提供 RabbitMQ 4.3 服务**

```yaml
services:
  rabbitmq:
    image: rabbitmq:4.3.4-alpine
    env:
      RABBITMQ_DEFAULT_USER: equipai_test
      RABBITMQ_DEFAULT_PASS: equipai_test_password
    ports:
      - 5672:5672
    options: >-
      --health-cmd "rabbitmq-diagnostics -q ping"
      --health-interval 10s
      --health-timeout 5s
      --health-retries 12
```

为集成测试步骤设置 `RUN_RABBITMQ_INTEGRATION_TESTS=true`、主机、端口、用户名和密码；不在日志中打印密码。

在测试前用服务容器内的 `rabbitmqctl set_policy` 为 `^equipai\\.v2\\.` 应用 `dead-letter-strategy=at-least-once` 与 `overflow=reject-publish`，再用 `rabbitmqctl list_policies` 验证；这使 CI 与生产 definitions 使用相同前提。

- [ ] **Step 5: 运行真实 broker 集成测试**

Run: `RUN_RABBITMQ_INTEGRATION_TESTS=true dotnet test tests/EquipAI.Tests.Integration --filter "FullyQualifiedName~RabbitMqEventBusIntegrationTests"`

Expected: PASS，所有可靠性场景在真实 RabbitMQ 上通过。如果本机没有可用 broker，只在 CI 验证该步骤，不启动或删除用户现有容器。

- [ ] **Step 6: Commit（仅隔离功能分支）**

```bash
git add tests/EquipAI.Tests.Integration/Eventing/RabbitMqFactAttribute.cs \
  tests/EquipAI.Tests.Integration/Eventing/RabbitMqEventBusIntegrationTests.cs \
  tests/EquipAI.Tests.Integration/EquipAI.Tests.Integration.csproj \
  .github/workflows/ci.yml
git commit -m "test(eventbus): 覆盖RabbitMQ可靠投递路径"
```

### Task 8: 同步生产文档并完成全量验证

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/EVENT_BUS.md`
- Modify: `docs/DEPLOY.md`
- Modify: `docs/OPS_RUNBOOK.md`
- Modify: `docs/environment-variables.md`
- Modify: `docs/evaluation/00-INDEX.md`
- Modify: `docs/evaluation/S09-风险登记册.md`
- Modify: `docs/evaluation/13-技术债务与改进路线图.md`
- Modify: `docs/FINAL_TECHNICAL_DESIGN.md`

- [ ] **Step 1: 更新部署与配置文档**

明确记录：

- 生产默认 RabbitMQ，开发/测试默认 InMemory；生产 InMemory 仅允许显式 break-glass。
- v2 拓扑按“事件 + 处理器”建立 main/retry/dead 队列。
- `MaxRetryCount` 表示包括首次处理在内的总尝试次数。
- 单节点 durable/quorum 只能提升重启恢复能力，不等同于高可用。
- 当前保障是 RabbitMQ 内的 at-least-once；数据库与消息原子性仍需后续 Outbox/Inbox 项目解决。

- [ ] **Step 2: 更新升级和回滚运维剧本**

记录 RabbitMQ `3.13 -> 4.2 -> 4.3` 支持升级路径、备份与兼容性检查、v2 切换、旧队列排空、死信保留和策略验证命令。回滚时不得删除 v2 队列或 RabbitMQ 数据卷。

策略验证可使用管理 API 或：

```bash
rabbitmqctl list_policies
rabbitmqctl list_queues name durable arguments policy
```

应用 readiness 不依赖 management 插件或管理凭证。

- [ ] **Step 3: 更新风险证据**

修正风险登记册中 RabbitMQ R03 的状态：发布确认、独立重试、readiness 和真实 broker 测试完成后降低发生概率；“数据库事务与消息发布仍非原子”继续保留为未解决风险，并明确下一阶段 Outbox/Inbox 的验收条件。

- [ ] **Step 4: 运行后端全量构建和测试**

Run:

```bash
dotnet restore EquipAI.sln --disable-parallel
dotnet build EquipAI.sln -c Release --no-restore -m:1 --disable-build-servers
dotnet test tests/EquipAI.Tests.Unit -c Release --no-build
dotnet test tests/EquipAI.Tests.Integration -c Release --no-build
```

Expected: 构建和全部非外部依赖测试通过；本地 RabbitMQ 集成测试可标记 skipped，CI 中必须通过。

- [ ] **Step 5: 运行覆盖率、依赖和 Compose 检查**

Run:

```bash
dotnet test tests/EquipAI.Tests.Unit -c Release --collect:"XPlat Code Coverage"
dotnet list EquipAI.sln package --vulnerable --include-transitive
RABBITMQ_IMAGE=rabbitmq:4.3.4-management-alpine \
PG_PASSWORD=compose-test-password \
JWT_SECRET=compose-test-jwt-secret-at-least-32-characters \
docker compose -f docker/docker-compose.yml config --quiet
docker compose -f docker/docker-compose.dev.yml config --quiet
git diff --check
```

Expected: 覆盖率门槛保持通过；无已知漏洞或明确记录无法立即修复的例外；Compose 配置有效；无空白错误。

- [ ] **Step 6: 最终差异审查**

逐项核对设计文档验收标准，确认未修改用户已有无关文件、未启动或删除本地容器/卷、未误将生产配置降级到 InMemory。

- [ ] **Step 7: Commit（仅隔离功能分支）**

```bash
git add README.md CHANGELOG.md docs/EVENT_BUS.md docs/DEPLOY.md docs/OPS_RUNBOOK.md \
  docs/environment-variables.md docs/evaluation/00-INDEX.md \
  docs/evaluation/S09-风险登记册.md docs/evaluation/13-技术债务与改进路线图.md \
  docs/FINAL_TECHNICAL_DESIGN.md
git commit -m "docs(eventbus): 补充RabbitMQ生产运行手册"
```

## Execution Notes

- Task 1 和 Task 2 逻辑独立，但先完成严格配置，避免后续测试在错误 provider 下运行。
- Task 3、Task 4、Task 5 会连续修改同一事件总线，必须顺序执行并在每个任务后运行对应测试。
- Task 6 可独立准备配置文件，但本任务不自动启动、迁移或删除用户本地 RabbitMQ 容器和数据卷。
- Task 7 依赖 Task 2 至 Task 6 的拓扑和生命周期实现；本地无 broker 时跳过，CI 必须真实执行。
- Task 8 只记录已经通过验证的行为，不提前把未实现的 Outbox/Inbox 描述成已完成。
- 当前工作区位于包含用户未提交改动的 `main` 分支，因此本轮默认跳过所有 Commit 步骤，只做精确文件修改和验证。
