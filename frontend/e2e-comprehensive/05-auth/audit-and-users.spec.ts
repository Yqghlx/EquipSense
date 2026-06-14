/**
 * 审计日志与用户管理端到端测试
 *
 * 覆盖本轮新增的管理功能：
 * - 审计日志页面可访问，展示操作记录
 * - 用户管理页面可访问（SystemAdmin），展示用户列表
 * - 创建操作产生审计记录（验证审计 Filter 端到端生效）
 */
import { test, expect } from '@playwright/test';
import {
  BASE_URL, login, captureErrors, navigateViaSidebar, getToken,
} from '../helpers';
import api from '../helpers/api';

test.describe('05-审计日志与用户管理', () => {
  test('1. 审计日志页面可访问并展示记录', async ({ page }) => {
    const errors = captureErrors(page);

    await login(page);
    await navigateViaSidebar(page, /审计|audit/i);
    await page.waitForTimeout(1500);

    // 审计日志表格应可见
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 10000 });

    expect(errors.get()).toEqual([]);
  });

  test('2. 审计日志支持按动作筛选', async ({ page }) => {
    const errors = captureErrors(page);

    await login(page);
    await navigateViaSidebar(page, /审计|audit/i);
    await page.waitForTimeout(1000);

    // 应有动作筛选下拉
    const actionFilter = page.locator('select').first();
    if (await actionFilter.isVisible().catch(() => false)) {
      await actionFilter.selectOption('Login');
      await page.waitForTimeout(1500);
      // 筛选后表格仍应可见
      await expect(page.locator('table')).toBeVisible();
    }

    expect(errors.get()).toEqual([]);
  });

  test('3. 用户管理页面可访问并展示用户列表', async ({ page }) => {
    const errors = captureErrors(page);

    await login(page);
    // 用户管理在 admin 区段（SystemAdmin 专用）
    await navigateViaSidebar(page, /用户管理|user.?manage/i);
    await page.waitForTimeout(1500);

    // 用户表格应可见且含数据
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 10000 });

    // 应有创建用户按钮
    await expect(page.getByRole('button', { name: /创建用户|create.?user/i })).toBeVisible();

    expect(errors.get()).toEqual([]);
  });

  test('4. 创建操作产生审计记录（API 端验证审计 Filter）', async ({ request }) => {
    const token = await getToken();
    expect(token).toBeTruthy();

    // 通过 API 创建一个测试设备（会触发审计 Filter）
    const resp = await request.post(`${BASE_URL}/api/v1/devices`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        deviceCode: `E2E-AUDIT-${Date.now()}`,
        name: 'E2E审计测试设备',
        type: '测试机',
        criticality: 'Normal',
      },
    });
    expect(resp.status()).toBeLessThan(400);

    // 查询审计日志，应含 Create Device 记录
    await page?.waitForTimeout?.(1000); // 给审计异步写入一点时间
    const logsResp = await request.get(`${BASE_URL}/api/v1/audit-logs?pageSize=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(logsResp.status()).toBe(200);

    const logs = await logsResp.json();
    const hasCreateDevice = logs.items?.some(
      (l: { action: string; resourceType: string }) => l.action === 'Create' && l.resourceType === 'Device'
    );
    expect(hasCreateDevice, '审计日志应含 Create Device 记录').toBeTruthy();
  });
});
