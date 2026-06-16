import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { AlertDetailDrawer } from '../components/alert/AlertDetailDrawer';
import { SeverityBadge } from '../components/alert/SeverityBadge';
import { useAlerts, useAcknowledgeAlert, useResolveAlert } from '../hooks/useAlerts';
import api from '../lib/api';
import type { Alert } from '../types';

/** 导出当前筛选条件下的告警为 CSV（触发浏览器下载） */
async function exportAlertsCsv(status: string, severity: string) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (severity) params.set('severity', severity);
  const query = params.toString();
  const response = await api.get(`/alerts/export${query ? `?${query}` : ''}`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `alerts_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 告警中心页
 *
 * 功能：按状态/严重级别过滤、分页浏览、确认/解决操作、点击行查看详情抽屉。
 */
export default function AlertCenterPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');
  const [severity, setSeverity] = useState<string>('');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading } = useAlerts(
    { page, pageSize: 20 },
    { status: status || undefined, severity: severity || undefined },
  );
  const acknowledgeAlert = useAcknowledgeAlert();
  const resolveAlert = useResolveAlert();

  /** 点击告警行打开详情抽屉 */
  const handleRowClick = (alert: Alert) => {
    setSelectedAlert(alert);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('alert.title')}</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportAlertsCsv(status, severity)}
        >
          <Download className="h-4 w-4 mr-2" />
          {t('common.export', '导出 CSV')}
        </Button>
      </div>

      {/* 过滤条件：状态 + 严重级别 */}
      <div className="flex gap-3">
        <Select value={status} onValueChange={(v) => { if (v !== null) { setStatus(v === 'all' ? '' : v); setPage(1); } }}>
          <SelectTrigger className="w-32"><SelectValue placeholder={t('common.status')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="active">{t('alert.active')}</SelectItem>
            <SelectItem value="acknowledged">{t('alert.acknowledged')}</SelectItem>
            <SelectItem value="resolved">{t('alert.resolved')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severity} onValueChange={(v) => { if (v !== null) { setSeverity(v === 'all' ? '' : v); setPage(1); } }}>
          <SelectTrigger className="w-32"><SelectValue placeholder={t('alert.severity')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="critical">{t('alert.critical')}</SelectItem>
            <SelectItem value="high">{t('alert.high')}</SelectItem>
            <SelectItem value="normal">{t('alert.normal')}</SelectItem>
            <SelectItem value="low">{t('alert.low')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 告警列表表格或加载状态 */}
      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">{t('common.loading')}</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('alert.alertCode')}</TableHead>
                <TableHead>{t('device.name')}</TableHead>
                <TableHead>{t('alert.metric')}</TableHead>
                <TableHead>{t('alert.value')}</TableHead>
                <TableHead>{t('alert.severity')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('alert.triggeredAt')}</TableHead>
                <TableHead>{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">{t('common.noData')}</TableCell></TableRow>
              ) : (
                data?.items.map((alert) => (
                  <TableRow
                    key={alert.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(alert)}
                  >
                    <TableCell className="font-mono text-sm">{alert.alertCode}</TableCell>
                    <TableCell className="font-mono text-xs">{alert.deviceId.slice(0,8)}…</TableCell>
                    <TableCell>{alert.metric}</TableCell>
                    <TableCell>{alert.value}</TableCell>
                    <TableCell><SeverityBadge severity={alert.severity} /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-sm">
                        {t(`alert.${alert.status.toLowerCase()}` as 'alert.active' | 'alert.acknowledged' | 'alert.resolved')}
                      </Button>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(alert.occurredAt).toLocaleString()}</TableCell>
                    <TableCell>
                      {/* 操作按钮：阻止行点击事件冒泡 */}
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {alert.status === 'active' && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => acknowledgeAlert.mutate(alert.id)}>
                              {t('alert.acknowledge')}
                            </Button>
                            <Button size="sm" onClick={() => resolveAlert.mutate(alert.id)}>
                              {t('alert.resolve')}
                            </Button>
                          </>
                        )}
                        {alert.status === 'acknowledged' && (
                          <Button size="sm" onClick={() => resolveAlert.mutate(alert.id)}>
                            {t('alert.resolve')}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* 分页控制 */}
          {data && data.total > 20 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{t('common.totalItems', { count: data.total })}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t('common.previous')}</Button>
                <Button variant="outline" size="sm" disabled={page * 20 >= data.total} onClick={() => setPage(page + 1)}>{t('common.next')}</Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 告警详情侧边抽屉 */}
      <AlertDetailDrawer
        alert={selectedAlert}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAcknowledge={(id) => { acknowledgeAlert.mutate(id); setDrawerOpen(false); }}
        onResolve={(id) => { resolveAlert.mutate(id); setDrawerOpen(false); }}
      />
    </div>
  );
}
