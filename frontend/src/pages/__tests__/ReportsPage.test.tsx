import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ReportsPage from '../ReportsPage';
import { downloadCurrentMonthReport, downloadOperationsReport } from '../../hooks/useReports';
import { usePermission } from '../../hooks/usePermission';

const mockedToastError = vi.hoisted(() => vi.fn());

vi.mock('sonner', () => ({
  toast: { error: mockedToastError },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../hooks/useReports', () => ({
  downloadCurrentMonthReport: vi.fn(),
  downloadOperationsReport: vi.fn(),
}));

vi.mock('../../hooks/usePermission', () => ({
  usePermission: vi.fn(),
}));

const mockedDownloadCurrentMonthReport = vi.mocked(downloadCurrentMonthReport);
const mockedDownloadOperationsReport = vi.mocked(downloadOperationsReport);
const mockedUsePermission = vi.mocked(usePermission);

const readPermission = {
  canRead: true,
  canCreate: false,
  canEdit: false,
  canDelete: false,
  canExecute: false,
  canConfigure: false,
  canApprove: false,
  canTriggerAI: false,
  canManage: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedUsePermission.mockReturnValue(readPermission);
  mockedDownloadCurrentMonthReport.mockResolvedValue(undefined);
  mockedDownloadOperationsReport.mockResolvedValue(undefined);
});

describe('ReportsPage', () => {
  it('应提供本月快捷导出和自定义日期范围导出', async () => {
    const user = userEvent.setup();
    render(<ReportsPage />);

    await user.click(screen.getByRole('button', { name: 'reports.currentMonth' }));
    expect(mockedDownloadCurrentMonthReport).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText('reports.startDate'), { target: { value: '2026-08-01' } });
    fireEvent.change(screen.getByLabelText('reports.endDate'), { target: { value: '2026-08-14' } });
    await user.click(screen.getByRole('button', { name: 'reports.download' }));

    expect(mockedDownloadOperationsReport).toHaveBeenCalledWith('2026-08-01', '2026-08-14');
  });

  it('日期范围无效时应禁用导出并说明原因', () => {
    render(<ReportsPage />);

    fireEvent.change(screen.getByLabelText('reports.startDate'), { target: { value: '2026-08-14' } });
    fireEvent.change(screen.getByLabelText('reports.endDate'), { target: { value: '2026-08-14' } });

    expect(screen.getByText('reports.rangeStartBeforeEnd')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'reports.download' })).toBeDisabled();
    expect(mockedDownloadOperationsReport).not.toHaveBeenCalled();
  });

  it('日期范围包含结束日全天时不应超过后端的 366 天上限', () => {
    render(<ReportsPage />);

    fireEvent.change(screen.getByLabelText('reports.startDate'), { target: { value: '2025-01-01' } });
    fireEvent.change(screen.getByLabelText('reports.endDate'), { target: { value: '2026-01-02' } });

    expect(screen.getByText('reports.rangeTooLong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'reports.download' })).toBeDisabled();
  });

  it('导出失败时应提示用户并在请求结束后恢复按钮', async () => {
    const user = userEvent.setup();
    let rejectExport!: (reason?: unknown) => void;
    mockedDownloadCurrentMonthReport.mockReturnValueOnce(new Promise<void>((_, reject) => {
      rejectExport = reject;
    }));
    render(<ReportsPage />);

    const exportButton = screen.getByRole('button', { name: 'reports.currentMonth' });
    await user.click(exportButton);
    expect(exportButton).toBeDisabled();
    expect(exportButton).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'reports.download' })).toBeDisabled();

    rejectExport(new Error('network unavailable'));
    await waitFor(() => {
      expect(mockedToastError).toHaveBeenCalledWith('reports.exportFailed');
      expect(exportButton).toBeEnabled();
      expect(screen.getByRole('button', { name: 'reports.download' })).toBeEnabled();
    });
  });

  it('无报表权限时应显示无权限状态且不展示导出动作', () => {
    mockedUsePermission.mockReturnValue({ ...readPermission, canRead: false });

    render(<ReportsPage />);

    expect(screen.getByText('reports.noReadPermission')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'reports.currentMonth' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'reports.download' })).not.toBeInTheDocument();
  });
});
