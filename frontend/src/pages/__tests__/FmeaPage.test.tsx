import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FmeaPage from '../FmeaPage';
import {
  useCreateFmeaEntry,
  useDeleteFmeaEntry,
  useFmeaEntries,
  useToggleFmeaEntry,
  useUpdateFmeaEntry,
} from '../../hooks/useFmea';
import { usePermission } from '../../hooks/usePermission';
import type { FmeaEntry } from '../../hooks/useFmea';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../hooks/useFmea', () => ({
  useFmeaEntries: vi.fn(),
  useCreateFmeaEntry: vi.fn(),
  useUpdateFmeaEntry: vi.fn(),
  useDeleteFmeaEntry: vi.fn(),
  useToggleFmeaEntry: vi.fn(),
}));

vi.mock('../../hooks/usePermission', () => ({
  usePermission: vi.fn(),
}));

const mockEntry: FmeaEntry = {
  id: 'fmea-001',
  tenantId: 'tenant-001',
  deviceType: 'pump',
  failureMode: 'bearing wear',
  cause: 'insufficient lubrication',
  effect: 'increased vibration',
  detection: 'vibration analysis',
  recommendedAction: 'lubricate bearing',
  severity: 4,
  occurrence: 5,
  detectability: 6,
  rpn: 120,
  knowledgeRuleId: null,
  createdBy: 'user-001',
  isEnabled: true,
  createdAt: '2026-08-12T08:00:00Z',
  updatedAt: '2026-08-12T08:00:00Z',
};

const allPermissions = {
  canRead: true,
  canCreate: true,
  canEdit: true,
  canDelete: true,
  canExecute: false,
  canConfigure: false,
  canApprove: true,
  canTriggerAI: false,
  canManage: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useFmeaEntries).mockReturnValue({
    data: { items: [mockEntry], total: 1, page: 1, pageSize: 20 },
    isLoading: false,
  } as ReturnType<typeof useFmeaEntries>);
  vi.mocked(useCreateFmeaEntry).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useCreateFmeaEntry>);
  vi.mocked(useUpdateFmeaEntry).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateFmeaEntry>);
  vi.mocked(useDeleteFmeaEntry).mockReturnValue({ mutate: vi.fn() } as unknown as ReturnType<typeof useDeleteFmeaEntry>);
  vi.mocked(useToggleFmeaEntry).mockReturnValue({ mutate: vi.fn() } as unknown as ReturnType<typeof useToggleFmeaEntry>);
  vi.mocked(usePermission).mockReturnValue(allPermissions);
});

describe('FmeaPage', () => {
  it('有写权限时显示新建和行编辑入口，并能打开新建弹窗', async () => {
    const user = userEvent.setup();
    render(<FmeaPage />);

    expect(screen.getByRole('button', { name: 'fmea.create' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'fmea.editAction' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'fmea.create' }));

    expect(screen.getByText('fmea.formDescription')).toBeInTheDocument();
  });

  it('点击行编辑入口时回填当前 FMEA 条目', async () => {
    const user = userEvent.setup();
    render(<FmeaPage />);

    await user.click(screen.getByRole('button', { name: 'fmea.editAction' }));

    expect(screen.getByDisplayValue(mockEntry.failureMode)).toBeInTheDocument();
  });

  it('无写权限时不显示新建和编辑入口', () => {
    vi.mocked(usePermission).mockReturnValue({
      ...allPermissions,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    });

    render(<FmeaPage />);

    expect(screen.queryByRole('button', { name: 'fmea.create' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'fmea.editAction' })).not.toBeInTheDocument();
  });
});
