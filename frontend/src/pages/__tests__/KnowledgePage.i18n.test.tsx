import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import KnowledgePage from '../KnowledgePage';
import {
  useFaultCases,
  useKnowledgeRules,
  usePendingRules,
  useToggleKnowledgeRule,
  useApprovePendingRule,
  useRejectPendingRule,
} from '../../hooks/useKnowledge';
import { usePermission } from '../../hooks/usePermission';
import type { FaultCase, KnowledgeRule, PendingRule } from '../../types';

const translations: Record<string, string> = {
  'common.search': 'Search',
  'common.edit': 'Edit',
  'knowledge.title': 'Knowledge Base',
  'knowledge.rules': 'Diagnostic Rules',
  'knowledge.pending': 'Pending Review',
  'knowledge.enabled': 'Enabled',
  'knowledge.conditions': 'Conditions',
  'knowledge.conclusion': 'Conclusion',
  'knowledge.recommendedActions': 'Recommended Actions',
  'knowledge.successCount': 'Applied',
  'knowledge.accuracyRate': 'Accuracy',
  'knowledge.confidenceWeight': 'Confidence Weight',
  'knowledge.sourceManual': 'Manual',
  'knowledge.sourceExpert': 'Expert',
  'knowledge.sourceAI': 'AI Generated',
  'knowledge.sourceImported': 'Imported',
  'knowledge.versionHistory.title': 'Version history',
  'knowledge.confidence': 'Confidence',
  'knowledge.approve': 'Approve',
  'knowledge.reject': 'Reject',
  'knowledge.defaultRejectComment': 'Rejected by reviewer',
  'knowledge.noPending': 'No pending rules',
  'knowledge.cases': 'Fault Cases',
  'knowledge.verified': 'Verified',
  'knowledge.unverified': 'Unverified',
  'knowledge.faultDescription': 'Fault description',
  'knowledge.symptoms': 'Symptoms',
  'knowledge.rootCause': 'Root cause',
  'knowledge.solution': 'Solution',
  'knowledge.metricSnapshot': 'Metric snapshot',
  'knowledge.repairDuration': 'Repair duration',
  'knowledge.minutes': 'minutes',
  'knowledge.maintainer': 'Maintainer',
  'knowledge.noCases': 'No fault cases',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key,
  }),
}));

vi.mock('../../hooks/useKnowledge', () => ({
  useFaultCases: vi.fn(),
  useKnowledgeRules: vi.fn(),
  usePendingRules: vi.fn(),
  useToggleKnowledgeRule: vi.fn(),
  useApprovePendingRule: vi.fn(),
  useRejectPendingRule: vi.fn(),
}));

vi.mock('../../hooks/usePermission', () => ({
  usePermission: vi.fn(),
}));

vi.mock('../../components/knowledge/ImportExportToolbar', () => ({
  default: () => null,
}));

vi.mock('../../components/knowledge/RuleEditDialog', () => ({
  default: () => null,
}));

vi.mock('../../components/knowledge/VersionHistoryPanel', () => ({
  default: () => null,
}));

const mockedUseKnowledgeRules = vi.mocked(useKnowledgeRules);
const mockedUsePendingRules = vi.mocked(usePendingRules);
const mockedUseFaultCases = vi.mocked(useFaultCases);
const mockedUseToggleKnowledgeRule = vi.mocked(useToggleKnowledgeRule);
const mockedUseApprovePendingRule = vi.mocked(useApprovePendingRule);
const mockedUseRejectPendingRule = vi.mocked(useRejectPendingRule);
const mockedUsePermission = vi.mocked(usePermission);

const rules: KnowledgeRule[] = [
  'manual',
  'expert',
  'ai_generated',
  'imported',
].map((source, index) => ({
  id: `rule-${index + 1}`,
  tenantId: 'tenant-001',
  deviceType: 'Compressor',
  name: `Rule ${index + 1}`,
  conditions: 'temperature > 80',
  conclusion: 'Overheating',
  recommendedActions: 'Inspect cooling system',
  confidenceWeight: 0.8,
  source,
  accuracyRate: 95,
  successCount: 4,
  enabled: true,
  version: 1,
  createdAt: '2026-08-12T00:00:00Z',
}));

const pendingRule: PendingRule = {
  id: 'pending-1',
  tenantId: 'tenant-001',
  deviceType: 'Compressor',
  name: 'Pending overheating rule',
  conditions: 'temperature > 80',
  conclusion: 'Cooling degradation',
  recommendedActions: 'Inspect fan',
  confidence: 0.92,
  reviewStatus: 'Pending',
  createdAt: '2026-08-12T00:00:00Z',
};

const faultCase: FaultCase = {
  id: 'case-1',
  tenantId: 'tenant-001',
  deviceType: 'Compressor',
  faultOccurredAt: '2026-08-12T09:00:00Z',
  faultDescription: 'Temperature alarm',
  symptoms: 'Temperature rising',
  rootCause: 'Cooling fan blocked',
  solution: 'Clean the fan',
  repairDurationMinutes: 45,
  isVerified: true,
  faultData: '{"temperature": 88.5,"pressure":"invalid"}',
  operator: 'Technician A',
  tags: 'Compressor,High',
  createdAt: '2026-08-12T10:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseKnowledgeRules.mockReturnValue({
    data: { items: rules, total: rules.length, page: 1, pageSize: 50 },
    isLoading: false,
  } as unknown as ReturnType<typeof useKnowledgeRules>);
  mockedUsePendingRules.mockReturnValue({
    data: { items: [] as PendingRule[], total: 0, page: 1, pageSize: 1 },
    isLoading: false,
  } as unknown as ReturnType<typeof usePendingRules>);
  mockedUseFaultCases.mockReturnValue({
    data: { items: [] as FaultCase[], total: 0, page: 1, pageSize: 50 },
    isLoading: false,
  } as unknown as ReturnType<typeof useFaultCases>);
  mockedUseToggleKnowledgeRule.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useToggleKnowledgeRule>);
  mockedUseApprovePendingRule.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useApprovePendingRule>);
  mockedUseRejectPendingRule.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useRejectPendingRule>);
  mockedUsePermission.mockReturnValue({
    canRead: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canExecute: true,
    canConfigure: true,
    canApprove: true,
    canTriggerAI: true,
    canManage: true,
  });
});

describe('知识库页面英文来源标签', () => {
  it('正式规则的来源标签应全部使用英文资源而不是硬编码中文', () => {
    render(<KnowledgePage />);

    expect(screen.getByText('Manual')).toBeInTheDocument();
    expect(screen.getByText('Expert')).toBeInTheDocument();
    expect(screen.getByText('AI Generated')).toBeInTheDocument();
    expect(screen.getByText('Imported')).toBeInTheDocument();
    expect(screen.queryByText('专家创建')).not.toBeInTheDocument();
    expect(screen.queryByText('AI 推荐')).not.toBeInTheDocument();
    expect(screen.queryByText('行业导入')).not.toBeInTheDocument();
  });

  it('规则搜索和启停操作应按权限过滤并调用对应 mutation', async () => {
    const user = userEvent.setup();
    render(<KnowledgePage />);
    const toggleMutation = mockedUseToggleKnowledgeRule.mock.results[0]?.value as { mutate: ReturnType<typeof vi.fn> };

    await user.click(screen.getAllByText('Enabled')[0]);
    expect(toggleMutation.mutate).toHaveBeenCalledWith('rule-1');

    const search = screen.getByRole('textbox');
    await user.type(search, 'Rule 1');
    expect(screen.getByText('Rule 1')).toBeInTheDocument();
    expect(screen.queryByText('Rule 2')).not.toBeInTheDocument();
  });

  it('待审核规则 Tab 应支持批准和驳回候选规则', async () => {
    const user = userEvent.setup();
    mockedUsePendingRules.mockReturnValue({
      data: { items: [pendingRule], total: 1, page: 1, pageSize: 50 },
      isLoading: false,
    } as unknown as ReturnType<typeof usePendingRules>);
    render(<KnowledgePage />);

    await user.click(screen.getByRole('tab', { name: /Pending Review/ }));
    expect(screen.getByText('Pending overheating rule')).toBeInTheDocument();

    const approveMutation = mockedUseApprovePendingRule.mock.results.at(-1)?.value as { mutate: ReturnType<typeof vi.fn> };
    const rejectMutation = mockedUseRejectPendingRule.mock.results.at(-1)?.value as { mutate: ReturnType<typeof vi.fn> };
    await user.click(screen.getByRole('button', { name: 'Approve' }));
    await user.click(screen.getByRole('button', { name: 'Reject' }));

    expect(approveMutation.mutate).toHaveBeenCalledWith({ id: 'pending-1' });
    expect(rejectMutation.mutate).toHaveBeenCalledWith({
      id: 'pending-1',
      comment: 'Rejected by reviewer',
    });
  });

  it('故障案例 Tab 应展示指标快照、标签和维修追溯信息', async () => {
    const user = userEvent.setup();
    mockedUseFaultCases.mockReturnValue({
      data: { items: [faultCase], total: 1, page: 1, pageSize: 50 },
      isLoading: false,
    } as unknown as ReturnType<typeof useFaultCases>);
    render(<KnowledgePage />);

    await user.click(screen.getByRole('tab', { name: 'Fault Cases' }));
    expect(screen.getByText('Temperature alarm')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('45 minutes')).toBeInTheDocument();
    expect(screen.getByText('Technician A')).toBeInTheDocument();
    expect(screen.getByText(/Metric snapshot/)).toBeInTheDocument();
    expect(screen.getByText('temperature')).toBeInTheDocument();
    expect(screen.queryByText('pressure')).not.toBeInTheDocument();
  });

  it('规则数据加载和过滤为空时应显示对应状态', async () => {
    const user = userEvent.setup();
    mockedUseKnowledgeRules.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useKnowledgeRules>);
    const view = render(<KnowledgePage />);
    expect(screen.getByText('common.loading')).toBeInTheDocument();

    mockedUseKnowledgeRules.mockReturnValue({
      data: { items: [], total: 0, page: 1, pageSize: 50 },
      isLoading: false,
    } as unknown as ReturnType<typeof useKnowledgeRules>);
    view.rerender(<KnowledgePage />);
    expect(screen.getByText('knowledge.noRules')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Pending Review' }));
    expect(screen.getByText('No pending rules')).toBeInTheDocument();
  });
});
