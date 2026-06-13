import { useTranslation } from 'react-i18next';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

/** Modbus TCP 连接配置结构 */
interface ModbusTcpConfig {
  host: string;
  port: number;
  unitId: number;
}

interface ModbusTcpConnectionFormProps {
  value: string;
  onChange: (json: string) => void;
}

/** Modbus TCP 结构化连接配置表单 */
export default function ModbusTcpConnectionForm({ value, onChange }: ModbusTcpConnectionFormProps) {
  const { t } = useTranslation();

  let config: ModbusTcpConfig = {
    host: '127.0.0.1',
    port: 502,
    unitId: 1,
  };

  try {
    const parsed = JSON.parse(value);
    config = { ...config, ...parsed };
  } catch {
    // 使用默认值
  }

  const updateField = <K extends keyof ModbusTcpConfig>(field: K, val: ModbusTcpConfig[K]) => {
    const updated = { ...config, [field]: val };
    onChange(JSON.stringify(updated, null, 2));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="modbus-host">{t('gatewayWizard.modbusHost', '主机地址')}</Label>
        <Input
          id="modbus-host"
          value={config.host}
          onChange={(e) => updateField('host', e.target.value)}
          placeholder="192.168.1.100"
        />
        <p className="text-xs text-muted-foreground">
          Modbus TCP 设备的 IP 地址
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="modbus-port">{t('gatewayWizard.modbusPort', '端口')}</Label>
        <Input
          id="modbus-port"
          type="number"
          min={1}
          max={65535}
          value={config.port}
          onChange={(e) => updateField('port', Number(e.target.value))}
          placeholder="502"
        />
        <p className="text-xs text-muted-foreground">
          Modbus TCP 默认端口 502
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="modbus-unitId">{t('gatewayWizard.modbusUnitId', '单元 ID')}</Label>
        <Input
          id="modbus-unitId"
          type="number"
          min={0}
          max={255}
          value={config.unitId}
          onChange={(e) => updateField('unitId', Number(e.target.value))}
          placeholder="1"
        />
        <p className="text-xs text-muted-foreground">
          Modbus 从站单元标识符（0-255）
        </p>
      </div>
    </div>
  );
}
