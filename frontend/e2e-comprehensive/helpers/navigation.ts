/**
 * 导航辅助函数
 *
 * 提供 E2E 测试中常用的页面导航操作，包括侧边栏导航、
 * 设备详情跳转、工单详情跳转、设备设置向导步骤跳转等。
 */
import { type Page } from '@playwright/test';
import { BASE_URL } from './auth';

/**
 * 通过侧边栏导航到指定页面
 *
 * 点击侧边栏中匹配指定正则表达式的链接，并等待页面加载完成。
 *
 * @param page - Playwright Page 实例
 * @param pattern - 侧边栏链接文本匹配正则
 */
export async function navigateViaSidebar(page: Page, pattern: RegExp): Promise<void> {
  await page.getByRole('link', { name: pattern }).first().click();
  await page.waitForTimeout(1500);
  await page.waitForLoadState('networkidle');
}

/**
 * 直接跳转到告警规则页面
 */
export async function gotoAlertRules(page: Page): Promise<void> {
  await navigateViaSidebar(page, /告警规则|alert.*rules/i);
}

/**
 * 直接跳转到告警中心页面
 *
 * @param page - Playwright Page 实例
 */
export async function gotoAlertCenter(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/alerts`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
}

/**
 * 直接跳转到知识库页面
 *
 * @param page - Playwright Page 实例
 */
export async function gotoKnowledge(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/knowledge`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
}

/**
 * 直接跳转到注册页面
 *
 * @param page - Playwright Page 实例
 */
export async function gotoRegister(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/register`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
}

/**
 * 直接跳转到设备详情页
 *
 * 注意：使用 domcontentloaded 而非 networkidle。
 * 原因：设备详情页通过 useSignalR Hook 建立长连接 WebSocket，
 * networkidle（要求 500ms 内无网络活动）会永远无法触发，导致测试超时。
 *
 * @param page - Playwright Page 实例
 * @param deviceId - 设备 UUID
 */
export async function gotoDeviceDetail(page: Page, deviceId: string): Promise<void> {
  await page.goto(`${BASE_URL}/devices/${deviceId}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
}

/**
 * 直接跳转到工单详情页
 *
 * 注意：使用 domcontentloaded 而非 networkidle（同 gotoDeviceDetail，因 SignalR 长连接）。
 *
 * @param page - Playwright Page 实例
 * @param woId - 工单 UUID
 */
export async function gotoWorkOrderDetail(page: Page, woId: string): Promise<void> {
  await page.goto(`${BASE_URL}/work-orders/${woId}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
}

/**
 * 跳转到网关设备接入向导的指定步骤
 *
 * 需要先走完前置步骤才能到达目标步骤。当前向导共四步：
 * 1. 选择协议；2. 连接配置；3. 数据点；4. 确认保存。
 *
 * @param page - Playwright Page 实例
 * @param step - 目标步骤编号（1-4）
 */
export async function gotoSetupStep(page: Page, step: number): Promise<void> {
  if (!Number.isInteger(step) || step < 1 || step > 4) {
    throw new Error(`设备接入向导步骤必须是 1-4，收到：${step}`);
  }

  await page.goto(`${BASE_URL}/device-setup`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: /设备接入向导|device setup wizard/i })
    .waitFor({ state: 'visible', timeout: 10000 });

  if (step >= 2) {
    const protocolCard = page.locator('[data-slot="card"]').filter({ hasText: 'Modbus TCP' }).first();
    await protocolCard.click();
    await page.getByRole('button', { name: /下一步|下一页|next/i }).click();
    await page.locator('#modbus-host').waitFor({ state: 'visible', timeout: 5000 });
  }

  if (step >= 3) {
    await page.getByRole('button', { name: /下一步|下一页|next/i }).click();
    await page.locator('#gatewayDeviceName').waitFor({ state: 'visible', timeout: 5000 });
  }

  if (step >= 4) {
    // 数据点步骤存在必填校验，先填入隔离测试用的最小有效配置。
    await page.locator('#gatewayDeviceName').fill(`E2E-SETUP-${Date.now().toString(36)}`);
    await page.getByPlaceholder('40001').fill('40001');
    await page.getByPlaceholder('temperature').fill('temperature');
    await page.getByRole('button', { name: /下一步|下一页|next/i }).click();
    await page.getByText(/请确认以下配置信息无误|review the configuration below/i)
      .waitFor({ state: 'visible', timeout: 5000 });
  }
}
