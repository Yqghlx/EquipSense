import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { Plus, Trash2, ChevronDown, ChevronRight, Search, UserCog, Pencil } from 'lucide-react';
import api from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Switch } from '../components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useIntegrations, useUpdateIntegration, useTestIntegration } from '../hooks/useIntegration';
import { usePushNotifications } from '../hooks/usePushNotifications';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  type NotificationPreferences,
  type ChannelPreference,
} from '../hooks/useNotificationPreferences';
import { useSubscription, useChangePlan } from '../hooks/useSubscription';
import {
  useApprovalChains,
  useCreateApprovalChain,
  useUpdateApprovalChain,
  useDeleteApprovalChain,
} from '../hooks/useApprovals';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeactivateUser,
  useChangeUserRole,
  type UserItem,
  type CreateUserPayload,
  type UpdateUserPayload,
} from '../hooks/useUsers';
import { UserFormDialog } from '../components/user/UserFormDialog';
import MfaSettingsPanel from '../components/settings/MfaSettingsPanel';
import { formatDate } from '../lib/utils';
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
  const token = useAuthStore((s) => s.token);
  // 从 JWT 中解析 tenant_id
  const tenantId = (() => {
    if (!token) return undefined;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.tenant_id as string | undefined;
    } catch { return undefined; }
  })();
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
  const updateMutation = useUpdateApprovalChain();
  const deleteMutation = useDeleteApprovalChain();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 编辑状态：非 null 表示编辑模式
  const [editingChainId, setEditingChainId] = useState<string | null>(null);

  // 表单状态
  const [formName, setFormName] = useState('');
  const [formWorkOrderType, setFormWorkOrderType] = useState('');
  const [formPriority, setFormPriority] = useState('');
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formSteps, setFormSteps] = useState([
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

  /** 重置表单 */
  const resetForm = () => {
    setFormName('');
    setFormWorkOrderType('');
    setFormPriority('');
    setFormIsDefault(false);
    setFormSteps([{ stepOrder: 1, role: 'maintenance_lead', specificApproverId: '', isRequired: true }]);
    setEditingChainId(null);
  };

  /** 打开新建对话框 */
  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  /** 打开编辑对话框 */
  const openEdit = (chain: ApprovalChainTemplate) => {
    setEditingChainId(chain.id);
    setFormName(chain.name);
    setFormWorkOrderType(chain.workOrderType ?? '');
    setFormPriority(chain.priority ?? '');
    setFormIsDefault(chain.isDefault);
    setFormSteps(
      chain.steps.length > 0
        ? chain.steps.map((s) => ({
            stepOrder: s.stepOrder,
            role: s.role,
            specificApproverId: s.specificApproverId ?? '',
            isRequired: s.isRequired,
          }))
        : [{ stepOrder: 1, role: 'maintenance_lead', specificApproverId: '', isRequired: true }],
    );
    setDialogOpen(true);
  };

  /** 提交表单（创建或更新） */
  const handleSubmit = () => {
    if (!formName.trim()) return;
    const payload = {
      name: formName,
      workOrderType: formWorkOrderType || undefined,
      priority: formPriority || undefined,
      isDefault: formIsDefault,
      steps: formSteps.map((s, i) => ({
        stepOrder: i + 1,
        role: s.role,
        specificApproverId: s.specificApproverId || undefined,
        isRequired: s.isRequired,
      })),
    };

    if (editingChainId) {
      updateMutation.mutate({ id: editingChainId, ...payload }, {
        onSuccess: () => { setDialogOpen(false); resetForm(); },
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { setDialogOpen(false); resetForm(); },
      });
    }
  };

  /** 新增审批步骤 */
  const addStep = () => {
    setFormSteps((prev) => [
      ...prev,
      { stepOrder: prev.length + 1, role: 'maintenance_lead', specificApproverId: '', isRequired: true },
    ]);
  };

  /** 删除审批步骤 */
  const removeStep = (index: number) => {
    setFormSteps((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepOrder: i + 1 })));
  };

  /** 更新审批步骤 */
  const updateStep = (index: number, field: string, value: string | boolean) => {
    setFormSteps((prev) =>
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
          <Button size="sm" onClick={openCreate}>
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
                    className="ml-auto h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); openEdit(chain); }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
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
            {t('settings.noApprovalChain', '暂无审批链模板，点击"新增模板"创建第一个审批流程')}
          </p>
        )}
      </CardContent>

      {/* 新建/编辑审批链模板对话框 */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) { setDialogOpen(false); resetForm(); } else { setDialogOpen(true); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingChainId ? '编辑审批链模板' : '新增审批链模板'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>模板名称 *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t("settings.approvalChainNamePlaceholder", "例如：高优先级工单审批流程")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>适用工单类型</Label>
                <Input
                  value={formWorkOrderType}
                  onChange={(e) => setFormWorkOrderType(e.target.value)}
                  placeholder={t("settings.leaveBlankForAll", "留空表示通用")}
                />
              </div>
              <div className="space-y-2">
                <Label>适用优先级</Label>
                <Input
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value)}
                  placeholder={t("settings.leaveBlankForAll", "留空表示通用")}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formIsDefault}
                onCheckedChange={setFormIsDefault}
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
              {formSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-2 rounded-md border p-2">
                  <span className="w-6 text-center text-sm font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                  <Input
                    value={step.role}
                    onChange={(e) => updateStep(index, 'role', e.target.value)}
                    placeholder={t("settings.roleLabel", "角色")}
                    className="flex-1"
                  />
                  <Input
                    value={step.specificApproverId}
                    onChange={(e) => updateStep(index, 'specificApproverId', e.target.value)}
                    placeholder={t("settings.approverId", "指定审批人 ID")}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeStep(index)}
                    disabled={formSteps.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formName.trim() || createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) ? '保存中...' : (editingChainId ? '保存修改' : '创建')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/**
 * 系统信息卡片
 *
 * 调用 GET /api/v1/system/info 展示后端版本、运行环境和启动时间。
 */
function SystemInfoCard() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['system', 'info'],
    queryFn: async () => {
      const { data } = await api.get('/system/info');
      return data as { version: string; environment: string; uptime: string };
    },
    staleTime: 60_000,
  });

  /** 将 ISO 8601 duration 或 TimeSpan 字符串格式化为可读文本 */
  const formatUptime = (raw: string): string => {
    // 后端返回 .NET TimeSpan.ToString() 格式：
    //   - 不足 1 天：HH:MM:SS.fffffff（如 "01:23:45.6789000"）
    //   - 超过 1 天：d.HH:MM:SS.fffffff（如 "1.02:03:04.5670000"）
    // 关键区分：d.HH:MM:SS 中第一个 '.' 出现在第一个 ':' 之前；而 HH:MM:SS.fffffff 中 '.' 在最后一个 ':' 之后
    if (!raw || !/^\d/.test(raw)) return raw ?? '—';

    const firstDot = raw.indexOf('.');
    const firstColon = raw.indexOf(':');

    let days = 0;
    let timePart = raw;

    // 只有当 '.' 在 ':' 之前时，才把 '.' 前视为天数
    if (firstDot > 0 && firstColon > 0 && firstDot < firstColon) {
      days = parseInt(raw.substring(0, firstDot), 10);
      timePart = raw.substring(firstDot + 1);
    }

    // 去掉秒的小数部分（如果有）
    const cleaned = timePart.split('.')[0];
    const [h, m, s] = cleaned.split(':').map(x => parseInt(x, 10) || 0);

    if (days > 0) return `${days}天 ${h}小时 ${m}分钟`;
    if (h > 0) return `${h}小时 ${m}分钟`;
    if (m > 0) return `${m}分钟 ${s}秒`;
    return `${s}秒`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('settings.systemInfo')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        ) : data ? (
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{t('settings.version')}</p>
              <p className="font-medium">{data.version}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('settings.environment')}</p>
              <p className="font-medium">{data.environment}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('settings.uptime')}</p>
              <p className="font-medium">{formatUptime(data.uptime)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">—</p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 用户管理面板
 *
 * 展示用户列表，支持创建、编辑、停用用户，变更角色。
 * 对应后端 /api/v1/admin/users 端点。
 */
function UserManagementPanel() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<UserItem | null>(null);
  const [roleChangeTarget, setRoleChangeTarget] = useState<UserItem | null>(null);
  const [newRole, setNewRole] = useState('');

  const { data, isLoading } = useUsers({ page, pageSize: 20, keyword: keyword || undefined });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deactivateUser = useDeactivateUser();
  const changeUserRole = useChangeUserRole();

  /** 角色中文标签映射 */
  const roleLabels: Record<string, string> = {
    SystemAdmin: t('settings.role.systemAdmin'),
    MaintenanceLead: t('settings.role.maintenanceLead'),
    Technician: t('settings.role.technician'),
    Operator: t('settings.role.operator'),
    Viewer: t('settings.role.viewer'),
  };

  /** 搜索处理：按回车或点击搜索按钮触发 */
  const handleSearch = () => {
    setKeyword(searchInput);
    setPage(1);
  };

  /** 创建/编辑用户提交 */
  const handleFormSubmit = (payload: CreateUserPayload | UpdateUserPayload) => {
    if (editingUser) {
      updateUser.mutate({ id: editingUser.id, ...payload } as UpdateUserPayload & { id: string }, {
        onSuccess: () => setFormOpen(false),
      });
    } else {
      createUser.mutate(payload as CreateUserPayload, {
        onSuccess: () => setFormOpen(false),
      });
    }
  };

  /** 打开编辑对话框 */
  const openEdit = (user: UserItem) => {
    setEditingUser(user);
    setFormOpen(true);
  };

  /** 打开创建对话框 */
  const openCreate = () => {
    setEditingUser(null);
    setFormOpen(true);
  };

  /** 确认停用用户 */
  const confirmDeactivate = () => {
    if (deactivateTarget) {
      deactivateUser.mutate(deactivateTarget.id, {
        onSuccess: () => setDeactivateTarget(null),
      });
    }
  };

  /** 确认变更角色 */
  const confirmRoleChange = () => {
    if (roleChangeTarget && newRole) {
      changeUserRole.mutate({ id: roleChangeTarget.id, role: newRole }, {
        onSuccess: () => setRoleChangeTarget(null),
      });
    }
  };

  const isSubmitting = createUser.isPending || updateUser.isPending;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('settings.users')}</CardTitle>
              <CardDescription>{t('settings.manageUserAccounts')}</CardDescription>
            </div>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" />
              {t('settings.user.createUser')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 搜索栏 */}
          <div className="flex gap-2 mb-4">
            <Input
              className="max-w-xs"
              placeholder={t('settings.user.searchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            />
            <Button variant="outline" size="sm" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* 用户列表 */}
          {isLoading ? (
            <p className="py-8 text-center text-muted-foreground">{t('common.loading')}</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('settings.username')}</TableHead>
                    <TableHead>{t('settings.user.displayName')}</TableHead>
                    <TableHead>{t('settings.roleLabel')}</TableHead>
                    <TableHead>{t('settings.user.contact')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('common.createdAt')}</TableHead>
                    <TableHead>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        {t('common.noData')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.items.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.displayName || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{roleLabels[user.role] ?? user.role}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.email || user.phone || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? 'default' : 'secondary'}>
                            {user.isActive ? t('common.enabled') : t('common.disabled')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              onClick={() => openEdit(user)}
                              title={t('common.edit')}
                            >
                              <UserCog className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              onClick={() => { setRoleChangeTarget(user); setNewRole(user.role); }}
                              title={t('settings.user.changeRole')}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/></svg>
                            </Button>
                            {user.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-destructive hover:text-destructive"
                                onClick={() => setDeactivateTarget(user)}
                                title={t('settings.user.deactivate')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* 分页 */}
              {data && data.total > 20 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
                  <span>{t('common.totalItems', { count: data.total })}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      {t('common.previous')}
                    </Button>
                    <Button variant="outline" size="sm" disabled={page * 20 >= data.total} onClick={() => setPage(page + 1)}>
                      {t('common.next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 创建/编辑用户对话框 */}
      <UserFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        user={editingUser}
        onSubmit={handleFormSubmit}
        submitting={isSubmitting}
      />

      {/* 停用用户确认对话框 */}
      <Dialog open={!!deactivateTarget} onOpenChange={(v) => { if (!v) setDeactivateTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('settings.user.deactivate')}</DialogTitle>
            <DialogDescription>
              {t('settings.user.deactivateConfirm', { username: deactivateTarget?.username })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeactivateTarget(null)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={confirmDeactivate} disabled={deactivateUser.isPending}>
              {deactivateUser.isPending ? t('common.loading') : t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 变更角色对话框 */}
      <Dialog open={!!roleChangeTarget} onOpenChange={(v) => { if (!v) setRoleChangeTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('settings.user.changeRole')}</DialogTitle>
            <DialogDescription>
              {t('settings.user.changeRoleDesc', { username: roleChangeTarget?.username })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={newRole} onValueChange={(v) => { if (v) setNewRole(v); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRoleChangeTarget(null)}>{t('common.cancel')}</Button>
            <Button onClick={confirmRoleChange} disabled={changeUserRole.isPending || !newRole}>
              {changeUserRole.isPending ? t('common.loading') : t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * 外部集成配置面板
 *
 * 支持四种外部集成：
 * 1. 钉钉 — 自定义机器人 Webhook + ActionCard 消息
 * 2. 飞书 — 机器人 Webhook / API 消息 + 审批实例
 * 3. Webhook — 通用 HTTP POST + 变量插值 + 签名
 * 4. EAM — Maximo REST API 工单同步
 *
 * 每种集成可独立启用/禁用，配置连接参数，并测试连接。
 */
function IntegrationSettings() {
  const { t } = useTranslation();
  const { data: integrations, isLoading } = useIntegrations();
  const updateMutation = useUpdateIntegration();
  const testMutation = useTestIntegration();
  const [activeTab, setActiveTab] = useState('dingtalk');

  // 钉钉配置状态
  const [dingtalk, setDingtalk] = useState({
    webhookUrl: '', secret: '', messageType: 'actionCard', detailUrlTemplate: '',
  });

  // 飞书配置状态
  const [feishu, setFeishu] = useState({
    webhookUrl: '', appId: '', appSecret: '', approvalCode: '',
  });

  // Webhook 配置状态
  const [webhook, setWebhook] = useState({
    url: '', secret: '', bodyTemplate: '',
  });

  // EAM 配置状态
  const [eam, setEam] = useState({
    type: 'maximo', endpoint: '', apiKey: '', username: '', password: '',
  });

  /** 保存集成配置 */
  const handleSave = (type: string, config: object, enabled: boolean) => {
    updateMutation.mutate({
      type,
      enabled,
      config: JSON.stringify(config),
    });
  };

  /** 测试集成连接 */
  const handleTest = (type: string) => {
    testMutation.mutate(type);
  };

  if (isLoading) {
    return <p className="text-center text-muted-foreground py-8">{t('common.loading')}</p>;
  }

  const dingtalkEnabled = integrations?.dingtalk?.enabled ?? false;
  const feishuEnabled = integrations?.feishu?.enabled ?? false;
  const webhookEnabled = integrations?.webhook?.enabled ?? false;
  const eamEnabled = integrations?.eam?.enabled ?? false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.integration')}</CardTitle>
        <CardDescription>{t('settings.integrationDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="dingtalk">钉钉</TabsTrigger>
            <TabsTrigger value="feishu">飞书</TabsTrigger>
            <TabsTrigger value="webhook">Webhook</TabsTrigger>
            <TabsTrigger value="eam">EAM</TabsTrigger>
          </TabsList>

          {/* 钉钉集成 */}
          <TabsContent value="dingtalk" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={dingtalkEnabled ? "default" : "outline"}>
                  {dingtalkEnabled ? '已启用' : '未启用'}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTest('dingtalk')}
                  disabled={testMutation.isPending}
                >
                  {testMutation.isPending ? '测试中...' : '测试连接'}
                </Button>
                <Button
                  size="sm"
                  variant={dingtalkEnabled ? "destructive" : "default"}
                  onClick={() => handleSave('dingtalk', dingtalk, !dingtalkEnabled)}
                  disabled={updateMutation.isPending}
                >
                  {dingtalkEnabled ? '禁用' : '启用并保存'}
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Webhook URL *</Label>
                <Input
                  placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
                  value={dingtalk.webhookUrl}
                  onChange={(e) => setDingtalk({ ...dingtalk, webhookUrl: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>加签密钥（可选）</Label>
                <Input
                  type="password"
                  placeholder="SEC..."
                  value={dingtalk.secret}
                  onChange={(e) => setDingtalk({ ...dingtalk, secret: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>消息类型</Label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={dingtalk.messageType}
                  onChange={(e) => setDingtalk({ ...dingtalk, messageType: e.target.value })}
                >
                  <option value="actionCard">ActionCard（推荐）</option>
                  <option value="markdown">Markdown</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>工单详情页 URL 模板（可选）</Label>
                <Input
                  placeholder="https://equipsense.app/work-orders/{{workOrderId}}"
                  value={dingtalk.detailUrlTemplate}
                  onChange={(e) => setDingtalk({ ...dingtalk, detailUrlTemplate: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>

          {/* 飞书集成 */}
          <TabsContent value="feishu" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Badge variant={feishuEnabled ? "default" : "outline"}>
                {feishuEnabled ? '已启用' : '未启用'}
              </Badge>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTest('feishu')}
                  disabled={testMutation.isPending}
                >
                  {testMutation.isPending ? '测试中...' : '测试连接'}
                </Button>
                <Button
                  size="sm"
                  variant={feishuEnabled ? "destructive" : "default"}
                  onClick={() => handleSave('feishu', feishu, !feishuEnabled)}
                  disabled={updateMutation.isPending}
                >
                  {feishuEnabled ? '禁用' : '启用并保存'}
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>机器人 Webhook URL（推荐，简单模式）</Label>
                <Input
                  placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
                  value={feishu.webhookUrl}
                  onChange={(e) => setFeishu({ ...feishu, webhookUrl: e.target.value })}
                />
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">以下为 API 模式配置（如需审批实例则必填）：</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>App ID</Label>
                  <Input
                    placeholder="cli_xxxxxxxx"
                    value={feishu.appId}
                    onChange={(e) => setFeishu({ ...feishu, appId: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>App Secret</Label>
                  <Input
                    type="password"
                    value={feishu.appSecret}
                    onChange={(e) => setFeishu({ ...feishu, appSecret: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>审批定义 Code（可选，用于创建审批实例）</Label>
                <Input
                  placeholder={t("settings.getFromFeishu", "从飞书审批管理中获取")}
                  value={feishu.approvalCode}
                  onChange={(e) => setFeishu({ ...feishu, approvalCode: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>

          {/* Webhook 集成 */}
          <TabsContent value="webhook" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Badge variant={webhookEnabled ? "default" : "outline"}>
                {webhookEnabled ? '已启用' : '未启用'}
              </Badge>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTest('webhook')}
                  disabled={testMutation.isPending}
                >
                  {testMutation.isPending ? '测试中...' : '测试连接'}
                </Button>
                <Button
                  size="sm"
                  variant={webhookEnabled ? "destructive" : "default"}
                  onClick={() => handleSave('webhook', webhook, !webhookEnabled)}
                  disabled={updateMutation.isPending}
                >
                  {webhookEnabled ? '禁用' : '启用并保存'}
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Webhook URL *</Label>
                <Input
                  placeholder="https://your-server.com/api/webhook"
                  value={webhook.url}
                  onChange={(e) => setWebhook({ ...webhook, url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>签名密钥（可选，设置后自动添加 X-EquipSense-Signature 头）</Label>
                <Input
                  type="password"
                  value={webhook.secret}
                  onChange={(e) => setWebhook({ ...webhook, secret: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Body 模板（可选，支持变量插值）</Label>
                <p className="text-xs text-muted-foreground">
                  可用变量: {'{{workOrder.code}}'}, {'{{workOrder.title}}'}, {'{{workOrder.priority}}'}, {'{{workOrder.status}}'}, {'{{timestamp}}'}
                </p>
                <textarea
                  className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm font-mono"
                  placeholder={'{"event": "work_order.created", "code": "{{workOrder.code}}", "title": "{{workOrder.title}}"}'}
                  value={webhook.bodyTemplate}
                  onChange={(e) => setWebhook({ ...webhook, bodyTemplate: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>

          {/* EAM 集成 */}
          <TabsContent value="eam" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Badge variant={eamEnabled ? "default" : "outline"}>
                {eamEnabled ? '已启用' : '未启用'}
              </Badge>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTest('eam')}
                  disabled={testMutation.isPending}
                >
                  {testMutation.isPending ? '测试中...' : '测试连接'}
                </Button>
                <Button
                  size="sm"
                  variant={eamEnabled ? "destructive" : "default"}
                  onClick={() => handleSave('eam', eam, !eamEnabled)}
                  disabled={updateMutation.isPending}
                >
                  {eamEnabled ? '禁用' : '启用并保存'}
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>EAM 系统类型</Label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={eam.type}
                  onChange={(e) => setEam({ ...eam, type: e.target.value })}
                >
                  <option value="maximo">IBM Maximo</option>
                  <option value="sap_pm">SAP PM</option>
                  <option value="custom">自定义 REST API</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>REST API 端点 *</Label>
                <Input
                  placeholder="https://maximo.example.com/maximo/oslc"
                  value={eam.endpoint}
                  onChange={(e) => setEam({ ...eam, endpoint: e.target.value })}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={eam.apiKey}
                    onChange={(e) => setEam({ ...eam, apiKey: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>或 Basic Auth</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder={t("auth.username", "用户名")}
                      value={eam.username}
                      onChange={(e) => setEam({ ...eam, username: e.target.value })}
                    />
                    <Input
                      type="password"
                      placeholder={t("auth.password", "密码")}
                      value={eam.password}
                      onChange={(e) => setEam({ ...eam, password: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* 测试结果显示 */}
        {testMutation.data && (
          <div className={`mt-4 rounded-lg border p-3 ${testMutation.data.success ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
            <p className={`text-sm font-medium ${testMutation.data.success ? 'text-green-600' : 'text-red-600'}`}>
              {testMutation.data.message}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              耗时: {testMutation.data.durationMs}ms
            </p>
            {testMutation.data.details && (
              <pre className="mt-2 rounded bg-muted p-2 text-xs overflow-x-auto">
                {testMutation.data.details}
              </pre>
            )}
          </div>
        )}

        {testMutation.isError && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
            <p className="text-sm text-red-600">测试失败: {(testMutation.error as Error)?.message || '未知错误'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** 通知类型定义 */
const notifTypes = [
  { key: 'alert' as const, label: '告警通知', desc: '设备告警触发、告警状态变更' },
  { key: 'workorder' as const, label: '工单通知', desc: '工单创建、派工、状态变更' },
  { key: 'system' as const, label: '系统通知', desc: '系统配置变更、订阅到期提醒' },
];

/** 通知渠道定义 */
const channels = [
  { key: 'signalr' as const, label: '实时推送', desc: '页面内即时弹出通知' },
  { key: 'push' as const, label: '浏览器推送', desc: '浏览器未打开时推送通知' },
  { key: 'email' as const, label: '邮件通知', desc: '发送到注册邮箱（需配置 SMTP）' },
];

/**
 * 通知偏好设置卡片
 *
 * 以矩阵形式展示「通知类型 × 通知渠道」的开关组合，
 * 用户可按需启用/禁用每个组合。浏览器推送依赖 Web Push API，
 * 额外提供浏览器级别的订阅开关。
 */
function NotificationPreferenceCard({
  pushSupported,
  isSubscribed,
  permission,
  onSubscribe,
  onUnsubscribe,
}: {
  pushSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | 'default';
  onSubscribe: () => Promise<unknown>;
  onUnsubscribe: () => Promise<unknown>;
}) {
  const { data: prefs, isLoading } = useNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();

  /** 切换单个渠道开关 */
  const toggleChannel = (type: keyof NotificationPreferences, channel: keyof ChannelPreference) => {
    if (!prefs) return;
    const updated = { ...prefs };
    updated[type] = { ...updated[type], [channel]: !updated[type][channel] };
    updateMutation.mutate(updated);
  };

  /** 切换整行（通知类型）所有渠道 */
  const toggleRow = (type: keyof NotificationPreferences) => {
    if (!prefs) return;
    const current = prefs[type];
    const allOn = current.signalr && current.push && current.email;
    const updated = { ...prefs };
    updated[type] = { signalr: !allOn, push: !allOn, email: !allOn };
    updateMutation.mutate(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">通知偏好设置</CardTitle>
        <CardDescription>按通知类型和渠道自定义接收方式</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">加载中...</p>
        ) : prefs ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">通知类型</TableHead>
                {channels.map((ch) => (
                  <TableHead key={ch.key} className="text-center">{ch.label}</TableHead>
                ))}
                <TableHead className="w-[80px] text-center">全部</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifTypes.map((nt) => {
                const rowPrefs = prefs[nt.key];
                const allOn = rowPrefs.signalr && rowPrefs.push && rowPrefs.email;
                return (
                  <TableRow key={nt.key}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{nt.label}</p>
                        <p className="text-xs text-muted-foreground">{nt.desc}</p>
                      </div>
                    </TableCell>
                    {channels.map((ch) => {
                      const isPush = ch.key === 'push';
                      const disabled = isPush ? !pushSupported || permission === 'denied' : false;
                      return (
                        <TableCell key={ch.key} className="text-center">
                          <Switch
                            checked={rowPrefs[ch.key]}
                            disabled={disabled || updateMutation.isPending}
                            onCheckedChange={() => toggleChannel(nt.key, ch.key)}
                          />
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center">
                      <Switch
                        checked={allOn}
                        disabled={updateMutation.isPending}
                        onCheckedChange={() => toggleRow(nt.key)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : null}

        <Separator />

        {/* 浏览器推送订阅状态 */}
        <div>
          {!pushSupported ? (
            <p className="text-sm text-muted-foreground">当前浏览器不支持推送通知，浏览器推送渠道不可用</p>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">浏览器推送订阅</p>
                <p className="text-xs text-muted-foreground">
                  {isSubscribed ? '已订阅，浏览器推送渠道可正常工作' : '未订阅，请开启以启用浏览器推送'}
                </p>
              </div>
              <Switch
                checked={isSubscribed}
                disabled={permission === 'denied'}
                onCheckedChange={async (checked) => {
                  if (checked) {
                    await onSubscribe();
                  } else {
                    await onUnsubscribe();
                  }
                }}
              />
            </div>
          )}
          {permission === 'denied' && (
            <p className="text-xs text-orange-600 mt-1">
              通知权限已被拒绝，请在浏览器设置中手动开启
            </p>
          )}
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
          <TabsTrigger value="approval-chains" className="w-full justify-start px-3">审批链配置</TabsTrigger>
          <TabsTrigger value="subscription" className="w-full justify-start px-3">{t('settings.subscription')}</TabsTrigger>
          <TabsTrigger value="notifications" className="w-full justify-start px-3">通知偏好</TabsTrigger>
          <TabsTrigger value="security" className="w-full justify-start px-3">安全与 MFA</TabsTrigger>
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
