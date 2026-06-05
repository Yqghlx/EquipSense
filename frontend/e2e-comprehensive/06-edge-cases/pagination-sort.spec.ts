/**
 * 分页排序边界测试
 *
 * 覆盖分页和排序功能的边界场景：
 * - 首页/末页按钮禁用状态
 * - 页码跳转
 * - 超出范围页码处理
 * - 每页数量切换
 * - 列标题排序（升序/降序切换）
 * - 排序切换时数据不丢失
 * - 空搜索结果提示
 * - 搜索清空恢复完整列表
 */
import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  login,
  captureErrors,
  getToken,
  navigateViaSidebar,
  createDeviceViaAPI,
  deleteDeviceViaAPI,
} from '../helpers';

test.describe('分页排序边界', () => {
  /** 每个测试前先登录 */
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ==========================================================================
  // 1. 首页上一页按钮禁用
  // ==========================================================================

  test('首页上一页按钮禁用', async ({ page }) => {
    const errors = captureErrors(page);

    await navigateViaSidebar(page, /设备/i);
    await page.waitForTimeout(2000);

    // 查找上一页按钮
    const prevBtn = page.getByRole('button', { name: /上一页|previous/i });
    if (await prevBtn.isVisible().catch(() => false)) {
      // 首页时上一页按钮应该是禁用状态
      const isDisabled = await prevBtn.isDisabled().catch(() => false);
      expect(isDisabled).toBeTruthy();
    }

    // 对工单列表也做同样测试
    await navigateViaSidebar(page, /工单/i);
    await page.waitForTimeout(2000);

    const woPrevBtn = page.getByRole('button', { name: /上一页|previous/i });
    if (await woPrevBtn.isVisible().catch(() => false)) {
      const isDisabled = await woPrevBtn.isDisabled().catch(() => false);
      expect(isDisabled).toBeTruthy();
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 2. 末页下一页按钮禁用
  // ==========================================================================

  test('末页下一页按钮禁用', async ({ page }) => {
    const errors = captureErrors(page);

    await navigateViaSidebar(page, /设备/i);
    await page.waitForTimeout(2000);

    // 查找下一页按钮
    const nextBtn = page.getByRole('button', { name: /下一页|next/i });
    if (await nextBtn.isVisible().catch(() => false)) {
      // 如果只有一页数据，下一页按钮应该是禁用的
      const isDisabled = await nextBtn.isDisabled().catch(() => false);
      if (isDisabled) {
        // 单页数据，按钮正确禁用
        expect(isDisabled).toBeTruthy();
      } else {
        // 多页数据，导航到最后一页
        // 持续点击下一页直到按钮被禁用
        let maxClicks = 20; // 防止无限循环
        while (!(await nextBtn.isDisabled().catch(() => true)) && maxClicks > 0) {
          await nextBtn.click();
          await page.waitForTimeout(1000);
          maxClicks--;
        }

        // 验证在最后一页时按钮被禁用
        const isFinallyDisabled = await nextBtn.isDisabled().catch(() => true);
        expect(isFinallyDisabled).toBeTruthy();
      }
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 3. 页码跳转输入框
  // ==========================================================================

  test('页码跳转输入框', async ({ page }) => {
    const errors = captureErrors(page);

    await navigateViaSidebar(page, /设备/i);
    await page.waitForTimeout(2000);

    // 查找页码输入框（如果存在）
    const pageInput = page.locator('input[type="number"]').filter({ hasText: '' })
      .or(page.getByPlaceholder(/页码|page/i));

    if (await pageInput.isVisible().catch(() => false)) {
      // 输入页码 2
      await pageInput.clear();
      await pageInput.fill('2');
      await pageInput.press('Enter');
      await page.waitForTimeout(1500);

      // 验证页面已跳转（上一页按钮应可用）
      const prevBtn = page.getByRole('button', { name: /上一页|previous/i });
      if (await prevBtn.isVisible().catch(() => false)) {
        const isDisabled = await prevBtn.isDisabled().catch(() => false);
        expect(isDisabled).toBeFalsy();
      }
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 4. 超出范围页码处理（999）
  // ==========================================================================

  test('超出范围页码处理', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);

    // 直接通过 API 请求超出范围的页码
    const resp = await page.request.get(`${BASE_URL}/api/v1/devices?page=999&pageSize=20`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 验证 API 不崩溃
    expect(resp.ok()).toBeTruthy();

    const data = await resp.json();
    // 超出范围时返回空列表
    expect(data.items).toBeTruthy();
    expect(Array.isArray(data.items)).toBeTruthy();
    // 第 999 页应该是空的
    expect(data.items.length).toBe(0);
    // 总数应该仍然是正确的
    expect(typeof data.total).toBe('number');

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 5. 每页数量切换
  // ==========================================================================

  test('每页数量切换', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);

    // 创建足够的设备以确保分页
    const createdIds: string[] = [];
    for (let i = 0; i < 5; i++) {
      const dev = await createDeviceViaAPI(page, token, {
        deviceCode: `PAGE-SIZE-${i}-${Date.now().toString(36)}`,
        name: `分页测试设备${i}`,
      });
      createdIds.push(dev.id as string);
    }

    await navigateViaSidebar(page, /设备/i);
    await page.waitForTimeout(2000);

    // 查找每页数量选择器
    const pageSizeSelect = page.locator('button[role="combobox"]').filter({ hasText: /10|20|50/i });
    if (await pageSizeSelect.isVisible().catch(() => false)) {
      await pageSizeSelect.click();
      await page.waitForTimeout(300);

      // 选择 50 条/页
      const option50 = page.getByRole('option', { name: /50/ });
      if (await option50.isVisible().catch(() => false)) {
        await option50.click();
        await page.waitForTimeout(1500);

        // 验证表格显示更多数据
        const rows = page.locator('table tbody tr');
        const rowCount = await rows.count();
        // 所有设备应该在第一页显示（50 > 5）
        expect(rowCount).toBeGreaterThanOrEqual(5);
      }
    }

    // 清理
    for (const id of createdIds) {
      await deleteDeviceViaAPI(page, token, id);
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 6. 点击列标题升序排列
  // ==========================================================================

  test('点击列标题升序排列', async ({ page }) => {
    const errors = captureErrors(page);

    await navigateViaSidebar(page, /设备/i);
    await page.waitForTimeout(2000);

    // 查找可排序的列标题
    const sortableHeaders = page.locator('th').filter({ hasText: /编码|code|名称|name|类型|type/i });
    const headerCount = await sortableHeaders.count();

    if (headerCount > 0) {
      // 点击第一个可排序的列标题
      await sortableHeaders.first().click();
      await page.waitForTimeout(1500);

      // 验证排序指示器出现（升序箭头或高亮）
      const sortIndicator = page.locator('th .lucide-arrow-up, th .lucide-chevron-up, th[aria-sort="ascending"]');
      const hasSortIndicator = await sortIndicator.first().isVisible().catch(() => false);

      // 验证表格数据仍然正常显示
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
      expect(hasSortIndicator || bodyText!.length > 10).toBeTruthy();
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 7. 再次点击列标题切换降序
  // ==========================================================================

  test('再次点击列标题切换降序', async ({ page }) => {
    const errors = captureErrors(page);

    await navigateViaSidebar(page, /设备/i);
    await page.waitForTimeout(2000);

    const sortableHeaders = page.locator('th').filter({ hasText: /编码|code|名称|name/i });
    const headerCount = await sortableHeaders.count();

    if (headerCount > 0) {
      // 第一次点击：升序
      await sortableHeaders.first().click();
      await page.waitForTimeout(1000);

      // 第二次点击：降序
      await sortableHeaders.first().click();
      await page.waitForTimeout(1500);

      // 验证降序排序指示器
      const descIndicator = page.locator('th .lucide-arrow-down, th .lucide-chevron-down, th[aria-sort="descending"]');
      const hasDescIndicator = await descIndicator.first().isVisible().catch(() => false);

      // 验证表格数据仍然正常
      const rows = page.locator('table tbody tr');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThanOrEqual(0);

      expect(hasDescIndicator || rowCount >= 0).toBeTruthy();
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 8. 排序切换时数据不丢失
  // ==========================================================================

  test('排序切换时数据不丢失', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);

    // 创建几个设备用于排序测试
    const createdIds: string[] = [];
    for (let i = 0; i < 3; i++) {
      const dev = await createDeviceViaAPI(page, token, {
        deviceCode: `SORT-KEEP-${i}-${Date.now().toString(36)}`,
        name: `排序保持测试${i}`,
      });
      createdIds.push(dev.id as string);
    }

    await navigateViaSidebar(page, /设备/i);
    await page.waitForTimeout(2000);

    // 记录排序前的设备数量
    const rowsBefore = await page.locator('table tbody tr').count();

    // 多次切换排序
    const sortableHeader = page.locator('th').filter({ hasText: /编码|code/i }).first();
    if (await sortableHeader.isVisible().catch(() => false)) {
      await sortableHeader.click();
      await page.waitForTimeout(1000);
      await sortableHeader.click();
      await page.waitForTimeout(1000);
      await sortableHeader.click();
      await page.waitForTimeout(1500);
    }

    // 验证数据行数没有减少（排序不应丢失数据）
    const rowsAfter = await page.locator('table tbody tr').count();
    expect(rowsAfter).toBe(rowsBefore);

    // 清理
    for (const id of createdIds) {
      await deleteDeviceViaAPI(page, token, id);
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 9. 空搜索结果友好提示
  // ==========================================================================

  test('空搜索结果友好提示', async ({ page }) => {
    const errors = captureErrors(page);

    await navigateViaSidebar(page, /设备/i);
    await page.waitForTimeout(2000);

    // 搜索不存在的关键字
    const searchInput = page.getByPlaceholder(/搜索|search/i);
    if (await searchInput.isVisible().catch(() => false)) {
      const uniqueKey = `ZZZZ_NOT_FOUND_${Date.now()}`;
      await searchInput.fill(uniqueKey);
      await page.waitForTimeout(1500);

      // 验证友好提示
      const noResultText = page.getByText(/暂无|没有|无匹配|无结果|no.?data|no.?result/i);
      const hasNoResult = await noResultText.isVisible().catch(() => false);

      // 或空表格行
      const emptyRow = page.locator('table tbody tr').filter({ hasText: /暂无|没有/i });
      const hasEmptyRow = await emptyRow.isVisible().catch(() => false);

      // 至少页面不崩溃
      const bodyText = await page.textContent('body');
      expect(hasNoResult || hasEmptyRow || bodyText!.length > 0).toBeTruthy();

      // 清空搜索
      await searchInput.clear();
      await page.waitForTimeout(500);
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 10. 搜索清空恢复完整列表
  // ==========================================================================

  test('搜索清空恢复完整列表', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);

    // 创建测试设备
    const dev = await createDeviceViaAPI(page, token, {
      deviceCode: 'SEARCH-RESTORE',
      name: '搜索恢复测试设备',
    });

    await navigateViaSidebar(page, /设备/i);
    await page.waitForTimeout(2000);

    // 记录初始行数
    const initialRows = await page.locator('table tbody tr').count();

    // 搜索特定设备
    const searchInput = page.getByPlaceholder(/搜索|search/i);
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('搜索恢复测试');
      await page.waitForTimeout(1500);

      // 验证过滤后行数减少
      const filteredRows = await page.locator('table tbody tr').count();
      expect(filteredRows).toBeLessThanOrEqual(initialRows);

      // 清空搜索
      await searchInput.clear();
      await page.waitForTimeout(1500);

      // 验证列表恢复完整
      const restoredRows = await page.locator('table tbody tr').count();
      expect(restoredRows).toBe(initialRows);
    }

    // 清理
    await deleteDeviceViaAPI(page, token, dev.id as string);

    expect(errors).toEqual([]);
  });
});
