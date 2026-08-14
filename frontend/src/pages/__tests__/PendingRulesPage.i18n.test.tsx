import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import PendingRulesPage from '../PendingRulesPage';
import {
  useApprovePendingRule,
  useApproveWithEdit,
  useBatchApprovePendingRules,
  useBatchRejectPendingRules,
  usePendingRules,
  useRejectPendingRule,
} from '../../hooks/useKnowledge';
import type { PendingRule } from '../../types';

const translations: Record<string, string> = {
  'common.all': 'All',
  'common.cancel': 'Cancel',
  'common.createdAt': 'Created At',
  'common.loading': 'Loading...',
  'common.noData': 'No data',
  'common.select': 'Select',
  'common.selectAll': 'Select all',
  'common.deselect': 'Deselect',
  'common.deselectAll': 'Deselect all',
  'knowledge.conditions': 'Conditions',
  'knowledge.conclusion': 'Conclusion',
  'knowledge.ruleName': 'Rule name',
  'pendingRules.title': 'Pending Rule Review',
  'pendingRules.filterStatus': 'Review Status',
  'pendingRules.statusPending': 'Pending',
  'pendingRules.statusApproved': 'Approved',
  'pendingRules.statusRejected': 'Rejected',
  'pendingRules.confidence': 'Confidence',
  'pendingRules.recommendedActions': 'Recommended Actions',
  'pendingRules.reviewComment': 'Review Comment',
  'pendingRules.approve': 'Approve',
  'pendingRules.reject': 'Reject',
  'pendingRules.rejectReason': 'Rejection Reason',
  'pendingRules.rejectReasonPlaceholder': 'Enter rejection reason...',
  'pendingRules.confirmReject': 'Confirm Reject',
  'pendingRules.approveWithEdit': 'Edit and approve',
  'pendingRules.confirmApprove': 'Confirm approve',
  'pendingRules.aiRecommendation': 'AI recommendation',
  'pendingRules.batchApprove': 'Approve {{count}} rules',
  'pendingRules.batchReject': 'Reject {{count}} rules',
  'pendingRules.addComment': 'Add comment',
  'pendingRules.batchCommentPlaceholder': 'Batch review comment',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const template = translations[key] ?? key;
      return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(options?.[name] ?? `{{${name}}}`));
    },
  }),
}));

vi.mock('../../hooks/useKnowledge', () => ({
  usePendingRules: vi.fn(),
  useApprovePendingRule: vi.fn(),
  useRejectPendingRule: vi.fn(),
  useApproveWithEdit: vi.fn(),
  useBatchApprovePendingRules: vi.fn(),
  useBatchRejectPendingRules: vi.fn(),
}));

const mockedUsePendingRules = vi.mocked(usePendingRules);
const mockedUseApprovePendingRule = vi.mocked(useApprovePendingRule);
const mockedUseRejectPendingRule = vi.mocked(useRejectPendingRule);
const mockedUseApproveWithEdit = vi.mocked(useApproveWithEdit);
const mockedUseBatchApprovePendingRules = vi.mocked(useBatchApprovePendingRules);
const mockedUseBatchRejectPendingRules = vi.mocked(useBatchRejectPendingRules);

const pendingRule: PendingRule = {
  id: 'pending-rule-001',
  tenantId: 'tenant-001',
  deviceType: 'Compressor',
  name: 'High temperature diagnosis',
  conditions: 'temperature > 80',
  conclusion: 'Cooling system degradation',
  recommendedActions: 'Inspect cooling system',
  sourceAlertId: 'alert-001',
  confidence: 0.92,
  reviewStatus: 'Pending',
  createdAt: '2026-08-12T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedUsePendingRules.mockReturnValue({
    data: { items: [pendingRule], total: 1, page: 1, pageSize: 50 },
    isLoading: false,
  } as unknown as ReturnType<typeof usePendingRules>);
  mockedUseApprovePendingRule.mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useApprovePendingRule>);
  mockedUseRejectPendingRule.mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useRejectPendingRule>);
  mockedUseApproveWithEdit.mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useApproveWithEdit>);
  mockedUseBatchApprovePendingRules.mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useBatchApprovePendingRules>);
  mockedUseBatchRejectPendingRules.mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useBatchRejectPendingRules>);
});

describe('待审核规则页面英文界面', () => {
  it('AI 来源和编辑后批准流程应使用英文资源', async () => {
    const user = userEvent.setup();
    render(<PendingRulesPage />);

    expect(screen.getByText('AI recommendation')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Edit and approve' }));
    expect(screen.getByRole('button', { name: 'Confirm approve' })).toBeInTheDocument();
    expect(screen.queryByText('AI 分析推荐')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '编辑后批准' })).not.toBeInTheDocument();
    expect(screen.queryByText('确认批准')).not.toBeInTheDocument();
  });

  it('单条规则应支持批准、驳回和编辑后批准', async () => {
    const user = userEvent.setup();
    const approveMutate = vi.fn();
    const rejectMutate = vi.fn((_payload: unknown, options?: { onSuccess?: () => void }) => options?.onSuccess?.());
    const approveWithEditMutate = vi.fn((_payload: unknown, options?: { onSuccess?: () => void }) => options?.onSuccess?.());
    mockedUseApprovePendingRule.mockReturnValue({ mutate: approveMutate, isPending: false } as unknown as ReturnType<typeof useApprovePendingRule>);
    mockedUseRejectPendingRule.mockReturnValue({ mutate: rejectMutate, isPending: false } as unknown as ReturnType<typeof useRejectPendingRule>);
    mockedUseApproveWithEdit.mockReturnValue({ mutate: approveWithEditMutate, isPending: false } as unknown as ReturnType<typeof useApproveWithEdit>);

    render(<PendingRulesPage />);
    await user.click(screen.getByRole('button', { name: 'Approve' }));
    expect(approveMutate).toHaveBeenCalledWith({ id: 'pending-rule-001' });

    await user.click(screen.getByRole('button', { name: 'Reject' }));
    const rejectInput = screen.getByPlaceholderText('Enter rejection reason...');
    await user.type(rejectInput, 'Rule needs expert review');
    await user.click(screen.getByRole('button', { name: 'Confirm Reject' }));
    expect(rejectMutate).toHaveBeenCalledWith(
      { id: 'pending-rule-001', comment: 'Rule needs expert review' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );

    await user.click(screen.getByRole('button', { name: 'Edit and approve' }));
    const editFields = screen.getAllByRole('textbox');
    await user.clear(editFields[0]);
    await user.type(editFields[0], 'Adjusted temperature diagnosis');
    await user.clear(editFields[1]);
    await user.type(editFields[1], 'temperature >= 85');
    await user.type(editFields[3], 'Approved after adjustment');
    await user.click(screen.getByRole('button', { name: 'Confirm approve' }));
    expect(approveWithEditMutate).toHaveBeenCalledWith({
      id: 'pending-rule-001',
      adjustedName: 'Adjusted temperature diagnosis',
      adjustedConditions: 'temperature >= 85',
      adjustedConclusion: undefined,
      comment: 'Approved after adjustment',
    }, expect.objectContaining({ onSuccess: expect.any(Function) }));
  });

  it('应支持批量选择、备注、批准和驳回，并可切换状态过滤', async () => {
    const user = userEvent.setup();
    const secondRule = { ...pendingRule, id: 'pending-rule-002', name: 'Low pressure diagnosis' };
    const batchApproveMutate = vi.fn((_payload: unknown, options?: { onSuccess?: () => void }) => options?.onSuccess?.());
    const batchRejectMutate = vi.fn((_payload: unknown, options?: { onSuccess?: () => void }) => options?.onSuccess?.());
    mockedUsePendingRules.mockReturnValue({
      data: { items: [pendingRule, secondRule], total: 2, page: 1, pageSize: 50 },
      isLoading: false,
    } as unknown as ReturnType<typeof usePendingRules>);
    mockedUseBatchApprovePendingRules.mockReturnValue({ mutate: batchApproveMutate, isPending: false } as unknown as ReturnType<typeof useBatchApprovePendingRules>);
    mockedUseBatchRejectPendingRules.mockReturnValue({ mutate: batchRejectMutate, isPending: false } as unknown as ReturnType<typeof useBatchRejectPendingRules>);

    render(<PendingRulesPage />);
    await user.click(screen.getByRole('button', { name: 'Select all' }));
    expect(screen.getByRole('button', { name: 'Deselect all' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add comment' }));
    await user.type(screen.getByPlaceholderText('Batch review comment'), 'Batch approved by lead');
    await user.click(screen.getByRole('button', { name: 'Approve 2 rules' }));
    expect(batchApproveMutate).toHaveBeenCalledWith({
      ids: ['pending-rule-001', 'pending-rule-002'],
      comment: 'Batch approved by lead',
    }, expect.objectContaining({ onSuccess: expect.any(Function) }));

    await user.click(screen.getByRole('button', { name: 'Select all' }));
    await user.click(screen.getByRole('button', { name: 'Reject 2 rules' }));
    expect(batchRejectMutate).toHaveBeenCalledWith({
      ids: ['pending-rule-001', 'pending-rule-002'],
      comment: undefined,
    }, expect.objectContaining({ onSuccess: expect.any(Function) }));

  });

  it('状态过滤器应切换到已批准规则视图', async () => {
    const user = userEvent.setup();
    render(<PendingRulesPage />);

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByText('Approved')).toBeInTheDocument();
    await user.click(screen.getByText('Approved'));
    expect(screen.queryByRole('button', { name: 'Select all' })).not.toBeInTheDocument();
  });

  it('已审核规则和加载空态应展示正确内容', () => {
    mockedUsePendingRules.mockReturnValue({
      data: {
        items: [{ ...pendingRule, reviewStatus: 'Approved', reviewComment: 'Reviewed by lead' }, { ...pendingRule, id: 'rule-rejected', reviewStatus: 'Rejected' }],
        total: 2,
        page: 1,
        pageSize: 50,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof usePendingRules>);
    const view = render(<PendingRulesPage />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.getByText('Reviewed by lead')).toBeInTheDocument();

    mockedUsePendingRules.mockReturnValue({ data: undefined, isLoading: true } as unknown as ReturnType<typeof usePendingRules>);
    view.rerender(<PendingRulesPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    mockedUsePendingRules.mockReturnValue({ data: { items: [], total: 0, page: 1, pageSize: 50 }, isLoading: false } as unknown as ReturnType<typeof usePendingRules>);
    view.rerender(<PendingRulesPage />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });
});
