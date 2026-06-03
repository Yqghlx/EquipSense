import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 分钟内数据视为新鲜，避免频繁请求
      staleTime: 5 * 60_000,
      // 10 分钟后清理未使用的缓存
      gcTime: 10 * 60_000,
      retry: 1,
      // 关闭窗口聚焦时自动刷新，减少不必要的请求
      refetchOnWindowFocus: false,
    },
  },
});
