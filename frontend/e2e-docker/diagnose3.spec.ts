import { test } from '@playwright/test';

const BASE_URL = 'https://localhost:8443';

test('工单详情页完整诊断', async ({ page }) => {
  // 捕获所有控制台消息
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => console.log(`[PAGE_ERROR] ${err.message}`));
  page.on('requestfailed', (req) => console.log(`[REQUEST_FAILED] ${req.url()} ${req.failure()?.errorText}`));

  // 登录
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder(/用户名|username/i).fill('admin');
  await page.getByPlaceholder(/密码|password/i).fill('Admin@123');
  await page.getByRole('button', { name: /登录|login/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 10000 });
  await page.waitForTimeout(2000);

  // 创建工单
  const loginResp = await page.request.post(`${BASE_URL}/api/v1/auth/login`, {
    data: { username: 'admin', password: 'Admin@123' },
  });
  const { accessToken } = await loginResp.json();
  const woResp = await page.request.post(`${BASE_URL}/api/v1/work-orders`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { title: '完整诊断工单', type: 'Corrective', priority: 'High' },
  });
  const wo = await woResp.json();
  console.log(`工单ID: ${wo.id}`);

  // 侧边栏导航到工单列表
  await page.getByRole('link', { name: /工单/i }).first().click();
  await page.waitForTimeout(2000);
  console.log(`工单列表URL: ${page.url()}`);

  // 点击工单行
  const row = page.locator('tr').filter({ hasText: '完整诊断工单' }).first();
  await row.click();
  await page.waitForTimeout(4000);
  await page.waitForLoadState('networkidle');

  console.log(`\n详情页URL: ${page.url()}`);

  // 检查所有 network 请求
  const mainContent = await page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) return 'NO MAIN ELEMENT';
    const children = main.children;
    const result: string[] = [`main子元素数量: ${children.length}`];
    for (let i = 0; i < children.length; i++) {
      result.push(`  child[${i}]: tag=${children[i].tagName} class=${children[i].className.slice(0, 80)} text=${children[i].textContent?.slice(0, 100) || '(empty)'}`);
    }
    return result.join('\n');
  });
  console.log(`\n${mainContent}`);

  // 检查 React root
  const rootContent = await page.evaluate(() => {
    const root = document.getElementById('root');
    if (!root) return 'NO ROOT';
    return `root children: ${root.children.length}, innerHTML length: ${root.innerHTML.length}`;
  });
  console.log(rootContent);

  await page.screenshot({ path: 'e2e-docker/screenshots/diag-wo-full.png', fullPage: true });
});
