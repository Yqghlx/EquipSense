import { test, expect } from '@playwright/test';

const BASE_URL = 'https://localhost:8443';

test('设备详情页调试', async ({ page }) => {
  // 捕获控制台日志
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    if (msg.type() === 'warning') consoleWarnings.push(msg.text());
  });

  // 捕获页面错误
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message + '\n' + err.stack));

  // 登录
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder(/用户名|username/i).fill('admin');
  await page.getByPlaceholder(/密码|password/i).fill('Admin@123');
  await page.getByRole('button', { name: /登录|login/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  // 导航到设备列表
  await page.getByRole('link', { name: /设备/i }).first().click();
  await page.waitForTimeout(1500);
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/devices/, { timeout: 5000 });

  // 截图设备列表页
  await page.screenshot({ path: 'e2e-docker/screenshots/device-list-before-click.png', fullPage: true });

  // 点击第一个设备
  const deviceRow = page.getByRole('row').nth(1);
  if (await deviceRow.isVisible().catch(() => false)) {
    await deviceRow.click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    console.log(`当前URL: ${url}`);

    // 截图
    await page.screenshot({ path: 'e2e-docker/screenshots/device-detail-debug.png', fullPage: true });

    // 获取页面内容
    const bodyText = await page.textContent('body');
    console.log(`页面文本内容: ${bodyText?.substring(0, 500)}`);

    // 获取页面HTML结构
    const html = await page.evaluate(() => {
      const main = document.querySelector('main') || document.querySelector('#root') || document.body;
      return main?.innerHTML?.substring(0, 2000) || 'EMPTY';
    });
    console.log(`页面HTML: ${html?.substring(0, 1000)}`);
  } else {
    console.log('没有找到设备行');
  }

  console.log('\n=== 控制台错误 ===');
  consoleErrors.forEach(e => console.log(`ERROR: ${e}`));
  console.log('\n=== 页面错误 ===');
  pageErrors.forEach(e => console.log(`PAGE_ERROR: ${e}`));
  console.log('\n=== 控制台警告 ===');
  consoleWarnings.forEach(e => console.log(`WARN: ${e}`));
});
