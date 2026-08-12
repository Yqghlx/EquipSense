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
  'dashboard.trendWarnings.oneDay': '1 day',
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
  'dashboard.trendWarnings.risk.noEstimate': 'No estimate available',
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
    deviceId: '11111111-1111-1111-1111-111111111111',
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
    createWarning({ deviceId: '11111111-1111-1111-1111-111111111111', daysToThreshold: 6 }),
    createWarning({ deviceId: '22222222-2222-2222-2222-222222222222', daysToThreshold: null }),
    createWarning({ deviceId: '33333333-3333-3333-3333-333333333333', daysToThreshold: 3 }),
    createWarning({ deviceId: '44444444-4444-4444-4444-444444444444', daysToThreshold: 0.5 }),
    createWarning({ deviceId: '55555555-5555-5555-5555-555555555555', daysToThreshold: 2 }),
    createWarning({ deviceId: '66666666-6666-6666-6666-666666666666', daysToThreshold: 1 }),
    createWarning({ deviceId: '77777777-7777-7777-7777-777777777777', daysToThreshold: 4 }),
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
    expect(rows[1]).toHaveTextContent('1 day');
    expect(screen.getByText('2 more warnings')).toBeInTheDocument();
  });

  it('点击预警行跳转到设备详情', async () => {
    mockedUseTrendWarnings.mockReturnValue({
      data: [createWarning({ deviceId: '12345678-1234-1234-1234-1234567890ab', metric: 'temperature' })],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    render(<TrendWarningsCard />);
    await userEvent.click(screen.getByRole('button', { name: /12345678-1234-1234-1234-1234567890ab.*temperature/i }));

    expect(mocks.navigate).toHaveBeenCalledWith('/devices/12345678-1234-1234-1234-1234567890ab');
  });

  it('空数据时显示正常空状态而不是失败提示', () => {
    render(<TrendWarningsCard />);

    expect(screen.getByText('No metrics are expected to exceed a threshold soon')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('缓存旧数据且加载失败时显示错误并保留旧数据', async () => {
    const refetch = vi.fn();
    mockedUseTrendWarnings.mockReturnValue({
      data: [createWarning({ deviceId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', metric: 'pressure' })],
      isLoading: false,
      isError: true,
      refetch,
    } as never);

    render(<TrendWarningsCard />);
    expect(screen.getByRole('alert')).toHaveTextContent('Trend warnings failed to load');
    expect(screen.getByRole('button', { name: 'Retry trend warnings' })).toBeInTheDocument();
    expect(screen.queryByText('No metrics are expected to exceed a threshold soon')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.*pressure/i })).toBeInTheDocument();

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
      'Open device 11111111-1111-1111-1111-111111111111 trend for temperature',
    );
  });

  it('daysToThreshold 为 null 时显示中性无估算文案而不是 7 天内提示', () => {
    mockedUseTrendWarnings.mockReturnValue({
      data: [createWarning({ daysToThreshold: null, deviceId: '88888888-8888-8888-8888-888888888888' })],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    render(<TrendWarningsCard />);

    expect(screen.getByText('No estimate')).toBeInTheDocument();
    expect(screen.getByText('No estimate available')).toBeInTheDocument();
    expect(screen.queryByText('Within 7 days')).not.toBeInTheDocument();
  });

  it('忽略 deviceId 或 metric 非法的运行时记录，避免渲染无效导航', () => {
    mockedUseTrendWarnings.mockReturnValue({
      data: [
        createWarning({ deviceId: '99999999-9999-9999-9999-999999999999', metric: 'temperature' }),
        null as unknown as TrendAnalysisResult,
        createWarning({ deviceId: '', metric: 'pressure' }) as TrendAnalysisResult,
        createWarning({ deviceId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', metric: '   ' }) as TrendAnalysisResult,
      ],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    render(<TrendWarningsCard />);

    const rows = screen.getAllByRole('button', { name: /Open device/i });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveAccessibleName('Open device 99999999-9999-9999-9999-999999999999 trend for temperature');
    expect(screen.queryByRole('button', { name: /undefined/i })).not.toBeInTheDocument();
  });

  it('标题提供二级 heading 语义，便于仪表盘区块导航', () => {
    render(<TrendWarningsCard />);

    expect(screen.getByRole('heading', { level: 2, name: 'Trend warnings' })).toBeInTheDocument();
  });
});
