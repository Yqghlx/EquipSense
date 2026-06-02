import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

/**
 * 路由认证守卫
 *
 * 包裹需要认证的业务路由，未登录用户自动重定向到 /login，
 * 登录后跳回原始请求路径。
 * 额外保护 /admin 路由，仅 SystemAdmin 角色可访问。
 */
export function AuthGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // admin 路由仅允许 SystemAdmin 角色
  if (location.pathname.startsWith('/admin') && user?.role !== 'SystemAdmin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
