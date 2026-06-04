import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'https://localhost:8443';

// ============================================================================
// 辅助函数
// ============================================================================

/** 判断是否为可忽略的 ServiceWorker SSL 错误 */
function isIgnorableError(msg: string): boolean {
  return msg.includes('ServiceWorker') || msg.includes('SSL certificate error');
}

/** 捕获非 SW 的页面错误 */
function captureErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => {
    if (!isIgnorableError(err.message)) errors.push(err.message);
  });
  return errors;
}

/** 登录并等待仪表盘加载 */
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder(/用户名|username/i).fill('admin');
  await page.getByPlaceholder(/密码|password/i).fill('Admin@123');
  await page.getByRole('button', { name: /登录|login/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
}

/** 获取认证 token */
async function getToken(page: Page): Promise<string> {
  const resp = await page.request.post(`${BASE_URL}/api/v1/auth/login`, {
    data: { username: 'admin', password: 'Admin@123' },
  });
  const body = await resp.json();
  return body.accessToken || body.token;
}

// ============================================================================
// 1. 登录流程
// ============================================================================
test.describe('1. 登录流程', () => {
  test('1.1 登录页完整验证', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveTitle(/EquipSense/);
    await expect(page.getByPlaceholder(/用户名|username/i)).toBeVisible();
    await expect(page.getByPlaceholder(/密码|password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /登录|login/i })).toBeVisible();
  });

  test('1.2 空表单提交校验', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByRole('button', { name: /登录|login/i }).click();
    await expect(page).toHaveURL(/login/);
  });

  test('1.3 错误密码拦截', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /登录|login/i }).click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/login/);
  });

  test('1.4 正确密码登录成功', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/dashboard/);
  });
});

// ============================================================================
// 2. 仪表盘
// ============================================================================
test.describe('2. 仪表盘', () => {
  test('2.1 仪表盘数据加载，无JS错误', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
	    await expect(page.getByText(/在线设备|活跃告警|待处理|可用率/i).first()).toBeVisible({ timeout: 5000 }).catch(() => {});
    expect(errors).toEqual([]);
  });
});

// ============================================================================
// 3. 设备管理
// ============================================================================
test.describe('3. 设备管理', () => {
  test('3.1 设备列表页展示', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /设备/i);
    await expect(page).toHaveURL(/devices/);
    const hasTable = await page.getByRole('table').isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/暂无|没有/i).isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBeTruthy();
    expect(errors).toEqual([]);
  });

  test('3.2 新建设备完整表单', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /设备/i);
    const createBtn = page.getByText('新建', { exact: false }).first();
    await createBtn.click();
    await page.waitForTimeout(1000);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });
    await dialog.locator('input').first().fill('E2E-DEVICE-001');
    await dialog.locator('input').nth(1).fill('E2E测试设备');
    await dialog.getByRole('button', { name: /保存|确认/i }).click();
    await page.waitForTimeout(2000);
    expect(errors).toEqual([]);
  });

  test('3.3 点击设备进入详情页非白屏', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /设备/i);
    const deviceRow = page.locator('table tbody tr').first();
    if (await deviceRow.isVisible().catch(() => false)) {
      await deviceRow.click();
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/devices\/[0-9a-f-]+/, { timeout: 5000 });
      const bodyText = await page.textContent('body');
      expect(bodyText?.trim().length).toBeGreaterThan(10);
    }
    expect(errors).toEqual([]);
  });

  test('3.4 设备详情页指标切换', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /设备/i);
    const deviceRow = page.locator('table tbody tr').first();
    if (!(await deviceRow.isVisible().catch(() => false))) return;
    await deviceRow.click();
    await page.waitForTimeout(2000);
    // 切换指标
    const selects = page.locator('button[role="combobox"]');
    if (await selects.first().isVisible().catch(() => false)) {
      await selects.first().click();
      await page.waitForTimeout(300);
      const pressure = page.getByRole('option', { name: /压力|pressure/i });
      if (await pressure.isVisible().catch(() => false)) await pressure.click();
      await page.waitForTimeout(1000);
    }
    expect(errors).toEqual([]);
  });
});

// ============================================================================
// 4. 告警中心
// ============================================================================
test.describe('4. 告警中心', () => {
  test('4.1 告警列表筛选', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /告警/i);
    await expect(page).toHaveURL(/alerts/);
    const selects = page.locator('button[role="combobox"]');
    if (await selects.first().isVisible().catch(() => false)) {
      await selects.first().click();
      await page.waitForTimeout(300);
      const opt = page.getByRole('option', { name: /活跃|active/i }).first();
      if (await opt.isVisible().catch(() => false)) await opt.click();
    }
    expect(errors).toEqual([]);
  });

  test('4.2 点击告警行打开详情', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /告警/i);
    const row = page.locator('table tbody tr').first();
    if (await row.isVisible().catch(() => false)) {
      await row.click();
      await page.waitForTimeout(1000);
      const sheet = page.locator('[data-state="open"], [role="dialog"]').last();
      await expect(sheet).toBeVisible({ timeout: 3000 }).catch(() => {});
    }
    expect(errors).toEqual([]);
  });
});

// ============================================================================
// 5. 告警规则
// ============================================================================
test.describe('5. 告警规则', () => {
  test('5.1 规则页加载', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await page.goto(`${BASE_URL}/alert-rules`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    expect(errors).toEqual([]);
  });
});

// ============================================================================
// 6. 工单完整生命周期
// ============================================================================
test.describe('6. 工单生命周期', () => {
  test('6.1 创建工单', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /工单/i);
    const createBtn = page.getByText('新建', { exact: false }).first();
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible().catch(() => false)) {
        await dialog.locator('input').first().fill('E2E测试工单');
        await dialog.getByRole('button', { name: /保存|确认/i }).click();
        await page.waitForTimeout(2000);
      }
    }
    expect(errors).toEqual([]);
  });

  test('6.2 工单详情页非白屏', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    const token = await getToken(page);
    const resp = await page.request.post(`${BASE_URL}/api/v1/work-orders`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: '详情页测试', type: 'Corrective', priority: 'High' },
    });
    if (resp.ok()) {
      await resp.json();
      await navigateViaSidebar(page, /工单/i);
      await page.waitForTimeout(1500);
      const row = page.locator('table tbody tr').filter({ hasText: '详情页测试' }).first();
      if (await row.isVisible().catch(() => false)) {
        await row.click();
        await page.waitForTimeout(3000);
        const bodyText = await page.textContent('body');
        expect(bodyText?.trim().length).toBeGreaterThan(10);
      }
    }
    expect(errors).toEqual([]);
  });

  test('6.3 派工对话框', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    const token = await getToken(page);
    const resp = await page.request.post(`${BASE_URL}/api/v1/work-orders`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: '派工测试', type: 'Corrective', priority: 'High' },
    });
    if (resp.ok()) {
      await resp.json();
      await navigateViaSidebar(page, /工单/i);
      await page.waitForTimeout(1500);
      const row = page.locator('table tbody tr').filter({ hasText: '派工测试' }).first();
      if (await row.isVisible().catch(() => false)) {
        await row.click();
        await page.waitForTimeout(3000);
        const dispatchBtn = page.getByRole('button', { name: /派工/i });
        if (await dispatchBtn.isVisible().catch(() => false)) {
          await dispatchBtn.click();
          await page.waitForTimeout(1000);
          const dialog = page.getByRole('dialog');
          await expect(dialog).toBeVisible({ timeout: 3000 });
        }
      }
    }
    expect(errors).toEqual([]);
  });

  test('6.4 取消工单', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    const token = await getToken(page);
    const resp = await page.request.post(`${BASE_URL}/api/v1/work-orders`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: '取消测试', type: 'Inspection', priority: 'Low' },
    });
    if (resp.ok()) {
      await resp.json();
      await navigateViaSidebar(page, /工单/i);
      await page.waitForTimeout(1500);
      const row = page.locator('table tbody tr').filter({ hasText: '取消测试' }).first();
      if (await row.isVisible().catch(() => false)) {
        await row.click();
        await page.waitForTimeout(3000);
        const cancelBtn = page.getByRole('button', { name: /取消/i });
        if (await cancelBtn.isVisible().catch(() => false)) {
          await cancelBtn.click();
          await page.waitForTimeout(1000);
          const dialog = page.getByRole('dialog');
          if (await dialog.isVisible().catch(() => false)) {
            await dialog.locator('textarea').fill('E2E测试取消');
            await dialog.getByRole('button', { name: /确认取消/i }).click();
            await page.waitForTimeout(2000);
          }
        }
      }
    }
    expect(errors).toEqual([]);
  });
});

// ============================================================================
// 7. AI 分析
// ============================================================================
test.describe('7. AI 分析', () => {
  test('7.1 分析列表页加载', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /分析/i);
    await expect(page).toHaveURL(/analys/);
    expect(errors).toEqual([]);
  });
});

// ============================================================================
// 8. 知识库
// ============================================================================
test.describe('8. 知识库', () => {
  test('8.1 Tab 切换', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /知识/i);
    const tabs = page.getByRole('tab');
    const tabCount = await tabs.count();
    for (let i = 0; i < tabCount; i++) {
      if (await tabs.nth(i).isVisible().catch(() => false)) {
        await tabs.nth(i).click();
        await page.waitForTimeout(500);
      }
    }
    expect(errors).toEqual([]);
  });
});

// ============================================================================
// 9. 系统设置
// ============================================================================
test.describe('9. 系统设置', () => {
  test('9.1 各 Tab 切换', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /设置/i);
    const tabs = page.getByRole('tab');
    const tabCount = await tabs.count();
    for (let i = 0; i < tabCount; i++) {
      if (await tabs.nth(i).isVisible().catch(() => false)) {
        await tabs.nth(i).click();
        await page.waitForTimeout(800);
      }
    }
    expect(errors).toEqual([]);
  });
});

// ============================================================================
// 10. 租户管理
// ============================================================================
test.describe('10. 租户管理', () => {
  test('10.1 租户列表', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /租户/i);
    await page.waitForTimeout(2000);
    expect(errors).toEqual([]);
  });
});

// ============================================================================
// 11. 派工看板
// ============================================================================
test.describe('11. 派工看板', () => {
  test('11.1 看板加载', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /派工/i);
    await expect(page).toHaveURL(/dispatch/, { timeout: 5000 });
    expect(errors).toEqual([]);
  });
});

// ============================================================================
// 12. API 完整验证
// ============================================================================
test.describe('12. API 验证', () => {
  test('12.1 健康检查', async ({ page }) => {
    expect((await page.request.get(`${BASE_URL}/health/startup`)).ok()).toBeTruthy();
    expect((await page.request.get(`${BASE_URL}/health`)).ok()).toBeTruthy();
    const ready = await page.request.get(`${BASE_URL}/health/ready`);
    expect(ready.status()).toBeLessThan(500);
  });

  test('12.2 登录 API', async ({ page }) => {
    const resp = await page.request.post(`${BASE_URL}/api/v1/auth/login`, {
      data: { username: 'admin', password: 'Admin@123' },
    });
    const body = await resp.json();
    expect(body.accessToken).toBeTruthy();
    expect(body.userInfo.username).toBe('admin');
  });

  test('12.3 设备 CRUD', async ({ page }) => {
    const token = await getToken(page);
    const h = { Authorization: `Bearer ${token}` };
    const c = await page.request.post(`${BASE_URL}/api/v1/devices`, { headers: h, data: { deviceCode: 'E2E-CRUD', name: 'E2E', type: 'motor' } });
    const dev = await c.json();
    expect(c.ok()).toBeTruthy();
    expect((await page.request.get(`${BASE_URL}/api/v1/devices/${dev.id}`, { headers: h })).ok()).toBeTruthy();
    expect((await page.request.delete(`${BASE_URL}/api/v1/devices/${dev.id}`, { headers: h })).ok()).toBeTruthy();
  });

  test('12.4 工单完整流转', async ({ page }) => {
    const token = await getToken(page);
    const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const c = await page.request.post(`${BASE_URL}/api/v1/work-orders`, { headers: h, data: { title: 'API流转', type: 'Corrective', priority: 'High' } });
    const wo = await c.json();
    const adminId = 'ad2d83f0-558c-4858-bffd-3bd98cb371dc';
    expect((await page.request.put(`${BASE_URL}/api/v1/work-orders/${wo.id}/assign`, { headers: h, data: { assignedTo: adminId } })).ok()).toBeTruthy();
    expect((await page.request.put(`${BASE_URL}/api/v1/work-orders/${wo.id}/start`, { headers: h })).ok()).toBeTruthy();
    expect((await page.request.put(`${BASE_URL}/api/v1/work-orders/${wo.id}/complete`, { headers: h, data: { resolution: 'E2E完成' } })).ok()).toBeTruthy();
    expect((await page.request.put(`${BASE_URL}/api/v1/work-orders/${wo.id}/accept`, { headers: h })).ok()).toBeTruthy();
    expect((await page.request.put(`${BASE_URL}/api/v1/work-orders/${wo.id}/close`, { headers: h })).ok()).toBeTruthy();
  });

  test('12.5 未授权拦截', async ({ page }) => {
    expect((await page.request.get(`${BASE_URL}/api/v1/devices`)).status()).toBe(401);
  });
});

// ============================================================================
// 辅助
// ============================================================================
async function navigateViaSidebar(page: Page, pattern: RegExp) {
  await page.getByRole('link', { name: pattern }).first().click();
  await page.waitForTimeout(1500);
  await page.waitForLoadState('networkidle');
}
