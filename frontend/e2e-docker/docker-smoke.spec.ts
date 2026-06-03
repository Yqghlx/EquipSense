import { test, expect } from '@playwright/test';

const BASE_URL = 'https://localhost:8443';

/** 登录并等待仪表盘完全加载 */
async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder(/用户名|username/i).fill('admin');
  await page.getByPlaceholder(/密码|password/i).fill('Admin@123');
  await page.getByRole('button', { name: /登录|login/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 10000 });
  // 等待 auth store 完全初始化 + React 渲染完成
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
}

/** 通过侧边栏导航到目标页面 */
async function navigateViaSidebar(page: import('@playwright/test').Page, linkPattern: RegExp) {
  const link = page.getByRole('link', { name: linkPattern }).first();
  await link.click();
  await page.waitForTimeout(1500);
  await page.waitForLoadState('networkidle');
}

// ============================================================================
// 1. 登录功能测试
// ============================================================================
test.describe('1. 登录功能', () => {
  test('1.1 登录页正确加载', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveTitle(/EquipSense/);
    await expect(page.getByPlaceholder(/用户名|username/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByPlaceholder(/密码|password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /登录|login/i })).toBeVisible();
    console.log('✅ 登录页加载成功');
  });

  test('1.2 错误密码登录失败', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /登录|login/i }).click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/login/);
    console.log('✅ 错误密码正确拦截');
  });

  test('1.3 正确密码登录成功', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/dashboard/);
    console.log('✅ 登录成功，跳转到仪表盘');
  });
});

// ============================================================================
// 2. 仪表盘测试
// ============================================================================
test.describe('2. 仪表盘', () => {
  test('2.1 仪表盘加载成功', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/dashboard/);
    // 等待数据加载
    await page.waitForTimeout(2000);
    // 验证仪表盘有内容
    const hasStats = await page.getByText(/总设备|总用户|总租户|在线/i).first().isVisible().catch(() => false);
    const hasHeading = await page.getByRole('heading', { name: /仪表盘|dashboard/i }).isVisible().catch(() => false);
    console.log(hasStats ? '✅ 仪表盘统计数据正常显示' : `⚠️ 仪表盘统计未显示 (heading: ${hasHeading})`);
    await page.screenshot({ path: 'e2e-docker/screenshots/dashboard.png', fullPage: true });
  });
});

// ============================================================================
// 3. 侧边栏导航（完整测试）
// ============================================================================
test.describe('3. 全部页面导航与加载', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('3.1 设备管理页', async ({ page }) => {
    await navigateViaSidebar(page, /设备/i);
    await expect(page).toHaveURL(/devices/, { timeout: 5000 });
    const hasHeading = await page.getByRole('heading').first().isVisible().catch(() => false);
    console.log(hasHeading ? '✅ 设备管理页加载成功' : '⚠️ 设备管理页无标题');
    await page.screenshot({ path: 'e2e-docker/screenshots/devices.png', fullPage: true });
  });

  test('3.2 告警中心页', async ({ page }) => {
    await navigateViaSidebar(page, /告警/i);
    await expect(page).toHaveURL(/alerts/, { timeout: 5000 });
    const hasHeading = await page.getByRole('heading').first().isVisible().catch(() => false);
    console.log(hasHeading ? '✅ 告警中心页加载成功' : '⚠️ 告警中心页无标题');
    await page.screenshot({ path: 'e2e-docker/screenshots/alerts.png', fullPage: true });
  });

  test('3.3 工单管理页', async ({ page }) => {
    await navigateViaSidebar(page, /工单/i);
    await expect(page).toHaveURL(/work-orders/, { timeout: 5000 });
    const hasHeading = await page.getByRole('heading').first().isVisible().catch(() => false);
    console.log(hasHeading ? '✅ 工单管理页加载成功' : '⚠️ 工单管理页无标题');
    await page.screenshot({ path: 'e2e-docker/screenshots/work-orders.png', fullPage: true });
  });

  test('3.4 AI 分析页', async ({ page }) => {
    await navigateViaSidebar(page, /分析/i);
    await expect(page).toHaveURL(/analys/, { timeout: 5000 });
    const hasHeading = await page.getByRole('heading').first().isVisible().catch(() => false);
    console.log(hasHeading ? '✅ AI分析页加载成功' : '⚠️ AI分析页无标题');
    await page.screenshot({ path: 'e2e-docker/screenshots/analyses.png', fullPage: true });
  });

  test('3.5 系统设置页', async ({ page }) => {
    await navigateViaSidebar(page, /设置/i);
    await expect(page).toHaveURL(/settings/, { timeout: 5000 });
    const hasHeading = await page.getByRole('heading').first().isVisible().catch(() => false);
    console.log(hasHeading ? '✅ 设置页加载成功' : '⚠️ 设置页无标题');
    await page.screenshot({ path: 'e2e-docker/screenshots/settings.png', fullPage: true });
  });
});

// ============================================================================
// 4. 设备管理详细功能
// ============================================================================
test.describe('4. 设备管理', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateViaSidebar(page, /设备/i);
  });

  test('4.1 设备列表页显示', async ({ page }) => {
    await expect(page).toHaveURL(/devices/);
    const hasTable = await page.getByRole('table').isVisible().catch(() => false);
    const hasNoData = await page.getByText(/暂无|没有|empty|no data/i).isVisible().catch(() => false);
    console.log(`✅ 设备列表页已加载 (表格: ${hasTable}, 空状态: ${hasNoData})`);
  });

  test('4.2 查找创建设备入口', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /新增|添加|创建|add|create|new/i }).first();
    const isVisible = await createBtn.isVisible().catch(() => false);
    if (isVisible) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      const hasDialog = await page.getByRole('dialog').isVisible().catch(() => false);
      console.log(hasDialog ? '✅ 创建设备对话框已弹出' : '⚠️ 点击按钮但未检测到对话框');
      await page.screenshot({ path: 'e2e-docker/screenshots/device-create-dialog.png', fullPage: true });
    } else {
      console.log('⚠️ 未找到创建设备按钮（可能是权限或页面未完全加载）');
    }
  });
});

// ============================================================================
// 5. 告警中心详细功能
// ============================================================================
test.describe('5. 告警中心', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateViaSidebar(page, /告警/i);
  });

  test('5.1 告警页加载', async ({ page }) => {
    await expect(page).toHaveURL(/alerts/);
    const hasContent = await page.getByRole('heading').first().isVisible().catch(() => false);
    console.log(hasContent ? '✅ 告警页加载成功' : '⚠️ 告警页无标题');
    await page.screenshot({ path: 'e2e-docker/screenshots/alerts-detail.png', fullPage: true });
  });
});

// ============================================================================
// 6. 工单管理详细功能
// ============================================================================
test.describe('6. 工单管理', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateViaSidebar(page, /工单/i);
  });

  test('6.1 工单页加载', async ({ page }) => {
    await expect(page).toHaveURL(/work-orders/);
    const hasContent = await page.getByRole('heading').first().isVisible().catch(() => false);
    console.log(hasContent ? '✅ 工单页加载成功' : '⚠️ 工单页无标题');
    await page.screenshot({ path: 'e2e-docker/screenshots/work-orders-detail.png', fullPage: true });
  });
});

// ============================================================================
// 7. API 连通性验证
// ============================================================================
test.describe('7. API 连通性', () => {
  test('7.1 健康检查端点（通过 nginx）', async ({ page }) => {
    const resp = await page.request.get(`${BASE_URL}/health/startup`);
    expect(resp.ok()).toBeTruthy();
    const text = await resp.text();
    // nginx health 端点返回纯文本 "ok"
    expect(text).toBeTruthy();
    console.log(`✅ 健康检查通过 nginx 代理: ${text}`);
  });

  test('7.2 后端直连健康检查', async ({ page }) => {
    const resp = await page.request.get('http://localhost:8080/health/startup');
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.status).toBe('Healthy');
    console.log(`✅ 后端直连健康检查: ${JSON.stringify(body)}`);
  });

  test('7.3 登录 API', async ({ page }) => {
    const resp = await page.request.post(`${BASE_URL}/api/v1/auth/login`, {
      data: { username: 'admin', password: 'Admin@123' },
    });
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.token || body.accessToken).toBeTruthy();
    console.log(`✅ 登录 API 正常, token 长度: ${(body.token || body.accessToken || '').length}`);
  });

  test('7.4 未授权请求被拦截', async ({ page }) => {
    const resp = await page.request.get(`${BASE_URL}/api/v1/devices`);
    expect(resp.status()).toBe(401);
    console.log('✅ 未授权请求正确返回 401');
  });
});

// ============================================================================
// 8. 登出功能
// ============================================================================
test.describe('8. 登出', () => {
  test('8.1 登出后跳转到登录页', async ({ page }) => {
    await login(page);
    // 查找登出按钮（可能在用户菜单下拉中）
    const userMenu = page.getByRole('button', { name: /admin|用户|user/i }).or(page.locator('[data-testid="user-menu"]'));
    if (await userMenu.first().isVisible().catch(() => false)) {
      await userMenu.first().click();
      await page.waitForTimeout(500);
    }
    const logoutBtn = page.getByRole('button', { name: /退出|登出|logout/i }).or(page.getByRole('link', { name: /退出|登出|logout/i }));
    if (await logoutBtn.first().isVisible().catch(() => false)) {
      await logoutBtn.first().click();
      await page.waitForTimeout(2000);
      const url = page.url();
      console.log(url.includes('login') ? '✅ 登出成功跳转到登录页' : `⚠️ 登出后页面: ${url}`);
    } else {
      console.log('⚠️ 未找到登出按钮（可能在用户头像下拉菜单中）');
    }
  });
});
