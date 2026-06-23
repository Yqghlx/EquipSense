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
  // 开发环境前后端不同源（前端 :5173 / 后端 :8080），需显式启用 withCredentials 以携带认证 Cookie
  // 生产环境通过 Nginx 同源代理，浏览器自动携带，此配置无害
  withCredentials: true,
});

// 是否正在刷新令牌（防止并发刷新）
let isRefreshing = false;
// 等待令牌刷新完成的请求队列（刷新期间到达的 401 请求排队等待）
let pendingRequests: Array<{
  resolve: (value?: unknown) => void;
  reject: (error: unknown) => void;
}> = [];

/** 通知所有排队请求：刷新完成，可以重试 */
function processPendingRequests(error?: unknown) {
  pendingRequests.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  pendingRequests = [];
}

// 请求拦截器：认证 Cookie 由浏览器自动携带（withCredentials: true），无需手动设置 Authorization 头

// 响应拦截器：全局错误处理 + 401 时尝试刷新令牌
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // 关键修复：网络层错误（无 response）— 浏览器无法到达服务器
    // 工业现场 WiFi 不稳定是常态，axios 抛 ERR_NETWORK/ECONNABORTED/ECONNREFUSED 时
    // error.response 为 undefined，原代码所有 status 分支都不命中，操作静默失败。
    if (!error.response) {
      const code = error.code;
      let msg = '网络连接失败，请检查网络后重试';
      if (code === 'ECONNABORTED') {
        msg = '请求超时，服务器响应过慢或网络不稳定，请稍后重试';
      } else if (code === 'ERR_NETWORK') {
        msg = '无法连接到服务器，请检查网络连接（可能被防火墙拦截或服务器未启动）';
      }
      showGlobalError(msg);
    }
    // 403 权限不足：显示友好提示
    else if (status === 403) {
      const msg = data?.message || '您没有权限执行此操作';
      showGlobalError(msg);
    }
    // 404 资源不存在：显示友好提示
    else if (status === 404) {
      const msg = data?.message || '请求的资源不存在';
      showGlobalError(msg);
    }
    // 429 限流：提示用户稍后再试（后端 IP/租户限流命中）
    else if (status === 429) {
      showGlobalError('操作过于频繁，请稍后再试');
    }
    // 500 服务器错误：显示友好提示
    else if (status === 500) {
      showGlobalError('服务器内部错误，请稍后重试');
    }
    // 502/503/504 网关错误：反向代理或后端不可用
    else if (status === 502 || status === 503 || status === 504) {
      showGlobalError('服务暂时不可用，可能正在维护或过载，请稍后重试');
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

    // 无存储的用户信息，说明未登录，直接跳转登录页
    const storedUser = sessionStorage.getItem('user');
    if (!storedUser) {
      sessionStorage.clear();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // 防止并发刷新：第一个 401 触发刷新，后续请求排队等待
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push({ resolve, reject });
      }).then(() => {
        // Cookie 已由后端更新（Set-Cookie），重发原始请求时浏览器自动携带新 access_token
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // 刷新请求不传 body：HttpOnly Cookie 中 refresh_token 由浏览器自动携带，
      // 后端 Refresh 端点在 body 为空时自动从 Cookie 读取
      // 注意：v1.3.0 起响应体不再返回 accessToken（[JsonIgnore]），只返回 expiresIn + userInfo
      const response = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
      const { userInfo } = response.data;

      // 更新 authStore（同步 Zustand 内存状态，Cookie 由浏览器管理）
      if (userInfo) {
        const { useAuthStore } = await import('../stores/authStore');
        useAuthStore.getState().setAuth(userInfo);
      }

      // 通知排队请求重试
      processPendingRequests();

      // 重发原始请求（浏览器自动携带新 access_token Cookie）
      return api(originalRequest);
    } catch (refreshError) {
      // 刷新失败（refresh_token 也过期或被吊销），清除会话并跳转登录
      processPendingRequests(refreshError);
      sessionStorage.clear();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
