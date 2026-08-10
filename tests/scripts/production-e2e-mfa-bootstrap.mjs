#!/usr/bin/env node
/**
 * 为隔离 Production E2E 初始化高权限账户的 TOTP。
 *
 * 该脚本只服务于临时验收数据库：通过真实登录、注册接口完成 MFA 初始化，
 * 不修改生产配置，也不提供绕过 MFA 的后门。脚本只向标准输出写入 JSON，
 * 由 smoke 脚本把临时密钥传给 Playwright 进程。
 */

import { createHmac } from 'node:crypto';

const baseUrl = requiredEnvironment('MFA_BOOTSTRAP_BASE_URL');

/**
 * 读取必填环境变量，错误信息不得包含密码或临时密钥。
 */
function requiredEnvironment(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`缺少 ${name}`);
  }
  return value;
}

/**
 * 调用认证接口并解析 JSON 响应。
 */
async function requestJson(path, data) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = {};
  }

  if (!response.ok) {
    const message = typeof body.message === 'string' ? body.message : `HTTP ${response.status}`;
    throw new Error(`${path} 调用失败：${message}`);
  }

  return body;
}

/**
 * 解码 RFC 4648 Base32 密钥。
 */
function decodeBase32(secret) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const normalized = secret.toUpperCase().replace(/=|\s/g, '');
  const bytes = [];
  let buffer = 0;
  let bitCount = 0;

  for (const character of normalized) {
    const value = alphabet.indexOf(character);
    if (value < 0) {
      throw new Error('MFA 注册接口返回了无效的 TOTP 密钥');
    }

    buffer = (buffer << 5) | value;
    bitCount += 5;
    if (bitCount >= 8) {
      bitCount -= 8;
      bytes.push((buffer >> bitCount) & 0xff);
      buffer &= bitCount === 0 ? 0 : (1 << bitCount) - 1;
    }
  }

  return Buffer.from(bytes);
}

/**
 * 生成当前 6 位 TOTP 验证码；服务端允许相邻时间窗口，能够覆盖边界时刻的竞态。
 */
function generateTotpCode(secret, timestamp = Date.now()) {
  const counter = BigInt(Math.floor(timestamp / 1000 / 30));
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(counter);
  const digest = createHmac('sha1', decodeBase32(secret)).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binaryCode = ((digest[offset] & 0x7f) << 24)
    | (digest[offset + 1] << 16)
    | (digest[offset + 2] << 8)
    | digest[offset + 3];
  return String(binaryCode % 1_000_000).padStart(6, '0');
}

/**
 * 使用真实的强制 MFA 注册流程初始化一个高权限账户。
 */
async function enroll(username, password) {
  const loginResponse = await requestJson('/api/v1/auth/login', { username, password });
  const enrollmentToken = loginResponse.mfaEnrollmentToken;
  if (!loginResponse.mfaEnrollmentRequired || typeof enrollmentToken !== 'string') {
    throw new Error(`${username} 未返回强制 MFA 注册响应`);
  }

  const setupResponse = await requestJson('/api/v1/auth/mfa/enroll/setup', {
    enrollmentToken,
  });
  if (typeof setupResponse.secret !== 'string' || setupResponse.secret.length === 0) {
    throw new Error(`${username} 的 MFA 注册响应缺少密钥`);
  }

  const confirmResponse = await requestJson('/api/v1/auth/mfa/enroll/confirm', {
    enrollmentToken,
    totpCode: generateTotpCode(setupResponse.secret),
  });
  if (typeof confirmResponse.accessToken !== 'string' || confirmResponse.accessToken.length === 0) {
    throw new Error(`${username} 的 MFA 注册确认未签发访问令牌`);
  }

  return setupResponse.secret;
}

const adminTotpSecret = await enroll(
  'admin',
  requiredEnvironment('MFA_BOOTSTRAP_ADMIN_PASSWORD'),
);
const leadTotpSecret = await enroll(
  'lead',
  requiredEnvironment('MFA_BOOTSTRAP_LEAD_PASSWORD'),
);
const tenant2TotpSecret = await enroll(
  'tenant2admin',
  requiredEnvironment('MFA_BOOTSTRAP_TENANT2_PASSWORD'),
);

process.stdout.write(JSON.stringify({ adminTotpSecret, leadTotpSecret, tenant2TotpSecret }));
