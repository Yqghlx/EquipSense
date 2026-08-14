import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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
  'device.refreshHealth': 'Refresh health',
  'device.basicInfo': 'Basic information',
  'device.healthScore': 'Health score',
  'device.name': 'Name',
  'device.type': 'Type',
  'device.model': 'Model',
  'device.manufacturer': 'Manufacturer',
  'device.criticality': 'Criticality',
  'device.serialNumber': 'Serial number',
  'device.installDate': 'Install date',
  'device.gatewayId': 'Gateway ID',
  'device.downtimeCostPerHour': 'Downtime cost per hour',
  'device.lastSeenAt': 'Last seen',
  'device.telemetryTrends': 'Telemetry trends',
  'device.recentAlerts': 'Recent alerts',
  'telemetry.temperature': 'Temperature',
  'telemetry.pressure': 'Pressure',
  'telemetry.vibration': 'Vibration',
  'telemetry.humidity': 'Humidity',
  'time.1hour': '1 hour',
  'time.6hours': '6 hours',
  'time.24hours': '24 hours',
  'time.7days': '7 days',
  'alert.alertCode': 'Alert code',
  'alert.metric': 'Metric',
  'alert.value': 'Value',
  'alert.severity': 'Severity',
  'common.status': 'Status',
  'common.time': 'Time',
  'common.edit': 'Edit',
  'common.delete': 'Delete',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.close': 'Close',
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

function renderDevicePage() {
  return render(
    <MemoryRouter initialEntries={['/devices/device-1']}>
      <Routes>
        <Route path="/devices/:id" element={<DeviceDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

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

  it('设备详情应覆盖加载、空态、健康度刷新和告警概览', async () => {
    const user = userEvent.setup();
    const refreshMutate = vi.fn();
    const updateMutate = vi.fn();
    mockedUseRefreshHealthScore.mockReturnValue({ mutate: refreshMutate, isPending: false } as unknown as ReturnType<typeof useRefreshHealthScore>);
    mockedUseUpdateDevice.mockReturnValue({ mutate: updateMutate, isPending: false } as unknown as ReturnType<typeof useUpdateDevice>);

    mockedUseDevice.mockReturnValue({ data: undefined, isLoading: true } as unknown as ReturnType<typeof useDevice>);
    const view = renderDevicePage();
    expect(screen.getByText('Loading')).toBeInTheDocument();

    mockedUseDevice.mockReturnValue({ data: undefined, isLoading: false } as unknown as ReturnType<typeof useDevice>);
    view.rerender(
      <MemoryRouter initialEntries={['/devices/device-1']}>
        <Routes>
          <Route path="/devices/:id" element={<DeviceDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('No data')).toBeInTheDocument();

    mockedUseDevice.mockReturnValue({
      data: {
        id: 'device-1',
        name: 'Pump 1',
        deviceCode: 'P-001',
        status: 'online',
        type: 'Pump',
        model: 'PX-100',
        manufacturer: 'Equip',
        criticality: 'Normal',
        serialNumber: 'SN-001',
        installDate: '2026-01-01',
        gatewayId: 'gateway-1',
        downtimeCostPerHour: 12.5,
        lastSeenAt: '2026-08-12T09:00:00Z',
        healthScore: 88,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useDevice>);
    mockedUseRecentTelemetry.mockReturnValue({
      data: [{ time: '2026-08-12T09:00:00Z', value: 72 }],
    } as unknown as ReturnType<typeof useRecentTelemetry>);
    mockedUseAlerts.mockReturnValue({
      data: {
        items: [{
          id: 'alert-1',
          alertCode: 'ALT-001',
          metric: 'temperature',
          value: 88,
          severity: 'High',
          status: 'Active',
          occurredAt: '2026-08-12T09:00:00Z',
        }],
      },
    } as unknown as ReturnType<typeof useAlerts>);
    view.rerender(
      <MemoryRouter initialEntries={['/devices/device-1']}>
        <Routes>
          <Route path="/devices/:id" element={<DeviceDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Pump 1' })).toBeInTheDocument();
    expect(screen.getByText('ALT-001')).toBeInTheDocument();
    expect(screen.getByText('88.0')).toBeInTheDocument();
    await user.click(screen.getByTitle('Refresh health'));
    expect(refreshMutate).toHaveBeenCalledWith('device-1');
  });

  it('已有关联配置时应支持启停、测试、编辑和删除', async () => {
    const user = userEvent.setup();
    const updateMutate = vi.fn((_payload: unknown, options?: { onSettled?: () => void }) => options?.onSettled?.());
    const deleteMutate = vi.fn((_id: string, options?: { onSettled?: () => void }) => options?.onSettled?.());
    const testMutate = vi.fn((_payload: unknown, options?: { onSuccess?: (result: { success: boolean; message: string }) => void }) => {
      options?.onSuccess?.({ success: true, message: 'Connection OK' });
    });
    mockedUseGatewayDevices.mockReturnValue({
      data: [{
        id: 'gateway-device-1',
        deviceId: 'device-1',
        deviceName: 'Pump 1',
        protocol: 'opcua',
        connectionConfig: '{"endpoint":"opc.tcp://localhost:4840"}',
        dataPoints: '{"temperature":"ns=2;s=temperature"}',
        pollIntervalMs: 1000,
        enabled: true,
        gatewayId: 'gateway-1',
        createdAt: '2026-08-12T00:00:00Z',
      }],
      isLoading: false,
    } as unknown as ReturnType<typeof useGatewayDevices>);
    mockedUseUpdateGatewayDevice.mockReturnValue({ mutate: updateMutate, isPending: false } as unknown as ReturnType<typeof useUpdateGatewayDevice>);
    mockedUseDeleteGatewayDevice.mockReturnValue({ mutate: deleteMutate, isPending: false } as unknown as ReturnType<typeof useDeleteGatewayDevice>);
    mockedUseTestConnection.mockReturnValue({ mutate: testMutate, isPending: false } as unknown as ReturnType<typeof useTestConnection>);

    renderDevicePage();
    await user.click(screen.getByRole('tab', { name: 'Connection' }));
    expect(screen.getByText('OPC UA')).toBeInTheDocument();
    expect(screen.getByText('1000ms').closest('div')).not.toBeNull();

    await user.click(screen.getByRole('switch'));
    expect(updateMutate).toHaveBeenCalledWith({ id: 'gateway-device-1', enabled: false });
    await user.click(screen.getByRole('button', { name: 'Test Connection' }));
    expect(screen.getByText('Connection OK')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const editDialog = screen.getByRole('dialog');
    const editInputs = within(editDialog).getAllByRole('textbox');
    await user.clear(editInputs[0]);
    await user.type(editInputs[0], 'Pump 1 Updated');
    await user.click(within(editDialog).getByRole('button', { name: 'Save' }));
    expect(updateMutate).toHaveBeenCalledWith(expect.objectContaining({
      id: 'gateway-device-1',
      deviceName: 'Pump 1 Updated',
    }), expect.any(Object));

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    const deleteDialog = screen.getByRole('dialog');
    await user.click(within(deleteDialog).getByRole('button', { name: 'Delete' }));
    expect(deleteMutate).toHaveBeenCalledWith('gateway-device-1', expect.any(Object));
  });

  it('未关联配置时应切换协议并创建连接', async () => {
    const user = userEvent.setup();
    const createMutate = vi.fn();
    mockedUseCreateGatewayDevice.mockReturnValue({ mutate: createMutate, isPending: false } as unknown as ReturnType<typeof useCreateGatewayDevice>);
    mockedUseGateways.mockReturnValue({
      data: [{ gatewayId: 'gateway-1', name: 'Gateway 1', status: 'online' }],
    } as unknown as ReturnType<typeof useGateways>);
    renderDevicePage();

    await user.click(screen.getByRole('tab', { name: 'Connection' }));
    await user.click(screen.getByRole('button', { name: 'Modbus TCP' }));
    await user.click(screen.getByRole('button', { name: 'Create & Link' }));

    expect(createMutate).toHaveBeenCalledWith(expect.objectContaining({
      deviceId: 'device-1',
      deviceName: 'Pump 1',
      protocol: 'modbus-tcp',
      pollIntervalMs: 3000,
    }));
  });
});
