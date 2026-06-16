# 模拟器驱动的真实数据流验证报告

**验证日期**：2026-06-16
**触发点**：用户问"你为什么每次都有第二阶段真实接入呀？"，发现 CLAUDE.md 路线图严重过时
**关键洞察**：之前所有"功能验证"都在空数据下做，根本没测过完整业务闭环

---

## 1. 认知修正

### 1.1 CLAUDE.md 路线图过时

CLAUDE.md 里写的 Phase 1-4 路线图是项目初期规划，但代码早就走完了：

| Phase | 路线图声称 | 实际代码 |
|-------|-----------|---------|
| Phase 2 | OPC UA / Modbus 适配器 | ✅ `Protocols/{OpcUaAdapter,ModbusTcpAdapter,ModbusRtuAdapter}.cs` |
| Phase 2 | 边缘网关断网保护 | ✅ `Persistence/SqliteBufferStore.cs` + `Pipeline/{LocalBuffer,CloudUploader}.cs` |
| Phase 2 | 知识沉淀闭环 | ✅ `PendingRuleConfiguration` + `KnowledgeCaptureHandler` |
| Phase 3 | 钉钉/飞书集成 | ✅ `WorkOrders/Integration/{DingTalk,Feishu,Eam,Webhook}Integration.cs` |
| Phase 3 | PWA | ✅ `usePushNotifications` + `PushNotificationService` + VAPID |
| Phase 4 | ML.NET 异常检测 | ✅ `Analysis/MlAnomalyDetectionService.cs` |

**修复**：CLAUDE.md 路线图改为反映实际进度（v1.2.0 已发布、v1.3.0 进行中）。

---

## 2. 跑模拟器暴露的 5 个 P0 真实运行 Bug

### Bug 1: 设备状态永不更新（P0）

**症状**：模拟器持续发遥测，但所有设备 Status=Offline，Dashboard 在线设备=0、可用率=0、OEE=0。

**根因**：`TelemetryEventHandler.HandleAsync` 只触发告警评估，从不更新设备 Status。代码里搜遍整个 Application 层，**没有任何地方把设备从 Offline 改成 Online**。

**修复**：
- `Device` 实体加 `LastSeenAt` 字段 + DB 列 + 索引
- `TelemetryEventHandler` 收到遥测时：
  - 用 `IgnoreQueryFilters().FirstOrDefaultAsync` 找设备（绕过多租户过滤器）
  - 更新 `Status = Online` + `LastSeenAt = now`
  - 只在状态变化时写库（高频场景下降低 DB 压力）
- 新增 `DeviceStatusMonitor` 后台服务：每 30s 扫描，`LastSeenAt` 超 90s 的设备标记 Offline
- 注册到 `Program.cs`

### Bug 2: 多租户过滤器挡住所有后台 handler（P0）

**症状**：WorkOrderAutoCreateHandler 日志显示"告警规则未启用自动创建工单"，但 DB 里规则 `auto_create_workorder=true`。

**根因**：4 个后台事件处理器在 Channel 消费（无 HttpContext），但 EF 全局查询过滤器要求 `TenantId = @current_tenant`。后台处理器中 `ITenantContext.TenantId` 是默认值，所以：
- `WorkOrderAutoCreateHandler.FindAsync(AlertRule)` → null
- `RootCauseAnalysisHandler.FindAsync(Device)` → null  
- `WorkOrderAnalysisHandler.FirstOrDefaultAsync(WorkOrder)` → null

**修复**：4 处都加 `IgnoreQueryFilters()`：
- `TelemetryEventHandler.UpdateDevicePresenceAsync`（修 Bug 1 时一起加的）
- `WorkOrderAutoCreateHandler.HandleAsync` 查 AlertRule / 防重复查 WorkOrder
- `WorkOrderAnalysisHandler.HandleAsync` 查 WorkOrder by AlertId
- `RootCauseAnalysisHandler.CaptureKnowledgeAsync` 查 Device by Id

### Bug 3: 工单编码竞态条件（P0）

**症状**：`duplicate key value violates unique constraint "IX_work_orders_workorder_code"`，工单创建失败。

**根因（两层）**：
1. `GenerateCodeAsync` 用 `dbContext.WorkOrders.Where(...)`（**受租户过滤器影响**），查不到其他租户的工单编码 → `maxCode=null` → `nextSeq=1` → 永远生成 `WO-{date}-0001`，但 DB 已存在该编码 → 冲突
2. 原代码无重试机制，冲突后整个事件处理失败

**修复**：
- `GenerateCodeAsync` 加 `IgnoreQueryFilters()`，按全局最大序号递增
- `HandleAsync` 包装 3 次重试循环，捕获 `DbUpdateException` 且 inner 是 PostgreSQL `SqlState=23505` 时回退并重新生成编码
- 加 `IsUniqueViolation` 辅助方法遍历 inner exception 链

### Bug 4: 种子告警规则硬编码 device_type='空压机'（P0）

**症状**：用户在前端创建 type='motor' 的设备，发送 oil_temperature/vibration 等指标，即使值超阈值也不触发告警。

**根因**：种子告警规则的 `DeviceType = "空压机"` 硬编码。`AlertEvaluationService` 查询条件：
```csharp
.Where(r => r.DeviceType == null || r.DeviceType == deviceType)
```
但 `device_type='空压机' != 'motor'`，规则永远不匹配。

**修复**：
- `ParseAlarmRuleElement` 把 `DeviceType = null`（通用规则）
- 种子去重条件从 `device_type == "空压机"` 改为 `device_type == null`
- `DataSeeder` 加 startup 数据迁移 `MigrateLegacyAirCompressorRulesToGenericAsync`：用 `ExecuteUpdateAsync` 把已部署库的旧规则改成 null（幂等，已迁移不重复执行）

### Bug 5: 模拟器缺 MQTT 凭证选项（P1）

**症状**：`Connecting with MQTT server failed (NotAuthorized)`。

**根因**：生产 mosquitto 配置 `allow_anonymous false`，但 `SimulatorOptions` 不支持 username/password。

**修复**：
- `SimulatorOptions` 加 `MqttUsername` / `MqttPassword` 字段
- `MqttClientOptionsBuilder` 在用户名非空时调用 `.WithCredentials(...)`
- CLI 加 `--mqtt-username` / `--mqtt-password` 参数
- 也支持 `SIM_MQTT_USERNAME` / `SIM_MQTT_PASSWORD` 环境变量（避免命令行暴露密码）

---

## 3. 端到端验证

### 3.1 完整业务闭环（type=motor 设备）

```
1. POST /api/v1/devices 创建 type=motor 设备
2. Simulator 通过 MQTT 发遥测（oil_temp, vib, press, current, air_flow）
3. 后端 MQTT 订阅接收 → 发布 TelemetryReceivedEvent
4. TelemetryEventHandler：
   ✅ 更新设备 Status=Online + LastSeenAt（Bug 1 修复）
   ✅ 触发 AlertEvaluationService
5. AlertEvaluationService：
   ✅ IgnoreQueryFilters 查 AlertRule（Bug 4 修复后 device_type=null 匹配任意类型）
   ✅ 阈值评估 → 触发告警 → 发布 AlertTriggeredEvent
6. AlertEventHandler：写 alerts 表 + SignalR 推送
7. RootCauseAnalysisHandler：
   ✅ IgnoreQueryFilters 查 Device（Bug 2 修复）
   ✅ L2/L3/L4/LLM 降级链 → 写 analyses 表
8. WorkOrderAutoCreateHandler：
   ✅ IgnoreQueryFilters 查 AlertRule（Bug 2 修复）
   ✅ IgnoreQueryFilters 查 WorkOrder 最大编码（Bug 3 修复）
   ✅ 生成唯一工单编码 → 创建工单 → 发布 WorkOrderCreatedEvent
```

### 3.2 真实数据快照

| 指标 | 修复前 | 修复后 |
|------|--------|--------|
| 在线设备数 | 0 / 28 | 1 / 28（type=motor 设备持续发遥测） |
| 设备可用率 | 0% | 3.4% |
| 活跃告警 | 25（全是历史测试数据） | 37（新增 12 个真实告警） |
| 待处理工单 | 63 | 65（新增 2 个自动建单） |
| 告警趋势 6/16 | 0 | 12+（实时增长） |

### 3.3 自动建单验证

```
设备 20f777f9（type=motor）发送 motor_current=185A（超阈值 180A）
→ 告警 ALT-20f777f9-...-motor_current 触发
→ 自动创建工单 WO-20260616-0002 "告警工单：motor_current 异常"
→ 状态 PendingDispatch
```

---

## 4. 测试结果

| 维度 | 结果 |
|------|------|
| 后端单元测试 | 682 / 682 ✅ |
| 前端单元测试 | 293 / 293 ✅ |
| TypeScript 类型检查 | 0 错误 ✅ |
| ESLint | 0 错误 0 警告 ✅ |
| Playwright 浏览器渲染 | 22 / 22 页面正常 ✅ |
| 端到端业务闭环 | 完整通过 ✅ |

---

## 5. 工程教训

### 5.1 "已完成"不等于"已验证"

CLAUDE.md 路线图把 Phase 1-4 全部标"已完成"，但实际上：
- 功能代码存在 ≠ 功能可用
- 单元测试通过 ≠ 端到端可用
- 空数据下渲染正常 ≠ 真实数据流下正常

只有用真实数据跑通完整业务闭环，才能算"已验证"。

### 5.2 多租户过滤器是后台 handler 的陷阱

EF Core 全局查询过滤器对 HTTP 请求路径完美工作（TenantResolutionMiddleware 设置 ITenantContext），但后台 Channel 消费的事件处理器**无 HttpContext**，ITenantContext 是默认值，过滤器直接吃掉所有查询。

**规则**：后台事件处理器查 DB 时**必须** `IgnoreQueryFilters()`，并显式传入 `tenantId` 作为查询条件。

### 5.3 路线图必须随代码更新

CLAUDE.md 是给未来 Claude 看的"项目状态快照"。如果代码已经走完了路线图但文档没更新，未来的 Claude（包括我自己）会被误导，重复建议已经做完的事。

**规则**：每次发布版本时，同步更新 CLAUDE.md 路线图反映实际进度。

---

## 6. 提交记录

```
231dfaf fix(runtime): 5 critical bugs found via simulator-driven data flow
```

修改 34 个文件，343 行新增 / 47 行删除。包含：
- 5 个 bug 修复（4 个 P0 + 1 个 P1）
- 1 个新后台服务（DeviceStatusMonitor）
- 1 个新 migration（AddDeviceLastSeenAt）
- 1 个 startup 数据迁移（MigrateLegacyAirCompressorRulesToGenericAsync）
- CLAUDE.md 路线图更新
- Playwright 截图与审计结果更新

---

## 7. 下一步候选

按工程价值排序：

1. **真实协议联调**：用真实 PLC / OPC UA 服务器对接 `OpcUaAdapter`，验证协议适配器在工业现场可用
2. **压力测试**：跑 `tests/load/` 下 k6 脚本（API 读 / MQTT 发布 / 遥测写入），找出吞吐瓶颈
3. **CI 自动化**：打开 `.github/workflows/ci.yml` 的 push/PR 自动触发
4. **OEE 计算细化**：当前 availability = onlineDevices/totalDevices，但 OEE 公式应该是 availability × performance × quality，需检查 Dashboard OEE 计算是否完整
