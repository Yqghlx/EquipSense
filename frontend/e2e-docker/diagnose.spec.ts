import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'https://localhost:8443';

/** 登录（处理 mustChangePassword） */
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder(/用户名|username/i).fill('admin');
  await page.getByPlaceholder(/密码|password/i).fill('Admin@123');
  await page.getByRole('button', { name: /登录|login/i }).click();
  await page.waitForTimeout(3000);

  // 检查是否有改密弹窗
  const dialog = page.getByRole('dialog');
  if (await dialog.isVisible().catch(() => false)) {
    console.log('检测到改密弹窗');
    const pwdInputs = dialog.locator('input[type="password"]');
    const count = await pwdInputs.count();
    console.log(`密码输入框数量: ${count}`);
    // 打印弹窗中所有文本
    const dialogText = await dialog.textContent('');
    console.log(`弹窗内容: ${dialogText?.slice(0, 500)}`);
    // 打印弹窗中所有按钮
    const buttons = dialog.getByRole('button');
    const btnCount = await buttons.count();
    for (let i = 0; i < btnCount; i++) {
      const txt = await buttons.nth(i).textContent();
      console.log(`按钮 ${i}: ${txt}`);
    }
  }

  const url = page.url();
  console.log(`登录后URL: ${url}`);
  return url;
}

test.describe('诊断测试', () => {
  test('D1: 登录流程诊断', async ({ page }) => {
    const url = await login(page);
    // 截图
    await page.screenshot({ path: 'e2e-docker/screenshots/diag-login.png', fullPage: true });
  });

  test('D2: 设备列表页按钮诊断', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/devices`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 获取页面上所有按钮
    const buttons = page.getByRole('button');
    const btnCount = await buttons.count();
    console.log(`\n=== 设备列表页按钮 (${btnCount}个) ===`);
    for (let i = 0; i < Math.min(btnCount, 20); i++) {
      const txt = await buttons.nth(i).textContent().catch(() => '(empty)');
      const visible = await buttons.nth(i).isVisible().catch(() => false);
      console.log(`按钮 ${i}: text="${txt?.trim()}" visible=${visible}`);
    }

    // 获取页面上所有 link
    const links = page.getByRole('link');
    const linkCount = await links.count();
    console.log(`\n=== 链接 (${linkCount}个) ===`);
    for (let i = 0; i < Math.min(linkCount, 10); i++) {
      const txt = await links.nth(i).textContent().catch(() => '(empty)');
      console.log(`链接 ${i}: text="${txt?.trim()}"`);
    }

    // 获取页面 snapshot
    const snapshot = await page.accessibility.snapshot();
    console.log(`\n=== 页面 snapshot (前1000字符) ===`);
    console.log(JSON.stringify(snapshot, null, 2)?.slice(0, 1000));

    await page.screenshot({ path: 'e2e-docker/screenshots/diag-devices.png', fullPage: true });
  });

  test('D3: 工单详情页诊断', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message + '\n' + err.stack?.slice(0, 300)));

    await login(page);

    // 通过 API 创建一个工单
    const token = await page.request.post(`${BASE_URL}/api/v1/auth/login`, {
      data: { username: 'admin', password: 'Admin@123' },
    }).then(r => r.json()).then(b => b.accessToken);

    const woResp = await page.request.post(`${BASE_URL}/api/v1/work-orders`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: '诊断测试工单', type: 'Corrective', priority: 'High' },
    });
    const wo = await woResp.json();
    console.log(`创建工单: id=${wo.id}, status=${wo.status}`);

    // 直接导航到工单详情页
    await page.goto(`${BASE_URL}/work-orders/${wo.id}`);
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    const bodyText = await page.textContent('body');
    console.log(`\nURL: ${url}`);
    console.log(`body文本: "${bodyText?.slice(0, 500)}"`);

    // 检查 main 区域
    const mainHtml = await page.evaluate(() => {
      const main = document.querySelector('main') || document.querySelector('#root') || document.body;
      return main?.innerHTML?.slice(0, 2000) || 'EMPTY';
    });
    console.log(`\nmain HTML: ${mainHtml?.slice(0, 1000)}`);

    // 所有按钮
    const buttons = page.getByRole('button');
    const btnCount = await buttons.count();
    console.log(`\n按钮数量: ${btnCount}`);
    for (let i = 0; i < Math.min(btnCount, 15); i++) {
      const txt = await buttons.nth(i).textContent().catch(() => '(empty)');
      const visible = await buttons.nth(i).isVisible().catch(() => false);
      console.log(`按钮 ${i}: text="${txt?.trim()}" visible=${visible}`);
    }

    // 页面错误
    console.log(`\n=== 页面JS错误 ===`);
    pageErrors.forEach(e => console.log(`ERROR: ${e}`));

    await page.screenshot({ path: 'e2e-docker/screenshots/diag-wo-detail.png', fullPage: true });
  });

  test('D4: 工单列表页新建按钮诊断', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/work-orders`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const buttons = page.getByRole('button');
    const btnCount = await buttons.count();
    console.log(`\n=== 工单列表页按钮 (${btnCount}个) ===`);
    for (let i = 0; i < Math.min(btnCount, 20); i++) {
      const txt = await buttons.nth(i).textContent().catch(() => '(empty)');
      const visible = await buttons.nth(i).isVisible().catch(() => false);
      console.log(`按钮 ${i}: text="${txt?.trim()}" visible=${visible}`);
    }

    await page.screenshot({ path: 'e2e-docker/screenshots/diag-wo-list.png', fullPage: true });
  });
});
