import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { ChangePasswordDialog } from '../components/auth/ChangePasswordDialog';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { persistTokenExpiry } from '../lib/tokenExpiry';
import type { AuthResponse } from '../types';

/** 登录表单数据类型 */
type LoginFormData = {
  username: string;
  password: string;
};

/** TOTP 验证码表单数据类型 */
type TotpFormData = {
  totpCode: string;
};

/**
 * 登录页面组件
 *
 * 两阶段登录流程：
 *   1. 密码验证：提交用户名/密码
 *   2. MFA 验证（仅当用户启用了 MFA）：提交 authenticator 生成的 6 位 TOTP 验证码
 *
 * 认证 Cookie 由后端在每次成功响应时自动通过 Set-Cookie 设置。
 */
export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // MFA 阶段状态
  const [mfaChallengeToken, setMfaChallengeToken] = useState<string | null>(null);
  const [mfaUserInfo, setMfaUserInfo] = useState<AuthResponse['userInfo'] | null>(null);

  /** 登录表单校验规则 */
  const loginSchema = z.object({
    username: z.string().min(1, t('auth.usernameRequired')),
    password: z.string().min(1, t('auth.passwordRequired')),
  });

  /** TOTP 验证码校验规则：6 位数字 */
  const totpSchema = z.object({
    totpCode: z.string().regex(/^\d{6}$/, '验证码必须为 6 位数字'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerTotp,
    handleSubmit: handleSubmitTotp,
    formState: { errors: totpErrors },
  } = useForm<TotpFormData>({
    resolver: zodResolver(totpSchema),
  });

  /** 提交登录表单（第一阶段：密码验证） */
  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post<AuthResponse>('/auth/login', data);

      // 检查是否需要 MFA 二次验证
      if (response.data.mfaRequired && response.data.mfaChallengeToken) {
        setMfaChallengeToken(response.data.mfaChallengeToken);
        setMfaUserInfo(response.data.userInfo);
        setLoading(false);
        return;
      }

      // 无需 MFA，直接完成登录
      setAuth(response.data.userInfo);
      // 持久化令牌【绝对过期时间戳】，供 useTokenRefresh 计算主动刷新时机。
      // 必须使用后端实际返回的 expiresIn（受 #200 可配置 AccessTokenMinutes 影响，10~1440s），
      // 不能用前端默认值，否则主动刷新被排到错误时刻。
      persistTokenExpiry(response.data.expiresIn);
      // 认证 Cookie 由后端登录响应自动设置
      if (response.data.userInfo.mustChangePassword) {
        setMustChangePassword(true);
      } else {
        const from = (location.state as { from?: string })?.from || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch {
      setError(t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  /** 提交 TOTP 验证码（第二阶段：MFA 验证） */
  const onMfaSubmit = async (data: TotpFormData) => {
    if (!mfaChallengeToken) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.post<AuthResponse>('/auth/mfa/verify', {
        challengeToken: mfaChallengeToken,
        totpCode: data.totpCode,
      });
      setAuth(response.data.userInfo);
      // 持久化令牌过期时间戳（与密码登录路径一致），供 useTokenRefresh 主动刷新
      persistTokenExpiry(response.data.expiresIn);
      const from = (location.state as { from?: string })?.from || '/dashboard';
      navigate(from, { replace: true });
    } catch {
      setError('验证码错误，请检查 authenticator 应用中的时间是否准确');
    } finally {
      setLoading(false);
    }
  };

  /** 返回密码输入阶段（清空 MFA 状态） */
  const backToPassword = () => {
    setMfaChallengeToken(null);
    setMfaUserInfo(null);
    setError('');
  };

  // MFA 验证阶段 UI
  if (mfaChallengeToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>多因素认证</CardTitle>
          <CardDescription>
            请输入 Authenticator 应用中的 6 位验证码
            {mfaUserInfo && <span className="block text-xs">用户：{mfaUserInfo.displayName || mfaUserInfo.username}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitTotp(onMfaSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totpCode">验证码</Label>
              <Input
                id="totpCode"
                {...registerTotp('totpCode')}
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
                inputMode="numeric"
                autoFocus
              />
              {totpErrors.totpCode && <p className="text-sm text-destructive">{totpErrors.totpCode.message}</p>}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('common.loading') : '验证'}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={backToPassword} disabled={loading}>
              返回
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // 密码输入阶段 UI
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('auth.login')}</CardTitle>
        <CardDescription>{t('auth.loginSubtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">{t('auth.username')}</Label>
            <Input id="username" autoComplete="username" {...register('username')} placeholder={t('auth.username')} />
            {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input id="password" type="password" autoComplete="current-password" {...register('password')} placeholder={t('auth.password')} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('common.loading') : t('auth.login')}
          </Button>
          <p className="text-center text-sm">
            <Link to="/forgot-password" className="text-muted-foreground underline-offset-4 hover:underline">
              {t('auth.forgotPassword', '忘记密码？')}
            </Link>
          </p>
          <p className="text-center text-sm text-muted-foreground">
            {t('register.noAccount')}{' '}
            <Link to="/register" className="text-primary underline-offset-4 hover:underline">
              {t('register.title')}
            </Link>
          </p>
        </form>
      </CardContent>
      {mustChangePassword && (
        <ChangePasswordDialog
          forced
          onSuccess={() => {
            setMustChangePassword(false);
            const from = (location.state as { from?: string })?.from || '/dashboard';
            navigate(from, { replace: true });
          }}
        />
      )}
    </Card>
  );
}
