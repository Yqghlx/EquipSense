import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { useAuthStore } from '../stores/authStore';
import { usePlans, useRegister } from '../hooks/useRegister';
import type { PlanInfo } from '../types';

/**
 * 注册页面组件
 *
 * 三步注册流程：
 * 1. 套餐选择 — 三列卡片，点击选中
 * 2. 企业信息 — 企业名称 + 标识（slug）
 * 3. 管理员账户 — 用户名 + 密码 + 确认密码 + 显示名称 + 邮箱
 *
 * 注册成功后自动登录并跳转到仪表盘。
 */
export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const registerMutation = useRegister();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [error, setError] = useState('');

  const { data: plans, isLoading: plansLoading } = usePlans();

  // ---- 步骤 2 校验 Schema（企业信息） ----
  const tenantSchema = z.object({
    tenantName: z.string().min(2, t('register.tenantNameMin')),
    slug: z
      .string()
      .min(2, t('register.slugMin'))
      .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, t('register.slugPattern')),
  });

  type TenantFormData = z.infer<typeof tenantSchema>;

  const tenantForm = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: { tenantName: '', slug: '' },
  });

  // ---- 步骤 3 校验 Schema（管理员账户） ----
  const accountSchema = z
    .object({
      username: z.string().min(3, t('register.usernameMin')),
      password: z.string().min(6, t('register.passwordMin')),
      confirmPassword: z.string().min(1, t('register.confirmPasswordRequired')),
      displayName: z.string().optional(),
      email: z.string().email({ message: t('register.emailInvalid') }).optional().or(z.literal('')),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: t('register.passwordMismatch'),
      path: ['confirmPassword'],
    });

  type AccountFormData = z.infer<typeof accountSchema>;

  const accountForm = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    mode: 'onBlur', // 启用失焦验证（输入框失去焦点时触发校验）
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      email: '',
    },
  });

  /** 从步骤 1 进入步骤 2 */
  const handleStep1Next = () => {
    if (!selectedPlan) return;
    setError('');
    setStep(2);
  };

  /** 从步骤 2 进入步骤 3（校验通过即进入下一步） */
  const handleStep2Next = tenantForm.handleSubmit(() => {
    setError('');
    setStep(3);
  });

  /** 步骤 3 提交注册 */
  const handleStep3Submit = accountForm.handleSubmit(async (accountData) => {
    setError('');
    const tenantData = tenantForm.getValues();

    try {
      const authResponse = await registerMutation.mutateAsync({
        tenantName: tenantData.tenantName,
        slug: tenantData.slug,
        username: accountData.username,
        password: accountData.password,
        displayName: accountData.displayName || undefined,
        email: accountData.email || undefined,
        plan: selectedPlan,
      });

      // 注册成功，自动登录
      setAuth(authResponse.accessToken, authResponse.userInfo);
      navigate('/dashboard', { replace: true });
    } catch {
      setError(t('register.registerError'));
    }
  });

  /** 步骤指示器渲染 */
  const renderStepper = () => (
    <div className="mb-6 flex items-center justify-center gap-2">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
              step >= s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {s}
          </div>
          {s < 3 && (
            <div className={`h-0.5 w-12 ${step > s ? 'bg-primary' : 'bg-muted'}`} />
          )}
        </div>
      ))}
    </div>
  );

  /** 步骤 1：套餐选择 */
  const renderStep1 = () => (
    <>
      <p className="mb-4 text-center text-sm text-muted-foreground">
        {t('register.selectPlanHint')}
      </p>
      {plansLoading ? (
        <p className="text-center text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(plans ?? []).map((plan: PlanInfo) => (
            <button
              key={plan.planId}
              type="button"
              onClick={() => setSelectedPlan(plan.planId)}
              className={`rounded-lg border-2 p-4 text-left transition-colors ${
                selectedPlan === plan.planId
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/30'
              }`}
            >
              <h3 className="text-base font-semibold">{plan.displayName}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>
              <div className="mt-3 space-y-1 text-xs">
                <p>
                  {t('register.maxDevices')}: {plan.maxDevices}
                </p>
                <p>
                  {t('register.maxUsers')}: {plan.maxUsers}
                </p>
                <p>
                  {t('register.dataRetention')}: {plan.dataRetentionDays} {t('subscription.days')}
                </p>
              </div>
              <p className="mt-2 text-sm font-bold">
                {plan.isFree
                  ? t('register.free')
                  : `¥${plan.monthlyPrice}/${t('register.month')}`}
              </p>
            </button>
          ))}
        </div>
      )}
      <Button className="mt-6 w-full" onClick={handleStep1Next} disabled={!selectedPlan}>
        {t('common.next')}
      </Button>
    </>
  );

  /** 步骤 2：企业信息 */
  const renderStep2 = () => (
    <form onSubmit={handleStep2Next} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tenantName">{t('register.tenantName')}</Label>
        <Input
          id="tenantName"
          {...tenantForm.register('tenantName')}
          placeholder={t('register.tenantNamePlaceholder')}
        />
        {tenantForm.formState.errors.tenantName && (
          <p className="text-sm text-destructive">
            {tenantForm.formState.errors.tenantName.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">{t('register.slug')}</Label>
        <Input
          id="slug"
          {...tenantForm.register('slug')}
          placeholder={t('register.slugPlaceholder')}
        />
        {tenantForm.formState.errors.slug && (
          <p className="text-sm text-destructive">
            {tenantForm.formState.errors.slug.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{t('register.slugHint')}</p>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
          {t('common.previous')}
        </Button>
        <Button type="submit" className="flex-1">
          {t('common.next')}
        </Button>
      </div>
    </form>
  );

  /** 步骤 3：管理员账户 */
  const renderStep3 = () => (
    <form onSubmit={handleStep3Submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reg-username">{t('auth.username')}</Label>
        <Input
          id="reg-username"
          {...accountForm.register('username')}
          placeholder={t('auth.username')}
        />
        {accountForm.formState.errors.username && (
          <p className="text-sm text-destructive">
            {accountForm.formState.errors.username.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-password">{t('auth.password')}</Label>
        <Input
          id="reg-password"
          type="password"
          {...accountForm.register('password')}
          placeholder={t('auth.password')}
        />
        {accountForm.formState.errors.password && (
          <p className="text-sm text-destructive">
            {accountForm.formState.errors.password.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t('register.confirmPassword')}</Label>
        <Input
          id="confirmPassword"
          type="password"
          {...accountForm.register('confirmPassword')}
          placeholder={t('register.confirmPassword')}
        />
        {accountForm.formState.errors.confirmPassword && (
          <p className="text-sm text-destructive">
            {accountForm.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="displayName">{t('register.displayName')}</Label>
        <Input
          id="displayName"
          {...accountForm.register('displayName')}
          placeholder={t('register.displayNamePlaceholder')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t('register.email')}</Label>
        <Input
          id="email"
          type="email"
          {...accountForm.register('email')}
          placeholder={t('register.emailPlaceholder')}
        />
        {accountForm.formState.errors.email && (
          <p className="text-sm text-destructive">
            {accountForm.formState.errors.email.message}
          </p>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)}>
          {t('common.previous')}
        </Button>
        <Button type="submit" className="flex-1" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? t('common.loading') : t('register.submit')}
        </Button>
      </div>
    </form>
  );

  /** 步骤标题映射 */
  const stepTitles: Record<number, string> = {
    1: t('register.step1Title'),
    2: t('register.step2Title'),
    3: t('register.step3Title'),
  };

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{t('register.title')}</CardTitle>
        <CardDescription>{stepTitles[step]}</CardDescription>
      </CardHeader>
      <CardContent>
        {renderStepper()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t('register.hasAccount')}{' '}
          <Link to="/login" className="text-primary underline-offset-4 hover:underline">
            {t('auth.login')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
