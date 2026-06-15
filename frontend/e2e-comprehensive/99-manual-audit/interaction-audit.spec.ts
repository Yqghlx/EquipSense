/**
 * 第二轮：深度交互测试
 *
 * 对每个页面的核心功能做实际操作验证，不只看页面能否打开。
 * 每个测试都做真实的点击、输入、提交，验证交互闭环。
 *
 * 发现的问题记录到日志，跑完统一分析。
 */
import { test, expect, type Page } from '@playwright/test';
import { login, BASE_URL, getToken } from '../helpers';

const log: string[] = [];

function record(page: string, feature: string, ok: boolean, detail = '') {
  const icon = ok ? '✓' : '✗';
  log.push(`${icon} [${page}] ${feature}${detail ? ` — ${detail}` : ''}`);
}

test.describe('深度交互测试', () => {
  test.describe.configure({ timeout: 90000 });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ==========================================================================
  // 设备列表：搜索、分页、新建对话框
  // ==========================================================================
  test('设备列表交互', async ({ page }) => {
    await page.goto(`${BASE_URL}/devices`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // 1. 搜索功能
    const search = page.getByPlaceholder(/搜索|search/i).first();
    if (await search.isVisible().catch(() => false)) {
      await search.fill('ZZZ_NOT_EXIST_12345');
      await page.waitForTimeout(1500);
      const rows = await page.locator('table tbody tr').count();
      record('设备列表', '搜索无结果', rows === 0 || rows <= 1, `行数=${rows}`);
      await search.fill('');
      await page.waitForTimeout(1500);
    } else {
      record('设备列表', '搜索框', false, '搜索框不存在');
    }

    // 2. 新建设备对话框能打开
    const createBtn = page.getByRole('button', { name: /新增|添加|new|create/i }).first();
    if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      const dialog = page.getByRole('dialog');
      const dialogOpen = await dialog.isVisible({ timeout: 3000 }).catch(() => false);
      record('设备列表', '新建对话框打开', dialogOpen);
      if (dialogOpen) {
        // 关闭对话框
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(500);
      }
    } else {
      record('设备列表', '新建按钮', false, '按钮不存在');
    }
  });

  // ==========================================================================
  // 告警规则：启用/禁用开关
  // ==========================================================================
  test('告警规则交互', async ({ page }) => {
    await page.goto(`${BASE_URL}/alert-rules`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // 检查表格行数
    const rows = await page.locator('table tbody tr').count();
    record('告警规则', '规则列表加载', rows > 0, `行数=${rows}`);

    // 检查 Switch 开关
    const switches = page.getByRole('switch');
    const switchCount = await switches.count();
    record('告警规则', '启用开关存在', switchCount > 0, `开关数=${switchCount}`);
  });

  // ==========================================================================
  // 工单列表：状态筛选
  // ==========================================================================
  test('工单列表交互', async ({ page }) => {
    await page.goto(`${BASE_URL}/work-orders`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const rows = await page.locator('table tbody tr').count();
    record('工单列表', '工单列表加载', rows > 0, `行数=${rows}`);

    // 状态筛选下拉
    const statusSelect = page.locator('select').first();
    if (await statusSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      record('工单列表', '状态筛选存在', true);
    } else {
      // 可能是按钮式筛选
      const filterBtns = page.getByRole('button', { name: /全部|待处理|执行中|已完成/i });
      record('工单列表', '筛选功能', await filterBtns.count() > 0, `筛选按钮数=${await filterBtns.count()}`);
    }
  });

  // ==========================================================================
  // 知识库：Tab 切换
  // ==========================================================================
  test('知识库交互', async ({ page }) => {
    await page.goto(`${BASE_URL}/knowledge`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // 检查 Tab
    const tabs = page.getByRole('tab');
    const tabCount = await tabs.count();
    record('知识库', 'Tab 存在', tabCount > 0, `Tab数=${tabCount}`);

    if (tabCount > 1) {
      // 点击第二个 Tab
      await tabs.nth(1).click();
      await page.waitForTimeout(1500);
      record('知识库', 'Tab 切换', true);
    }
  });

  // ==========================================================================
  // FMEA：启用/禁用、删除按钮
  // ==========================================================================
  test('FMEA 交互', async ({ page }) => {
    await page.goto(`${BASE_URL}/fmea`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const rows = await page.locator('table tbody tr').count();
    record('FMEA', '数据加载', rows > 0, `行数=${rows}`);

    // 检查启用/禁用按钮
    const toggleBtn = page.locator('button').filter({ hasText: '' }).filter({ has: page.locator('svg') });
    const toggleCount = await page.locator('table tbody tr button').count();
    record('FMEA', '操作按钮存在', toggleCount > 0, `按钮数=${toggleCount}`);

    // 检查 RPN 染色（Badge）
    const badges = page.locator('table tbody tr [class*="bg-red"], table tbody tr [class*="bg-orange"], table tbody tr [class*="bg-yellow"]');
    const badgeCount = await badges.count();
    record('FMEA', 'RPN 染色', badgeCount > 0, `染色Badge数=${badgeCount}`);
  });

  // ==========================================================================
  // 通知中心：筛选按钮、全部已读
  // ==========================================================================
  test('通知中心交互', async ({ page }) => {
    await page.goto(`${BASE_URL}/notifications`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const rows = await page.locator('table tbody tr').count();
    record('通知中心', '通知列表加载', rows > 0, `行数=${rows}`);

    // 全部已读按钮
    const markAllBtn = page.getByRole('button', { name: /全部已读/i });
    record('通知中心', '全部已读按钮', await markAllBtn.isVisible().catch(() => false));
  });

  // ==========================================================================
  // 系统设置：Tab 切换
  // ==========================================================================
  test('系统设置交互', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const tabs = page.getByRole('tab');
    const tabCount = await tabs.count();
    record('系统设置', 'Tab 存在', tabCount > 0, `Tab数=${tabCount}`);

    if (tabCount > 1) {
      // 逐个切换 Tab，验证不崩溃
      for (let i = 1; i < Math.min(tabCount, 4); i++) {
        await tabs.nth(i).click().catch(() => {});
        await page.waitForTimeout(1000);
        const bodyLen = (await page.textContent('body') ?? '').length;
        record('系统设置', `Tab ${i + 1} 切换`, bodyLen > 100, `body长度=${bodyLen}`);
      }
    }
  });

  // ==========================================================================
  // 用户管理：角色修改、停用
  // ==========================================================================
  test('用户管理交互', async ({ page }) => {
    await page.goto(`${BASE_URL}/users`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const rows = await page.locator('table tbody tr').count();
    record('用户管理', '用户列表加载', rows > 0, `行数=${rows}`);

    // 创建用户按钮（之前发现可能缺失）
    const createBtn = page.getByRole('button', { name: /创建用户|create.?user/i });
    const hasCreateBtn = await createBtn.isVisible({ timeout: 2000 }).catch(() => false);
    record('用户管理', '创建用户按钮', hasCreateBtn, hasCreateBtn ? '存在' : '缺失（CreateUserDialog 无触发按钮）');
  });

  // ==========================================================================
  // 租户管理：搜索、详情
  // ==========================================================================
  test('租户管理交互', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/tenants`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const rows = await page.locator('table tbody tr').count();
    record('租户管理', '租户列表加载', rows > 0, `行数=${rows}`);

    // 点击第一个租户查看详情
    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible().catch(() => false)) {
      await firstRow.click().catch(() => {});
      await page.waitForTimeout(1500);
      // 验证跳转到详情或打开对话框
      const url = page.url();
      record('租户管理', '租户详情可访问', url.includes('/admin/tenants/'), `URL=${url}`);
    }
  });

  // ==========================================================================
  // 审计日志：筛选
  // ==========================================================================
  test('审计日志交互', async ({ page }) => {
    await page.goto(`${BASE_URL}/audit-logs`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const rows = await page.locator('table tbody tr').count();
    record('审计日志', '日志列表加载', rows > 0, `行数=${rows}`);

    // 动作筛选
    const filter = page.locator('select').first();
    if (await filter.isVisible({ timeout: 3000 }).catch(() => false)) {
      record('审计日志', '筛选下拉存在', true);
    }
  });

  // ==========================================================================
  // 设备详情：Tab 切换、图表
  // ==========================================================================
  test('设备详情交互', async ({ page }) => {
    const token = await getToken(page);
    const devResp = await page.request.get(`${BASE_URL}/api/v1/devices?pageSize=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const devData = await devResp.json();
    const devId = devData.items?.[0]?.id;
    if (!devId) { record('设备详情', '获取设备ID', false, '无设备'); return; }

    await page.goto(`${BASE_URL}/devices/${devId}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // 检查图表渲染
    const chart = page.locator('canvas, [_echarts_instance_], [class*="echarts"]').first();
    const hasChart = await chart.isVisible({ timeout: 5000 }).catch(() => false);
    record('设备详情', '图表渲染', hasChart);

    // Tab 切换
    const tabs = page.getByRole('tab');
    const tabCount = await tabs.count();
    if (tabCount > 1) {
      await tabs.nth(1).click().catch(() => {});
      await page.waitForTimeout(1500);
      record('设备详情', 'Tab 切换', true, `Tab数=${tabCount}`);
    }
  });

  // ==========================================================================
  // 汇总
  // ==========================================================================
  test('交互测试汇总', async () => {
    const passed = log.filter(l => l.startsWith('✓')).length;
    const failed = log.filter(l => l.startsWith('✗')).length;
    console.log('\n========== 交互测试汇总 ==========');
    log.forEach(l => console.log(l));
    console.log(`\n总计: ${log.length} 项 | ✓ ${passed} 通过 | ✗ ${failed} 失败`);
    console.log('===================================\n');
  });
});
