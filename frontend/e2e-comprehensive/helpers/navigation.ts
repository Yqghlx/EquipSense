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
 *
 * 告警规则页面不在侧边栏导航中，需要直接访问 URL。
 *
 * @param page - Playwright Page 实例
 */
export async function gotoAlertRules(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/alert-rules`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

/**
 * 直接跳转到告警中心页面
 *
 * @param page - Playwright Page 实例
 */
export async function gotoAlertCenter(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/alerts`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

/**
 * 直接跳转到知识库页面
 *
 * @param page - Playwright Page 实例
 */
export async function gotoKnowledge(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/knowledge`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

/**
 * 直接跳转到注册页面
 *
 * @param page - Playwright Page 实例
 */
export async function gotoRegister(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/register`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

/**
 * 直接跳转到设备详情页
 *
 * @param page - Playwright Page 实例
 * @param deviceId - 设备 UUID
 */
export async function gotoDeviceDetail(page: Page, deviceId: string): Promise<void> {
  await page.goto(`${BASE_URL}/devices/${deviceId}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

/**
 * 直接跳转到工单详情页
 *
 * @param page - Playwright Page 实例
 * @param woId - 工单 UUID
 */
export async function gotoWorkOrderDetail(page: Page, woId: string): Promise<void> {
  await page.goto(`${BASE_URL}/work-orders/${woId}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

/**
 * 跳转到设备设置向导的指定步骤
 *
 * 需要先走完前置步骤才能到达目标步骤。
 * 目前支持步骤 1（基本信息）、步骤 2（参数配置）、步骤 3（确认提交）。
 *
 * @param page - Playwright Page 实例
 * @param step - 目标步骤编号（1-3）
 */
export async function gotoSetupStep(page: Page, step: number): Promise<void> {
  // 先导航到设备创建/设置页面入口
  await navigateViaSidebar(page, /设备|device/i);

  // 点击"新增设备"或"添加设备"按钮进入设置向导
  await page.getByRole('button', { name: /新增|添加|create|add/i }).first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // 根据目标步骤，依次填写前置步骤并前进
  for (let currentStep = 1; currentStep < step; currentStep++) {
    if (currentStep === 1) {
      // 步骤 1：填写基本信息（设备编码、名称、类型）
      const suffix = Date.now().toString(36);
      const codeInput = page.getByLabel(/设备编码|device.*code/i);
      if (await codeInput.isVisible()) {
        await codeInput.fill(`E2E-SETUP-${suffix}`);
      }
      const nameInput = page.getByLabel(/设备名称|device.*name/i);
      if (await nameInput.isVisible()) {
        await nameInput.fill(`E2E设置向导测试设备`);
      }
    }

    if (currentStep === 2) {
      // 步骤 2：参数配置阶段无需特殊填写，使用默认值即可
    }

    // 点击"下一步"按钮
    await page.getByRole('button', { name: /下一步|next/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
  }
}