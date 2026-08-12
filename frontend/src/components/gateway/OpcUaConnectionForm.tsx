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

/** OPC UA 连接配置结构 */
interface OpcUaConfig {
  endpointUrl: string;
  securityMode: string;
  username: string;
  password: string;
}

interface OpcUaConnectionFormProps {
  value: string;
  onChange: (json: string) => void;
}

const SECURITY_MODES = ['None', 'Sign', 'SignAndEncrypt'];

/** OPC UA 结构化连接配置表单 */
export default function OpcUaConnectionForm({ value, onChange }: OpcUaConnectionFormProps) {
  const { t } = useTranslation();

  // 解析当前 JSON 值
  let config: OpcUaConfig = {
    endpointUrl: 'opc.tcp://localhost:4840',
    securityMode: 'None',
    username: '',
    password: '',
  };

  try {
    const parsed = JSON.parse(value);
    config = { ...config, ...parsed };
  } catch {
    // 使用默认值
  }

  /** 更新单个字段并序列化回 JSON */
  const updateField = (field: keyof OpcUaConfig, val: string) => {
    const updated = { ...config, [field]: val };
    onChange(JSON.stringify(updated, null, 2));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="opcua-endpoint">{t('gatewayWizard.opcuaEndpoint', '端点地址')}</Label>
        <Input
          id="opcua-endpoint"
          value={config.endpointUrl}
          onChange={(e) => updateField('endpointUrl', e.target.value)}
          placeholder="opc.tcp://192.168.1.100:4840"
        />
        <p className="text-xs text-muted-foreground">
          {t('gatewayWizard.opcuaEndpointHint')}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="opcua-security">{t('gatewayWizard.opcuaSecurity', '安全模式')}</Label>
        <Select value={config.securityMode} onValueChange={(v) => v && updateField('securityMode', v)}>
          <SelectTrigger id="opcua-security">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SECURITY_MODES.map((mode) => (
              <SelectItem key={mode} value={mode}>
                {mode === 'None'
                  ? t('gatewayWizard.securityNone', '无加密（开发）')
                  : mode === 'Sign'
                    ? t('gatewayWizard.securitySign', '仅签名')
                    : t('gatewayWizard.securitySignAndEncrypt', '签名+加密（推荐）')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="opcua-username">{t('gatewayWizard.opcuaUsername', '用户名（可选）')}</Label>
        <Input
          id="opcua-username"
          value={config.username}
          onChange={(e) => updateField('username', e.target.value)}
          placeholder={t('gatewayWizard.optionalPlaceholder', '可选')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="opcua-password">{t('gatewayWizard.opcuaPassword', '密码（可选）')}</Label>
        <Input
          id="opcua-password"
          type="password"
          value={config.password}
          onChange={(e) => updateField('password', e.target.value)}
          placeholder={t('gatewayWizard.optionalPlaceholder', '可选')}
        />
      </div>
    </div>
  );
}
