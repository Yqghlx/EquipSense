import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuditLogsPage from '../AuditLogsPage';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'audit.title': 'Audit logs',
        'audit.description': 'Sensitive operation records for compliance tracing',
        'audit.allActions': 'All actions',
        'audit.allResources': 'All resources',
        'audit.actionOptions.authLoginSuccess': 'AuthLoginSuccess (Login succeeded)',
        'audit.actionOptions.authLoginFailed': 'AuthLoginFailed (Login failed)',
        'audit.actionOptions.acknowledge': 'Acknowledge (Acknowledge alert)',
        'audit.actionOptions.resolve': 'Resolve (Resolve alert)',
        'audit.actionOptions.recalculateHealth': 'RecalculateHealth (Recalculate health)',
        'audit.actionOptions.slaCheck': 'SlaCheck (SLA check)',
        'audit.actionOptions.generateReport': 'GenerateReport (Generate report)',
      };
      return translations[key] ?? key;
    },
  }),
}));

vi.mock('../../hooks/useAuditLogs', () => ({
  useAuditLogs: () => ({
    data: { items: [], total: 0 },
    isLoading: false,
  }),
  exportAuditLogsCsv: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AuditLogsPage 英文界面', () => {
  it('动作筛选选项不应混入中文说明', () => {
    render(<AuditLogsPage />);

    expect(screen.getByRole('option', { name: 'AuthLoginSuccess (Login succeeded)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Acknowledge (Acknowledge alert)' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /登录成功|确认告警/ })).not.toBeInTheDocument();
  });
});
