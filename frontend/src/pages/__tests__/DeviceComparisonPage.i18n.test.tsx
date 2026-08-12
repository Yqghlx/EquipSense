import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Device, DeviceTypeTemplate, PagedResult, AlertRule } from '../../types';
import type { DeviceComparisonResult } from '../../hooks/useDeviceComparison';
import { useDeviceComparison } from '../../hooks/useDeviceComparison';
import { useDevices } from '../../hooks/useDevices';
import { useDeviceTemplates } from '../../hooks/useDeviceConfig';
import { useAlertRules } from '../../hooks/useAlertRules';
import { usePermission } from '../../hooks/usePermission';

const translations: Record<string, string> = {
  'deviceComparison.title': 'Device Comparison',
  'deviceComparison.description': 'Compare 2 to 5 devices of the same type within one tenant.',
  'deviceComparison.filters.deviceType': 'Device type',
  'deviceComparison.filters.metric': 'Metric',
  'deviceComparison.filters.metricPlaceholder': 'Enter a metric such as temperature',
  'deviceComparison.filters.window': 'Window',
  'deviceComparison.filters.search': 'Search devices',
  'deviceComparison.filters.searchPlaceholder': 'Search by device code or name',
  'deviceComparison.filters.selectHint': 'Select 2 to 5 devices',
  'deviceComparison.filters.metricSuggestions': 'Suggested metrics',
  'deviceComparison.window.24h': '24 hours',
  'deviceComparison.window.72h': '72 hours',
  'deviceComparison.window.7d': '7 days',
  'deviceComparison.window.30d': '30 days',
  'deviceComparison.list.title': 'Candidate devices',
  'deviceComparison.list.tooMany': 'Too many devices. Narrow the list with a search keyword.',
  'deviceComparison.state.loading': 'Loading comparison',
  'deviceComparison.state.loadFailed': 'Failed to load comparison',
  'deviceComparison.state.retry': 'Retry comparison',
  'deviceComparison.state.rulesFailed': 'Metric suggestions are unavailable. You can still type a metric.',
  'deviceComparison.state.noPermission': 'You do not have permission to view device comparison.',
  'deviceComparison.state.noCandidates': 'No devices match the selected type.',
  'deviceComparison.state.notEnoughDevices': 'Select at least 2 devices to compare.',
  'deviceComparison.state.insufficientData': 'Not enough telemetry samples in the selected window.',
  'deviceComparison.state.refreshFailed': 'Failed to refresh comparison. Showing cached results.',
  'deviceComparison.result.summary': 'Group summary',
  'deviceComparison.result.groupMean': 'Group mean',
  'deviceComparison.result.groupStdDev': 'Standard deviation',
  'deviceComparison.result.table.device': 'Device',
  'deviceComparison.result.table.code': 'Code',
  'deviceComparison.result.table.average': 'Average',
  'deviceComparison.result.table.latest': 'Latest',
  'deviceComparison.result.table.minimum': 'Minimum',
  'deviceComparison.result.table.maximum': 'Maximum',
  'deviceComparison.result.table.samples': 'Samples',
  'deviceComparison.result.table.zScore': 'Z-Score',
  'deviceComparison.result.table.outlier': 'Outlier',
  'deviceComparison.result.outlierBadge': 'Outlier',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key,
  }),
}));

vi.mock('../../hooks/useDeviceComparison', () => ({
  useDeviceComparison: vi.fn(),
}));

vi.mock('../../hooks/useDevices', () => ({
  useDevices: vi.fn(),
}));

vi.mock('../../hooks/useDeviceConfig', () => ({
  useDeviceTemplates: vi.fn(),
}));

vi.mock('../../hooks/useAlertRules', () => ({
  useAlertRules: vi.fn(),
}));

vi.mock('../../hooks/usePermission', () => ({
  usePermission: vi.fn(),
}));

const mockedUseDeviceComparison = vi.mocked(useDeviceComparison);
const mockedUseDevices = vi.mocked(useDevices);
const mockedUseDeviceTemplates = vi.mocked(useDeviceTemplates);
const mockedUseAlertRules = vi.mocked(useAlertRules);
const mockedUsePermission = vi.mocked(usePermission);

interface QueryOptionsContract {
  enabled?: boolean;
}

interface ComparisonQueryParamsContract {
  deviceType?: string;
  metric?: string;
  hours?: number;
  deviceIds?: string[];
  enabled?: boolean;
}

/** 只记录真正启用的查询，避免把 Hook 是否调用误当成网络执行。 */
const queryExecutions: string[] = [];

function isComparisonQueryEnabled(
  params?: ComparisonQueryParamsContract,
  options?: QueryOptionsContract,
): boolean {
  if (options?.enabled !== undefined) return options.enabled;
  if (params?.enabled !== undefined) return params.enabled;

  const uniqueDeviceIds = [...new Set(params?.deviceIds ?? [])];
  return Boolean(
    params?.deviceType
      && params.metric
      && params.hours
      && uniqueDeviceIds.length >= 2
      && uniqueDeviceIds.length <= 5,
  );
}

const pumpDevices: Device[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    deviceCode: 'P-001',
    name: 'Pump 1',
    type: 'Pump',
    manufacturer: 'ABB',
    model: 'A1',
    status: 'Online',
    criticality: 'Critical',
    healthScore: 91,
    createdAt: '2026-08-10T00:00:00Z',
    updatedAt: '2026-08-10T00:00:00Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    deviceCode: 'P-002',
    name: 'Pump 2',
    type: 'Pump',
    manufacturer: 'ABB',
    model: 'A1',
    status: 'Online',
    criticality: 'Critical',
    healthScore: 89,
    createdAt: '2026-08-10T00:00:00Z',
    updatedAt: '2026-08-10T00:00:00Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    deviceCode: 'P-003',
    name: 'Pump 3',
    type: 'Pump',
    manufacturer: 'ABB',
    model: 'A1',
    status: 'Online',
    criticality: 'Critical',
    healthScore: 88,
    createdAt: '2026-08-10T00:00:00Z',
    updatedAt: '2026-08-10T00:00:00Z',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    deviceCode: 'P-004',
    name: 'Pump 4',
    type: 'Pump',
    manufacturer: 'ABB',
    model: 'A1',
    status: 'Online',
    criticality: 'Critical',
    healthScore: 87,
    createdAt: '2026-08-10T00:00:00Z',
    updatedAt: '2026-08-10T00:00:00Z',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    deviceCode: 'P-005',
    name: 'Pump 5',
    type: 'Pump',
    manufacturer: 'ABB',
    model: 'A1',
    status: 'Online',
    criticality: 'Critical',
    healthScore: 86,
    createdAt: '2026-08-10T00:00:00Z',
    updatedAt: '2026-08-10T00:00:00Z',
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    deviceCode: 'P-006',
    name: 'Pump 6',
    type: 'Pump',
    manufacturer: 'ABB',
    model: 'A1',
    status: 'Online',
    criticality: 'Critical',
    healthScore: 85,
    createdAt: '2026-08-10T00:00:00Z',
    updatedAt: '2026-08-10T00:00:00Z',
  },
];

const allDevices = [
  ...pumpDevices,
  {
    id: '77777777-7777-7777-7777-777777777777',
    deviceCode: 'F-001',
    name: 'Fan 1',
    type: 'Fan',
    manufacturer: 'Siemens',
    model: 'F1',
    status: 'Online',
    criticality: 'Normal',
    healthScore: 94,
    createdAt: '2026-08-10T00:00:00Z',
    updatedAt: '2026-08-10T00:00:00Z',
  },
] satisfies Device[];

const mockTemplates: DeviceTypeTemplate[] = [
  { id: 'template-pump', name: 'Pump', industry: 'Manufacturing' },
  { id: 'template-fan', name: 'Fan', industry: 'Manufacturing' },
];

const mockAlertRules: PagedResult<AlertRule> = {
  items: [
    {
      id: 'rule-temp',
      name: 'Temperature high',
      metric: 'temperature',
      ruleType: 'threshold',
      operator: 'gt',
      threshold: 80,
      severity: 'High',
      cooldownSeconds: 300,
      autoCreateWorkorder: false,
      enabled: true,
      createdAt: '2026-08-10T00:00:00Z',
    },
    {
      id: 'rule-vibration',
      name: 'Vibration high',
      metric: 'vibration',
      ruleType: 'threshold',
      operator: 'gt',
      threshold: 15,
      severity: 'High',
      cooldownSeconds: 300,
      autoCreateWorkorder: false,
      enabled: true,
      createdAt: '2026-08-10T00:00:00Z',
    },
  ],
  total: 2,
  page: 1,
  pageSize: 100,
};

const mockComparisonResult: DeviceComparisonResult = {
  deviceType: 'Pump',
  metric: 'temperature',
  hours: 24,
  groupMean: 53.2,
  groupStdDev: 1.3,
  devices: [
    {
      deviceId: '11111111-1111-1111-1111-111111111111',
      deviceCode: 'P-001',
      deviceName: 'Pump 1',
      averageValue: 51.9,
      latestValue: 52.3,
      minValue: 50.1,
      maxValue: 53.3,
      dataPointCount: 18,
      zScore: -0.5,
      isOutlier: false,
    },
    {
      deviceId: '22222222-2222-2222-2222-222222222222',
      deviceCode: 'P-002',
      deviceName: 'Pump 2',
      averageValue: 55.1,
      latestValue: 56.2,
      minValue: 53.4,
      maxValue: 57.8,
      dataPointCount: 18,
      zScore: 2.4,
      isOutlier: true,
    },
  ],
  message: null,
};

const allowReadPermission = {
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

function buildPagedResult(items: Device[]): PagedResult<Device> {
  return {
    items,
    total: items.length,
    page: 1,
    pageSize: 100,
  };
}

async function renderPage() {
  const pageModulePath = '../DeviceComparisonPage';
  const module = await import(pageModulePath);
  const DeviceComparisonPage = module.default;
  return render(
    <MemoryRouter>
      <DeviceComparisonPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  queryExecutions.length = 0;
  mockedUsePermission.mockReturnValue(allowReadPermission);
  mockedUseDeviceTemplates.mockImplementation((_industry?: string, options?: QueryOptionsContract) => {
    const enabled = options?.enabled !== false;
    if (enabled) queryExecutions.push('device-templates');
    return {
      data: enabled ? mockTemplates : undefined,
      isLoading: false,
      isError: false,
    } as never;
  });
  mockedUseAlertRules.mockImplementation((_query, options?: QueryOptionsContract) => {
    const enabled = options?.enabled !== false;
    if (enabled) queryExecutions.push('alert-rules');
    return {
      data: enabled ? mockAlertRules : undefined,
      isLoading: false,
      isError: false,
    } as never;
  });
  mockedUseDevices.mockImplementation((query: { deviceType?: string; keyword?: string }, options?: { enabled?: boolean }) => {
    const enabled = options?.enabled ?? true;
    if (enabled) queryExecutions.push('devices');
    if (!enabled) {
      return {
        data: undefined,
        isLoading: false,
        isError: false,
        fetchStatus: 'idle',
      } as never;
    }

    if (query.deviceType) {
      const keyword = query.keyword?.toLowerCase();
      const filtered = pumpDevices.filter((device) => {
        if (!keyword) return true;
        return device.name.toLowerCase().includes(keyword) || device.deviceCode.toLowerCase().includes(keyword);
      });

      return {
        data: buildPagedResult(filtered),
        isLoading: false,
        isError: false,
      } as never;
    }

    return {
      data: buildPagedResult(allDevices),
      isLoading: false,
      isError: false,
    } as never;
  });
  mockedUseDeviceComparison.mockImplementation((
    params: ComparisonQueryParamsContract,
    options?: QueryOptionsContract,
  ) => {
    if (isComparisonQueryEnabled(params, options)) queryExecutions.push('device-comparison');
    return {
      data: mockComparisonResult,
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as never;
  });
});

describe('DeviceComparisonPage 英文契约', () => {
  it('英文界面应显示标题、时间窗口与结果表头', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.selectOptions(screen.getByLabelText('Device type'), 'Pump');
    await user.type(screen.getByLabelText('Metric'), 'temperature');
    await user.click(screen.getByRole('checkbox', { name: /Pump 1/i }));
    await user.click(screen.getByRole('checkbox', { name: /Pump 2/i }));

    expect(screen.getByRole('heading', { level: 1, name: 'Device Comparison' })).toBeInTheDocument();
    expect(screen.getByLabelText('Window')).toHaveDisplayValue('24 hours');
    expect(screen.getByText('Group mean')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Device' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Code' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Average' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Latest' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Minimum' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Maximum' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Samples' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Z-Score' })).toBeInTheDocument();
  });

  it('应限制设备选择数量在 2 到 5 台之间，并在选满 5 台后禁用其余候选项', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.selectOptions(screen.getByLabelText('Device type'), 'Pump');

    for (const label of ['Pump 1', 'Pump 2', 'Pump 3', 'Pump 4', 'Pump 5']) {
      await user.click(screen.getByRole('checkbox', { name: label }));
    }

    expect(screen.getByText('Select 2 to 5 devices')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Pump 6' })).toBeDisabled();
  });

  it('应按设备类型过滤候选设备、提供指标建议 datalist，并显示预设时间窗口', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.selectOptions(screen.getByLabelText('Device type'), 'Pump');

    expect(screen.getByRole('checkbox', { name: 'Pump 1' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Fan 1' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Window')).toHaveTextContent('24 hours');
    expect(screen.getByLabelText('Window')).toHaveTextContent('72 hours');
    expect(screen.getByLabelText('Window')).toHaveTextContent('7 days');
    expect(screen.getByLabelText('Window')).toHaveTextContent('30 days');

    const metricInput = screen.getByLabelText('Metric') as HTMLInputElement;
    expect(metricInput.getAttribute('list')).toBeTruthy();

    const listId = metricInput.getAttribute('list')!;
    const suggestionList = document.getElementById(listId);
    expect(suggestionList).not.toBeNull();
    expect(suggestionList!.querySelector('option[value="temperature"]')).not.toBeNull();
    expect(suggestionList!.querySelector('option[value="vibration"]')).not.toBeNull();
  });

  it('对比查询加载中时应显示状态提示', async () => {
    mockedUseDeviceComparison.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isFetching: true,
      refetch: vi.fn(),
    } as never);

    await renderPage();

    expect(screen.getByRole('status')).toHaveTextContent('Loading comparison');
  });

  it('首次加载失败时应显示失败提示并可点击重试', async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();
    mockedUseDeviceComparison.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isFetching: false,
      refetch,
    } as never);

    await renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load comparison');
    await user.click(screen.getByRole('button', { name: 'Retry comparison' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('有缓存结果时刷新失败应保留旧结果并提示缓存错误', async () => {
    mockedUseDeviceComparison.mockReturnValue({
      data: mockComparisonResult,
      isLoading: false,
      isError: true,
      isFetching: false,
      refetch: vi.fn(),
    } as never);

    await renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to refresh comparison. Showing cached results.');
    expect(screen.getByText('Pump 1')).toBeInTheDocument();
    expect(screen.getByText('Pump 2')).toBeInTheDocument();
  });

  it('样本不足时应显示独立说明而不是成功空表', async () => {
    mockedUseDeviceComparison.mockReturnValue({
      data: {
        ...mockComparisonResult,
        devices: [],
        message: 'Not enough telemetry samples in the selected window.',
      },
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as never);

    await renderPage();

    expect(screen.getByText('Not enough telemetry samples in the selected window.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('成功结果应显示统计摘要、设备明细与异常标记', async () => {
    await renderPage();

    expect(screen.getByText('Group mean')).toBeInTheDocument();
    expect(screen.getByText('Standard deviation')).toBeInTheDocument();
    expect(screen.getByText('Pump 1')).toBeInTheDocument();
    expect(screen.getByText('Pump 2')).toBeInTheDocument();
    expect(screen.getAllByText('Outlier').length).toBeGreaterThan(0);
  });

  it('无权限时应显示明确提示并阻止设备、规则和对比查询执行', async () => {
    mockedUsePermission.mockReturnValue({
      ...allowReadPermission,
      canRead: false,
    });

    await renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('You do not have permission to view device comparison.');
    expect(queryExecutions).toEqual([]);
  });
});
