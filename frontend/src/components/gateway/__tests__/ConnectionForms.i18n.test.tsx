import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { fireEvent, render, screen } from '@testing-library/react';
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

  it('OPC UA 表单应解析配置并序列化端点、凭据和安全模式变更', async () => {
    render(
      <OpcUaConnectionForm
        value={'{"endpointUrl":"opc.tcp://plc:4840","securityMode":"Sign","username":"operator","password":"secret"}'}
        onChange={onChange}
      />,
    );

    expect(screen.getByDisplayValue('opc.tcp://plc:4840')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Endpoint URL'), { target: { value: 'opc.tcp://plc:4841' } });
    fireEvent.change(screen.getByLabelText('Username (optional)'), { target: { value: 'maintainer' } });
    fireEvent.change(screen.getByLabelText('Password (optional)'), { target: { value: 'new-secret' } });

    expect(onChange).toHaveBeenCalledWith(expect.stringContaining('opc.tcp://plc:4841'));
    expect(onChange).toHaveBeenCalledWith(expect.stringContaining('new-secret'));
  });

  it('Modbus TCP 表单应处理非法 JSON 并更新主机、端口和单元 ID', async () => {
    render(<ModbusTcpConnectionForm value="{invalid" onChange={onChange} />);

    expect(screen.getByLabelText('Host')).toHaveValue('127.0.0.1');
    fireEvent.change(screen.getByLabelText('Host'), { target: { value: '192.168.1.10' } });
    fireEvent.change(screen.getByLabelText('Port'), { target: { value: '1502' } });
    fireEvent.change(screen.getByLabelText('Unit ID'), { target: { value: '2' } });

    expect(onChange).toHaveBeenCalledWith(expect.stringContaining('192.168.1.10'));
    expect(onChange).toHaveBeenCalledWith(expect.stringContaining('1502'));
    expect(onChange).toHaveBeenCalledWith(expect.stringContaining('"unitId": 2'));
  });

  it('Modbus RTU 表单应解析串口配置并更新波特率、数据位、停止位和地址', async () => {
    const view = render(<ModbusRtuConnectionForm value={'{"port":"/dev/ttyS1","baudRate":19200,"dataBits":7,"parity":"Even","stopBits":2,"unitId":5}'} onChange={onChange} />);

    expect(screen.getByLabelText('Serial port')).toHaveValue('/dev/ttyS1');
    view.rerender(<ModbusRtuConnectionForm value="{}" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Serial port'), { target: { value: '/dev/ttyUSB2' } });
    fireEvent.change(screen.getByLabelText('Unit ID'), { target: { value: '10' } });

    expect(onChange).toHaveBeenCalledWith(expect.stringContaining('/dev/ttyUSB2'));
    expect(onChange).toHaveBeenCalledWith(expect.stringContaining('"unitId": 10'));
  });
});
