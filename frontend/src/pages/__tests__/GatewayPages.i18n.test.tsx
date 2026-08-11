import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GatewayListPage from '../../pages/GatewayListPage';
import GatewayDevicesPage from '../../pages/GatewayDevicesPage';
import GatewayMonitorPage from '../../pages/GatewayMonitorPage';
import { useGateways } from '../../hooks/useGateways';
import {
  useDeleteGatewayDevice,
  useGatewayDevices,
  useTestConnection,
  useUpdateGatewayDevice,
} from '../../hooks/useGatewayDevices';
import { useGatewayStatus } from '../../hooks/useGatewayStatus';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ gatewayId: 'gateway-001' }),
  };
});

const translations: Record<string, string> = {
  'common.refresh': 'Refresh',
  'gateway.refresh': 'Refresh',
  'gateway.listTitle': 'Gateway management',
  'gateway.listDescription': 'View and manage all registered edge gateways',
  'gateway.deviceConfig': 'Device config',
  'gateway.createDevice': 'New device',
  'gateway.deviceCount': 'Devices',
  'gateway.version': 'Version',
  'gateway.address': 'Address',
  'gateway.lastHeartbeat': 'Last heartbeat',
  'gateway.monitor': 'Monitor',
  'gateway.statusOnline': 'Online',
  'gateway.statusOffline': 'Offline',
  'gateway.statusDisabled': 'Disabled',
  'gatewayDevices.title': 'Gateway device management',
  'gatewayDevices.description': 'Manage collection devices configured on the edge gateway',
  'gatewayDevices.refresh': 'Refresh',
  'gatewayDevices.monitor': 'Monitor dashboard',
  'gatewayDevices.create': 'New device',
  'gatewayDevices.empty': 'No gateway device configuration',
  'gatewayDevices.addFirst': 'Add first device',
  'gatewayMonitor.title': 'Gateway monitor',
  'gatewayMonitor.gatewayLabel': 'Gateway: {{id}}',
  'gatewayMonitor.description': 'Monitor edge gateway runtime status and collection metrics in real time',
  'gatewayMonitor.refresh': 'Refresh',
  'gatewayMonitor.deviceManagement': 'Device management',
  'gatewayMonitor.status': 'Gateway status',
  'gatewayMonitor.statusHealthy': 'Running',
  'gatewayMonitor.statusUnreachable': 'Unreachable',
  'gatewayMonitor.statusOffline': 'Offline',
  'gatewayMonitor.connectionInfo': 'Connection info',
  'gatewayMonitor.backendApi': 'Backend API',
  'gatewayMonitor.mqttBroker': 'MQTT broker',
  'gatewayMonitor.securityMode': 'Security mode',
  'gatewayMonitor.uploadStats': 'Upload statistics',
  'gatewayMonitor.configuredDevices': 'Configured devices',
  'gatewayMonitor.deviceCount': '{{count}} collection devices',
  'gatewayMonitor.noDevices': 'No device configuration',
  'gatewayMonitor.deviceName': 'Device name',
  'gatewayMonitor.protocol': 'Protocol',
  'gatewayMonitor.pollInterval': 'Poll interval',
  'gatewayMonitor.enabled': 'Enabled',
  'gatewayMonitor.disabled': 'Disabled',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>, options?: Record<string, unknown>) => {
      const template = String(translations[key] ?? (typeof fallback === 'string' ? fallback : key));
      const values = typeof fallback === 'object' && fallback !== null ? fallback : options;
      return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(values?.[name] ?? `{{${name}}}`));
    },
  }),
}));

vi.mock('../../hooks/useGateways', () => ({ useGateways: vi.fn() }));
vi.mock('../../hooks/useGatewayDevices', () => ({
  useGatewayDevices: vi.fn(),
  useDeleteGatewayDevice: vi.fn(),
  useUpdateGatewayDevice: vi.fn(),
  useTestConnection: vi.fn(),
}));
vi.mock('../../hooks/useGatewayStatus', () => ({ useGatewayStatus: vi.fn() }));

const mockedUseGateways = vi.mocked(useGateways);
const mockedUseGatewayDevices = vi.mocked(useGatewayDevices);
const mockedUseDeleteGatewayDevice = vi.mocked(useDeleteGatewayDevice);
const mockedUseUpdateGatewayDevice = vi.mocked(useUpdateGatewayDevice);
const mockedUseTestConnection = vi.mocked(useTestConnection);
const mockedUseGatewayStatus = vi.mocked(useGatewayStatus);

function renderPage(page: React.ReactNode) {
  return render(<MemoryRouter>{page}</MemoryRouter>);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseGateways.mockReturnValue({
    data: [{
      id: 'gateway-row-001',
      gatewayId: 'gateway-001',
      tenantId: 'tenant-001',
      name: 'Line Gateway',
      host: 'edgegateway',
      healthPort: 8081,
      status: 'online',
      version: '1.2.0',
      enabled: true,
      createdAt: '2026-08-12T00:00:00Z',
      deviceCount: 2,
    }],
    isLoading: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useGateways>);
  mockedUseGatewayDevices.mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useGatewayDevices>);
  mockedUseDeleteGatewayDevice.mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useDeleteGatewayDevice>);
  mockedUseUpdateGatewayDevice.mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useUpdateGatewayDevice>);
  mockedUseTestConnection.mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useTestConnection>);
  mockedUseGatewayStatus.mockReturnValue({
    data: { status: 'offline', gatewayId: 'gateway-001', message: 'Gateway is offline' },
    isLoading: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useGatewayStatus>);
});

describe('网关页面双语文案', () => {
  it('网关列表使用翻译后的刷新和在线状态文案', () => {
    renderPage(<GatewayListPage />);

    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('网关设备页面使用翻译后的标题和空状态文案', () => {
    renderPage(<GatewayDevicesPage />);

    expect(screen.getByRole('heading', { name: 'Gateway device management' })).toBeInTheDocument();
    expect(screen.getByText('No gateway device configuration')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add first device' })).toBeInTheDocument();
  });

  it('网关监控页面使用翻译后的状态和设备空状态文案', () => {
    renderPage(<GatewayMonitorPage />);

    expect(screen.getByRole('heading', { name: 'Gateway monitor' })).toBeInTheDocument();
    expect(screen.getAllByText('Offline').length).toBeGreaterThan(0);
    expect(screen.getByText('No device configuration')).toBeInTheDocument();
  });
});
