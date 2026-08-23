import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { CreateWorkOrderRequest } from '../../types';

/** 工单表单校验规则 */
const workOrderSchema = z.object({
  title: z.string().min(1, 'workorder.titleRequired'),
  type: z.string({ error: 'workorder.typeRequired' }).min(1, 'workorder.typeRequired'),
  priority: z.string({ error: 'workorder.priorityRequired' }).min(1, 'workorder.priorityRequired'),
  deviceId: z.string({ error: 'workorder.deviceRequired' }).min(1, 'workorder.deviceRequired'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

type WorkOrderFormData = z.infer<typeof workOrderSchema>;

interface WorkOrderFormProps {
  /** 表单提交回调；返回 Promise 以便页面展示失败反馈 */
  onSubmit: (data: CreateWorkOrderRequest) => void | Promise<void>;
  /** 取消回调 */
  onCancel: () => void;
  /** 是否正在提交中 */
  loading?: boolean;
  /** 可选设备列表 */
  devices?: Array<{ id: string; name: string }>;
}

/**
 * 工单新建表单组件
 *
 * 集成 React Hook Form + Zod 表单校验，
 * 支持标题、类型、优先级、设备、描述和截止日期字段。
 */
export function WorkOrderForm({ onSubmit, onCancel, loading, devices = [] }: WorkOrderFormProps) {
  const { t } = useTranslation();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderSchema),
  });

  /** 表单提交处理：把页面 mutation 的 Promise 交回 RHF，避免失败变成未处理拒绝。 */
  const handleFormSubmit = (data: WorkOrderFormData) => {
    return onSubmit({
      ...data,
      description: data.description ?? '',
      // 空字符串会导致后端 DateTime 反序列化失败，转为 undefined
      dueDate: data.dueDate || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* 标题 */}
      <div className="space-y-2">
        <Label htmlFor="workOrderTitle">{t('workorder.titleField')}</Label>
        <Input
          id="workOrderTitle"
          {...register('title')}
          placeholder={t('workorder.titlePlaceholder')}
          aria-invalid={errors.title ? 'true' : undefined}
          aria-describedby={errors.title ? 'workOrderTitle-error' : undefined}
        />
        {errors.title && <p id="workOrderTitle-error" role="alert" className="text-sm text-destructive">{t(errors.title.message!)}</p>}
      </div>

      {/* 类型和优先级 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="workOrderType">{t('workorder.type')}</Label>
          <Select onValueChange={(v) => { if (v != null) setValue('type', String(v)); }}>
            <SelectTrigger
              id="workOrderType"
              aria-invalid={errors.type ? 'true' : undefined}
              aria-describedby={errors.type ? 'workOrderType-error' : undefined}
            >
              <SelectValue placeholder={t('workorder.selectType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="corrective">{t('workorder.typeOptions.corrective')}</SelectItem>
              <SelectItem value="preventive">{t('workorder.typeOptions.preventive')}</SelectItem>
              <SelectItem value="predictive">{t('workorder.typeOptions.predictive')}</SelectItem>
              <SelectItem value="inspection">{t('workorder.typeOptions.inspection')}</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && <p id="workOrderType-error" role="alert" className="text-sm text-destructive">{t(errors.type.message!)}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="workOrderPriority">{t('workorder.priority')}</Label>
          <Select onValueChange={(v) => { if (v != null) setValue('priority', String(v)); }}>
            <SelectTrigger
              id="workOrderPriority"
              aria-invalid={errors.priority ? 'true' : undefined}
              aria-describedby={errors.priority ? 'workOrderPriority-error' : undefined}
            >
              <SelectValue placeholder={t('workorder.selectPriority')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">{t('alert.critical')}</SelectItem>
              <SelectItem value="high">{t('alert.high')}</SelectItem>
              <SelectItem value="normal">{t('alert.normal')}</SelectItem>
              <SelectItem value="low">{t('alert.low')}</SelectItem>
            </SelectContent>
          </Select>
          {errors.priority && <p id="workOrderPriority-error" role="alert" className="text-sm text-destructive">{t(errors.priority.message!)}</p>}
        </div>
      </div>

      {/* 关联设备 */}
      <div className="space-y-2">
        <Label htmlFor="workOrderDevice">{t('workorder.device')}</Label>
        <Select onValueChange={(v) => { if (v != null) setValue('deviceId', String(v)); }}>
          <SelectTrigger
            id="workOrderDevice"
            aria-invalid={errors.deviceId ? 'true' : undefined}
            aria-describedby={errors.deviceId ? 'workOrderDevice-error' : undefined}
          >
            <SelectValue placeholder={t('workorder.selectDevice')} />
          </SelectTrigger>
          <SelectContent>
            {devices.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.deviceId && <p id="workOrderDevice-error" role="alert" className="text-sm text-destructive">{t(errors.deviceId.message!)}</p>}
      </div>

      {/* 描述 */}
      <div className="space-y-2">
        <Label htmlFor="workOrderDescription">{t('workorder.description')}</Label>
        <Textarea id="workOrderDescription" {...register('description')} placeholder={t('workorder.descriptionPlaceholder')} rows={3} />
      </div>

      {/* 截止日期 */}
      <div className="space-y-2">
        <Label htmlFor="workOrderDueDate">{t('workorder.dueDate')}</Label>
        <Input id="workOrderDueDate" type="date" {...register('dueDate')} />
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={loading}>{loading ? t('common.loading') : t('common.save')}</Button>
      </div>
    </form>
  );
}
