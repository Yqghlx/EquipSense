import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

/** 修改密码表单数据 */
type ChangePasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

interface ChangePasswordDialogProps {
  /** 是否强制修改（首次登录），不可关闭 */
  forced?: boolean;
  /** 修改成功回调 */
  onSuccess?: () => void;
}

/**
 * 修改密码对话框
 *
 * 支持两种模式：
 * - forced=true：首次登录强制改密，隐藏关闭按钮
 * - forced=false：用户主动修改，可随时关闭
 */
export function ChangePasswordDialog({ forced = false, onSuccess }: ChangePasswordDialogProps) {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);

  const schema = z
    .object({
      currentPassword: z.string().min(1, t('auth.currentPasswordRequired')),
      newPassword: z.string().min(8, t('auth.newPasswordMin')),
      confirmPassword: z.string().min(1, t('auth.confirmPasswordRequired')),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
      message: t('auth.passwordMismatch'),
      path: ['confirmPassword'],
    });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      // 更新本地用户信息，清除 mustChangePassword 标志
      if (user) {
        setAuth(useAuthStore.getState().token!, { ...user, mustChangePassword: false });
      }
      onSuccess?.();
    } catch {
      setError(t('auth.changePasswordError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open>
      <DialogContent showCloseButton={!forced}>
        <DialogHeader>
          <DialogTitle>{t('auth.changePassword')}</DialogTitle>
          <DialogDescription>
            {forced ? t('auth.forceChangePasswordHint') : t('auth.changePasswordHint')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('auth.currentPassword')}</Label>
            <Input type="password" {...register('currentPassword')} />
            {errors.currentPassword && <p className="text-sm text-destructive">{errors.currentPassword.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>{t('auth.newPassword')}</Label>
            <Input type="password" {...register('newPassword')} />
            {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>{t('auth.confirmPassword')}</Label>
            <Input type="password" {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
