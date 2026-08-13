# 边缘网关断网缓冲并发安全实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: 使用 `superpowers:executing-plans` 逐项实施。每个实现步骤先写失败测试，再写最小生产代码；本工作区不执行提交、暂存或推送。

**Goal:** 修复边缘网关有界内存缓冲和共享 SQLite 连接的并发安全问题，避免断网高并发时队列超容、连接异常和遥测丢失。

**Architecture:** `LocalBuffer` 使用短生命周期对象锁原子完成队列容量控制，锁外执行离线持久化；`SqliteBufferStore` 使用单一 `SemaphoreSlim` 串行化共享连接的全部操作和释放。公开构造函数、方法签名、SQLite schema 和 MQTT 行为保持不变。

**Tech Stack:** .NET 8、C#、`ConcurrentQueue`、`SemaphoreSlim`、Microsoft.Data.Sqlite、xUnit、FluentAssertions。

## Global Constraints

- 新增字段、方法、日志和测试说明使用简体中文。
- `LocalBuffer` 的内存队列在任何并发入队/出队下不得超过构造时的正容量。
- 不在队列锁内等待 SQLite，不把敏感载荷写入日志。
- SQLite 共享连接的初始化、命令执行、reader 物化和释放必须串行化。
- 保持现有断网、回放、7 天清理、QoS 和错误计数语义。
- 不修改真实生产配置，不新增第三方依赖，不执行提交、暂存或推送。

---

### Task 1: 为并发边界编写失败测试

**Files:**
- Modify: `tests/EquipAI.Tests.Unit/Protocols/LocalBufferTests.cs`
- Modify: `tests/EquipAI.Tests.Unit/Protocols/SqliteBufferStoreTests.cs`

**Interfaces:**
- `LocalBuffer(capacity: int, offlineStore: SqliteBufferStore?, metrics: GatewayMetrics?)`
- `SqliteBufferStore.StoreAsync(string topic, byte[] payload)`

- [x] **Step 1: 增加非法容量和并发队列测试**

在 `LocalBufferTests` 中增加：

```csharp
[Theory]
[InlineData(0)]
[InlineData(-1)]
public void 构造时容量必须为正数(int capacity)
{
    var act = () => new LocalBuffer(capacity);
    act.Should().Throw<ArgumentOutOfRangeException>();
}

[Fact]
public async Task 并发入队时队列深度不得超过容量()
{
    const int capacity = 4;
    var buffer = new LocalBuffer(capacity);
    var tasks = Enumerable.Range(0, 400)
        .Select(index => Task.Run(() => buffer.EnqueueAsync($"topic/{index}", [(byte)(index % 255)])))
        .ToArray();

    await Task.WhenAll(tasks);

    buffer.Count.Should().Be(capacity);
    buffer.DequeueBatch(100).Should().HaveCount(capacity);
    await buffer.DisposeAsync();
}
```

该测试直接验证公开行为，不断言内部锁或队列类型；在修复前并发检查与入队之间存在窗口，
可能出现超过容量的结果。

- [x] **Step 2: 增加出队指标测试**

新增测试先入队两条、确认 gauge 为 2，出队一条后确认 gauge 为 1，全部出队后确认 gauge 为 0。
当前实现不会在 `DequeueBatch` 更新 gauge，因此该测试应先失败。

- [x] **Step 3: 增加共享 SQLite 并发写入测试并观察 RED**

在 `SqliteBufferStoreTests` 中初始化一个 `:memory:` store，使用 200 个并发 `StoreAsync` 调用，
等待全部完成后查询并断言 200 条待发送记录。运行：

```bash
dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~LocalBufferTests|FullyQualifiedName~SqliteBufferStoreTests"
```

预期新增断言至少因容量校验或 gauge 尚未实现而失败；如果 SQLite 并发测试偶发通过，仍保留它
作为回归契约，并以队列并发测试作为确定性 RED 信号。

### Task 2: 实现 LocalBuffer 的原子容量控制

**Files:**
- Modify: `src/EquipAI.EdgeGateway/Pipeline/LocalBuffer.cs`

- [x] **Step 1: 增加容量校验和队列锁**

新增 `_queueLock`，构造函数在赋值前检查 `capacity > 0`。入队流程在锁内完成驱逐和新消息入队，
将被驱逐项放入局部列表；锁外调用 `_offlineStore.StoreAsync`。不改变无存储时的丢弃计数。

- [x] **Step 2: 让出队和清空路径更新深度指标**

`DequeueBatch` 在锁内取出消息并调用 `SetGauge`；`FlushToOfflineStoreAsync` 复用批量出队，
`DisposeAsync` 清空后将 gauge 置零。保持 `Count` 为线程安全快照。

- [x] **Step 3: 运行 LocalBuffer 聚焦测试并修正非预期回归**

运行：

```bash
dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~LocalBufferTests|FullyQualifiedName~PipelineIntegrationTests"
```

预期新增并发、容量和指标测试通过，既有 FIFO、SQLite 溢出和磁盘故障计数测试继续通过。

### Task 3: 串行化 SqliteBufferStore 共享连接

**Files:**
- Modify: `src/EquipAI.EdgeGateway/Persistence/SqliteBufferStore.cs`
- Modify: `tests/EquipAI.Tests.Unit/Protocols/SqliteBufferStoreTests.cs`

- [x] **Step 1: 增加异步闸门和释放状态**

新增 `SemaphoreSlim _operationGate = new(1, 1)` 与 `_disposed` 状态。每个数据库方法均按
“检查释放 → `WaitAsync` → 二次检查 → 执行 → `Release`”模板包住连接/命令；`GetPendingAsync`
必须在释放闸门前完整读取结果。

- [x] **Step 2: 保持 InitializeAsync 幂等并安全释放命令**

`InitializeAsync` 在闸门内执行 `OpenAsync` 和 `CREATE TABLE IF NOT EXISTS`；重复调用不能打开
第二次连接。`DisposeAsync` 在闸门内标记释放、关闭连接并释放资源，避免后台回放使用已关闭连接。

- [x] **Step 3: 运行存储聚焦测试**

运行：

```bash
dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~SqliteBufferStoreTests"
```

确认存取、排序、标记、清理、重复初始化、并发写入和释放测试全部通过。

### Task 4: 补充风险与边缘运行文档

**Files:**
- Modify: `docs/LANDING_READINESS_REPORT.md`
- Modify: `docs/evaluation/S09-风险登记册.md`
- Modify: `docs/evaluation/13-技术债务与改进路线图.md`

- [x] **Step 1: 记录边缘缓冲并发修复**

新增 dated 增量说明：内存队列容量控制和 SQLite 连接串行化已由单测覆盖，但真实断网超过保留期、
磁盘耗尽、MQTT 恢复和 PLC/协议联调仍需部署侧验收；不得把单元测试等同于现场验收。

- [x] **Step 2: 增加可观测性和运行手册提示**

在网关运行说明中明确观察 `edgegateway_buffer_queue_depth`、`edgegateway_buffer_dropped_total`
和 `edgegateway_replay_messages_total`，当丢弃计数增长时优先检查磁盘、SQLite 文件权限和 MQTT
连接，不通过提高容量掩盖故障。

### Task 5: 分层验证与工作区审计

**Files:**
- No new source files;保留其它未提交用户改动。

- [x] **Step 1: 运行聚焦和全量后端验证**

```bash
dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~LocalBufferTests|FullyQualifiedName~SqliteBufferStoreTests|FullyQualifiedName~PipelineIntegrationTests"
dotnet test tests/EquipAI.Tests.Unit --no-restore
dotnet test tests/EquipAI.Tests.Integration --no-restore --logger "console;verbosity=minimal"
dotnet build EquipAI.sln -c Release --no-restore -m:1 -p:UseSharedCompilation=false
```

- [x] **Step 2: 运行脚本门禁与差异检查**

```bash
bash -n docker/bootstrap-production-secrets.sh docker/setup.sh tests/scripts/production-scripts-test.sh
bash tests/scripts/production-scripts-test.sh all
git -c core.fsmonitor=false diff --check
```

- [x] **Step 3: 复核真实环境边界**

确认没有修改真实 `docker/.env`、没有留下 `.env.lock`/临时文件；只读执行
`bash docker/validate-env.sh docker/.env --check-runtime-files`，仍非零时记录外部发布阻塞，
不宣称项目已生产就绪。

**实际验证结果（2026-08-13）：** 聚焦边缘网关测试 33/33 通过；后端单元测试 1685/1685
通过；默认后端集成测试 193 总数（187 通过、6 跳过、0 失败）；Release 构建 0 警告、0
错误；生产脚本测试通过；Shell 语法检查和 `git diff --check` 通过。真实 `docker/.env`
未修改，校验器仍报告 27 个发布配置/证书问题，因此部署侧门禁保持阻断。
