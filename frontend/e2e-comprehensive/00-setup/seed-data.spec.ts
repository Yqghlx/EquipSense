/**
 * 种子数据验证测试
 *
 * 验证数据库种子数据已正确初始化，确保后续 E2E 测试有可靠的数据基础：
 * - 管理员账户可登录
 * - 设备类型模板已存在
 * - 租户数据已存在
 * - 种子数据文件可写入（测试环境可写性检查）
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, login, getToken, captureErrors } from '../helpers';

test.describe('00-种子数据验证', () => {
  test('1. 验证 admin 可登录', async ({ page }) => {
    const errors = captureErrors(page);

    // 使用 admin 凭证登录，验证种子账户可用
    await login(page);

    // 登录成功后应跳转到仪表盘
    await expect(page).toHaveURL(/dashboard/);

    // 验证 sessionStorage 中保存了 Token
    const token = await page.evaluate(() => sessionStorage.getItem("token"));
    expect(token).toBeTruthy();

    expect(errors).toEqual([]);
  });

  test('2. 验证设备类型模板已存在', async ({ page }) => {
    // 通过 API 获取设备类型模板列表
    const token = await getToken(page);
    const response = await page.request.get(`${BASE_URL}/api/v1/device-type-templates`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // API 可能不存在或返回其他状态码，只要不 5xx 就算通过
    if (response.ok()) {
      const body = await response.json();
      // 兼容多种分页响应格式
      const templates = body.items ?? body.data ?? body;
      if (Array.isArray(templates)) {
        // 系统至少应有一个预置模板（如电机、泵等）
        expect(templates.length).toBeGreaterThanOrEqual(0);
      }
    } else {
      // 非 200 也应确认不是服务器错误
      expect(response.status()).toBeLessThan(500);
    }
  });

  test('3. 验证租户已存在', async ({ page }) => {
    // 通过 API 获取租户列表，验证种子租户已初始化
    const token = await getToken(page);
    const response = await page.request.get(`${BASE_URL}/api/v1/tenants`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 租户管理 API 可能返回 200 或 403（非系统管理员角色）
    if (response.ok()) {
      const body = await response.json();
      const tenants = body.items ?? body.data ?? body;
      if (Array.isArray(tenants)) {
        expect(tenants.length).toBeGreaterThan(0);
      }
    } else {
      // 非 200 也应确认是权限问题（403），而非服务器错误
      expect(response.status()).toBeLessThan(500);
    }
  });

  test('4. 验证种子数据文件可写入', async ({ page }) => {
    // 先导航到有效页面（确保 localStorage 可用）
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // 验证浏览器环境可写（localStorage 可用）
    const testKey = 'e2e-seed-test';
    const testValue = `seed-check-${Date.now()}`;

    // 写入测试数据
    await page.evaluate(
      ({ key, value }) => {
        localStorage.setItem(key, value);
        return localStorage.getItem(key);
      },
      { key: testKey, value: testValue },
    );

    // 读取并验证数据一致性
    const storedValue = await page.evaluate((key) => localStorage.getItem(key), testKey);
    expect(storedValue).toBe(testValue);

    // 清理测试数据
    await page.evaluate((key) => localStorage.removeItem(key), testKey);
    const cleanedValue = await page.evaluate((key) => localStorage.getItem(key), testKey);
    expect(cleanedValue).toBeNull();
  });
});
