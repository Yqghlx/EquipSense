import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FmeaFormDialog from '../FmeaFormDialog';
import type { FmeaEntry } from '../../../hooks/useFmea';

const mocks = vi.hoisted(() => ({
  createMutateAsync: vi.fn(),
  updateMutateAsync: vi.fn(),
}));

const translations: Record<string, string> = {
  'fmea.create': '新建 FMEA',
  'fmea.edit': '编辑 FMEA',
  'fmea.formDescription': '维护故障模式、影响和风险评分。',
  'fmea.deviceType': '设备类型',
  'fmea.failureMode': '故障模式',
  'fmea.cause': '故障原因',
  'fmea.effect': '故障影响',
  'fmea.detection': '检测方式',
  'fmea.recommendedAction': '建议措施',
  'fmea.severity': '严重度 (S)',
  'fmea.occurrence': '发生频率 (O)',
  'fmea.detectability': '可检测性 (D)',
  'fmea.knowledgeRuleId': '关联规则',
  'fmea.knowledgeRuleIdPlaceholder': '可选：输入规则 ID',
  'fmea.deviceTypeRequired': '请输入设备类型',
  'fmea.failureModeRequired': '请输入故障模式',
  'fmea.causeRequired': '请输入故障原因',
  'fmea.effectRequired': '请输入故障影响',
  'fmea.detectionRequired': '请输入检测方式',
  'fmea.recommendedActionRequired': '请输入建议措施',
  'fmea.severityRequired': '请输入严重度 (1-10)',
  'fmea.occurrenceRequired': '请输入发生频率 (1-10)',
  'fmea.detectabilityRequired': '请输入可检测性 (1-10)',
  'fmea.ratingInvalid': '评分必须是 1-10 的整数',
  'fmea.rpnPreview': 'RPN',
  'fmea.submitFailed': '保存失败，请检查后重试。',
  'common.cancel': '取消',
  'common.save': '保存',
  'common.loading': '加载中...',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => translations[key] ?? key }),
}));

vi.mock('../../../hooks/useFmea', () => ({
  useCreateFmeaEntry: vi.fn(() => ({
    mutateAsync: mocks.createMutateAsync,
    isPending: false,
  })),
  useUpdateFmeaEntry: vi.fn(() => ({
    mutateAsync: mocks.updateMutateAsync,
    isPending: false,
  })),
}));

const mockEntry: FmeaEntry = {
  id: 'fmea-001',
  tenantId: 'tenant-001',
  deviceType: '泵',
  failureMode: '轴承磨损',
  cause: '润滑不足',
  effect: '振动升高',
  detection: '振动分析',
  recommendedAction: '补充润滑油',
  severity: 4,
  occurrence: 5,
  detectability: 6,
  rpn: 120,
  knowledgeRuleId: null,
  createdBy: 'user-001',
  isEnabled: true,
  createdAt: '2026-08-12T08:00:00Z',
  updatedAt: '2026-08-12T08:00:00Z',
};

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('设备类型'), '泵');
  await user.type(screen.getByLabelText('故障模式'), '轴承磨损');
  await user.type(screen.getByLabelText('故障原因'), '润滑不足');
  await user.type(screen.getByLabelText('故障影响'), '振动升高');
  await user.type(screen.getByLabelText('检测方式'), '振动分析');
  await user.type(screen.getByLabelText('建议措施'), '补充润滑油');
  await user.type(screen.getByLabelText('严重度 (S)'), '8');
  await user.type(screen.getByLabelText('发生频率 (O)'), '3');
  await user.type(screen.getByLabelText('可检测性 (D)'), '4');
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createMutateAsync.mockResolvedValue({ id: 'fmea-created' });
  mocks.updateMutateAsync.mockResolvedValue({ id: mockEntry.id });
});

describe('FmeaFormDialog', () => {
  it('编辑模式回填字段并显示实时 RPN', () => {
    render(<FmeaFormDialog open entry={mockEntry} onOpenChange={vi.fn()} />);

    expect(screen.getByDisplayValue(mockEntry.failureMode)).toBeInTheDocument();
    expect(screen.getByText('RPN: 120')).toBeInTheDocument();
  });

  it('空表单提交显示可访问错误且不调用 mutation', async () => {
    const user = userEvent.setup();
    render(<FmeaFormDialog open entry={null} onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: '保存' }));

    expect(screen.getByLabelText('设备类型')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('设备类型')).toHaveAttribute('aria-describedby', 'fmea-device-type-error');
    expect(screen.getByText('请输入设备类型')).toHaveAttribute('role', 'alert');
    expect(mocks.createMutateAsync).not.toHaveBeenCalled();
  });

  it('新建时提交去空格后的字段和数字评分，成功后关闭', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<FmeaFormDialog open entry={null} onOpenChange={onOpenChange} />);

    await user.type(screen.getByLabelText('设备类型'), ' 泵 ');
    await user.type(screen.getByLabelText('故障模式'), ' 轴承磨损 ');
    await user.type(screen.getByLabelText('故障原因'), ' 润滑不足 ');
    await user.type(screen.getByLabelText('故障影响'), ' 振动升高 ');
    await user.type(screen.getByLabelText('检测方式'), ' 振动分析 ');
    await user.type(screen.getByLabelText('建议措施'), ' 补充润滑油 ');
    await user.type(screen.getByLabelText('严重度 (S)'), '8');
    await user.type(screen.getByLabelText('发生频率 (O)'), '3');
    await user.type(screen.getByLabelText('可检测性 (D)'), '4');
    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => expect(mocks.createMutateAsync).toHaveBeenCalledWith({
      deviceType: '泵',
      failureMode: '轴承磨损',
      cause: '润滑不足',
      effect: '振动升高',
      detection: '振动分析',
      recommendedAction: '补充润滑油',
      severity: 8,
      occurrence: 3,
      detectability: 4,
    }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('编辑时提交完整请求并保留条目 ID', async () => {
    const user = userEvent.setup();
    render(<FmeaFormDialog open entry={mockEntry} onOpenChange={vi.fn()} />);

    await user.clear(screen.getByLabelText('故障模式'));
    await user.type(screen.getByLabelText('故障模式'), '叶轮松动');
    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => expect(mocks.updateMutateAsync).toHaveBeenCalledWith({
      id: mockEntry.id,
      request: expect.objectContaining({ failureMode: '叶轮松动', severity: 4, occurrence: 5, detectability: 6 }),
    }));
  });

  it('评分越界时显示关联错误且不提交', async () => {
    const user = userEvent.setup();
    render(<FmeaFormDialog open entry={null} onOpenChange={vi.fn()} />);

    await fillRequiredFields(user);
    await user.clear(screen.getByLabelText('严重度 (S)'));
    await user.type(screen.getByLabelText('严重度 (S)'), '11');
    await user.click(screen.getByRole('button', { name: '保存' }));

    expect(screen.getByLabelText('严重度 (S)')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('严重度 (S)')).toHaveAttribute('aria-describedby', 'fmea-severity-error');
    expect(screen.getByText('评分必须是 1-10 的整数')).toHaveAttribute('role', 'alert');
    expect(mocks.createMutateAsync).not.toHaveBeenCalled();
  });

  it('保存失败时保留草稿并显示可理解提示', async () => {
    const user = userEvent.setup();
    mocks.createMutateAsync.mockRejectedValueOnce(new Error('network error'));
    render(<FmeaFormDialog open entry={null} onOpenChange={vi.fn()} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: '保存' }));

    expect(await screen.findByText('保存失败，请检查后重试。')).toBeInTheDocument();
    expect(screen.getByLabelText('故障模式')).toHaveValue('轴承磨损');
  });
});
