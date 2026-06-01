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
  title: z.string().min(1, '请输入标题'),
  type: z.string().min(1, '请选择类型'),
  priority: z.string().min(1, '请选择优先级'),
  deviceId: z.string().min(1, '请选择设备'),
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
        <Label>标题</Label>
        <Input {...register('title')} placeholder="工单标题" />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      {/* 类型和优先级 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>类型</Label>
          <Select onValueChange={(v) => { if (v != null) setValue('type', String(v)); }}>
            <SelectTrigger><SelectValue placeholder="选择类型" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="corrective">纠正性维护</SelectItem>
              <SelectItem value="preventive">预防性维护</SelectItem>
              <SelectItem value="predictive">预测性维护</SelectItem>
              <SelectItem value="inspection">巡检</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>优先级</Label>
          <Select onValueChange={(v) => { if (v != null) setValue('priority', String(v)); }}>
            <SelectTrigger><SelectValue placeholder="选择优先级" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">紧急</SelectItem>
              <SelectItem value="high">高</SelectItem>
              <SelectItem value="normal">普通</SelectItem>
              <SelectItem value="low">低</SelectItem>
            </SelectContent>
          </Select>
          {errors.priority && <p className="text-sm text-destructive">{errors.priority.message}</p>}
        </div>
      </div>

      {/* 关联设备 */}
      <div className="space-y-2">
        <Label>设备</Label>
        <Select onValueChange={(v) => { if (v != null) setValue('deviceId', String(v)); }}>
          <SelectTrigger><SelectValue placeholder="选择设备" /></SelectTrigger>
          <SelectContent>
            {devices.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.deviceId && <p className="text-sm text-destructive">{errors.deviceId.message}</p>}
      </div>

      {/* 描述 */}
      <div className="space-y-2">
        <Label>描述</Label>
        <Textarea {...register('description')} placeholder="问题描述..." rows={3} />
      </div>

      {/* 截止日期 */}
      <div className="space-y-2">
        <Label>截止日期</Label>
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
