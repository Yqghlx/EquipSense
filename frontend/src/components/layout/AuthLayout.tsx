import { Outlet } from 'react-router-dom';

/**
 * 认证布局组件
 *
 * 用于登录等无需侧边栏的页面，居中展示内容。
 */
export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">EquipSense</h1>
          <p className="mt-2 text-sm text-muted-foreground">工业设备智能监控平台</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
