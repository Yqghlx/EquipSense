/**
 * 把后端 PascalCase 枚举转成当前语言的可读标签。
 *
 * 下拉框的 value 仍提交原始枚举，只翻译给人看的文字；
 * 未知值原样返回，避免把现场自定义类型藏起来。
 */

/** 设备表单里的预置类型，value 与后端/导入约定一致。 */
export const DEVICE_TYPE_VALUES = ['pump', 'motor', 'valve', 'sensor', 'plc', 'other'] as const;

/** 设备关键等级，value 对应后端 DeviceCriticality。 */
export const DEVICE_CRITICALITY_VALUES = ['Critical', 'High', 'Normal', 'Low'] as const;

const deviceTypeKeys: Record<string, string> = {
  pump: 'device.types.pump',
  motor: 'device.types.motor',
  valve: 'device.types.valve',
  sensor: 'device.types.sensor',
  plc: 'device.types.plc',
  other: 'device.types.other',
};

const criticalityKeys: Record<string, string> = {
  critical: 'alert.critical',
  high: 'alert.high',
  normal: 'alert.normal',
  low: 'alert.low',
};

/**
 * 设备类型显示文案。未知类型保留原值，方便现场自定义类型仍能辨认。
 */
export function getDeviceTypeLabel(t: (key: string) => string, type?: string | null): string {
  if (!type) return '-';
  const key = deviceTypeKeys[type.trim().toLowerCase()];
  return key ? t(key) : type;
}

/**
 * 设备关键等级显示文案。与告警级别共用同一组中英对照。
 */
export function getCriticalityLabel(t: (key: string) => string, criticality?: string | null): string {
  if (!criticality) return '-';
  const key = criticalityKeys[criticality.trim().toLowerCase()];
  return key ? t(key) : criticality;
}
