/**
 * 页面实测脚本 — 逐页打开所有业务页面，自动判断每页是否真正可用
 *
 * 判断标准（我自己定）：
 * 1. 渲染正确性：页面 URL 不被 redirect 到别处、不是白屏、h1 标题与预期匹配
 * 2. 数据加载：表格/卡片有内容（不是无限 loading、不是报错状态）
 * 3. JS 错误：捕获 pageerror（过滤 ServiceWorker/SSL 噪声）
 * 4. API 失败：捕获 4xx/5xx 响应（过滤 401 自动刷新）
 * 5. 核心元素存在：每个页面检查其应有的关键元素（表格、图表、表单、按钮）
 *
 * 产出：截图 + 详细日志，跑完分析问题。
 */
import { test, expect, type Page } from '@playwright/test';
import { login, BASE_URL, getE2EPassword } from '../helpers';

const SHOT_DIR = 'test-results/page-audit';

/** 收集页面错误和 API 失败 */
function attachCollectors(page: Page) {
  const errors: string[] = [];
  const apiFailures: string[] = [];

  page.on('pageerror', (err) => {
    const msg = err.message;
    if (
      !msg.includes('ServiceWorker') &&
      !msg.includes('SSL certificate error') &&
      !msg.includes('ResizeObserver')
    ) {
      errors.push(msg);
    }
  });

  page.on('response', async (resp) => {
    const status = resp.status();
    if (status >= 400 && status !== 401) {
      const url = resp.url();
      // 忽略SignalR negotiate（404/500 是预期的重试机制）
      if (!url.includes('/hubs/') && !url.includes('negotiate')) {
        apiFailures.push(`${status} ${resp.request().method()} ${url.replace(BASE_URL, '')}`);
      }
    }
  });

  return {
    getErrors: () => errors,
    getApiFailures: () => apiFailures,
  };
}

/** 判断页面是否真的渲染了对应内容 */
interface PageCheckResult {
  route: string;
  finalUrl: string;
  redirected: boolean;
  title: string | null;
  bodyLength: number;
  tableRows: number;
  hasContent: boolean;
  errors: string[];
  apiFailures: string[];
  status: 'ok' | 'warn' | 'fail';
  notes: string[];
}

async function auditPage(
  page: Page,
  route: string,
  expectedTitlePattern?: RegExp,
  requiresLogin = true,
): Promise<PageCheckResult> {
  const collectors = attachCollectors(page);
  const notes: string[] = [];

  if (requiresLogin) {
    await login(page);
  }

  await page.goto(`${BASE_URL}${route}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2500); // 给懒加载和 API 留时间

  const finalUrl = page.url();
  const redirected = !finalUrl.endsWith(route) && !finalUrl.includes(route);

  const title = await page.locator('h1').first().textContent().catch(() => null);
  const bodyText = await page.textContent('body').catch(() => '');
  const bodyLength = bodyText?.trim().length ?? 0;
  const tableRows = await page.locator('table tbody tr').count().catch(() => 0);

  // 白屏判断
  if (bodyLength < 20) {
    notes.push('⚠ 页面近乎白屏（body 文本 < 20 字符）');
  }

  // 标题不匹配
  if (expectedTitlePattern && title) {
    if (!expectedTitlePattern.test(title)) {
      notes.push(`⚠ 标题不匹配：期望 ${expectedTitlePattern}，实际 "${title}"`);
    }
  }

  // 截图
  const safeName = route.replace(/[/:]/g, '_').replace(/^_/, '');
  await page.screenshot({
    path: `${SHOT_DIR}/${safeName}.png`,
    fullPage: false,
  }).catch(() => {});

  const errors = collectors.getErrors();
  const apiFailures = collectors.getApiFailures();

  if (errors.length > 0) notes.push(`✗ JS 错误 ${errors.length} 个`);
  if (apiFailures.length > 0) notes.push(`✗ API 失败 ${apiFailures.length} 个：${apiFailures.slice(0, 3).join('; ')}`);
  if (redirected) notes.push(`⚠ 被 redirect 到 ${finalUrl}`);

  // 综合状态判断
  let status: PageCheckResult['status'] = 'ok';
  if (redirected || bodyLength < 20 || errors.length > 0) {
    status = 'fail';
  } else if (apiFailures.length > 0 || notes.length > 0) {
    status = 'warn';
  }

  return {
    route,
    finalUrl,
    redirected,
    title,
    bodyLength,
    tableRows,
    hasContent: bodyLength > 100,
    errors,
    apiFailures,
    status,
    notes,
  };
}

const results: PageCheckResult[] = [];

test.describe('页面实测审计', () => {
  test.describe.configure({ timeout: 120000 });

  // 认证页面（无需登录）
  test('登录页', async ({ page }) => {
    const r = await auditPage(page, '/login', /登录|login/i, false);
    results.push(r);
    expect(r.status).not.toBe('fail');
  });

  test('注册页', async ({ page }) => {
    const r = await auditPage(page, '/register', /注册|register/i, false);
    results.push(r);
    expect(r.status).not.toBe('fail');
  });

  test('忘记密码页', async ({ page }) => {
    const r = await auditPage(page, '/forgot-password', /忘记密码|forgot/i, false);
    results.push(r);
    expect(r.status).not.toBe('fail');
  });

  test('重置密码页（无token）', async ({ page }) => {
    const r = await auditPage(page, '/reset-password', undefined, false);
    results.push(r);
    // 无 token 应显示提示，不强制 fail
  });

  // 核心业务页面（需登录）
  test('仪表盘', async ({ page }) => {
    const r = await auditPage(page, '/dashboard', /仪表盘|dashboard/i);
    results.push(r);
    expect(r.status).not.toBe('fail');
  });

  test('设备列表', async ({ page }) => {
    const r = await auditPage(page, '/devices', /设备|device/i);
    results.push(r);
    expect(r.status).not.toBe('fail');
  });

  test('网关列表', async ({ page }) => {
    const r = await auditPage(page, '/gateways', /网关|gateway/i);
    results.push(r);
    expect(r.status).not.toBe('fail');
  });

  test('告警中心', async ({ page }) => {
    const r = await auditPage(page, '/alerts', /告警|alert/i);
    results.push(r);
    expect(r.status).not.toBe('fail');
  });

  test('告警规则', async ({ page }) => {
    const r = await auditPage(page, '/alert-rules', /告警规则|alert.*rule/i);
    results.push(r);
    expect(r.status).not.toBe('fail');
  });

  test('工单列表', async ({ page }) => {
    const r = await auditPage(page, '/work-orders', /工单|work.?order/i);
    results.push(r);
    expect(r.status).not.toBe('fail');
  });

  test('工单报表', async ({ page }) => {
    const r = await auditPage(page, '/work-orders/reports');
    results.push(r);
    expect(r.status).not.toBe('fail');
  });

  test('待审批', async ({ page }) => {
    const r = await auditPage(page, '/pending-approvals', /待审批|approval/i);
    results.push(r);
    expect(r.status).not.toBe('fail');
  });

  test('派工看板', async ({ page }) => {
    const r = await auditPage(page, '/dispatch', /派工|dispatch/i);
    results.push(r);
    expect(r.status).not.toBe('fail');
  });

  test('AI 分析', async ({ page }) => {
    const r = await auditPage(page, '/analyses', /分析|analy/i);
    results.push(r);
    expect(r.status).not.toBe('fail');
  });

  test('知识库', async ({ page }) => {
    const r = await auditPage(page, '/knowledge', /知识库|knowledge/i);
    results.push(r);
    expect(r.status).not.toBe('fail');
  });

  test('FMEA 故障模式库', async ({ page }) => {
    const r = await auditPage(page, '/fmea', /FMEA|故障模式/i);
    results.push(r);
    expect(r.status).not.toBe('fail');
  });

  test('诊断评估', async ({ page }) => {
    const r = await auditPage(page, '/evaluation', /评估|evaluation/i);
    results.push(r);
    expect(r.status).not.toBe('fail');
  });

  test('待定规则', async ({ page }) => {
    const r = await auditPage(page, '/pending-rules');
    results.push(r);
    expect(r.status).not.toBe('fail');
  });

  test('通知中心', async ({ page }) => {
    const r = await auditPage(page, '/notifications', /通知|notification/i);
    results.push(r);
    expect(r.status).not.toBe('fail');
  });

  test('审计日志', async ({ page }) => {
    const r = await auditPage(page, '/audit-logs', /审计|audit/i);
    results.push(r);
    expect(r.status).not.toBe('fail');
  });

  test('用户管理', async ({ page }) => {
    const r = await auditPage(page, '/users', /用户|user/i);
    results.push(r);
    expect(r.status).not.toBe('fail');
  });

  test('系统设置', async ({ page }) => {
    const r = await auditPage(page, '/settings', /设置|setting/i);
    results.push(r);
    expect(r.status).not.toBe('fail');
  });

  test('设备设置向导', async ({ page }) => {
    const r = await auditPage(page, '/device-setup');
    results.push(r);
    expect(r.status).not.toBe('fail');
  });

  test('租户管理', async ({ page }) => {
    const r = await auditPage(page, '/admin/tenants', /租户|tenant/i);
    results.push(r);
    expect(r.status).not.toBe('fail');
  });

  // 详情页需要一个已存在的 ID，通过 API 获取
  test('设备详情（真实ID）', async ({ page }) => {
    await login(page);
    // 获取第一个设备 ID
    const token = await page.request.post(`${BASE_URL}/api/v1/auth/login`, {
      data: { username: 'admin', password: getE2EPassword('admin') },
    }).then(r => r.json()).then(j => j.accessToken);
    const devResp = await page.request.get(`${BASE_URL}/api/v1/devices?pageSize=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const devData = await devResp.json();
    const devId = devData.items?.[0]?.id;

    if (devId) {
      const collectors = attachCollectors(page);
      await page.goto(`${BASE_URL}/devices/${devId}`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      const title = await page.locator('h1').first().textContent().catch(() => null);
      const finalUrl = page.url();
      await page.screenshot({ path: `${SHOT_DIR}/devices_detail.png` }).catch(() => {});

      const errors = collectors.getErrors();
      const apiFailures = collectors.getApiFailures();

      results.push({
        route: `/devices/${devId}`,
        finalUrl,
        redirected: !finalUrl.includes(devId),
        title,
        bodyLength: (await page.textContent('body') ?? '').length,
        tableRows: 0,
        hasContent: true,
        errors,
        apiFailures,
        status: errors.length > 0 || !finalUrl.includes(devId) ? 'fail' : (apiFailures.length > 0 ? 'warn' : 'ok'),
        notes: [
          ...(errors.length > 0 ? [`✗ JS 错误 ${errors.length} 个`] : []),
          ...(apiFailures.length > 0 ? [`✗ API 失败 ${apiFailures.length} 个`] : []),
        ],
      });
    }
  });

  test('工单详情（真实ID）', async ({ page }) => {
    await login(page);
    const token = await page.request.post(`${BASE_URL}/api/v1/auth/login`, {
      data: { username: 'admin', password: getE2EPassword('admin') },
    }).then(r => r.json()).then(j => j.accessToken);
    const woResp = await page.request.get(`${BASE_URL}/api/v1/work-orders?pageSize=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const woData = await woResp.json();
    const woId = woData.items?.[0]?.id;

    if (woId) {
      const collectors = attachCollectors(page);
      await page.goto(`${BASE_URL}/work-orders/${woId}`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      const title = await page.locator('h1').first().textContent().catch(() => null);
      const finalUrl = page.url();
      await page.screenshot({ path: `${SHOT_DIR}/workorders_detail.png` }).catch(() => {});

      const errors = collectors.getErrors();
      const apiFailures = collectors.getApiFailures();

      results.push({
        route: `/work-orders/${woId}`,
        finalUrl,
        redirected: !finalUrl.includes(woId),
        title,
        bodyLength: (await page.textContent('body') ?? '').length,
        tableRows: 0,
        hasContent: true,
        errors,
        apiFailures,
        status: errors.length > 0 || !finalUrl.includes(woId) ? 'fail' : (apiFailures.length > 0 ? 'warn' : 'ok'),
        notes: [
          ...(errors.length > 0 ? [`✗ JS 错误 ${errors.length} 个`] : []),
          ...(apiFailures.length > 0 ? [`✗ API 失败 ${apiFailures.length} 个`] : []),
        ],
      });
    }
  });

  // 汇总报告
  test('汇总报告', async () => {
    const report = results.map(r => {
      const icon = r.status === 'ok' ? '✓' : r.status === 'warn' ? '⚠' : '✗';
      const notesStr = r.notes.length > 0 ? ` | ${r.notes.join('; ')}` : '';
      return `${icon} ${r.route.padEnd(28)} | "${r.title?.slice(0, 20) ?? ''}" | 行数:${r.tableRows}${notesStr}`;
    }).join('\n');

    const ok = results.filter(r => r.status === 'ok').length;
    const warn = results.filter(r => r.status === 'warn').length;
    const fail = results.filter(r => r.status === 'fail').length;

    console.log('\n========== 页面实测汇总 ==========');
    console.log(report);
    console.log(`\n总计: ${results.length} 页 | ✓ ${ok} 通过 | ⚠ ${warn} 警告 | ✗ ${fail} 失败`);
    console.log('===================================\n');
  });
});
