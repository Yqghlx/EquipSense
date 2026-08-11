/**
 * 待审批列表页面
 *
 * 展示当前用户待处理的所有审批任务。
 * 支持审批通过/驳回操作，点击工单可跳转详情页。
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, X, ExternalLink, Inbox } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import {
  usePendingApprovals,
  useApproveWorkOrder,
  useRejectApproval,
} from '../hooks/useApprovals';

/** 角色对应的翻译键映射 */
const roleLabelKeys: Record<string, string> = {
  system_admin: 'pendingApprovals.roles.system_admin',
  maintenance_lead: 'pendingApprovals.roles.maintenance_lead',
  technician: 'pendingApprovals.roles.technician',
  operator: 'pendingApprovals.roles.operator',
  viewer: 'pendingApprovals.roles.viewer',
};

/**
 * 待审批列表页面
 *
 * 以表格形式展示所有待审批任务，支持直接通过/驳回或跳转工单详情。
 */
export default function PendingApprovalsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: approvals, isLoading } = usePendingApprovals();
  const approveMutation = useApproveWorkOrder();
  const rejectMutation = useRejectApproval();

  // 驳回对话框状态
  const [rejectTarget, setRejectTarget] = useState<{ id: string; stepOrder: number } | null>(null);
  const [rejectComment, setRejectComment] = useState('');

  /** 审批通过 */
  const handleApprove = (workOrderId: string) => {
    approveMutation.mutate({ id: workOrderId });
  };

  /** 确认驳回 */
  const handleReject = () => {
    if (!rejectTarget) return;
    rejectMutation.mutate(
      { id: rejectTarget.id, comment: rejectComment || undefined },
      { onSettled: () => { setRejectTarget(null); setRejectComment(''); } },
    );
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('pendingApprovals.title')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('pendingApprovals.taskTitle')}</CardTitle>
          <CardDescription>
            {approvals
              ? t('pendingApprovals.count', { count: approvals.length })
              : t('common.loading')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-muted-foreground">{t('common.loading')}</p>
          ) : !approvals || approvals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Inbox className="mb-3 h-12 w-12" />
              <p className="text-lg font-medium">{t('pendingApprovals.emptyTitle')}</p>
              <p className="text-sm">{t('pendingApprovals.emptyDescription')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('pendingApprovals.workOrderId')}</TableHead>
                  <TableHead>{t('pendingApprovals.stepLabel')}</TableHead>
                  <TableHead>{t('pendingApprovals.expectedRole')}</TableHead>
                  <TableHead>{t('pendingApprovals.status')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvals.map((approval) => (
                  <TableRow key={approval.id}>
                    <TableCell className="font-medium">
                      <button
                        className="text-primary underline decoration-primary/30 hover:decoration-primary"
                        onClick={() => navigate(`/work-orders/${approval.workOrderId}`)}
                      >
                        {approval.workOrderId.slice(0, 8)}...
                      </button>
                    </TableCell>
                    <TableCell>{t('pendingApprovals.step', { step: approval.stepOrder })}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {roleLabelKeys[approval.expectedRole]
                          ? t(roleLabelKeys[approval.expectedRole])
                          : approval.expectedRole}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-500/10 text-blue-500">{t('pendingApprovals.pending')}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(approval.workOrderId)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                        >
                          <Check className="mr-1 h-4 w-4" />
                          {t('pendingApprovals.approve')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRejectTarget({ id: approval.workOrderId, stepOrder: approval.stepOrder })}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                        >
                          <X className="mr-1 h-4 w-4" />
                          {t('pendingApprovals.reject')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/work-orders/${approval.workOrderId}`)}
                          title={t('pendingApprovals.viewDetails')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 驳回确认对话框 */}
      <Dialog open={!!rejectTarget} onOpenChange={(v) => { if (!v) { setRejectTarget(null); setRejectComment(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('pendingApprovals.rejectTitle')}</DialogTitle>
            <DialogDescription>
              {t('pendingApprovals.rejectDescription', {
                step: rejectTarget?.stepOrder ?? 0,
                id: rejectTarget?.id.slice(0, 8) ?? '',
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">{t('pendingApprovals.rejectReason')}</label>
            <Textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder={t('pendingApprovals.rejectPlaceholder')}
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectComment(''); }}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectMutation.isPending}>
              {rejectMutation.isPending ? t('common.loading') : t('pendingApprovals.confirmReject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
