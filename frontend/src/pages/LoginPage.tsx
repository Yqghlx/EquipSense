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
import type { AuthResponse } from '../types';

/** 登录表单数据类型 */
type LoginFormData = {
  username: string;
  password: string;
};

/**
 * 登录页面组件
 *
 * 使用 react-hook-form + zod 进行表单校验，
 * 登录成功后保存令牌和用户信息并跳转仪表盘。
 */
export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  /** 登录表单校验规则（放在组件内部以使用 t() 函数） */
  const loginSchema = z.object({
    username: z.string().min(1, t('auth.usernameRequired')),
    password: z.string().min(1, t('auth.passwordRequired')),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  /** 提交登录表单 */
  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post<AuthResponse>('/auth/login', data);
      setAuth(response.data.accessToken, response.data.userInfo);
      // 保存刷新令牌到 localStorage，用于自动续期
      localStorage.setItem('refreshToken', response.data.refreshToken);
      // 首次登录需要强制修改密码
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
            <Input id="username" {...register('username')} placeholder={t('auth.username')} />
            {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input id="password" type="password" {...register('password')} placeholder={t('auth.password')} />
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
