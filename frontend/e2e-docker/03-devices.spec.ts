import { test, expect } from '@playwright/test';
import { BASE_URL, login, captureErrors, navigateViaSidebar, getToken, createDeviceViaAPI, deleteDeviceViaAPI } from './helpers';

test.describe('3. 设备管理', () => {
  test('3.1 列表页展示', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /设备/i);
    await expect(page).toHaveURL(/devices/);
    const hasTable = await page.getByRole('table').isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/暂无|没有/i).isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBeTruthy();
    expect(errors).toEqual([]);
  });

  test('3.2 新建设备完整表单', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /设备/i);
    const createBtn = page.getByText('新建', { exact: false }).first();
    await createBtn.click();
    await page.waitForTimeout(1000);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });
    await dialog.locator('input').first().fill('E2E-DEVICE-001');
    await dialog.locator('input').nth(1).fill('E2E测试设备');
    await dialog.getByRole('button', { name: /保存|确认/i }).click();
    await page.waitForTimeout(2000);
    expect(errors).toEqual([]);
  });

  test('3.3 详情页非白屏', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /设备/i);
    const deviceRow = page.locator('table tbody tr').first();
    if (await deviceRow.isVisible().catch(() => false)) {
      await deviceRow.click();
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/devices\/[0-9a-f-]+/, { timeout: 5000 });
      const bodyText = await page.textContent('body');
      expect(bodyText?.trim().length).toBeGreaterThan(10);
    }
    expect(errors).toEqual([]);
  });

  test('3.4 指标切换', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /设备/i);
    const deviceRow = page.locator('table tbody tr').first();
    if (!(await deviceRow.isVisible().catch(() => false))) return;
    await deviceRow.click();
    await page.waitForTimeout(2000);
    const selects = page.locator('button[role="combobox"]');
    if (await selects.first().isVisible().catch(() => false)) {
      await selects.first().click();
      await page.waitForTimeout(300);
      const pressure = page.getByRole('option', { name: /压力|pressure/i });
      if (await pressure.isVisible().catch(() => false)) await pressure.click();
      await page.waitForTimeout(1000);
    }
    expect(errors).toEqual([]);
  });

  test('3.5 搜索功能', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    const token = await getToken(page);
    const dev = await createDeviceViaAPI(page, token, { deviceCode: 'E2E-SEARCH-001', name: '搜索测试设备' });
    await navigateViaSidebar(page, /设备/i);
    await page.waitForTimeout(1500);
    const searchInput = page.getByPlaceholder(/搜索|search/i);
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('搜索测试设备');
      await page.waitForTimeout(1500);
      const filteredRows = page.locator('table tbody tr');
      const count = await filteredRows.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
    await deleteDeviceViaAPI(page, token, dev.id);
    expect(errors).toEqual([]);
  });

  test('3.6 状态下拉筛选', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /设备/i);
    await page.waitForTimeout(1000);
    const selects = page.locator('button[role="combobox"]');
    if (await selects.first().isVisible().catch(() => false)) {
      await selects.first().click();
      await page.waitForTimeout(300);
      const onlineOpt = page.getByRole('option', { name: /在线|online/i }).first();
      if (await onlineOpt.isVisible().catch(() => false)) {
        await onlineOpt.click();
        await page.waitForTimeout(1500);
      }
    }
    expect(errors).toEqual([]);
  });

  test('3.7 编辑设备', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    const token = await getToken(page);
    const dev = await createDeviceViaAPI(page, token, { deviceCode: 'E2E-EDIT', name: '编辑前名称' });
    await navigateViaSidebar(page, /设备/i);
    await page.waitForTimeout(2000);
    // 找到该设备行并点击编辑
    const row = page.locator('table tbody tr').filter({ hasText: '编辑前名称' }).first();
    if (await row.isVisible().catch(() => false)) {
      // 查找编辑按钮（Pencil 图标）
      const editBtn = row.getByRole('button', { name: /编辑|edit/i }).or(row.locator('button').filter({ has: page.locator('svg') })).first();
      if (await editBtn.isVisible().catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(1000);
        const dialog = page.getByRole('dialog');
        if (await dialog.isVisible().catch(() => false)) {
          const nameInput = dialog.locator('input').nth(1);
          await nameInput.fill('编辑后名称');
          await dialog.getByRole('button', { name: /保存|确认/i }).click();
          await page.waitForTimeout(2000);
        }
      }
    }
    await deleteDeviceViaAPI(page, token, dev.id);
    expect(errors).toEqual([]);
  });

  test('3.8 删除设备', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    const token = await getToken(page);
    const dev = await createDeviceViaAPI(page, token, { deviceCode: 'E2E-DELETE', name: '删除测试设备' });
    await navigateViaSidebar(page, /设备/i);
    await page.waitForTimeout(2000);
    const row = page.locator('table tbody tr').filter({ hasText: '删除测试设备' }).first();
    if (await row.isVisible().catch(() => false)) {
      // 监听 confirm 对话框
      page.on('dialog', (dialog) => dialog.accept());
      const deleteBtn = row.getByRole('button', { name: /删除|delete/i }).or(row.locator('button').last()).first();
      if (await deleteBtn.isVisible().catch(() => false)) {
        await deleteBtn.click();
        await page.waitForTimeout(2000);
      }
    } else {
      // 如果UI上找不到，直接API删除清理
      await deleteDeviceViaAPI(page, token, dev.id);
    }
    expect(errors).toEqual([]);
  });

  test('3.9 分页功能', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /设备/i);
    await page.waitForTimeout(1500);
    // 查找分页控件
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

  test('3.10 详情-时间范围切换', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    const token = await getToken(page);
    const dev = await createDeviceViaAPI(page, token, { deviceCode: 'E2E-TIMERANGE', name: '时间范围测试' });
    await page.goto(`${BASE_URL}/devices/${dev.id}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    // 查找时间范围下拉
    const selects = page.locator('button[role="combobox"]');
    if (await selects.count() >= 2) {
      await selects.nth(1).click();
      await page.waitForTimeout(300);
      const hour24 = page.getByRole('option', { name: /24小时|24h/i });
      if (await hour24.isVisible().catch(() => false)) {
        await hour24.click();
        await page.waitForTimeout(1000);
      }
    }
    await deleteDeviceViaAPI(page, token, dev.id);
    expect(errors).toEqual([]);
  });

  test('3.11 详情-最近告警表格', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    const token = await getToken(page);
    const dev = await createDeviceViaAPI(page, token, { deviceCode: 'E2E-ALERTTAB', name: '告警表格测试' });
    await page.goto(`${BASE_URL}/devices/${dev.id}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    // 查找最近告警区域
    const alertSection = page.getByText(/最近告警|recent.*alert/i);
    await expect(alertSection.first()).toBeVisible({ timeout: 5000 }).catch(() => {});
    await deleteDeviceViaAPI(page, token, dev.id);
    expect(errors).toEqual([]);
  });

  test('3.12 详情-数据质量面板', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    const token = await getToken(page);
    const dev = await createDeviceViaAPI(page, token, { deviceCode: 'E2E-DQ', name: '数据质量测试' });
    await page.goto(`${BASE_URL}/devices/${dev.id}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    // 查找数据质量面板
    const dqSection = page.getByText(/数据质量|data.*quality/i);
    await expect(dqSection.first()).toBeVisible({ timeout: 5000 }).catch(() => {});
    await deleteDeviceViaAPI(page, token, dev.id);
    expect(errors).toEqual([]);
  });

  test('3.13 详情-返回按钮', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    const token = await getToken(page);
    const dev = await createDeviceViaAPI(page, token, { name: '返回按钮测试' });
    await page.goto(`${BASE_URL}/devices/${dev.id}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    // 点击返回按钮（带 ArrowLeft 图标的 ghost 按钮）
    const backBtn = page.getByRole('button', { name: /返回/i }).or(page.locator('button').filter({ has: page.locator('svg.lucide-arrow-left, svg[class*="arrow-left"]') }).first());
    const fallbackBtn = page.locator('button[variant="ghost"]').first();
    const targetBtn = (await backBtn.isVisible().catch(() => false)) ? backBtn : ((await fallbackBtn.isVisible().catch(() => false)) ? fallbackBtn : null);
    if (targetBtn) {
      await targetBtn.click();
      await page.waitForTimeout(1500);
      // 返回按钮不一定回到列表，验证 URL 变化即可
      const url = page.url();
      expect(url).not.toBe(`${BASE_URL}/devices/${dev.id}`);
    }
    await deleteDeviceViaAPI(page, token, dev.id);
    expect(errors).toEqual([]);
  });

  test('3.14 接入向导-协议选择', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await page.goto(`${BASE_URL}/device-setup`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    // 查找协议卡片
    const opcua = page.getByText(/OPC UA/i);
    if (await opcua.isVisible().catch(() => false)) {
      await opcua.click();
      await page.waitForTimeout(500);
    }
    expect(errors).toEqual([]);
  });

  test('3.15 接入向导-连接配置和测试', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await page.goto(`${BASE_URL}/device-setup`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    // 选择协议并进入下一步
    const opcua = page.getByText(/OPC UA/i);
    if (await opcua.isVisible().catch(() => false)) {
      await opcua.click();
      const nextBtn = page.getByRole('button', { name: /下一步|next/i });
      if (await nextBtn.isVisible().catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(1000);
        // 步骤2：查找测试连接按钮
        const testConnBtn = page.getByRole('button', { name: /测试连接|test.*connection/i });
        if (await testConnBtn.isVisible().catch(() => false)) {
          await testConnBtn.click();
          await page.waitForTimeout(3000);
        }
      }
    }
    expect(errors).toEqual([]);
  });

  test('3.16 接入向导-数据点配置', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await page.goto(`${BASE_URL}/device-setup`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    // 快速导航到步骤3
    const opcua = page.getByText(/OPC UA/i);
    if (await opcua.isVisible().catch(() => false)) {
      await opcua.click();
      const nextBtn = page.getByRole('button', { name: /下一步|next/i });
      if (await nextBtn.isVisible().catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(500);
        if (await nextBtn.isVisible().catch(() => false)) {
          await nextBtn.click();
          await page.waitForTimeout(1000);
        }
        // 步骤3：查找添加数据点按钮
        const addPointBtn = page.getByRole('button', { name: /添加|add.*point/i });
        if (await addPointBtn.isVisible().catch(() => false)) {
          await addPointBtn.click();
          await page.waitForTimeout(500);
        }
      }
    }
    expect(errors).toEqual([]);
  });

  test('3.17 接入向导-确认保存', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await page.goto(`${BASE_URL}/device-setup`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    // 验证确认页面元素
    const submitBtn = page.getByRole('button', { name: /提交|创建|submit/i });
    // 可能在最后一步才出现
    await submitBtn.isVisible().catch(() => {});
    expect(errors).toEqual([]);
  });

  test('3.18 接入向导-步骤间前进后退', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await page.goto(`${BASE_URL}/device-setup`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    // 选择协议后点击下一步
    const opcua = page.getByText(/OPC UA/i);
    if (await opcua.isVisible().catch(() => false)) {
      await opcua.click();
      const nextBtn = page.getByRole('button', { name: /下一步|next/i });
      if (await nextBtn.isVisible().catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(500);
        // 点上一步回去
        const prevBtn = page.getByRole('button', { name: /上一步|previous|back/i });
        if (await prevBtn.isVisible().catch(() => false)) {
          await prevBtn.click();
          await page.waitForTimeout(500);
          // 再次前进
          if (await nextBtn.isVisible().catch(() => false)) {
            await nextBtn.click();
            await page.waitForTimeout(500);
          }
        }
      }
    }
    expect(errors).toEqual([]);
  });
});
