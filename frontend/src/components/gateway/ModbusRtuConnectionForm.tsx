import { useTranslation } from 'react-i18next';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

/** Modbus RTU 连接配置结构 */
interface ModbusRtuConfig {
  port: string;
  baudRate: number;
  dataBits: number;
  parity: string;
  stopBits: number;
  unitId: number;
}

interface ModbusRtuConnectionFormProps {
  value: string;
  onChange: (json: string) => void;
}

const BAUD_RATES = [9600, 19200, 38400, 57600, 115200];
const PARITY_OPTIONS = ['None', 'Even', 'Odd'];

/** Modbus RTU 结构化连接配置表单 */
export default function ModbusRtuConnectionForm({ value, onChange }: ModbusRtuConnectionFormProps) {
  const { t } = useTranslation();

  let config: ModbusRtuConfig = {
    port: '/dev/ttyUSB0',
    baudRate: 9600,
    dataBits: 8,
    parity: 'None',
    stopBits: 1,
    unitId: 1,
  };

  try {
    const parsed = JSON.parse(value);
    config = { ...config, ...parsed };
  } catch {
    // 使用默认值
  }

  const updateField = <K extends keyof ModbusRtuConfig>(field: K, val: ModbusRtuConfig[K]) => {
    const updated = { ...config, [field]: val };
    onChange(JSON.stringify(updated, null, 2));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="rtu-port">{t('gatewayWizard.rtuPort', '串口设备')}</Label>
        <Input
          id="rtu-port"
          value={config.port}
          onChange={(e) => updateField('port', e.target.value)}
          placeholder="/dev/ttyUSB0"
        />
        <p className="text-xs text-muted-foreground">
          {t('gatewayWizard.rtuPortHint')}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rtu-baudRate">{t('gatewayWizard.rtuBaudRate', '波特率')}</Label>
        <Select
          value={String(config.baudRate)}
          onValueChange={(v) => v && updateField('baudRate', Number(v))}
        >
          <SelectTrigger id="rtu-baudRate">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BAUD_RATES.map((rate) => (
              <SelectItem key={rate} value={String(rate)}>
                {rate}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rtu-dataBits">{t('gatewayWizard.rtuDataBits', '数据位')}</Label>
          <Select
            value={String(config.dataBits)}
            onValueChange={(v) => v && updateField('dataBits', Number(v))}
          >
            <SelectTrigger id="rtu-dataBits">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7</SelectItem>
              <SelectItem value="8">8</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rtu-parity">{t('gatewayWizard.rtuParity', '校验位')}</Label>
          <Select value={config.parity} onValueChange={(v) => v && updateField('parity', v)}>
            <SelectTrigger id="rtu-parity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PARITY_OPTIONS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p === 'None'
                    ? t('gatewayWizard.parityNone')
                    : p === 'Even'
                      ? t('gatewayWizard.parityEven')
                      : t('gatewayWizard.parityOdd')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rtu-stopBits">{t('gatewayWizard.rtuStopBits', '停止位')}</Label>
          <Select
            value={String(config.stopBits)}
            onValueChange={(v) => v && updateField('stopBits', Number(v))}
          >
            <SelectTrigger id="rtu-stopBits">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rtu-unitId">{t('gatewayWizard.modbusUnitId', '从站地址')}</Label>
        <Input
          id="rtu-unitId"
          type="number"
          min={1}
          max={247}
          value={config.unitId}
          onChange={(e) => updateField('unitId', Number(e.target.value))}
          placeholder="1"
        />
        <p className="text-xs text-muted-foreground">
          {t('gatewayWizard.rtuUnitHint')}
        </p>
      </div>
    </div>
  );
}
