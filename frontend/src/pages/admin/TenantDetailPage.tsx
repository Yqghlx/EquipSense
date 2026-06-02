import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useTenantDetail, useFreezeTenant, useUnfreezeTenant } from '../../hooks/useTenantsAdmin';
import { useChangePlan } from '../../hooks/useSubscription';
import {
  ArrowLeft,
  Building2,
  Users,
  Wrench,
  AlertTriangle,
  ClipboardList,
  Brain,
} from 'lucide-react';

/**
 * 租户详情页
 *
 * system_admin 专用页面，展示单个租户的完整信息：
 * - 基础信息卡片
 * - 资源用量卡片（带进度条）
 * - 操作卡片（冻结/解冻 + 套餐变更）
 */
export default function TenantDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: tenant, isLoading } = useTenantDetail(id);
  const freezeMutation = useFreezeTenant();
  const unfreezeMutation = useUnfreezeTenant();
  const changePlanMutation = useChangePlan();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('admin.tenants.notFound')}</p>
      </div>
    );
  }

  /** 设备使用率 */
  const devicePercent = tenant.maxDevices > 0
    ? Math.min(100, (tenant.currentDeviceCount / tenant.maxDevices) * 100)
    : 0;
  /** 用户使用率 */
  const userPercent = tenant.maxUsers > 0
    ? Math.min(100, (tenant.currentUserCount / tenant.maxUsers) * 100)
    : 0;

  /** 状态对应的徽章样式 */
  const statusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'Active': return 'default';
      case 'Frozen': return 'destructive';
      case 'Trial': return 'secondary';
      default: return 'outline';
    }
  };

  /** 处理冻结/解冻 */
  const handleToggleFreeze = () => {
    if (tenant.status === 'Frozen') {
      unfreezeMutation.mutate(tenant.id);
    } else {
      freezeMutation.mutate(tenant.id);
    }
  };

  /** 处理套餐变更（简化实现：在 Free / Basic / Professional / Enterprise 间切换） */
  const handleChangePlan = () => {
    const plans = ['Free', 'Basic', 'Professional', 'Enterprise'];
    const currentIndex = plans.indexOf(tenant.plan);
    // 循环切换到下一个套餐（演示用途）
    const nextPlan = plans[(currentIndex + 1) % plans.length];
    changePlanMutation.mutate({ tenantId: tenant.id, plan: nextPlan });
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 — 返回按钮 + 租户名称 + 状态 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/tenants')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('admin.tenants.backToList')}
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">{tenant.name}</h1>
          <Badge variant={statusVariant(tenant.status)}>
            {t(`admin.tenants.status.${tenant.status.toLowerCase()}`, tenant.status)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 基础信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.tenants.detail.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Slug" value={tenant.slug} />
            <InfoRow label={t('admin.tenants.columns.plan')} value={tenant.plan} />
            <InfoRow label={t('admin.tenants.detail.admin')} value={
              tenant.adminEmail
                ? `${tenant.adminUsername} (${tenant.adminEmail})`
                : tenant.adminUsername || '-'
            } />
            {tenant.trialEndsAt && (
              <InfoRow
                label={t('admin.tenants.detail.trialEndsAt')}
                value={new Date(tenant.trialEndsAt).toLocaleDateString()}
              />
            )}
            {tenant.subscriptionEndsAt && (
              <InfoRow
                label={t('admin.tenants.detail.subscriptionEndsAt')}
                value={new Date(tenant.subscriptionEndsAt).toLocaleDateString()}
              />
            )}
            <InfoRow
              label={t('admin.tenants.detail.dataRetention')}
              value={`${tenant.dataRetentionDays} ${t('subscription.days')}`}
            />
            <InfoRow
              label={t('admin.tenants.columns.createdAt')}
              value={new Date(tenant.createdAt).toLocaleString()}
            />
          </CardContent>
        </Card>

        {/* 资源用量卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.tenants.detail.resourceUsage')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 设备用量 */}
            <ResourceBar
              icon={<Wrench className="h-4 w-4" />}
              label={t('admin.tenants.detail.devices')}
              current={tenant.currentDeviceCount}
              max={tenant.maxDevices}
              percent={devicePercent}
            />
            {/* 用户用量 */}
            <ResourceBar
              icon={<Users className="h-4 w-4" />}
              label={t('admin.tenants.detail.users')}
              current={tenant.currentUserCount}
              max={tenant.maxUsers}
              percent={userPercent}
            />
            {/* 活跃告警 */}
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm flex-1">{t('admin.tenants.detail.activeAlerts')}</span>
              <span className="text-sm font-semibold">{tenant.activeAlertCount}</span>
            </div>
            {/* 待处理工单 */}
            <div className="flex items-center gap-3">
              <ClipboardList className="h-4 w-4 text-yellow-500" />
              <span className="text-sm flex-1">{t('admin.tenants.detail.pendingWorkOrders')}</span>
              <span className="text-sm font-semibold">{tenant.pendingWorkOrderCount}</span>
            </div>
            {/* 本月分析 */}
            <div className="flex items-center gap-3">
              <Brain className="h-4 w-4 text-purple-500" />
              <span className="text-sm flex-1">{t('admin.tenants.detail.monthlyAnalysis')}</span>
              <span className="text-sm font-semibold">{tenant.monthlyAnalysisCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 操作卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.tenants.detail.actions')}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Button
            variant={tenant.status === 'Frozen' ? 'outline' : 'destructive'}
            onClick={handleToggleFreeze}
            disabled={freezeMutation.isPending || unfreezeMutation.isPending}
          >
            {tenant.status === 'Frozen'
              ? t('admin.tenants.unfreeze')
              : t('admin.tenants.freeze')}
          </Button>
          <Button
            variant="outline"
            onClick={handleChangePlan}
            disabled={changePlanMutation.isPending}
          >
            {t('subscription.changePlan')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/** 信息行组件 — label + value 水平排列 */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

/** 资源进度条组件 — 显示资源用量和进度 */
function ResourceBar({
  icon,
  label,
  current,
  max,
  percent,
}: {
  icon: React.ReactNode;
  label: string;
  current: number;
  max: number;
  percent: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm flex-1">{label}</span>
        <span className="text-sm font-medium">
          {current}/{max}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            percent >= 90 ? 'bg-red-500' : percent >= 70 ? 'bg-yellow-500' : 'bg-primary'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
