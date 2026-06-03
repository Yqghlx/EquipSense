import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RuleEditDialog from '../RuleEditDialog';
import type { KnowledgeRule } from '../../../types';

// Mock react-i18next，返回 key 作为翻译结果
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock useUpdateKnowledgeRule hook
const mockMutate = vi.fn();
vi.mock('../../../hooks/useKnowledge', () => ({
  useUpdateKnowledgeRule: vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
  })),
}));

// Mock ConditionEditor 组件，简化测试
vi.mock('../ConditionEditor', () => ({
  default: () => <div data-testid="condition-editor">ConditionEditor Mock</div>,
  parseConditions: vi.fn(() => []),
  serializeConditions: vi.fn((v: unknown) => JSON.stringify(v)),
}));

/** 构造一个完整的 KnowledgeRule 对象，用于编辑测试 */
const mockRule: KnowledgeRule = {
  id: 'rule-001',
  tenantId: 'tenant-001',
  deviceType: 'pump',
  name: '水泵温度过高规则',
  conditions: '温度 > 80',
  conclusion: '水泵轴承磨损',
  recommendedActions: '更换轴承',
  checkSteps: '1. 检查温度传感器\n2. 检查轴承状态',
  confidenceWeight: 0.85,
  source: 'manual',
  accuracyRate: 92,
  successCount: 15,
  enabled: true,
  version: 1,
  createdBy: 'user-001',
  createdAt: '2026-01-15T08:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('RuleEditDialog', () => {
  // ==========================================================================
  // 关闭状态
  // ==========================================================================

  it('rule=null 时对话框不应渲染', () => {
    const onClose = vi.fn();

    render(<RuleEditDialog rule={null} onClose={onClose} />);

    // DialogContent 不应在 DOM 中
    expect(screen.queryByText('knowledge.editDialog.title')).not.toBeInTheDocument();
  });

  // ==========================================================================
  // 打开状态
  // ==========================================================================

  it('rule 非 null 时对话框应打开并初始化表单', async () => {
    const onClose = vi.fn();

    render(<RuleEditDialog rule={mockRule} onClose={onClose} />);

    // 验证对话框标题和描述存在
    expect(screen.getByText('knowledge.editDialog.title')).toBeInTheDocument();
    expect(screen.getByText('knowledge.editDialog.description')).toBeInTheDocument();

    // 验证表单字段被初始化为 rule 的值
    await waitFor(() => {
      expect(screen.getByDisplayValue('水泵温度过高规则')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('pump')).toBeInTheDocument();
    expect(screen.getByDisplayValue('温度 > 80')).toBeInTheDocument();
    expect(screen.getByDisplayValue('水泵轴承磨损')).toBeInTheDocument();
    expect(screen.getByDisplayValue('更换轴承')).toBeInTheDocument();
  });

  // ==========================================================================
  // 表单提交
  // ==========================================================================

  it('修改字段并提交应调用 mutate', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<RuleEditDialog rule={mockRule} onClose={onClose} />);

    // 修改规则名称
    const nameInput = screen.getByDisplayValue('水泵温度过高规则');
    await user.clear(nameInput);
    await user.type(nameInput, '水泵温度过高规则-修改版');

    // 点击保存按钮
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    // 验证 mutate 被调用，包含修改后的字段
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'rule-001',
        name: '水泵温度过高规则-修改版',
      }),
      expect.objectContaining({
        onSuccess: expect.any(Function),
      }),
    );
  });

  it('无变更提交应直接调用 onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<RuleEditDialog rule={mockRule} onClose={onClose} />);

    // 等待表单初始化完成后直接点击保存（不修改任何字段）
    await waitFor(() => {
      expect(screen.getByDisplayValue('水泵温度过高规则')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'common.save' }));

    // mutate 不应被调用
    expect(mockMutate).not.toHaveBeenCalled();
    // onClose 应被直接调用
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ==========================================================================
  // 取消操作
  // ==========================================================================

  it('点击取消应调用 onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<RuleEditDialog rule={mockRule} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('水泵温度过高规则')).toBeInTheDocument();
    });

    // 点击取消按钮
    await user.click(screen.getByRole('button', { name: 'common.cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
