import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ApprovalProgressPanel } from '../ApprovalProgressPanel';
import { useApproveWorkOrder, useRejectApproval } from '../../../hooks/useApprovals';

const translations: Record<string, string> = {
  'workorder.approval.step': 'Approval level {{step}}',
  'workorder.approval.status.pending': 'Pending approval',
  'workorder.approval.commentLabel': 'Approval comment (optional)',
  'workorder.approval.commentPlaceholder': 'Enter approval comment...',
  'workorder.approval.approve': 'Approve',
  'workorder.approval.reject': 'Reject',
  'workorder.approval.roles.maintenance_lead': 'Maintenance lead',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { step?: number }) => {
      const template = translations[key] ?? key;
      return options?.step === undefined ? template : template.replace('{{step}}', String(options.step));
    },
  }),
}));

vi.mock('../../../hooks/useApprovals', () => ({
  useApproveWorkOrder: vi.fn(),
  useRejectApproval: vi.fn(),
}));

const mockedUseApproveWorkOrder = vi.mocked(useApproveWorkOrder);
const mockedUseRejectApproval = vi.mocked(useRejectApproval);

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseApproveWorkOrder.mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useApproveWorkOrder>);
  mockedUseRejectApproval.mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useRejectApproval>);
});

describe('工单审批进度英文界面', () => {
  it('待审批步骤和操作控件应使用英文翻译资源', () => {
    render(
      <ApprovalProgressPanel
        workOrderId="work-order-1"
        approvals={[{
          id: 'approval-1',
          workOrderId: 'work-order-1',
          stepOrder: 1,
          expectedRole: 'maintenance_lead',
          action: 'Pending',
        }]}
      />,
    );

    expect(screen.getByText('Approval level 1')).toBeInTheDocument();
    expect(screen.getByText('Pending approval')).toBeInTheDocument();
    expect(screen.getByText('Maintenance lead')).toBeInTheDocument();
    expect(screen.getByText('Approval comment (optional)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter approval comment...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
    expect(screen.queryByText('待审批')).not.toBeInTheDocument();
    expect(screen.queryByText('维修主管')).not.toBeInTheDocument();
  });
});
