import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Pencil,
  History,
  Power,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  useKnowledgeRules,
  usePendingRules,
  useFaultCases,
  useApprovePendingRule,
  useRejectPendingRule,
  useToggleKnowledgeRule,
} from '../hooks/useKnowledge';
import { usePermission } from '../hooks/usePermission';
import type { PermissionResult } from '../hooks/usePermission';
import type { KnowledgeRule, PendingRule, FaultCase } from '../types';
import ImportExportToolbar from '../components/knowledge/ImportExportToolbar';
import RuleEditDialog from '../components/knowledge/RuleEditDialog';
import VersionHistoryPanel from '../components/knowledge/VersionHistoryPanel';

/**
 * 知识库管理主页面
 *
 * 功能：
 * - 三个 Tab 切换：诊断规则 / 待审核规则 / 故障案例
 * - 诊断规则：卡片式展示，显示名称、设备类型、来源、应用次数、准确率
 * - 待审核规则：展示 AI 生成的候选规则，支持批准/驳回操作
 * - 故障案例：卡片式展示，显示故障描述、根因、解决方案、维修时长
 * - 导入行业预置数据按钮
 */
export default function KnowledgePage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('rules');
  const [keyword, setKeyword] = useState('');

  /** 获取知识库模块权限 */
  const perm = usePermission('knowledge');

  /** 待审核规则数量，用于 Tab 徽标显示 */
  const { data: pendingCountData } = usePendingRules({
    page: 1,
    pageSize: 1,
    reviewStatus: 'Pending',
  });
  const pendingCount = pendingCountData?.total ?? 0;

  return (
    <div className="space-y-4">
      {/* 页头：标题 + 导入导出工具栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('knowledge.title')}</h1>
        <ImportExportToolbar />
      </div>

      {/* 搜索栏 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9 max-w-sm"
          placeholder={t('common.search') + '...'}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      {/* Tab 切换：诊断规则 / 待审核 / 故障案例 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules">{t('knowledge.rules')}</TabsTrigger>
          <TabsTrigger value="pending">
            {t('knowledge.pending')}
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="cases">{t('knowledge.cases')}</TabsTrigger>
        </TabsList>

        {/* 诊断规则 Tab */}
        <TabsContent value="rules" className="mt-4">
          <RulesList keyword={keyword} perm={perm} />
        </TabsContent>

        {/* 待审核规则 Tab */}
        <TabsContent value="pending" className="mt-4">
          <PendingRulesList keyword={keyword} perm={perm} />
        </TabsContent>

        {/* 故障案例 Tab */}
        <TabsContent value="cases" className="mt-4">
          <CasesList keyword={keyword} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// 诊断规则列表子组件
// ============================================================================

/** 诊断规则列表属性 */
interface RulesListProps {
  keyword: string;
  perm: PermissionResult;
}

/**
 * 诊断规则列表
 *
 * 以卡片网格展示所有已审核通过的知识规则。
 */
function RulesList({ keyword, perm }: RulesListProps) {
  const { t } = useTranslation();
  const { data, isLoading } = useKnowledgeRules({
    page: 1,
    pageSize: 50,
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  }

  /** 按关键字过滤（前端本地过滤，因为后端 API 可能不支持 keyword 参数） */
  const filtered = data?.items.filter(
    (rule) =>
      !keyword ||
      rule.name.toLowerCase().includes(keyword.toLowerCase()) ||
      rule.deviceType.toLowerCase().includes(keyword.toLowerCase()) ||
      rule.conditions.toLowerCase().includes(keyword.toLowerCase()),
  );

  if (!filtered?.length) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        {t('knowledge.noRules')}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filtered.map((rule) => (
        <RuleCard key={rule.id} rule={rule} perm={perm} />
      ))}
    </div>
  );
}

/** 规则卡片属性 */
interface RuleCardProps {
  rule: KnowledgeRule;
  perm: PermissionResult;
}

/**
 * 规则卡片组件
 *
 * 展示规则的名称、设备类型、版本号、来源、应用次数和准确率。
 * 提供编辑、启用/禁用切换和版本历史查看操作。
 */
function RuleCard({ rule, perm }: RuleCardProps) {
  const { t } = useTranslation();
  const toggleMutation = useToggleKnowledgeRule();

  // 编辑对话框状态
  const [editingRule, setEditingRule] = useState<KnowledgeRule | null>(null);
  // 版本历史面板状态
  const [showHistory, setShowHistory] = useState(false);

  /** 来源标签的显示文本和样式 */
  const sourceBadge = (() => {
    switch (rule.source) {
      case 'manual':
        return { label: t('knowledge.sourceManual'), variant: 'default' as const };
      case 'expert':
        return { label: '专家创建', variant: 'default' as const };
      case 'ai_generated':
        return { label: 'AI 推荐', variant: 'secondary' as const };
      case 'imported':
        return { label: '行业导入', variant: 'outline' as const };
      default:
        return { label: rule.source || '未知', variant: 'outline' as const };
    }
  })();

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">{rule.name}</CardTitle>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant="outline" className="text-xs font-mono">
                v{rule.version}
              </Badge>
              <Badge
                variant={rule.enabled ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => perm.canEdit && toggleMutation.mutate(rule.id)}
              >
                <Power className="mr-1 h-3 w-3" />
                {rule.enabled ? t('knowledge.enabled') : t('knowledge.disabled')}
              </Badge>
              <Badge variant={sourceBadge.variant}>
                {sourceBadge.label}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{rule.deviceType}</span>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-3">
          {/* 条件 */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {t('knowledge.conditions')}
            </p>
            <p className="text-sm line-clamp-2">{rule.conditions}</p>
          </div>

          {/* 结论 */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {t('knowledge.conclusion')}
            </p>
            <p className="text-sm line-clamp-2">{rule.conclusion}</p>
          </div>

          {/* 推荐措施 */}
          {rule.recommendedActions && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {t('knowledge.recommendedActions')}
              </p>
              <p className="text-sm line-clamp-2">{rule.recommendedActions}</p>
            </div>
          )}

          {/* 统计指标 */}
          <div className="flex items-center gap-4 pt-2 border-t">
            <div className="flex items-center gap-1.5 text-sm">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{t('knowledge.successCount')}:</span>
              <span className="font-medium">{rule.successCount}</span>
            </div>
            {rule.accuracyRate != null && (
              <div className="flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                <span className="text-muted-foreground">{t('knowledge.accuracyRate')}:</span>
                <span className="font-medium">{rule.accuracyRate}%</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-muted-foreground">{t('knowledge.confidenceWeight')}:</span>
              <span className="font-medium">{(rule.confidenceWeight * 100).toFixed(0)}%</span>
            </div>
          </div>

          {/* 操作按钮区 */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button size="sm" variant="outline" onClick={() => setEditingRule(rule)} disabled={!perm.canEdit}>
              <Pencil className="mr-1 h-3.5 w-3.5" />
              {t('common.edit')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowHistory(true)}>
              <History className="mr-1 h-3.5 w-3.5" />
              {t('knowledge.versionHistory.title')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 规则编辑对话框 */}
      <RuleEditDialog
        rule={editingRule}
        onClose={() => setEditingRule(null)}
      />

      {/* 版本历史面板 */}
      <VersionHistoryPanel
        rule={rule}
        open={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </>
  );
}

// ============================================================================
// 待审核规则列表子组件
// ============================================================================

/** 待审核规则列表属性 */
interface PendingRulesListProps {
  keyword: string;
  perm: PermissionResult;
}

/**
 * 待审核规则列表
 *
 * 以卡片网格展示所有 AI 生成的待审核候选规则，
 * 支持批准和驳回操作。
 */
function PendingRulesList({ keyword, perm }: PendingRulesListProps) {
  const { t } = useTranslation();
  const { data, isLoading } = usePendingRules({
    page: 1,
    pageSize: 50,
    reviewStatus: 'Pending',
  });
  const approveMutation = useApprovePendingRule();
  const rejectMutation = useRejectPendingRule();

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  }

  /** 按关键字过滤（前端本地过滤） */
  const filtered = data?.items.filter(
    (rule) =>
      !keyword ||
      rule.name.toLowerCase().includes(keyword.toLowerCase()) ||
      rule.deviceType.toLowerCase().includes(keyword.toLowerCase()) ||
      rule.conclusion.toLowerCase().includes(keyword.toLowerCase()),
  );

  if (!filtered?.length) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        {t('knowledge.noPending')}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filtered.map((rule) => (
        <PendingRuleCard
          key={rule.id}
          rule={rule}
          onApprove={(id) => approveMutation.mutate({ id })}
          onReject={(id) => rejectMutation.mutate({ id, comment: t('knowledge.defaultRejectComment') })}
          approveDisabled={approveMutation.isPending || !perm.canApprove}
          rejectDisabled={rejectMutation.isPending || !perm.canApprove}
        />
      ))}
    </div>
  );
}

/** 待审核规则卡片属性 */
interface PendingRuleCardProps {
  rule: PendingRule;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  approveDisabled: boolean;
  rejectDisabled: boolean;
}

/**
 * 待审核规则卡片组件
 *
 * 展示 AI 生成的候选规则信息，并提供批准/驳回操作按钮。
 */
function PendingRuleCard({
  rule,
  onApprove,
  onReject,
  approveDisabled,
  rejectDisabled,
}: PendingRuleCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="flex flex-col border-yellow-200 bg-yellow-50/30 dark:border-yellow-800 dark:bg-yellow-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{rule.name}</CardTitle>
          <Badge variant="outline" className="shrink-0">
            {rule.deviceType}
          </Badge>
        </div>
        {rule.confidence != null && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>AI {t('knowledge.confidence')}：{(rule.confidence * 100).toFixed(0)}%</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {/* 条件 */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {t('knowledge.conditions')}
          </p>
          <p className="text-sm line-clamp-2">{rule.conditions}</p>
        </div>

        {/* 结论 */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {t('knowledge.conclusion')}
          </p>
          <p className="text-sm line-clamp-2">{rule.conclusion}</p>
        </div>

        {/* 推荐措施 */}
        {rule.recommendedActions && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {t('knowledge.recommendedActions')}
            </p>
            <p className="text-sm line-clamp-2">{rule.recommendedActions}</p>
          </div>
        )}

        {/* 审核操作按钮 */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            size="sm"
            onClick={() => onApprove(rule.id)}
            disabled={approveDisabled}
          >
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            {t('knowledge.approve')}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onReject(rule.id)}
            disabled={rejectDisabled}
          >
            <XCircle className="mr-1 h-3.5 w-3.5" />
            {t('knowledge.reject')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// 故障案例列表子组件
// ============================================================================

/** 案例列表属性 */
interface CasesListProps {
  keyword: string;
}

/**
 * 故障案例列表
 *
 * 以卡片网格展示所有已记录的故障案例。
 */
function CasesList({ keyword }: CasesListProps) {
  const { t } = useTranslation();
  const { data, isLoading } = useFaultCases({ page: 1, pageSize: 50 });

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  }

  /** 按关键字过滤（前端本地过滤） */
  const filtered = data?.items.filter(
    (c) =>
      !keyword ||
      c.faultDescription.toLowerCase().includes(keyword.toLowerCase()) ||
      c.rootCause.toLowerCase().includes(keyword.toLowerCase()) ||
      c.deviceType.toLowerCase().includes(keyword.toLowerCase()),
  );

  if (!filtered?.length) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        {t('knowledge.noCases')}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filtered.map((c) => (
        <CaseCard key={c.id} caseItem={c} />
      ))}
    </div>
  );
}

/** 案例卡片属性 */
interface CaseCardProps {
  caseItem: FaultCase;
}

/**
 * 案例卡片组件
 *
 * 展示故障描述、根因、解决方案和维修时长。
 */
function CaseCard({ caseItem }: CaseCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">
            {caseItem.deviceType}
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Badge variant={caseItem.isVerified ? 'default' : 'secondary'}>
              {caseItem.isVerified ? t('knowledge.verified') : t('knowledge.unverified')}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{caseItem.faultOccurredAt ? new Date(caseItem.faultOccurredAt).toLocaleDateString() : t('common.noData')}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {/* 故障描述 */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {t('knowledge.faultDescription')}
          </p>
          <p className="text-sm line-clamp-2">{caseItem.faultDescription}</p>
        </div>

        {/* 根因 */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {t('knowledge.rootCause')}
          </p>
          <p className="text-sm line-clamp-2">{caseItem.rootCause}</p>
        </div>

        {/* 解决方案 */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {t('knowledge.solution')}
          </p>
          <p className="text-sm line-clamp-2">{caseItem.solution}</p>
        </div>

        {/* 维修时长 */}
        {caseItem.repairDurationMinutes != null && (
          <div className="flex items-center gap-1.5 pt-2 border-t text-sm">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">{t('knowledge.repairDuration')}:</span>
            <span className="font-medium">{caseItem.repairDurationMinutes} {t('knowledge.minutes')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
