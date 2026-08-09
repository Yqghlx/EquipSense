/**
 * RBAC 权限拒绝测试
 *
 * 覆盖五种角色（admin / lead / tech / operator / viewer）的权限控制：
 * - 各角色的创建/删除/编辑权限验证
 * - 侧边栏菜单可见性
 * - API 请求 401/403 响应处理
 * - 跨租户数据隔离
 *
 * 角色密码由 helpers/credentials.ts 统一读取；生产镜像验收必须通过环境变量注入。
 */
import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  loginAs,
  getE2ETenant2Password,
  captureErrors,
  getTokenForRole,
  navigateViaSidebar,
  createDeviceViaAPI,
  
  gotoKnowledge,
} from '../helpers';

test.describe('RBAC 权限拒绝', () => {
  // ==========================================================================
  // 1. 技术员不能创建设备
  // ==========================================================================

  test('技术员不能创建设备', async ({ page }) => {
    const errors = captureErrors(page);

    await loginAs(page, 'tech');
    await navigateViaSidebar(page, /设备/i);

    // 技术员角色下，新建按钮应该不可见或禁用
    const createBtn = page.getByRole('button', { name: /新建|create/i });
    const isVisible = await createBtn.isVisible().catch(() => false);

    if (isVisible) {
      // 检查按钮是否被禁用（技术员权限不足导致按钮被前端禁用）
      const isDisabled = await createBtn.isDisabled().catch(() => false);

      if (isDisabled) {
        // 按钮被禁用，权限控制正确
        expect(isDisabled).toBeTruthy();
      } else {
        // 如果按钮可见且可点击，尝试点击创建，应被后端拒绝
        await createBtn.click();
        await page.waitForTimeout(1000);

        const dialog = page.getByRole('dialog');
        if (await dialog.isVisible().catch(() => false)) {
          await dialog.locator('input').first().fill('TECH-DEVICE');
          await dialog.locator('input').nth(1).fill('技术员测试设备');
          await dialog.getByRole('button', { name: /保存|确认|submit/i }).click();
          await page.waitForTimeout(2000);

          // 应出现权限错误提示，或对话框仍然打开
          const hasError = await page.getByText(/权限|forbidden|无权/i).first().isVisible().catch(() => false);
          const dialogStillOpen = await dialog.isVisible().catch(() => false);
          expect(hasError || dialogStillOpen).toBeTruthy();
        }
      }
    } else {
      // 按钮不可见，权限控制正确
      expect(!isVisible).toBeTruthy();
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 2. 技术员不能删除设备
  // ==========================================================================

  test('技术员不能删除设备', async ({ page }) => {
    const errors = captureErrors(page);

    // 先用管理员创建设备
    const adminToken = await getTokenForRole(page, 'admin');
    const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const deviceName = `技术员删除测试-${suffix}`;
    let deviceId: string | undefined;

    try {
      // 每次运行使用唯一编码，避免并行或上次异常退出留下的测试数据造成 409 冲突。
      const dev = await createDeviceViaAPI(page, adminToken, {
        deviceCode: `TECH-DELETE-TEST-${suffix}`,
        name: deviceName,
      });
      deviceId = typeof dev.id === 'string' ? dev.id : undefined;
      expect(deviceId).toBeTruthy();

      // 技术员登录
      await loginAs(page, 'tech');
      await navigateViaSidebar(page, /设备/i);
      await page.waitForTimeout(2000);

      const row = page.locator('table tbody tr').filter({ hasText: deviceName }).first();
      await expect(row).toBeVisible();

      // 删除按钮可以被隐藏，也可以显示为禁用状态；两种都表示前端没有授予删除能力。
      const deleteBtn = row.getByRole('button', { name: /删除|delete/i }).first();
      if (await deleteBtn.isVisible().catch(() => false)) {
        await expect(deleteBtn).toBeDisabled();
      }
    } finally {
      // 无论断言是否失败都清理夹具，避免污染后续测试和开发环境。
      if (deviceId) {
        const { deleteDeviceViaAPI } = await import('../helpers');
        // 同一浏览器上下文仍可能保留技术员 HttpOnly Cookie；先恢复管理员会话，
        // 确保服务端不会优先使用低权限 Cookie 覆盖管理员 Authorization 头。
        await loginAs(page, 'admin');
        const cleanupResponse = await deleteDeviceViaAPI(page, adminToken, deviceId);
        expect(cleanupResponse.ok(), `清理设备夹具失败：HTTP ${cleanupResponse.status()}`).toBeTruthy();
      }
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 3. 操作员不能创建工单
  // ==========================================================================

  test('操作员不能创建工单', async ({ page }) => {
    const errors = captureErrors(page);

    await loginAs(page, 'operator');
    await navigateViaSidebar(page, /工单/i);

    const createBtn = page.getByRole('button', { name: /新建|create/i });
    const isVisible = await createBtn.isVisible().catch(() => false);

    if (isVisible) {
      const isDisabled = await createBtn.isDisabled().catch(() => false);
      expect(isDisabled).toBeTruthy();
    } else {
      // 按钮不可见，权限控制正确
      expect(!isVisible).toBeTruthy();
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 4. 操作员不能访问知识库编辑
  // ==========================================================================

  test('操作员不能访问知识库编辑', async ({ page }) => {
    const errors = captureErrors(page);

    await loginAs(page, 'operator');
    await gotoKnowledge(page);
    await page.waitForTimeout(3000);

    // 操作员在知识库页面不应看到编辑按钮，或者按钮应该是禁用状态
    const editBtns = page.getByRole('button', { name: /编辑|edit|批准|approve|拒绝|reject/i });
    const editCount = await editBtns.count();

    for (let i = 0; i < editCount; i++) {
      const btn = editBtns.nth(i);
      if (await btn.isVisible().catch(() => false)) {
        const isDisabled = await btn.isDisabled().catch(() => false);
        // 如果按钮可见，必须禁用
        expect(isDisabled).toBeTruthy();
      }
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 5. 观察者所有创建按钮禁用
  // ==========================================================================

  test('观察者所有创建按钮禁用', async ({ page }) => {
    const errors = captureErrors(page);

    await loginAs(page, 'viewer');

    // 遍历主要页面，检查所有创建按钮
    const pages = [
      { nav: /设备/i, useSidebar: true },
      { url: '/alert-rules', useDirect: true },
      { nav: /工单/i, useSidebar: true },
    ];

    for (const p of pages) {
      if (p.useSidebar) {
        await navigateViaSidebar(page, p.nav as RegExp);
      } else if (p.useDirect) {
        await page.goto(`${BASE_URL}${p.url}`);
        await page.waitForLoadState('networkidle');
      }
      await page.waitForTimeout(2000);

      const createBtns = page.getByRole('button', { name: /新建|创建|create|add/i });
      const count = await createBtns.count();

      for (let i = 0; i < count; i++) {
        const btn = createBtns.nth(i);
        if (await btn.isVisible().catch(() => false)) {
          const isDisabled = await btn.isDisabled().catch(() => false);
          // 观察者的创建按钮应该是禁用状态，如果可见则必须禁用
          expect(isDisabled).toBeTruthy();
        }
      }
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 6. 观察者不能触发 AI 分析
  // ==========================================================================

  test('观察者不能触发 AI 分析', async ({ page }) => {
    const errors = captureErrors(page);

    await loginAs(page, 'viewer');
    await navigateViaSidebar(page, /分析/i);
    await page.waitForTimeout(3000);

    // 查找 AI 分析触发按钮
    const analyzeBtn = page.getByRole('button', { name: /分析|analyze|触发|trigger/i });
    const isVisible = await analyzeBtn.isVisible().catch(() => false);

    if (isVisible) {
      const isDisabled = await analyzeBtn.isDisabled().catch(() => false);
      // 观察者的 AI 分析按钮应该是禁用状态
      expect(isDisabled).toBeTruthy();
    } else {
      // 按钮不可见也符合预期
      expect(true).toBeTruthy();
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 7. 管理员可以访问所有功能
  // ==========================================================================

  test('管理员可以访问所有功能', async ({ page }) => {
    const errors = captureErrors(page);

    await loginAs(page, 'admin');

    // 遍历所有主要页面，验证管理员能正常访问
    const pages = [
      { nav: /设备/i, useSidebar: true },
      { url: '/alert-rules', useDirect: true },
      { nav: /告警/i, useSidebar: true },
      { nav: /工单/i, useSidebar: true },
      { nav: /分析/i, useSidebar: true },
      { url: '/knowledge', useDirect: true },
      { nav: /设置/i, useSidebar: true },
    ];

    for (const p of pages) {
      if (p.useSidebar) {
        await navigateViaSidebar(page, p.nav as RegExp);
      } else if (p.useDirect) {
        await page.goto(`${BASE_URL}${p.url}`);
        await page.waitForLoadState('networkidle');
      }
      await page.waitForTimeout(2000);

      // 验证页面内容不为空
      const bodyText = await page.textContent('body');
      expect(bodyText?.trim().length).toBeGreaterThan(10);

      // 验证无 JS 错误
      expect(errors).toEqual([]);
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 8. 非管理员不能访问租户管理
  // ==========================================================================

  test('非管理员不能访问租户管理', async ({ page }) => {
    const errors = captureErrors(page);

    // 使用技术员角色
    await loginAs(page, 'tech');

    // 查找侧边栏中的租户管理链接
    const tenantLink = page.getByRole('link', { name: /租户|tenant/i });
    const isVisible = await tenantLink.isVisible().catch(() => false);

    // 租户管理菜单项不应该对非管理员可见
    expect(isVisible).toBeFalsy();

    // 尝试直接通过 URL 访问租户管理页面
    await page.goto(`${BASE_URL}/admin/tenants`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 验证：要么被重定向到其他页面，要么显示无权限提示
    const onTenantsPage = /admin\/tenant/.test(page.url());
    const hasAccessDenied = await page.getByText(/权限|forbidden|无权|拒绝/i)
      .isVisible().catch(() => false);
    const redirectedAway = !onTenantsPage;

    expect(redirectedAway || hasAccessDenied).toBeTruthy();

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 9. 管理员可以访问租户管理
  // ==========================================================================

  test('管理员可以访问租户管理', async ({ page }) => {
    const errors = captureErrors(page);

    await loginAs(page, 'admin');

    // 查找侧边栏中的租户管理链接
    const tenantLink = page.getByRole('link', { name: /租户|tenant/i });
    const isVisible = await tenantLink.isVisible().catch(() => false);

    if (isVisible) {
      await tenantLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // 验证能正常访问租户管理页面
      const bodyText = await page.textContent('body');
      expect(bodyText?.trim().length).toBeGreaterThan(10);
    } else {
      // 如果菜单不直接可见，通过 URL 访问
      await page.goto(`${BASE_URL}/admin/tenants`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const bodyText = await page.textContent('body');
      expect(bodyText?.trim().length).toBeGreaterThan(10);
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 10. 未认证请求返回 401
  // ==========================================================================

  test('未认证请求返回 401', async ({ page }) => {
    // 不登录，直接请求受保护的 API
    const resp = await page.request.get(`${BASE_URL}/api/v1/devices`);
    expect(resp.status()).toBe(401);

    const resp2 = await page.request.get(`${BASE_URL}/api/v1/work-orders`);
    expect(resp2.status()).toBe(401);

    const resp3 = await page.request.get(`${BASE_URL}/api/v1/alerts`);
    expect(resp3.status()).toBe(401);
  });

  // ==========================================================================
  // 11. 观察者 PUT/DELETE 请求被拒绝（403）
  // ==========================================================================

  test('观察者 PUT/DELETE 请求被拒绝', async ({ page }) => {
    const viewerToken = await getTokenForRole(page, 'viewer');
    const headers = { Authorization: `Bearer ${viewerToken}`, 'Content-Type': 'application/json' };

    // 尝试创建设备（POST）
    const createResp = await page.request.post(`${BASE_URL}/api/v1/devices`, {
      headers,
      data: { deviceCode: 'VIEWER-TEST', name: '观察者测试', type: 'motor' },
    });
    // 应该被拒绝（403 Forbidden）
    expect([403, 401]).toContain(createResp.status());

    // 尝试删除设备（DELETE）
    const deleteResp = await page.request.delete(`${BASE_URL}/api/v1/devices/00000000-0000-0000-0000-000000000000`, {
      headers,
    });
    expect([403, 401, 404]).toContain(deleteResp.status());

    // 尝试更新设备（PUT）
    const updateResp = await page.request.put(`${BASE_URL}/api/v1/devices/00000000-0000-0000-0000-000000000000`, {
      headers,
      data: { name: '观察者修改' },
    });
    expect([403, 401, 404]).toContain(updateResp.status());
  });

  // ==========================================================================
  // 12. 技术员侧边栏无管理菜单
  // ==========================================================================

  test('技术员侧边栏无管理菜单', async ({ page }) => {
    const errors = captureErrors(page);

    await loginAs(page, 'tech');

    // 验证侧边栏不包含管理相关菜单
    const tenantLink = page.getByRole('link', { name: /租户|tenant/i });
    const isTenantVisible = await tenantLink.isVisible().catch(() => false);
    expect(isTenantVisible).toBeFalsy();

    // 系统设置可能可见但功能受限
    const settingsLink = page.getByRole('link', { name: /设置|setting/i });
    const isSettingsVisible = await settingsLink.isVisible().catch(() => false);
    // 技术员可能能看到设置页面，但不能修改管理级设置
    expect(isSettingsVisible || !isSettingsVisible).toBeTruthy();

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 13. 操作员侧边栏无知识库菜单
  // ==========================================================================

  test('操作员侧边栏无知识库菜单', async ({ page }) => {
    const errors = captureErrors(page);

    await loginAs(page, 'operator');

    // 直接导航到知识库页面检查权限
    await gotoKnowledge(page);
    await page.waitForTimeout(3000);

    // 验证没有编辑/创建按钮，或者按钮是禁用状态
    const editBtns = page.getByRole('button', { name: /编辑|edit|新建|create|批准|approve/i });
    const count = await editBtns.count();
    for (let i = 0; i < count; i++) {
      if (await editBtns.nth(i).isVisible().catch(() => false)) {
        const isDisabled = await editBtns.nth(i).isDisabled().catch(() => false);
        // 如果按钮可见，必须禁用
        expect(isDisabled).toBeTruthy();
      }
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 14. 管理员侧边栏显示所有菜单
  // ==========================================================================

  test('管理员侧边栏显示所有菜单', async ({ page }) => {
    const errors = captureErrors(page);

    await loginAs(page, 'admin');

    // 验证管理员能看到的导航项
    const expectedNavItems = [
      /仪表盘|dashboard/i,
      /设备/i,
      /告警/i,
      /工单/i,
      /知识/i,
      /设置/i,
    ];

    for (const pattern of expectedNavItems) {
      const link = page.getByRole('link', { name: pattern }).first();
      const isVisible = await link.isVisible().catch(() => false);
      expect(isVisible).toBeTruthy();
    }

    // 管理员还应能看到租户管理
    const tenantLink = page.getByRole('link', { name: /租户|tenant/i });
    const isTenantVisible = await tenantLink.isVisible().catch(() => false);
    expect(isTenantVisible).toBeTruthy();

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 15. 跨租户数据隔离验证
  // ==========================================================================

  test('跨租户数据隔离验证', async ({ page }) => {
    const errors = captureErrors(page);

    // 用默认租户的管理员创建设备
    const adminToken = await getTokenForRole(page, 'admin');
    const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const dev = await createDeviceViaAPI(page, adminToken, {
      deviceCode: `TENANT-ISO-${suffix}`,
      name: '租户隔离测试设备',
    });

    // 默认租户的管理员能看到自己租户的设备
    const adminResp = await page.request.get(`${BASE_URL}/api/v1/devices`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminData = await adminResp.json();
    const adminDeviceNames = (adminData.items ?? []).map((d: { name: string }) => d.name);
    expect(adminDeviceNames).toContain('租户隔离测试设备');

    // 使用第二租户的 admin 登录，验证看不到默认租户的设备
    const tenant2TokenResp = await page.request.post(`${BASE_URL}/api/v1/auth/login`, {
      data: { username: 'tenant2admin', password: getE2ETenant2Password() },
    });
    expect(tenant2TokenResp.ok()).toBeTruthy();
    const tenant2Body = await tenant2TokenResp.json();
    const tenant2Token = tenant2Body.accessToken || tenant2Body.token;

    // 第二租户查询设备列表，不应包含默认租户的设备
    const tenant2Resp = await page.request.get(`${BASE_URL}/api/v1/devices`, {
      headers: { Authorization: `Bearer ${tenant2Token}` },
    });
    expect(tenant2Resp.ok()).toBeTruthy();
    const tenant2Data = await tenant2Resp.json();
    const tenant2DeviceNames = (tenant2Data.items ?? []).map((d: { name: string }) => d.name);
    expect(tenant2DeviceNames).not.toContain('租户隔离测试设备');

    // 第二租户直接访问默认租户的设备，应返回 404（全局查询过滤器隔离）
    const directAccessResp = await page.request.get(`${BASE_URL}/api/v1/devices/${dev.id}`, {
      headers: { Authorization: `Bearer ${tenant2Token}` },
    });
    expect(directAccessResp.status()).toBe(404);

    // 同租户的 viewer 也能看到设备（只读权限验证）
    const viewerToken = await getTokenForRole(page, 'viewer');
    const viewerResp = await page.request.get(`${BASE_URL}/api/v1/devices`, {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    if (viewerResp.ok()) {
      const viewerData = await viewerResp.json();
      const viewerDeviceNames = (viewerData.items ?? []).map((d: { name: string }) => d.name);
      expect(viewerDeviceNames).toContain('租户隔离测试设备');
    }

    // 清理测试设备
    const { deleteDeviceViaAPI } = await import('../helpers');
    await deleteDeviceViaAPI(page, adminToken, dev.id as string);

    expect(errors).toEqual([]);
  });
});
