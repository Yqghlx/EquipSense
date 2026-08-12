import { describe, expect, it } from 'vitest';
import { parseTemplateArray } from '../deviceTemplatePreview';

describe('parseTemplateArray', () => {
  it('应解析后端返回的 JSON 字符串数组', () => {
    const result = parseTemplateArray(
      '[{"name":"振动超标","metric":"vibration","threshold":7}]',
      'defaultAlarmRules',
    );

    expect(result).toEqual([
      { name: '振动超标', metric: 'vibration', threshold: 7 },
    ]);
  });

  it('应从参数对象中读取 metrics 数组', () => {
    const result = parseTemplateArray(
      { metrics: [{ name: 'temperature', unit: '°C' }] },
      'metrics',
    );

    expect(result).toEqual([{ name: 'temperature', unit: '°C' }]);
  });

  it('JSON 无效或结构不匹配时应返回空数组而不是抛出页面错误', () => {
    expect(parseTemplateArray('{bad-json', 'metrics')).toEqual([]);
    expect(parseTemplateArray({ parameters: {} }, 'metrics')).toEqual([]);
    expect(parseTemplateArray(null, 'metrics')).toEqual([]);
  });
});
