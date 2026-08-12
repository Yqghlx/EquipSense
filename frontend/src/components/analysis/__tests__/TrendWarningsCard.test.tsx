import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrendWarningsCard from '../TrendWarningsCard';
import { useTrendWarnings, type TrendAnalysisResult } from '../../../hooks/useTrendAnalysis';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
}));

const translations: Record<string, string> = {
  'dashboard.trendWarnings.title': 'Trend warnings',
  'dashboard.trendWarnings.description': 'Metrics that may exceed a threshold within 7 days',
  'dashboard.trendWarnings.count': '{{count}} warnings',
  'dashboard.trendWarnings.empty': 'No metrics are expected to exceed a threshold soon',
  'dashboard.trendWarnings.loadFailed': 'Trend warnings failed to load',
  'dashboard.trendWarnings.retry': 'Retry trend warnings',
  'dashboard.trendWarnings.more': '{{count}} more warnings',
  'dashboard.trendWarnings.currentValue': 'Current',
  'dashboard.trendWarnings.threshold': 'Threshold',
  'dashboard.trendWarnings.days': '{{count}} days',
  'dashboard.trendWarnings.noEstimate': 'No estimate',
  'dashboard.trendWarnings.openDevice': 'Open device {{deviceId}} trend for {{metric}}',
  'dashboard.trendWarnings.direction.up': 'Rising',
  'dashboard.trendWarnings.direction.down': 'Falling',
  'dashboard.trendWarnings.direction.stable': 'Stable',
  'dashboard.trendWarnings.direction.unknown': 'Unknown direction',
  'dashboard.trendWarnings.risk.critical': 'Within 1 day',
  'dashboard.trendWarnings.risk.warning': 'Within 3 days',
  'dashboard.trendWarnings.risk.info': 'Within 7 days',
  'common.loading': 'Loading...',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      let value = translations[key] ?? key;
      for (const [name, replacement] of Object.entries(options ?? {})) {
        value = value.replace(`{{${name}}}`, String(replacement));
      }
      return value;
    },
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});

vi.mock('../../../hooks/useTrendAnalysis', () => ({
  useTrendWarnings: vi.fn(),
}));

const mockedUseTrendWarnings = vi.mocked(useTrendWarnings);

function createWarning(overrides: Partial<TrendAnalysisResult> = {}): TrendAnalysisResult {
  return {
    deviceId: 'device-1',
    metric: 'temperature',
    currentValue: 88.2,
    averageValue: 80,
    minValue: 70,
    maxValue: 90,
    trendSlope: 1.2,
    changeRatePercent: 3.1,
    threshold: 100,
    daysToThreshold: 2,
    willExceedThreshold: true,
    trendDirection: '上升',
    dataPoints: 24,
    analyzedAt: '2026-08-13T00:00:00Z',
    ...overrides,
  };
}

function createWarnings(): TrendAnalysisResult[] {
  return [
    createWarning({ deviceId: 'device-1', daysToThreshold: 6 }),
    createWarning({ deviceId: 'device-2', daysToThreshold: null }),
    createWarning({ deviceId: 'device-3', daysToThreshold: 3 }),
    createWarning({ deviceId: 'device-4', daysToThreshold: 0.5 }),
    createWarning({ deviceId: 'device-5', daysToThreshold: 2 }),
    createWarning({ deviceId: 'device-6', daysToThreshold: 1 }),
    createWarning({ deviceId: 'device-7', daysToThreshold: 4 }),
  ];
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseTrendWarnings.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as never);
});

describe('TrendWarningsCard', () => {
  it('按越阈值时间排序并最多展示五条预警', () => {
    mockedUseTrendWarnings.mockReturnValue({
      data: createWarnings(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    render(<TrendWarningsCard />);

    const rows = screen.getAllByRole('button', { name: /Open device/i });
    expect(rows).toHaveLength(5);
    expect(rows[0]).toHaveTextContent('0.5');
    expect(rows[1]).toHaveTextContent('1 days');
    expect(screen.getByText('2 more warnings')).toBeInTheDocument();
  });

  it('点击预警行跳转到设备详情', async () => {
    mockedUseTrendWarnings.mockReturnValue({
      data: [createWarning({ deviceId: 'device-123', metric: 'temperature' })],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    render(<TrendWarningsCard />);
    await userEvent.click(screen.getByRole('button', { name: /device-123.*temperature/i }));

    expect(mocks.navigate).toHaveBeenCalledWith('/devices/device-123');
  });

  it('空数据时显示正常空状态而不是失败提示', () => {
    render(<TrendWarningsCard />);

    expect(screen.getByText('No metrics are expected to exceed a threshold soon')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('缓存旧数据且加载失败时显示错误并保留旧数据', async () => {
    const refetch = vi.fn();
    mockedUseTrendWarnings.mockReturnValue({
      data: [createWarning({ deviceId: 'device-old', metric: 'pressure' })],
      isLoading: false,
      isError: true,
      refetch,
    } as never);

    render(<TrendWarningsCard />);
    expect(screen.getByRole('alert')).toHaveTextContent('Trend warnings failed to load');
    expect(screen.getByRole('button', { name: 'Retry trend warnings' })).toBeInTheDocument();
    expect(screen.queryByText('No metrics are expected to exceed a threshold soon')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /device-old.*pressure/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Retry trend warnings' }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('加载中时显示状态语义且不显示空状态', () => {
    mockedUseTrendWarnings.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as never);

    render(<TrendWarningsCard />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading...');
    expect(screen.queryByText('No metrics are expected to exceed a threshold soon')).not.toBeInTheDocument();
  });

  it('英文界面不泄漏中文趋势方向文案', () => {
    mockedUseTrendWarnings.mockReturnValue({
      data: [createWarning({ trendDirection: '上升' })],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    render(<TrendWarningsCard />);

    expect(screen.getByText('Rising')).toBeInTheDocument();
    expect(screen.queryByText('上升')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open device/i })).toHaveAccessibleName(
      'Open device device-1 trend for temperature',
    );
  });
});
