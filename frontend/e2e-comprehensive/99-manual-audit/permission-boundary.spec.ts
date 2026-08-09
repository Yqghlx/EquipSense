/**
 * 权限边界测试
 *
 * 根据 RBAC 权限矩阵，验证每个角色的 API 访问边界：
 * - 应该允许的操作返回 2xx
 * - 应该禁止的操作返回 403
 *
 * 测试策略：用每个角色的凭据登录获取 token，然后尝试关键 API 操作，
 * 对照权限矩阵验证返回码是否符合预期。
 *
 * 权限矩阵摘要：
 *   SystemAdmin: 全部 CRUD
 *   MaintenanceLead: 设备 RW、告警配置、工单派工验收、知识库验证
 *   Technician: 设备 R、告警确认、工单执行、知识库 R
 *   Operator: 设备 R、告警确认、工单 R
 *   Viewer: 全部只读
 */
import { test, expect, type APIRequestContext } from '@playwright/test';
import { BASE_URL, getE2EPassword } from '../helpers';

const log: string[] = [];
function record(role: string, action: string, expected: 'allow' | 'deny', actual: number, detail = '') {
  const wasAllowed = actual < 400;
  const correct = expected === 'allow' ? wasAllowed : !wasAllowed;
  const icon = correct ? '✓' : '✗';
  const expStr = expected === 'allow' ? '应允许' : '应禁止(403)';
  const actStr = wasAllowed ? `允许(${actual})` : `禁止(${actual})`;
  const entry = `${icon} [${role}] ${action} — 预期:${expStr} 实际:${actStr}${detail ? ` ${detail}` : ''}`;
  log.push(entry);
  console.log(entry);
}

const ROLES = [
  { name: 'admin', username: 'admin', password: getE2EPassword('admin'), displayName: 'SystemAdmin' },
  { name: 'lead', username: 'lead', password: getE2EPassword('lead'), displayName: 'MaintenanceLead' },
  { name: 'tech', username: 'tech', password: getE2EPassword('tech'), displayName: 'Technician' },
  { name: 'operator', username: 'operator', password: getE2EPassword('operator'), displayName: 'Operator' },
  { name: 'viewer', username: 'viewer', password: getE2EPassword('viewer'), displayName: 'Viewer' },
];

async function getToken(request: APIRequestContext, username: string, password: string): Promise<string | null> {
  try {
    const resp = await request.post(`${BASE_URL}/api/v1/auth/login`, {
      data: { username, password },
    });
    if (!resp.ok()) return null;
    const body = await resp.json();
    return body.accessToken || body.token;
  } catch {
    return null;
  }
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

test.describe('权限边界测试', () => {
  test.describe.configure({ timeout: 120000 });

  // 缓存每个角色的 token
  const tokens: Record<string, string | null> = {};

  test.beforeAll(async ({ request }) => {
    for (const role of ROLES) {
      tokens[role.name] = await getToken(request, role.username, role.password);
      console.log(`登录 ${role.name} (${role.displayName}): ${tokens[role.name] ? '成功' : '失败'}`);
    }
  });

  // ==========================================================================
  // 设备管理权限
  // ==========================================================================
  test('设备管理权限边界', async ({ request }) => {
    for (const role of ROLES) {
      const token = tokens[role.name];
      if (!token) { record(role.name, '登录', 'allow', 401, '登录失败'); continue; }

      // 读取设备列表 — 所有角色都应允许
      const readResp = await request.get(`${BASE_URL}/api/v1/devices?pageSize=1`, { headers: authHeaders(token) });
      record(role.name, '设备列表读取(device:read)', 'allow', readResp.status());

      // 创建设备 — 只有 SystemAdmin 应允许
      const createResp = await request.post(`${BASE_URL}/api/v1/devices`, {
        headers: authHeaders(token),
        data: { deviceCode: `PERM-TEST-${Date.now()}-${role.name}`, name: `权限测试-${role.name}`, type: 'motor' },
      });
      const expectedCreate = role.displayName === 'SystemAdmin' ? 'allow' : 'deny';
      record(role.name, '设备创建(device:create)', expectedCreate, createResp.status());

      // 清理（如果创建成功了）
      if (createResp.ok()) {
        const dev = await createResp.json();
        await request.delete(`${BASE_URL}/api/v1/devices/${dev.id}`, { headers: authHeaders(token) }).catch(() => {});
      }
    }
  });

  // ==========================================================================
  // 告警规则配置权限
  // ==========================================================================
  test('告警规则配置权限', async ({ request }) => {
    for (const role of ROLES) {
      const token = tokens[role.name];
      if (!token) continue;

      // 读取告警规则 — 所有角色都应允许
      const readResp = await request.get(`${BASE_URL}/api/v1/alert-rules?pageSize=1`, { headers: authHeaders(token) });
      record(role.name, '告警规则读取(alert:read)', 'allow', readResp.status());

      // 创建告警规则 — 只有 SystemAdmin 和 MaintenanceLead 应允许
      const createResp = await request.post(`${BASE_URL}/api/v1/alert-rules`, {
        headers: authHeaders(token),
        data: {
          name: `PERM-RULE-${Date.now()}-${role.name}`,
          ruleType: 'Threshold', metric: 'temperature', operator: 'GT',
          threshold: 999, severity: 'Low', cooldownSeconds: 60, enabled: true,
        },
      });
      const expectedCreate = ['SystemAdmin', 'MaintenanceLead'].includes(role.displayName) ? 'allow' : 'deny';
      record(role.name, '告警规则创建(alert:config)', expectedCreate, createResp.status());

      // 清理
      if (createResp.ok()) {
        const rule = await createResp.json();
        await request.delete(`${BASE_URL}/api/v1/alert-rules/${rule.id}`, { headers: authHeaders(token) }).catch(() => {});
      }
    }
  });

  // ==========================================================================
  // 工单管理权限
  // ==========================================================================
  test('工单管理权限', async ({ request }) => {
    // 先用 admin 创建一个测试工单和设备
    const adminToken = tokens.admin!;
    const devResp = await request.post(`${BASE_URL}/api/v1/devices`, {
      headers: authHeaders(adminToken),
      data: { deviceCode: `PERM-WO-DEV-${Date.now()}`, name: '工单权限测试设备', type: 'motor' },
    });
    const dev = await devResp.json();
    const woResp = await request.post(`${BASE_URL}/api/v1/work-orders`, {
      headers: authHeaders(adminToken),
      data: { title: '权限测试工单', type: 'Corrective', priority: 'Medium', deviceId: dev.id },
    });
    const wo = await woResp.json();

    for (const role of ROLES) {
      const token = tokens[role.name];
      if (!token) continue;

      // 读取工单 — 所有角色都应允许
      const readResp = await request.get(`${BASE_URL}/api/v1/work-orders?pageSize=1`, { headers: authHeaders(token) });
      record(role.name, '工单列表读取(workorder:read)', 'allow', readResp.status());

      // 创建工单 — SystemAdmin 和 MaintenanceLead 应允许
      const createResp = await request.post(`${BASE_URL}/api/v1/work-orders`, {
        headers: authHeaders(token),
        data: { title: `PERM-WO-${role.name}`, type: 'Corrective', priority: 'Low', deviceId: dev.id },
      });
      const expectedCreate = ['SystemAdmin', 'MaintenanceLead'].includes(role.displayName) ? 'allow' : 'deny';
      record(role.name, '工单创建(workorder:create)', expectedCreate, createResp.status());

      // 清理
      if (createResp.ok()) {
        const newWo = await createResp.json();
        await request.delete(`${BASE_URL}/api/v1/work-orders/${newWo.id}`, { headers: authHeaders(adminToken) }).catch(() => {});
      }
    }

    // 清理
    await request.delete(`${BASE_URL}/api/v1/work-orders/${wo.id}`, { headers: authHeaders(adminToken) }).catch(() => {});
    await request.delete(`${BASE_URL}/api/v1/devices/${dev.id}`, { headers: authHeaders(adminToken) }).catch(() => {});
  });

  // ==========================================================================
  // 知识库权限
  // ==========================================================================
  test('知识库权限', async ({ request }) => {
    for (const role of ROLES) {
      const token = tokens[role.name];
      if (!token) continue;

      // 读取知识规则 — SystemAdmin/MaintenanceLead/Technician/Viewer 应允许
      const readResp = await request.get(`${BASE_URL}/api/v1/knowledge/rules?pageSize=1`, { headers: authHeaders(token) });
      const expectedRead = role.displayName === 'Operator' ? 'deny' : 'allow';
      record(role.name, '知识规则读取(knowledge:read)', expectedRead, readResp.status());
    }
  });

  // ==========================================================================
  // 用户管理权限（敏感）
  // ==========================================================================
  test('用户管理权限', async ({ request }) => {
    for (const role of ROLES) {
      const token = tokens[role.name];
      if (!token) continue;

      // 读取用户列表 — 只有 SystemAdmin 和 MaintenanceLead 应允许
      const readResp = await request.get(`${BASE_URL}/api/v1/admin/users?pageSize=1`, { headers: authHeaders(token) });
      const expectedRead = ['SystemAdmin', 'MaintenanceLead'].includes(role.displayName) ? 'allow' : 'deny';
      record(role.name, '用户列表读取(user:read)', expectedRead, readResp.status());
    }
  });

  // ==========================================================================
  // 审计日志权限（敏感）
  // ==========================================================================
  test('审计日志权限', async ({ request }) => {
    for (const role of ROLES) {
      const token = tokens[role.name];
      if (!token) continue;

      // 读取审计日志 — SystemAdmin 和 MaintenanceLead 应允许
      const readResp = await request.get(`${BASE_URL}/api/v1/audit-logs?pageSize=1`, { headers: authHeaders(token) });
      const expectedRead = ['SystemAdmin', 'MaintenanceLead'].includes(role.displayName) ? 'allow' : 'deny';
      record(role.name, '审计日志读取(audit:read)', expectedRead, readResp.status());
    }
  });

  // ==========================================================================
  // FMEA 权限
  // ==========================================================================
  test('FMEA 权限', async ({ request }) => {
    for (const role of ROLES) {
      const token = tokens[role.name];
      if (!token) continue;

      const readResp = await request.get(`${BASE_URL}/api/v1/fmea?pageSize=1`, { headers: authHeaders(token) });
      // FMEA 用 knowledge:read 权限 — Operator 无此权限
      const expectedRead = role.displayName === 'Operator' ? 'deny' : 'allow';
      record(role.name, 'FMEA 读取(knowledge:read)', expectedRead, readResp.status());
    }
  });

  // ==========================================================================
  // 汇总
  // ==========================================================================
  test('权限测试汇总', async () => {
    const passed = log.filter(l => l.startsWith('✓')).length;
    const failed = log.filter(l => l.startsWith('✗')).length;
    console.log('\n========== 权限边界汇总 ==========');
    log.forEach(l => console.log(l));
    console.log(`\n总计: ${log.length} 项 | ✓ ${passed} 符合预期 | ✗ ${failed} 不符合预期`);
    console.log('===================================\n');
  });
});
