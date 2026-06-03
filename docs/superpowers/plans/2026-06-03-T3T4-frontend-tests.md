# 前端测试补充（T3+T4）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补全前端 21 个缺失的业务 hook 单元测试 + 4 个关键组件测试 + 4 个 E2E 业务流程测试，使前端测试从 93 增长至 ~220 用例。

**Architecture:** Hook 测试复用现有 `vi.mock('../../lib/api')` + `renderHook` + `QueryClientProvider` wrapper 模式；组件测试使用 `@testing-library/react` 的 `render` + `screen` + `fireEvent`；E2E 测试复用 Playwright + 登录辅助函数。

**Tech Stack:** Vitest + @testing-library/react + Playwright + TanStack Query

---

### Task 1: useKnowledge hooks 测试

**Files:**
- Create: `frontend/src/hooks/__tests__/useKnowledge.test.tsx`

**依赖的模块和类型：**
- `src/hooks/useKnowledge.ts` 导出 15 个 hooks：useKnowledgeRules, useCreateKnowledgeRule, usePendingRules, useApprovePendingRule, useRejectPendingRule, useFaultCases, useImportPresetRules, useApproveWithEdit, useUpdateKnowledgeRule, useToggleKnowledgeRule, useImportPreview, useImportRules, useExportRules, useRuleVersions, useRollbackRule
- `src/types/index.ts` 类型：KnowledgeRule, PendingRule, FaultCase, PagedResult, PagedQuery, UpdateKnowledgeRuleRequest

**Mock 数据：**

```typescript
const mockKnowledgeRule: KnowledgeRule = {
  id: 'rule-001',
  name: '水泵振动异常规则',
  deviceType: 'pump',
  conditions: '振动 > 10mm/s AND 温度 > 80°C',
  conclusion: '轴承磨损',
  recommendedActions: '更换轴承',
  checkSteps: '1. 检查振动传感器\n2. 测量轴承间隙',
  confidenceWeight: 0.85,
  successCount: 5,
  enabled: true,
  tenantId: 'tenant-001',
  createdAt: '2026-01-15T08:00:00Z',
};

const mockPagedRules: PagedResult<KnowledgeRule> = {
  items: [mockKnowledgeRule],
  total: 1,
  page: 1,
  pageSize: 20,
};

const mockPendingRule: PendingRule = {
  id: 'pending-001',
  name: '电机过热候选规则',
  deviceType: 'motor',
  conditions: '温度 > 95°C',
  conclusion: '散热故障',
  reviewStatus: 'pending',
  createdAt: '2026-01-20T10:00:00Z',
};

const mockFaultCase: FaultCase = {
  id: 'case-001',
  deviceType: 'pump',
  faultDescription: '水泵异常停机',
  rootCause: '密封件老化导致进水',
  solution: '更换机械密封',
  createdAt: '2026-01-10T08:00:00Z',
};
```

- [ ] **Step 1: 编写 useKnowledge.test.tsx 测试文件**

覆盖所有 15 个 hook 的测试用例：

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import api from '../../lib/api';
import {
  useKnowledgeRules, useCreateKnowledgeRule,
  usePendingRules, useApprovePendingRule, useRejectPendingRule,
  useFaultCases, useImportPresetRules,
  useApproveWithEdit, useUpdateKnowledgeRule, useToggleKnowledgeRule,
  useImportPreview, useImportRules, useExportRules,
  useRuleVersions, useRollbackRule,
} from '../useKnowledge';

vi.mock('../../lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

const mockedApi = vi.mocked(api);

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

beforeEach(() => { vi.clearAllMocks(); });

// useKnowledgeRules: 成功获取、deviceType 过滤、错误处理
// useCreateKnowledgeRule: POST /knowledge/rules、成功后 invalidateQueries
// usePendingRules: 成功获取、reviewStatus 过滤
// useApprovePendingRule: PUT /knowledge/pending-rules/{id}/approve、invalidate 两个 key
// useRejectPendingRule: PUT /knowledge/pending-rules/{id}/reject
// useFaultCases: 成功获取列表
// useImportPresetRules: POST /knowledge/rules/preset-import
// useApproveWithEdit: PUT /knowledge/pending-rules/{id}/approve-with-edit
// useUpdateKnowledgeRule: PUT /knowledge/rules/{id}（mutationFn 解构 { id, ...request }）
// useToggleKnowledgeRule: PATCH /knowledge/rules/{id}/toggle
// useImportPreview: POST /knowledge/rules/import?preview=true（FormData）
// useImportRules: POST /knowledge/rules/import（FormData）
// useExportRules: GET /knowledge/rules/export?format=（blob 响应）
// useRuleVersions: GET /knowledge/rules/{ruleId}/versions、enabled 条件
// useRollbackRule: POST /knowledge/rules/{ruleId}/rollback?version=
```

每个 hook 至少 2 个测试（成功 + 错误/边界），预计 30+ 测试用例。

- [ ] **Step 2: 运行测试验证通过**

Run: `cd frontend && npx vitest run src/hooks/__tests__/useKnowledge.test.tsx`
Expected: 全部通过

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/__tests__/useKnowledge.test.tsx
git commit -m "test: 添加 useKnowledge hooks 单元测试（15 个 hook 覆盖）"
```

---

### Task 2: useWorkOrders + useAnalyses hooks 测试

**Files:**
- Create: `frontend/src/hooks/__tests__/useWorkOrders.test.tsx`
- Create: `frontend/src/hooks/__tests__/useAnalyses.test.tsx`

- [ ] **Step 1: 编写 useWorkOrders.test.tsx**

覆盖 useWorkOrders 导出的 10 个 hooks（useWorkOrders, useWorkOrder, useWorkOrderLogs, useCreateWorkOrder, useAssignWorkOrder, useStartWorkOrder, useCompleteWorkOrder, useAcceptWorkOrder, useRejectWorkOrder, useCloseWorkOrder, useCancelWorkOrder）：

```typescript
// Mock 数据
const mockWorkOrder: WorkOrder = {
  id: 'wo-001', title: '修复一号水泵', description: '水泵异常停机需检修',
  status: 'Pending', priority: 'High', deviceId: 'device-001', deviceName: '一号水泵',
  createdByName: '张三', createdAt: '2026-01-15T08:00:00Z', updatedAt: '2026-01-15T08:00:00Z',
};

// 测试点：
// useWorkOrders: 列表查询、过滤参数（status/priority/deviceId）、排序参数、错误处理
// useWorkOrder: 单个详情、id 为空禁用
// useWorkOrderLogs: 日志查询、workOrderId 为空禁用
// useCreateWorkOrder: POST /work-orders
// useAssignWorkOrder: PUT /work-orders/{id}/assign（解构 { id, ...req }）
// useStartWorkOrder: PUT /work-orders/{id}/start
// useCompleteWorkOrder: PUT /work-orders/{id}/complete（解构 { id, ...req }）
// useAcceptWorkOrder: PUT /work-orders/{id}/accept
// useRejectWorkOrder: PUT /work-orders/{id}/reject（{ id, reason }）
// useCloseWorkOrder: PUT /work-orders/{id}/close
// useCancelWorkOrder: PUT /work-orders/{id}/cancel（{ id, reason }）
```

预计 22+ 测试用例。

- [ ] **Step 2: 编写 useAnalyses.test.tsx**

覆盖 useAnalyses, useAnalysis, useTriggerAnalysis：

```typescript
const mockAnalysis: Analysis = {
  id: 'analysis-001', deviceId: 'device-001', deviceName: '一号水泵',
  level: 'prediction', status: 'completed',
  summary: '预测轴承将在 7 天内需要更换',
  confidence: 0.85, createdAt: '2026-01-15T08:00:00Z',
};

// 测试点：
// useAnalyses: 列表查询、过滤参数（deviceId/level/status）、错误处理
// useAnalysis: 单个详情、id 为空禁用
// useTriggerAnalysis: POST /analyses
```

预计 7+ 测试用例。

- [ ] **Step 3: 运行测试验证通过**

Run: `cd frontend && npx vitest run src/hooks/__tests__/useWorkOrders.test.tsx src/hooks/__tests__/useAnalyses.test.tsx`
Expected: 全部通过

- [ ] **Step 4: Commit**

```bash
git add frontend/src/hooks/__tests__/useWorkOrders.test.tsx frontend/src/hooks/__tests__/useAnalyses.test.tsx
git commit -m "test: 添加 useWorkOrders 和 useAnalyses hooks 单元测试"
```

---

### Task 3: useAlerts + useDispatch + useTelemetry hooks 测试

**Files:**
- Create: `frontend/src/hooks/__tests__/useAlerts.test.tsx`
- Create: `frontend/src/hooks/__tests__/useDispatch.test.tsx`
- Create: `frontend/src/hooks/__tests__/useTelemetry.test.tsx`

- [ ] **Step 1: 编写 useAlerts.test.tsx**

覆盖 useAlerts, useAlert, useAcknowledgeAlert, useResolveAlert：

```typescript
const mockAlert: Alert = {
  id: 'alert-001', deviceId: 'device-001', deviceName: '一号水泵',
  ruleName: '温度过高告警', severity: 'Critical', status: 'triggered',
  message: '温度超过阈值 85°C', metric: 'temperature',
  triggeredAt: '2026-01-15T08:00:00Z',
};

// 测试点：
// useAlerts: 列表查询、过滤参数（status/severity/deviceId）、排序参数、错误处理
// useAlert: 单个详情、id 为空禁用
// useAcknowledgeAlert: PUT /alerts/{id}/acknowledge、invalidate alerts+dashboard
// useResolveAlert: PUT /alerts/{id}/resolve、invalidate alerts+dashboard
```

预计 9+ 测试用例。

- [ ] **Step 2: 编写 useDispatch.test.tsx**

覆盖 useDispatchRecommendations, useTechnicians, useAssignFromRecommendation：

```typescript
// 测试点：
// useDispatchRecommendations: 查询推荐列表、workOrderId 为空/undefined 时禁用
// useTechnicians: 查询技术人员列表、availableOnly 参数
// useAssignFromRecommendation: PUT /work-orders/{workOrderId}/assign、invalidate work-orders+dispatch-recommendations
```

预计 7+ 测试用例。

- [ ] **Step 3: 编写 useTelemetry.test.tsx**

覆盖 useTelemetry：

```typescript
// 测试点：
// 成功获取遥测数据（带 metric/startTime/endTime 参数）
// deviceId 为空时禁用查询
// staleTime 应为 10000ms
// API 错误处理
```

预计 4+ 测试用例。

- [ ] **Step 4: 运行测试验证通过**

Run: `cd frontend && npx vitest run src/hooks/__tests__/useAlerts.test.tsx src/hooks/__tests__/useDispatch.test.tsx src/hooks/__tests__/useTelemetry.test.tsx`
Expected: 全部通过

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/__tests__/useAlerts.test.tsx frontend/src/hooks/__tests__/useDispatch.test.tsx frontend/src/hooks/__tests__/useTelemetry.test.tsx
git commit -m "test: 添加 useAlerts、useDispatch、useTelemetry hooks 单元测试"
```

---

### Task 4: useIntegration + useSubscription + useRegister hooks 测试

**Files:**
- Create: `frontend/src/hooks/__tests__/useIntegration.test.tsx`
- Create: `frontend/src/hooks/__tests__/useSubscription.test.tsx`
- Create: `frontend/src/hooks/__tests__/useRegister.test.tsx`

- [ ] **Step 1: 编写 useIntegration.test.tsx**

覆盖 useIntegrations, useUpdateIntegration, useTestIntegration：

```typescript
// 测试点：
// useIntegrations: GET /settings/integrations、从 { integrations: {...} } 结构中提取
// useUpdateIntegration: PUT /settings/integrations/{type}（{ type, enabled, config }）、invalidate integrations
// useTestIntegration: POST /settings/integrations/{type}/test
```

预计 6+ 测试用例。

- [ ] **Step 2: 编写 useSubscription.test.tsx**

覆盖 useSubscription, useChangePlan：

```typescript
// 测试点：
// useSubscription: GET /admin/tenants/{tenantId}/subscription、tenantId 为空时禁用并返回 null
// useChangePlan: PUT /admin/tenants/{tenantId}/plan（{ tenantId, plan }）、invalidate subscription
```

预计 5+ 测试用例。

- [ ] **Step 3: 编写 useRegister.test.tsx**

覆盖 usePlans, useRegister：

```typescript
// 测试点：
// usePlans: GET /auth/plans、staleTime 应为 600000ms
// useRegister: POST /auth/register、成功返回 AuthResponse、错误处理
```

预计 4+ 测试用例。

- [ ] **Step 4: 运行测试验证通过**

Run: `cd frontend && npx vitest run src/hooks/__tests__/useIntegration.test.tsx src/hooks/__tests__/useSubscription.test.tsx src/hooks/__tests__/useRegister.test.tsx`
Expected: 全部通过

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/__tests__/useIntegration.test.tsx frontend/src/hooks/__tests__/useSubscription.test.tsx frontend/src/hooks/__tests__/useRegister.test.tsx
git commit -m "test: 添加 useIntegration、useSubscription、useRegister hooks 单元测试"
```

---

### Task 5: useApprovals + useOfflineQueue + usePushNotifications hooks 测试

**Files:**
- Create: `frontend/src/hooks/__tests__/useApprovals.test.tsx`
- Create: `frontend/src/hooks/__tests__/useOfflineQueue.test.tsx`
- Create: `frontend/src/hooks/__tests__/usePushNotifications.test.tsx`

- [ ] **Step 1: 编写 useApprovals.test.tsx**

覆盖 useApprovalChains, useWorkOrderApprovals, usePendingApprovals, useCreateApprovalChain, useUpdateApprovalChain, useDeleteApprovalChain, useSubmitWorkOrder, useApproveWorkOrder, useRejectApproval：

```typescript
// Mock 数据
const mockApprovalChain: ApprovalChainTemplate = {
  id: 'chain-001', name: '标准审批流程', steps: [
    { stepOrder: 1, role: 'maintenance_lead', action: 'approve' },
  ], createdAt: '2026-01-15T08:00:00Z',
};

// 测试点：
// useApprovalChains: GET /approval-chains
// useWorkOrderApprovals: GET /work-orders/{id}/approvals、workOrderId 为空禁用
// usePendingApprovals: GET /approval-chains/pending
// useCreateApprovalChain: POST /approval-chains、invalidate approval-chains
// useUpdateApprovalChain: PUT /approval-chains/{id}（解构 { id, ...req }）
// useDeleteApprovalChain: DELETE /approval-chains/{id}
// useSubmitWorkOrder: POST /work-orders/{id}/submit、invalidate work-orders + work-orders/{id}
// useApproveWorkOrder: POST /work-orders/{id}/approve（{ id, comment }）
// useRejectApproval: POST /work-orders/{id}/reject-approval（{ id, comment }）
```

预计 14+ 测试用例。

- [ ] **Step 2: 编写 useOfflineQueue.test.tsx**

覆盖 useOfflineQueue（自定义 hook，需 mock `offlineQueue` 和 `useOfflineStatus`）：

```typescript
vi.mock('../lib/offline', () => ({
  offlineQueue: {
    count: vi.fn(),
    add: vi.fn(),
    sync: vi.fn(),
    getAll: vi.fn(),
    remove: vi.fn(),
    registerBackgroundSync: vi.fn(),
  },
}));

vi.mock('./useOfflineStatus', () => ({
  useOfflineStatus: vi.fn(() => ({ isOnline: true, isOffline: false })),
}));

// 测试点：
// 初始化时调用 refreshCount 获取 pendingCount
// enqueue: 调用 offlineQueue.add + refreshCount、在线时触发 syncNow
// syncNow: 调用 offlineQueue.sync、更新 lastSyncResult、成功时 invalidate 三个 queryKey
// getPending: 调用 offlineQueue.getAll
// removePending: 调用 offlineQueue.remove + refreshCount
```

预计 8+ 测试用例。

- [ ] **Step 3: 编写 usePushNotifications.test.tsx**

覆盖 usePushNotifications（需 mock browser Notification + navigator.serviceWorker）：

```typescript
// Mock Notification API
const mockNotification = {
  permission: 'default',
  requestPermission: vi.fn(),
};
vi.stubGlobal('Notification', mockNotification);

// Mock navigator.serviceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  value: { ready: Promise.resolve({ pushManager: { getSubscription: vi.fn() } }) },
  writable: true,
});

vi.mock('../lib/pushManager', () => ({
  registerPushSubscription: vi.fn(),
  unregisterPushSubscription: vi.fn(),
}));

// 测试点：
// isSupported 检测（serviceWorker + PushManager）
// subscribe: 调用 registerPushSubscription、权限已拒绝时返回 false
// unsubscribe: 调用 unregisterPushSubscription
// checkSubscription: 检查现有订阅状态
```

预计 6+ 测试用例。

- [ ] **Step 4: 运行测试验证通过**

Run: `cd frontend && npx vitest run src/hooks/__tests__/useApprovals.test.tsx src/hooks/__tests__/useOfflineQueue.test.tsx src/hooks/__tests__/usePushNotifications.test.tsx`
Expected: 全部通过

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/__tests__/useApprovals.test.tsx frontend/src/hooks/__tests__/useOfflineQueue.test.tsx frontend/src/hooks/__tests__/usePushNotifications.test.tsx
git commit -m "test: 添加 useApprovals、useOfflineQueue、usePushNotifications hooks 单元测试"
```

---

### Task 6: DeviceForm 组件测试

**Files:**
- Create: `frontend/src/components/device/__tests__/DeviceForm.test.tsx`

**组件行为分析：**
- Props: `device?`, `onSubmit`, `onCancel`, `loading?`
- 使用 React Hook Form + Zod 校验
- 字段: deviceCode（必填）、name（必填）、type（必填 Select）、model（可选）
- 编辑模式: 从 device prop 预填充
- 提交按钮: loading 时禁用

**Mock 依赖：**
- `react-i18next` — mock `useTranslation` 返回 `t: (key: string) => key`

- [ ] **Step 1: 编写 DeviceForm.test.tsx**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeviceForm } from '../DeviceForm';
import type { Device, CreateDeviceRequest } from '../../../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// 测试点：
// 1. 创建模式: 渲染空表单、填写必填字段并提交、校验空必填字段
// 2. 编辑模式: 传入 device prop 预填充表单
// 3. onCancel: 点击取消按钮调用 onCancel
// 4. loading: 提交按钮禁用 + 显示加载文字
// 5. type 选择: Select 下拉选择设备类型
```

预计 6+ 测试用例。

- [ ] **Step 2: 运行测试验证通过**

Run: `cd frontend && npx vitest run src/components/device/__tests__/DeviceForm.test.tsx`
Expected: 全部通过

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/device/__tests__/DeviceForm.test.tsx
git commit -m "test: 添加 DeviceForm 组件单元测试"
```

---

### Task 7: OfflineSyncPanel + OfflineStatusBadge 组件测试

**Files:**
- Create: `frontend/src/components/workorder/__tests__/OfflineSyncPanel.test.tsx`
- Create: `frontend/src/components/workorder/__tests__/OfflineStatusBadge.test.tsx`

- [ ] **Step 1: 编写 OfflineSyncPanel.test.tsx**

```typescript
// Mock hooks
vi.mock('../../../hooks/useOfflineStatus', () => ({
  useOfflineStatus: vi.fn(() => ({ isOnline: true, isOffline: false })),
}));
vi.mock('../../../hooks/useOfflineQueue', () => ({
  useOfflineQueue: vi.fn(() => ({
    pendingCount: 0, isSyncing: false, lastSyncResult: null,
    syncNow: vi.fn(), getPending: vi.fn().mockResolvedValue([]), removePending: vi.fn(),
  })),
}));

// 测试点：
// 1. 在线 + 无待同步: 不渲染（return null）
// 2. 离线 + 无待同步: 显示面板、橙色边框、"离线操作队列"标题
// 3. 在线 + 有待同步: 显示面板、同步按钮
// 4. 显示同步结果: 成功/冲突/失败摘要
// 5. 移除单个待同步操作: 点击 X 按钮调用 removePending
// 6. 同步按钮点击: 调用 syncNow
// 7. 同步中状态: 按钮禁用、显示 "同步中..."
```

预计 7+ 测试用例。

- [ ] **Step 2: 编写 OfflineStatusBadge.test.tsx**

```typescript
// Mock hooks（同 OfflineSyncPanel）
// 测试点：
// 1. 在线 + 无待同步: 不渲染（return null）
// 2. 离线: 显示橙色 Badge + "离线" 文字
// 3. 离线 + 有待同步: 显示 "离线 (N 待同步)"
// 4. 在线 + 有待同步: 显示蓝色 Badge + "N 待同步"
```

预计 4+ 测试用例。

- [ ] **Step 3: 运行测试验证通过**

Run: `cd frontend && npx vitest run src/components/workorder/__tests__/OfflineSyncPanel.test.tsx src/components/workorder/__tests__/OfflineStatusBadge.test.tsx`
Expected: 全部通过

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/workorder/__tests__/OfflineSyncPanel.test.tsx frontend/src/components/workorder/__tests__/OfflineStatusBadge.test.tsx
git commit -m "test: 添加 OfflineSyncPanel 和 OfflineStatusBadge 组件单元测试"
```

---

### Task 8: RuleEditDialog 组件测试

**Files:**
- Create: `frontend/src/components/knowledge/__tests__/RuleEditDialog.test.tsx`

**组件行为分析：**
- Props: `rule: KnowledgeRule | null`, `onClose: () => void`
- 内部使用 `useUpdateKnowledgeRule()` mutation
- rule 非 null 时打开对话框，null 时关闭
- 打开时从 rule 初始化表单状态
- 提交时仅发送变更字段 + changeSummary
- 无变更时直接调用 onClose 不提交

**Mock 依赖：**
- `react-i18next` — mock useTranslation
- `../../hooks/useKnowledge` — mock useUpdateKnowledgeRule

- [ ] **Step 1: 编写 RuleEditDialog.test.tsx**

```typescript
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../../hooks/useKnowledge', () => ({
  useUpdateKnowledgeRule: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

// 测试点：
// 1. rule 为 null: 对话框不打开
// 2. rule 非 null: 对话框打开、表单从 rule 初始化
// 3. 修改名称并提交: 调用 mutate 并传入 { id, name, changeSummary }
// 4. 无变更直接提交: 直接调用 onClose，不调用 mutate
// 5. 点击取消: 调用 onClose
// 6. mutation isPending: 提交按钮禁用
// 7. mutate onSuccess 回调: 调用 onClose
```

预计 7+ 测试用例。

- [ ] **Step 2: 运行测试验证通过**

Run: `cd frontend && npx vitest run src/components/knowledge/__tests__/RuleEditDialog.test.tsx`
Expected: 全部通过

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/knowledge/__tests__/RuleEditDialog.test.tsx
git commit -m "test: 添加 RuleEditDialog 组件单元测试"
```

---

### Task 9: 运行前端全量单元测试验证

- [ ] **Step 1: 运行 `cd frontend && npx vitest run`**

验证所有新增测试 + 原有 93 个测试全部通过。预期测试总数 ~180-220。

Expected: 全部通过，无 regression

---

### Task 10: E2E 设备管理流程测试

**Files:**
- Create: `frontend/e2e/device.spec.ts`

**前置条件：** 后端 dev server (8080) + 前端 dev server (5173) 运行中，数据库有种子数据。

- [ ] **Step 1: 编写 device.spec.ts**

```typescript
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

async function login(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder(/用户名|username/i).fill('admin');
  await page.getByPlaceholder(/密码|password/i).fill('Admin@123');
  await page.getByRole('button', { name: /登录|login/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

test.describe('设备管理流程', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // 1. 导航到设备列表页
  // 2. 创建新设备（点击"新增设备"按钮 → 填写表单 → 提交）
  // 3. 验证设备出现在列表中
  // 4. 查看设备详情（点击设备行）
  // 5. 编辑设备（修改名称 → 保存）
  // 6. 删除设备（确认删除）
});
```

预计 5-6 个测试用例。

- [ ] **Step 2: 运行测试**

Run: `cd frontend && npx playwright test e2e/device.spec.ts --headed`
Expected: 全部通过

- [ ] **Step 3: Commit**

```bash
git add frontend/e2e/device.spec.ts
git commit -m "test: 添加设备管理 E2E 流程测试"
```

---

### Task 11: E2E 告警管理流程测试

**Files:**
- Create: `frontend/e2e/alert.spec.ts`

- [ ] **Step 1: 编写 alert.spec.ts**

```typescript
// 登录 → 导航到告警中心 → 查看告警列表 → 过滤告警 → 确认告警 → 查看告警规则 → 创建规则

// 测试点：
// 1. 导航到告警中心页
// 2. 告警列表加载（表格或空状态）
// 3. 按状态/严重级别过滤
// 4. 确认单条告警
// 5. 导航到告警规则页
// 6. 创建新告警规则
```

预计 5-6 个测试用例。

- [ ] **Step 2: 运行测试**

Run: `cd frontend && npx playwright test e2e/alert.spec.ts --headed`
Expected: 全部通过

- [ ] **Step 3: Commit**

```bash
git add frontend/e2e/alert.spec.ts
git commit -m "test: 添加告警管理 E2E 流程测试"
```

---

### Task 12: E2E 工单管理流程测试

**Files:**
- Create: `frontend/e2e/workorder.spec.ts`

- [ ] **Step 1: 编写 workorder.spec.ts**

```typescript
// 登录 → 创建工单 → 查看工单列表 → 查看工单详情 → 更新工单状态

// 测试点：
// 1. 导航到工单列表页
// 2. 创建新工单（填写标题/描述/优先级 → 提交）
// 3. 验证工单出现在列表中
// 4. 查看工单详情
// 5. 更新工单状态（如：开始执行）
```

预计 5-6 个测试用例。

- [ ] **Step 2: 运行测试**

Run: `cd frontend && npx playwright test e2e/workorder.spec.ts --headed`
Expected: 全部通过

- [ ] **Step 3: Commit**

```bash
git add frontend/e2e/workorder.spec.ts
git commit -m "test: 添加工单管理 E2E 流程测试"
```

---

### Task 13: E2E 知识库管理流程测试

**Files:**
- Create: `frontend/e2e/knowledge.spec.ts`

- [ ] **Step 1: 编写 knowledge.spec.ts**

```typescript
// 登录 → 导航到知识库 → 查看规则列表 → 创建规则 → 编辑规则 → 导出规则

// 测试点：
// 1. 导航到知识库页面
// 2. 规则列表加载
// 3. 创建新知识规则
// 4. 编辑已有规则
// 5. 导出规则
```

预计 5 个测试用例。

- [ ] **Step 2: 运行测试**

Run: `cd frontend && npx playwright test e2e/knowledge.spec.ts --headed`
Expected: 全部通过

- [ ] **Step 3: Commit**

```bash
git add frontend/e2e/knowledge.spec.ts
git commit -m "test: 添加知识库管理 E2E 流程测试"
```

---

### Task 14: 运行全部前端测试验证

- [ ] **Step 1: 运行 `cd frontend && npx vitest run`**

验证全部单元测试通过。Expected: ~180-220 测试用例。

- [ ] **Step 2: 运行 `cd frontend && npx playwright test`**

验证全部 E2E 测试通过。Expected: 原 auth.spec.ts + 新增 4 个 spec 文件。

---

## 自检清单

**Spec 覆盖率：**
- [x] T3-1 所有 21 个缺失 hooks 的测试 → Task 1-5 覆盖
- [x] T3-2 DeviceForm 组件测试 → Task 6
- [x] T3-2 OfflineSyncPanel 组件测试 → Task 7
- [x] T3-2 OfflineStatusBadge 组件测试 → Task 7
- [x] T3-2 RuleEditDialog 组件测试 → Task 8
- [x] T4-1 设备管理 E2E → Task 10
- [x] T4-2 告警管理 E2E → Task 11
- [x] T4-3 工单管理 E2E → Task 12
- [x] T4-4 知识库管理 E2E → Task 13

**Placeholder 扫描：** 无 TBD/TODO/实现后补充 等占位符。

**类型一致性：** 所有 mock 数据结构匹配 `types/index.ts` 中的类型定义。
