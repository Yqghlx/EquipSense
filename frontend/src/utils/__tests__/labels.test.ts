import { describe, expect, it } from 'vitest';
import { getCriticalityLabel, getDeviceTypeLabel } from '../labels';

const t = (key: string) => key;

describe('getDeviceTypeLabel', () => {
  it('应将预置类型映射为翻译键并忽略大小写', () => {
    expect(getDeviceTypeLabel(t, 'pump')).toBe('device.types.pump');
    expect(getDeviceTypeLabel(t, 'PLC')).toBe('device.types.plc');
  });

  it('未知类型应保留原值，空值显示占位符', () => {
    expect(getDeviceTypeLabel(t, 'custom-line')).toBe('custom-line');
    expect(getDeviceTypeLabel(t, undefined)).toBe('-');
    expect(getDeviceTypeLabel(t, '')).toBe('-');
  });
});

describe('getCriticalityLabel', () => {
  it('应将关键等级映射为已有告警级别文案', () => {
    expect(getCriticalityLabel(t, 'Critical')).toBe('alert.critical');
    expect(getCriticalityLabel(t, 'normal')).toBe('alert.normal');
  });

  it('未知等级应保留原值，空值显示占位符', () => {
    expect(getCriticalityLabel(t, 'Important')).toBe('Important');
    expect(getCriticalityLabel(t, null)).toBe('-');
  });
});
