import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Switch } from '../components/ui/switch';
import { useIntegrations, useUpdateIntegration } from '../hooks/useIntegration';
import { useSubscription, useChangePlan } from '../hooks/useSubscription';
import {
  useApprovalChains,
  useCreateApprovalChain,
  useDeleteApprovalChain,
} from '../hooks/useApprovals';
import type { ApprovalChainTemplate } from '../types';

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
function SubscriptionPanel() {
  const { t } = useTranslation();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
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

/**
 * 审批链配置面板
 *
 * 展示审批链模板列表，支持新增、删除模板，展开查看步骤详情。
 * 审批链模板定义了不同工单类型/优先级的审批流程步骤。
 */
function ApprovalChainSettings() {
  const { t } = useTranslation();
  const { data: chains, isLoading } = useApprovalChains();
  const createMutation = useCreateApprovalChain();
  const deleteMutation = useDeleteApprovalChain();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // 新建模板表单状态
  const [newName, setNewName] = useState('');
  const [newWorkOrderType, setNewWorkOrderType] = useState('');
  const [newPriority, setNewPriority] = useState('');
  const [newIsDefault, setNewIsDefault] = useState(false);
  const [newSteps, setNewSteps] = useState([
    { stepOrder: 1, role: 'maintenance_lead', specificApproverId: '', isRequired: true },
  ]);

  /** 工单类型对应的中文标签 */
  const typeLabels: Record<string, string> = {
    '': '通用',
    Corrective: '纠正性',
    Preventive: '预防性',
    Inspection: '巡检',
  };

  /** 优先级对应的中文标签 */
  const priorityLabels: Record<string, string> = {
    '': '通用',
    Urgent: '紧急',
    High: '高',
    Medium: '中',
    Low: '低',
  };

  /** 角色对应的中文标签 */
  const roleLabels: Record<string, string> = {
    system_admin: '系统管理员',
    maintenance_lead: '维修主管',
    technician: '技术员',
    operator: '操作员',
    viewer: '查看者',
  };

  /** 重置新建表单 */
  const resetForm = () => {
    setNewName('');
    setNewWorkOrderType('');
    setNewPriority('');
    setNewIsDefault(false);
    setNewSteps([{ stepOrder: 1, role: 'maintenance_lead', specificApproverId: '', isRequired: true }]);
  };

  /** 提交创建审批链模板 */
  const handleCreate = () => {
    if (!newName.trim()) return;
    createMutation.mutate(
      {
        name: newName,
        workOrderType: newWorkOrderType || undefined,
        priority: newPriority || undefined,
        isDefault: newIsDefault,
        steps: newSteps.map((s, i) => ({
          stepOrder: i + 1,
          role: s.role,
          specificApproverId: s.specificApproverId || undefined,
          isRequired: s.isRequired,
        })),
      },
      {
        onSuccess: () => {
          setCreateDialogOpen(false);
          resetForm();
        },
      },
    );
  };

  /** 新增审批步骤 */
  const addStep = () => {
    setNewSteps((prev) => [
      ...prev,
      { stepOrder: prev.length + 1, role: 'maintenance_lead', specificApproverId: '', isRequired: true },
    ]);
  };

  /** 删除审批步骤 */
  const removeStep = (index: number) => {
    setNewSteps((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepOrder: i + 1 })));
  };

  /** 更新审批步骤 */
  const updateStep = (index: number, field: string, value: string | boolean) => {
    setNewSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  };

  if (isLoading) {
    return <p className="py-8 text-center text-muted-foreground">{t('common.loading')}</p>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>审批链配置</CardTitle>
            <CardDescription>配置不同工单类型和优先级的审批流程步骤</CardDescription>
          </div>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            新增模板
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {chains && chains.length > 0 ? (
          <div className="space-y-3">
            {chains.map((chain: ApprovalChainTemplate) => (
              <div key={chain.id} className="rounded-lg border">
                {/* 模板头部行 */}
                <div
                  className="flex cursor-pointer items-center gap-3 p-3 hover:bg-muted/50"
                  onClick={() => setExpandedId(expandedId === chain.id ? null : chain.id)}
                >
                  {expandedId === chain.id ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium">{chain.name}</span>
                  <Badge variant="outline">
                    {typeLabels[chain.workOrderType ?? ''] ?? chain.workOrderType ?? '通用'}
                  </Badge>
                  <Badge variant="outline">
                    {priorityLabels[chain.priority ?? ''] ?? chain.priority ?? '通用'}
                  </Badge>
                  <Badge variant="outline">{chain.steps.length} 步</Badge>
                  {chain.isDefault && <Badge className="bg-blue-500/10 text-blue-500">默认</Badge>}
                  <Badge variant={chain.enabled ? 'outline' : 'secondary'}>
                    {chain.enabled ? '已启用' : '已禁用'}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="ml-auto h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(chain.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* 展开步骤详情 */}
                {expandedId === chain.id && (
                  <div className="border-t px-6 py-3">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>步骤顺序</TableHead>
                          <TableHead>审批角色</TableHead>
                          <TableHead>指定审批人</TableHead>
                          <TableHead>是否必填</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {chain.steps.map((step) => (
                          <TableRow key={step.id}>
                            <TableCell>{step.stepOrder}</TableCell>
                            <TableCell>{roleLabels[step.role] ?? step.role}</TableCell>
                            <TableCell>{step.specificApproverId ?? '-'}</TableCell>
                            <TableCell>
                              <Badge variant={step.isRequired ? 'outline' : 'secondary'}>
                                {step.isRequired ? '必填' : '可选'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">
            暂无审批链模板，点击"新增模板"创建第一个审批流程
          </p>
        )}
      </CardContent>

      {/* 新建审批链模板对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新增审批链模板</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>模板名称 *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="例如：高优先级工单审批流程"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>适用工单类型</Label>
                <Input
                  value={newWorkOrderType}
                  onChange={(e) => setNewWorkOrderType(e.target.value)}
                  placeholder="留空表示通用"
                />
              </div>
              <div className="space-y-2">
                <Label>适用优先级</Label>
                <Input
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  placeholder="留空表示通用"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newIsDefault}
                onCheckedChange={setNewIsDefault}
              />
              <Label>设为默认模板</Label>
            </div>

            <Separator />

            {/* 审批步骤配置 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>审批步骤</Label>
                <Button size="sm" variant="outline" onClick={addStep}>
                  <Plus className="mr-1 h-3 w-3" />
                  添加步骤
                </Button>
              </div>
              {newSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-2 rounded-md border p-2">
                  <span className="w-6 text-center text-sm font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                  <Input
                    value={step.role}
                    onChange={(e) => updateStep(index, 'role', e.target.value)}
                    placeholder="角色"
                    className="flex-1"
                  />
                  <Input
                    value={step.specificApproverId}
                    onChange={(e) => updateStep(index, 'specificApproverId', e.target.value)}
                    placeholder="指定审批人 ID"
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeStep(index)}
                    disabled={newSteps.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setCreateDialogOpen(false); resetForm(); }}>
                取消
              </Button>
              <Button onClick={handleCreate} disabled={!newName.trim() || createMutation.isPending}>
                创建
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/**
 * 外部集成配置面板
 *
 * 支持配置 Webhook 和钉钉机器人两种外部集成。
 * 每种集成可独立启用/禁用，并配置对应的连接参数。
 */
function IntegrationSettings() {
  const { t } = useTranslation();
  const { data: integrations } = useIntegrations();
  const updateMutation = useUpdateIntegration();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [dingtalkUrl, setDingtalkUrl] = useState('');
  const [dingtalkSecret, setDingtalkSecret] = useState('');

  const webhook = integrations?.webhook;
  const dingtalk = integrations?.dingtalk;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.integration')}</CardTitle>
        <CardDescription>{t('settings.integrationDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Webhook 集成 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Webhook</h3>
            <Button
              size="sm"
              variant={webhook?.enabled ? "destructive" : "default"}
              onClick={() => updateMutation.mutate({
                type: 'webhook',
                enabled: !webhook?.enabled,
                config: JSON.stringify({ url: webhookUrl, secret: '' }),
              })}
            >
              {webhook?.enabled ? t('integration.disable') : t('integration.enable')}
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <Input
              placeholder="https://your-server.com/webhook"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
          </div>
        </div>

        <Separator />

        {/* 钉钉集成 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{t('integration.dingtalk')}</h3>
            <Button
              size="sm"
              variant={dingtalk?.enabled ? "destructive" : "default"}
              onClick={() => updateMutation.mutate({
                type: 'dingtalk',
                enabled: !dingtalk?.enabled,
                config: JSON.stringify({ webhookUrl: dingtalkUrl, secret: dingtalkSecret, atMobiles: [] }),
              })}
            >
              {dingtalk?.enabled ? t('integration.disable') : t('integration.enable')}
            </Button>
          </div>
          <div className="space-y-2">
            <Label>{t('integration.webhookUrl')}</Label>
            <Input
              placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
              value={dingtalkUrl}
              onChange={(e) => setDingtalkUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('integration.signSecret')}</Label>
            <Input
              type="password"
              placeholder="SEC..."
              value={dingtalkSecret}
              onChange={(e) => setDingtalkSecret(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 系统设置页面
 *
 * 采用 Tab 布局，包含六个面板：
 * - 用户管理：管理用户账号（待后端 API 实现）
 * - 角色权限：展示 RBAC 权限矩阵（只读）
 * - LLM 配置：配置 AI 服务参数
 * - 系统参数：全局系统参数配置
 * - 外部集成：配置 Webhook / 钉钉等外部系统对接
 * - 订阅管理：查看用量、切换租户计划
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
          <TabsTrigger value="integration">{t('settings.integration')}</TabsTrigger>
          <TabsTrigger value="approval-chains">审批链配置</TabsTrigger>
          <TabsTrigger value="subscription">{t('settings.subscription')}</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
