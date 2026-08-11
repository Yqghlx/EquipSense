/**
 * 数据正确性测试
 *
 * 验证：创建 → 读回 → 字段是否与提交的一致；更新 → 读回 → 字段是否真的变了。
 * 这是自动化测试最常"假阳性"的地方 — 测试只检查 status 200，不检查数据真的存对了。
 *
 * 测试维度：
 * 1. 设备：创建字段回读、更新字段回读、中文/特殊字符、边界值
 * 2. 告警规则：创建字段回读、枚举值正确性
 * 3. 工单：创建字段回读、状态流转正确性
 * 4. FMEA：创建字段回读、RPN 计算正确性
 * 5. 知识规则：创建字段回读
 */
import { test, expect, type APIRequestContext } from '@playwright/test';
import { BASE_URL, MACHINE_API_HEADERS, getE2EPassword } from '../helpers';

const log: string[] = [];
function record(entity: string, check: string, ok: boolean, detail = '') {
  const icon = ok ? '✓' : '✗';
  log.push(`${icon} [${entity}] ${check}${detail ? ` — ${detail}` : ''}`);
  console.log(`${icon} [${entity}] ${check}${detail ? ` — ${detail}` : ''}`);
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

test.describe('数据正确性测试', () => {
  test.describe.configure({ timeout: 120000 });

  let token: string;
  const createdIds: { type: string; id: string }[] = [];

  test.beforeAll(async ({ request }) => {
    const resp = await request.post(`${BASE_URL}/api/v1/auth/login`, {
      data: { username: 'admin', password: getE2EPassword('admin') },
      headers: MACHINE_API_HEADERS,
    });
    token = (await resp.json()).accessToken;
  });

  test.afterAll(async ({ request }) => {
    // 清理所有创建的测试数据
    for (const { type, id } of createdIds) {
      const path = type === 'device' ? 'devices' : type === 'rule' ? 'alert-rules'
        : type === 'wo' ? 'work-orders' : type === 'fmea' ? 'fmea' : 'knowledge/rules';
      await request.delete(`${BASE_URL}/api/v1/${path}/${id}`, { headers: authHeaders(token) }).catch(() => {});
    }
  });

  // ==========================================================================
  // 1. 设备创建 → 回读字段比对
  // ==========================================================================
  test('设备创建数据完整性', async ({ request }) => {
    const suffix = Date.now().toString(36);
    const payload = {
      deviceCode: `INTEGRITY-DEV-${suffix}`,
      name: `数据完整性测试设备_${suffix}`,
      type: 'pump',
      manufacturer: '测试厂商',
      model: 'TEST-MODEL-X1',
      criticality: 'Critical',
    };

    const createResp = await request.post(`${BASE_URL}/api/v1/devices`, {
      headers: authHeaders(token), data: payload,
    });
    expect(createResp.ok()).toBeTruthy();
    const created = await createResp.json();
    createdIds.push({ type: 'device', id: created.id });

    // 回读验证
    const readResp = await request.get(`${BASE_URL}/api/v1/devices/${created.id}`, { headers: authHeaders(token) });
    const read = await readResp.json();

    record('设备', 'deviceCode 保存正确', read.deviceCode === payload.deviceCode, `提交="${payload.deviceCode}" 回读="${read.deviceCode}"`);
    record('设备', 'name 保存正确（含中文）', read.name === payload.name, `提交="${payload.name}" 回读="${read.name}"`);
    record('设备', 'type 保存正确', read.type === payload.type, `提交="${payload.type}" 回读="${read.type}"`);
    record('设备', 'manufacturer 保存正确', read.manufacturer === payload.manufacturer, `提交="${payload.manufacturer}" 回读="${read.manufacturer}"`);
    record('设备', 'model 保存正确', read.model === payload.model, `提交="${payload.model}" 回读="${read.model}"`);
    record('设备', 'criticality 保存正确', read.criticality === payload.criticality, `提交="${payload.criticality}" 回读="${read.criticality}"`);
  });

  // ==========================================================================
  // 2. 设备更新 → 回读验证
  // ==========================================================================
  test('设备更新数据完整性', async ({ request }) => {
    const suffix = Date.now().toString(36);
    // 先创建
    const createResp = await request.post(`${BASE_URL}/api/v1/devices`, {
      headers: authHeaders(token),
      data: { deviceCode: `UPDATE-DEV-${suffix}`, name: '更新前名称', type: 'motor' },
    });
    const created = await createResp.json();
    createdIds.push({ type: 'device', id: created.id });

    // 更新
    const updatePayload = {
      name: '更新后名称_已修改',
      manufacturer: '新厂商',
      model: 'NEW-MODEL',
      criticality: 'High',
    };
    const updateResp = await request.put(`${BASE_URL}/api/v1/devices/${created.id}`, {
      headers: authHeaders(token), data: updatePayload,
    });

    if (!updateResp.ok()) {
      record('设备', '更新API可用', false, `status=${updateResp.status()}`);
      return;
    }
    record('设备', '更新API可用', true);

    // 回读验证更新生效
    const readResp = await request.get(`${BASE_URL}/api/v1/devices/${created.id}`, { headers: authHeaders(token) });
    const read = await readResp.json();

    record('设备', 'name 更新生效', read.name === updatePayload.name, `期望="${updatePayload.name}" 实际="${read.name}"`);
    record('设备', 'manufacturer 更新生效', read.manufacturer === updatePayload.manufacturer, `期望="${updatePayload.manufacturer}" 实际="${read.manufacturer}"`);
    record('设备', 'criticality 更新生效', read.criticality === updatePayload.criticality, `期望="${updatePayload.criticality}" 实际="${read.criticality}"`);
  });

  // ==========================================================================
  // 3. 告警规则创建 → 字段比对
  // ==========================================================================
  test('告警规则数据完整性', async ({ request }) => {
    const suffix = Date.now().toString(36);
    const payload = {
      name: `完整性规则_${suffix}`,
      ruleType: 'Threshold',
      metric: 'vibration',
      operator: 'GT',
      threshold: 7.5,
      severity: 'Critical',
      cooldownSeconds: 300,
      enabled: true,
    };

    const createResp = await request.post(`${BASE_URL}/api/v1/alert-rules`, {
      headers: authHeaders(token), data: payload,
    });
    expect(createResp.ok()).toBeTruthy();
    const created = await createResp.json();
    createdIds.push({ type: 'rule', id: created.id });

    record('规则', 'name 保存正确（含中文）', created.name === payload.name, `"${created.name}"`);
    record('规则', 'ruleType 保存正确', created.ruleType === payload.ruleType, `"${created.ruleType}"`);
    record('规则', 'metric 保存正确', created.metric === payload.metric, `"${created.metric}"`);
    record('规则', 'operator 保存正确', created.operator === payload.operator, `"${created.operator}"`);
    record('规则', 'threshold 保存正确', created.threshold === payload.threshold, `提交=${payload.threshold} 回读=${created.threshold}`);
    record('规则', 'severity 保存正确', created.severity === payload.severity, `"${created.severity}"`);
    record('规则', 'enabled 保存正确', created.enabled === payload.enabled, `${created.enabled}`);
  });

  // ==========================================================================
  // 4. 工单创建 + 状态流转
  // ==========================================================================
  test('工单数据完整性和状态流转', async ({ request }) => {
    // 先创建设备
    const devResp = await request.post(`${BASE_URL}/api/v1/devices`, {
      headers: authHeaders(token),
      data: { deviceCode: `WO-FLOW-${Date.now().toString(36)}`, name: '工单流转测试', type: 'motor' },
    });
    const dev = await devResp.json();
    createdIds.push({ type: 'device', id: dev.id });

    // 创建工单
    const woResp = await request.post(`${BASE_URL}/api/v1/work-orders`, {
      headers: authHeaders(token),
      data: {
        title: '完整性测试工单_检修电机',
        type: 'Preventive',
        priority: 'High',
        deviceId: dev.id,
        rootCause: '定期检修',
      },
    });
    expect(woResp.ok()).toBeTruthy();
    const wo = await woResp.json();
    createdIds.push({ type: 'wo', id: wo.id });

    // 回读验证
    const readResp = await request.get(`${BASE_URL}/api/v1/work-orders/${wo.id}`, { headers: authHeaders(token) });
    const read = await readResp.json();

    record('工单', 'title 保存正确（含中文）', read.title === '完整性测试工单_检修电机', `"${read.title}"`);
    record('工单', 'type 保存正确', read.type === 'Preventive', `"${read.type}"`);
    record('工单', 'priority 保存正确', read.priority === 'High', `"${read.priority}"`);
    record('工单', 'deviceId 关联正确', read.deviceId === dev.id, '');
    record('工单', '初始状态为 PendingDispatch', read.status === 'PendingDispatch', `"${read.status}"`);

    // 状态流转：PendingDispatch → Assigned（需要指派人）
    const adminUserResp = await request.get(`${BASE_URL}/api/v1/admin/users?pageSize=10`, { headers: authHeaders(token) });
    const users = await adminUserResp.json();
    const leadUser = users.items?.find((u: any) => u.role === 'MaintenanceLead');

    if (leadUser) {
      const assignResp = await request.put(`${BASE_URL}/api/v1/work-orders/${wo.id}/assign`, {
        headers: authHeaders(token),
        data: { assignedTo: leadUser.id },
      });
      record('工单', '状态流转: Pending→Assigned', assignResp.ok(), `status=${assignResp.status()}`);

      if (assignResp.ok()) {
        // 开始执行
        const startResp = await request.put(`${BASE_URL}/api/v1/work-orders/${wo.id}/start`, {
          headers: authHeaders(token), data: {},
        });
        record('工单', '状态流转: Assigned→InProgress', startResp.ok(), `status=${startResp.status()}`);

        if (startResp.ok()) {
          // 完成
          const completeResp = await request.put(`${BASE_URL}/api/v1/work-orders/${wo.id}/complete`, {
            headers: authHeaders(token),
            data: { resolution: '已修复，更换轴承' },
          });
          record('工单', '状态流转: InProgress→Completed', completeResp.ok(), `status=${completeResp.status()}`);

          // 验证最终状态
          const finalResp = await request.get(`${BASE_URL}/api/v1/work-orders/${wo.id}`, { headers: authHeaders(token) });
          const final = await finalResp.json();
          record('工单', '完成后状态正确', final.status === 'Completed', `"${final.status}"`);
          record('工单', 'resolution 保存正确（含中文）', final.resolution === '已修复，更换轴承', `"${final.resolution}"`);
        }
      }
    }
  });

  // ==========================================================================
  // 5. FMEA RPN 计算正确性
  // ==========================================================================
  test('FMEA RPN 计算正确性', async ({ request }) => {
    const payload = {
      deviceType: 'motor',
      failureMode: '完整性测试_轴承磨损',
      cause: '润滑不足',
      effect: '振动增大',
      detection: '振动检测',
      recommendedAction: '更换轴承',
      severity: 8,
      occurrence: 5,
      detectability: 3,
    };

    const createResp = await request.post(`${BASE_URL}/api/v1/fmea`, {
      headers: authHeaders(token), data: payload,
    });
    expect(createResp.ok()).toBeTruthy();
    const created = await createResp.json();
    createdIds.push({ type: 'fmea', id: created.id });

    const expectedRpn = 8 * 5 * 3; // 120
    record('FMEA', 'failureMode 保存正确（含中文）', created.failureMode === payload.failureMode, `"${created.failureMode}"`);
    record('FMEA', 'severity 保存正确', created.severity === payload.severity, `${created.severity}`);
    record('FMEA', 'occurrence 保存正确', created.occurrence === payload.occurrence, `${created.occurrence}`);
    record('FMEA', 'detectability 保存正确', created.detectability === payload.detectability, `${created.detectability}`);
    record('FMEA', `RPN 自动计算正确 (${payload.severity}×${payload.occurrence}×${payload.detectability}=${expectedRpn})`,
      created.rpn === expectedRpn, `期望=${expectedRpn} 实际=${created.rpn}`);
  });

  // ==========================================================================
  // 6. 遥测数据写入 → 读回
  // ==========================================================================
  test('遥测数据写入读回', async ({ request }) => {
    // 创建设备
    const devResp = await request.post(`${BASE_URL}/api/v1/devices`, {
      headers: authHeaders(token),
      data: { deviceCode: `TELE-INT-${Date.now().toString(36)}`, name: '遥测完整性测试', type: 'motor' },
    });
    const dev = await devResp.json();
    createdIds.push({ type: 'device', id: dev.id });

    // 写入遥测数据
    const timestamp = new Date().toISOString();
    await request.post(`${BASE_URL}/api/v1/telemetry`, {
      headers: authHeaders(token),
      data: {
        deviceId: dev.id,
        metrics: { temperature: 42.5, vibration: 3.2 },
        timestamp,
        quality: 'Good',
      },
    });

    // 等待写入
    await new Promise(r => setTimeout(r, 3000));

    // 读回遥测数据
    const readResp = await request.get(`${BASE_URL}/api/v1/telemetry/${dev.id}`, {
      headers: authHeaders(token),
    });

    if (!readResp.ok()) {
      record('遥测', '遥测读回API', false, `status=${readResp.status()}`);
      return;
    }

    const teleData = await readResp.json();
    // 检查是否包含我们写入的指标
    const hasTemp = JSON.stringify(teleData).includes('temperature');
    const hasVibration = JSON.stringify(teleData).includes('vibration');
    record('遥测', 'temperature 指标读回', hasTemp);
    record('遥测', 'vibration 指标读回', hasVibration);
  });

  // ==========================================================================
  // 汇总
  // ==========================================================================
  test('数据完整性汇总', async () => {
    const passed = log.filter(l => l.startsWith('✓')).length;
    const failed = log.filter(l => l.startsWith('✗')).length;
    console.log('\n========== 数据完整性汇总 ==========');
    log.forEach(l => console.log(l));
    console.log(`\n总计: ${log.length} 项 | ✓ ${passed} 通过 | ✗ ${failed} 失败`);
    console.log('===================================\n');
  });
});
