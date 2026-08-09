import api from './api';
import { useAuthStore } from '../stores/authStore';

/**
 * 撤销服务端会话并清理浏览器侧认证状态。
 *
 * HttpOnly Cookie 无法由 JavaScript 直接删除，必须先调用后端登出接口让服务端下发
 * 清除 Cookie 的 Set-Cookie。即使网络暂时不可用，也要清理本地状态，避免页面继续
 * 以为用户已登录；下次访问受保护接口时，401 拦截器会再次处理残留 Cookie。
 */
export async function revokeSessionAndClearLocalState(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // 本地状态清理不能依赖网络，保证用户可以离开当前会话。
  } finally {
    useAuthStore.getState().logout();
  }
}
