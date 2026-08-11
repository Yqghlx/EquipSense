import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApprovalChainSettings } from '../ApprovalChainSettings';
import * as useApprovals from '../../../hooks/useApprovals';
import type { ApprovalChainTemplate } from '../../../types';

/** 审批链配置测试使用的英文翻译。 */
const translations: Record<string, string> = {
  'common.loading': 'Loading...',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.create': 'Create',
  'common.save': 'Save',
  'common.saving': 'Saving...',
  'settings.approvalChain.title': 'Approval chain configuration',
  'settings.approvalChain.description': 'Configure approval steps for different work order types and priorities',
  'settings.approvalChain.addTemplate': 'Add template',
  'settings.approvalChain.stepCount': '{{count}} steps',
  'settings.approvalChain.default': 'Default',
  'settings.approvalChain.enabled': 'Enabled',
  'settings.approvalChain.disabled': 'Disabled',
  'settings.approvalChain.table.stepOrder': 'Step',
  'settings.approvalChain.table.role': 'Approval role',
  'settings.approvalChain.table.specificApprover': 'Specific approver',
  'settings.approvalChain.table.required': 'Required',
  'settings.approvalChain.required': 'Required',
  'settings.approvalChain.optional': 'Optional',
  'settings.approvalChain.empty': 'No approval chain templates. Click "Add template" to create one.',
  'settings.approvalChain.editTitle': 'Edit approval chain template',
  'settings.approvalChain.createTitle': 'Add approval chain template',
  'settings.approvalChain.nameLabel': 'Template name *',
  'settings.approvalChain.workOrderTypeLabel': 'Work order type',
  'settings.approvalChain.priorityLabel': 'Priority',
  'settings.approvalChain.defaultLabel': 'Set as default template',
  'settings.approvalChain.stepsLabel': 'Approval steps',
  'settings.approvalChain.addStep': 'Add step',
  'settings.approvalChain.cancel': 'Cancel',
  'settings.approvalChain.saveChanges': 'Save changes',
  'settings.approvalChain.create': 'Create',
  'settings.approvalChain.edit': 'Edit approval chain',
  'settings.approvalChain.delete': 'Delete approval chain',
  'settings.approvalChain.types.general': 'General',
  'settings.approvalChain.types.corrective': 'Corrective',
  'settings.approvalChain.types.preventive': 'Preventive',
  'settings.approvalChain.types.inspection': 'Inspection',
  'settings.approvalChain.priorities.general': 'General',
  'settings.approvalChain.priorities.urgent': 'Urgent',
  'settings.approvalChain.priorities.high': 'High',
  'settings.approvalChain.priorities.medium': 'Medium',
  'settings.approvalChain.priorities.low': 'Low',
  'settings.approvalChain.roles.system_admin': 'System admin',
  'settings.approvalChain.roles.maintenance_lead': 'Maintenance lead',
  'settings.approvalChain.roles.technician': 'Technician',
  'settings.approvalChain.roles.operator': 'Operator',
  'settings.approvalChain.roles.viewer': 'Viewer',
  'settings.approvalChain.namePlaceholder': 'e.g. High-priority work order approval',
  'settings.approvalChain.leaveBlankForAll': 'Leave blank for all',
  'settings.approvalChain.rolePlaceholder': 'Role',
  'settings.approvalChain.approverIdPlaceholder': 'Approver ID',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const value = translations[key] ?? key;
      return value.replace(/\{\{(\w+)\}\}/g, (_, name) => String(options?.[name] ?? `{{${name}}}`));
    },
  }),
}));

vi.mock('../../../hooks/useApprovals', () => ({
  useApprovalChains: vi.fn(),
  useCreateApprovalChain: vi.fn(),
  useUpdateApprovalChain: vi.fn(),
  useDeleteApprovalChain: vi.fn(),
}));

const mockChain: ApprovalChainTemplate = {
  id: 'chain-001',
  workOrderType: 'Corrective',
  priority: 'High',
  name: 'Corrective approval',
  isDefault: true,
  enabled: true,
  steps: [
    {
      id: 'step-001',
      stepOrder: 1,
      role: 'maintenance_lead',
      specificApproverId: 'user-001',
      isRequired: true,
    },
    {
      id: 'step-002',
      stepOrder: 2,
      role: 'technician',
      isRequired: false,
    },
  ],
  createdAt: '2026-08-12T00:00:00Z',
};

/** 配置审批链 hooks 的默认测试返回值。 */
const mockHooks = (chains: ApprovalChainTemplate[] = [mockChain]) => {
  vi.mocked(useApprovals.useApprovalChains).mockReturnValue({
    data: chains,
    isLoading: false,
  } as ReturnType<typeof useApprovals.useApprovalChains>);
  vi.mocked(useApprovals.useCreateApprovalChain).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useApprovals.useCreateApprovalChain>);
  vi.mocked(useApprovals.useUpdateApprovalChain).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useApprovals.useUpdateApprovalChain>);
  vi.mocked(useApprovals.useDeleteApprovalChain).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useApprovals.useDeleteApprovalChain>);
};

beforeEach(() => {
  vi.clearAllMocks();
  mockHooks();
});

describe('审批链配置英文界面', () => {
  it('应将模板列表、状态和步骤明细显示为英文', async () => {
    const user = userEvent.setup();

    render(<ApprovalChainSettings />);

    expect(screen.getByText('Approval chain configuration')).toBeInTheDocument();
    expect(screen.getByText('Configure approval steps for different work order types and priorities')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add template' })).toBeInTheDocument();
    expect(screen.getByText('Corrective')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('2 steps')).toBeInTheDocument();
    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit approval chain' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete approval chain' })).toBeInTheDocument();

    await user.click(screen.getByText('Corrective approval'));

    expect(screen.getByRole('columnheader', { name: 'Step' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Approval role' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Specific approver' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Required' })).toBeInTheDocument();
    expect(screen.getByText('Maintenance lead')).toBeInTheDocument();
    expect(screen.getByText('Technician')).toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.getByText('Optional')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/[\u3400-\u9fff]/);
  });

  it('新建模板对话框应提供完整的英文配置字段和操作', async () => {
    const user = userEvent.setup();

    render(<ApprovalChainSettings />);
    await user.click(screen.getByRole('button', { name: 'Add template' }));

    expect(screen.getByText('Add approval chain template')).toBeInTheDocument();
    expect(screen.getByText('Template name *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. High-priority work order approval')).toBeInTheDocument();
    expect(screen.getByText('Work order type')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByText('Set as default template')).toBeInTheDocument();
    expect(screen.getByText('Approval steps')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add step' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Role')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Approver ID')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/[\u3400-\u9fff]/);
  });

  it('无模板时应显示英文空状态', () => {
    mockHooks([]);

    render(<ApprovalChainSettings />);

    expect(screen.getByText('No approval chain templates. Click "Add template" to create one.')).toBeInTheDocument();
  });
});
