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
});
