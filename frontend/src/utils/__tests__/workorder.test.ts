import { describe, expect, it } from 'vitest';
import { isTerminalWorkOrderStatus } from '../workorder';

describe('isTerminalWorkOrderStatus', () => {
  it('应将 Closed/Cancelled 的任意大小写视为终态', () => {
    expect(isTerminalWorkOrderStatus('Closed')).toBe(true);
    expect(isTerminalWorkOrderStatus('cancelled')).toBe(true);
    expect(isTerminalWorkOrderStatus('CLOSED')).toBe(true);
  });

  it('不应把进行中或验收不通过当成终态', () => {
    expect(isTerminalWorkOrderStatus('Rejected')).toBe(false);
    expect(isTerminalWorkOrderStatus('InProgress')).toBe(false);
    expect(isTerminalWorkOrderStatus(undefined)).toBe(false);
  });
});
