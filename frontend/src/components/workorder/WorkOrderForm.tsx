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
  type: z.string().min(1, 'workorder.typeRequired'),
  priority: z.string().min(1, 'workorder.priorityRequired'),
  deviceId: z.string().min(1, 'workorder.deviceRequired'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

type WorkOrderFormData = z.infer<typeof workOrderSchema>;

interface WorkOrderFormProps {
  /** 表单提交回调 */
  onSubmit: (data: CreateWorkOrderRequest) => void;
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

  /** 表单提交处理 */
  const handleFormSubmit = (data: WorkOrderFormData) => {
    onSubmit({
      ...data,
      description: data.description ?? '',
      dueDate: data.dueDate,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* 标题 */}
      <div className="space-y-2">
        <Label>{t('workorder.titleField')}</Label>
        <Input {...register('title')} placeholder={t('workorder.titlePlaceholder')} />
        {errors.title && <p className="text-sm text-destructive">{t(errors.title.message!)}</p>}
      </div>

      {/* 类型和优先级 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('workorder.type')}</Label>
          <Select onValueChange={(v) => { if (v != null) setValue('type', String(v)); }}>
            <SelectTrigger><SelectValue placeholder={t('workorder.selectType')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="corrective">{t('workorder.typeOptions.corrective')}</SelectItem>
              <SelectItem value="preventive">{t('workorder.typeOptions.preventive')}</SelectItem>
              <SelectItem value="predictive">{t('workorder.typeOptions.predictive')}</SelectItem>
              <SelectItem value="inspection">{t('workorder.typeOptions.inspection')}</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && <p className="text-sm text-destructive">{t(errors.type.message!)}</p>}
        </div>
        <div className="space-y-2">
          <Label>{t('workorder.priority')}</Label>
          <Select onValueChange={(v) => { if (v != null) setValue('priority', String(v)); }}>
            <SelectTrigger><SelectValue placeholder={t('workorder.selectPriority')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">{t('alert.critical')}</SelectItem>
              <SelectItem value="high">{t('alert.high')}</SelectItem>
              <SelectItem value="normal">{t('alert.normal')}</SelectItem>
              <SelectItem value="low">{t('alert.low')}</SelectItem>
            </SelectContent>
          </Select>
          {errors.priority && <p className="text-sm text-destructive">{t(errors.priority.message!)}</p>}
        </div>
      </div>

      {/* 关联设备 */}
      <div className="space-y-2">
        <Label>{t('workorder.device')}</Label>
        <Select onValueChange={(v) => { if (v != null) setValue('deviceId', String(v)); }}>
          <SelectTrigger><SelectValue placeholder={t('workorder.selectDevice')} /></SelectTrigger>
          <SelectContent>
            {devices.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.deviceId && <p className="text-sm text-destructive">{t(errors.deviceId.message!)}</p>}
      </div>

      {/* 描述 */}
      <div className="space-y-2">
        <Label>{t('workorder.description')}</Label>
        <Textarea {...register('description')} placeholder={t('workorder.descriptionPlaceholder')} rows={3} />
      </div>

      {/* 截止日期 */}
      <div className="space-y-2">
        <Label>{t('workorder.dueDate')}</Label>
        <Input type="date" {...register('dueDate')} />
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={loading}>{loading ? t('common.loading') : t('common.save')}</Button>
      </div>
    </form>
  );
}
