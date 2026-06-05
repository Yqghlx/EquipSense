import axios from 'axios';

/**
 * 显示全局错误提示（通过 toast 通知）
 * 使用动态导入避免循环依赖，并在 store 未初始化时静默降级
 */
async function showGlobalError(message: string): Promise<void> {
  try {
    const { useNotificationStore } = await import('../stores/notificationStore');
    useNotificationStore.getState().push({
      type: 'system',
      title: '操作失败',
      message,
    });
  } catch {
    // store 未初始化时静默处理
  }
}

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// 是否正在刷新令牌（防止并发刷新）
let isRefreshing = false;
// 等待令牌刷新的请求队列
let pendingRequests: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

/** 处理所有排队中的请求 */
function processPendingRequests(token: string | null, error?: unknown) {
  pendingRequests.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  pendingRequests = [];
}

// 请求拦截器：自动注入 JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：全局错误处理 + 401 时尝试刷新令牌
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // 403 权限不足：显示友好提示
    if (status === 403) {
      const msg = data?.message || '您没有权限执行此操作';
      showGlobalError(msg);
    }
    // 404 资源不存在：显示友好提示
    else if (status === 404) {
      const msg = data?.message || '请求的资源不存在';
      showGlobalError(msg);
    }
    // 500 服务器错误：显示友好提示
    else if (status === 500) {
      showGlobalError('服务器内部错误，请稍后重试');
    }

    const originalRequest = error.config;

    // 非 401 或已重试过，直接拒绝
    if (status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // 登录和刷新请求本身失败，不重试
    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      // 无刷新令牌，直接登出
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // 防止并发刷新：第一个 401 触发刷新，后续请求排队等待
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await axios.post('/api/v1/auth/refresh', { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data;

      // 更新本地存储
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);

      // 更新 authStore
      const { useAuthStore } = await import('../stores/authStore');
      const store = useAuthStore.getState();
      if (store.user) {
        store.setAuth(accessToken, store.user);
      }

      // 通知排队请求使用新令牌
      processPendingRequests(accessToken);

      // 重发原始请求
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      // 刷新失败，清除认证信息并跳转登录
      processPendingRequests(null, refreshError);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
