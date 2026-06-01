import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
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
import { useAlertRules, useCreateAlertRule, useUpdateAlertRule, useDeleteAlertRule } from '../hooks/useAlertRules';
import type { CreateAlertRuleRequest, AlertRule } from '../types';

/** 告警规则表单校验规则 */
const ruleSchema = z.object({
  name: z.string().min(1, '请输入规则名称'),
  metric: z.string().min(1, '请输入指标名称'),
  ruleType: z.enum(['threshold', 'composite', 'baseline']),
  operator: z.string().optional(),
  threshold: z.number().optional(),
  baselineStddevMultiplier: z.number().optional(),
  severity: z.enum(['critical', 'high', 'normal', 'low']),
  cooldownSeconds: z.number().min(0),
  autoCreateWorkorder: z.boolean(),
  enabled: z.boolean(),
});

type RuleFormData = z.infer<typeof ruleSchema>;

/**
 * 告警规则页
 *
 * 功能：搜索、新建/编辑/删除规则，支持阈值/组合/基线三种规则类型的动态表单。
 */
export default function AlertRulesPage() {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | undefined>();

  const { data, isLoading } = useAlertRules({ page: 1, pageSize: 20, keyword: keyword || undefined });
  const createRule = useCreateAlertRule();
  const updateRule = useUpdateAlertRule();
  const deleteRule = useDeleteAlertRule();

  return (
    <div className="space-y-4">
      {/* 页头：标题 + 新建按钮 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav.alertRules')}</h1>
        <Button onClick={() => { setEditingRule(undefined); setDialogOpen(true); }}>
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
              <TableHead>名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>指标</TableHead>
              <TableHead>条件</TableHead>
              <TableHead>级别</TableHead>
              <TableHead>状态</TableHead>
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
                    {rule.ruleType === 'composite' && '多条件'}
                  </TableCell>
                  <TableCell><SeverityBadge severity={rule.severity} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={rule.enabled} disabled />
                      <span className="text-sm">{rule.enabled ? '启用' : '禁用'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingRule(rule); setDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { if (window.confirm(t('common.confirm') + '?')) deleteRule.mutate(rule.id); }}>
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
 * 阈值规则显示运算符和阈值输入，基线规则显示标准差倍数。
 */
function RuleDialog({ open, rule, onClose, onSubmit, loading }: RuleDialogProps) {
  const { t } = useTranslation();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RuleFormData>({
    resolver: zodResolver(ruleSchema),
    defaultValues: rule
      ? {
          name: rule.name, metric: rule.metric, ruleType: rule.ruleType as 'threshold',
          operator: rule.operator ?? '', threshold: rule.threshold,
          baselineStddevMultiplier: rule.baselineStddevMultiplier,
          severity: rule.severity as 'normal', cooldownSeconds: rule.cooldownSeconds,
          autoCreateWorkorder: rule.autoCreateWorkorder, enabled: rule.enabled,
        }
      : { ruleType: 'threshold', severity: 'normal', cooldownSeconds: 300, autoCreateWorkorder: false, enabled: true },
  });

  const ruleType = watch('ruleType');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{rule ? t('common.edit') : t('common.create')}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((data) => onSubmit(data as CreateAlertRuleRequest))} className="space-y-4">
          {/* 规则名称 */}
          <div className="space-y-2">
            <Label>名称</Label>
            <Input {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          {/* 规则类型 + 指标 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>规则类型</Label>
              <Select value={ruleType} onValueChange={(v) => { if (v) setValue('ruleType', v as RuleFormData['ruleType']); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="threshold">阈值</SelectItem>
                  <SelectItem value="composite">组合</SelectItem>
                  <SelectItem value="baseline">基线</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>指标</Label>
              <Input {...register('metric')} />
            </div>
          </div>

          {/* 阈值类型：显示运算符 + 阈值 */}
          {ruleType === 'threshold' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>运算符</Label>
                <Select onValueChange={(v) => { if (v != null) setValue('operator', String(v)); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GreaterThan">大于</SelectItem>
                    <SelectItem value="LessThan">小于</SelectItem>
                    <SelectItem value="GreaterThanOrEqual">大于等于</SelectItem>
                    <SelectItem value="LessThanOrEqual">小于等于</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>阈值</Label>
                <Input type="number" {...register('threshold', { valueAsNumber: true })} />
              </div>
            </div>
          )}

          {/* 基线类型：显示标准差倍数 */}
          {ruleType === 'baseline' && (
            <div className="space-y-2">
              <Label>标准差倍数</Label>
              <Input type="number" step="0.5" {...register('baselineStddevMultiplier', { valueAsNumber: true })} />
            </div>
          )}

          {/* 告警级别 + 冷却时间 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>告警级别</Label>
              <Select value={watch('severity')} onValueChange={(v) => { if (v) setValue('severity', v as RuleFormData['severity']); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">紧急</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="normal">普通</SelectItem>
                  <SelectItem value="low">低</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>冷却时间（秒）</Label>
              <Input type="number" {...register('cooldownSeconds', { valueAsNumber: true })} />
            </div>
          </div>

          {/* 开关：自动创建工单 + 启用 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={watch('autoCreateWorkorder')} onCheckedChange={(v) => setValue('autoCreateWorkorder', v)} />
              <Label className="text-sm">自动创建工单</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={watch('enabled')} onCheckedChange={(v) => setValue('enabled', v)} />
              <Label className="text-sm">启用</Label>
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
