import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { Device, CreateDeviceRequest } from '../../types';

/** 设备表单校验规则 */
const deviceSchema = z.object({
  deviceCode: z.string().min(1, '请输入设备编码'),
  name: z.string().min(1, '请输入设备名称'),
  deviceType: z.string().min(1, '请选择设备类型'),
  location: z.string().optional(),
});

type DeviceFormData = z.infer<typeof deviceSchema>;

/** 可选的设备类型列表 */
const deviceTypes = ['pump', 'motor', 'valve', 'sensor', 'plc', 'other'];

interface DeviceFormProps {
  /** 编辑模式时传入已有设备数据 */
  device?: Device;
  /** 表单提交回调 */
  onSubmit: (data: CreateDeviceRequest) => void;
  /** 取消回调 */
  onCancel: () => void;
  /** 是否正在提交中 */
  loading?: boolean;
}

/**
 * 设备表单组件
 *
 * 用于创建和编辑设备信息，集成了 React Hook Form + Zod 表单校验。
 * 支持设备编码、名称、类型和位置四个字段。
 */
export function DeviceForm({ device, onSubmit, onCancel, loading }: DeviceFormProps) {
  const { t } = useTranslation();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: device
      ? { deviceCode: device.deviceCode, name: device.name, deviceType: device.deviceType, location: device.location }
      : undefined,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* 设备编码 */}
      <div className="space-y-2">
        <Label>{t('device.deviceCode')}</Label>
        <Input {...register('deviceCode')} placeholder={t('device.deviceCode')} />
        {errors.deviceCode && <p className="text-sm text-destructive">{errors.deviceCode.message}</p>}
      </div>

      {/* 设备名称 */}
      <div className="space-y-2">
        <Label>{t('device.name')}</Label>
        <Input {...register('name')} placeholder={t('device.name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      {/* 设备类型 */}
      <div className="space-y-2">
        <Label>{t('device.type')}</Label>
        <Select defaultValue={device?.deviceType} onValueChange={(v) => setValue('deviceType', v)}>
          <SelectTrigger><SelectValue placeholder={t('device.type')} /></SelectTrigger>
          <SelectContent>
            {deviceTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.deviceType && <p className="text-sm text-destructive">{errors.deviceType.message}</p>}
      </div>

      {/* 安装位置 */}
      <div className="space-y-2">
        <Label>{t('device.location')}</Label>
        <Input {...register('location')} placeholder={t('device.location')} />
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={loading}>{loading ? t('common.loading') : t('common.save')}</Button>
      </div>
    </form>
  );
}
