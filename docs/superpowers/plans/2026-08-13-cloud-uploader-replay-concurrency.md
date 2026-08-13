# 边缘网关离线回放并发安全实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: 使用 `superpowers:executing-plans` 逐项实施；每个行为先写失败测试，再写最小生产代码。本工作区不执行提交、暂存或推送。

**Goal:** 串行化单例 `CloudUploader` 的完整离线回放批次，避免多个设备采集器重复发布同一条积压遥测。

**Architecture:** `CloudUploader` 增加实例级异步回放闸门，保护 SQLite 读取、MQTT 发布、发送标记和清理的完整批次，并用取消令牌等待闸门。通过可选 MQTT 客户端工厂注入真实客户端替身，测试并发行为而不改变生产构造调用。

**Tech Stack:** .NET 8、C#、MQTTnet、SQLite、`SemaphoreSlim`、xUnit、Moq、FluentAssertions。

## Global Constraints

- 只修复单进程单例内的回放并发；不修改 SQLite Schema，不声称支持跨进程租约。
- 保持 MQTT QoS、批量大小 100、发送成功后标记和 7 天清理语义。
- 取消或发布失败不得把未发送记录标记为已发送。
- 新增字段、注释、日志和测试说明使用简体中文。
- 不修改真实 `docker/.env`，不新增第三方依赖，不执行提交、暂存或推送。

---

### Task 1: 编写可稳定复现回放重复发布的失败测试

**Files:**
- Modify: `tests/EquipAI.Tests.Unit/Pipeline/CloudUploaderTests.cs`

**Interfaces:**
- Consumes: `CloudUploader` 构造函数、`ReplayOfflineDataAsync(CancellationToken)`、`SqliteBufferStore`。
- Produces: 可控 `IMqttClient` 和并发回放回归测试。

- [x] **Step 1: 增加测试客户端替身和并发测试**

在测试文件中增加使用 `IMqttClient` 工厂的辅助创建方法，以及测试：先初始化 SQLite 并写入一条积压记录；第一次发布进入可控暂停；启动第二次回放并确认它在第一批完成前没有返回；释放第一次发布；最后断言发布次数为 1、待发送记录为 0。测试必须通过实际 `CloudUploader.ReplayOfflineDataAsync` 执行，不直接调用闸门或 SQLite 内部实现。

测试所需的关键行为：

```csharp
var firstReplay = uploader.ReplayOfflineDataAsync(CancellationToken.None);
await mqtt.FirstPublishStarted.Task.WaitAsync(TimeSpan.FromSeconds(5));
var secondReplay = uploader.ReplayOfflineDataAsync(CancellationToken.None);
await Task.Delay(50);
secondReplay.IsCompleted.Should().BeFalse();
mqtt.ReleasePublish();
await Task.WhenAll(firstReplay, secondReplay);

mqtt.PublishedTopics.Should().ContainSingle();
(await store.GetPendingAsync(10)).Should().BeEmpty();
```

- [x] **Step 2: 运行测试并确认 RED**

运行：

```bash
dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~CloudUploaderTests.并发回放同一批积压消息不得重复发布" --logger "console;verbosity=minimal"
```

预期旧实现失败：第二次回放会在第一条消息发布暂停期间读取同一条记录，最终发布计数为 2，或第二次回放不会等待。若测试因客户端替身接口实现错误而编译失败，先修正测试替身，不修改生产代码。

### Task 2: 为 CloudUploader 增加可注入客户端和回放闸门

**Files:**
- Modify: `src/EquipAI.EdgeGateway/Pipeline/CloudUploader.cs`

**Interfaces:**
- Consumes: `Func<IMqttClient>? mqttClientFactory` 可选构造参数。
- Produces: `ReplayOfflineDataAsync` 的批次互斥和取消等待；生产默认仍创建 MQTTnet 客户端。

- [x] **Step 1: 增加最小依赖注入和闸门**

新增字段：

```csharp
private readonly Func<IMqttClient> _mqttClientFactory;
private readonly SemaphoreSlim _replayGate = new(1, 1);
```

构造函数增加末尾可选参数 `Func<IMqttClient>? mqttClientFactory = null`，使用 `mqttClientFactory ?? (() => _mqttFactory.CreateMqttClient())`；`ConnectAsync` 改为调用工厂。`ReplayOfflineDataAsync` 使用：

```csharp
await _replayGate.WaitAsync(ct);
try
{
    ct.ThrowIfCancellationRequested();
    if (_offlineStore is null || !IsOnline) return;
    // 现有读取、发布、标记、清理逻辑保持在闸门内。
}
finally
{
    _replayGate.Release();
}
```

不要在闸门外读取 pending，也不要吞掉取消异常。

- [x] **Step 2: 运行并发测试确认 GREEN**

运行：

```bash
dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~CloudUploaderTests" --logger "console;verbosity=minimal"
```

预期并发回放和该类既有测试全部通过。

### Task 3: 补充取消、失败和运维边界回归

**Files:**
- Modify: `tests/EquipAI.Tests.Unit/Pipeline/CloudUploaderTests.cs`
- Modify: `docs/OPS_RUNBOOK.md`
- Modify: `docs/evaluation/S09-风险登记册.md`
- Modify: `docs/evaluation/04-边缘网关架构分析.md`

**Interfaces:**
- Consumes: 回放闸门行为和现有指标。
- Produces: 取消等待不会阻塞停机、发布失败保留记录、单进程边界文档。

- [x] **Step 1: 增加取消等待测试**

在第二次回放等待第一次回放时取消其令牌，断言第二次调用抛出 `OperationCanceledException`，第一次完成后 SQLite 记录状态仍由成功发布决定，且不会产生额外发布。

- [x] **Step 2: 增加发布失败保留测试**

让 MQTT 替身在发布时抛出异常，断言回放方法不向调用方抛出当前既有语义、记录仍在 pending，下一次回放可再次处理；不得把失败记录标记为已发送。

- [x] **Step 3: 更新运行手册和风险记录**

记录 `CloudUploader` 单例内回放批次串行化、`edgegateway_replay_messages_total` 监控和单进程边界；明确多进程共享 SQLite 仍需消息 claim/租约设计，不通过提高回放并发规避积压。

### Task 4: 分层验证与工作区审计

**Files:**
- No new source files;保留其它未提交用户改动。

- [x] **Step 1: 运行聚焦和全量验证**

```bash
dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~CloudUploaderTests|FullyQualifiedName~LocalBufferTests|FullyQualifiedName~SqliteBufferStoreTests|FullyQualifiedName~PipelineIntegrationTests" --logger "console;verbosity=minimal"
dotnet test tests/EquipAI.Tests.Unit --no-restore --logger "console;verbosity=minimal"
dotnet test tests/EquipAI.Tests.Integration --no-restore --logger "console;verbosity=minimal"
dotnet build EquipAI.sln -c Release --no-restore -m:1 -p:UseSharedCompilation=false
```

实际结果（2026-08-13）：边缘网关聚焦 46/46 通过；后端单元 1688/1688 通过；默认集成 193 总数（187 通过、6 跳过、0 失败）；Release 构建 0 warning/0 error。

- [x] **Step 2: 运行脚本门禁和差异检查**

```bash
bash -n docker/production-readiness.sh docker/deploy-production.sh tests/scripts/production-scripts-test.sh
bash tests/scripts/production-scripts-test.sh all
git -c core.fsmonitor=false diff --check
```

实际结果（2026-08-13）：生产脚本 Shell 语法、`production-scripts-test.sh all` 和差异检查全部通过。

- [x] **Step 3: 复核真实环境边界**

确认 `docker/.env` 未修改、没有临时锁/秘密文件遗留；只读执行 `bash docker/validate-env.sh docker/.env --check-runtime-files`，仍非零时保留外部发布阻断，不宣称项目全面生产就绪。

实际结果（2026-08-13）：`docker/.env` 未修改，未发现 `.env.lock`、`.env.tmp` 或 `.env.backup`；环境门禁仍以非零退出报告 27 项问题，因此本次代码修复不改变“当前部署环境禁止上线”的结论。
