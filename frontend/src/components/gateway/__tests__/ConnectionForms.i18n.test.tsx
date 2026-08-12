import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import OpcUaConnectionForm from '../OpcUaConnectionForm';
import ModbusTcpConnectionForm from '../ModbusTcpConnectionForm';
import ModbusRtuConnectionForm from '../ModbusRtuConnectionForm';

const translations: Record<string, string> = {
  'gatewayWizard.opcuaEndpoint': 'Endpoint URL',
  'gatewayWizard.opcuaSecurity': 'Security mode',
  'gatewayWizard.securityNone': 'None (dev only)',
  'gatewayWizard.securitySign': 'Sign',
  'gatewayWizard.securitySignAndEncrypt': 'Sign & Encrypt (recommended)',
  'gatewayWizard.opcuaUsername': 'Username (optional)',
  'gatewayWizard.opcuaPassword': 'Password (optional)',
  'gatewayWizard.optionalPlaceholder': 'optional',
  'gatewayWizard.opcuaEndpointHint': 'OPC UA server endpoint URL, format: opc.tcp://host:port',
  'gatewayWizard.modbusHost': 'Host',
  'gatewayWizard.modbusPort': 'Port',
  'gatewayWizard.modbusUnitId': 'Unit ID',
  'gatewayWizard.modbusHostHint': 'IP address of the Modbus TCP device',
  'gatewayWizard.modbusPortHint': 'Default Modbus TCP port: 502',
  'gatewayWizard.modbusUnitHint': 'Modbus unit identifier (0-255)',
  'gatewayWizard.rtuPort': 'Serial port',
  'gatewayWizard.rtuBaudRate': 'Baud rate',
  'gatewayWizard.rtuDataBits': 'Data bits',
  'gatewayWizard.rtuStopBits': 'Stop bits',
  'gatewayWizard.rtuParity': 'Parity',
  'gatewayWizard.rtuPortHint': 'Linux: /dev/ttyUSB0, /dev/ttyS0 | Windows: COM1, COM2',
  'gatewayWizard.rtuUnitHint': 'Modbus RTU unit address (1-247)',
  'gatewayWizard.parityNone': 'None',
  'gatewayWizard.parityEven': 'Even',
  'gatewayWizard.parityOdd': 'Odd',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key,
  }),
}));

const onChange = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('设备接入连接表单英文界面', () => {
  it('OPC UA 端点说明应使用英文翻译资源', () => {
    render(<OpcUaConnectionForm value="{}" onChange={onChange} />);

    expect(screen.getByText('OPC UA server endpoint URL, format: opc.tcp://host:port')).toBeInTheDocument();
    expect(screen.queryByText('OPC UA 服务器端点地址，格式：opc.tcp://host:port')).not.toBeInTheDocument();
  });

  it('Modbus TCP 说明应使用英文翻译资源', () => {
    render(<ModbusTcpConnectionForm value="{}" onChange={onChange} />);

    expect(screen.getByText('IP address of the Modbus TCP device')).toBeInTheDocument();
    expect(screen.getByText('Default Modbus TCP port: 502')).toBeInTheDocument();
    expect(screen.getByText('Modbus unit identifier (0-255)')).toBeInTheDocument();
    expect(screen.queryByText('Modbus 从站单元标识符（0-255）')).not.toBeInTheDocument();
  });

  it('Modbus RTU 说明和校验位选项应使用英文翻译资源', async () => {
    const user = userEvent.setup();
    render(<ModbusRtuConnectionForm value="{}" onChange={onChange} />);

    expect(screen.getByText('Linux: /dev/ttyUSB0, /dev/ttyS0 | Windows: COM1, COM2')).toBeInTheDocument();
    expect(screen.getByText('Modbus RTU unit address (1-247)')).toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: 'Parity' }));
    expect(screen.getAllByText('None')).toHaveLength(2);
    expect(screen.getByText('Even')).toBeInTheDocument();
    expect(screen.getByText('Odd')).toBeInTheDocument();
    expect(screen.queryByText('无')).not.toBeInTheDocument();
    expect(screen.queryByText('偶')).not.toBeInTheDocument();
    expect(screen.queryByText('奇')).not.toBeInTheDocument();
  });
});
