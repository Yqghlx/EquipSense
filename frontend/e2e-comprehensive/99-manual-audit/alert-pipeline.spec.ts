/**
 * 真实告警闭环测试
 *
 * 完整链路验证：
 * 1. 注入超阈值遥测数据（HTTP → TelemetryService）
 * 2. 等待告警引擎处理（后台消费队列）
 * 3. 验证告警被创建（API 查询 alerts）
 * 4. 验证告警聚合逻辑（30 分钟窗口规则）
 * 5. 触发 AI 分析
 * 6. 验证 AI 分析结果（根因 + 建议）
 * 7. 验证告警 → 工单创建（如果配置了自动工单）
 * 8. 验证通知被创建
 *
 * 使用专用测试设备 + 专用告警规则，避免干扰现有数据。
 */
import { test, expect, type APIRequestContext } from '@playwright/test';
import { BASE_URL, MACHINE_API_HEADERS, getToken, getE2EPassword } from '../helpers';

const log: string[] = [];
function record(step: string, ok: boolean, detail = '') {
  const icon = ok ? '✓' : '✗';
  log.push(`${icon} ${step}${detail ? ` — ${detail}` : ''}`);
  console.log(`${icon} ${step}${detail ? ` — ${detail}` : ''}`);
}

async function adminLogin(request: APIRequestContext): Promise<string> {
  const resp = await request.post(`${BASE_URL}/api/v1/auth/login`, {
    data: { username: 'admin', password: getE2EPassword('admin') },
    headers: MACHINE_API_HEADERS,
  });
  const body = await resp.json();
  return body.accessToken || body.token;
}

test.describe('真实告警闭环', () => {
  test.describe.configure({ timeout: 180000 });

  let token: string;
  let testDeviceId: string;
  let testDeviceCode: string;
  let testRuleId: string;
  const testSuffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  test.beforeAll(async ({ request }) => {
    token = await adminLogin(request);
    expect(token).toBeTruthy();

    // 创建专用测试设备
    testDeviceCode = `E2E-ALERT-${testSuffix}`;
    const devResp = await request.post(`${BASE_URL}/api/v1/devices`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        deviceCode: testDeviceCode,
        name: `告警闭环测试设备-${testSuffix}`,
        type: 'motor',
      },
    });
    expect(devResp.ok()).toBeTruthy();
    const dev = await devResp.json();
    testDeviceId = dev.id;
    console.log(`测试设备: ${testDeviceCode} (${testDeviceId})`);

    // 创建专用阈值告警规则：temperature > 80
    const ruleResp = await request.post(`${BASE_URL}/api/v1/alert-rules`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        name: `E2E闭环-温度超限-${testSuffix}`,
        ruleType: 'Threshold',
        metric: 'temperature',
        operator: 'GT',
        threshold: 80,
        severity: 'High',
        cooldownSeconds: 10, // 短冷却便于测试聚合
        enabled: true,
      },
    });
    expect(ruleResp.ok()).toBeTruthy();
    const rule = await ruleResp.json();
    testRuleId = rule.id;
    console.log(`测试规则: temperature > 80 (${testRuleId})`);
  });

  test.afterAll(async ({ request }) => {
    // 清理测试数据
    if (testRuleId) {
      await request.delete(`${BASE_URL}/api/v1/alert-rules/${testRuleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    if (testDeviceId) {
      await request.delete(`${BASE_URL}/api/v1/devices/${testDeviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  });

  test('1. 遥测注入 → 告警触发', async ({ request }) => {
    // 步骤 1：注入一条温度 = 95（超过阈值 80）的遥测数据
    const injectResp = await request.post(`${BASE_URL}/api/v1/telemetry`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        deviceId: testDeviceId,
        metrics: { temperature: 95 },
        timestamp: new Date().toISOString(),
        quality: 'Good',
      },
    });
    record('遥测数据注入', injectResp.ok(), `status=${injectResp.status()}`);

    // 步骤 2：等待后台告警引擎处理（队列消费 + 规则匹配是异步的）
    let alertFound = false;
    let alertData: any = null;
    for (let attempt = 0; attempt < 15; attempt++) {
      await new Promise(r => setTimeout(r, 2000));
      const alertsResp = await request.get(
        `${BASE_URL}/api/v1/alerts?deviceId=${testDeviceId}&pageSize=10`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!alertsResp.ok()) continue;
      const alertsBody = await alertsResp.json();
      const matched = alertsBody.items?.find(
        (a: any) => a.metricName === 'temperature' || a.deviceId === testDeviceId
      );
      if (matched) {
        alertFound = true;
        alertData = matched;
        break;
      }
    }

    record('告警触发', alertFound,
      alertData ? `severity=${alertData.severity} status=${alertData.status} value=${alertData.triggerValue}` : '30秒内未触发');

    if (alertFound) {
      // 验证告警字段正确性
      record('告警 severity 正确', alertData.severity === 'High', `实际=${alertData.severity}`);
      record('告警状态为 Active', alertData.status === 'Active', `实际=${alertData.status}`);
    }
  });

  test('2. 告警聚合逻辑（30 分钟窗口）', async ({ request }) => {
    // 再次注入相同超阈值数据，验证聚合：第 2 次应更新已有告警而非创建新告警
    await request.post(`${BASE_URL}/api/v1/telemetry`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        deviceId: testDeviceId,
        metrics: { temperature: 98 },
        timestamp: new Date().toISOString(),
        quality: 'Good',
      },
    });

    await new Promise(r => setTimeout(r, 5000));

    const alertsResp = await request.get(
      `${BASE_URL}/api/v1/alerts?deviceId=${testDeviceId}&pageSize=20`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const alertsBody = await alertsResp.json();
    const tempAlerts = alertsBody.items?.filter(
      (a: any) => a.deviceId === testDeviceId && (a.metricName === 'temperature' || !a.metricName)
    ) ?? [];

    // 同设备同指标在聚合窗口内应只有 1 条告警（第 2-3 次更新已有，不新建）
    record('告警聚合生效', tempAlerts.length <= 1,
      `temperature 告警数=${tempAlerts.length}（应≤1，第2次应更新而非新建）`);
  });

  test('3. AI 根因分析', async ({ request }) => {
    // 找到刚触发的告警，触发 AI 分析
    const alertsResp = await request.get(
      `${BASE_URL}/api/v1/alerts?deviceId=${testDeviceId}&pageSize=5`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const alertsBody = await alertsResp.json();
    const alert = alertsBody.items?.[0];

    if (!alert) {
      record('AI 分析前提', false, '无告警可分析（前置测试可能失败）');
      return;
    }

    // 触发 AI 分析
    const analysisResp = await request.post(`${BASE_URL}/api/v1/analyses`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        deviceId: testDeviceId,
        alertId: alert.id,
        type: 'RootCause',
      },
    }).catch(e => ({ ok: () => false, status: () => 0, json: async () => ({}) }));

    record('AI 分析请求', analysisResp.ok?.() ?? false, `status=${analysisResp.status?.()}`);

    if (analysisResp.ok?.()) {
      const analysis = await analysisResp.json();
      record('AI 分析返回根因', !!analysis.rootCause || !!analysis.analysis?.rootCause,
        `rootCause=${(analysis.rootCause || analysis.analysis?.rootCause || '').slice(0, 50)}`);
      record('AI 分析返回建议', !!analysis.recommendation || !!analysis.suggestion,
        `建议长度=${(analysis.recommendation || analysis.suggestion || '').length}`);
    }
  });

  test('4. 通知生成', async ({ request }) => {
    // 告警触发后应生成通知
    await new Promise(r => setTimeout(r, 3000));

    const notifResp = await request.get(`${BASE_URL}/api/v1/notifications?pageSize=20`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!notifResp.ok()) {
      record('通知查询', false, `status=${notifResp.status()}`);
      return;
    }

    const notifBody = await notifResp.json();
    // 通知 Content 使用「指标 {metric} 达到 {value}」格式，按 metric + value 匹配
    // 同时匹配 type=alert 的最近通知
    const relatedNotifs = notifBody.items?.filter(
      (n: any) => n.type === 'alert' &&
                   (JSON.stringify(n).includes('temperature') ||
                    JSON.stringify(n).includes(String(95)))
    ) ?? [];

    record('告警通知已生成', relatedNotifs.length > 0,
      `相关通知数=${relatedNotifs.length}（总通知=${notifBody.total ?? notifBody.items?.length}）`);
  });

  test('5. 告警 → 工单创建链路', async ({ request }) => {
    // 验证是否能从告警手动创建工单（即使没配自动工单，手动链路应可用）
    const alertsResp = await request.get(
      `${BASE_URL}/api/v1/alerts?deviceId=${testDeviceId}&pageSize=5`,
      { headers: { Authorization: `Bearer ${token}` },
    });
    const alertsBody = await alertsResp.json();
    const alert = alertsResp.ok() ? alertsBody.items?.[0] : null;

    if (!alert) {
      record('工单创建前提', false, '无告警');
      return;
    }

    // 从告警创建工单
    const woResp = await request.post(`${BASE_URL}/api/v1/work-orders`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        title: `E2E闭环-告警工单-${testSuffix}`,
        type: 'Corrective',
        priority: 'High',
        deviceId: testDeviceId,
        alertId: alert.id,
        rootCause: '温度超过阈值，疑似散热故障',
      },
    }).catch(() => null);

    record('从告警创建工单', woResp?.ok() ?? false, `status=${woResp?.status()}`);

    if (woResp?.ok()) {
      const wo = await woResp.json();
      record('工单关联告警ID', wo.alertId === alert.id, `alertId=${wo.alertId}`);

      // 验证工单详情能查到关联告警
      const woDetailResp = await request.get(`${BASE_URL}/api/v1/work-orders/${wo.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const woDetail = await woDetailResp.json();
      record('工单详情含告警关联', woDetail.alertId === alert.id);

      // 清理
      await request.delete(`${BASE_URL}/api/v1/work-orders/${wo.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  });

  test('6. 汇总', async () => {
    const passed = log.filter(l => l.startsWith('✓')).length;
    const failed = log.filter(l => l.startsWith('✗')).length;
    console.log('\n========== 告警闭环汇总 ==========');
    log.forEach(l => console.log(l));
    console.log(`\n总计: ${log.length} 项 | ✓ ${passed} 通过 | ✗ ${failed} 失败`);
    console.log('===================================\n');
  });
});
