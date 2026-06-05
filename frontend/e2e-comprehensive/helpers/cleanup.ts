/**
 * 数据清理辅助函数
 *
 * 提供 E2E 测试结束后清理测试数据的功能。
 * 所有清理操作基于 "E2E-" 前缀匹配，只删除测试创建的资源。
 */
import { type Page } from '@playwright/test';
import { getToken } from './auth';
import { BASE_URL } from './auth';

/**
 * 清理所有 E2E- 前缀的测试设备
 *
 * 查询设备列表，筛选编码以 "E2E-" 开头的设备并逐一删除。
 * 用于测试结束后的数据清理，确保不污染其他测试。
 *
 * @param page - Playwright Page 实例
 * @param token - 可选的认证 Token（不传则自动获取管理员 Token）
 */
export async function cleanupTestDevices(
  page: Page,
  token?: string,
): Promise<void> {
  const authToken = token || await getToken(page);

  try {
    // 查询设备列表（分页获取尽可能多的设备）
    const resp = await page.request.get(`${BASE_URL}/api/v1/devices?pageSize=100`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!resp.ok()) {
      console.warn(`[清理] 查询设备列表失败: ${resp.status()}`);
      return;
    }

    const body = await resp.json();
    const devices: Array<{ id: string; deviceCode?: string }> = body.items || body.data || body;

    // 筛选并删除 E2E- 前缀设备
    const testDevices = devices.filter(
      (d) => d.deviceCode?.startsWith('E2E-'),
    );

    for (const device of testDevices) {
      await page.request.delete(`${BASE_URL}/api/v1/devices/${device.id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
    }

    if (testDevices.length > 0) {
      console.log(`[清理] 已删除 ${testDevices.length} 个测试设备`);
    }
  } catch (err) {
    console.warn(`[清理] 设备清理失败: ${(err as Error).message}`);
  }
}

/**
 * 清理所有 E2E- 前缀的测试工单
 *
 * 查询工单列表，筛选标题以 "E2E-" 开头的工单并逐一删除。
 *
 * @param page - Playwright Page 实例
 * @param token - 可选的认证 Token（不传则自动获取管理员 Token）
 */
export async function cleanupTestWorkOrders(
  page: Page,
  token?: string,
): Promise<void> {
  const authToken = token || await getToken(page);

  try {
    const resp = await page.request.get(`${BASE_URL}/api/v1/work-orders?pageSize=100`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!resp.ok()) {
      console.warn(`[清理] 查询工单列表失败: ${resp.status()}`);
      return;
    }

    const body = await resp.json();
    const workOrders: Array<{ id: string; title?: string }> = body.items || body.data || body;

    const testOrders = workOrders.filter(
      (wo) => wo.title?.startsWith('E2E-'),
    );

    for (const wo of testOrders) {
      await page.request.delete(`${BASE_URL}/api/v1/work-orders/${wo.id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
    }

    if (testOrders.length > 0) {
      console.log(`[清理] 已删除 ${testOrders.length} 条测试工单`);
    }
  } catch (err) {
    console.warn(`[清理] 工单清理失败: ${(err as Error).message}`);
  }
}

/**
 * 清理所有 E2E- 前缀的测试告警规则
 *
 * 查询告警规则列表，筛选名称以 "E2E-" 开头的规则并逐一删除。
 *
 * @param page - Playwright Page 实例
 * @param token - 可选的认证 Token（不传则自动获取管理员 Token）
 */
export async function cleanupTestAlertRules(
  page: Page,
  token?: string,
): Promise<void> {
  const authToken = token || await getToken(page);

  try {
    const resp = await page.request.get(`${BASE_URL}/api/v1/alert-rules?pageSize=100`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!resp.ok()) {
      console.warn(`[清理] 查询告警规则列表失败: ${resp.status()}`);
      return;
    }

    const body = await resp.json();
    const rules: Array<{ id: string; name?: string }> = body.items || body.data || body;

    const testRules = rules.filter(
      (r) => r.name?.startsWith('E2E-'),
    );

    for (const rule of testRules) {
      await page.request.delete(`${BASE_URL}/api/v1/alert-rules/${rule.id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
    }

    if (testRules.length > 0) {
      console.log(`[清理] 已删除 ${testRules.length} 条测试告警规则`);
    }
  } catch (err) {
    console.warn(`[清理] 告警规则清理失败: ${(err as Error).message}`);
  }
}
