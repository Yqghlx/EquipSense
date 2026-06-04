import { test, expect } from '@playwright/test';

const BASE_URL = 'https://localhost:8443';

test('直接导航诊断', async ({ page }) => {
  // 1. 登录
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder(/用户名|username/i).fill('admin');
  await page.getByPlaceholder(/密码|password/i).fill('Admin@123');
  await page.getByRole('button', { name: /登录|login/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 10000 });
  await page.waitForTimeout(2000);

  // 验证 localStorage 有 token
  const token = await page.evaluate(() => localStorage.getItem('token'));
  console.log(`localStorage token: ${token ? token.slice(0, 20) + '...' : 'NULL'}`);

  // 2. 通过 API 创建工单
  const loginResp = await page.request.post(`${BASE_URL}/api/v1/auth/login`, {
    data: { username: 'admin', password: 'Admin@123' },
  });
  const { accessToken } = await loginResp.json();
  const woResp = await page.request.post(`${BASE_URL}/api/v1/work-orders`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { title: '直接导航测试', type: 'Corrective', priority: 'High' },
  });
  const wo = await woResp.json();
  console.log(`工单ID: ${wo.id}`);

  // 3. 通过侧边栏导航到工单列表
  await page.getByRole('link', { name: /工单/i }).first().click();
  await page.waitForTimeout(2000);
  await page.waitForLoadState('networkidle');
  console.log(`工单列表URL: ${page.url()}`);

  // 4. 点击工单行进入详情
  const rows = page.locator('tr.cursor-pointer, table tr').filter({ hasText: '直接导航测试' });
  const rowCount = await rows.count();
  console.log(`匹配工单行数: ${rowCount}`);

  if (rowCount > 0) {
    await rows.first().click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    console.log(`点击后URL: ${page.url()}`);

    const bodyText = await page.textContent('body');
    console.log(`body文本(前300): ${bodyText?.slice(0, 300)}`);

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    console.log(`页面JS错误: ${errors.length > 0 ? errors.join('; ') : '无'}`);
  } else {
    // 直接 goto
    console.log('未找到工单行，尝试直接 goto');
    await page.goto(`${BASE_URL}/work-orders/${wo.id}`);
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    console.log(`goto后URL: ${page.url()}`);
    const bodyText = await page.textContent('body');
    console.log(`body文本(前300): ${bodyText?.slice(0, 300)}`);
  }

  await page.screenshot({ path: 'e2e-docker/screenshots/diag-wo-direct.png', fullPage: true });
});

test('新建按钮诊断', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder(/用户名|username/i).fill('admin');
  await page.getByPlaceholder(/密码|password/i).fill('Admin@123');
  await page.getByRole('button', { name: /登录|login/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 10000 });
  await page.waitForTimeout(2000);

  // 设备列表页
  await page.getByRole('link', { name: /设备/i }).first().click();
  await page.waitForTimeout(2000);
  console.log(`\n=== 设备列表页 ===`);
  const allButtons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map((btn, i) => ({
      index: i,
      text: btn.textContent?.trim() || '',
      ariaLabel: btn.getAttribute('aria-label') || '',
      title: btn.title || '',
      className: btn.className.slice(0, 80),
      innerHTML: btn.innerHTML.slice(0, 100),
    }));
  });
  allButtons.forEach(b => console.log(`按钮 ${b.index}: text="${b.text}" aria="${b.ariaLabel}" title="${b.title}" html="${b.innerHTML}"`));

  // 工单列表页
  await page.getByRole('link', { name: /工单/i }).first().click();
  await page.waitForTimeout(2000);
  console.log(`\n=== 工单列表页 ===`);
  const woButtons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map((btn, i) => ({
      index: i,
      text: btn.textContent?.trim() || '',
      ariaLabel: btn.getAttribute('aria-label') || '',
      title: btn.title || '',
      className: btn.className.slice(0, 80),
      innerHTML: btn.innerHTML.slice(0, 100),
    }));
  });
  woButtons.forEach(b => console.log(`按钮 ${b.index}: text="${b.text}" aria="${b.ariaLabel}" title="${b.title}" html="${b.innerHTML}"`));
});
