import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import api from '../lib/api';

type ResetPasswordFormData = {
  newPassword: string;
  confirmPassword: string;
};

/**
 * 重置密码页面 — 从 URL ?token=xxx 读取重置令牌，提交新密码
 *
 * 用户从邮件点击重置链接进入此页面，输入新密码后跳转登录。
 */
export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const schema = z
    .object({
      newPassword: z.string().min(8, t('auth.passwordMin', '密码至少 8 位')),
      confirmPassword: z.string().min(1, t('auth.confirmPasswordRequired', '请再次输入密码')),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('auth.passwordMismatch', '两次输入的密码不一致'),
      path: ['confirmPassword'],
    });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, newPassword: data.newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch {
      setError(t('auth.resetFailed', '重置失败，链接可能已过期，请重新申请'));
    } finally {
      setLoading(false);
    }
  };

  // 无 token 时提示
  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('auth.resetPassword', '重置密码')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-destructive">
            {t('auth.resetTokenMissing', '重置链接无效，缺少必要参数。请通过邮件中的链接进入。')}
          </p>
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/forgot-password" className="text-primary underline-offset-4 hover:underline">
              {t('auth.requestResetAgain', '重新申请重置')}
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('auth.resetPassword', '重置密码')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-green-500/10 p-4">
            <p className="text-sm text-green-700 dark:text-green-400">
              {t('auth.resetSuccess', '密码重置成功！即将跳转登录页...')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('auth.resetPassword', '重置密码')}</CardTitle>
        <CardDescription>{t('auth.resetPasswordHint', '请输入您的新密码')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('auth.newPassword', '新密码')}</Label>
            <Input id="newPassword" type="password" {...register('newPassword')} placeholder={t('auth.newPassword', '新密码')} />
            {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('auth.confirmPassword', '确认新密码')}</Label>
            <Input id="confirmPassword" type="password" {...register('confirmPassword')} placeholder={t('auth.confirmPassword', '确认新密码')} />
            {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('common.loading', '加载中...') : t('auth.resetPassword', '重置密码')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
