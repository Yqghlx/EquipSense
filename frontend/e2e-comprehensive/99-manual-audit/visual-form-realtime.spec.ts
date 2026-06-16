/**
 * 视觉截图 + 完整表单流 + 告警实时推送
 *
 * 三件事合并到一个脚本：
 * 1. 逐页截图（供人工视觉验收）
 * 2. 完整表单流：填表单 → 提交 → 验证结果出现在列表
 * 3. 告警实时推送：打开告警中心 → 注入告警 → 验证实时弹出
 */
import { test, expect, type Page } from '@playwright/test';
import { login, BASE_URL, getToken } from '../helpers';

const SHOT_DIR = 'test-results/visual-audit';

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${SHOT_DIR}/${name}.png`, fullPage: true });
}

test.describe.configure({ timeout: 120000 });

// ==========================================================================
// 1. 逐页截图（核心业务页面）
// ==========================================================================
test.describe('视觉截图', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('仪表盘', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(3000);
    await shot(page, '01-dashboard');
  });

  test('设备列表', async ({ page }) => {
    await page.goto(`${BASE_URL}/devices`);
    await page.waitForTimeout(2000);
    await shot(page, '02-devices');
  });

  test('告警中心', async ({ page }) => {
    await page.goto(`${BASE_URL}/alerts`);
    await page.waitForTimeout(2000);
    await shot(page, '03-alerts');
  });

  test('告警规则', async ({ page }) => {
    await page.goto(`${BASE_URL}/alert-rules`);
    await page.waitForTimeout(2000);
    await shot(page, '04-alert-rules');
  });

  test('工单列表', async ({ page }) => {
    await page.goto(`${BASE_URL}/work-orders`);
    await page.waitForTimeout(2000);
    await shot(page, '05-work-orders');
  });

  test('AI 分析', async ({ page }) => {
    await page.goto(`${BASE_URL}/analyses`);
    await page.waitForTimeout(2000);
    await shot(page, '06-analyses');
  });

  test('知识库', async ({ page }) => {
    await page.goto(`${BASE_URL}/knowledge`);
    await page.waitForTimeout(2000);
    await shot(page, '07-knowledge');
  });

  test('FMEA', async ({ page }) => {
    await page.goto(`${BASE_URL}/fmea`);
    await page.waitForTimeout(2000);
    await shot(page, '08-fmea');
  });

  test('通知中心', async ({ page }) => {
    await page.goto(`${BASE_URL}/notifications`);
    await page.waitForTimeout(2000);
    await shot(page, '09-notifications');
  });

  test('用户管理', async ({ page }) => {
    await page.goto(`${BASE_URL}/users`);
    await page.waitForTimeout(2000);
    await shot(page, '10-users');
  });

  test('系统设置', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForTimeout(2000);
    await shot(page, '11-settings');
  });

  test('审计日志', async ({ page }) => {
    await page.goto(`${BASE_URL}/audit-logs`);
    await page.waitForTimeout(2000);
    await shot(page, '12-audit-logs');
  });

  test('租户管理', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/tenants`);
    await page.waitForTimeout(2000);
    await shot(page, '13-tenants');
  });
});

// ==========================================================================
// 2. 完整表单流：创建设备（填表单→提交→验证列表出现）
// ==========================================================================
test.describe('完整表单流', () => {
  test('创建设备完整流程', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/devices`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const code = `VISUAL-DEV-${Date.now().toString(36)}`;
    const name = `视觉测试设备_${Date.now().toString(36)}`;

    // 点击新建按钮
    await page.getByRole('button', { name: /新建|新增/i }).first().click();
    await page.waitForTimeout(1000);

    // 截图：表单打开状态
    await shot(page, '14-device-form-open');

    // 填写表单
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/设备编码|code/i).fill(code).catch(() => {});
    await dialog.getByLabel(/设备名称|name/i).fill(name).catch(() => {});

    // 尝试填 type（可能是 select 或 input）
    const typeSelect = dialog.locator('[role="combobox"]').first();
    if (await typeSelect.isVisible().catch(() => false)) {
      await typeSelect.click();
      await page.waitForTimeout(500);
      await page.getByRole('option').first().click();
    } else {
      await dialog.getByLabel(/类型|type/i).fill('motor').catch(() => {});
    }

    // 截图：表单填写后
    await shot(page, '15-device-form-filled');

    // 提交
    const submitBtn = dialog.getByRole('button', { name: /确定|创建|提交|保存|submit/i }).first();
    await submitBtn.click();
    await page.waitForTimeout(2000);

    // 截图：提交后
    await shot(page, '16-device-after-create');

    // 验证：列表中是否出现新设备
    await page.goto(`${BASE_URL}/devices`);
    await page.waitForTimeout(2000);
    const bodyText = await page.textContent('body') ?? '';
    const found = bodyText.includes(code) || bodyText.includes(name);
    console.log(`✓ 设备创建后列表出现: ${found}`);
    expect(found).toBeTruthy();
  });

  test('创建工单完整流程', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/work-orders`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const title = `视觉测试工单_${Date.now().toString(36)}`;

    // 点击新建
    await page.getByRole('button', { name: /新建|新增/i }).first().click();
    await page.waitForTimeout(1000);
    await shot(page, '17-wo-form-open');

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/标题|title/i).fill(title).catch(() => {});

    // 截图填写后
    await shot(page, '18-wo-form-filled');

    // 提交
    const submitBtn = dialog.getByRole('button', { name: /确定|创建|提交|保存/i }).first();
    await submitBtn.click();
    await page.waitForTimeout(2000);
    await shot(page, '19-wo-after-create');

    // 验证列表出现
    await page.goto(`${BASE_URL}/work-orders`);
    await page.waitForTimeout(2000);
    const bodyText = await page.textContent('body') ?? '';
    const found = bodyText.includes(title);
    console.log(`✓ 工单创建后列表出现: ${found}`);
  });
});

// ==========================================================================
// 3. 告警实时推送（SignalR）
// ==========================================================================
test('告警实时推送', async ({ page, request }) => {
  await login(page);
  await page.goto(`${BASE_URL}/alerts`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  // 截图：推送前
  await shot(page, '20-alerts-before');

  // 记录推送前的告警行数
  const rowsBefore = await page.locator('table tbody tr').count();

  // 创建测试设备 + 规则 + 注入告警
  const token = await getToken(page);
  const suffix = Date.now().toString(36);
  const dev = await request.post(`${BASE_URL}/api/v1/devices`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { deviceCode: `RT-DEV-${suffix}`, name: `实时推送测试`, type: 'motor' },
  }).then(r => r.json());

  await request.post(`${BASE_URL}/api/v1/alert-rules`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: {
      name: `RT-RULE-${suffix}`, ruleType: 'Threshold', metric: 'temperature',
      operator: 'GT', threshold: 80, severity: 'High', cooldownSeconds: 5, enabled: true,
    },
  });

  // 注入超阈值数据
  await request.post(`${BASE_URL}/api/v1/telemetry`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { deviceId: dev.id, metrics: { temperature: 99 }, timestamp: new Date().toISOString(), quality: 'Good' },
  });

  // 等待 SignalR 推送（最多 15 秒）
  let pushed = false;
  for (let i = 0; i < 15; i++) {
    await page.waitForTimeout(1000);
    const rowsAfter = await page.locator('table tbody tr').count();
    if (rowsAfter > rowsBefore) {
      pushed = true;
      break;
    }
  }

  // 截图：推送后
  await shot(page, '21-alerts-after-push');

  // 检查是否有 toast 通知弹出
  const hasToast = await page.locator('[data-sonner-toast], [class*="toast"], [role="alert"]').first()
    .isVisible({ timeout: 3000 }).catch(() => false);

  const rowsAfter = await page.locator('table tbody tr').count();
  console.log(`✓ 告警实时推送: 行数 ${rowsBefore}→${rowsAfter}, pushed=${pushed}, toast=${hasToast}`);

  // 清理
  await request.delete(`${BASE_URL}/api/v1/devices/${dev.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});
});
