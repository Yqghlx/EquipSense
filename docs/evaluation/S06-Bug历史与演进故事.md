# EquipSense Bug 历史分析与演进故事

> 来源：492 次 git commit + 10+ 处代码注释中的 Bug 回溯  
> 价值：了解项目"踩过的坑"，避免重复犯错，理解架构决策的 trade-off

---

## 一、统计数据

| 指标 | 数值 |
|------|------|
| fix/修复 commit 数 | ~120+ |
| 安全修复 | ~15 |
| 性能修复 | ~8 |
| 数据丢失修复 | ~6 |
| UX 修复 | ~10 |
| 测试补全 (test) | ~40+ |

---

## 二、重大 Bug 故事 (按严重程度排列)

### 🔴 P0: 告警的多渠道通知历史上从未真正工作过

**提交**: `59a3752` + `2755d2a`  
**发现时间**: 2026-06-14 (E2E 测试验证时发现)  
**影响面**: 从上线到 6/14 前，告警触发后的站内通知、钉钉卡片、飞书卡片**从未成功发送**

**根因一 — 租户过滤器吞噬**:
```csharp
// AlertEventHandler 中 FindAsync 被全局租户过滤器返回 null
// → 走不到后续的通知分发代码
// 后台事件处理器无 HttpContext → ITenantContext.TenantId = Guid.Empty
// → 全局过滤器 WHERE tenant_id = '00000000-...' → 查不到任何数据
```

**根因二 — JSON 大小写敏感**:
```csharp
// TryDeserialize 使用默认 JsonSerializer 区分大小写
// 配置中的 camelCase webhookUrl 反序列化为 null
// → WebhookUrl 空判断提前 return → 钉钉/飞书 HTTP 请求从未发出
```

**两 bug 叠加效果**: 
```
告警触发 → 处理器被过滤器吞掉(√) → 走到通知代码(×)
                                          ↓
                                 webhookUrl=null → 跳过 HTTP 调用
```

**修复**: 所有后台查询加 `IgnoreQueryFilters()` + 事件 TenantId 显式限定；反序列化改 `PropertyNameCaseInsensitive = true`

---

### 🔴 P0: 知识沉淀整体失效（Solution/PartsUsed 永远空）

**提交**: `117da6a` · `f4e3f79`  
**代码注释**: `WorkOrderService.cs` ComputeActualHours

```
死字段闭环:
  1. 完成工单时只设 StartedAt/CompletedAt
  2. 从不计算 ActualHours = CompletedAt - StartedAt
  3. 知识沉淀阈值 ActualHours < 0.5h → 恒跳过
  4. 所有工单被判定"时长不足"→ 知识库自学习整体停摆
  5. KnowledgeRule → FaultCase 链路永远为空
```

同时：
- `ExecutionReport` / `RequiredParts` 在 `CompleteAsync` / `SubmitAsync` 中写入了但未持久化 → 仍然是死字段
- `Solution` 字段永远降级为 `Resolution` 文本、`PartsUsed` 永远空

**修复**: `ComputeActualHours()` 在完成/提交时重算；`CompleteAsync`/`SubmitAsync` 持久化写入

---

### 🔴 P0: 后台租户过滤器系统性吞噬 (7 个 Bug 的同根因)

**涉及的 commit**:
```
cbfdce6 — 根因分析基线查询被吞
b439763 — 知识沉淀/规则准确率被吞
5c516f3 — L4 ML 异常检测被吞
1926b32 — 数据质量评分被吞
ec29514 — DeviceStatusMonitor 设备永不离线
30c2c5a — 设备健康度不更新
e6d217c — SLA 升级查询被吞
```

**根因**: `BackgroundService` 运行在独立的 DI Scope 中，无 HTTP 请求上下文。`ITenantContext` 回退到 `Guid.Empty`。全局租户过滤器 `WHERE tenant_id = @current` 恒为 `tenant_id = '00000000-...'`，所有查询返回空。

**模式**: 每个后台服务必须手动 `IgnoreQueryFilters()` + 显式 `Where(e.TenantId == eventTenantId)`。

**影响**: 
- L4 ML 异常检测永不触发（遥测查询返回空 → 样本数=0）
- 设备状态永不离线（超时扫描返回 0 行）
- 知识沉淀整体失效（工单查不到）
- SLA 升级不执行（逾期工单查不到）

**修复**: 逐文件排查后台查询，补齐 `IgnoreQueryFilters()`。统一模式后约 100 处使用。

---

### 🟠 P1: 同指标多规则互相吞并 — 严重告警被静默漏报

**提交**: `3d70975`  
**代码注释**: `AlertAggregator.Evaluate()` 的窗口键设计

```
问题: 告警聚合器窗口键 = {deviceId}:{metric}
      同设备"温度"有 2 条规则: RuleA(阈值=80, Normal), RuleB(阈值=100, Critical)
      RuleA 先触发(计数=1) → RuleB 触发(计数=2, 命中"更新"分支)
      → RuleB 的 Critical 告警被 RuleA 的 Normal 告警吞并
      → 用户只看到 Normal 告警，Critical 级别的严重问题被静默

修复: 窗口键改为 {deviceId}:{ruleId}:{metric}
      → 每条规则独立计数，不互相干扰
```

---

### 🟠 P1: 自动恢复后震荡指标不再告警

**提交**: `218d781`  
**代码注释**: `AlertEvaluationService.cs` 的 shouldUpdate 降级

```
时序:
  1. 温度 90° → 越限 → 创建告警 (窗口计数=1)
  2. 温度 82° → 回落 → TryAutoResolve (Active→Resolved)
  3. 温度 92° → 再次越限 → 聚合器计数=2 → shouldUpdate=true
  4. shouldUpdate 找 Active 告警 → 找不到(已被 Resolve) → 跳过
  5. 用户看到"已恢复"通知 → 以为问题解决 → 实际复发却无通知

修复: shouldUpdate 但无 Active 告警可更新 → 降级为创建新告警
      仍受防风暴约束(窗口内至多 3 次)，不会因震荡产生告警风暴
```

---

### 🟠 P1: 同源策略 — SignalR 推送失败拖垮全部通知渠道

**提交**: `4a6ceec`  
**代码注释**: `SignalRNotificationService.cs`

```csharp
// 问题: SignalR 推送失败抛异常 → 整个方法提前退出
// → 站内通知写入、Web Push、钉钉/飞书全部跳过
// → 单点故障级联到全链路

// 修复: 每路通知用独立 try/catch 隔离
try { await _hubContext.Clients.Group(...).SendAsync(...); }
catch { _logger.LogWarning("SignalR 推送失败"); }

// 站内通知持久化
try { _db.Notifications.Add(...); await _db.SaveChangesAsync(); }
catch { _logger.LogWarning("通知持久化失败"); }

// Web Push
try { await _pushService.SendAsync(...); }
catch { _logger.LogWarning("Web Push 失败"); }
```

---

### 🟠 P1: useSignalR 重连后事件 N+1 次触发

**提交**: `15592ea`  
**代码注释**: `useSignalR.ts`

```
问题: onreconnected 回调中重新注册 handlers
      @microsoft/signalr 的 .on() 用 indexOf 按函数引用去重
      新闭包引用不同 → 去重失效 → 每个事件 handler 累积
      重连 N 次后每个事件触发 N+1 次
      → 重复弹告警通知、重复 invalidate → N+1 倍 API 请求
      → 工业网络抖动加剧效应

修复: registerHandlers 只在首次连接时调用一次
      单例 HubConnection 重连后 _methods 保留
      不要在 onreconnected 重新注册
```

---

### 🟠 P1: Refresh Token 正反向索引不一致

**提交**: `a0a061a`  
**设计**: `RedisService.cs` 正向 + 反向索引 + 墓碑

```
OAuth 2.0 BCP 实现:
  正向: refresh:{userId} → refreshTokenString
  反向: refresh_token:{token} → userId (或 "revoked:{userId}" 墓碑)

轮换时:
  1. 读正向索引 → 取旧 token
  2. 旧 token 反向索引改为 "revoked:{userId}" (7 天 TTL)
  3. 新 token → 写入正向 + 新反向

重放检测:
  若"revoked"标记的 oldToken 再次出现 → 检测为重放
  → 吊销整个用户会话 (清除正向索引)
  → 记审计告警 "AuthRefreshTokenReused"
```

---

### 🟡 P2: 导入导出不对称（两轮）

**第一轮** (`995721b`):
```
问题: Location 非法 JSON 导致整批回滚 + CSV 导出公式注入
修复: 导入跳过非法 Location + CSV 输出清空公式前缀
```

**第二轮** (`ea6b450`, `8981445`, `f016716`):
```
问题: 设备导出缺 location/gateway_id/install_date/downtime_cost_per_hour
      工单/告警导出缺多个业务字段
      工单按状态/优先级过滤导出抛翻译异常
修复: 补全导出字段对齐导入结构 + 修复 LINQ 翻译
```

---

### 🟡 P2: 工单编码冲突 + 幽灵工单事件

**提交**: `f879e69`

```
问题: 自动建单并发编码冲突 → 异常走 catch → 但事件已发布
      前端收到 WorkOrderCreatedEvent → 但工单实际未创建(DB 回滚)
      → 页面上出现"幽灵工单"

修复: 编码生成失败时不得发布事件
      事件发布移到 SaveChanges 成功后
```

---

### 🟡 P2: 驳回返工后重新提交不清理旧审批记录

**提交**: `076c3f4`

```
问题: 工单 SubmittedForApproval → 审批驳回 → InProgress
      再次提交 → 旧审批记录还在 → 第 2 次审批异常
      工单永久卡在"待审批"状态 → 无法关闭

修复: 重新提交时清理旧的审批记录
```

---

### 🟡 P2: 付费订阅到期锁死客户

**提交**: `3041704`

```
问题: 试用到期 → 系统误设 Status=Expired
      → 客户无法登录 → 也无法付费续期 → 死锁
修复: 到期降级为 Trial 而非 Expired
      客户仍可登录并完成付费流程
```

---

### 🟡 P2: 设备快速注册跨租户注入

**提交**: `70d43e3`

```
问题: 设备快速注册端点未校验 JWT 租户 → 
      攻击者可传入任意 tenantId → 注册到他人租户
      同时 CurrentDeviceCount 不递增 → 配额漂移

修复: 用 JWT 中的 tenant_id 而非请求体参数
      维护配额计数防漂移
```

---

### 🟡 P2: EdgeGateway LocalBuffer 溢出丢数据

**提交**: `07fe6af`  
**代码注释**: `LocalBuffer.cs`

```
问题: 内存环形队列 10000 条满 → TryDequeue 直接丢弃
      被丢弃的数据如果是故障前征兆 → 永久丢失

修复: 被驱逐的消息先 try 存储到 SQLite
      SQLite 不可用时才丢弃(并记指标 edgegateway_buffer_dropped_total)
```

---

## 三、Bug 模式分类

| 模式 | 出现次数 | 典型根因 | 预防措施 |
|------|---------|---------|---------|
| **后台租户过滤器** | 7 次 | ITenantContext=Guid.Empty | 创建 TenantAwareService 抽象基类 |
| **枚举序列化不一致** | 5 次 | LINQ 无法翻译 ToString() | 先查内存再分组 |
| **异步边界** | 3 次 | ApplicationStopping 不支持 async | 用 Wait(5s) 超时保护 |
| **JSON 大小写** | 3 次 | 默认 JsonSerializer 区分大小写 | 统一用 camelCase 配置 |
| **并发安全** | 4 次 | 工单编码、配额计数、事件发布时序 | 事务 + 锁 |
| **导入导出不对称** | 2 轮 | 导出遗漏业务字段 | 自动化 DTO 对称性测试 |
| **内存状态重启丢失** | 2 次 | AlertAggregator 进程内 | DB 兜底去重 |
| **SignalR 同源** | 2 次 | 多路推送共用 try | 独立 try/catch 隔离 |

---

## 四、从 Bug 历史看演进

```
5/31  初始构建 (核心功能)
6/01-02  快速迭代 (14 次迁移 3 天完成)
6/03  安全加固 (JWT/令牌/首次改密) 
6/05-06  聚合同知/多租户隔离完善
6/14  安全审计 (审计日志全覆盖 + MFA)
6/20  可观测性 (OTel/Metrics/Jaeger)
6/22  性能索引 (复合索引全表扫描优化)
6/23  安全纵深 (令牌重用检测/WAF/限流/CSP)
6/24  修复冲刺 (12 个 P0/P1 Bug 同一天修复)
```

最后两天（6/23-6/24）是密集修复期，说明项目在**快速上线后发现并修复了大量积压问题**，之后进入稳定阶段。

---
*本文档属于 EquipSense 项目评估体系 · 生成日期：2026-06-24 · 版本：v3.1*
