import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import AuditLogsPage from '../AuditLogsPage';
import { exportAuditLogsCsv, useAuditLogs } from '../../hooks/useAuditLogs';

const mockedUseAuditLogs = vi.mocked(useAuditLogs);
const mockedExportAuditLogsCsv = vi.mocked(exportAuditLogsCsv);
const mockedToastError = vi.hoisted(() => vi.fn());

vi.mock('sonner', () => ({
  toast: { error: mockedToastError },
}));

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
  useAuditLogs: vi.fn(() => ({
    data: { items: [], total: 0 },
    isLoading: false,
  })),
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

  it('应根据筛选条件加载日志并导出 CSV', async () => {
    const user = userEvent.setup();
    mockedUseAuditLogs.mockReturnValue({
      data: {
        items: [{
          id: 'audit-001',
          action: 'Create',
          resourceType: 'Device',
          description: 'Created device PUMP-001',
          ipAddress: '10.0.0.1',
          httpMethod: 'POST',
          createdAt: '2026-08-12T00:00:00Z',
        }],
        total: 21,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useAuditLogs>);
    mockedExportAuditLogsCsv.mockResolvedValueOnce(undefined);
    render(<AuditLogsPage />);

    expect(screen.getByText('Created device PUMP-001')).toBeInTheDocument();
    expect(screen.getByText('10.0.0.1')).toBeInTheDocument();
    await user.selectOptions(screen.getAllByRole('combobox')[0], 'Create');
    await user.selectOptions(screen.getAllByRole('combobox')[1], 'Device');
    await user.click(screen.getByRole('button', { name: 'common.export' }));
    expect(mockedExportAuditLogsCsv).toHaveBeenCalledWith({ action: 'Create', resourceType: 'Device' });
  });

  it('日志加载中和无数据时应展示对应状态', () => {
    mockedUseAuditLogs.mockReturnValue({ data: undefined, isLoading: true } as unknown as ReturnType<typeof useAuditLogs>);
    const view = render(<AuditLogsPage />);
    expect(screen.getByText('common.loading')).toBeInTheDocument();

    mockedUseAuditLogs.mockReturnValue({ data: { items: [], total: 0 }, isLoading: false } as unknown as ReturnType<typeof useAuditLogs>);
    view.rerender(<AuditLogsPage />);
    expect(screen.getByText('common.noData')).toBeInTheDocument();
  });

  it('导出失败时应提示用户并在请求结束后恢复按钮', async () => {
    const user = userEvent.setup();
    let rejectExport!: (reason?: unknown) => void;
    const exportPromise = new Promise<void>((_, reject) => {
      rejectExport = reject;
    });
    mockedExportAuditLogsCsv.mockReturnValueOnce(exportPromise);
    render(<AuditLogsPage />);

    const exportButton = screen.getByRole('button', { name: 'common.export' });
    await user.click(exportButton);
    expect(exportButton).toBeDisabled();
    expect(exportButton).toHaveAttribute('aria-busy', 'true');

    rejectExport(new Error('network unavailable'));
    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith('audit.exportFailed');
      expect(exportButton).toBeEnabled();
    });
  });
});
