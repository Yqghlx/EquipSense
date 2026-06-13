import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import api from '../lib/api';

type ForgotPasswordFormData = {
  email: string;
};

/**
 * 忘记密码页面 — 提交邮箱申请密码重置，系统发送重置链接邮件
 *
 * 无论邮箱是否存在都返回成功提示（防止邮箱枚举攻击）。
 */
export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const schema = z.object({
    email: z.string().min(1, t('auth.emailRequired', '邮箱不能为空')).email(t('auth.emailInvalid', '邮箱格式不正确')),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setSubmitted(true);
    } catch {
      // 即使失败也显示成功提示（防枚举）
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('auth.forgotPassword', '忘记密码')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 rounded-md bg-green-500/10 p-4">
            <Mail className="h-5 w-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-400">
              {t('auth.resetEmailSent', '如果该邮箱已注册，重置链接已发送至您的邮箱。请检查收件箱（含垃圾邮件文件夹），链接 30 分钟内有效。')}
            </p>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary underline-offset-4 hover:underline">
              {t('auth.backToLogin', '返回登录')}
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('auth.forgotPassword', '忘记密码')}</CardTitle>
        <CardDescription>{t('auth.forgotPasswordHint', '输入您的注册邮箱，我们将发送密码重置链接')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email', '邮箱')}</Label>
            <Input id="email" type="email" {...register('email')} placeholder="you@example.com" />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('common.loading', '加载中...') : t('auth.sendResetLink', '发送重置链接')}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary underline-offset-4 hover:underline">
              {t('auth.backToLogin', '返回登录')}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
