import { describe, expect, it } from 'vitest';
import { calculateFmeaRpn, getFmeaRpnColor, isValidFmeaRating } from '../fmeaRisk';

describe('fmeaRisk', () => {
  it('按 S/O/D 计算 RPN 并复用列表风险色阶', () => {
    expect(calculateFmeaRpn(5, 6, 7)).toBe(210);
    expect(getFmeaRpnColor(200)).toContain('red');
    expect(getFmeaRpnColor(100)).toContain('orange');
    expect(getFmeaRpnColor(99)).toContain('yellow');
  });

  it('只接受 1 到 10 的整数评分', () => {
    expect(isValidFmeaRating('1')).toBe(true);
    expect(isValidFmeaRating('10')).toBe(true);
    expect(isValidFmeaRating('')).toBe(false);
    expect(isValidFmeaRating('1.5')).toBe(false);
    expect(isValidFmeaRating('11')).toBe(false);
  });
});
