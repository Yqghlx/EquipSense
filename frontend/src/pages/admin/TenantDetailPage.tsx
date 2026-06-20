import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { useTenantDetail, useFreezeTenant, useUnfreezeTenant, useUpdateTimeZone } from '../../hooks/useTenantsAdmin';
import { useChangePlan } from '../../hooks/useSubscription';
import { useBillingHistory } from '../../hooks/useBilling';
import {
  ArrowLeft,
  Building2,
  Users,
  Wrench,
  AlertTriangle,
  ClipboardList,
  Brain,
  FileText,
  Globe,
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

/**
 * 常用时区候选（IANA ID）
 *
 * 设计取舍：
 * - 不直接暴露 TimeZoneInfo.GetSystemTimeZones()（Linux 容器返回的 IANA ID 在 Windows 上不可用）
 * - 这里只列工业监控场景常见的几个时区，未列出的可由 SysAdmin 直接通过 SQL/API 修改
 * - 默认值统一用 "UTC"，避免空值导致 DashboardStatsService 报错
 */
const COMMON_TIME_ZONES: { value: string; label: string; offset: string }[] = [
  { value: 'UTC', label: 'UTC（协调世界时）', offset: '+00:00' },
  { value: 'Asia/Shanghai', label: '中国标准时间（北京）', offset: '+08:00' },
  { value: 'Asia/Hong_Kong', label: '香港时间', offset: '+08:00' },
  { value: 'Asia/Taipei', label: '台北时间', offset: '+08:00' },
  { value: 'Asia/Singapore', label: '新加坡时间', offset: '+08:00' },
  { value: 'Asia/Tokyo', label: '日本标准时间（东京）', offset: '+09:00' },
  { value: 'Asia/Seoul', label: '韩国标准时间（首尔）', offset: '+09:00' },
  { value: 'Asia/Kolkata', label: '印度标准时间（孟买）', offset: '+05:30' },
  { value: 'Asia/Dubai', label: '海湾标准时间（迪拜）', offset: '+04:00' },
  { value: 'Europe/London', label: '英国时间（伦敦）', offset: '+00:00/+01:00' },
  { value: 'Europe/Paris', label: '中欧时间（巴黎）', offset: '+01:00/+02:00' },
  { value: 'Europe/Berlin', label: '中欧时间（柏林）', offset: '+01:00/+02:00' },
  { value: 'America/New_York', label: '美国东部时间（纽约）', offset: '-05:00/-04:00' },
  { value: 'America/Chicago', label: '美国中部时间（芝加哥）', offset: '-06:00/-05:00' },
  { value: 'America/Los_Angeles', label: '美国西部时间（洛杉矶）', offset: '-08:00/-07:00' },
  { value: 'America/Sao_Paulo', label: '巴西时间（圣保罗）', offset: '-03:00' },
  { value: 'Australia/Sydney', label: '澳东时间（悉尼）', offset: '+10:00/+11:00' },
];

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
  const updateTimeZoneMutation = useUpdateTimeZone();
  const { data: billingData } = useBillingHistory(id);

  // 本地编辑态：用于时区下拉框选择未保存的值
  // 初始化为 tenant.timeZone，保存成功后被 useQueryClient invalidate 自动刷新
  const [editingTimeZone, setEditingTimeZone] = useState<string | null>(null);

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
      {/* 时区配置（v1.4）— 影响该租户的 Dashboard 趋势聚合 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            {t('admin.tenants.detail.timeZone')}
          </CardTitle>
          <CardDescription>{t('admin.tenants.detail.timeZoneDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timezone-select">{t('admin.tenants.detail.timeZone')}</Label>
            <Select
              value={editingTimeZone ?? tenant.timeZone ?? 'UTC'}
              onValueChange={(v) => setEditingTimeZone(v)}
            >
              <SelectTrigger id="timezone-select" className="w-full md:w-96">
                <SelectValue placeholder="UTC" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_TIME_ZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    <span className="font-mono text-xs text-muted-foreground mr-2">{tz.offset}</span>
                    {tz.label} <span className="text-muted-foreground">({tz.value})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t('admin.tenants.detail.timeZoneHint')}</p>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => {
                if (!id || !editingTimeZone || editingTimeZone === tenant.timeZone) return;
                updateTimeZoneMutation.mutate({ id, timeZone: editingTimeZone });
                setEditingTimeZone(null);
              }}
              disabled={
                updateTimeZoneMutation.isPending ||
                !editingTimeZone ||
                editingTimeZone === tenant.timeZone
              }
            >
              {updateTimeZoneMutation.isPending
                ? t('common.saving')
                : t('common.save')}
            </Button>
          </div>
          {updateTimeZoneMutation.isSuccess && (
            <p className="text-xs text-green-600">{t('admin.tenants.detail.timeZoneSaved')}</p>
          )}
        </CardContent>
      </Card>

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

      {/* 账单历史 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            账单历史
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!billingData?.items?.length ? (
            <p className="text-center py-4 text-sm text-muted-foreground">暂无账单记录</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>套餐</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>计费周期</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>备注</TableHead>
                  <TableHead>创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingData.items.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell><Badge variant="outline">{bill.plan}</Badge></TableCell>
                    <TableCell className="font-medium">
                      {bill.amount === 0 ? '免费' : `¥${bill.amount.toFixed(2)}`}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(bill.periodStart).toLocaleDateString()} ~ {new Date(bill.periodEnd).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={bill.status === 'Paid' ? 'default' : 'outline'}>
                        {bill.status === 'Paid' ? '已支付' : bill.status === 'Cancelled' ? '已取消' : '待支付'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{bill.remark ?? '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(bill.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
