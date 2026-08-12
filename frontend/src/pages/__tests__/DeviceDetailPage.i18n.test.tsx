import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DeviceDetailPage from '../DeviceDetailPage';
import { useDevice, useRefreshHealthScore, useUpdateDevice } from '../../hooks/useDevices';
import { useRecentTelemetry } from '../../hooks/useTelemetry';
import { useAlerts } from '../../hooks/useAlerts';
import {
  useCreateGatewayDevice,
  useDeleteGatewayDevice,
  useGatewayDevices,
  useTestConnection,
  useUpdateGatewayDevice,
} from '../../hooks/useGatewayDevices';
import { useGateways } from '../../hooks/useGateways';

const translations: Record<string, string> = {
  'common.loading': 'Loading',
  'common.noData': 'No data',
  'device.tabs.overview': 'Overview',
  'device.tabs.connection': 'Connection',
  'device.connection.title': 'Data Collection Config',
  'device.connection.createTitle': 'Create Data Collection Config',
  'device.connection.createDescription': 'Configure edge gateway collection parameters for this device.',
  'device.connection.protocol': 'Protocol',
  'device.connection.gatewayId': 'Gateway',
  'device.connection.pollInterval': 'Poll Interval',
  'device.connection.connectionConfig': 'Connection Config',
  'device.connection.dataPointMapping': 'Data Point Mapping',
  'device.connection.testConnection': 'Test Connection',
  'device.connection.createAndLink': 'Create & Link',
  'device.connection.gatewayPlaceholder': 'Select gateway (optional)',
  'device.connection.noOnlineGateway': 'No online gateways',
  'device.connection.gatewayHint': 'Select the edge gateway responsible for collecting this device data. Leave blank to use the default gateway.',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key,
  }),
}));

vi.mock('../../hooks/useDevices', () => ({
  useDevice: vi.fn(),
  useRefreshHealthScore: vi.fn(),
  useUpdateDevice: vi.fn(),
}));
vi.mock('../../hooks/useTelemetry', () => ({ useRecentTelemetry: vi.fn() }));
vi.mock('../../hooks/useAlerts', () => ({ useAlerts: vi.fn() }));
vi.mock('../../hooks/useGatewayDevices', () => ({
  useCreateGatewayDevice: vi.fn(),
  useDeleteGatewayDevice: vi.fn(),
  useGatewayDevices: vi.fn(),
  useTestConnection: vi.fn(),
  useUpdateGatewayDevice: vi.fn(),
}));
vi.mock('../../hooks/useGateways', () => ({ useGateways: vi.fn() }));
vi.mock('../../components/device/DeviceStatusBadge', () => ({ DeviceStatusBadge: () => null }));
vi.mock('../../components/charts/TrendChart', () => ({ TrendChart: () => null }));
vi.mock('../../components/dataquality/DataQualityOverview', () => ({ DataQualityOverviewCard: () => null }));
vi.mock('../../components/alert/SeverityBadge', () => ({ SeverityBadge: () => null }));

const mockedUseDevice = vi.mocked(useDevice);
const mockedUseRefreshHealthScore = vi.mocked(useRefreshHealthScore);
const mockedUseUpdateDevice = vi.mocked(useUpdateDevice);
const mockedUseRecentTelemetry = vi.mocked(useRecentTelemetry);
const mockedUseAlerts = vi.mocked(useAlerts);
const mockedUseGatewayDevices = vi.mocked(useGatewayDevices);
const mockedUseUpdateGatewayDevice = vi.mocked(useUpdateGatewayDevice);
const mockedUseDeleteGatewayDevice = vi.mocked(useDeleteGatewayDevice);
const mockedUseTestConnection = vi.mocked(useTestConnection);
const mockedUseCreateGatewayDevice = vi.mocked(useCreateGatewayDevice);
const mockedUseGateways = vi.mocked(useGateways);

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseDevice.mockReturnValue({
    data: {
      id: 'device-1',
      name: 'Pump 1',
      deviceCode: 'P-001',
      status: 'online',
    },
    isLoading: false,
  } as unknown as ReturnType<typeof useDevice>);
  mockedUseRefreshHealthScore.mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useRefreshHealthScore>);
  mockedUseUpdateDevice.mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useUpdateDevice>);
  mockedUseRecentTelemetry.mockReturnValue({ data: [] } as unknown as ReturnType<typeof useRecentTelemetry>);
  mockedUseAlerts.mockReturnValue({ data: { items: [] } } as unknown as ReturnType<typeof useAlerts>);
  mockedUseGatewayDevices.mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useGatewayDevices>);
  mockedUseUpdateGatewayDevice.mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useUpdateGatewayDevice>);
  mockedUseDeleteGatewayDevice.mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useDeleteGatewayDevice>);
  mockedUseTestConnection.mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useTestConnection>);
  mockedUseCreateGatewayDevice.mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useCreateGatewayDevice>);
  mockedUseGateways.mockReturnValue({ data: [] } as unknown as ReturnType<typeof useGateways>);
});

describe('设备详情连接配置英文界面', () => {
  it('网关选择提示应使用翻译资源而不是硬编码中文', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <DeviceDetailPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('tab', { name: 'Connection' }));

    expect(screen.getByText('Select gateway (optional)')).toBeInTheDocument();
    expect(screen.getByText('Select the edge gateway responsible for collecting this device data. Leave blank to use the default gateway.')).toBeInTheDocument();
    expect(screen.queryByText('选择网关（可选）')).not.toBeInTheDocument();
    expect(screen.queryByText('选择负责采集该设备数据的边缘网关，不选则使用默认网关')).not.toBeInTheDocument();
  });
});
