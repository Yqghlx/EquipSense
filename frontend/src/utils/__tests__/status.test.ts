import { describe, expect, it } from 'vitest';
import { matchesAnyStatus, matchesStatus } from '../status';

describe('matchesStatus', () => {
  it('应忽略大小写匹配后端 PascalCase 枚举', () => {
    expect(matchesStatus('Active', 'active')).toBe(true);
    expect(matchesStatus('acknowledged', 'Acknowledged')).toBe(true);
    expect(matchesStatus('CLOSED', 'Closed')).toBe(true);
  });

  it('应忽略首尾空白且拒绝空值和不同状态', () => {
    expect(matchesStatus('  Active  ', 'active')).toBe(true);
    expect(matchesStatus(undefined, 'active')).toBe(false);
    expect(matchesStatus(null, 'active')).toBe(false);
    expect(matchesStatus('', 'active')).toBe(false);
    expect(matchesStatus('Resolved', 'active')).toBe(false);
  });
});

describe('matchesAnyStatus', () => {
  it('应在任一期望值命中时返回 true', () => {
    expect(matchesAnyStatus('Closed', ['cancelled', 'closed'])).toBe(true);
    expect(matchesAnyStatus('Rejected', ['cancelled', 'closed'])).toBe(false);
  });
});
