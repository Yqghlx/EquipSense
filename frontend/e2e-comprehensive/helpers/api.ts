/**
 * API 请求封装
 *
 * 提供 E2E 测试中常用的后端 API 操作，包括设备、告警规则、工单、
 * 知识规则、待审批规则等资源的增删改查。
 * 所有请求自动获取 Token 并携带认证头。
 */
import { expect, type Page } from '@playwright/test';
import { getCurrentUserId, getToken } from './auth';
import { BASE_URL } from './auth';

// ---------------------------------------------------------------------------
// 设备相关 API
// ---------------------------------------------------------------------------

/**
 * 创建 E2E 测试设备
 *
 * 设备编码和名称以 "E2E-" 为前缀，便于后续清理。
 *
 * @param page - Playwright Page 实例
 * @param prefix - 设备编码前缀（默认 "E2E-DEV"）
 * @param type - 设备类型（默认 "motor"）
 * @returns API 响应 JSON（含设备 ID 等字段）
 */
export async function createTestDevice(
  page: Page,
  prefix = 'E2E-DEV',
  type = 'motor',
): Promise<Record<string, unknown>> {
  const token = await getToken(page);
  // 时间戳 + 随机字符串，避免并行测试中设备编码冲突
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  const resp = await page.request.post(`${BASE_URL}/api/v1/devices`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      deviceCode: `${prefix}-${suffix}`,
      name: `E2E测试设备-${suffix}`,
      type,
    },
  });
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/**
 * 通过 API 创建设备（保留原有接口，兼容旧调用）
 *
 * @param page - Playwright Page 实例
 * @param token - 认证 Token
 * @param overrides - 覆盖字段
 * @returns API 响应 JSON
 */
export async function createDeviceViaAPI(
  page: Page,
  token: string,
  overrides: Record<string, string> = {},
): Promise<Record<string, unknown>> {
  // 时间戳 + 随机字符串，避免并行测试中设备编码冲突
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const resp = await page.request.post(`${BASE_URL}/api/v1/devices`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      deviceCode: `E2E-DEV-${suffix}`,
      name: 'E2E测试设备',
      type: 'motor',
      ...overrides,
    },
  });
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/**
 * 通过 API 删除设备
 */
export async function deleteDeviceViaAPI(
  page: Page,
  token: string,
  id: string,
): Promise<void> {
  await page.request.delete(`${BASE_URL}/api/v1/devices/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ---------------------------------------------------------------------------
// 告警规则相关 API
// ---------------------------------------------------------------------------

/**
 * 创建阈值类型告警规则
 *
 * @param page - Playwright Page 实例
 * @param name - 规则名称（不传则自动生成 E2E- 前缀名称）
 * @param enabled - 是否启用（默认 true）
 * @param deviceId - 可选的设备 ID；传入后规则只匹配该设备，避免 E2E 测试受到其他全局规则污染
 * @returns API 响应 JSON
 */
export async function createThresholdRule(
  page: Page,
  name?: string,
  enabled = true,
  deviceId?: string,
): Promise<Record<string, unknown>> {
  const token = await getToken(page);
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const ruleName = name || `E2E-RULE-THRESHOLD-${suffix}`;

  const data: Record<string, unknown> = {
    name: ruleName,
    ruleType: 'Threshold',
    metric: 'temperature',
    operator: 'GT',
    threshold: 80,
    severity: 'High',
    cooldownSeconds: 300,
    enabled,
  };
  if (deviceId) data.deviceId = deviceId;

  const resp = await page.request.post(`${BASE_URL}/api/v1/alert-rules`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data,
  });
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/**
 * 创建组合类型告警规则
 *
 * 组合规则需要同时满足多个指标条件才触发告警。
 *
 * @param page - Playwright Page 实例
 * @param name - 规则名称（不传则自动生成）
 * @returns API 响应 JSON
 */
export async function createCompositeRule(
  page: Page,
  name?: string,
): Promise<Record<string, unknown>> {
  const token = await getToken(page);
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const ruleName = name || `E2E-RULE-COMPOSITE-${suffix}`;

  const resp = await page.request.post(`${BASE_URL}/api/v1/alert-rules`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: {
      name: ruleName,
      ruleType: 'Composite',
      conditions: [
        { metric: 'temperature', operator: 'GT', threshold: 80 },
        { metric: 'vibration', operator: 'GT', threshold: 5 },
      ],
      logicOperator: 'AND',
      severity: 'Critical',
      cooldownSeconds: 300,
    },
  });
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/**
 * 创建基线类型告警规则
 *
 * 基线规则基于历史数据统计（均值+标准差）自动计算阈值，
 * 当实际值偏离基线超过指定倍数时触发告警。
 *
 * @param page - Playwright Page 实例
 * @param name - 规则名称（不传则自动生成）
 * @returns API 响应 JSON
 */
export async function createBaselineRule(
  page: Page,
  name?: string,
): Promise<Record<string, unknown>> {
  const token = await getToken(page);
  const suffix = Date.now().toString(36);
  const ruleName = name || `E2E-RULE-BASELINE-${suffix}`;

  const resp = await page.request.post(`${BASE_URL}/api/v1/alert-rules`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: {
      name: ruleName,
      ruleType: 'Baseline',
      metric: 'temperature',
      baselineWindow: 24,
      sensitivity: 2,
      severity: 'Medium',
      cooldownSeconds: 300,
    },
  });
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/**
 * 通过 API 创建告警规则（保留原有接口，兼容旧调用）
 */
export async function createAlertRuleViaAPI(
  page: Page,
  token: string,
  overrides: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  const suffix = Date.now().toString(36);
  const resp = await page.request.post(`${BASE_URL}/api/v1/alert-rules`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: {
      name: `E2E-RULE-${suffix}`,
      ruleType: 'Threshold',
      metric: 'temperature',
      operator: 'GT',
      threshold: 80,
      severity: 'High',
      cooldownSeconds: 300,
      ...overrides,
    },
  });
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/**
 * 通过 API 删除告警规则
 */
export async function deleteAlertRuleViaAPI(
  page: Page,
  token: string,
  id: string,
): Promise<void> {
  await page.request.delete(`${BASE_URL}/api/v1/alert-rules/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ---------------------------------------------------------------------------
// 告警相关 API
// ---------------------------------------------------------------------------

/**
 * 通过 API 触发告警
 *
 * 发送超出阈值的遥测数据来触发告警规则。
 *
 * @param page - Playwright Page 实例
 * @param options - 触发选项（设备 ID、指标、阈值等）
 * @returns API 响应 JSON
 */
export async function triggerAlertViaAPI(
  page: Page,
  options: {
    deviceId: string;
    metric?: string;
    value?: number;
  },
): Promise<Record<string, unknown>> {
  const token = await getToken(page);
  const { deviceId, metric = 'temperature', value = 100 } = options;

  const resp = await page.request.post(`${BASE_URL}/api/v1/telemetry`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: {
      deviceId,
      metrics: { [metric]: value },
      timestamp: new Date().toISOString(),
    },
  });
  return resp.json();
}

/**
 * 通过 API 查询告警列表
 *
 * @param page - Playwright Page 实例
 * @param filter - 查询过滤条件（设备 ID、严重级别、状态等）
 * @returns 告警列表
 */
export async function getAlertsViaAPI(
  page: Page,
  filter: {
    deviceId?: string;
    severity?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<Record<string, unknown>> {
  const token = await getToken(page);
  const params = new URLSearchParams();
  if (filter.deviceId) params.set('deviceId', filter.deviceId);
  if (filter.severity) params.set('severity', filter.severity);
  if (filter.status) params.set('status', filter.status);
  if (filter.page) params.set('page', String(filter.page));
  if (filter.pageSize) params.set('pageSize', String(filter.pageSize));

  const qs = params.toString();
  const url = `${BASE_URL}/api/v1/alerts${qs ? `?${qs}` : ''}`;

  const resp = await page.request.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return resp.json();
}

// ---------------------------------------------------------------------------
// 工单相关 API
// ---------------------------------------------------------------------------

/**
 * 创建 E2E 测试工单
 *
 * 标题以 "E2E-" 为前缀，便于后续清理。
 *
 * @param page - Playwright Page 实例
 * @param title - 工单标题
 * @param type - 工单类型（默认 "Corrective"）
 * @param priority - 优先级（默认 "High"）
 * @param deviceId - 关联设备 ID（可选）
 * @param description - 工单描述（可选）
 * @returns API 响应 JSON
 */
export async function createTestWorkOrder(
  page: Page,
  title: string,
  type = 'Corrective',
  priority = 'High',
  deviceId?: string,
  description?: string,
): Promise<Record<string, unknown>> {
  const token = await getToken(page);
  const suffix = Date.now().toString(36);
  const woTitle = title.startsWith('E2E-') ? title : `E2E-WO-${suffix}`;

  const data: Record<string, unknown> = {
    title: woTitle,
    type,
    priority,
  };
  if (deviceId) data.deviceId = deviceId;
  if (description) data.description = description;

  /** 并行测试时 API 可能瞬时失败，最多重试 3 次 */
  let resp: import('@playwright/test').APIResponse | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    resp = await page.request.post(`${BASE_URL}/api/v1/work-orders`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data,
    });
    if (resp.ok()) break;
    if (attempt < 2) await page.waitForTimeout(500);
  }
  expect(resp!.ok()).toBeTruthy();
  return resp!.json();
}

/**
 * 通过 API 创建工单（保留原有接口，兼容旧调用）
 */
export async function createWorkOrderViaAPI(
  page: Page,
  token: string,
  overrides: Record<string, string> = {},
): Promise<Record<string, unknown>> {
  const suffix = Date.now().toString(36);
  const resp = await page.request.post(`${BASE_URL}/api/v1/work-orders`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      title: `E2E-WO-${suffix}`,
      type: 'Corrective',
      priority: 'High',
      ...overrides,
    },
  });
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/**
 * 工单状态流转辅助
 *
 * 公开导出，供测试文件直接调用工单状态变更。
 *
 * @param page - Playwright Page 实例
 * @param token - 认证 Token
 * @param id - 工单 ID
 * @param action - 流转动作（assign / start / complete / close / cancel）
 * @param data - 附带数据（如 assignedTo、resolution 等）
 * @returns API 响应
 */
export async function transitionWorkOrder(
  page: Page,
  token: string,
  id: string,
  action: string,
  data?: Record<string, unknown>,
): Promise<ReturnType<Page['request']['put']>> {
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const resp = await page.request.put(`${BASE_URL}/api/v1/work-orders/${id}/${action}`, {
    headers,
    data: data ?? {},
  });
  return resp;
}

/**
 * 派工：将工单指派给指定用户
 *
 * @param page - Playwright Page 实例
 * @param woId - 工单 ID
 * @param userId - 被指派人用户 ID；省略时使用当前已认证用户
 */
export async function assignWorkOrder(
  page: Page,
  woId: string,
  userId?: string,
): Promise<void> {
  const token = await getToken(page);
  const assignedTo = userId ?? await getCurrentUserId(page);
  const response = await transitionWorkOrder(page, token, woId, 'assign', { assignedTo });
  expect(response.ok()).toBeTruthy();
}

/**
 * 开始执行工单
 *
 * @param page - Playwright Page 实例
 * @param woId - 工单 ID
 */
export async function startWorkOrder(page: Page, woId: string): Promise<void> {
  const token = await getToken(page);
  await transitionWorkOrder(page, token, woId, 'start');
}

/**
 * 完成工单
 *
 * @param page - Playwright Page 实例
 * @param woId - 工单 ID
 * @param resolution - 解决方案描述
 */
export async function completeWorkOrder(
  page: Page,
  woId: string,
  resolution: string,
): Promise<void> {
  const token = await getToken(page);
  await transitionWorkOrder(page, token, woId, 'complete', { resolution });
}

/**
 * 关闭工单
 *
 * @param page - Playwright Page 实例
 * @param woId - 工单 ID
 */
export async function closeWorkOrder(page: Page, woId: string): Promise<void> {
  const token = await getToken(page);
  await transitionWorkOrder(page, token, woId, 'close');
}

// ---------------------------------------------------------------------------
// 知识规则相关 API
// ---------------------------------------------------------------------------

/**
 * 创建知识规则
 *
 * 知识规则需要经过专家验证后才会生效。
 *
 * @param page - Playwright Page 实例
 * @param name - 规则名称（不传则自动生成）
 * @param enabled - 是否启用（默认 true）
 * @returns API 响应 JSON
 */
export async function createKnowledgeRule(
  page: Page,
  name?: string,
  enabled = true,
): Promise<Record<string, unknown>> {
  const token = await getToken(page);
  const suffix = Date.now().toString(36);
  const ruleName = name || `E2E-KNOWLEDGE-${suffix}`;

  const resp = await page.request.post(`${BASE_URL}/api/v1/knowledge-rules`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: {
      name: ruleName,
      description: 'E2E 测试知识规则',
      conditions: {
        metric: 'temperature',
        operator: 'GT',
        threshold: 90,
        duration: '5m',
      },
      recommendation: '检查冷却系统是否正常运行',
      severity: 'High',
      deviceType: 'motor',
      enabled,
    },
  });
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

// ---------------------------------------------------------------------------
// 待审批规则相关 API
// ---------------------------------------------------------------------------

/** 创建待审批规则的选项 */
export interface CreatePendingRuleOptions {
  /** 规则名称 */
  name?: string;
  /** 触发条件 */
  conditions?: Record<string, unknown>;
  /** AI 建议 */
  recommendation?: string;
  /** 置信度（0-1） */
  confidence?: number;
  /** 来源（如 "ai" 或 "manual"） */
  source?: string;
}

/**
 * 创建待审批规则
 *
 * AI 生成的规则先写入 pending_rules，专家批准后才移入 knowledge_rules。
 *
 * @param page - Playwright Page 实例
 * @param options - 待审批规则选项
 * @returns API 响应 JSON
 */
export async function createPendingRule(
  page: Page,
  options: CreatePendingRuleOptions = {},
): Promise<Record<string, unknown>> {
  const token = await getToken(page);
  const suffix = Date.now().toString(36);

  const resp = await page.request.post(`${BASE_URL}/api/v1/knowledge/pending-rules`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: {
      name: options.name || `E2E-PENDING-${suffix}`,
      conditions: options.conditions || {
        metric: 'temperature',
        operator: 'GT',
        threshold: 95,
      },
      recommendation: options.recommendation || 'E2E 测试：建议检查冷却系统',
      confidence: options.confidence ?? 0.85,
      source: options.source || 'ai',
    },
  });
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/**
 * 审批通过待审批规则
 *
 * @param page - Playwright Page 实例
 * @param id - 待审批规则 ID
 */
export async function approvePendingRule(
  page: Page,
  id: string,
): Promise<void> {
  const token = await getToken(page);
  const resp = await page.request.put(`${BASE_URL}/api/v1/knowledge/pending-rules/${id}/approve`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: {},
  });
  expect(resp.ok()).toBeTruthy();
}

/**
 * 审批拒绝待审批规则
 *
 * @param page - Playwright Page 实例
 * @param id - 待审批规则 ID
 * @param reason - 拒绝原因
 */
export async function rejectPendingRule(
  page: Page,
  id: string,
  reason: string,
): Promise<void> {
  const token = await getToken(page);
  const resp = await page.request.put(`${BASE_URL}/api/v1/knowledge/pending-rules/${id}/reject`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { reason },
  });
  expect(resp.ok()).toBeTruthy();
}
