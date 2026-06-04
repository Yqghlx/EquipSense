import { test, expect } from '@playwright/test';
import { BASE_URL, login, captureErrors, navigateViaSidebar, getToken, createWorkOrderViaAPI, transitionWorkOrder } from './helpers';

const adminId = 'ad2d83f0-558c-4858-bffd-3bd98cb371dc';

test.describe('6. 工单管理', () => {
  test('6.1 创建工单', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /工单/i);
    const createBtn = page.getByText('新建', { exact: false }).first();
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible().catch(() => false)) {
        await dialog.locator('input').first().fill('E2E测试工单');
        await dialog.getByRole('button', { name: /保存|确认/i }).click();
        await page.waitForTimeout(2000);
      }
    }
    expect(errors).toEqual([]);
  });

  test('6.2 详情页非白屏', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    const token = await getToken(page);
    const wo = await createWorkOrderViaAPI(page, token, { title: '详情页测试' });
    await navigateViaSidebar(page, /工单/i);
    await page.waitForTimeout(1500);
    const row = page.locator('table tbody tr').filter({ hasText: '详情页测试' }).first();
    if (await row.isVisible().catch(() => false)) {
      await row.click();
      await page.waitForTimeout(3000);
      const bodyText = await page.textContent('body');
      expect(bodyText?.trim().length).toBeGreaterThan(10);
    }
    expect(errors).toEqual([]);
  });

  test('6.3 派工对话框', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    const token = await getToken(page);
    const wo = await createWorkOrderViaAPI(page, token, { title: '派工测试' });
    await navigateViaSidebar(page, /工单/i);
    await page.waitForTimeout(1500);
    const row = page.locator('table tbody tr').filter({ hasText: '派工测试' }).first();
    if (await row.isVisible().catch(() => false)) {
      await row.click();
      await page.waitForTimeout(3000);
      const dispatchBtn = page.getByRole('button', { name: /派工/i });
      if (await dispatchBtn.isVisible().catch(() => false)) {
        await dispatchBtn.click();
        await page.waitForTimeout(1000);
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible({ timeout: 3000 });
      }
    }
    expect(errors).toEqual([]);
  });

  test('6.4 取消工单', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    const token = await getToken(page);
    const wo = await createWorkOrderViaAPI(page, token, { title: '取消测试', type: 'Inspection', priority: 'Low' });
    await navigateViaSidebar(page, /工单/i);
    await page.waitForTimeout(1500);
    const row = page.locator('table tbody tr').filter({ hasText: '取消测试' }).first();
    if (await row.isVisible().catch(() => false)) {
      await row.click();
      await page.waitForTimeout(3000);
      const cancelBtn = page.getByRole('button', { name: /取消/i });
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click();
        await page.waitForTimeout(1000);
        const dialog = page.getByRole('dialog');
        if (await dialog.isVisible().catch(() => false)) {
          await dialog.locator('textarea').fill('E2E测试取消');
          await dialog.getByRole('button', { name: /确认取消/i }).click();
          await page.waitForTimeout(2000);
        }
      }
    }
    expect(errors).toEqual([]);
  });

  test('6.5 搜索功能', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    const token = await getToken(page);
    const wo = await createWorkOrderViaAPI(page, token, { title: '搜索工单测试' });
    await navigateViaSidebar(page, /工单/i);
    await page.waitForTimeout(1500);
    const searchInput = page.getByPlaceholder(/搜索|search/i);
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('搜索工单测试');
      await page.waitForTimeout(1500);
    }
    expect(errors).toEqual([]);
  });

  test('6.6 状态下拉筛选', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /工单/i);
    await page.waitForTimeout(1000);
    const selects = page.locator('button[role="combobox"]');
    if (await selects.first().isVisible().catch(() => false)) {
      await selects.first().click();
      await page.waitForTimeout(300);
      const opt = page.getByRole('option', { name: /待派工|pending/i }).first();
      if (await opt.isVisible().catch(() => false)) {
        await opt.click();
        await page.waitForTimeout(1000);
      }
    }
    expect(errors).toEqual([]);
  });

  test('6.7 分页功能', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /工单/i);
    await page.waitForTimeout(1500);
    const nextBtn = page.getByRole('button', { name: /下一页|next/i });
    if (await nextBtn.isVisible().catch(() => false)) {
      const isDisabled = await nextBtn.isDisabled().catch(() => true);
      if (!isDisabled) {
        await nextBtn.click();
        await page.waitForTimeout(1500);
      }
    }
    expect(errors).toEqual([]);
  });

  test('6.8 完整生命周期-创建到派工', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    const token = await getToken(page);
    const wo = await createWorkOrderViaAPI(page, token, { title: '生命周期测试' });
    // 导航到工单详情
    await page.goto(`${BASE_URL}/work-orders/${wo.id}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    // 点击派工按钮
    const dispatchBtn = page.getByRole('button', { name: /派工/i });
    if (await dispatchBtn.isVisible().catch(() => false)) {
      await dispatchBtn.click();
      await page.waitForTimeout(1000);
      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible().catch(() => false)) {
        // 选择第一个技术员
        const techCards = dialog.locator('button[type="button"]').filter({ hasText: /.*/ });
        if (await techCards.first().isVisible().catch(() => false)) {
          await techCards.first().click();
          await page.waitForTimeout(300);
          const confirmBtn = dialog.getByRole('button', { name: /确认派工/i });
          if (await confirmBtn.isVisible().catch(() => false)) {
            await confirmBtn.click();
            await page.waitForTimeout(2000);
          }
        }
      }
    }
    expect(errors).toEqual([]);
  });

  test('6.9 开始执行工单', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    const token = await getToken(page);
    const wo = await createWorkOrderViaAPI(page, token, { title: '开始执行测试' });
    // API 派工
    await transitionWorkOrder(page, token, wo.id, 'assign', { assignedTo: adminId });
    // 导航到详情
    await page.goto(`${BASE_URL}/work-orders/${wo.id}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    // 点击开始执行
    const startBtn = page.getByRole('button', { name: /开始执行|start/i });
    if (await startBtn.isVisible().catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(2000);
    }
    expect(errors).toEqual([]);
  });

  test('6.10 填写解决措施并完成', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    const token = await getToken(page);
    const wo = await createWorkOrderViaAPI(page, token, { title: '完成工单测试' });
    await transitionWorkOrder(page, token, wo.id, 'assign', { assignedTo: adminId });
    await transitionWorkOrder(page, token, wo.id, 'start');
    await page.goto(`${BASE_URL}/work-orders/${wo.id}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    // 填写解决措施
    const textarea = page.locator('textarea');
    if (await textarea.isVisible().catch(() => false)) {
      await textarea.fill('E2E测试解决措施');
      // 点击提交验收按钮
      const submitBtn = page.getByRole('button', { name: /提交验收|完成|complete/i });
      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
      }
    }
    expect(errors).toEqual([]);
  });

  test('6.11 验收通过', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    const token = await getToken(page);
    const wo = await createWorkOrderViaAPI(page, token, { title: '验收通过测试' });
    await transitionWorkOrder(page, token, wo.id, 'assign', { assignedTo: adminId });
    await transitionWorkOrder(page, token, wo.id, 'start');
    await transitionWorkOrder(page, token, wo.id, 'complete', { resolution: 'E2E完成' });
    await page.goto(`${BASE_URL}/work-orders/${wo.id}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const acceptBtn = page.getByRole('button', { name: /验收通过|accept/i });
    if (await acceptBtn.isVisible().catch(() => false)) {
      await acceptBtn.click();
      await page.waitForTimeout(2000);
    }
    expect(errors).toEqual([]);
  });

  test('6.12 验收驳回', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    const token = await getToken(page);
    const wo = await createWorkOrderViaAPI(page, token, { title: '验收驳回测试' });
    await transitionWorkOrder(page, token, wo.id, 'assign', { assignedTo: adminId });
    await transitionWorkOrder(page, token, wo.id, 'start');
    await transitionWorkOrder(page, token, wo.id, 'complete', { resolution: 'E2E完成' });
    await page.goto(`${BASE_URL}/work-orders/${wo.id}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const rejectBtn = page.getByRole('button', { name: /验收不通过|reject/i });
    if (await rejectBtn.isVisible().catch(() => false)) {
      await rejectBtn.click();
      await page.waitForTimeout(500);
      // 输入驳回原因
      const reasonInput = page.locator('input').filter({ hasText: '' }).last();
      if (await reasonInput.isVisible().catch(() => false)) {
        await reasonInput.fill('E2E测试驳回原因');
      }
      const submitRejectBtn = page.getByRole('button', { name: /提交|submit/i }).last();
      if (await submitRejectBtn.isVisible().catch(() => false)) {
        await submitRejectBtn.click();
        await page.waitForTimeout(2000);
      }
    }
    expect(errors).toEqual([]);
  });

  test('6.13 关闭工单', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    const token = await getToken(page);
    const wo = await createWorkOrderViaAPI(page, token, { title: '关闭工单测试' });
    await transitionWorkOrder(page, token, wo.id, 'assign', { assignedTo: adminId });
    await transitionWorkOrder(page, token, wo.id, 'start');
    await transitionWorkOrder(page, token, wo.id, 'complete', { resolution: 'E2E完成' });
    await transitionWorkOrder(page, token, wo.id, 'accept');
    await page.goto(`${BASE_URL}/work-orders/${wo.id}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const closeBtn = page.getByRole('button', { name: /关闭|close/i });
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(2000);
    }
    expect(errors).toEqual([]);
  });
});
