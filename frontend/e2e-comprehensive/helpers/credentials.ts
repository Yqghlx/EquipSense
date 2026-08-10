/**
 * E2E 角色凭据。
 *
 * 默认值仅服务于开发/集成测试；生产镜像验收必须通过 E2E_*_PASSWORD
 * 环境变量注入与后端种子账户一致的独立强密码。
 */
export type E2ERole = 'admin' | 'lead' | 'tech' | 'operator' | 'viewer';

const PASSWORD_ENVIRONMENT_VARIABLES: Record<E2ERole, string> = {
  admin: 'E2E_ADMIN_PASSWORD',
  lead: 'E2E_LEAD_PASSWORD',
  tech: 'E2E_TECH_PASSWORD',
  operator: 'E2E_OPERATOR_PASSWORD',
  viewer: 'E2E_VIEWER_PASSWORD',
};

/** Production 隔离验收中由 smoke 脚本初始化的高权限 TOTP 密钥环境变量。 */
const TOTP_ENVIRONMENT_VARIABLES: Partial<Record<E2ERole, string>> = {
  admin: 'E2E_ADMIN_TOTP_SECRET',
  lead: 'E2E_LEAD_TOTP_SECRET',
};

/** 第二租户隔离验收账户的 TOTP 密钥环境变量。 */
const TENANT2_TOTP_ENVIRONMENT_VARIABLE = 'E2E_TENANT2_TOTP_SECRET';

const DEVELOPMENT_PASSWORDS: Record<E2ERole, string> = {
  admin: 'Admin@123',
  lead: 'Lead@123',
  tech: 'Tech@123',
  operator: 'Operator@123',
  viewer: 'Viewer@123',
};

/** 第二租户隔离测试账户的凭据环境变量名。 */
const TENANT2_PASSWORD_ENVIRONMENT_VARIABLE = 'E2E_TENANT2_PASSWORD';

/** 第二租户隔离测试仅在开发/集成环境使用的公开回退值。 */
const DEVELOPMENT_TENANT2_PASSWORD = 'Tenant2@123';

/**
 * 获取 E2E 角色密码。
 *
 * 读取环境变量而不是在测试文件中复制凭据，确保生产镜像测试能够使用
 * 真实的临时种子密码，同时保留开发环境的兼容回退。
 */
export function getE2EPassword(role: E2ERole): string {
  const configuredPassword = process.env[PASSWORD_ENVIRONMENT_VARIABLES[role]];
  return configuredPassword || DEVELOPMENT_PASSWORDS[role];
}

/**
 * 获取 Production 隔离验收所需的高权限 TOTP 密钥。
 * 开发环境不回退公开密钥，避免把 MFA 测试凭据伪装成生产凭据。
 */
export function getE2ETotpSecret(role: E2ERole): string | undefined {
  const environmentVariable = TOTP_ENVIRONMENT_VARIABLES[role];
  return environmentVariable ? process.env[environmentVariable] : undefined;
}

/**
 * 获取第二租户隔离验收账户的 TOTP 密钥。
 *
 * 该账户仅在隔离 Production E2E 中创建；开发环境没有公开回退值，
 * 避免把 MFA 验收凭据伪装成普通测试配置。
 */
export function getE2ETenant2TotpSecret(): string | undefined {
  return process.env[TENANT2_TOTP_ENVIRONMENT_VARIABLE];
}

/**
 * 获取第二租户隔离测试账户密码。
 *
 * 生产镜像验收必须通过 E2E_TENANT2_PASSWORD 注入与
 * SEED_TENANT2_PASSWORD 一致的临时密码；公开回退值只允许用于开发/集成测试。
 */
export function getE2ETenant2Password(): string {
  return process.env[TENANT2_PASSWORD_ENVIRONMENT_VARIABLE] || DEVELOPMENT_TENANT2_PASSWORD;
}
