import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { useSubscription, useChangePlan } from '../../hooks/useSubscription';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Separator } from '../ui/separator';

/** 可选计划列表 */
const plans = [
  { value: 'Trial', label: '试用版', devices: 5, users: 3, retention: 30 },
  { value: 'Basic', label: '基础版', devices: 50, users: 20, retention: 90 },
  { value: 'Professional', label: '专业版', devices: 200, users: 50, retention: 180 },
  { value: 'Enterprise', label: '企业版', devices: 500, users: 200, retention: 365 },
];

/**
 * 订阅管理面板
 *
 * 展示当前租户的订阅信息（设备/用户用量、数据保留天数），
 * 并支持在四种计划之间切换。
 */
export function SubscriptionPanel() {
  const { t } = useTranslation();
  // v1.4：HttpOnly Cookie 迁移后 token 不再前端可见，改用 UserInfo.tenantId
  const user = useAuthStore((s) => s.user);
  const tenantId = user?.tenantId;
  const { data: sub } = useSubscription(tenantId);
  const changePlanMutation = useChangePlan();

  if (!sub) return <p className="text-center text-muted-foreground py-8">{t('subscription.noData')}</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('subscription.title')}</CardTitle>
        <CardDescription>{t('subscription.currentPlan')}: {sub.planDisplayName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 用量概览 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{t('subscription.devices')}</p>
            <p className="text-2xl font-bold">{sub.currentDevices} <span className="text-sm font-normal text-muted-foreground">/ {sub.maxDevices}</span></p>
            <div className="mt-2 h-2 rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, (sub.currentDevices / sub.maxDevices) * 100)}%` }}
              />
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{t('subscription.users')}</p>
            <p className="text-2xl font-bold">{sub.currentUsers} <span className="text-sm font-normal text-muted-foreground">/ {sub.maxUsers}</span></p>
            <div className="mt-2 h-2 rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, (sub.currentUsers / sub.maxUsers) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {t('subscription.dataRetention')}: {sub.dataRetentionDays} {t('subscription.days')}
        </p>

        <Separator />

        <h3 className="font-medium">{t('subscription.changePlan')}</h3>
        <div className="grid grid-cols-2 gap-3">
          {plans.map((plan) => (
            <Card
              key={plan.value}
              className={`cursor-pointer transition-colors ${sub.plan === plan.value ? 'ring-2 ring-primary' : ''}`}
              onClick={() => {
                if (sub.plan !== plan.value) {
                  changePlanMutation.mutate({ tenantId: sub.tenantId, plan: plan.value });
                }
              }}
            >
              <CardContent className="p-4">
                <p className="font-medium">{plan.label}</p>
                <p className="text-xs text-muted-foreground">
                  {plan.devices} {t('subscription.devices')} / {plan.users} {t('subscription.users')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {plan.retention} {t('subscription.days')} {t('subscription.dataRetention')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
