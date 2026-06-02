import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  XCircle,
  Brain,
  Filter,
  MessageSquare,
  Pencil,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  usePendingRules,
  useApprovePendingRule,
  useRejectPendingRule,
  useApproveWithEdit,
} from '../hooks/useKnowledge';
import type { PendingRule } from '../types';

/**
 * 候选规则审核页面
 *
 * 功能：
 * - 显示待审核的 AI 生成规则列表
 * - 支持按审核状态过滤
 * - 每个规则卡片提供批准和驳回按钮
 * - 显示置信度、条件、结论和推荐措施
 */
export default function PendingRulesPage() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<string>('Pending');

  const { data, isLoading } = usePendingRules({
    page: 1,
    pageSize: 50,
    reviewStatus: statusFilter || undefined,
  });

  return (
    <div className="space-y-4">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('pendingRules.title')}</h1>
      </div>

      {/* 过滤栏 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? '')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('pendingRules.filterStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">{t('pendingRules.statusPending')}</SelectItem>
              <SelectItem value="Approved">{t('pendingRules.statusApproved')}</SelectItem>
              <SelectItem value="Rejected">{t('pendingRules.statusRejected')}</SelectItem>
              <SelectItem value="">{t('common.all')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 规则列表 */}
      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">
          {t('common.loading')}
        </div>
      ) : !data?.items.length ? (
        <div className="py-20 text-center text-muted-foreground">
          {t('common.noData')}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.items.map((rule) => (
            <PendingRuleCard key={rule.id} rule={rule} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 候选规则卡片子组件
// ============================================================================

/** 候选规则卡片属性 */
interface PendingRuleCardProps {
  rule: PendingRule;
}

/**
 * 候选规则卡片组件
 *
 * 展示规则的详细信息，并提供批准/驳回操作按钮。
 * 驳回时支持填写审核意见。
 */
function PendingRuleCard({ rule }: PendingRuleCardProps) {
  const { t } = useTranslation();
  const approveRule = useApprovePendingRule();
  const rejectRule = useRejectPendingRule();
  const approveWithEditRule = useApproveWithEdit();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [rejectComment, setRejectComment] = useState('');

  // 编辑后批准表单状态
  const [editName, setEditName] = useState(rule.name);
  const [editConditions, setEditConditions] = useState(rule.conditions);
  const [editConclusion, setEditConclusion] = useState(rule.conclusion);
  const [editComment, setEditComment] = useState('');

  /** 审核状态对应的 Badge 样式 */
  const statusBadge = (() => {
    switch (rule.reviewStatus) {
      case 'Pending':
        return { label: t('pendingRules.statusPending'), variant: 'outline' as const, className: 'border-yellow-500 text-yellow-600' };
      case 'Approved':
        return { label: t('pendingRules.statusApproved'), variant: 'default' as const, className: 'bg-green-500' };
      case 'Rejected':
        return { label: t('pendingRules.statusRejected'), variant: 'destructive' as const, className: '' };
      default:
        return { label: rule.reviewStatus, variant: 'outline' as const, className: '' };
    }
  })();

  /** 处理批准操作 */
  const handleApprove = () => {
    approveRule.mutate({ id: rule.id });
  };

  /** 处理驳回操作 */
  const handleReject = () => {
    rejectRule.mutate(
      { id: rule.id, comment: rejectComment || undefined },
      {
        onSuccess: () => {
          setShowRejectForm(false);
          setRejectComment('');
        },
      },
    );
  };

  /** 处理编辑后批准操作 */
  const handleApproveWithEdit = () => {
    approveWithEditRule.mutate(
      {
        id: rule.id,
        adjustedName: editName !== rule.name ? editName : undefined,
        adjustedConditions: editConditions !== rule.conditions ? editConditions : undefined,
        adjustedConclusion: editConclusion !== rule.conclusion ? editConclusion : undefined,
        comment: editComment || undefined,
      },
      {
        onSuccess: () => {
          setShowEditForm(false);
          setEditComment('');
        },
      },
    );
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{rule.name}</CardTitle>
          <Badge variant={statusBadge.variant} className={statusBadge.className + ' shrink-0'}>
            {statusBadge.label}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{rule.deviceType}</span>
          {rule.confidence != null && (
            <div className="flex items-center gap-1">
              <Brain className="h-3.5 w-3.5" />
              <span>{t('pendingRules.confidence')}: {(rule.confidence * 100).toFixed(0)}%</span>
            </div>
          )}
          {rule.sourceAlertId && (
            <Badge variant="secondary" className="text-xs">
              <Brain className="mr-1 h-3 w-3" />
              AI 分析推荐
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {/* 条件 */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {t('knowledge.conditions')}
          </p>
          <p className="text-sm">{rule.conditions}</p>
        </div>

        {/* 结论 */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {t('knowledge.conclusion')}
          </p>
          <p className="text-sm">{rule.conclusion}</p>
        </div>

        {/* 推荐措施 */}
        {rule.recommendedActions && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {t('pendingRules.recommendedActions')}
            </p>
            <p className="text-sm">{rule.recommendedActions}</p>
          </div>
        )}

        {/* 审核意见（已审核时显示） */}
        {rule.reviewComment && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {t('pendingRules.reviewComment')}
            </p>
            <p className="text-sm text-muted-foreground">{rule.reviewComment}</p>
          </div>
        )}

        {/* 创建时间 */}
        <p className="text-xs text-muted-foreground">
          {t('common.createdAt')}: {new Date(rule.createdAt).toLocaleString()}
        </p>

        {/* 操作按钮（仅待审核状态显示） */}
        {rule.reviewStatus === 'Pending' && (
          <div className="flex flex-col gap-2 pt-2 border-t">
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={approveRule.isPending}
                className="flex-1"
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                {t('pendingRules.approve')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditName(rule.name);
                  setEditConditions(rule.conditions);
                  setEditConclusion(rule.conclusion);
                  setEditComment('');
                  setShowEditForm(!showEditForm);
                  setShowRejectForm(false);
                }}
                disabled={approveWithEditRule.isPending}
                className="flex-1"
              >
                <Pencil className="mr-1.5 h-4 w-4" />
                编辑后批准
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setShowRejectForm(!showRejectForm);
                  setShowEditForm(false);
                }}
                disabled={rejectRule.isPending}
                className="flex-1"
              >
                <XCircle className="mr-1.5 h-4 w-4" />
                {t('pendingRules.reject')}
              </Button>
            </div>

            {/* 编辑后批准表单 */}
            {showEditForm && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-md">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    {t('knowledge.ruleName', { defaultValue: '规则名称' })}
                  </label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    {t('knowledge.conditions')}
                  </label>
                  <Textarea
                    value={editConditions}
                    onChange={(e) => setEditConditions(e.target.value)}
                    rows={2}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    {t('knowledge.conclusion')}
                  </label>
                  <Textarea
                    value={editConclusion}
                    onChange={(e) => setEditConclusion(e.target.value)}
                    rows={2}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    {t('pendingRules.reviewComment')}
                  </label>
                  <Textarea
                    value={editComment}
                    onChange={(e) => setEditComment(e.target.value)}
                    placeholder={t('pendingRules.rejectReasonPlaceholder', { defaultValue: '可选审核意见' })}
                    rows={2}
                    className="mt-1"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditComment('');
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApproveWithEdit}
                    disabled={approveWithEditRule.isPending}
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    {approveWithEditRule.isPending ? t('common.loading') : '确认批准'}
                  </Button>
                </div>
              </div>
            )}

            {/* 驳回意见输入框 */}
            {showRejectForm && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {t('pendingRules.rejectReason')}
                  </span>
                </div>
                <Textarea
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  placeholder={t('pendingRules.rejectReasonPlaceholder')}
                  rows={2}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectComment('');
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleReject}
                    disabled={rejectRule.isPending}
                  >
                    {rejectRule.isPending ? t('common.loading') : t('pendingRules.confirmReject')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
