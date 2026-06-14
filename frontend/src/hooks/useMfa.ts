/**
 * MFA（多因素认证）TanStack Query Hooks
 *
 * 提供 MFA 登录验证、MFA 设置、确认和禁用的 mutation hooks。
 * MFA 登录流程：Login 返回 mfaRequired=true → 调用 verifyMfa 完成登录。
 * MFA 管理流程：setup 获取 QR 码 URI → 用户扫码 → confirm 输入验证码启用 → 可随时 disable。
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { AuthResponse, MfaSetupResponse } from '../types';

/** MFA 登录验证请求参数 */
interface MfaVerifyParams {
  challengeToken: string;
  totpCode: string;
}

/** MFA 确认设置请求参数 */
interface MfaConfirmParams {
  totpCode: string;
}

/**
 * MFA 登录验证 Hook
 * 在 Login 返回 mfaRequired=true 后调用，携带挑战令牌 + TOTP 验证码完成登录
 * 成功后响应包含完整的 AuthResponse（含 Access Token），前端应存入 sessionStorage 并跳转 Dashboard
 */
export function useVerifyMfa() {
  return useMutation({
    mutationFn: async ({ challengeToken, totpCode }: MfaVerifyParams) => {
      const response = await api.post<AuthResponse>('/auth/mfa/verify', {
        challengeToken,
        totpCode,
      });
      return response.data;
    },
  });
}

/**
 * MFA 初始化设置 Hook
 * 调用后端生成 TOTP 密钥和 QR 码 URI
 * 响应包含 secret（手动输入用）和 qrCodeUri（生成 QR 码图片用）
 */
export function useMfaSetup() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post<MfaSetupResponse>('/auth/mfa/setup');
      return response.data;
    },
  });
}

/**
 * MFA 确认设置 Hook
 * 用户扫码后输入 TOTP 验证码，后端验证通过后正式启用 MFA
 * 成功后自动刷新当前用户信息（/auth/me）
 */
export function useMfaConfirm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ totpCode }: MfaConfirmParams) => {
      await api.post('/auth/mfa/confirm', { totpCode });
    },
    onSuccess: () => {
      // 刷新当前用户信息（mfaEnabled 状态已变更）
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

/**
 * MFA 禁用 Hook
 * 清除用户的 TOTP 密钥并标记 MfaEnabled=false
 * 成功后自动刷新当前用户信息
 */
export function useMfaDisable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/mfa/disable');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
