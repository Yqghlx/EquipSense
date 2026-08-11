import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Loader2, Network, Radio, Plug, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { useTestConnection, useCreateGatewayDevice } from '../hooks/useGatewayDevices';
import OpcUaConnectionForm from '../components/gateway/OpcUaConnectionForm';
import ModbusTcpConnectionForm from '../components/gateway/ModbusTcpConnectionForm';
import ModbusRtuConnectionForm from '../components/gateway/ModbusRtuConnectionForm';

// =============================================================================
// 协议类型与配置
// =============================================================================

/** 支持的协议类型 */
type Protocol = 'opcua' | 'modbus-tcp' | 'modbus-rtu';

/** 协议元数据，用于渲染选择卡片 */
interface ProtocolOption {
  key: Protocol;
  label: string;
  description: string;
  icon: React.ReactNode;
}

/** 数据点行 */
interface DataPointRow {
  /** 唯一标识（用于 React key） */
  id: number;
  /** 指标地址/节点路径 */
  address: string;
  /** 指标名称 */
  metric: string;
  /** 数据类型 */
  dataType: string;
}

// =============================================================================
// 向导步骤与默认值
// =============================================================================

/** 向导步骤枚举 */
type WizardStep = 'protocol' | 'connection' | 'dataPoints' | 'review';

/** OPC UA 连接配置默认值 */
const DEFAULT_OPC_UA_CONFIG = JSON.stringify(
  { endpointUrl: 'opc.tcp://localhost:4840', securityMode: 'None', username: '', password: '' },
  null,
  2,
);

/** Modbus TCP 连接配置默认值 */
const DEFAULT_MODBUS_TCP_CONFIG = JSON.stringify(
  { host: '127.0.0.1', port: 502, unitId: 1 },
  null,
  2,
);

/** Modbus RTU 连接配置默认值 */
const DEFAULT_MODBUS_RTU_CONFIG = JSON.stringify(
  { port: '/dev/ttyUSB0', baudRate: 9600, dataBits: 8, stopBits: 1, parity: 'None', unitId: 1 },
  null,
  2,
);

/** 数据类型选项 */
const DATA_TYPE_OPTIONS = ['float', 'int32', 'uint32', 'int16', 'uint16', 'bool', 'string'];

// =============================================================================
// 组件
// =============================================================================

/**
 * 设备接入向导页面
 *
 * 四步式引导流程：
 * 1. 选择通信协议 — OPC UA / Modbus TCP / Modbus RTU
 * 2. 连接配置 — 根据协议动态展示配置表单 + 测试连接
 * 3. 数据点配置 — 添加/删除需要采集的指标
 * 4. 确认保存 — 预览全部配置后提交
 */
export default function DeviceSetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // ---- 向导状态 ----
  const [step, setStep] = useState<WizardStep>('protocol');
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [connectionConfig, setConnectionConfig] = useState('');

  const [deviceName, setDeviceName] = useState('');
  const [pollIntervalMs, setPollIntervalMs] = useState(1000);
  const [dataPoints, setDataPoints] = useState<DataPointRow[]>([
    { id: 1, address: '', metric: '', dataType: 'float' },
  ]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ---- Mutations ----
  const testConnection = useTestConnection();
  const createDevice = useCreateGatewayDevice();

  // ===========================================================================
  // 步骤定义
  // ===========================================================================

  const steps: { key: WizardStep; label: string; index: number }[] = [
    { key: 'protocol', label: t('gatewayWizard.stepProtocol'), index: 0 },
    { key: 'connection', label: t('gatewayWizard.stepConnection'), index: 1 },
    { key: 'dataPoints', label: t('gatewayWizard.stepDataPoints'), index: 2 },
    { key: 'review', label: t('gatewayWizard.stepReview'), index: 3 },
  ];

  const currentStepIndex = steps.find((s) => s.key === step)!.index;

  // ===========================================================================
  // 协议选项
  // ===========================================================================

  const protocolOptions: ProtocolOption[] = [
    {
      key: 'opcua',
      label: 'OPC UA',
      description: t('gatewayWizard.protocolOpcUaDesc'),
      icon: <Network className="h-8 w-8 text-blue-500" />,
    },
    {
      key: 'modbus-tcp',
      label: 'Modbus TCP',
      description: t('gatewayWizard.protocolModbusTcpDesc'),
      icon: <Radio className="h-8 w-8 text-green-500" />,
    },
    {
      key: 'modbus-rtu',
      label: 'Modbus RTU',
      description: t('gatewayWizard.protocolModbusRtuDesc'),
      icon: <Plug className="h-8 w-8 text-orange-500" />,
    },
  ];

  // ===========================================================================
  // 导航
  // ===========================================================================

  /** 前进到下一步 */
  const goNext = () => {
    if (step === 'protocol') {
      // 切换协议时重置配置和测试状态
      if (selectedProtocol === 'opcua') setConnectionConfig(DEFAULT_OPC_UA_CONFIG);
      else if (selectedProtocol === 'modbus-tcp') setConnectionConfig(DEFAULT_MODBUS_TCP_CONFIG);
      else if (selectedProtocol === 'modbus-rtu') setConnectionConfig(DEFAULT_MODBUS_RTU_CONFIG);
      setStep('connection');
    } else if (step === 'connection') {
      setStep('dataPoints');
    } else if (step === 'dataPoints') {
      setStep('review');
    }
  };

  /** 后退到上一步 */
  const goBack = () => {
    if (step === 'review') setStep('dataPoints');
    else if (step === 'dataPoints') setStep('connection');
    else if (step === 'connection') setStep('protocol');
  };

  // ===========================================================================
  // 表单验证
  // ===========================================================================

  /** 当前步骤是否可以继续 */
  const canProceed = (): boolean => {
    if (step === 'protocol') return selectedProtocol !== null;
    if (step === 'connection') return connectionConfig.trim().length > 0;
    if (step === 'dataPoints')
      return deviceName.trim().length > 0 && dataPoints.some((dp) => dp.address.trim() && dp.metric.trim());
    return true; // review 步骤始终可提交
  };

  // ===========================================================================
  // 连接测试
  // ===========================================================================

  /** 测试连接是否成功 */
  const handleTestConnection = async () => {
    try {
      await testConnection.mutateAsync({
        protocol: selectedProtocol!,
        connectionConfig,
      });
    } catch {
      // 测试失败由 mutation 状态体现
    }
  };

  // ===========================================================================
  // 数据点增删
  // ===========================================================================

  /** 添加一行空数据点 */
  const addDataPoint = () => {
    setDataPoints((prev) => [
      ...prev,
      { id: nextId, address: '', metric: '', dataType: 'float' },
    ]);
    setNextId((prev) => prev + 1);
  };

  /** 删除指定数据点 */
  const removeDataPoint = (id: number) => {
    setDataPoints((prev) => prev.filter((dp) => dp.id !== id));
  };

  /** 更新指定数据点字段 */
  const updateDataPoint = (id: number, field: keyof DataPointRow, value: string) => {
    setDataPoints((prev) =>
      prev.map((dp) => (dp.id === id ? { ...dp, [field]: value } : dp)),
    );
  };

  /** 数据点自增 ID */
  const [nextId, setNextId] = useState(2);

  // ===========================================================================
  // 提交创建
  // ===========================================================================

  /** 提交创建网关设备 */
  const handleSubmit = async () => {
    setSubmitError(null);
    try {
      await createDevice.mutateAsync({
        deviceName: deviceName.trim(),
        protocol: selectedProtocol!,
        connectionConfig,
        dataPoints: JSON.stringify(
          dataPoints.filter((dp) => dp.address.trim() && dp.metric.trim()),
        ),
        pollIntervalMs,
      });
      navigate('/devices');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('common.error');
      setSubmitError(message);
    }
  };

  // ===========================================================================
  // 渲染：步骤进度指示器
  // ===========================================================================

  const renderStepper = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, idx) => (
        <div key={s.key} className="flex items-center gap-2">
          {/* 步骤圆圈 */}
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
              idx < currentStepIndex
                ? 'bg-primary text-primary-foreground'
                : idx === currentStepIndex
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {idx < currentStepIndex ? <Check className="h-4 w-4" /> : idx + 1}
          </div>
          {/* 步骤标签 */}
          <span
            className={`text-sm ${
              idx === currentStepIndex ? 'font-medium text-foreground' : 'text-muted-foreground'
            }`}
          >
            {s.label}
          </span>
          {/* 连接线（最后一步不显示） */}
          {idx < steps.length - 1 && <div className="w-12 h-0.5 bg-muted mx-2" />}
        </div>
      ))}
    </div>
  );

  // ===========================================================================
  // 渲染：步骤 1 — 选择协议
  // ===========================================================================

  const renderProtocolStep = () => (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground text-center">
        {t('gatewayWizard.selectProtocolHint')}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {protocolOptions.map((opt) => (
          <Card
            key={opt.key}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedProtocol === opt.key ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedProtocol(opt.key)}
          >
            <CardHeader className="pb-2 text-center">
              <div className="flex justify-center mb-2">{opt.icon}</div>
              <CardTitle className="text-base">{opt.label}</CardTitle>
              <CardDescription className="text-xs">{opt.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {selectedProtocol && (
        <p className="text-sm text-muted-foreground text-center">
          {t('gatewayWizard.selectedProtocol', {
            name: protocolOptions.find((p) => p.key === selectedProtocol)?.label,
          })}
        </p>
      )}
    </div>
  );

  // ===========================================================================
  // 渲染：步骤 2 — 连接配置 + 测试
  // ===========================================================================

  const renderConnectionStep = () => (
    <div className="max-w-xl mx-auto space-y-6">
      {/* 协议标签 */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary">
          {protocolOptions.find((p) => p.key === selectedProtocol)?.label}
        </Badge>
      </div>

      {/* 连接配置 — 根据协议类型渲染对应的结构化表单 */}
      <div className="space-y-2">
        <Label>{t('gatewayWizard.connectionConfig')}</Label>
        {selectedProtocol === 'opcua' && (
          <OpcUaConnectionForm value={connectionConfig} onChange={setConnectionConfig} />
        )}
        {selectedProtocol === 'modbus-tcp' && (
          <ModbusTcpConnectionForm value={connectionConfig} onChange={setConnectionConfig} />
        )}
        {selectedProtocol === 'modbus-rtu' && (
          <ModbusRtuConnectionForm value={connectionConfig} onChange={setConnectionConfig} />
        )}
      </div>

      {/* 采集间隔 */}
      <div className="space-y-2">
        <Label htmlFor="pollInterval">{t('gatewayWizard.pollInterval')}</Label>
        <Input
          id="pollInterval"
          type="number"
          min={100}
          step={100}
          value={pollIntervalMs}
          onChange={(e) => setPollIntervalMs(Number(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">
          {t('gatewayWizard.pollIntervalHint')}
        </p>
      </div>

      {/* 测试连接按钮与结果 */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={handleTestConnection}
          disabled={testConnection.isPending}
        >
          {testConnection.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('gatewayWizard.testConnection')}
        </Button>

        {testConnection.data && (
          <span
            className={`text-sm font-medium ${
              testConnection.data.success ? 'text-green-600' : 'text-destructive'
            }`}
          >
            {testConnection.data.message}
          </span>
        )}
        {testConnection.isError && (
          <span className="text-sm font-medium text-destructive">
            {t('gatewayWizard.testFailed')}
          </span>
        )}
      </div>
    </div>
  );

  // ===========================================================================
  // 渲染：步骤 3 — 数据点配置 + 设备名称
  // ===========================================================================

  const renderDataPointsStep = () => (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 设备名称 */}
      <div className="space-y-2">
        <Label htmlFor="gatewayDeviceName">{t('gatewayWizard.deviceName')} *</Label>
        <Input
          id="gatewayDeviceName"
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
          placeholder={t('gatewayWizard.deviceNamePlaceholder')}
        />
      </div>

      <p className="text-sm text-muted-foreground">{t('gatewayWizard.dataPointsHint')}</p>

      {/* 数据点列表 */}
      {dataPoints.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground border rounded-md border-dashed">
          {t('gatewayWizard.noDataPoints')}
        </div>
      ) : (
        <div className="space-y-3">
          {/* 表头 */}
          <div className="grid grid-cols-[1fr_1fr_140px_40px] gap-3 px-3 text-xs font-medium text-muted-foreground">
            <span>{t('gatewayWizard.address')}</span>
            <span>{t('gatewayWizard.metric')}</span>
            <span>{t('gatewayWizard.dataType')}</span>
            <span />
          </div>

          {dataPoints.map((dp) => (
            <div key={dp.id} className="grid grid-cols-[1fr_1fr_140px_40px] gap-3 items-center">
              {/* 地址/节点路径 */}
              <Input
                value={dp.address}
                onChange={(e) => updateDataPoint(dp.id, 'address', e.target.value)}
                placeholder={
                  selectedProtocol === 'opcua'
                    ? 'ns=2;s=Temperature'
                    : '40001'
                }
              />
              {/* 指标名称 */}
              <Input
                value={dp.metric}
                onChange={(e) => updateDataPoint(dp.id, 'metric', e.target.value)}
                placeholder="temperature"
              />
              {/* 数据类型 */}
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={dp.dataType}
                onChange={(e) => updateDataPoint(dp.id, 'dataType', e.target.value)}
              >
                {DATA_TYPE_OPTIONS.map((dt) => (
                  <option key={dt} value={dt}>
                    {dt}
                  </option>
                ))}
              </select>
              {/* 删除按钮 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeDataPoint(dp.id)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* 添加数据点按钮 */}
      <Button variant="outline" onClick={addDataPoint} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        {t('gatewayWizard.addDataPoint')}
      </Button>
    </div>
  );

  // ===========================================================================
  // 渲染：步骤 4 — 确认保存
  // ===========================================================================

  const renderReviewStep = () => {
    /** 安全解析 JSON 字符串用于展示 */
    const safeParse = (json: string): string => {
      try {
        return JSON.stringify(JSON.parse(json), null, 2);
      } catch {
        return json;
      }
    };

    const validDataPoints = dataPoints.filter(
      (dp) => dp.address.trim() && dp.metric.trim(),
    );

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <p className="text-sm text-muted-foreground">{t('gatewayWizard.reviewHint')}</p>

        {/* 协议信息 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('gatewayWizard.reviewProtocol')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">
              {protocolOptions.find((p) => p.key === selectedProtocol)?.label ?? selectedProtocol}
            </Badge>
          </CardContent>
        </Card>

        {/* 连接配置 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('gatewayWizard.reviewConnection')}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto font-mono">
              {safeParse(connectionConfig)}
            </pre>
            <p className="text-xs text-muted-foreground mt-2">
              {t('gatewayWizard.reviewPollInterval', { ms: pollIntervalMs })}
            </p>
          </CardContent>
        </Card>

        {/* 数据点 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {t('gatewayWizard.reviewDataPoints', { count: validDataPoints.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {validDataPoints.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('gatewayWizard.noDataPoints')}</p>
            ) : (
              <div className="space-y-2">
                {validDataPoints.map((dp) => (
                  <div
                    key={dp.id}
                    className="flex items-center gap-3 text-sm border rounded-md px-3 py-2"
                  >
                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                      {dp.address}
                    </span>
                    <span className="font-medium">{dp.metric}</span>
                    <Badge variant="outline" className="text-xs ml-auto">
                      {dp.dataType}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 设备名称 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('gatewayWizard.reviewDeviceName')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{deviceName}</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ===========================================================================
  // 主渲染
  // ===========================================================================

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* 页头 */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/devices')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{t('gatewayWizard.title')}</h1>
      </div>

      {/* 步骤进度指示器 */}
      {renderStepper()}

      {/* 步骤内容 */}
      <Card>
        <CardContent className="pt-6">
          {step === 'protocol' && renderProtocolStep()}
          {step === 'connection' && renderConnectionStep()}
          {step === 'dataPoints' && renderDataPointsStep()}
          {step === 'review' && renderReviewStep()}
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {submitError && (
        <div className="mt-4 rounded-md bg-destructive/10 text-destructive text-sm p-3">
          {submitError}
        </div>
      )}

      {/* 底部导航按钮 */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={goBack} disabled={step === 'protocol'}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('gatewayWizard.previous')}
        </Button>

        {step === 'review' ? (
          <Button onClick={handleSubmit} disabled={createDevice.isPending}>
            {createDevice.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('gatewayWizard.submitCreate')}
          </Button>
        ) : (
          <Button onClick={goNext} disabled={!canProceed()}>
            {t('gatewayWizard.next')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
