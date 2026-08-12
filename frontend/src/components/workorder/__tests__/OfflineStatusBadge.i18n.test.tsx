import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OfflineStatusBadge } from '../OfflineStatusBadge';

const translations: Record<string, string> = {
  'workorder.offline': 'Offline',
  'workorder.pendingSync': '{{count}} pending sync',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) => {
      const template = translations[key] ?? key;
      return options?.count === undefined ? template : template.replace('{{count}}', String(options.count));
    },
  }),
}));

const mockUseOfflineStatus = vi.fn();
const mockUseOfflineQueue = vi.fn();

vi.mock('../../../hooks/useOfflineStatus', () => ({
  useOfflineStatus: () => mockUseOfflineStatus(),
}));
vi.mock('../../../hooks/useOfflineQueue', () => ({
  useOfflineQueue: () => mockUseOfflineQueue(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockUseOfflineStatus.mockReturnValue({ isOffline: true });
  mockUseOfflineQueue.mockReturnValue({ pendingCount: 3 });
});

describe('离线状态徽章英文界面', () => {
  it('应显示英文离线状态和待同步数量', () => {
    render(<OfflineStatusBadge />);

    expect(screen.getByText(/Offline/)).toBeInTheDocument();
    expect(screen.getByText(/3 pending sync/)).toBeInTheDocument();
    expect(screen.queryByText(/离线/)).not.toBeInTheDocument();
    expect(screen.queryByText(/待同步/)).not.toBeInTheDocument();
  });
});
