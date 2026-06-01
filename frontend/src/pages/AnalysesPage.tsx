import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { AnalysisDetail } from '../components/analysis/AnalysisDetail';
import { useAnalyses, useTriggerAnalysis } from '../hooks/useAnalyses';
import { useAlerts } from '../hooks/useAlerts';

/** 分析级别标签 */
const levelLabels: Record<string, string> = { L1: 'L1', L2: 'L2', L3: 'L3' };



/**
 * AI 分析列表页
 *
 * 展示分析结果分页列表，支持按级别和状态筛选、
 * 行展开查看分析详情、手动触发新分析。
 */
export default function AnalysesPage() {
  const { t } = useTranslation();

  /** 分析状态中文标签 */
  const statusLabels: Record<string, string> = {
    pending: t('analysis.status.pending'),
    running: t('analysis.status.running'),
    completed: t('analysis.status.completed'),
    failed: t('analysis.status.failed'),
  };

  const [page, setPage] = useState(1);
  const [level, setLevel] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [triggerDialogOpen, setTriggerDialogOpen] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState('');

  const { data, isLoading } = useAnalyses(
    { page, pageSize: 20 },
    { level: level || undefined, status: status || undefined },
  );
  const triggerAnalysis = useTriggerAnalysis();
  const { data: alertsData } = useAlerts({ page: 1, pageSize: 50 }, { status: 'active' });

  /** 手动触发分析 */
  const handleTrigger = async () => {
    if (!selectedAlertId) return;
    await triggerAnalysis.mutateAsync({ alertId: selectedAlertId });
    setTriggerDialogOpen(false);
    setSelectedAlertId('');
  };

  return (
    <div className="space-y-4">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('analysis.title')}</h1>
        <Button onClick={() => setTriggerDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />{t('analysis.manualTrigger')}
        </Button>
      </div>

      {/* 筛选栏 */}
      <div className="flex gap-3">
        <Select value={level} onValueChange={(v) => { if (v != null) { setLevel(v === 'all' ? '' : v); setPage(1); } }}>
          <SelectTrigger className="w-28"><SelectValue placeholder={t('analysis.level')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="L1">L1</SelectItem>
            <SelectItem value="L2">L2</SelectItem>
            <SelectItem value="L3">L3</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { if (v != null) { setStatus(v === 'all' ? '' : v); setPage(1); } }}>
          <SelectTrigger className="w-28"><SelectValue placeholder={t('common.status')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="completed">{t('analysis.status.completed')}</SelectItem>
            <SelectItem value="running">{t('analysis.status.running')}</SelectItem>
            <SelectItem value="pending">{t('analysis.status.pending')}</SelectItem>
            <SelectItem value="failed">{t('analysis.status.failed')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 分析结果表格 */}
      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">{t('common.loading')}</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common.id')}</TableHead>
              <TableHead>{t('analysis.device')}</TableHead>
              <TableHead>{t('analysis.level')}</TableHead>
              <TableHead>{t('analysis.confidence')}</TableHead>
              <TableHead>{t('analysis.dataQuality')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead>{t('analysis.duration')}</TableHead>
              <TableHead>{t('analysis.completedAt')}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">{t('common.noData')}</TableCell>
              </TableRow>
            ) : (
              data?.items.map((analysis) => (
                <>
                  <TableRow
                    key={analysis.id}
                    className="cursor-pointer"
                    onClick={() => setExpandedId(expandedId === analysis.id ? null : analysis.id)}
                  >
                    <TableCell className="font-mono text-xs">{analysis.id.slice(0, 8)}</TableCell>
                    <TableCell>{analysis.deviceId.slice(0, 8)}</TableCell>
                    <TableCell><Badge variant="outline">{levelLabels[analysis.level] ?? analysis.level}</Badge></TableCell>
                    <TableCell>{analysis.confidence != null ? `${Math.round(analysis.confidence * 100)}%` : '-'}</TableCell>
                    <TableCell>{analysis.dataQualityScore != null ? `${Math.round(analysis.dataQualityScore)}%` : '-'}</TableCell>
                    <TableCell><Badge variant="outline">{statusLabels[analysis.status] ?? analysis.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{analysis.processingTimeMs ? `${analysis.processingTimeMs}ms` : '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{analysis.completedAt ? new Date(analysis.completedAt).toLocaleString() : '-'}</TableCell>
                    <TableCell>
                      {expandedId === analysis.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </TableCell>
                  </TableRow>
                  {/* 展开的详情面板 */}
                  {expandedId === analysis.id && (
                    <TableRow key={`${analysis.id}-detail`}>
                      <TableCell colSpan={9} className="bg-muted/30 p-4">
                        <AnalysisDetail analysis={analysis} />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* 手动触发分析弹窗 */}
      <Dialog open={triggerDialogOpen} onOpenChange={setTriggerDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('analysis.manualTriggerTitle')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={selectedAlertId} onValueChange={(v) => { if (v != null) setSelectedAlertId(String(v)); }}>
              <SelectTrigger><SelectValue placeholder={t('analysis.selectAlert')} /></SelectTrigger>
              <SelectContent>
                {alertsData?.items.map((alert) => (
                  <SelectItem key={alert.id} value={alert.id}>
                    {alert.alertCode} — {alert.metric} = {alert.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTriggerDialogOpen(false)}>{t('common.cancel')}</Button>
              <Button disabled={!selectedAlertId || triggerAnalysis.isPending} onClick={handleTrigger}>
                {triggerAnalysis.isPending ? t('common.loading') : t('analysis.trigger')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
