/**
 * 用户管理 TanStack Query hooks
 *
 * 对应后端 /api/v1/admin/users 端点，
 * 提供用户列表查询、创建、更新、停用、角色变更等操作。
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { PagedResult } from '../types';

/** 用户信息（对应后端 UserDto） */
export interface UserItem {
  /** 用户唯一标识 */
  id: string;
  /** 登录用户名 */
  username: string;
  /** 显示名称 */
  displayName?: string;
  /** 角色名称（SystemAdmin / MaintenanceLead / Technician / Operator / Viewer） */
  role: string;
  /** 邮箱 */
  email?: string;
  /** 手机号 */
  phone?: string;
  /** 是否启用 */
  isActive: boolean;
  /** 创建时间 */
  createdAt: string;
  /** 是否需要修改密码 */
  mustChangePassword: boolean;
}

/** 用户列表查询参数 */
interface UsersQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

/** 创建用户请求 */
export interface CreateUserPayload {
  username: string;
  password: string;
  displayName?: string;
  role?: string;
  email?: string;
  phone?: string;
}

/** 更新用户请求 */
export interface UpdateUserPayload {
  displayName?: string;
  email?: string;
  phone?: string;
}

/**
 * 查询用户列表（分页 + 搜索）
 *
 * 调用 GET /api/v1/admin/users
 */
export function useUsers(query: UsersQuery = {}) {
  return useQuery({
    queryKey: ['admin', 'users', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.page) params.set('page', String(query.page));
      if (query.pageSize) params.set('pageSize', String(query.pageSize));
      if (query.keyword) params.set('keyword', query.keyword);
      const { data } = await api.get(`/admin/users?${params.toString()}`);
      return data as PagedResult<UserItem>;
    },
  });
}

/**
 * 创建新用户
 *
 * 调用 POST /api/v1/admin/users
 */
export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      const { data } = await api.post('/admin/users', payload);
      return data as UserItem;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

/**
 * 更新用户信息
 *
 * 调用 PUT /api/v1/admin/users/{id}
 */
export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateUserPayload & { id: string }) => {
      const { data } = await api.put(`/admin/users/${id}`, payload);
      return data as UserItem;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

/**
 * 停用用户（软删除）
 *
 * 调用 DELETE /api/v1/admin/users/{id}
 */
export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

/**
 * 变更用户角色
 *
 * 调用 PUT /api/v1/admin/users/{id}/role
 */
export function useChangeUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      await api.put(`/admin/users/${id}/role`, { role });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
