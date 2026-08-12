import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import KnowledgePage from '../KnowledgePage';
import {
  useFaultCases,
  useKnowledgeRules,
  usePendingRules,
  useToggleKnowledgeRule,
} from '../../hooks/useKnowledge';
import { usePermission } from '../../hooks/usePermission';
import type { FaultCase, KnowledgeRule, PendingRule } from '../../types';

const translations: Record<string, string> = {
  'common.search': 'Search',
  'common.edit': 'Edit',
  'knowledge.title': 'Knowledge Base',
  'knowledge.rules': 'Diagnostic Rules',
  'knowledge.pending': 'Pending Review',
  'knowledge.cases': 'Fault Cases',
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
});
