import { describe, expect, it } from 'vitest';
import { shouldRedirectForPasswordChange, shouldRenderLoginPage } from '../authRouting';

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

  it('必须改密的已登录用户访问业务路由时应返回登录页', () => {
    expect(shouldRedirectForPasswordChange(true, { mustChangePassword: true })).toBe(true);
  });

  it('未登录或已完成改密的用户不应触发业务路由改密门禁', () => {
    expect(shouldRedirectForPasswordChange(false, null)).toBe(false);
    expect(shouldRedirectForPasswordChange(true, { mustChangePassword: false })).toBe(false);
  });
});
