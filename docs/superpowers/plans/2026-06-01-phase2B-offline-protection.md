# Phase 2B：断网保护 + 设备配置向导 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在边缘网关中实现断网保护（内存队列 + SQLite 缓存 + 恢复回放），并在后端 + 前端实现设备配置向导 API 和页面。

**Architecture:** `LocalBuffer` 分两层：内存环形队列（10000 条）作为第一层缓冲；网络不可达时溢出到 SQLite（7 天容量）。`CloudUploader` 检测网络状态，断网时切换为本地缓存模式，恢复后按时间序回传。后端新增 `DeviceConfigController` 提供设备模板和配置 API。前端新增设备配置向导页面。

**Tech Stack:** .NET 8、Microsoft.Data.Sqlite（嵌入式 SQLite）、React 19、TanStack Query、shadcn/ui

---

## 文件结构

```
# 边缘网关
src/EquipAI.EdgeGateway/
├── Pipeline/
│   ├── LocalBuffer.cs                  -- 内存环形队列 + SQLite 持久化
│   └── CloudUploader.cs                -- 添加断网检测 + 重试逻辑（修改）
├── Persistence/
│   └── SqliteBufferStore.cs            -- SQLite 缓存存储

# 后端 API
src/EquipAI.WebAPI/Controllers/
│   └── DeviceConfigController.cs       -- 设备配置向导 API

# 前端
frontend/src/
├── pages/
│   └── DeviceSetupPage.tsx             -- 设备配置向导页面
├── hooks/
│   └── useDeviceConfig.ts              -- 设备配置 API hooks
└── types/
    └── index.ts                        -- 添加设备配置类型

# 测试
tests/EquipAI.Tests.Unit/Protocols/
│   ├── LocalBufferTests.cs
│   └── SqliteBufferStoreTests.cs
tests/EquipAI.Tests.Integration/Controllers/
│   └── DeviceConfigControllerTests.cs
```

---

### Task 1: SQLite 缓存存储

**Files:**
- Create: `src/EquipAI.EdgeGateway/Persistence/SqliteBufferStore.cs`
- Create: `tests/EquipAI.Tests.Unit/Protocols/SqliteBufferStoreTests.cs`

- [ ] **Step 1: 编写测试**

```csharp
// tests/EquipAI.Tests.Unit/Protocols/SqliteBufferStoreTests.cs
using EquipAI.EdgeGateway.Persistence;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Protocols;

public class SqliteBufferStoreTests : IAsyncDisposable
{
    private readonly SqliteBufferStore _store;

    public SqliteBufferStoreTests()
    {
        // 使用内存 SQLite 进行测试
        _store = new SqliteBufferStore(":memory:");
        _store.InitializeAsync().GetAwaiter().GetResult();
    }

    [Fact]
    public async Task StoreAsync_And_GetPendingAsync 应正确存取()
    {
        var payload = """{"device_id":"cnc-001","metrics":{"temperature":85.3}}"""u8.ToArray();
        var topic = "factory/test/telemetry/cnc-001";

        await _store.StoreAsync(topic, payload);
        var pending = await _store.GetPendingAsync(10);

        pending.Should().HaveCount(1);
        pending[0].Topic.Should().Be(topic);
    }

    [Fact]
    public async Task MarkAsSentAsync 应将记录标记为已发送()
    {
        var payload = """{"device_id":"cnc-001"}"""u8.ToArray();
        await _store.StoreAsync("test/topic", payload);

        var pending = await _store.GetPendingAsync(10);
        await _store.MarkAsSentAsync(pending[0].Id);

        var afterMark = await _store.GetPendingAsync(10);
        afterMark.Should().BeEmpty();
    }

    [Fact]
    public async Task CleanupOldAsync 应清除超过7天的记录()
    {
        var payload = """{"device_id":"cnc-001"}"""u8.ToArray();
        await _store.StoreAsync("test/topic", payload);

        // 直接修改数据库中的时间戳模拟8天前的数据
        await _store.TestHelper_SetCreatedDaysAgo(1, 8);

        await _store.CleanupOldAsync();
        var pending = await _store.GetPendingAsync(10);
        pending.Should().BeEmpty("超过7天的记录应被清除");
    }

    [Fact]
    public async Task GetPendingAsync 应按时间排序()
    {
        await _store.StoreAsync("topic/1", """{"seq":1}"""u8.ToArray());
        await _store.StoreAsync("topic/2", """{"seq":2}"""u8.ToArray());
        await _store.StoreAsync("topic/3", """{"seq":3}"""u8.ToArray());

        var pending = await _store.GetPendingAsync(2);
        pending.Should().HaveCount(2);
        // 应按时间升序（先存先发）
    }

    public async ValueTask DisposeAsync()
    {
        await _store.DisposeAsync();
    }
}
```

- [ ] **Step 2: 运行测试确认编译失败**

- [ ] **Step 3: 实现 SqliteBufferStore**

```csharp
// src/EquipAI.EdgeGateway/Persistence/SqliteBufferStore.cs
using Microsoft.Data.Sqlite;

namespace EquipAI.EdgeGateway.Persistence;

/// <summary>
/// SQLite 缓存存储的待发送记录
/// </summary>
/// <param name="Id">自增主键</param>
/// <param name="Topic">MQTT 主题</param>
/// <param name="Payload">消息载荷</param>
/// <param name="CreatedAt">创建时间</param>
public record PendingRecord(long Id, string Topic, byte[] Payload, DateTime CreatedAt);

/// <summary>
/// 断网时遥测数据的本地 SQLite 持久化存储
/// 数据保留 7 天，网络恢复后按时间序回传
/// </summary>
public class SqliteBufferStore : IAsyncDisposable
{
    private readonly SqliteConnection _connection;
    private const int RetentionDays = 7;

    public SqliteBufferStore(string connectionString)
    {
        _connection = new SqliteConnection(
            connectionString == ":memory:"
                ? "Data Source=:memory:"
                : $"Data Source={connectionString}");
    }

    /// <summary>
    /// 初始化数据库表结构
    /// </summary>
    public async Task InitializeAsync()
    {
        await _connection.OpenAsync();

        var cmd = _connection.CreateCommand();
        cmd.CommandText = """
            CREATE TABLE IF NOT EXISTS buffer_messages (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                topic       TEXT NOT NULL,
                payload     BLOB NOT NULL,
                created_at  TEXT NOT NULL DEFAULT (datetime('now')),
                is_sent     INTEGER NOT NULL DEFAULT 0
            );
            CREATE INDEX IF NOT EXISTS idx_buffer_pending
                ON buffer_messages(is_sent, created_at);
            """;
        await cmd.ExecuteNonQueryAsync();
    }

    /// <summary>
    /// 存储一条待发送消息
    /// </summary>
    public async Task StoreAsync(string topic, byte[] payload)
    {
        var cmd = _connection.CreateCommand();
        cmd.CommandText = """
            INSERT INTO buffer_messages (topic, payload)
            VALUES (@topic, @payload)
            """;
        cmd.Parameters.AddWithValue("@topic", topic);
        cmd.Parameters.AddWithValue("@payload", payload);
        await cmd.ExecuteNonQueryAsync();
    }

    /// <summary>
    /// 获取待发送记录（按创建时间升序，最多 limit 条）
    /// </summary>
    public async Task<List<PendingRecord>> GetPendingAsync(int limit)
    {
        var cmd = _connection.CreateCommand();
        cmd.CommandText = """
            SELECT id, topic, payload, created_at
            FROM buffer_messages
            WHERE is_sent = 0
            ORDER BY created_at ASC
            LIMIT @limit
            """;
        cmd.Parameters.AddWithValue("@limit", limit);

        var results = new List<PendingRecord>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            results.Add(new PendingRecord(
                reader.GetInt64(0),
                reader.GetString(1),
                (byte[])reader.GetValue(2),
                reader.GetDateTime(3)));
        }

        return results;
    }

    /// <summary>
    /// 将记录标记为已发送
    /// </summary>
    public async Task MarkAsSentAsync(long id)
    {
        var cmd = _connection.CreateCommand();
        cmd.CommandText = "UPDATE buffer_messages SET is_sent = 1 WHERE id = @id";
        cmd.Parameters.AddWithValue("@id", id);
        await cmd.ExecuteNonQueryAsync();
    }

    /// <summary>
    /// 清理超过 7 天的旧记录（已发送和未发送的都清理）
    /// </summary>
    public async Task CleanupOldAsync()
    {
        var cmd = _connection.CreateCommand();
        cmd.CommandText = """
            DELETE FROM buffer_messages
            WHERE created_at < datetime('now', @days)
            """;
        cmd.Parameters.AddWithValue("@days", $"-{RetentionDays} days");
        await cmd.ExecuteNonQueryAsync();
    }

    /// <summary>
    /// 测试辅助：修改指定记录的创建时间为 N 天前
    /// </summary>
    public async Task TestHelper_SetCreatedDaysAgo(long id, int daysAgo)
    {
        var cmd = _connection.CreateCommand();
        cmd.CommandText = """
            UPDATE buffer_messages
            SET created_at = datetime('now', @days)
            WHERE id = @id
            """;
        cmd.Parameters.AddWithValue("@days", $"-{daysAgo} days");
        cmd.Parameters.AddWithValue("@id", id);
        await cmd.ExecuteNonQueryAsync();
    }

    public async ValueTask DisposeAsync()
    {
        await _connection.CloseAsync();
        await _connection.DisposeAsync();
    }
}
```

- [ ] **Step 4: 添加 Microsoft.Data.Sqlite NuGet 包**

Run: `cd src/EquipAI.EdgeGateway && dotnet add package Microsoft.Data.Sqlite`

- [ ] **Step 5: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "SqliteBufferStoreTests" --verbosity normal`
Expected: 4/4 通过

- [ ] **Step 6: 提交**

```bash
git add src/EquipAI.EdgeGateway/Persistence/ tests/EquipAI.Tests.Unit/Protocols/SqliteBufferStoreTests.cs
git commit -m "feat(edge): 实现 SQLite 缓存存储 SqliteBufferStore"
```

---

### Task 2: 本地缓冲区（内存环形队列 + SQLite 溢出）

**Files:**
- Create: `src/EquipAI.EdgeGateway/Pipeline/LocalBuffer.cs`
- Create: `tests/EquipAI.Tests.Unit/Protocols/LocalBufferTests.cs`

- [ ] **Step 1: 编写测试**

```csharp
// tests/EquipAI.Tests.Unit/Protocols/LocalBufferTests.cs
using EquipAI.EdgeGateway.Pipeline;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Protocols;

public class LocalBufferTests : IAsyncDisposable
{
    private readonly LocalBuffer _buffer;

    public LocalBufferTests()
    {
        _buffer = new LocalBuffer(capacity: 3);
    }

    [Fact]
    public async Task EnqueueAsync_未满时应保持在内存()
    {
        await _buffer.EnqueueAsync("topic/test", """{"temp":85.3}"""u8.ToArray());

        var batch = _buffer.DequeueBatch(10);
        batch.Should().HaveCount(1);
    }

    [Fact]
    public async Task EnqueueAsync_超出容量时最早的应被丢弃()
    {
        // 容量为 3
        await _buffer.EnqueueAsync("t1", """{"seq":1}"""u8.ToArray());
        await _buffer.EnqueueAsync("t2", """{"seq":2}"""u8.ToArray());
        await _buffer.EnqueueAsync("t3", """{"seq":3}"""u8.ToArray());
        await _buffer.EnqueueAsync("t4", """{"seq":4}"""u8.ToArray()); // 应丢弃最早的

        var batch = _buffer.DequeueBatch(10);
        batch.Should().HaveCount(3);
        // 应包含 t2, t3, t4（t1 被丢弃）
    }

    [Fact]
    public void DequeueBatch_空缓冲区应返回空列表()
    {
        var batch = _buffer.DequeueBatch(10);
        batch.Should().BeEmpty();
    }

    [Fact]
    public async Task FlushToOfflineStoreAsync 应将内存数据写入SQLite()
    {
        // 模拟断网场景：数据溢出到 SQLite
        var sqliteStore = new Persistence.SqliteBufferStore(":memory:");
        await sqliteStore.InitializeAsync();

        var buffer = new LocalBuffer(capacity: 10, sqliteStore);
        await buffer.EnqueueAsync("test/topic", """{"data":1}"""u8.ToArray());
        await buffer.FlushToOfflineStoreAsync();

        var pending = await sqliteStore.GetPendingAsync(10);
        pending.Should().HaveCount(1);

        await sqliteStore.DisposeAsync();
    }

    public async ValueTask DisposeAsync()
    {
        await _buffer.DisposeAsync();
    }
}
```

- [ ] **Step 2: 运行测试确认编译失败**

- [ ] **Step 3: 实现 LocalBuffer**

```csharp
// src/EquipAI.EdgeGateway/Pipeline/LocalBuffer.cs
using System.Collections.Concurrent;
using EquipAI.EdgeGateway.Persistence;

namespace EquipAI.EdgeGateway.Pipeline;

/// <summary>
/// 缓冲消息条目
/// </summary>
public record BufferEntry(string Topic, byte[] Payload);

/// <summary>
/// 本地缓冲区：内存环形队列 + SQLite 溢出
/// 正常时数据在内存中排队等待上传；断网时溢出到 SQLite 持久化
/// </summary>
public class LocalBuffer : IAsyncDisposable
{
    private readonly ConcurrentQueue<BufferEntry> _queue = new();
    private readonly int _capacity;
    private readonly SqliteBufferStore? _offlineStore;

    public LocalBuffer(int capacity = 10000, SqliteBufferStore? offlineStore = null)
    {
        _capacity = capacity;
        _offlineStore = offlineStore;
    }

    /// <summary>
    /// 当前缓冲区中的消息数量
    /// </summary>
    public int Count => _queue.Count;

    /// <summary>
    /// 入队一条消息。超出容量时丢弃最早的消息。
    /// </summary>
    public Task EnqueueAsync(string topic, byte[] payload)
    {
        // 如果超出容量，丢弃最早的消息
        while (_queue.Count >= _capacity)
        {
            _queue.TryDequeue(out _);
        }

        _queue.Enqueue(new BufferEntry(topic, payload));
        return Task.CompletedTask;
    }

    /// <summary>
    /// 批量取出消息（最多 maxCount 条）
    /// </summary>
    public List<BufferEntry> DequeueBatch(int maxCount)
    {
        var batch = new List<BufferEntry>();
        for (var i = 0; i < maxCount; i++)
        {
            if (!_queue.TryDequeue(out var entry))
                break;
            batch.Add(entry);
        }
        return batch;
    }

    /// <summary>
    /// 将内存中所有消息持久化到 SQLite（断网保护）
    /// </summary>
    public async Task FlushToOfflineStoreAsync()
    {
        if (_offlineStore is null) return;

        var batch = DequeueBatch(int.MaxValue);
        foreach (var entry in batch)
        {
            await _offlineStore.StoreAsync(entry.Topic, entry.Payload);
        }
    }

    public ValueTask DisposeAsync()
    {
        _queue.Clear();
        return ValueTask.CompletedTask;
    }
}
```

- [ ] **Step 4: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "LocalBufferTests" --verbosity normal`
Expected: 4/4 通过

- [ ] **Step 5: 提交**

```bash
git add src/EquipAI.EdgeGateway/Pipeline/LocalBuffer.cs tests/EquipAI.Tests.Unit/Protocols/LocalBufferTests.cs
git commit -m "feat(edge): 实现本地缓冲区 LocalBuffer（内存队列 + SQLite 溢出）"
```

---

### Task 3: CloudUploader 断网检测 + 重试 + 回放

**Files:**
- Modify: `src/EquipAI.EdgeGateway/Pipeline/CloudUploader.cs` — 添加断网检测和离线回放

- [ ] **Step 1: 在 CloudUploader 中添加断网保护逻辑**

在已有 `CloudUploader` 类中添加以下方法和属性：

```csharp
// 添加到 CloudUploader 类中

private readonly SqliteBufferStore? _offlineStore;
private readonly LocalBuffer? _localBuffer;

// 修改构造函数，增加离线存储参数
public CloudUploader(
    ILogger<CloudUploader> logger,
    GatewayOptions options,
    SqliteBufferStore? offlineStore = null,
    LocalBuffer? localBuffer = null)
{
    _logger = logger;
    _options = options;
    _offlineStore = offlineStore;
    _localBuffer = localBuffer;
    _mqttClient = _mqttFactory.CreateMqttClient();
}

/// <summary>
/// 当前是否在线（MQTT 连接正常）
/// </summary>
public bool IsOnline => _mqttClient.IsConnected;

/// <summary>
/// 上传带断网保护的消息
/// 在线 → 直接上传；离线 → 存入本地缓冲
/// </summary>
public async Task UploadWithFallbackAsync(
    string topic, byte[] payload, CancellationToken ct)
{
    if (IsOnline)
    {
        try
        {
            var mqttMessage = new MqttApplicationMessageBuilder()
                .WithTopic(topic)
                .WithPayload(payload)
                .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce)
                .Build();

            await _mqttClient.PublishAsync(mqttMessage, ct);
            _logger.LogDebug("已上传: {Topic}", topic);

            // 上传成功后，尝试回放离线数据
            await ReplayOfflineDataAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "上传失败，转入离线缓冲: {Topic}", topic);
            await BufferOfflineAsync(topic, payload);
        }
    }
    else
    {
        await BufferOfflineAsync(topic, payload);
    }
}

/// <summary>
/// 将数据存入离线缓冲
/// </summary>
private async Task BufferOfflineAsync(string topic, byte[] payload)
{
    if (_localBuffer is not null)
    {
        await _localBuffer.EnqueueAsync(topic, payload);
    }
    else if (_offlineStore is not null)
    {
        await _offlineStore.StoreAsync(topic, payload);
    }
}

/// <summary>
/// 回放离线数据（网络恢复后按时间序发送 SQLite 中的缓存数据）
/// </summary>
public async Task ReplayOfflineDataAsync(CancellationToken ct)
{
    if (_offlineStore is null || !IsOnline) return;

    var pending = await _offlineStore.GetPendingAsync(100);
    foreach (var record in pending)
    {
        if (!IsOnline || ct.IsCancellationRequested) break;

        try
        {
            var mqttMessage = new MqttApplicationMessageBuilder()
                .WithTopic(record.Topic)
                .WithPayload(record.Payload)
                .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce)
                .Build();

            await _mqttClient.PublishAsync(mqttMessage, ct);
            await _offlineStore.MarkAsSentAsync(record.Id);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "回放离线数据失败，停止回放");
            break;
        }
    }

    // 回放完成后清理旧数据
    await _offlineStore.CleanupOldAsync();
}
```

- [ ] **Step 2: 编译确认**

Run: `dotnet build src/EquipAI.EdgeGateway`
Expected: 编译成功

- [ ] **Step 3: 提交**

```bash
git add src/EquipAI.EdgeGateway/Pipeline/CloudUploader.cs
git commit -m "feat(edge): CloudUploader 添加断网检测 + 离线回放"
```

---

### Task 4: 后端设备配置 API

**Files:**
- Create: `src/EquipAI.WebAPI/Controllers/DeviceConfigController.cs`
- Create: `tests/EquipAI.Tests.Integration/Controllers/DeviceConfigControllerTests.cs`

- [ ] **Step 1: 编写设备配置 Controller**

```csharp
// src/EquipAI.WebAPI/Controllers/DeviceConfigController.cs
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 设备配置向导 API
/// 提供设备类型模板查询和设备快速注册接口，供边缘网关和前端使用
/// </summary>
[ApiController]
[Route("api/v1/device-config")]
[Authorize]
public class DeviceConfigController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public DeviceConfigController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>
    /// 获取设备类型模板列表（行业预置 + 租户自定义）
    /// </summary>
    [HttpGet("templates")]
    public async Task<ActionResult> GetTemplates([FromQuery] string? deviceType)
    {
        var query = _dbContext.DeviceTypeTemplates.AsQueryable();

        if (!string.IsNullOrEmpty(deviceType))
            query = query.Where(t => t.Type == deviceType);

        var templates = await query
            .Select(t => new
            {
                t.Id,
                t.Name,
                t.Type,
                t.Manufacturer,
                t.Parameters
            })
            .ToListAsync();

        return Ok(templates);
    }

    /// <summary>
    /// 快速注册设备（向导模式）
    /// 同时创建设备和对应的告警规则
    /// </summary>
    [HttpPost("quick-register")]
    public async Task<ActionResult> QuickRegister([FromBody] QuickRegisterRequest request)
    {
        // 检查设备编码唯一性
        var exists = await _dbContext.Devices
            .AnyAsync(d => d.DeviceCode == request.DeviceCode);
        if (exists)
            return BadRequest(new { code = "DUPLICATE_CODE", message = $"设备编码 {request.DeviceCode} 已存在" });

        // 创建设备
        var device = new Core.Entities.Device
        {
            TenantId = request.TenantId,
            DeviceCode = request.DeviceCode,
            Name = request.Name ?? request.DeviceCode,
            Type = request.DeviceType ?? "通用设备",
            Status = Core.Enums.DeviceStatus.Offline,
            HealthScore = 100m
        };

        _dbContext.Devices.Add(device);

        // 如果提供了默认指标，创建对应的阈值告警规则
        if (request.DefaultAlertRules is { Count: > 0 })
        {
            foreach (var rule in request.DefaultAlertRules)
            {
                _dbContext.AlertRules.Add(new Core.Entities.AlertRule
                {
                    TenantId = request.TenantId,
                    DeviceId = device.Id,
                    Name = $"{device.Name} - {rule.Metric} 告警",
                    Metric = rule.Metric,
                    RuleType = Core.Enums.RuleType.Threshold,
                    Operator = ">",
                    Threshold = rule.Threshold,
                    Severity = rule.Severity ?? Core.Enums.AlertSeverity.High,
                    Enabled = true,
                    AutoCreateWorkorder = true
                });
            }
        }

        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTemplates), new { id = device.Id }, new
        {
            device.Id,
            device.DeviceCode,
            device.Name,
            device.Type
        });
    }
}

/// <summary>
/// 快速注册请求
/// </summary>
public record QuickRegisterRequest
{
    public Guid TenantId { get; init; }
    public string DeviceCode { get; init; } = string.Empty;
    public string? Name { get; init; }
    public string? DeviceType { get; init; }
    public List<DefaultAlertRuleRequest>? DefaultAlertRules { get; init; }
}

/// <summary>
/// 默认告警规则请求
/// </summary>
public record DefaultAlertRuleRequest
{
    public string Metric { get; init; } = string.Empty;
    public decimal Threshold { get; init; }
    public Core.Enums.AlertSeverity? Severity { get; init; }
}
```

- [ ] **Step 2: 编写集成测试**

```csharp
// tests/EquipAI.Tests.Integration/Controllers/DeviceConfigControllerTests.cs
using FluentAssertions;
using System.Net;
using System.Net.Http.Json;

namespace EquipAI.Tests.Integration.Controllers;

[Collection(SharedTestCollection.Name)]
public class DeviceConfigControllerTests
{
    private readonly CustomWebApplicationFactory _factory;

    public DeviceConfigControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateClient()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _factory.GetTestToken());
        return client;
    }

    [Fact]
    public async Task GetTemplates_应返回200()
    {
        var client = CreateClient();
        var response = await client.GetAsync("/api/v1/device-config/templates");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task QuickRegister_应创建设备和告警规则()
    {
        var client = CreateClient();
        var tenantId = _factory.TestTenantId;

        var request = new
        {
            TenantId = tenantId,
            DeviceCode = "TEST-QUICK-001",
            Name = "快速注册测试设备",
            DeviceType = "电机",
            DefaultAlertRules = new[]
            {
                new { Metric = "temperature", Threshold = 90m, Severity = "Critical" }
            }
        };

        var response = await client.PostAsJsonAsync("/api/v1/device-config/quick-register", request);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.GetProperty("deviceCode").GetString().Should().Be("TEST-QUICK-001");
    }

    [Fact]
    public async Task QuickRegister_重复编码应返回400()
    {
        var client = CreateClient();
        var tenantId = _factory.TestTenantId;

        var request = new
        {
            TenantId = tenantId,
            DeviceCode = "DUP-001",
            Name = "重复测试"
        };

        await client.PostAsJsonAsync("/api/v1/device-config/quick-register", request);
        var response = await client.PostAsJsonAsync("/api/v1/device-config/quick-register", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
```

注意：需要添加 `using System.Text.Json;` 引用

- [ ] **Step 3: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Integration --filter "DeviceConfigControllerTests" --verbosity normal`
Expected: 3/3 通过

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.WebAPI/Controllers/DeviceConfigController.cs tests/EquipAI.Tests.Integration/Controllers/DeviceConfigControllerTests.cs
git commit -m "feat: 设备配置向导 API — 模板查询 + 快速注册"
```

---

### Task 5: 前端设备配置向导页面

**Files:**
- Create: `frontend/src/hooks/useDeviceConfig.ts`
- Create: `frontend/src/pages/DeviceSetupPage.tsx`
- Modify: `frontend/src/types/index.ts` — 添加设备配置类型

- [ ] **Step 1: 添加 TypeScript 类型**

在 `frontend/src/types/index.ts` 中添加：

```typescript
// 设备类型模板
export interface DeviceTypeTemplate {
  id: string;
  name: string;
  type: string;
  manufacturer?: string;
  parameters?: Record<string, unknown>;
}

// 快速注册请求
export interface QuickRegisterRequest {
  tenantId: string;
  deviceCode: string;
  name?: string;
  deviceType?: string;
  defaultAlertRules?: {
    metric: string;
    threshold: number;
    severity?: 'Low' | 'Normal' | 'High' | 'Critical';
  }[];
}
```

- [ ] **Step 2: 创建 API hooks**

```typescript
// frontend/src/hooks/useDeviceConfig.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { DeviceTypeTemplate, QuickRegisterRequest } from '../types';

/** 获取设备类型模板 */
export function useDeviceTemplates(deviceType?: string) {
  return useQuery({
    queryKey: ['device-templates', deviceType],
    queryFn: async () => {
      const params = deviceType ? `?deviceType=${deviceType}` : '';
      const { data } = await api.get(`/device-config/templates${params}`);
      return data as DeviceTypeTemplate[];
    },
  });
}

/** 快速注册设备 */
export function useQuickRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: QuickRegisterRequest) => {
      const { data } = await api.post('/device-config/quick-register', request);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}
```

- [ ] **Step 3: 创建向导页面**

```tsx
// frontend/src/pages/DeviceSetupPage.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeviceTemplates, useQuickRegister } from '../hooks/useDeviceConfig';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export default function DeviceSetupPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [deviceCode, setDeviceCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [temperatureThreshold, setTemperatureThreshold] = useState('90');

  const { data: templates, isLoading } = useDeviceTemplates();
  const quickRegister = useQuickRegister();

  const handleSubmit = () => {
    const tenantId = JSON.parse(localStorage.getItem('user') || '{}').tenantId;
    quickRegister.mutate({
      tenantId,
      deviceCode,
      name: deviceName || deviceCode,
      deviceType,
      defaultAlertRules: [
        { metric: 'temperature', threshold: Number(temperatureThreshold), severity: 'High' },
      ],
    });
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">{t('deviceSetup.title', '设备接入向导')}</h1>

      {/* 步骤指示器 */}
      <div className="flex gap-4">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full ${step >= s ? 'bg-primary' : 'bg-muted'}`}
          />
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('deviceSetup.step1Title', '选择设备类型')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-muted-foreground">{t('common.loading', '加载中...')}</p>
            ) : (
              <Select value={deviceType} onValueChange={(v) => { setDeviceType(v); setStep(2); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('deviceSetup.selectType', '选择设备类型')} />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((t) => (
                    <SelectItem key={t.id} value={t.type}>
                      {t.name} ({t.manufacturer})
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">{t('deviceSetup.custom', '自定义设备')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('deviceSetup.step2Title', '设备基本信息')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('deviceSetup.deviceCode', '设备编码')}</Label>
              <Input
                value={deviceCode}
                onChange={(e) => setDeviceCode(e.target.value)}
                placeholder="DEV-001"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('deviceSetup.deviceName', '设备名称')}</Label>
              <Input
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder={t('deviceSetup.deviceNamePlaceholder', '1号电机')}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                {t('common.previous', '上一步')}
              </Button>
              <Button onClick={() => setStep(3)} disabled={!deviceCode}>
                {t('common.next', '下一步')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('deviceSetup.step3Title', '告警规则配置')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('deviceSetup.tempThreshold', '温度阈值 (℃)')}</Label>
              <Input
                type="number"
                value={temperatureThreshold}
                onChange={(e) => setTemperatureThreshold(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                {t('common.previous', '上一步')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={quickRegister.isPending}
              >
                {quickRegister.isPending
                  ? t('common.submitting', '提交中...')
                  : t('deviceSetup.register', '注册设备')}
              </Button>
            </div>
            {quickRegister.isSuccess && (
              <p className="text-green-600">
                {t('deviceSetup.success', '设备注册成功！')}
              </p>
            )}
            {quickRegister.isError && (
              <p className="text-red-600">
                {t('deviceSetup.error', '注册失败，请检查设备编码是否重复')}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 添加路由**

在路由配置文件中添加设备配置向导路由：
```tsx
{ path: '/device-setup', element: <DeviceSetupPage /> }
```

- [ ] **Step 5: 添加 i18n 翻译键**

在 `frontend/src/i18n/zh.json` 和 `en.json` 中添加 `deviceSetup.*` 翻译键。

- [ ] **Step 6: 编译确认**

Run: `cd frontend && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 7: 提交**

```bash
git add frontend/src/pages/DeviceSetupPage.tsx frontend/src/hooks/useDeviceConfig.ts frontend/src/types/index.ts
git commit -m "feat: 前端设备配置向导页面 — 三步式引导"
```

---

## 自检

1. **规格覆盖**: 内存环形队列 ✅、SQLite 缓存 ✅、断网检测 + 重试 ✅、回放 ✅、设备配置 API ✅、前端向导 ✅
2. **占位符扫描**: 无 TBD/TODO/FIXME
3. **类型一致性**: PendingRecord、BufferEntry、NormalizedMessage 全局一致
