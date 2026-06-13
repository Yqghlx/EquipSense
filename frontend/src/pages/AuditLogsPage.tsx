/**
 * 审计日志页面
 *
 * 展示系统中所有敏感操作的审计记录（设备/工单/告警/用户的增删改），
 * 支持按动作、资源类型筛选，并可导出 CSV 用于合规追溯。
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Download } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { useAuditLogs, exportAuditLogsCsv } from '../hooks/useAuditLogs';
import { formatDate } from '../lib/utils';

/** 动作类型对应的 Badge 颜色 */
const actionVariant: Record<string, string> = {
  Create: 'bg-green-500/10 text-green-600',
  Update: 'bg-blue-500/10 text-blue-600',
  Delete: 'bg-red-500/10 text-red-600',
  Login: 'bg-purple-500/10 text-purple-600',
  Logout: 'bg-gray-500/10 text-gray-600',
};

export default function AuditLogsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string | undefined>();
  const [resourceFilter, setResourceFilter] = useState<string | undefined>();

  const { data, isLoading } = useAuditLogs({ page, pageSize: 20, action: actionFilter, resourceType: resourceFilter });

  /** 导出 CSV */
  const handleExport = async () => {
    try {
      await exportAuditLogsCsv({ action: actionFilter, resourceType: resourceFilter });
    } catch {
      // 导出失败静默处理（网络错误等），实际可加 toast
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            {t('audit.title', '审计日志')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('audit.description', '记录系统中所有敏感操作，用于合规追溯')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          {t('common.export', '导出 CSV')}
        </Button>
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <span className="text-sm text-muted-foreground">{t('common.filter', '筛选')}:</span>
          <select
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            value={actionFilter ?? ''}
            onChange={(e) => { setActionFilter(e.target.value || undefined); setPage(1); }}
          >
            <option value="">{t('audit.allActions', '全部动作')}</option>
            <option value="Create">Create</option>
            <option value="Update">Update</option>
            <option value="Delete">Delete</option>
            <option value="Login">Login</option>
            <option value="Logout">Logout</option>
          </select>
          <select
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            value={resourceFilter ?? ''}
            onChange={(e) => { setResourceFilter(e.target.value || undefined); setPage(1); }}
          >
            <option value="">{t('audit.allResources', '全部资源')}</option>
            <option value="Device">Device</option>
            <option value="WorkOrder">WorkOrder</option>
            <option value="Alert">Alert</option>
            <option value="User">User</option>
            <option value="AlertRule">AlertRule</option>
          </select>
        </CardContent>
      </Card>

      {/* 审计日志表格 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('audit.action', '动作')}</TableHead>
                <TableHead>{t('audit.resource', '资源')}</TableHead>
                <TableHead>{t('audit.descColumn', '描述')}</TableHead>
                <TableHead>{t('audit.ip', 'IP 地址')}</TableHead>
                <TableHead>{t('audit.method', '方法')}</TableHead>
                <TableHead>{t('audit.time', '时间')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    {t('common.loading', '加载中...')}
                  </TableCell>
                </TableRow>
              ) : data && data.items.length > 0 ? (
                data.items.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge className={actionVariant[log.action] ?? 'bg-gray-500/10 text-gray-600'}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{log.resourceType}</TableCell>
                    <TableCell className="text-sm max-w-md truncate" title={log.description}>
                      {log.description}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.ipAddress ?? '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.httpMethod ?? '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(log.createdAt)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    {t('common.noData', '暂无数据')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 分页 */}
      {data && data.total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('common.totalItems', '共 {{count}} 条', { count: data.total })}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              {t('common.previous', '上一页')}
            </Button>
            <span className="flex items-center px-3 text-sm">{page}</span>
            <Button variant="outline" size="sm" disabled={page * 20 >= data.total} onClick={() => setPage(p => p + 1)}>
              {t('common.next', '下一页')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
