/**
 * 种子数据辅助函数
 *
 * 提供 E2E 测试中读取和保存种子数据的工具。
 * 种子数据存储在 test-results/seed-data.json 中，
 * 包含测试所需的租户 ID、用户 ID、设备 ID 等预置信息。
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM 兼容：模拟 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** 测试用种子数据租户 ID（与数据库种子数据一致） */
export const TEST_TENANT_ID = '11111111-1111-1111-1111-111111111111';

/** 种子数据文件路径 */
const SEED_DATA_PATH = path.resolve(__dirname, '../../test-results/seed-data.json');

/** 种子数据结构 */
export interface SeedData {
  /** 租户 ID */
  tenantId: string;
  /** 管理员用户 ID */
  adminUserId?: string;
  /** 维保主管用户 ID */
  leadUserId?: string;
  /** 技术员用户 ID */
  techUserId?: string;
  /** 操作员用户 ID */
  operatorUserId?: string;
  /** 观察者用户 ID */
  viewerUserId?: string;
  /** 预置设备 ID 列表 */
  deviceIds?: string[];
  /** 预置告警规则 ID 列表 */
  alertRuleIds?: string[];
  /** 其他扩展字段 */
  [key: string]: unknown;
}

/**
 * 读取种子数据
 *
 * 从 test-results/seed-data.json 读取测试预置数据。
 * 如果文件不存在，返回包含默认租户 ID 的基础结构。
 *
 * @returns 种子数据对象
 */
export function getSeedData(): SeedData {
  try {
    if (fs.existsSync(SEED_DATA_PATH)) {
      const raw = fs.readFileSync(SEED_DATA_PATH, 'utf-8');
      return JSON.parse(raw) as SeedData;
    }
  } catch (err) {
    console.warn(`[种子数据] 读取失败: ${(err as Error).message}，使用默认值`);
  }

  // 文件不存在或读取失败时返回默认值
  return {
    tenantId: TEST_TENANT_ID,
  };
}

/**
 * 写入种子数据
 *
 * 将种子数据保存到 test-results/seed-data.json。
 * 自动创建不存在的目录结构。
 *
 * @param data - 要保存的种子数据
 */
export function saveSeedData(data: SeedData): void {
  const dir = path.dirname(SEED_DATA_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(SEED_DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
