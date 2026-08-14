import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, within } from '@testing-library/react';
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
  'gateway.noGateways': 'No gateways',
  'gateway.noGatewaysHint': 'Register an edge gateway to get started',
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
  'gatewayDevices.listTitle': 'Configured devices',
  'gatewayDevices.configuredCount': '{{count}} configured devices',
  'gatewayDevices.deviceName': 'Device name',
  'gatewayDevices.protocol': 'Protocol',
  'gatewayDevices.pollInterval': 'Poll interval',
  'gatewayDevices.dataPointCount': 'Data points',
  'gatewayDevices.status': 'Status',
  'gatewayDevices.createdAt': 'Created at',
  'gatewayDevices.actions': 'Actions',
  'gatewayDevices.enabled': 'Enabled',
  'gatewayDevices.disabled': 'Disabled',
  'gatewayDevices.testSuccess': 'Connection succeeded',
  'gatewayDevices.testError': 'Connection failed',
  'gatewayDevices.testFailed': 'Connection test failed',
  'gatewayDevices.dismissResult': 'Dismiss',
  'gatewayDevices.deleteTitle': 'Delete gateway device',
  'gatewayDevices.deleteDescription': 'This action cannot be undone.',
  'gatewayDevices.editTitle': 'Edit gateway device',
  'gatewayDevices.editDescription': 'Update the collection configuration.',
  'gatewayDevices.pollIntervalLabel': 'Poll interval (ms)',
  'gatewayDevices.connectionConfig': 'Connection configuration',
  'gatewayDevices.dataPoints': 'Data points configuration',
  'common.testConnection': 'Test connection',
  'common.edit': 'Edit',
  'common.delete': 'Delete',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
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

  it('网关列表应支持刷新、设备配置、创建设备和监控跳转', async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();
    mockedUseGateways.mockReturnValue({
      data: [{
        id: 'gateway-row-002',
        gatewayId: 'gateway-002',
        tenantId: 'tenant-001',
        name: 'Assembly Gateway',
        host: '10.0.0.2',
        healthPort: 8081,
        status: 'online',
        version: undefined,
        enabled: true,
        createdAt: '2026-08-12T00:00:00Z',
        lastHeartbeatAt: '2026-08-12T01:00:00Z',
        deviceCount: 4,
      }],
      isLoading: false,
      refetch,
    } as unknown as ReturnType<typeof useGateways>);
    renderPage(<GatewayListPage />);

    expect(screen.getByText('Assembly Gateway')).toBeInTheDocument();
    expect(screen.getByText('gateway-002')).toBeInTheDocument();
    expect(screen.getByText('10.0.0.2:8081')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(refetch).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Device config' }));
    expect(mockNavigate).toHaveBeenCalledWith('/gateway/devices');
    await user.click(screen.getByRole('button', { name: 'New device' }));
    expect(mockNavigate).toHaveBeenCalledWith('/device-setup');
    await user.click(screen.getByRole('button', { name: 'Monitor' }));
    expect(mockNavigate).toHaveBeenCalledWith('/gateways/gateway-002');
  });

  it('网关离线、禁用和未知状态应展示对应徽标并禁用离线监控', () => {
    mockedUseGateways.mockReturnValue({
      data: [
        { id: 'gw-offline', gatewayId: 'gw-offline', tenantId: 'tenant-001', name: 'Offline gateway', host: 'offline', healthPort: 8081, status: 'offline', enabled: true, deviceCount: 0 },
        { id: 'gw-disabled', gatewayId: 'gw-disabled', tenantId: 'tenant-001', name: 'Disabled gateway', host: 'disabled', healthPort: 8081, status: 'disabled', enabled: false, deviceCount: 0 },
        { id: 'gw-unknown', gatewayId: 'gw-unknown', tenantId: 'tenant-001', name: 'Unknown gateway', host: 'unknown', healthPort: 8081, status: 'maintenance', enabled: true, deviceCount: 0 },
      ],
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useGateways>);
    renderPage(<GatewayListPage />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    expect(screen.getAllByText('common.status').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Monitor' })[0]).toBeDisabled();
  });

  it('网关加载中和无数据时应展示对应状态', () => {
    mockedUseGateways.mockReturnValue({ data: undefined, isLoading: true, refetch: vi.fn() } as unknown as ReturnType<typeof useGateways>);
    const view = renderPage(<GatewayListPage />);
    expect(document.querySelector('svg.lucide-loader-circle')).toBeInTheDocument();

    mockedUseGateways.mockReturnValue({ data: [], isLoading: false, refetch: vi.fn() } as unknown as ReturnType<typeof useGateways>);
    view.rerender(<MemoryRouter><GatewayListPage /></MemoryRouter>);
    expect(screen.getByText('No gateways')).toBeInTheDocument();
    expect(screen.getByText('Register an edge gateway to get started')).toBeInTheDocument();
  });

  it('网关设备页面使用翻译后的标题和空状态文案', () => {
    renderPage(<GatewayDevicesPage />);

    expect(screen.getByRole('heading', { name: 'Gateway device management' })).toBeInTheDocument();
    expect(screen.getByText('No gateway device configuration')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add first device' })).toBeInTheDocument();
  });

  it('网关设备列表应支持刷新、跳转、启停、连接测试、编辑和删除', async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();
    const updateMutate = vi.fn();
    const deleteMutate = vi.fn((_id: string, options?: { onSettled?: () => void }) => options?.onSettled?.());
    const testMutate = vi.fn((_payload: unknown, options?: { onSuccess?: (result: { success: boolean; message: string }) => void }) => {
      options?.onSuccess?.({ success: true, message: 'Connection OK' });
    });
    mockedUseGatewayDevices.mockReturnValue({
      data: [{
        id: 'gateway-device-001',
        deviceId: 'device-001',
        deviceName: 'Pump 1',
        protocol: 'opcua',
        connectionConfig: '{"endpoint":"opc.tcp://localhost:4840"}',
        dataPoints: '{"temperature":"ns=2;s=temperature","pressure":"ns=2;s=pressure"}',
        pollIntervalMs: 1000,
        enabled: true,
        gatewayId: 'gateway-001',
        createdAt: '2026-08-12T00:00:00Z',
      }],
      isLoading: false,
      refetch,
    } as unknown as ReturnType<typeof useGatewayDevices>);
    mockedUseUpdateGatewayDevice.mockReturnValue({ mutate: updateMutate, isPending: false } as unknown as ReturnType<typeof useUpdateGatewayDevice>);
    mockedUseDeleteGatewayDevice.mockReturnValue({ mutate: deleteMutate, isPending: false } as unknown as ReturnType<typeof useDeleteGatewayDevice>);
    mockedUseTestConnection.mockReturnValue({ mutate: testMutate, isPending: false } as unknown as ReturnType<typeof useTestConnection>);

    renderPage(<GatewayDevicesPage />);

    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(refetch).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Monitor dashboard' }));
    expect(mockNavigate).toHaveBeenCalledWith('/gateway/monitor');
    await user.click(screen.getByRole('button', { name: 'New device' }));
    expect(mockNavigate).toHaveBeenCalledWith('/device-setup');

    expect(screen.getByText('Pump 1')).toBeInTheDocument();
    expect(screen.getByText('OPC UA')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    await user.click(screen.getByRole('switch'));
    expect(updateMutate).toHaveBeenCalledWith({ id: 'gateway-device-001', enabled: false });

    await user.click(screen.getByTitle('Test connection'));
    expect(testMutate).toHaveBeenCalledWith(
      { protocol: 'opcua', connectionConfig: '{"endpoint":"opc.tcp://localhost:4840"}' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
    expect(screen.getByText('Connection OK')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Connection OK')).not.toBeInTheDocument();

    await user.click(screen.getByTitle('Edit'));
    const editDialog = screen.getByRole('dialog');
    const editFields = within(editDialog).getAllByRole('textbox');
    await user.clear(editFields[0]);
    await user.type(editFields[0], 'Pump 1 updated');
    const pollIntervalField = within(editDialog).getByRole('spinbutton');
    await user.clear(pollIntervalField);
    await user.type(pollIntervalField, '2000');
    await user.click(within(editDialog).getByRole('button', { name: 'Save' }));
    expect(updateMutate).toHaveBeenCalledWith({
      id: 'gateway-device-001',
      deviceName: 'Pump 1 updated',
      connectionConfig: '{"endpoint":"opc.tcp://localhost:4840"}',
      dataPoints: '{"temperature":"ns=2;s=temperature","pressure":"ns=2;s=pressure"}',
      pollIntervalMs: 2000,
    }, expect.objectContaining({ onSettled: expect.any(Function) }));

    await user.click(screen.getByTitle('Delete'));
    const deleteDialog = screen.getByRole('dialog');
    await user.click(within(deleteDialog).getByRole('button', { name: 'Delete' }));
    expect(deleteMutate).toHaveBeenCalledWith('gateway-device-001', expect.objectContaining({ onSettled: expect.any(Function) }));
  });

  it('网关设备连接测试失败时应显示失败结果，非法数据点配置应回退为零', async () => {
    const user = userEvent.setup();
    const testMutate = vi.fn((_payload: unknown, options?: { onError?: () => void }) => options?.onError?.());
    mockedUseGatewayDevices.mockReturnValue({
      data: [{
        id: 'gateway-device-002',
        deviceId: 'device-002',
        deviceName: 'Valve 2',
        protocol: 'custom',
        connectionConfig: '{}',
        dataPoints: '{invalid-json',
        pollIntervalMs: 500,
        enabled: false,
        gatewayId: 'gateway-001',
        createdAt: '2026-08-12T00:00:00Z',
      }],
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useGatewayDevices>);
    mockedUseTestConnection.mockReturnValue({ mutate: testMutate, isPending: false } as unknown as ReturnType<typeof useTestConnection>);

    renderPage(<GatewayDevicesPage />);

    expect(screen.getByText('custom')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
    await user.click(screen.getByTitle('Test connection'));
    expect(screen.getByText('Connection test failed')).toBeInTheDocument();
  });

  it('网关监控页面使用翻译后的状态和设备空状态文案', () => {
    renderPage(<GatewayMonitorPage />);

    expect(screen.getByRole('heading', { name: 'Gateway monitor' })).toBeInTheDocument();
    expect(screen.getAllByText('Offline').length).toBeGreaterThan(0);
    expect(screen.getByText('No device configuration')).toBeInTheDocument();
  });
});
