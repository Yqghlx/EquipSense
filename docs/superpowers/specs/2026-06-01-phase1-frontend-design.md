# Phase 1 前端页面设计规格

> 日期：2026-06-01
> 范围：React 19 + TypeScript 前端完整页面，覆盖仪表盘、设备管理、告警中心、工单管理、AI 分析、系统设置
> 参考：`docs/FINAL_TECHNICAL_DESIGN.md`

## 目标

为已完成的 .NET 8 后端（设备 CRUD、MQTT 遥测、阈值/组合/基线告警、SignalR 实时推送、AI 根因分析 L1-L3、工单管理）构建完整的 React 前端，实现数据可视化、实时告警推送、工单生命周期操作等核心交互。

**不包含**：PWA 支持、移动端适配、E2E 测试（Phase 3）、知识库页面（Phase 2）、OPC UA/Modbus 配置界面（Phase 2）

## 构建策略

分层构建，分 3 个子计划独立执行：
1. **子计划 A**：项目骨架 + 基础设施（Vite 初始化、API 层、SignalR、布局、登录页、主题、国际化）
2. **子计划 B**：设备 + 告警页面（仪表盘、设备列表/详情、告警中心、告警规则）
3. **子计划 C**：工单 + AI 分析 + 设置页面（工单列表/详情、AI 分析、系统设置）

每个子计划完成后产出可运行的增量。

## 技术栈

| 类别 | 技术 | 用途 |
|------|------|------|
| 框架 | React 19 + TypeScript (strict) | UI 框架 |
| 构建 | Vite 6 | 开发服务器 + 打包 |
| 样式 | TailwindCSS 4 + shadcn/ui | 样式 + 组件库 |
| 主题 | CSS 变量 + dark: 前缀 | 深色（默认）/浅色双主题 |
| 状态 | Zustand | 全局状态（auth、notification） |
| 数据 | TanStack Query v5 | 服务端数据缓存 + 自动刷新 |
| 图表 | ECharts (echarts + echarts-for-react) | 趋势图、饼图、仪表盘图 |
| 表单 | React Hook Form + Zod | 表单管理 + 校验 |
| 实时 | @microsoft/signalr | WebSocket 实时推送 |
| 路由 | React Router v7 | SPA 路由 |
| 国际化 | i18next + react-i18next | 中英文切换 |
| HTTP | Axios | API 请求 |

## Vite 配置

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/hubs': { target: 'http://localhost:8080', ws: true, changeOrigin: true },
    },
  },
});
```

## 路由结构

```
/login                    — 登录页（AuthLayout，无侧边栏）
/                         — 认证后主布局（AppLayout）
  /dashboard              — 仪表盘
  /devices                — 设备列表
  /devices/:id            — 设备详情
  /alerts                 — 告警中心
  /alert-rules            — 告警规则配置
  /work-orders            — 工单列表
  /work-orders/:id        — 工单详情
  /analyses               — AI 分析列表
  /settings               — 系统设置（用户管理、角色权限、LLM 配置）
```

路由守卫：未登录重定向到 `/login`，登录后重定向到 `/dashboard`。

## 布局设计

**固定侧边栏布局**：
- 左侧固定侧边栏（宽 240px，可折叠到 64px）
- 顶部 Header（面包屑 + 实时通知铃铛 + 用户菜单 + 主题切换 + 语言切换）
- 右侧主内容区

### Sidebar

导航项：
| 图标 | 导航项 | 路由 | 徽标 |
|------|--------|------|------|
| 📊 | 仪表盘 | /dashboard | — |
| 🔧 | 设备管理 | /devices | 在线设备数 |
| 🚨 | 告警中心 | /alerts | 活跃告警数（红色） |
| 📋 | 工单管理 | /work-orders | 待处理数（黄色） |
| 🤖 | AI 分析 | /analyses | — |
| ⚙️ | 系统设置 | /settings | — |

底部：折叠/展开按钮。

### Header

- 左：面包屑（基于路由自动生成）
- 右：通知铃铛（下拉最近 10 条告警）+ 主题切换（太阳/月亮图标）+ 语言切换（中/EN）+ 用户头像下拉（个人信息、修改密码、登出）

### NotificationToast

右下角浮动告警通知，由 notificationStore 驱动。收到 SignalR 推送时自动弹出，5 秒后消失。支持点击跳转到告警详情。

## 核心基础设施

### api.ts

```typescript
// Axios 实例
// - baseURL: '/api/v1'
// - 请求拦截器：自动注入 Authorization: Bearer {token}
// - 响应拦截器：401 时尝试刷新 Token，刷新失败跳转 /login
// - 并发安全：多个 401 只触发一次刷新
```

### queryClient.ts

```typescript
// TanStack Query 配置
// - staleTime: 30_000（30 秒）
// - retry: 1
// - refetchOnWindowFocus: true
```

### signalr.ts

```typescript
// SignalR 连接管理
// - 连接 /hubs/industrial
// - 自动重连（指数退避）
// - 连接时自动加入 tenant:{tenantId} 组（通过 Hub 的 OnConnectedAsync）
// - 监听消息：OnAlertTriggered, OnAlertResolved, OnTelemetryUpdate
// - 消息分发到 notificationStore + 相关 query invalidation
```

### authStore (Zustand)

```typescript
// 状态：token, refreshToken, user (id, username, role, tenantId), isAuthenticated
// 操作：login(credentials), logout(), refreshToken(), loadFromStorage()
// 持久化：localStorage 存储 token 和 user
```

### notificationStore (Zustand)

```typescript
// 状态：notifications: Array<{id, type, title, message, timestamp, read}>
// 操作：push(notification), markRead(id), clearAll()
// 最大 50 条，自动清理 1 小时前的已读通知
```

### useSignalR Hook

```typescript
// 建立 SignalR 连接，监听 Hub 消息
// OnAlertTriggered → notificationStore.push + invalidate alert/dashboard queries
// OnAlertResolved → notificationStore.push + invalidate alert queries
// OnTelemetryUpdate → invalidate telemetry queries（设备详情页实时更新）
```

### 主题系统

- 基于 CSS 变量，深色主题为默认
- TailwindCSS `dark:` 前缀适配
- 用户偏好存入 localStorage
- `useTheme` Hook 提供 `theme`, `toggleTheme()`

### 国际化

- i18next + react-i18next
- 语言文件：`src/i18n/zh.json`（中文）、`src/i18n/en.json`（英文）
- 命名空间按模块分：common, device, alert, workorder, analysis, settings
- 默认语言：中文
- 用户选择存入 localStorage

## 页面设计

### LoginPage

- 居中卡片布局（AuthLayout）
- 用户名 + 密码表单（React Hook Form + Zod 校验）
- 登录按钮 → POST /api/v1/auth/login → 存储 token + user → 跳转 /dashboard
- 错误提示：用户名或密码错误

### DashboardPage

顶部 4 个统计卡片：
| 卡片 | 数据源 | 颜色 |
|------|--------|------|
| 在线设备 | GET /devices?status=online | 蓝色 |
| 活跃告警 | GET /alerts?status=active | 红色 |
| 待处理工单 | GET /work-orders?status=pending_dispatch | 黄色 |
| 设备可用率 | 计算值（在线/总数） | 绿色 |

中部：告警趋势折线图（ECharts，最近 7 天按天分组）
下部左：设备状态分布饼图（在线/离线/维护）
下部右：最近 10 条告警列表（可点击跳转）

### DeviceListPage

- 搜索栏（设备名称/编码）
- 筛选：设备类型（下拉）、状态（在线/离线/维护）
- DataTable：设备编码、名称、类型、状态、最后通讯时间、操作（查看/编辑/删除）
- 新建设备按钮 → Dialog 弹窗表单
- 分页：服务端分页

### DeviceDetailPage

上部：设备基本信息卡片（名称、编码、类型、位置、状态、最后通讯时间）
中部：实时遥测数据区（多个指标卡片，数值实时更新 via SignalR）
  - 每个指标卡片：当前值 + 小型趋势图（sparkline）
下部左：历史趋势图（ECharts，可选指标 + 时间范围）
下部右：该设备的告警列表（最近 20 条）

### AlertCenterPage

- 筛选栏：状态（活跃/已确认/已解决）、级别（critical/high/normal/low）、设备、时间范围
- DataTable：告警编码、设备名称、指标、当前值、阈值、级别、状态、触发时间
- 操作：确认（PUT /alerts/{id}/acknowledge）、解决（PUT /alerts/{id}/resolve）
- 点击行 → 右侧抽屉显示告警详情 + 关联的分析结果（如有）+ 关联工单（如有）

### AlertRulesPage

- DataTable：规则名称、类型（阈值/组合/基线）、指标、条件、级别、启用状态
- 新建/编辑规则 → Dialog 表单
  - 阈值类型：指标 + 运算符 + 阈值
  - 组合类型：多条件 AND 组合
  - 基线类型：指标 + 标准差倍数
- 通用字段：名称、设备类型/设备选择、告警级别、冷却时间、是否自动创建工单
- 启用/禁用开关

### WorkOrderListPage

- 筛选栏：状态（8 种）、优先级、设备
- DataTable：工单编码、标题、设备、优先级、状态、派工人、创建时间
- 新建工单按钮 → Dialog 表单（标题、类型、优先级、设备、描述、截止日期）
- 分页：服务端分页

### WorkOrderDetailPage

上部：工单基本信息卡片（编码、标题、类型、优先级、状态、设备、创建时间）
中部：操作按钮区（根据当前状态显示可用操作）
  - 待派工 → 派工按钮（选择人员）
  - 已派工 → 开始执行
  - 执行中 → 完成（填写解决措施）
  - 已完成 → 验收通过 / 验收不通过
  - 已验收 → 关闭
  - 任何状态 → 取消（需填写原因）
下部左：关联信息（根因描述 + AI 分析结果卡片）
下部右：审计日志时间线（WorkOrderLog 列表，按时间倒序）

### AnalysesPage

- 筛选：设备、分析级别（L1/L2/L3）、状态
- DataTable：分析 ID、设备、指标、级别、置信度、数据质量评分、状态、耗时、完成时间
- 手动触发分析按钮 → Dialog 选择告警 → POST /api/v1/analyses
- 点击行 → 展开详情：根因描述 + 建议措施 + 置信度可视化 + 原始 LLM 响应

### SettingsPage

Tab 布局：
- **用户管理**：用户列表 + 创建/编辑/禁用用户
- **角色权限**：RBAC 矩阵展示（只读，5 种角色对应权限）
- **LLM 配置**：模型 ID、Endpoint、超时时间（调用后端系统配置 API）
- **系统参数**：告警冷却时间、聚合窗口等全局参数

## TypeScript 类型定义

```typescript
// src/types/index.ts

// 通用分页
interface PagedResult<T> { items: T[]; total: number; page: number; pageSize: number; }
interface PagedQuery { page: number; pageSize: number; sort?: string; order?: 'asc' | 'desc'; }

// 设备
interface Device { id: string; deviceCode: string; name: string; deviceType: string; status: string; location?: string; lastCommunicatedAt?: string; createdAt: string; }
interface DeviceTelemetry { deviceId: string; metric: string; value: number; timestamp: string; }

// 告警
interface Alert { id: string; alertCode: string; deviceId: string; deviceName?: string; metric: string; value: number; severity: string; status: string; triggeredAt: string; acknowledgedAt?: string; resolvedAt?: string; }
interface AlertRule { id: string; name: string; deviceType?: string; deviceId?: string; metric: string; ruleType: string; operator?: string; threshold?: number; severity: string; cooldownSeconds: number; autoCreateWorkorder: boolean; enabled: boolean; }

// 工单
interface WorkOrder { id: string; workOrderCode: string; title: string; type: string; status: string; priority: string; deviceId: string; alertId?: string; analysisId?: string; rootCause?: string; resolution?: string; assignedTo?: string; dueDate?: string; completedAt?: string; createdAt: string; }
interface WorkOrderLog { id: string; workOrderId: string; action: string; oldStatus?: string; newStatus?: string; operatorId?: string; note?: string; createdAt: string; }

// 分析
interface Analysis { id: string; alertId: string; deviceId: string; level: string; status: string; confidence?: number; dataQualityScore?: number; rootCause?: string; suggestion?: string; processingTimeMs?: number; completedAt?: string; createdAt: string; }

// 认证
interface LoginRequest { username: string; password: string; }
interface AuthResponse { token: string; refreshToken: string; user: { id: string; username: string; role: string; tenantId: string; }; }
```

## SignalR 消息协议

| 消息名 | 参数 | 前端处理 |
|--------|------|---------|
| `OnAlertTriggered` | alertId, alertCode, deviceId, metric, value, severity | Toast + invalidate alerts/dashboard |
| `OnAlertResolved` | alertId | invalidate alerts |
| `OnTelemetryUpdate` | deviceId, metric, value | 更新设备详情页实时数据 |

## TanStack Query Hooks

```typescript
// useDevices.ts
useDevices(query)           — GET /devices
useDevice(id)               — GET /devices/{id}
useCreateDevice()           — POST /devices
useUpdateDevice()           — PUT /devices/{id}
useDeleteDevice()           — DELETE /devices/{id}

// useAlerts.ts
useAlerts(query, filters)   — GET /alerts
useAlert(id)                — GET /alerts/{id}
useAcknowledgeAlert()       — PUT /alerts/{id}/acknowledge
useResolveAlert()           — PUT /alerts/{id}/resolve

// useAlertRules.ts
useAlertRules(query)        — GET /alert-rules
useAlertRule(id)            — GET /alert-rules/{id}
useCreateAlertRule()        — POST /alert-rules
useUpdateAlertRule()        — PUT /alert-rules/{id}
useDeleteAlertRule()        — DELETE /alert-rules/{id}

// useWorkOrders.ts
useWorkOrders(query, filters) — GET /work-orders
useWorkOrder(id)              — GET /work-orders/{id}
useCreateWorkOrder()          — POST /work-orders
useAssignWorkOrder()          — PUT /work-orders/{id}/assign
useStartWorkOrder()           — PUT /work-orders/{id}/start
useCompleteWorkOrder()        — PUT /work-orders/{id}/complete
useAcceptWorkOrder()          — PUT /work-orders/{id}/accept
useRejectWorkOrder()          — PUT /work-orders/{id}/reject
useCloseWorkOrder()           — PUT /work-orders/{id}/close
useCancelWorkOrder()          — PUT /work-orders/{id}/cancel

// useAnalyses.ts
useAnalyses(query, filters) — GET /analyses
useAnalysis(id)              — GET /analyses/{id}
useTriggerAnalysis()         — POST /analyses

// useTelemetry.ts
useTelemetry(deviceId, metric, timeRange) — GET /telemetry
```

## 文件结构总览

```
frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── tailwind.config.ts
├── components.json (shadcn/ui)
├── index.html
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── App.css
    ├── index.css
    ├── lib/
    │   ├── api.ts
    │   ├── queryClient.ts
    │   ├── signalr.ts
    │   └── utils.ts
    ├── stores/
    │   ├── authStore.ts
    │   └── notificationStore.ts
    ├── hooks/
    │   ├── useSignalR.ts
    │   ├── useTheme.ts
    │   ├── useDevices.ts
    │   ├── useAlerts.ts
    │   ├── useAlertRules.ts
    │   ├── useTelemetry.ts
    │   ├── useWorkOrders.ts
    │   └── useAnalyses.ts
    ├── i18n/
    │   ├── index.ts
    │   ├── zh.json
    │   └── en.json
    ├── types/
    │   └── index.ts
    ├── components/
    │   ├── ui/                    — shadcn/ui 基础组件（按需添加）
    │   ├── layout/
    │   │   ├── AuthLayout.tsx
    │   │   ├── AppLayout.tsx
    │   │   ├── Sidebar.tsx
    │   │   ├── Header.tsx
    │   │   └── NotificationToast.tsx
    │   ├── charts/
    │   │   ├── TrendChart.tsx
    │   │   ├── PieChart.tsx
    │   │   └── GaugeChart.tsx
    │   ├── device/
    │   │   ├── DeviceForm.tsx
    │   │   └── DeviceStatusBadge.tsx
    │   ├── alert/
    │   │   ├── AlertDetailDrawer.tsx
    │   │   └── SeverityBadge.tsx
    │   ├── workorder/
    │   │   ├── WorkOrderForm.tsx
    │   │   ├── StatusTimeline.tsx
    │   │   └── PriorityBadge.tsx
    │   └── analysis/
    │       ├── AnalysisDetail.tsx
    │       └── ConfidenceMeter.tsx
    └── pages/
        ├── LoginPage.tsx
        ├── DashboardPage.tsx
        ├── DeviceListPage.tsx
        ├── DeviceDetailPage.tsx
        ├── AlertCenterPage.tsx
        ├── AlertRulesPage.tsx
        ├── WorkOrderListPage.tsx
        ├── WorkOrderDetailPage.tsx
        ├── AnalysesPage.tsx
        └── SettingsPage.tsx
```

## 不包含

- PWA 支持（Phase 3）
- 移动端适配（Phase 3）
- E2E 测试（Phase 3）
- 知识库页面（Phase 2）
- OPC UA/Modbus 配置界面（Phase 2）
- 钉钉/飞书集成界面（Phase 3）
