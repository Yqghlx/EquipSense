import { test, expect } from '@playwright/test';
import { BASE_URL, getToken } from './helpers';

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });
const jsonHeader = (token: string) => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });

test.describe('14. API 深度验证', () => {
  test('14.1 健康检查', async ({ page }) => {
    expect((await page.request.get(`${BASE_URL}/health/startup`)).ok()).toBeTruthy();
    expect((await page.request.get(`${BASE_URL}/health`)).ok()).toBeTruthy();
    const ready = await page.request.get(`${BASE_URL}/health/ready`);
    expect(ready.status()).toBeLessThan(500);
  });

  test('14.2 登录 API', async ({ page }) => {
    const resp = await page.request.post(`${BASE_URL}/api/v1/auth/login`, {
      data: { username: 'admin', password: 'Admin@123' },
    });
    const body = await resp.json();
    expect(body.accessToken).toBeTruthy();
    expect(body.userInfo.username).toBe('admin');
  });

  test('14.3 设备 CRUD', async ({ page }) => {
    const token = await getToken(page);
    const h = jsonHeader(token);
    const c = await page.request.post(`${BASE_URL}/api/v1/devices`, { headers: h, data: { deviceCode: 'E2E-CRUD', name: 'E2E', type: 'motor' } });
    const dev = await c.json();
    expect(c.ok()).toBeTruthy();
    expect((await page.request.get(`${BASE_URL}/api/v1/devices/${dev.id}`, { headers: authHeader(token) })).ok()).toBeTruthy();
    expect((await page.request.delete(`${BASE_URL}/api/v1/devices/${dev.id}`, { headers: authHeader(token) })).ok()).toBeTruthy();
  });

  test('14.4 工单完整流转', async ({ page }) => {
    const token = await getToken(page);
    const h = jsonHeader(token);
    const c = await page.request.post(`${BASE_URL}/api/v1/work-orders`, { headers: h, data: { title: 'API流转', type: 'Corrective', priority: 'High' } });
    const wo = await c.json();
    const adminId = 'ad2d83f0-558c-4858-bffd-3bd98cb371dc';
    expect((await page.request.put(`${BASE_URL}/api/v1/work-orders/${wo.id}/assign`, { headers: h, data: { assignedTo: adminId } })).ok()).toBeTruthy();
    expect((await page.request.put(`${BASE_URL}/api/v1/work-orders/${wo.id}/start`, { headers: h })).ok()).toBeTruthy();
    expect((await page.request.put(`${BASE_URL}/api/v1/work-orders/${wo.id}/complete`, { headers: h, data: { resolution: 'E2E完成' } })).ok()).toBeTruthy();
    expect((await page.request.put(`${BASE_URL}/api/v1/work-orders/${wo.id}/accept`, { headers: h })).ok()).toBeTruthy();
    expect((await page.request.put(`${BASE_URL}/api/v1/work-orders/${wo.id}/close`, { headers: h })).ok()).toBeTruthy();
  });

  test('14.5 未授权拦截', async ({ page }) => {
    expect((await page.request.get(`${BASE_URL}/api/v1/devices`)).status()).toBe(401);
  });

  test('14.6 告警规则 CRUD', async ({ page }) => {
    const token = await getToken(page);
    const h = jsonHeader(token);
    // 创建
    const c = await page.request.post(`${BASE_URL}/api/v1/alert-rules`, {
      headers: h,
      data: { name: 'E2E-RULE-CRUD', ruleType: 'Threshold', metric: 'temperature', operator: 'GT', threshold: 80, severity: 'High', cooldownSeconds: 300 },
    });
    const rule = await c.json();
    expect(c.ok()).toBeTruthy();
    // 查询
    expect((await page.request.get(`${BASE_URL}/api/v1/alert-rules/${rule.id}`, { headers: authHeader(token) })).ok()).toBeTruthy();
    // 更新
    const u = await page.request.put(`${BASE_URL}/api/v1/alert-rules/${rule.id}`, {
      headers: h,
      data: { name: 'E2E-RULE-UPDATED', ruleType: 'Threshold', metric: 'temperature', operator: 'GT', threshold: 90, severity: 'Critical', cooldownSeconds: 600 },
    });
    expect(u.ok()).toBeTruthy();
    // 删除
    expect((await page.request.delete(`${BASE_URL}/api/v1/alert-rules/${rule.id}`, { headers: authHeader(token) })).ok()).toBeTruthy();
  });

  test('14.7 告警列表查询', async ({ page }) => {
    const token = await getToken(page);
    const resp = await page.request.get(`${BASE_URL}/api/v1/alerts`, {
      headers: authHeader(token),
    });
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(Array.isArray(body.items ?? body)).toBeTruthy();
  });

  test('14.8 用户管理 API', async ({ page }) => {
    const token = await getToken(page);
    const resp = await page.request.get(`${BASE_URL}/api/v1/admin/users`, {
      headers: authHeader(token),
    });
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(Array.isArray(body.items ?? body)).toBeTruthy();
  });

  test('14.9 租户管理 API', async ({ page }) => {
    const token = await getToken(page);
    const list = await page.request.get(`${BASE_URL}/api/v1/admin/tenants`, {
      headers: authHeader(token),
    });
    expect(list.ok()).toBeTruthy();
    const body = await list.json();
    const tenants = body.items ?? body;
    expect(Array.isArray(tenants)).toBeTruthy();
    if (tenants.length > 0) {
      const detail = await page.request.get(`${BASE_URL}/api/v1/admin/tenants/${tenants[0].id}`, {
        headers: authHeader(token),
      });
      expect(detail.ok()).toBeTruthy();
    }
  });

  test('14.10 知识规则 API', async ({ page }) => {
    const token = await getToken(page);
    const h = jsonHeader(token);
    // 查询
    const list = await page.request.get(`${BASE_URL}/api/v1/knowledge/rules`, { headers: authHeader(token) });
    expect(list.ok()).toBeTruthy();
    // 创建
    const c = await page.request.post(`${BASE_URL}/api/v1/knowledge/rules`, {
      headers: h,
      data: { name: 'E2E知识规则', conditions: '温度>80', conclusions: '检查散热系统', category: 'temperature' },
    });
    if (c.ok()) {
      const rule = await c.json();
      // 删除
      await page.request.delete(`${BASE_URL}/api/v1/knowledge/rules/${rule.id}`, { headers: authHeader(token) });
    }
  });

  test('14.11 候选规则查询 API', async ({ page }) => {
    const token = await getToken(page);
    const resp = await page.request.get(`${BASE_URL}/api/v1/knowledge/pending-rules`, {
      headers: authHeader(token),
    });
    expect(resp.ok()).toBeTruthy();
  });

  test('14.12 遥测数据查询', async ({ page }) => {
    const token = await getToken(page);
    const h = authHeader(token);
    // 创建设备
    const dev = await (await page.request.post(`${BASE_URL}/api/v1/devices`, { headers: jsonHeader(token), data: { deviceCode: 'E2E-TELEMETRY', name: 'E2E遥测', type: 'motor' } })).json();
    // 查询遥测
    const resp = await page.request.get(`${BASE_URL}/api/v1/telemetry/${dev.id}?metric=temperature&page=1&pageSize=10`, { headers: h });
    expect(resp.ok()).toBeTruthy();
    // 清理
    await page.request.delete(`${BASE_URL}/api/v1/devices/${dev.id}`, { headers: h });
  });

  test('14.13 系统信息查询', async ({ page }) => {
    const token = await getToken(page);
    const resp = await page.request.get(`${BASE_URL}/api/v1/system/info`, {
      headers: authHeader(token),
    });
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.version || body.buildVersion || body.info).toBeTruthy();
  });
});
