# Phase 3 产品化设计规格

> **目标：** 将 EquipSense 从功能原型提升为可交付的产品级系统 — 完整工单工作流、外部集成、知识库管理、多租户 SaaS、PWA 离线支持。

**架构：** 在现有模块化单体基础上扩展，工单审批链通过新实体支撑，外部集成通过已有的 `IWorkOrderIntegration` 可插拔接口实现，多租户通过 EF Core 全局过滤器 + 配额中间件强制执行。

**技术栈：** .NET 8 / React 19 / PostgreSQL+TimescaleDB / Redis / SignalR / Workbox(+) / IndexedDB / Web Push API

---

## 子计划拆分与依赖

| 子计划 | 内容 | 依赖 | 执行顺序 |
|--------|------|------|----------|
| **3A** | 工单完整工作流 + 多级审批链 | 无 | 第 1 批 |
| **3B** | 外部集成（钉钉/飞书/Webhook/EAM） | 3A | 第 2 批 |
| **3C** | 知识库管理（CRUD/导入导出/版本） | 无 | 第 1 批 |
| **3D** | 多租户 SaaS（注册/配额/管理后台） | 无 | 第 1 批 |
| **3E** | PWA 离线 + 推送通知 | 3A | 第 2 批 |

**执行顺序：** 3A + 3C + 3D 并行 → 3B + 3E 并行

---

## 3A: 工单完整工作流 + 多级审批链

### 工单状态流转

```
待派工 → 已派工 → 执行中 → 待验收 → 已验收 → 已关闭
                              ↑        ↓
                              └─ 返工 ─┘ (驳回回执行中)
```

- **待派工 → 已派工**：`maintenance_lead` 指派 `AssignedTo`，可手动选人或使用 `SmartDispatchService` 智能推荐
- **已派工 → 执行中**：被指派人（`technician`）点击「开始执行」，记录 `StartedAt`
- **执行中 → 待验收**：执行人提交执行报告（根因、处理措施、零件、工时），系统自动匹配审批链模板，创建 `WorkOrderApproval` 记录
- **待验收 → 已验收**：审批链中所有步骤通过，记录 `AcceptedAt`
- **待验收 → 返工(Rejected → InProgress)**：任一审批人驳回，工单回到执行中，执行人需修改后重新提交
- **已验收 → 已关闭**：`maintenance_lead` 或 `system_admin` 关闭工单，记录 `ClosedAt`
- **任意 → 已取消**：创建者或管理员可取消（需填写取消原因）

### 审批链模板设计

**匹配规则**（优先级从高到低）：
1. 精确匹配 `(WorkOrderType, Priority)` 组合
2. 回退到 `WorkOrderType` 的默认链（`IsDefault=true`）
3. 回退到全局默认链（`WorkOrderType` 为 null 且 `IsDefault=true`）

**示例配置**：

| 类型 | 优先级 | 审批链 |
|------|--------|--------|
| 纠正性 | 紧急 | 班组长 → 维护经理 → 厂长 |
| 纠正性 | 高 | 班组长 → 维护经理 |
| 纠正性 | 中/低 | 班组长 |
| 预防性 | * | 班组长 |
| * | * | 班组长（全局兜底） |

### 新增实体

#### ApprovalChainTemplate
```csharp
public class ApprovalChainTemplate : BaseEntity
{
    public Guid TenantId { get; set; }
    public WorkOrderType? WorkOrderType { get; set; }   // null = 全局默认
    public WorkOrderPriority? Priority { get; set; }     // null = 类型默认
    public string Name { get; set; }                     // "紧急纠正性工单审批"
    public bool IsDefault { get; set; }                  // 类型默认链标记
    public bool Enabled { get; set; } = true;
    public List<ApprovalStep> Steps { get; set; } = [];
}
```

#### ApprovalStep
```csharp
public class ApprovalStep : BaseEntity
{
    public Guid ChainId { get; set; }
    public int StepOrder { get; set; }                   // 从 1 开始
    public string Role { get; set; }                     // "maintenance_lead" / "system_admin"
    public Guid? SpecificApproverId { get; set; }        // 指定具体人（可选，null=按角色匹配）
    public bool IsRequired { get; set; } = true;         // 是否必须（预留会签场景）
}
```

#### WorkOrderApproval
```csharp
public enum ApprovalAction { Pending, Approved, Rejected }

public class WorkOrderApproval : BaseEntity
{
    public Guid TenantId { get; set; }
    public Guid WorkOrderId { get; set; }
    public int StepOrder { get; set; }
    public string ExpectedRole { get; set; }
    public Guid? ApproverId { get; set; }
    public ApprovalAction Action { get; set; } = ApprovalAction.Pending;
    public string? Comment { get; set; }
    public DateTime? ActedAt { get; set; }
}
```

### 后端 API

```
GET    /api/v1/approval-chains                    — 列出当前租户的审批链模板
POST   /api/v1/approval-chains                    — 创建审批链模板
PUT    /api/v1/approval-chains/{id}               — 更新审批链模板
DELETE /api/v1/approval-chains/{id}               — 删除审批链模板

POST   /api/v1/work-orders/{id}/dispatch          — 派工（指定 AssignedTo）
POST   /api/v1/work-orders/{id}/start             — 开始执行
POST   /api/v1/work-orders/{id}/submit            — 提交验收（附带执行报告）
POST   /api/v1/work-orders/{id}/approve           — 审批通过（当前步骤）
POST   /api/v1/work-orders/{id}/reject            — 审批驳回（附带驳回原因）
POST   /api/v1/work-orders/{id}/close             — 关闭工单
POST   /api/v1/work-orders/{id}/cancel            — 取消工单
```

### 前端改动

- **WorkOrderDetailPage**：新增审批进度面板（右侧），显示审批链各节点状态，当前审批人可操作通过/驳回
- **DispatchBoardPage**：增强派工功能，集成 SmartDispatchService 推荐
- **SettingsPage**：新增「审批链配置」Tab，管理审批链模板（CRUD）
- **SignalR**：审批状态变更实时推送，待审批人收到通知

---

## 3B: 外部集成（钉钉/飞书/Webhook/EAM）

### 架构

每种外部系统实现 `IWorkOrderIntegration` 接口（已存在）：
- `IntegrationType` 属性标识类型
- `PushCreatedAsync` 工单创建时推送
- `PushStatusChangedAsync` 状态变更时推送

新增 `IntegrationRouter` 服务：
- 从租户 `Settings["integrations"]` 读取启用的集成列表
- 按序调用每个启用的集成实现
- 失败重试（指数退避，最多 3 次）
- 记录推送日志到 `audit_logs`

### 钉钉集成 (DingTalkIntegration)
- 通过自定义机器人 Webhook 推送消息卡片
- 支持 ActionCard（在钉钉内直接查看工单详情）
- 签名验证（HmacSHA256）

### 飞书集成 (FeishuIntegration)
- 通过飞书机器人推送消息
- 支持飞书审批流（调用飞书审批 API 创建审批实例）
- 审批结果回调同步回 EquipSense

### Webhook 集成 (WebhookIntegration)
- 通用 HTTP POST，租户可配置 URL / Headers / Body 模板
- Body 模板支持变量插值：`{{workOrder.code}}`, `{{workOrder.title}}` 等
- 签名头 `X-EquipSense-Signature`

### EAM 集成 (EamIntegration)
- 适配 Maximo 等 EAM 系统的 REST API
- 支持 OData 查询格式
- 双向同步：EquipSense 创建工单时同步到 EAM，EAM 状态变更回调更新

### 租户配置 Schema
```json
{
  "integrations": {
    "dingtalk": { "enabled": true, "webhook": "https://...", "secret": "..." },
    "feishu": { "enabled": true, "appId": "...", "appSecret": "..." },
    "webhook": { "enabled": false, "url": "", "headers": {}, "bodyTemplate": "" },
    "eam": { "enabled": false, "type": "maximo", "endpoint": "", "apiKey": "" }
  }
}
```

### 后端 API
```
GET    /api/v1/settings/integrations              — 获取集成配置
PUT    /api/v1/settings/integrations              — 更新集成配置
POST   /api/v1/settings/integrations/{type}/test  — 测试集成连通性
```

### 前端改动
- **SettingsPage**：新增「外部集成」Tab，每种集成一个配置表单 + 连接测试按钮

---

## 3C: 知识库管理

### 规则 CRUD
- **KnowledgeController** 增强：`PUT /api/v1/knowledge/rules/{id}` 编辑规则
- 条件编辑器：JSON 条件 → 表单字段（metric / operator / threshold）
- 启用/禁用切换：`PATCH /api/v1/knowledge/rules/{id}/toggle`
- 按设备类型、来源、状态过滤
- 全文搜索（PostgreSQL `tsvector`）

### 批量导入/导出
- **KnowledgeImportService**：
  - CSV 格式：`设备类型,规则名称,条件JSON,结论,推荐措施,来源`
  - JSON 格式：规则数组
  - 导入前校验（必填字段、JSON 格式、设备类型存在性）
  - 导入预览（显示有效/无效行数）
  - 错误报告（行号 + 错误原因）
- **导出**：按设备类型筛选导出为 CSV/JSON
- **行业预置**：一键导入系统租户的预置规则到当前租户

### 版本管理
- **KnowledgeRule** 新增 `Version` (int) 字段，初始值 1
- **KnowledgeRuleVersion** 新实体：
  ```csharp
  public class KnowledgeRuleVersion : BaseEntity
  {
      public Guid RuleId { get; set; }
      public int Version { get; set; }
      public string Snapshot { get; set; }       // 规则完整快照（JSON）
      public string ChangedBy { get; set; }      // 操作人
      public string ChangeSummary { get; set; }  // 变更摘要
  }
  ```
- 每次编辑自动保存快照到 `KnowledgeRuleVersion`，Version +1
- 版本对比 API：`GET /api/v1/knowledge/rules/{id}/versions?from=1&to=3`
- 回滚 API：`POST /api/v1/knowledge/rules/{id}/rollback?version=2`

### 后端 API
```
POST   /api/v1/knowledge/rules/import             — 批量导入（CSV/JSON）
GET    /api/v1/knowledge/rules/export              — 批量导出
GET    /api/v1/knowledge/rules/{id}/versions       — 版本历史
POST   /api/v1/knowledge/rules/{id}/rollback       — 回滚到指定版本
PATCH  /api/v1/knowledge/rules/{id}/toggle         — 启用/禁用
```

### 前端改动
- **KnowledgePage**：规则卡片增加编辑/禁用按钮，新增导入导出工具栏
- 新增规则编辑对话框（条件表单编辑器）
- 新增导入对话框（文件上传 + 预览 + 错误报告）
- 新增版本历史面板（版本列表 + diff 对比）

---

## 3D: 多租户 SaaS

### 套餐设计

| 套餐 | 设备上限 | 用户上限 | 数据保留 | 月价 |
|------|----------|----------|----------|------|
| 免费 | 5 | 3 | 7 天 | 0 |
| 专业 | 50 | 20 | 90 天 | ¥999 |
| 企业 | 不限 | 不限 | 365 天 | 面议 |

### 注册流程
1. 公开注册页面 `/register`（无需登录）
2. 填写企业名称、联系人、邮箱
3. 选择套餐
4. 创建管理员账户（密码 + 邀请码，可选）
5. 系统自动创建：Tenant + User(role=tenant_admin) + 默认审批链 + 默认告警规则
6. 跳转登录页

**新增 API**：
```
POST   /api/v1/auth/register                      — 租户注册（公开）
GET    /api/v1/auth/plans                          — 获取套餐列表（公开）
```

### 配额执行
- **QuotaMiddleware**：在请求管道中检查配额
  - 创建设备时检查 `Tenant.MaxDevices`
  - 创建用户时检查 `Tenant.MaxUsers`
  - 遥测数据写入时检查数据保留天数
- 超额返回 `403 Forbidden` + 明确的错误信息
- 配额检查走 Redis 缓存，避免每次查库

**Tenant 实体扩展**：
```csharp
// 新增字段
public int CurrentDeviceCount { get; set; }
public int CurrentUserCount { get; set; }
public DateTime? TrialEndsAt { get; set; }
public DateTime? SubscriptionEndsAt { get; set; }
public string Status { get; set; }  // Active, Suspended, Expired
```

### system_admin 管理门户
- **TenantsPage**（新页面）：
  - 租户列表（名称/套餐/设备数/用户数/状态/到期时间）
  - 搜索和过滤
  - 冻结/解冻租户
  - 套餐升降级
  - 查看租户详情
- **TenantDetailPage**（新页面）：
  - 租户基本信息
  - 资源使用统计（设备数/用户数/存储）
  - 操作日志
  - 套餐管理
- **DashboardPage 增强**：system_admin 视角显示全局统计

### 数据隔离验证
- **集成测试**：多租户场景下的数据隔离测试套件
  - 租户 A 不能看到租户 B 的设备/告警/工单
  - 跨租户操作返回 403
- **定时扫描**（可选）：后台任务扫描 `tenant_id` 为 null 的记录

---

## 3E: PWA 离线 + 推送

### Service Worker 策略
- **App Shell**：Precache（HTML/JS/CSS/字体/图标）
- **API 数据**：Stale-While-Revalidate（先返回缓存，后台更新）
- **静态资源**：Cache-First（图片/字体）
- **离线回退页面**：显示「当前离线」+ 缓存的数据

### 离线编辑
- **IndexedDB (via idb 库)**：存储离线操作队列
  - 表 `pending-operations`：`{ id, type, url, method, body, timestamp, retryCount }`
- 支持离线操作：
  - 工单执行报告填写
  - 审批通过/驳回
  - 设备备注编辑
- **Background Sync API**：网络恢复后自动同步
- **冲突检测**：操作附带 `version` 字段，服务端比对版本号
  - 版本一致 → 正常提交
  - 版本冲突 → 返回 409 + 服务端最新数据，前端提示用户选择

### 推送通知
- **Web Push API (VAPID)**：
  - 前端请求通知权限 → 获取 PushSubscription → 发送到后端存储
  - 后端新增 `push_subscriptions` 表
  - 触发场景：告警触发、工单派工、审批待办
- **后端**：
  - `PushSubscriptionService`：管理订阅（注册/注销）
  - `PushNotificationService`：发送推送通知
  - 集成到现有的 `SignalRNotificationService`，推送和 SignalR 并行发送

### 前端改动
- 新增 `vite-plugin-pwa` 配置
- 新增 `src/lib/offline.ts`：离线操作队列管理
- 新增 `src/hooks/useOfflineStatus.ts`：网络状态 hook
- 新增 `src/hooks/usePushNotifications.ts`：推送通知 hook
- 前端入口添加 Service Worker 注册 + 安装提示
- 工单详情页添加离线状态指示器 + 同步按钮

---

## 跨子系统共享

- **SignalR 实时推送**：所有子系统的事件都通过已有的 SignalR 通知服务推送
- **审计日志**：所有操作（审批、配置变更、导入导出、租户管理）统一记录到 `audit_logs`
- **RBAC 权限**：所有新增 API 都遵循已有的五角色权限矩阵
