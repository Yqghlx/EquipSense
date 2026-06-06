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

/** 角色对应的中文标签映射 */
const roleLabels: Record<string, string> = {
  system_admin: '系统管理员',
  maintenance_lead: '维修主管',
  technician: '技术员',
  operator: '操作员',
  viewer: '查看者',
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
      <h1 className="text-2xl font-bold">待审批</h1>

      <Card>
        <CardHeader>
          <CardTitle>我的待审批任务</CardTitle>
          <CardDescription>
            {approvals
              ? `共 ${approvals.length} 条待审批`
              : t('common.loading')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-muted-foreground">{t('common.loading')}</p>
          ) : !approvals || approvals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Inbox className="mb-3 h-12 w-12" />
              <p className="text-lg font-medium">暂无待审批任务</p>
              <p className="text-sm">所有审批任务都已处理完毕</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>工单 ID</TableHead>
                  <TableHead>审批步骤</TableHead>
                  <TableHead>期望角色</TableHead>
                  <TableHead>状态</TableHead>
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
                    <TableCell>第 {approval.stepOrder} 级</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {roleLabels[approval.expectedRole] ?? approval.expectedRole}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-500/10 text-blue-500">待审批</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(approval.workOrderId)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                        >
                          <Check className="mr-1 h-4 w-4" />
                          通过
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRejectTarget({ id: approval.workOrderId, stepOrder: approval.stepOrder })}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                        >
                          <X className="mr-1 h-4 w-4" />
                          驳回
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/work-orders/${approval.workOrderId}`)}
                          title="查看工单详情"
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
            <DialogTitle>驳回审批</DialogTitle>
            <DialogDescription>
              驳回第 {rejectTarget?.stepOrder} 级审批（工单 {rejectTarget?.id.slice(0, 8)}...）
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">驳回原因（可选）</label>
            <Textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="请填写驳回原因..."
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectComment(''); }}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectMutation.isPending}>
              {rejectMutation.isPending ? t('common.loading') : '确认驳回'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
