import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import type { PlanInfo, RegisterRequest, AuthResponse } from '../types';

/**
 * 获取可用套餐列表
 *
 * 套餐列表变化频率低，缓存 10 分钟。
 */
export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data } = await api.get<PlanInfo[]>('/auth/plans');
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * 注册 mutation
 *
 * 注册成功后返回 AuthResponse，调用方需自行处理 token 存储。
 */
export function useRegister() {
  return useMutation<AuthResponse, Error, RegisterRequest>({
    mutationFn: async (request: RegisterRequest) => {
      const { data } = await api.post<AuthResponse>('/auth/register', request);
      return data;
    },
  });
}
