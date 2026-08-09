import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import AnalysesPage from '../AnalysesPage';
import * as analysisHooks from '../../hooks/useAnalyses';
import * as alertHooks from '../../hooks/useAlerts';
import * as permissionHooks from '../../hooks/usePermission';
import type { Analysis, PagedResult } from '../../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../hooks/useAnalyses', async () => {
  const actual = await vi.importActual<typeof import('../../hooks/useAnalyses')>('../../hooks/useAnalyses');
  return {
    ...actual,
    useAnalyses: vi.fn(),
    useTriggerAnalysis: vi.fn(),
  };
});

vi.mock('../../hooks/useAlerts', async () => {
  const actual = await vi.importActual<typeof import('../../hooks/useAlerts')>('../../hooks/useAlerts');
  return {
    ...actual,
    useAlerts: vi.fn(),
  };
});

vi.mock('../../hooks/usePermission', async () => {
  const actual = await vi.importActual<typeof import('../../hooks/usePermission')>('../../hooks/usePermission');
  return {
    ...actual,
    usePermission: vi.fn(),
  };
});

const mockAnalysis: Analysis = {
  id: 'analysis-001',
  alertId: 'alert-001',
  deviceId: 'device-001',
  level: 'L2',
  status: 'completed',
  confidence: 0.85,
  dataQualityScore: 90,
  processingTimeMs: 1200,
  completedAt: '2026-08-09T08:00:00Z',
  createdAt: '2026-08-09T07:59:00Z',
};

const mockPagedResult: PagedResult<Analysis> = {
  items: [mockAnalysis],
  total: 1,
  page: 1,
  pageSize: 20,
};

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(analysisHooks.useAnalyses).mockReturnValue({
    data: mockPagedResult,
    isLoading: false,
  } as ReturnType<typeof analysisHooks.useAnalyses>);
  vi.mocked(analysisHooks.useTriggerAnalysis).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof analysisHooks.useTriggerAnalysis>);
  vi.mocked(alertHooks.useAlerts).mockReturnValue({
    data: { items: [], total: 0, page: 1, pageSize: 50 },
  } as unknown as ReturnType<typeof alertHooks.useAlerts>);
  vi.mocked(permissionHooks.usePermission).mockReturnValue({
    canRead: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExecute: false,
    canConfigure: false,
    canApprove: false,
    canTriggerAI: true,
    canManage: false,
  });
});

describe('AnalysesPage', () => {
  it('渲染分析列表时不应产生 React 列表 key 警告', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(<AnalysesPage />);

    const hasMissingKeyWarning = consoleError.mock.calls.some((args) =>
      args.some((arg) => typeof arg === 'string' && arg.includes('Each child in a list')),
    );
    expect(hasMissingKeyWarning).toBe(false);

    consoleError.mockRestore();
  });
});
