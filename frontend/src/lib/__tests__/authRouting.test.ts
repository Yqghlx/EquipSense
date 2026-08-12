import { describe, expect, it } from 'vitest';
import { shouldRenderLoginPage } from '../authRouting';

describe('认证路由判定', () => {
  it('未登录时应渲染登录页', () => {
    expect(shouldRenderLoginPage(false, null)).toBe(true);
  });

  it('已登录但必须修改密码时仍应保留登录页以显示强制改密对话框', () => {
    expect(shouldRenderLoginPage(true, { mustChangePassword: true })).toBe(true);
  });

  it('普通已登录用户访问登录页时应跳转到工作台', () => {
    expect(shouldRenderLoginPage(true, { mustChangePassword: false })).toBe(false);
  });
});
