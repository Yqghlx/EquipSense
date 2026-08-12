import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { usePushNotifications } from '../hooks/usePushNotifications';
import MfaSettingsPanel from '../components/settings/MfaSettingsPanel';
import { SubscriptionPanel } from '../components/settings/SubscriptionPanel';
import { ApprovalChainSettings } from '../components/settings/ApprovalChainSettings';
import { SystemInfoCard } from '../components/settings/SystemInfoCard';
import { UserManagementPanel } from '../components/settings/UserManagementPanel';
import { IntegrationSettings } from '../components/settings/IntegrationSettings';
import { NotificationPreferenceCard } from '../components/settings/NotificationPreferenceCard';

/** 系统角色列表 */
const roles = ['system_admin', 'maintenance_lead', 'technician', 'operator', 'viewer'];

/** 权限模块对应的翻译键映射 */
const permissionKeys: Record<string, string> = {
  'deviceManagement': 'settings.module.deviceManagement',
  'alertManagement': 'settings.module.alertManagement',
  'workOrderManagement': 'settings.module.workOrderManagement',
  'knowledgeBase': 'settings.module.knowledgeBase',
  'reports': 'settings.module.reports',
  'aiAnalysis': 'settings.module.aiAnalysis',
};

/** 权限值对应的翻译键，避免矩阵中直接展示内部中文标识。 */
const permissionValueKeys: Record<string, string> = {
  CRUD: 'settings.permission.crud',
  RW: 'settings.permission.rw',
  R: 'settings.permission.read',
  '-': 'settings.permission.none',
  'RW+配置': 'settings.permission.rwConfigure',
  'RW+派工验收': 'settings.permission.rwDispatchAccept',
  'RW+验证': 'settings.permission.rwVerify',
  'R+确认': 'settings.permission.readAcknowledge',
  'R+执行': 'settings.permission.readExecute',
  'R+查询': 'settings.permission.readQuery',
};

/** 权限模块列表（使用内部键） */
const permissions = ['deviceManagement', 'alertManagement', 'workOrderManagement', 'knowledgeBase', 'reports', 'aiAnalysis'];

/**
 * RBAC 权限矩阵（只读展示）
 *
 * 对应 CLAUDE.md 中定义的权限矩阵，五个角色 × 六个模块。
 */
const rbacMatrix: Record<string, Record<string, string>> = {
  system_admin:     { deviceManagement: 'CRUD', alertManagement: 'CRUD', workOrderManagement: 'CRUD', knowledgeBase: 'CRUD', reports: 'R', aiAnalysis: 'CRUD' },
  maintenance_lead: { deviceManagement: 'RW', alertManagement: 'RW+配置', workOrderManagement: 'RW+派工验收', knowledgeBase: 'RW+验证', reports: 'R', aiAnalysis: 'R' },
  technician:       { deviceManagement: 'R', alertManagement: 'R+确认', workOrderManagement: 'R+执行', knowledgeBase: 'R', reports: '-', aiAnalysis: 'R+查询' },
  operator:         { deviceManagement: 'R', alertManagement: 'R+确认', workOrderManagement: 'R', knowledgeBase: '-', reports: 'R', aiAnalysis: 'R+查询' },
  viewer:           { deviceManagement: 'R', alertManagement: 'R', workOrderManagement: 'R', knowledgeBase: 'R', reports: 'R', aiAnalysis: '-' },
};

/** 角色对应的翻译键 */
const roleLabelKeys: Record<string, string> = {
  system_admin: 'settings.role.systemAdmin',
  maintenance_lead: 'settings.role.maintenanceLead',
  technician: 'settings.role.technician',
  operator: 'settings.role.operator',
  viewer: 'settings.role.viewer',
};

/**
 * 系统设置页面
 *
 * 采用 Tab 布局，包含九个面板：
 * - 用户管理：管理用户账号
 * - 角色权限：展示 RBAC 权限矩阵（只读，内联实现）
 * - LLM 配置：配置 AI 服务参数（内联实现）
 * - 系统参数：全局系统参数配置（内联实现）+ 系统信息卡片
 * - 外部集成：配置 Webhook / 钉钉 / 飞书 / EAM 对接
 * - 审批链配置：配置工单审批流程模板
 * - 订阅管理：查看用量、切换租户计划
 * - 通知偏好：按类型和渠道自定义通知
 * - 安全与 MFA：多因素认证设置
 *
 * 注：各功能面板已拆分为独立组件（components/settings/），
 * 本页仅保留 RBAC 矩阵和 LLM/系统参数等纯展示型内联 Card。
 */
export default function SettingsPage() {
  const { t } = useTranslation();
  const { isSupported: pushSupported, isSubscribed, subscribe, unsubscribe, permission } = usePushNotifications();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

      <Tabs defaultValue="users" className="flex gap-6 items-start">
        <TabsList className="flex flex-col w-44 shrink-0 bg-muted/50 p-1 gap-0.5">
          <TabsTrigger value="users" className="w-full justify-start px-3">{t('settings.users')}</TabsTrigger>
          <TabsTrigger value="roles" className="w-full justify-start px-3">{t('settings.roles')}</TabsTrigger>
          <TabsTrigger value="llm" className="w-full justify-start px-3">{t('settings.llm')}</TabsTrigger>
          <TabsTrigger value="system" className="w-full justify-start px-3">{t('settings.system')}</TabsTrigger>
          <TabsTrigger value="integration" className="w-full justify-start px-3">{t('settings.integration')}</TabsTrigger>
          <TabsTrigger value="approval-chains" className="w-full justify-start px-3">{t('settings.approvalChains')}</TabsTrigger>
          <TabsTrigger value="subscription" className="w-full justify-start px-3">{t('settings.subscription')}</TabsTrigger>
          <TabsTrigger value="notifications" className="w-full justify-start px-3">{t('settings.notifications')}</TabsTrigger>
          <TabsTrigger value="security" className="w-full justify-start px-3">{t('settings.securityMfa')}</TabsTrigger>
        </TabsList>

        <div className="flex-1 min-w-0 space-y-4">

        {/* 用户管理 */}
        <TabsContent value="users">
          <UserManagementPanel />
        </TabsContent>

        {/* 角色权限矩阵（只读） */}
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.roles')}</CardTitle>
              <CardDescription>{t('settings.rbacMatrix')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('settings.permissionRole')}</TableHead>
                    {roles.map((role) => (
                      <TableHead key={role}>{t(roleLabelKeys[role])}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((perm) => (
                    <TableRow key={perm}>
                      <TableCell className="font-medium">{t(permissionKeys[perm])}</TableCell>
                      {roles.map((role) => {
                        const permissionValue = rbacMatrix[role][perm];

                        return (
                          <TableCell key={role}>
                            <Badge variant="outline" className={
                              permissionValue.includes('CRUD') ? 'border-green-500/30 text-green-500' :
                              permissionValue.includes('RW') ? 'border-blue-500/30 text-blue-500' :
                              permissionValue === 'R' ? 'border-gray-500/30 text-gray-500' :
                              'border-red-500/30 text-red-500'
                            }>
                              {t(permissionValueKeys[permissionValue] ?? permissionValue)}
                            </Badge>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LLM 配置 */}
        <TabsContent value="llm">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.llm')}</CardTitle>
              <CardDescription>{t('settings.configureLLM')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('settings.modelId')}</Label>
                  <Input defaultValue="glm-5" placeholder={t('settings.modelIdentifier')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('settings.endpoint')}</Label>
                  <Input defaultValue="https://dashscope.aliyuncs.com/api/v1" placeholder={t('settings.apiEndpoint')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('settings.timeout')}</Label>
                  <Input type="number" defaultValue="30" />
                </div>
                <div className="space-y-2">
                  <Label>{t('settings.maxTokens')}</Label>
                  <Input type="number" defaultValue="4096" />
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button>{t('common.save')}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 系统参数 */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.system')}</CardTitle>
              <CardDescription>{t('settings.globalSystemParameters')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('settings.alertCooldown')}</Label>
                  <Input type="number" defaultValue="300" />
                </div>
                <div className="space-y-2">
                  <Label>{t('settings.aggregationWindow')}</Label>
                  <Input type="number" defaultValue="30" />
                </div>
                <div className="space-y-2">
                  <Label>{t('settings.maxAggregationCount')}</Label>
                  <Input type="number" defaultValue="3" />
                </div>
                <div className="space-y-2">
                  <Label>{t('settings.dataRetentionDays')}</Label>
                  <Input type="number" defaultValue="90" />
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button>{t('common.save')}</Button>
              </div>
            </CardContent>
          </Card>

          {/* 系统信息（对应 GET /api/v1/system/info） */}
          <SystemInfoCard />
        </TabsContent>

        {/* 外部集成 */}
        <TabsContent value="integration">
          <IntegrationSettings />
        </TabsContent>

        {/* 审批链配置 */}
        <TabsContent value="approval-chains">
          <ApprovalChainSettings />
        </TabsContent>

        {/* 订阅管理 */}
        <TabsContent value="subscription">
          <SubscriptionPanel />
        </TabsContent>

        {/* 通知偏好设置 */}
        <TabsContent value="notifications">
          <NotificationPreferenceCard
            pushSupported={pushSupported}
            isSubscribed={isSubscribed}
            permission={permission}
            onSubscribe={subscribe}
            onUnsubscribe={unsubscribe}
          />
        </TabsContent>

        {/* 安全与 MFA 设置 */}
        <TabsContent value="security">
          <MfaSettingsPanel />
        </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
