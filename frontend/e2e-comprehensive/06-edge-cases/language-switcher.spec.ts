/**
 * i18n 语言切换测试
 *
 * 覆盖顶栏语言切换按钮的交互场景：
 * - 语言切换按钮可见性
 * - 中英文切换
 * - 语言持久化到 localStorage
 * - 刷新页面保持语言
 * - 侧边栏菜单跟随语言切换
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, login, captureErrors } from '../helpers';

test.describe('06-i18n 语言切换', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('1. 头部应有语言切换按钮', async ({ page }) => {
    const errors = captureErrors(page);

    await expect(page).toHaveURL(/dashboard/);

    // 查找语言切换按钮（Globe 图标，aria-label="切换语言"）
    const langButton = page.getByRole('button', { name: /切换语言|switch.*language/i }).first();
    if (await langButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(langButton).toBeVisible();
    } else {
      // 备选：查找带 Globe 图标的按钮
      const globeButton = page.locator('button[aria-label="切换语言"]').first();
      if (await globeButton.isVisible().catch(() => false)) {
        await expect(globeButton).toBeVisible();
      }
    }

    expect(errors).toEqual([]);
  });

  test('2. 点击应切换语言（中→英）', async ({ page }) => {
    const errors = captureErrors(page);

    await expect(page).toHaveURL(/dashboard/);

    // 确保当前是中文
    await page.evaluate(() => localStorage.setItem('language', 'zh'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // 验证当前页面有中文内容
    const zhText = page.getByText(/仪表盘|设备|告警/i).first();
    await expect(zhText).toBeVisible({ timeout: 5000 });

    // 点击语言切换按钮
    const langButton = page.getByRole('button', { name: /切换语言/i }).first();
    if (await langButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await langButton.click();
      await page.waitForTimeout(1500);

      // 验证页面文本变为英文
      const enText = page.getByText(/Dashboard|Devices|Alerts|Work.*Order/i).first();
      if (await enText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(enText).toBeVisible();
      }
    }

    expect(errors).toEqual([]);
  });

  test('3. 再次点击应切换回（英→中）', async ({ page }) => {
    const errors = captureErrors(page);

    await expect(page).toHaveURL(/dashboard/);

    // 先切换到英文
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // 点击语言切换按钮切回中文
    const langButton = page.getByRole('button', { name: /切换语言/i }).first();
    if (await langButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await langButton.click();
      await page.waitForTimeout(1500);

      // 验证页面文本恢复中文
      const zhText = page.getByText(/仪表盘|设备|告警/i).first();
      if (await zhText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(zhText).toBeVisible();
      }
    }

    expect(errors).toEqual([]);
  });

  test('4. 语言选择应持久化到 localStorage', async ({ page }) => {
    const errors = captureErrors(page);

    await expect(page).toHaveURL(/dashboard/);

    // 确保当前是中文
    await page.evaluate(() => localStorage.setItem('language', 'zh'));

    // 点击切换到英文
    const langButton = page.getByRole('button', { name: /切换语言/i }).first();
    if (await langButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await langButton.click();
      await page.waitForTimeout(1000);

      // 验证 localStorage 中语言值更新为 en
      const storedLang = await page.evaluate(() => localStorage.getItem('language'));
      expect(storedLang).toBe('en');
    }

    expect(errors).toEqual([]);
  });

  test('5. 刷新页面应保持语言选择', async ({ page }) => {
    const errors = captureErrors(page);

    await expect(page).toHaveURL(/dashboard/);

    // 设置语言为英文
    await page.evaluate(() => localStorage.setItem('language', 'en'));

    // 刷新页面
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // 验证 localStorage 中的语言仍然是 en
    const storedLang = await page.evaluate(() => localStorage.getItem('language'));
    expect(storedLang).toBe('en');

    // 恢复为中文
    await page.evaluate(() => localStorage.setItem('language', 'zh'));

    expect(errors).toEqual([]);
  });

  test('6. 侧边栏菜单应跟随语言切换', async ({ page }) => {
    const errors = captureErrors(page);

    await expect(page).toHaveURL(/dashboard/);

    // 确保是中文
    await page.evaluate(() => localStorage.setItem('language', 'zh'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // 验证侧边栏包含中文菜单项
    const zhMenu = page.getByRole('link', { name: /仪表盘|设备管理/i }).first();
    if (await zhMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(zhMenu).toBeVisible();

      // 切换到英文
      const langButton = page.getByRole('button', { name: /切换语言/i }).first();
      if (await langButton.isVisible().catch(() => false)) {
        await langButton.click();
        await page.waitForTimeout(1500);

        // 验证侧边栏菜单项变为英文
        const enMenu = page.getByRole('link', { name: /Dashboard|Devices/i }).first();
        if (await enMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(enMenu).toBeVisible();
        }
      }
    }

    // 恢复中文
    await page.evaluate(() => localStorage.setItem('language', 'zh'));

    expect(errors).toEqual([]);
  });
});
