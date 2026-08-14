import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { ApprovalProgressPanel } from '../ApprovalProgressPanel';
import { useApproveWorkOrder, useRejectApproval } from '../../../hooks/useApprovals';
import type { ApprovalAction } from '../../../types';

const translations: Record<string, string> = {
  'workorder.approval.step': 'Approval level {{step}}',
  'workorder.approval.status.pending': 'Pending approval',
  'workorder.approval.commentLabel': 'Approval comment (optional)',
  'workorder.approval.commentPlaceholder': 'Enter approval comment...',
  'workorder.approval.approve': 'Approve',
  'workorder.approval.reject': 'Reject',
  'workorder.approval.roles.maintenance_lead': 'Maintenance lead',
  'workorder.approval.status.approved': 'Approved',
  'workorder.approval.status.rejected': 'Rejected',
  'workorder.approval.status.waiting': 'Waiting',
  'workorder.approval.status.unknown': 'Unknown',
  'workorder.approval.rejectionReason': 'Rejection reason',
  'workorder.approval.rejectionPlaceholder': 'Enter rejection reason...',
  'workorder.approval.confirmReject': 'Confirm reject',
  'workorder.approval.cancel': 'Cancel',
  'workorder.approval.comment': 'Comment: {{comment}}',
  'workorder.approval.noRecords': 'No approval records',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { step?: number; comment?: string }) => {
      const template = translations[key] ?? key;
      return template
        .replace('{{step}}', String(options?.step ?? '{{step}}'))
        .replace('{{comment}}', String(options?.comment ?? '{{comment}}'));
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

  it('应展示已通过、驳回、等待和未知状态，并支持审批通过与驳回', async () => {
    const user = userEvent.setup();
    const approveMutate = vi.fn((_payload: unknown, options?: { onSettled?: () => void }) => options?.onSettled?.());
    const rejectMutate = vi.fn((_payload: unknown, options?: { onSettled?: () => void }) => options?.onSettled?.());
    mockedUseApproveWorkOrder.mockReturnValue({ mutate: approveMutate, isPending: false } as unknown as ReturnType<typeof useApproveWorkOrder>);
    mockedUseRejectApproval.mockReturnValue({ mutate: rejectMutate, isPending: false } as unknown as ReturnType<typeof useRejectApproval>);
    const view = render(
      <ApprovalProgressPanel
        workOrderId="work-order-1"
        approvals={[
          { id: 'approval-1', workOrderId: 'work-order-1', stepOrder: 1, expectedRole: 'maintenance_lead', action: 'Approved', actedAt: '2026-08-12T00:00:00Z', comment: 'Looks good' },
          { id: 'approval-2', workOrderId: 'work-order-1', stepOrder: 2, expectedRole: 'technician', action: 'Pending' },
          { id: 'approval-3', workOrderId: 'work-order-1', stepOrder: 3, expectedRole: 'operator', action: 'Pending' },
          { id: 'approval-5', workOrderId: 'work-order-1', stepOrder: 5, expectedRole: 'custom_role', action: 'Unknown' as unknown as ApprovalAction },
        ]}
      />,
    );

    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Pending approval')).toBeInTheDocument();
    expect(screen.getByText('Waiting')).toBeInTheDocument();
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.getByText('Comment: Looks good')).toBeInTheDocument();
    const comment = screen.getByPlaceholderText('Enter approval comment...');
    await user.type(comment, 'Approved after inspection');
    await user.click(screen.getByRole('button', { name: 'Approve' }));
    expect(approveMutate).toHaveBeenCalledWith(
      { id: 'work-order-1', comment: 'Approved after inspection' },
      expect.objectContaining({ onSettled: expect.any(Function) }),
    );

    await user.click(screen.getByRole('button', { name: 'Reject' }));
    await user.type(screen.getByPlaceholderText('Enter rejection reason...'), 'Need more evidence');
    await user.click(screen.getByRole('button', { name: 'Confirm reject' }));
    expect(rejectMutate).toHaveBeenCalledWith(
      { id: 'work-order-1', comment: 'Need more evidence' },
      expect.objectContaining({ onSettled: expect.any(Function) }),
    );

    view.rerender(
      <ApprovalProgressPanel
        workOrderId="work-order-1"
        approvals={[{
          id: 'approval-rejected',
          workOrderId: 'work-order-1',
          stepOrder: 1,
          expectedRole: 'viewer',
          action: 'Rejected',
        }]}
      />,
    );
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('没有审批记录时应显示空态', () => {
    render(<ApprovalProgressPanel workOrderId="work-order-1" approvals={[]} />);
    expect(screen.getByText('No approval records')).toBeInTheDocument();
  });
});
