import type { UserInfo } from '../types';

/**
 * 判断认证用户访问登录路由时是否仍应保留登录页。
 *
 * 强制改密用户已经拿到有效会话，但必须先在登录页完成改密；如果此时直接
 * 重定向到工作台，LoginPage 会被卸载，强制改密对话框也就无法展示。
 */
export function shouldRenderLoginPage(
  isAuthenticated: boolean,
  user: Pick<UserInfo, 'mustChangePassword'> | null,
): boolean {
  return !isAuthenticated || user?.mustChangePassword === true;
}
