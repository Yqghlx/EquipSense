import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';

/** 系统角色列表 */
const roles = ['system_admin', 'maintenance_lead', 'technician', 'operator', 'viewer'];

/** 权限模块列表 */
/** 权限模块对应的翻译键映射 */
const permissionKeys: Record<string, string> = {
  'deviceManagement': 'settings.module.deviceManagement',
  'alertManagement': 'settings.module.alertManagement',
  'workOrderManagement': 'settings.module.workOrderManagement',
  'knowledgeBase': 'settings.module.knowledgeBase',
  'reports': 'settings.module.reports',
  'aiAnalysis': 'settings.module.aiAnalysis',
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
 * 采用 Tab 布局，包含四个面板：
 * - 用户管理：管理用户账号（待后端 API 实现）
 * - 角色权限：展示 RBAC 权限矩阵（只读）
 * - LLM 配置：配置 AI 服务参数
 * - 系统参数：全局系统参数配置
 */
export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">{t('settings.users')}</TabsTrigger>
          <TabsTrigger value="roles">{t('settings.roles')}</TabsTrigger>
          <TabsTrigger value="llm">{t('settings.llm')}</TabsTrigger>
          <TabsTrigger value="system">{t('settings.system')}</TabsTrigger>
        </TabsList>

        {/* 用户管理 */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.users')}</CardTitle>
              <CardDescription>{t('settings.manageUserAccounts')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('settings.username')}</TableHead>
                    <TableHead>{t('settings.role')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      {t('settings.userManagementNote')}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
                      {roles.map((role) => (
                        <TableCell key={role}>
                          <Badge variant="outline" className={
                            rbacMatrix[role][perm].includes('CRUD') ? 'border-green-500/30 text-green-500' :
                            rbacMatrix[role][perm].includes('RW') ? 'border-blue-500/30 text-blue-500' :
                            rbacMatrix[role][perm] === 'R' ? 'border-gray-500/30 text-gray-500' :
                            'border-red-500/30 text-red-500'
                          }>
                            {rbacMatrix[role][perm]}
                          </Badge>
                        </TableCell>
                      ))}
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
                  <Label>Endpoint</Label>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
