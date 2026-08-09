import { test, expect } from '@playwright/test';
import { getE2EPassword, getE2ETenant2Password } from '../helpers/credentials';

test('E2E 角色密码可以由环境变量覆盖', () => {
  const previousPassword = process.env.E2E_ADMIN_PASSWORD;
  process.env.E2E_ADMIN_PASSWORD = 'production-e2e-admin-password';

  try {
    expect(getE2EPassword('admin')).toBe('production-e2e-admin-password');
  } finally {
    if (previousPassword === undefined) {
      delete process.env.E2E_ADMIN_PASSWORD;
    } else {
      process.env.E2E_ADMIN_PASSWORD = previousPassword;
    }
  }
});

test('E2E 第二租户密码可以由环境变量覆盖', () => {
  const previousPassword = process.env.E2E_TENANT2_PASSWORD;
  process.env.E2E_TENANT2_PASSWORD = 'production-e2e-tenant2-password';

  try {
    expect(getE2ETenant2Password()).toBe('production-e2e-tenant2-password');
  } finally {
    if (previousPassword === undefined) {
      delete process.env.E2E_TENANT2_PASSWORD;
    } else {
      process.env.E2E_TENANT2_PASSWORD = previousPassword;
    }
  }
});
