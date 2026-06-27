import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, ChevronDown, ChevronRight, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Switch } from '../ui/switch';
import {
  useApprovalChains,
  useCreateApprovalChain,
  useUpdateApprovalChain,
  useDeleteApprovalChain,
} from '../../hooks/useApprovals';
import type { ApprovalChainTemplate } from '../../types';

/**
 * 审批链配置面板
 *
 * 展示审批链模板列表，支持新增、删除模板，展开查看步骤详情。
 * 审批链模板定义了不同工单类型/优先级的审批流程步骤。
 */
export function ApprovalChainSettings() {
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
