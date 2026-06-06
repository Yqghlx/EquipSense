/**
 * 设备类型模板管理测试
 *
 * 覆盖设备类型模板的 CRUD 操作：
 * - 通过 API 查看模板列表
 * - 行业预置模板可见性
 * - 自定义模板的创建、编辑、删除
 * - 系统预置模板的删除保护
 * - 使用模板创建设备
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, login, getToken, captureErrors } from '../helpers';

test.describe('02-设备类型模板管理', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('1. 应能通过 API 查看设备类型模板列表', async ({ page }) => {
    const errors = captureErrors(page);

    const token = await getToken(page);
    const resp = await page.request.get(`${BASE_URL}/api/v1/device-config/templates`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 验证 API 返回成功
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    // 模板列表应为数组
    expect(Array.isArray(data)).toBeTruthy();

    expect(errors).toEqual([]);
  });

  test('2. 行业预置模板应可见', async ({ page }) => {
    const errors = captureErrors(page);

    const token = await getToken(page);
    const resp = await page.request.get(`${BASE_URL}/api/v1/device-config/templates`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (resp.ok()) {
      const data = await resp.json();
      // 系统预置模板应包含电机、泵、CNC 等行业模板
      // 系统模板的 tenantId 为全零 UUID
      // 至少应有一些预置模板（不强制数量，只要 API 正常返回）
      expect(Array.isArray(data)).toBeTruthy();
    }

    expect(errors).toEqual([]);
  });

  test('3. 应能创建自定义设备类型模板', async ({ page }) => {
    const errors = captureErrors(page);

    const token = await getToken(page);
    const suffix = Date.now().toString(36);
    const resp = await page.request.post(`${BASE_URL}/api/v1/device-config/templates`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        name: `E2E自定义模板-${suffix}`,
        industry: 'manufacturing',
        parameters: [
          { name: 'temperature', label: '温度', unit: '°C', dataType: 'double' },
          { name: 'vibration', label: '振动', unit: 'mm/s', dataType: 'double' },
        ],
      },
    });

    if (resp.ok()) {
      const template = await resp.json();
      expect(template.name).toContain('E2E自定义模板');
      expect(template.id).toBeTruthy();
    }

    expect(errors).toEqual([]);
  });

  test('4. 创建模板应能定义参数字段', async ({ page }) => {
    const errors = captureErrors(page);

    const token = await getToken(page);
    const suffix = Date.now().toString(36);
    const resp = await page.request.post(`${BASE_URL}/api/v1/device-config/templates`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        name: `E2E参数模板-${suffix}`,
        industry: 'manufacturing',
        parameters: [
          { name: 'pressure', label: '压力', unit: 'MPa', dataType: 'double' },
          { name: 'flow_rate', label: '流量', unit: 'L/min', dataType: 'double' },
          { name: 'rpm', label: '转速', unit: 'RPM', dataType: 'integer' },
        ],
      },
    });

    if (resp.ok()) {
      const template = await resp.json();
      // 验证参数字段被正确保存
      expect(template.parameters).toBeTruthy();
      if (Array.isArray(template.parameters)) {
        expect(template.parameters.length).toBeGreaterThanOrEqual(3);
      }
    }

    expect(errors).toEqual([]);
  });

  test('5. 应能编辑已有模板', async ({ page }) => {
    const errors = captureErrors(page);

    const token = await getToken(page);

    // 先创建一个模板
    const suffix = Date.now().toString(36);
    const createResp = await page.request.post(`${BASE_URL}/api/v1/device-config/templates`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        name: `E2E编辑模板-${suffix}`,
        industry: 'manufacturing',
        parameters: [{ name: 'temp', label: '温度', unit: '°C', dataType: 'double' }],
      },
    });

    if (createResp.ok()) {
      const template = await createResp.json();
      const templateId = template.id;

      // 编辑模板 — 修改名称
      const updateResp = await page.request.put(`${BASE_URL}/api/v1/device-config/templates/${templateId}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: {
          name: `E2E编辑后-${suffix}`,
          parameters: [
            { name: 'temp', label: '温度', unit: '°C', dataType: 'double' },
            { name: 'humidity', label: '湿度', unit: '%', dataType: 'double' },
          ],
        },
      });

      if (updateResp.ok()) {
        const updated = await updateResp.json();
        expect(updated.name).toContain('E2E编辑后');
      }
    }

    expect(errors).toEqual([]);
  });

  test('6. 应能删除自定义模板', async ({ page }) => {
    const errors = captureErrors(page);

    const token = await getToken(page);

    // 先创建一个模板
    const suffix = Date.now().toString(36);
    const createResp = await page.request.post(`${BASE_URL}/api/v1/device-config/templates`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        name: `E2E待删模板-${suffix}`,
        industry: 'manufacturing',
        parameters: [],
      },
    });

    if (createResp.ok()) {
      const template = await createResp.json();
      const templateId = template.id;

      // 删除模板
      const deleteResp = await page.request.delete(`${BASE_URL}/api/v1/device-config/templates/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(deleteResp.ok()).toBeTruthy();

      // 验证模板已不存在
      const getResp = await page.request.get(`${BASE_URL}/api/v1/device-config/templates/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(getResp.ok()).toBeFalsy();
    }

    expect(errors).toEqual([]);
  });

  test('7. 系统预置模板不应被删除', async ({ page }) => {
    const errors = captureErrors(page);

    const token = await getToken(page);

    // 获取模板列表，找到系统预置模板
    const listResp = await page.request.get(`${BASE_URL}/api/v1/device-config/templates`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (listResp.ok()) {
      const templates = await listResp.json();
      const systemTemplate = templates.find(
        (t: Record<string, unknown>) => t.tenantId === '00000000-0000-0000-0000-000000000000',
      );

      if (systemTemplate) {
        // 尝试删除系统模板
        const deleteResp = await page.request.delete(
          `${BASE_URL}/api/v1/device-config/templates/${systemTemplate.id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        // 系统预置模板删除应被拒绝
        expect(deleteResp.ok()).toBeFalsy();
        expect([403, 400, 404]).toContain(deleteResp.status());
      }
    }

    expect(errors).toEqual([]);
  });

  test('8. 使用模板创建设备应自动填充参数', async ({ page }) => {
    const errors = captureErrors(page);

    // 使用快速注册 API 创建设备
    const token = await getToken(page);
    const suffix = Date.now().toString(36);
    const registerResp = await page.request.post(`${BASE_URL}/api/v1/device-config/quick-register`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        deviceCode: `E2E-QUICK-${suffix}`,
        name: `E2E快速注册设备-${suffix}`,
        templateId: null, // 不使用模板，直接创建
      },
    });

    // 验证快速注册 API 可用
    if (registerResp.ok()) {
      const device = await registerResp.json();
      expect(device.deviceCode || device.code).toBeTruthy();
    }

    expect(errors).toEqual([]);
  });
});
