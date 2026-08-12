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
import type { AuthResponse, MfaSetupResponse } from '../types';
import QRCode from 'qrcode';

/** 登录表单数据类型 */
type LoginFormData = {
  username: string;
  password: string;
};

/** TOTP 验证码表单数据类型 */
type TotpFormData = {
  totpCode: string;
};

/** 登录页路由状态，注册完成后可携带强制 MFA enrollment 流程继续操作 */
type LoginLocationState = {
  from?: string;
  mfaEnrollmentToken?: string;
  mfaEnrollmentUserInfo?: AuthResponse['userInfo'];
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
  const currentUser = useAuthStore((s) => s.user);
  const initialLocationState = (location.state ?? {}) as LoginLocationState;
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(() => currentUser?.mustChangePassword === true);

  // MFA 阶段状态
  const [mfaChallengeToken, setMfaChallengeToken] = useState<string | null>(null);
  const [mfaUserInfo, setMfaUserInfo] = useState<AuthResponse['userInfo'] | null>(null);

  // 高权限角色首次登录的强制 MFA 注册状态
  const [mfaEnrollmentToken, setMfaEnrollmentToken] = useState<string | null>(initialLocationState.mfaEnrollmentToken ?? null);
  const [mfaEnrollmentUserInfo, setMfaEnrollmentUserInfo] = useState<AuthResponse['userInfo'] | null>(
    initialLocationState.mfaEnrollmentUserInfo ?? null,
  );
  const [mfaEnrollmentSetup, setMfaEnrollmentSetup] = useState<MfaSetupResponse | null>(null);
  const [mfaEnrollmentQrCode, setMfaEnrollmentQrCode] = useState<string | null>(null);
  const [mfaEnrollmentCode, setMfaEnrollmentCode] = useState('');
  const [mfaEnrollmentRecoveryCodes, setMfaEnrollmentRecoveryCodes] = useState<string[] | null>(null);
  const [mfaEnrollmentAuthenticated, setMfaEnrollmentAuthenticated] = useState(false);

  /** 登录表单校验规则 */
  const loginSchema = z.object({
    username: z.string().min(1, t('auth.usernameRequired')),
    password: z.string().min(1, t('auth.passwordRequired')),
  });

  /** TOTP 验证码校验规则：6 位数字 */
  const totpSchema = z.object({
    totpCode: z.string().refine(
      (value) => /^\d{6}$/.test(value) || /^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/i.test(value),
      t('mfa.codeOrRecoveryCodeInvalid'),
    ),
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

      // 生产高权限账户首次登录必须先完成 MFA 注册，整个流程仍不持有 JWT。
      if (response.data.mfaEnrollmentRequired && response.data.mfaEnrollmentToken) {
        setMfaEnrollmentToken(response.data.mfaEnrollmentToken);
        setMfaEnrollmentUserInfo(response.data.userInfo);
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

  /** 生成强制 MFA 注册二维码 */
  const setupMfaEnrollment = async () => {
    if (!mfaEnrollmentToken) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.post<MfaSetupResponse>('/auth/mfa/enroll/setup', {
        enrollmentToken: mfaEnrollmentToken,
      });
      setMfaEnrollmentSetup(response.data);
      const dataUrl = await QRCode.toDataURL(response.data.qrCodeUri, {
        width: 240,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      });
      setMfaEnrollmentQrCode(dataUrl);
    } catch {
      setError(t('mfa.enrollmentSetupFailed'));
    } finally {
      setLoading(false);
    }
  };

  /** 确认强制 MFA 注册并完成登录 */
  const onMfaEnrollmentSubmit = async () => {
    if (!mfaEnrollmentToken) return;
    if (!/^\d{6}$/.test(mfaEnrollmentCode)) {
      setError(t('mfa.codeInvalid'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.post<AuthResponse>('/auth/mfa/enroll/confirm', {
        enrollmentToken: mfaEnrollmentToken,
        totpCode: mfaEnrollmentCode,
      });
      setAuth(response.data.userInfo);
      persistTokenExpiry(response.data.expiresIn);
      if (response.data.mfaRecoveryCodes?.length) {
        setMfaEnrollmentRecoveryCodes(response.data.mfaRecoveryCodes);
        setMfaEnrollmentAuthenticated(true);
      } else {
        const from = (location.state as { from?: string })?.from || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch {
      setError(t('mfa.enrollmentConfirmFailed'));
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
      setError(t('mfa.codeError'));
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

  /** 取消强制 MFA 注册并重新输入密码 */
  const backFromMfaEnrollment = () => {
    setMfaEnrollmentToken(null);
    setMfaEnrollmentUserInfo(null);
    setMfaEnrollmentSetup(null);
    setMfaEnrollmentQrCode(null);
    setMfaEnrollmentCode('');
    setMfaEnrollmentRecoveryCodes(null);
    setMfaEnrollmentAuthenticated(false);
    setError('');
  };

  /** 继续进入系统；恢复码已经在上一步展示过且不会再次返回。 */
  const continueAfterMfaEnrollment = () => {
    const from = (location.state as { from?: string })?.from || '/dashboard';
    navigate(from, { replace: true });
  };

  // 强制 MFA 注册阶段 UI
  if (mfaEnrollmentToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('mfa.enrollmentTitle')}</CardTitle>
          <CardDescription>
            {t('mfa.enrollmentDesc')}
            {mfaEnrollmentUserInfo && (
              <span className="block text-xs">
                {mfaEnrollmentUserInfo.displayName || mfaEnrollmentUserInfo.username}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mfaEnrollmentRecoveryCodes ? (
            <div className="space-y-4">
              <p className="text-sm text-destructive">{t('mfa.recoveryCodesWarning')}</p>
              <div className="grid grid-cols-2 gap-2 rounded bg-muted p-3 font-mono text-sm">
                {mfaEnrollmentRecoveryCodes.map((code) => (
                  <code key={code}>{code}</code>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigator.clipboard?.writeText(mfaEnrollmentRecoveryCodes.join('\n'))}
              >
                {t('mfa.recoveryCodesCopy')}
              </Button>
              <Button type="button" onClick={continueAfterMfaEnrollment} className="w-full">
                {t('mfa.recoveryCodesContinue')}
              </Button>
            </div>
          ) : !mfaEnrollmentSetup ? (
            <Button onClick={setupMfaEnrollment} className="w-full" disabled={loading}>
              {loading ? t('common.loading') : t('mfa.enrollmentSetup')}
            </Button>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{t('mfa.enrollmentConfigDesc')}</p>
              {mfaEnrollmentQrCode && (
                <div className="flex justify-center">
                  <img src={mfaEnrollmentQrCode} alt={t('mfa.qrAlt')} className="rounded border" />
                </div>
              )}
              <div className="rounded bg-muted px-3 py-2 text-xs">
                <span className="text-muted-foreground">{t('mfa.manualKeyLabel')}</span>
                <code className="mt-1 block break-all font-mono">{mfaEnrollmentSetup.secret}</code>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mfaEnrollmentCode">{t('mfa.codeLabel')}</Label>
                <Input
                  id="mfaEnrollmentCode"
                  value={mfaEnrollmentCode}
                  onChange={(event) => setMfaEnrollmentCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>
              <Button onClick={onMfaEnrollmentSubmit} className="w-full" disabled={loading || mfaEnrollmentCode.length !== 6}>
                {loading ? t('common.loading') : t('mfa.enrollmentConfirm')}
              </Button>
            </>
          )}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {!mfaEnrollmentAuthenticated && (
            <Button type="button" variant="ghost" className="w-full" onClick={backFromMfaEnrollment} disabled={loading}>
              {t('mfa.enrollmentBack')}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // MFA 验证阶段 UI
  if (mfaChallengeToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('mfa.title')}</CardTitle>
          <CardDescription>
            {t('mfa.loginDesc')}
            {mfaUserInfo && (
              <span className="block text-xs">
                {t('mfa.loginUser')}: {mfaUserInfo.displayName || mfaUserInfo.username}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form key="mfa-verification" onSubmit={handleSubmitTotp(onMfaSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totpCode">{t('mfa.loginCodeLabel')}</Label>
              <Input
                id="totpCode"
                {...registerTotp('totpCode')}
                placeholder={t('mfa.loginCodePlaceholder')}
                maxLength={19}
                autoComplete="one-time-code"
                inputMode="text"
                autoFocus
                aria-invalid={totpErrors.totpCode ? 'true' : undefined}
                aria-describedby={totpErrors.totpCode ? 'mfa-code-error' : undefined}
              />
              {totpErrors.totpCode && <p id="mfa-code-error" role="alert" className="text-sm text-destructive">{totpErrors.totpCode.message}</p>}
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('common.loading') : t('mfa.verify')}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={backToPassword} disabled={loading}>
              {t('common.previous')}
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
            <Input
              id="username"
              autoComplete="username"
              {...register('username')}
              placeholder={t('auth.username')}
              aria-invalid={errors.username ? 'true' : undefined}
              aria-describedby={errors.username ? 'login-username-error' : undefined}
            />
            {errors.username && <p id="login-username-error" role="alert" className="text-sm text-destructive">{errors.username.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              placeholder={t('auth.password')}
              aria-invalid={errors.password ? 'true' : undefined}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
            />
            {errors.password && <p id="login-password-error" role="alert" className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
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
