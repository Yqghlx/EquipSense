/**
 * 告警规则在线启停用端到端测试
 *
 * 覆盖本轮新增的告警规则 toggle 功能：
 * - 告警规则页面展示启用状态开关
 * - 点击 Switch 可切换启用/停用状态
 * - toggle 端点返回正确状态（API 验证）
 */
import { test, expect } from '@playwright/test';
import {
  BASE_URL, login, captureErrors, navigateViaSidebar, getToken,
} from '../helpers';

test.describe('05-告警规则启停用', () => {
  test('1. 告警规则页面的 Switch 可点击切换状态', async ({ page }) => {
    const errors = captureErrors(page);

    await login(page);
    await navigateViaSidebar(page, /告警规则|alert.?rule/i);
    await page.waitForTimeout(1500);

    // 规则表格应可见
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 10000 });

    // 找到第一个规则行的 Switch（role=switch）
    const switches = page.getByRole('switch');
    const count = await switches.count();
    if (count > 0) {
      const firstSwitch = switches.first();
      const stateBefore = await firstSwitch.getAttribute('aria-checked');

      // 点击切换
      await firstSwitch.click();
      await page.waitForTimeout(1500);

      // 状态应改变
      const stateAfter = await firstSwitch.getAttribute('aria-checked');
      expect(stateAfter).not.toBe(stateBefore);
    }

    expect(errors.get()).toEqual([]);
  });

  test('2. toggle API 端点正确切换状态', async ({ request }) => {
    const token = await getToken();
    expect(token).toBeTruthy();

    // 获取第一条规则
    const listResp = await request.get(`${BASE_URL}/api/v1/alert-rules?page=1&pageSize=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(listResp.status()).toBe(200);
    const list = await listResp.json();
    const rule = list.items?.[0];

    if (rule) {
      const stateBefore = rule.enabled;

      // 调用 toggle
      const toggleResp = await request.put(`${BASE_URL}/api/v1/alert-rules/${rule.id}/toggle`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(toggleResp.status()).toBe(200);

      const toggled = await toggleResp.json();
      expect(toggled.enabled).toBe(!stateBefore);

      // 切换回来（恢复原状）
      await request.put(`${BASE_URL}/api/v1/alert-rules/${rule.id}/toggle`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  });
});
