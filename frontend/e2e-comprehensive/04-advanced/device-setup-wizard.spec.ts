/**
 * 网关设备接入向导验收测试
 *
 * 当前产品的真实流程为四步：选择协议 → 连接配置 → 数据点 → 确认创建。
 * 测试直接验证用户可见结果和关键 API 响应，避免把旧版设备模板向导的
 * 断言套在网关接入页面上，导致“未执行功能但测试通过”。
 */
import { test, expect, type Page } from '@playwright/test';
import {
  BASE_URL,
  captureErrors,
  getToken,
  login,
  navigateViaSidebar,
} from '../helpers';

const wizardTitle = /设备接入向导|device setup wizard/i;
const nextButtonName = /下一步|next/i;
const previousButtonName = /上一步|previous/i;

/** 打开真实的网关设备接入向导。 */
async function openSetupWizard(page: Page): Promise<void> {
  await login(page);
  await page.goto(`${BASE_URL}/device-setup`, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/device-setup$/);
  await expect(page.getByRole('heading', { name: wizardTitle })).toBeVisible({ timeout: 10000 });
}

/** 选择 Modbus TCP，作为不依赖真实工业设备的隔离验收协议。 */
async function selectModbusTcp(page: Page): Promise<void> {
  const protocolCard = page.locator('[data-slot="card"]').filter({ hasText: 'Modbus TCP' }).first();
  await expect(protocolCard).toBeVisible({ timeout: 5000 });
  await protocolCard.click();
}

/** 从协议步骤进入连接配置步骤。 */
async function goToConnectionStep(page: Page): Promise<void> {
  await selectModbusTcp(page);
  const nextButton = page.getByRole('button', { name: nextButtonName });
  await expect(nextButton).toBeEnabled();
  await nextButton.click();
  await expect(page.locator('#modbus-host')).toBeVisible({ timeout: 5000 });
}

/** 进入数据点步骤，并填写一个有效的数据点。 */
async function goToDataPointsStep(page: Page): Promise<void> {
  await goToConnectionStep(page);
  const nextButton = page.getByRole('button', { name: nextButtonName });
  await expect(nextButton).toBeEnabled();
  await nextButton.click();
  await expect(page.locator('#gatewayDeviceName')).toBeVisible({ timeout: 5000 });
}

/** 填写向导要求的最小有效配置。 */
async function fillValidDataPoint(page: Page, deviceName: string): Promise<void> {
  await page.locator('#gatewayDeviceName').fill(deviceName);
  await page.getByPlaceholder('40001').fill('40001');
  await page.getByPlaceholder('temperature').fill('temperature');
}

test.describe('04-设备接入向导', () => {
  test('1. 从网关页面进入向导 — 新建设备按钮打开真实路由', async ({ page }) => {
    const errors = captureErrors(page);

    await login(page);
    await navigateViaSidebar(page, /网关状态|gateway status|gateway/i);
    await expect(page).toHaveURL(/\/gateways$/);

    const createButton = page.getByRole('button', { name: /新建设备|new device|add device/i });
    await expect(createButton).toBeVisible({ timeout: 5000 });
    await createButton.click();

    await expect(page).toHaveURL(/\/device-setup$/);
    await expect(page.getByRole('heading', { name: wizardTitle })).toBeVisible({ timeout: 5000 });
    expect(errors).toEqual([]);
  });

  test('2. 协议步骤 — 未选择协议不能继续，选择后进入连接配置', async ({ page }) => {
    const errors = captureErrors(page);

    await openSetupWizard(page);
    const nextButton = page.getByRole('button', { name: nextButtonName });
    await expect(nextButton).toBeDisabled();

    await selectModbusTcp(page);
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    await expect(page.locator('#modbus-host')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#modbus-port')).toHaveValue('502');
    await expect(page.locator('#modbus-unitId')).toHaveValue('1');
    expect(errors).toEqual([]);
  });

  test('3. 连接测试 — 默认 Modbus 配置得到明确的接口结果', async ({ page }) => {
    const errors = captureErrors(page);

    await openSetupWizard(page);
    await goToConnectionStep(page);

    const responsePromise = page.waitForResponse((response) =>
      response.url().includes('/api/v1/gateway/devices/test-connection')
      && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: /测试连接|test connection/i }).click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    const result = await response.json() as { message?: unknown };
    expect(typeof result.message).toBe('string');
    expect((result.message as string).trim().length).toBeGreaterThan(0);
    // 服务端可能返回真实网关结果或离线回退校验结果，UI 必须展示服务端的明确说明。
    await expect(page.getByText(result.message as string, { exact: true })).toBeVisible({ timeout: 5000 });
    expect(errors).toEqual([]);
  });

  test('4. 数据点校验 — 名称和数据点完成后下一步才启用', async ({ page }) => {
    const errors = captureErrors(page);

    await openSetupWizard(page);
    await goToDataPointsStep(page);
    const nextButton = page.getByRole('button', { name: nextButtonName });
    await expect(nextButton).toBeDisabled();

    await fillValidDataPoint(page, 'E2E-网关数据点校验');
    await expect(nextButton).toBeEnabled();
    expect(errors).toEqual([]);
  });

  test('5. 确认页面 — 显示协议、设备名称和数据点摘要', async ({ page }) => {
    const errors = captureErrors(page);
    const deviceName = `E2E-网关摘要-${Date.now()}`;

    await openSetupWizard(page);
    await goToDataPointsStep(page);
    await fillValidDataPoint(page, deviceName);
    await page.getByRole('button', { name: nextButtonName }).click();

    await expect(page.getByText(/请确认以下配置信息无误|review the configuration below/i)).toBeVisible();
    await expect(page.getByText('Modbus TCP', { exact: true })).toBeVisible();
    await expect(page.getByText(deviceName, { exact: true })).toBeVisible();
    await expect(page.getByText('temperature', { exact: true })).toBeVisible();
    await expect(page.getByText(/数据点（共\s*1\s*个）|data points \(1\)/i)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('6. 返回上一步 — 连接和数据点配置保持不变', async ({ page }) => {
    const errors = captureErrors(page);
    const deviceName = 'E2E-网关返回保留';

    await openSetupWizard(page);
    await goToDataPointsStep(page);
    await fillValidDataPoint(page, deviceName);
    await page.getByRole('button', { name: nextButtonName }).click();
    await expect(page.getByText(deviceName, { exact: true })).toBeVisible();

    await page.getByRole('button', { name: previousButtonName }).click();
    await expect(page.locator('#gatewayDeviceName')).toHaveValue(deviceName);
    await expect(page.getByPlaceholder('40001')).toHaveValue('40001');
    await expect(page.getByPlaceholder('temperature')).toHaveValue('temperature');

    await page.getByRole('button', { name: previousButtonName }).click();
    await expect(page.locator('#modbus-host')).toHaveValue('127.0.0.1');
    await expect(page.locator('#modbus-port')).toHaveValue('502');
    expect(errors).toEqual([]);
  });

  test('7. 数据点管理 — 可以添加第二个数据点并在摘要中显示数量', async ({ page }) => {
    const errors = captureErrors(page);

    await openSetupWizard(page);
    await goToDataPointsStep(page);
    await expect(page.getByPlaceholder('temperature')).toHaveCount(1);

    await page.getByRole('button', { name: /添加数据点|add data point/i }).click();
    await expect(page.getByPlaceholder('temperature')).toHaveCount(2);
    await page.getByPlaceholder('temperature').nth(0).fill('temperature');
    await page.getByPlaceholder('40001').nth(0).fill('40001');
    await page.getByPlaceholder('temperature').nth(1).fill('pressure');
    await page.getByPlaceholder('40001').nth(1).fill('40002');
    await page.locator('#gatewayDeviceName').fill('E2E-网关多数据点');

    await page.getByRole('button', { name: nextButtonName }).click();
    const dataPointsSummary = page.locator('[data-slot="card-title"]')
      .filter({ hasText: /数据点|data points/i })
      .last();
    await expect(dataPointsSummary).toContainText('2');
    await expect(page.getByText('pressure', { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('8. 创建网关设备 — 确认创建返回 201 并跳转设备列表', async ({ page }) => {
    const errors = captureErrors(page);
    const deviceName = `E2E-网关创建-${Date.now()}`;
    let createdId: string | undefined;

    try {
      await openSetupWizard(page);
      await goToDataPointsStep(page);
      await fillValidDataPoint(page, deviceName);
      await page.getByRole('button', { name: nextButtonName }).click();

      const createResponsePromise = page.waitForResponse((response) =>
        response.url().includes('/api/v1/gateway/devices')
        && response.request().method() === 'POST',
      );
      await page.getByRole('button', { name: /确认创建|confirm.*create/i }).click();
      const createResponse = await createResponsePromise;
      expect(createResponse.status()).toBe(201);

      const created = await createResponse.json() as { id?: string };
      createdId = created.id;
      expect(createdId).toMatch(/^[0-9a-f-]{36}$/i);
      await expect(page).toHaveURL(/\/devices(?:\?.*)?$/, { timeout: 10000 });
    } finally {
      // 创建测试数据后立即清理，避免隔离环境被重复验收数据污染。
      if (createdId) {
        const token = await getToken(page);
        const deleteResponse = await page.request.delete(
          `${BASE_URL}/api/v1/gateway/devices/${createdId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        expect(deleteResponse.status()).toBe(204);
      }
    }

    expect(errors).toEqual([]);
  });

  test('9. 返回设备列表 — 向导页头返回按钮回到设备管理', async ({ page }) => {
    const errors = captureErrors(page);

    await openSetupWizard(page);
    const heading = page.getByRole('heading', { name: wizardTitle });
    const header = heading.locator('..');
    const backButton = header.getByRole('button');
    await expect(backButton).toBeVisible();
    await backButton.click();

    await expect(page).toHaveURL(/\/devices$/);
    expect(errors).toEqual([]);
  });
});
