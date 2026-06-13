import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Search, X, Calculator } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { SeverityBadge } from '../components/alert/SeverityBadge';
import { Badge } from '../components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAlertRules, useCreateAlertRule, useUpdateAlertRule, useDeleteAlertRule, useToggleAlertRule } from '../hooks/useAlertRules';
import { usePermission } from '../hooks/usePermission';
import type { CreateAlertRuleRequest, AlertRule } from '../types';

/** 组合规则条件项 */
type ConditionItem = {
  metric: string;
  operator: string;
  threshold: number;
};

/** 告警规则表单数据类型 */
type RuleFormData = {
  name: string;
  metric: string;
  ruleType: 'threshold' | 'composite' | 'baseline';
  operator?: string;
  threshold?: number;
  baselineStddevMultiplier?: number;
  baselineWindow?: number;
  baselineSensitivity?: number;
  conditions?: ConditionItem[];
  logicOperator?: 'AND' | 'OR';
  severity: 'critical' | 'high' | 'normal' | 'low';
  cooldownSeconds: number;
  autoCreateWorkorder: boolean;
  enabled: boolean;
};

/**
 * 告警规则页
 *
 * 功能：搜索、新建/编辑/删除规则，支持阈值/组合/基线三种规则类型的动态表单。
 */
export default function AlertRulesPage() {
  const { t } = useTranslation();
  const perm = usePermission('alert');
  const [keyword, setKeyword] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | undefined>();

  const { data, isLoading } = useAlertRules({ page: 1, pageSize: 20, keyword: keyword || undefined });
  const createRule = useCreateAlertRule();
  const updateRule = useUpdateAlertRule();
  const deleteRule = useDeleteAlertRule();
  const toggleRule = useToggleAlertRule();

  return (
    <div className="space-y-4">
      {/* 页头：标题 + 新建按钮 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav.alertRules')}</h1>
        <Button onClick={() => { setEditingRule(undefined); setDialogOpen(true); }} disabled={!perm.canCreate}>
          <Plus className="mr-2 h-4 w-4" />{t('common.create')}
        </Button>
      </div>

      {/* 搜索栏 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9 max-w-sm" placeholder={t('common.search') + '...'} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      </div>

      {/* 规则列表表格或加载状态 */}
      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">{t('common.loading')}</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common.name')}</TableHead>
              <TableHead>{t('common.type')}</TableHead>
              <TableHead>{t('alertrule.metric')}</TableHead>
              <TableHead>{t('alertrule.condition')}</TableHead>
              <TableHead>{t('alertrule.level')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead>{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">{t('common.noData')}</TableCell></TableRow>
            ) : (
              data?.items.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell><Badge variant="outline">{rule.ruleType}</Badge></TableCell>
                  <TableCell>{rule.metric}</TableCell>
                  <TableCell className="text-sm">
                    {rule.ruleType === 'threshold' && `${rule.operator} ${rule.threshold}`}
                    {rule.ruleType === 'baseline' && `${rule.baselineStddevMultiplier}σ`}
                    {rule.ruleType === 'composite' && t('alertrule.multipleConditions')}
                  </TableCell>
                  <TableCell><SeverityBadge severity={rule.severity} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.enabled}
                        disabled={!perm.canEdit || toggleRule.isPending}
                        onCheckedChange={() => toggleRule.mutate(rule.id)}
                      />
                      <span className="text-sm">{rule.enabled ? t('common.enabled') : t('common.disabled')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingRule(rule); setDialogOpen(true); }} disabled={!perm.canEdit}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { if (window.confirm(t('common.confirm') + '?')) deleteRule.mutate(rule.id); }} disabled={!perm.canDelete}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* 新建/编辑规则对话框 */}
      <RuleDialog
        open={dialogOpen}
        rule={editingRule}
        onClose={() => { setDialogOpen(false); setEditingRule(undefined); }}
        onSubmit={async (req) => {
          if (editingRule) {
            await updateRule.mutateAsync({ ...req, id: editingRule.id });
          } else {
            await createRule.mutateAsync(req);
          }
          setDialogOpen(false);
          setEditingRule(undefined);
        }}
        loading={createRule.isPending || updateRule.isPending}
      />
    </div>
  );
}

/** 规则对话框属性 */
interface RuleDialogProps {
  open: boolean;
  rule?: AlertRule;
  onClose: () => void;
  onSubmit: (req: CreateAlertRuleRequest) => Promise<void>;
  loading?: boolean;
}

/**
 * 规则新建/编辑对话框
 *
 * 根据规则类型（阈值/组合/基线）动态显示不同的条件字段。
 * 阈值规则显示运算符和阈值输入，基线规则显示标准差倍数和时间窗口。
 */
function RuleDialog({ open, rule, onClose, onSubmit, loading }: RuleDialogProps) {
  const { t } = useTranslation();
  const [conditions, setConditions] = useState<ConditionItem[]>(
    rule?.conditions ? (typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : []) : [{ metric: 'temperature', operator: 'GreaterThan', threshold: 80 }]
  );
  const [logicOperator, setLogicOperator] = useState<'AND' | 'OR'>(
    (rule?.logicOperator as 'AND' | 'OR') ?? 'AND'
  );

  /** 告警规则表单校验规则（放在组件内部以使用 t() 函数） */
  const ruleSchema = z.object({
    name: z.string().min(1, t('alertrule.nameRequired')),
    metric: z.string().min(1, t('alertrule.metricRequired')),
    ruleType: z.enum(['threshold', 'composite', 'baseline']),
    operator: z.string().optional(),
    threshold: z.number().optional(),
    baselineStddevMultiplier: z.number().optional(),
    baselineWindow: z.number().optional(),
    baselineSensitivity: z.number().optional(),
    severity: z.enum(['critical', 'high', 'normal', 'low']),
    cooldownSeconds: z.number().min(0),
    autoCreateWorkorder: z.boolean(),
    enabled: z.boolean(),
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RuleFormData>({
    resolver: zodResolver(ruleSchema),
    defaultValues: rule
      ? {
          name: rule.name, metric: rule.metric, ruleType: rule.ruleType as 'threshold',
          operator: rule.operator ?? '', threshold: rule.threshold,
          baselineStddevMultiplier: rule.baselineStddevMultiplier,
          baselineWindow: (rule?.baselineWindow ?? 24) as number,
          baselineSensitivity: (rule?.baselineSensitivity ?? 2) as number,
          severity: rule.severity as 'normal', cooldownSeconds: rule.cooldownSeconds,
          autoCreateWorkorder: rule.autoCreateWorkorder, enabled: rule.enabled,
        }
      : { ruleType: 'threshold', severity: 'normal', cooldownSeconds: 300, autoCreateWorkorder: false, enabled: true, baselineWindow: 24, baselineSensitivity: 2 },
  });

  const ruleType = watch('ruleType');

  /** 添加新条件 */
  const addCondition = () => {
    setConditions([...conditions, { metric: 'vibration', operator: 'GreaterThan', threshold: 5 }]);
  };

  /** 删除条件 */
  const removeCondition = (index: number) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((_, i) => i !== index));
    }
  };

  /** 更新条件 */
  const updateCondition = (index: number, field: keyof ConditionItem, value: string | number) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    setConditions(updated);
  };

  /** 自动计算基线（模拟操作） */
  const calculateBaseline = () => {
    // 模拟计算，实际应调用后端 API
    setValue('baselineStddevMultiplier', 2.5);
    setValue('baselineWindow', 48);
  };

  /** 提交表单时包含组合规则的条件数据 */
  const handleFormSubmit = (data: RuleFormData) => {
    const req: CreateAlertRuleRequest = {
      ...data,
      // 组合规则需要包含条件和逻辑运算符（转为 JSON 字符串）
      conditions: ruleType === 'composite' ? conditions : undefined,
      logicOperator: ruleType === 'composite' ? logicOperator : undefined,
    };
    onSubmit(req);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{rule ? t('common.edit') : t('common.create')}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* 规则名称 */}
          <div className="space-y-2">
            <Label>{t('common.name')}</Label>
            <Input {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          {/* 规则类型 + 指标 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('alertrule.ruleType')}</Label>
              <Select value={ruleType} onValueChange={(v) => { if (v) setValue('ruleType', v as RuleFormData['ruleType']); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="threshold">{t('alertrule.threshold')}</SelectItem>
                  <SelectItem value="composite">{t('alertrule.composite')}</SelectItem>
                  <SelectItem value="baseline">{t('alertrule.baseline')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('alertrule.metric')}</Label>
              <Input {...register('metric')} />
            </div>
          </div>

          {/* 阈值类型：显示运算符 + 阈值 */}
          {ruleType === 'threshold' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('alertrule.operator')}</Label>
                <Select onValueChange={(v) => { if (v != null) setValue('operator', String(v)); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GreaterThan">{t('operator.greaterThan')}</SelectItem>
                    <SelectItem value="LessThan">{t('operator.lessThan')}</SelectItem>
                    <SelectItem value="GreaterThanOrEqual">{t('operator.greaterThanOrEqual')}</SelectItem>
                    <SelectItem value="LessThanOrEqual">{t('operator.lessThanOrEqual')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('alertrule.threshold')}</Label>
                <Input type="number" {...register('threshold', { valueAsNumber: true })} />
              </div>
            </div>
          )}

          {/* 组合类型：显示条件列表 */}
          {ruleType === 'composite' && (
            <div className="space-y-3">
              {/* 逻辑运算符切换 */}
              <div className="flex items-center gap-2">
                <Label className="text-sm">{t('alertrule.logicOperator')}</Label>
                <Select value={logicOperator} onValueChange={(v) => setLogicOperator(v as 'AND' | 'OR')}>
                  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">{t('alertrule.and')}</SelectItem>
                    <SelectItem value="OR">{t('alertrule.or')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 条件列表 */}
              <div className="space-y-2">
                {conditions.map((cond, index) => (
                  <div key={index} className="flex items-center gap-2 rounded border p-2">
                    {/* 指标 */}
                    <Input
                      className="w-24"
                      placeholder={t('alertrule.metric')}
                      value={cond.metric}
                      onChange={(e) => updateCondition(index, 'metric', e.target.value)}
                    />
                    {/* 运算符 */}
                    <Select value={cond.operator} onValueChange={(v) => { if (v) updateCondition(index, 'operator', v); }}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GreaterThan">{t('operator.greaterThan')}</SelectItem>
                        <SelectItem value="LessThan">{t('operator.lessThan')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* 阈值 */}
                    <Input
                      type="number"
                      className="w-20"
                      placeholder={t('alertrule.threshold')}
                      value={cond.threshold}
                      onChange={(e) => updateCondition(index, 'threshold', Number(e.target.value) || 0)}
                    />
                    {/* 删除按钮 */}
                    {conditions.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeCondition(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* 添加条件按钮 */}
              <Button variant="outline" size="sm" onClick={addCondition}>
                <Plus className="mr-1 h-3 w-3" />{t('alertrule.addCondition')}
              </Button>
            </div>
          )}

          {/* 基线类型：显示标准差倍数 + 时间窗口 */}
          {ruleType === 'baseline' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('alertrule.stddevMultiplier')}</Label>
                  <Input type="number" step="0.5" {...register('baselineStddevMultiplier', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>{t('alertrule.baselineWindow')}</Label>
                  <Input type="number" {...register('baselineWindow', { valueAsNumber: true })} />
                </div>
              </div>
              {/* 自动计算基线按钮 */}
              <Button variant="outline" size="sm" onClick={calculateBaseline}>
                <Calculator className="mr-1 h-3 w-3" />{t('alertrule.calculateBaseline')}
              </Button>
            </div>
          )}

          {/* 告警级别 + 冷却时间 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('alertrule.alertLevel')}</Label>
              <Select value={watch('severity')} onValueChange={(v) => { if (v) setValue('severity', v as RuleFormData['severity']); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">{t('alert.critical')}</SelectItem>
                  <SelectItem value="high">{t('alert.high')}</SelectItem>
                  <SelectItem value="normal">{t('alert.normal')}</SelectItem>
                  <SelectItem value="low">{t('alert.low')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('alertrule.cooldownSeconds')}</Label>
              <Input type="number" {...register('cooldownSeconds', { valueAsNumber: true })} />
            </div>
          </div>

          {/* 开关：自动创建工单 + 启用 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={watch('autoCreateWorkorder')} onCheckedChange={(v) => setValue('autoCreateWorkorder', v)} />
              <Label className="text-sm">{t('alertrule.autoCreateWorkOrder')}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={watch('enabled')} onCheckedChange={(v) => setValue('enabled', v)} />
              <Label className="text-sm">{t('common.enabled')}</Label>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={loading}>{loading ? t('common.loading') : t('common.save')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}