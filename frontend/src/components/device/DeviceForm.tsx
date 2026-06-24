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
  deviceCode: z.string().min(1, 'device.deviceCodeRequired'),
  name: z.string().min(1, 'device.nameRequired'),
  type: z.string().min(1, 'device.typeRequired'),
  manufacturer: z.string().optional(),
  criticality: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  installDate: z.string().optional(),
  gatewayId: z.string().optional(),
  downtimeCostPerHour: z.number().optional(),
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
 * 用于创建和编辑设备档案信息，集成 React Hook Form + Zod 表单校验。
 * 覆盖设备编码、名称、类型、关键等级、型号、制造商、序列号、安装日期、
 * 绑定网关、停机成本等档案字段；可选字段留空即不提交（保持原值）。
 */
export function DeviceForm({ device, onSubmit, onCancel, loading }: DeviceFormProps) {
  const { t } = useTranslation();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: device
      ? {
          deviceCode: device.deviceCode,
          name: device.name,
          type: device.type,
          manufacturer: device.manufacturer,
          criticality: device.criticality,
          model: device.model,
          serialNumber: device.serialNumber,
          installDate: device.installDate,
          gatewayId: device.gatewayId,
          downtimeCostPerHour: device.downtimeCostPerHour,
        }
      : undefined,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* 设备编码 */}
      <div className="space-y-2">
        <Label>{t('device.deviceCode')}</Label>
        <Input {...register('deviceCode')} placeholder={t('device.deviceCode')} />
        {errors.deviceCode && <p className="text-sm text-destructive">{t(errors.deviceCode.message!)}</p>}
      </div>

      {/* 设备名称 */}
      <div className="space-y-2">
        <Label>{t('device.name')}</Label>
        <Input {...register('name')} placeholder={t('device.name')} />
        {errors.name && <p className="text-sm text-destructive">{t(errors.name.message!)}</p>}
      </div>

      {/* 设备类型 */}
      <div className="space-y-2">
        <Label>{t('device.type')}</Label>
        <Select defaultValue={device?.type} onValueChange={(v) => { if (v) setValue('type', v); }}>
          <SelectTrigger><SelectValue placeholder={t('device.type')} /></SelectTrigger>
          <SelectContent>
            {deviceTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.type && <p className="text-sm text-destructive">{t(errors.type.message!)}</p>}
      </div>

      {/* 关键等级（设备优先级，影响告警/工单排序） */}
      <div className="space-y-2">
        <Label>{t('device.criticality')}</Label>
        <Select defaultValue={device?.criticality ?? 'Normal'} onValueChange={(v) => { if (v) setValue('criticality', v); }}>
          <SelectTrigger><SelectValue placeholder={t('device.criticality')} /></SelectTrigger>
          <SelectContent>
            {(['Critical', 'High', 'Normal', 'Low'] as const).map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 设备型号 */}
      <div className="space-y-2">
        <Label>{t('device.model')}</Label>
        <Input {...register('model')} placeholder={t('device.modelPlaceholder')} />
      </div>

      {/* 制造商 */}
      <div className="space-y-2">
        <Label>{t('device.manufacturer')}</Label>
        <Input {...register('manufacturer')} placeholder={t('device.manufacturer')} />
      </div>

      {/* 序列号（资产追踪） */}
      <div className="space-y-2">
        <Label>{t('device.serialNumber')}</Label>
        <Input {...register('serialNumber')} placeholder={t('device.serialNumber')} />
      </div>

      {/* 安装日期（质保起算） */}
      <div className="space-y-2">
        <Label>{t('device.installDate')}</Label>
        <Input type="date" {...register('installDate')} />
      </div>

      {/* 绑定网关编码（采集架构归属） */}
      <div className="space-y-2">
        <Label>{t('device.gatewayId')}</Label>
        <Input {...register('gatewayId')} placeholder={t('device.gatewayId')} />
      </div>

      {/* 每小时停机成本（ROI 核算/优先级）；setValueAs 把空值转 undefined（可选字段） */}
      <div className="space-y-2">
        <Label>{t('device.downtimeCostPerHour')}</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          {...register('downtimeCostPerHour', { setValueAs: (v) => (v === '' || v == null ? undefined : Number(v)) })}
          placeholder="0"
        />
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={loading}>{loading ? t('common.loading') : t('common.save')}</Button>
      </div>
    </form>
  );
}
