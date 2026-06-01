import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Search,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  useKnowledgeRules,
  useFaultCases,
} from '../hooks/useKnowledge';
import type { KnowledgeRule, FaultCase } from '../types';

/**
 * 知识库主页面
 *
 * 功能：
 * - Tab 切换：诊断规则 / 故障案例
 * - 诊断规则：卡片式展示，显示名称、设备类型、来源、应用次数、准确率
 * - 故障案例：卡片式展示，显示故障描述、根因、解决方案、维修时长
 */
export default function KnowledgePage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('rules');
  const [keyword, setKeyword] = useState('');

  return (
    <div className="space-y-4">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('knowledge.title')}</h1>
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

      {/* Tab 切换 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules">{t('knowledge.rules')}</TabsTrigger>
          <TabsTrigger value="cases">{t('knowledge.cases')}</TabsTrigger>
        </TabsList>

        {/* 诊断规则 Tab */}
        <TabsContent value="rules" className="mt-4">
          <RulesList keyword={keyword} />
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
}

/**
 * 诊断规则列表
 *
 * 以卡片网格展示所有已审核通过的知识规则。
 */
function RulesList({ keyword }: RulesListProps) {
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
        {t('common.noData')}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filtered.map((rule) => (
        <RuleCard key={rule.id} rule={rule} />
      ))}
    </div>
  );
}

/** 规则卡片属性 */
interface RuleCardProps {
  rule: KnowledgeRule;
}

/**
 * 规则卡片组件
 *
 * 展示规则的名称、设备类型、来源、应用次数和准确率。
 */
function RuleCard({ rule }: RuleCardProps) {
  const { t } = useTranslation();

  /** 来源标签的显示文本和样式 */
  const sourceBadge = (() => {
    switch (rule.source) {
      case 'manual':
        return { label: t('knowledge.sourceManual'), variant: 'default' as const };
      case 'ai_generated':
        return { label: t('knowledge.sourceAI'), variant: 'secondary' as const };
      case 'imported':
        return { label: t('knowledge.sourceImported'), variant: 'outline' as const };
      default:
        return { label: rule.source, variant: 'outline' as const };
    }
  })();

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{rule.name}</CardTitle>
          <Badge variant={sourceBadge.variant} className="shrink-0">
            {sourceBadge.label}
          </Badge>
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
        {t('common.noData')}
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
            {caseItem.isVerified && (
              <Badge variant="default" className="shrink-0">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {t('knowledge.verified')}
              </Badge>
            )}
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
