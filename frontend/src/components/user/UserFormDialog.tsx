/**
 * 创建/编辑用户表单对话框
 *
 * 支持两种模式：
 * - 创建模式（user=null）：显示用户名、密码、角色、显示名称、邮箱、手机
 * - 编辑模式（user 非空）：仅显示名称、邮箱、手机（后端 UpdateUserRequest 限制）
 *
 * 使用 React Hook Form + Zod 进行表单验证。
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import type { UserItem, CreateUserPayload, UpdateUserPayload } from '../../hooks/useUsers';

/** 角色选项（值与后端枚举一致） */
const ROLE_OPTIONS = [
  { value: 'SystemAdmin', labelKey: 'settings.role.systemAdmin' },
  { value: 'MaintenanceLead', labelKey: 'settings.role.maintenanceLead' },
  { value: 'Technician', labelKey: 'settings.role.technician' },
  { value: 'Operator', labelKey: 'settings.role.operator' },
  { value: 'Viewer', labelKey: 'settings.role.viewer' },
] as const;

/** 统一表单数据（所有字段都包含，通过 superRefine 动态验证） */
interface FormData {
  username: string;
  password: string;
  role: string;
  displayName: string;
  email: string;
  phone: string;
}

interface UserFormDialogProps {
  /** 是否打开对话框 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 待编辑的用户，null 表示创建模式 */
  user: UserItem | null;
  /** 提交回调（创建或更新） */
  onSubmit: (data: CreateUserPayload | UpdateUserPayload) => void;
  /** 是否正在提交 */
  submitting?: boolean;
}

export function UserFormDialog({ open, onClose, user, onSubmit, submitting }: UserFormDialogProps) {
  const { t } = useTranslation();
  const isEdit = !!user;

  /** 统一 schema：创建模式下 username/password 必填 */
  const schema = z.object({
    username: z.string(),
    password: z.string(),
    role: z.string(),
    displayName: z.string(),
    email: z.string(),
    phone: z.string(),
  }).superRefine((data, ctx) => {
    if (!isEdit) {
      if (!data.username || data.username.length < 3) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['username'], message: t('settings.user.usernameMin') });
      }
      if (!data.password || data.password.length < 8) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: t('settings.user.passwordMin') });
      }
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['email'], message: t('settings.user.emailInvalid') });
    }
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '', role: 'Viewer', displayName: '', email: '', phone: '' },
  });

  const currentRole = watch('role');

  /** 打开时初始化表单数据 */
  useEffect(() => {
    if (open) {
      if (user) {
        reset({ username: user.username, password: '', role: user.role, displayName: user.displayName ?? '', email: user.email ?? '', phone: user.phone ?? '' });
      } else {
        reset({ username: '', password: '', role: 'Viewer', displayName: '', email: '', phone: '' });
      }
    }
  }, [open, user, reset]);

  /** 提交表单 */
  const handleFormSubmit = (data: FormData) => {
    if (isEdit) {
      const payload: UpdateUserPayload = {
        displayName: data.displayName || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
      };
      onSubmit(payload);
    } else {
      const payload: CreateUserPayload = {
        username: data.username,
        password: data.password,
        displayName: data.displayName || undefined,
        role: data.role || 'Viewer',
        email: data.email || undefined,
        phone: data.phone || undefined,
      };
      onSubmit(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('settings.user.editUser') : t('settings.user.createUser')}</DialogTitle>
          <DialogDescription>
            {isEdit ? t('settings.user.editUserDesc') : t('settings.user.createUserDesc')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* 创建模式：用户名 */}
          {!isEdit && (
            <div className="space-y-2">
              <Label>{t('settings.username')} *</Label>
              <Input {...register('username')} placeholder={t('settings.user.usernamePlaceholder')} />
              {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
            </div>
          )}

          {/* 创建模式：密码 */}
          {!isEdit && (
            <div className="space-y-2">
              <Label>{t('auth.password')} *</Label>
              <Input type="password" {...register('password')} placeholder={t('settings.user.passwordPlaceholder')} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
          )}

          {/* 创建模式：角色选择 */}
          {!isEdit && (
            <div className="space-y-2">
              <Label>{t('settings.roleLabel')}</Label>
              <Select value={currentRole} onValueChange={(v) => { if (v) setValue('role', v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 显示名称 */}
          <div className="space-y-2">
            <Label>{t('settings.user.displayName')}</Label>
            <Input {...register('displayName')} placeholder={t('settings.user.displayNamePlaceholder')} />
          </div>

          {/* 邮箱 */}
          <div className="space-y-2">
            <Label>{t('settings.user.email')}</Label>
            <Input {...register('email')} placeholder={t('settings.user.emailPlaceholder')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          {/* 手机号 */}
          <div className="space-y-2">
            <Label>{t('settings.user.phone')}</Label>
            <Input {...register('phone')} placeholder={t('settings.user.phonePlaceholder')} />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t('common.loading') : (isEdit ? t('common.save') : t('common.create'))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
