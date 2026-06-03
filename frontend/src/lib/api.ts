import axios from 'axios';

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

// 响应拦截器：401 时尝试刷新令牌，失败则跳转登录
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 非 401 或已重试过，直接拒绝
    if (error.response?.status !== 401 || originalRequest._retry) {
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
