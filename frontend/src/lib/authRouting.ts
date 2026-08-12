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

/**
 * 判断业务路由是否应把已认证但必须改密的用户送回登录页。
 *
 * 前端路由门禁负责用户体验，后端强制改密中间件负责真正的安全边界；
 * 两层同时存在，既避免页面闪现业务数据，也防止非浏览器客户端绕过限制。
 */
export function shouldRedirectForPasswordChange(
  isAuthenticated: boolean,
  user: Pick<UserInfo, 'mustChangePassword'> | null,
): boolean {
  return isAuthenticated && user?.mustChangePassword === true;
}
