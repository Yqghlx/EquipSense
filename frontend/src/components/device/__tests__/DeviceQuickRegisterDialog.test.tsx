import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import { DeviceQuickRegisterDialog } from '../DeviceQuickRegisterDialog';
import { useDeviceTemplates, useQuickRegister } from '../../../hooks/useDeviceConfig';

const translations: Record<string, string> = {
  'device.quickRegister.title': '模板快速注册',
  'device.quickRegister.description': '先选择设备模板，再填写现场设备档案。',
  'device.quickRegister.template': '设备模板',
  'device.quickRegister.templatePlaceholder': '选择一个设备模板',
  'device.quickRegister.templateRequired': '请选择设备模板',
  'device.quickRegister.deviceCode': '设备编码',
  'device.quickRegister.deviceCodePlaceholder': '例如：PUMP-001',
  'device.quickRegister.deviceCodeRequired': '请输入设备编码',
  'device.quickRegister.name': '设备名称',
  'device.quickRegister.namePlaceholder': '例如：一号冷却水泵',
  'device.quickRegister.nameRequired': '请输入设备名称',
  'device.quickRegister.metrics': '模板指标',
  'device.quickRegister.recommendedRules': '推荐告警',
  'device.quickRegister.noMetrics': '暂无可预览指标',
  'device.quickRegister.noRules': '暂无推荐告警',
  'device.quickRegister.applyRules': '启用推荐告警规则',
  'device.quickRegister.processWarning': '阈值需结合现场工艺确认后再启用。',
  'device.quickRegister.submit': '创建并套用模板',
  'device.quickRegister.loadingTemplates': '正在加载模板...',
  'device.quickRegister.loadFailed': '模板加载失败',
  'device.quickRegister.retry': '重试',
  'device.quickRegister.duplicateCode': '设备编码已存在，请换一个编码。',
  'device.quickRegister.templateNotFound': '模板不可用，请重新选择。',
  'device.quickRegister.submitFailed': '注册失败，请检查后重试。',
  'common.cancel': '取消',
  'common.loading': '加载中...',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key,
  }),
}));

vi.mock('../../../hooks/useDeviceConfig', () => ({
  useDeviceTemplates: vi.fn(),
  useQuickRegister: vi.fn(),
}));

const mockedUseDeviceTemplates = vi.mocked(useDeviceTemplates);
const mockedUseQuickRegister = vi.mocked(useQuickRegister);

const template = {
  id: 'template-001',
  name: '空压机模板',
  industry: '制造业',
  parameters: {
    metrics: [
      { name: 'vibration', displayName: '振动幅值', unit: 'mm/s', range: { min: 0, max: 8 } },
      { name: 'oil_temperature', displayName: '油温', unit: '°C', range: { min: 30, max: 95 } },
    ],
  },
  defaultAlarmRules: [
    { name: '振动超标', metric: 'vibration', operator: 'gt', threshold: 7, severity: 'Critical', autoCreateWorkorder: true },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseDeviceTemplates.mockReturnValue({
    data: [template],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useDeviceTemplates>);
  mockedUseQuickRegister.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({ id: 'device-001' }),
    isPending: false,
  } as unknown as ReturnType<typeof useQuickRegister>);
});

describe('DeviceQuickRegisterDialog', () => {
  it('模板加载失败时应提供可操作的重试入口', async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();
    mockedUseDeviceTemplates.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof useDeviceTemplates>);

    render(<DeviceQuickRegisterDialog open onOpenChange={vi.fn()} />);

    expect(screen.getByText('模板加载失败')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '重试' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('应展示模板指标和推荐告警，默认不启用推荐规则', () => {
    render(<DeviceQuickRegisterDialog open onOpenChange={vi.fn()} />);

    expect(screen.getByText('空压机模板')).toBeInTheDocument();
    expect(screen.getByText('振动幅值')).toBeInTheDocument();
    expect(screen.getByText('振动超标')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('阈值需结合现场工艺确认后再启用。')).toBeInTheDocument();
  });

  it('填写档案并显式启用推荐规则后只提交模板契约字段', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'device-001' });
    const onOpenChange = vi.fn();
    mockedUseQuickRegister.mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useQuickRegister>);
    render(<DeviceQuickRegisterDialog open onOpenChange={onOpenChange} />);

    await user.type(screen.getByLabelText('设备编码'), 'PUMP-001');
    await user.type(screen.getByLabelText('设备名称'), '一号冷却水泵');
    await user.click(screen.getByRole('switch'));
    await user.click(screen.getByRole('button', { name: '创建并套用模板' }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({
      templateId: 'template-001',
      deviceCode: 'PUMP-001',
      name: '一号冷却水泵',
      applyDefaultAlarmRules: true,
    }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('必填字段错误应使用 aria-invalid 和 aria-describedby 关联提示', async () => {
    const user = userEvent.setup();
    render(<DeviceQuickRegisterDialog open onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '创建并套用模板' }));

    expect(screen.getByLabelText('设备编码')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('设备编码')).toHaveAttribute('aria-describedby', 'quick-register-device-code-error');
    expect(screen.getByLabelText('设备名称')).toHaveAttribute('aria-describedby', 'quick-register-name-error');
    expect(screen.getByText('请输入设备编码')).toHaveAttribute('role', 'alert');
  });

  it('重复编码失败时应保留输入并显示可理解提示', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockRejectedValue({ response: { data: { code: 'DUPLICATE_CODE' } } });
    mockedUseQuickRegister.mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useQuickRegister>);
    render(<DeviceQuickRegisterDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText('设备编码'), 'PUMP-001');
    await user.type(screen.getByLabelText('设备名称'), '一号水泵');
    await user.click(screen.getByRole('button', { name: '创建并套用模板' }));

    expect(await screen.findByText('设备编码已存在，请换一个编码。')).toBeInTheDocument();
    expect(screen.getByLabelText('设备编码')).toHaveValue('PUMP-001');
    expect(screen.getByLabelText('设备名称')).toHaveValue('一号水泵');
  });
});
