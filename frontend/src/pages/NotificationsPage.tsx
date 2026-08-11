/**
 * 通知中心页面
 *
 * 展示用户所有通知记录，支持筛选、标记已读、删除操作。
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Check, CheckCheck, Trash2, ExternalLink, Inbox, AlertTriangle, Wrench, Info } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
  useDeleteNotification,
} from '../hooks/useNotifications';
import { formatDate } from '../lib/utils';

/** 通知类型对应的图标和颜色 */
const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  alert: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
  workorder: { icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  system: { icon: Info, color: 'text-gray-500', bg: 'bg-gray-500/10' },
};

/** 筛选选项 */
type FilterType = 'all' | 'unread' | 'alert' | 'workorder' | 'system';

/**
 * 通知中心页面
 */
export default function NotificationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterType>('all');

  const unreadOnly = filter === 'unread' ? true : undefined;
  const { data, isLoading } = useNotifications({ page, pageSize: 20, unreadOnly });
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const deleteNotification = useDeleteNotification();

  /** 前端按类型过滤（后端仅支持 unreadOnly 过滤） */
  const filteredItems = data?.items.filter((item) => {
    if (filter === 'all' || filter === 'unread') return true;
    return item.type === filter;
  }) ?? [];

  /** 点击通知项 */
  const handleClick = (item: typeof filteredItems[number]) => {
    if (!item.isRead) {
      markRead.mutate(item.id);
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('notifications.title')}</h1>
        <Button
          size="sm"
          variant="outline"
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending}
        >
          <CheckCheck className="mr-1 h-4 w-4" />
          {t('notifications.markAllRead')}
        </Button>
      </div>

      {/* 筛选标签 */}
      <div className="flex gap-2">
        {([
          { value: 'all', key: 'notifications.filterAll' },
          { value: 'unread', key: 'notifications.filterUnread' },
          { value: 'alert', key: 'notifications.filterAlert' },
          { value: 'workorder', key: 'notifications.filterWorkorder' },
          { value: 'system', key: 'notifications.filterSystem' },
        ] as { value: FilterType; key: string }[]).map(({ value, key }) => (
          <Button
            key={value}
            size="sm"
            variant={filter === value ? 'default' : 'outline'}
            onClick={() => { setFilter(value); setPage(1); }}
          >
            {t(key)}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="py-8 text-center text-muted-foreground">{t('common.loading')}</p>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Inbox className="mb-3 h-12 w-12" />
              <p className="text-lg font-medium">{t('notifications.emptyTitle')}</p>
              <p className="text-sm">
                {filter === 'unread' ? t('notifications.emptyUnread') : t('notifications.emptyAll')}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">{t('notifications.type')}</TableHead>
                  <TableHead>{t('notifications.subject')}</TableHead>
                  <TableHead>{t('notifications.content')}</TableHead>
                  <TableHead>{t('common.time')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const config = typeConfig[item.type] ?? typeConfig.system;
                  const Icon = config.icon;
                  return (
                    <TableRow
                      key={item.id}
                      className={`cursor-pointer ${!item.isRead ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
                      onClick={() => handleClick(item)}
                    >
                      <TableCell>
                        <div className={`rounded-lg p-2 ${config.bg}`}>
                          <Icon className={`h-4 w-4 ${config.color}`} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {!item.isRead && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                          )}
                          <span className={`text-sm ${!item.isRead ? 'font-medium' : 'text-muted-foreground'}`}>
                            {item.title}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {item.content ?? '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {!item.isRead && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => markRead.mutate(item.id)}
                              title={t('notifications.markRead')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {item.link && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => navigate(item.link!)}
                              title={t('notifications.viewDetails')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteNotification.mutate(item.id)}
                            title={t('common.delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* 分页 */}
        {data && data.total > 20 && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
            <span>{t('common.totalItems', { count: data.total })}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                {t('common.previous')}
              </Button>
              <Button variant="outline" size="sm" disabled={page * 20 >= data.total} onClick={() => setPage(page + 1)}>
                {t('common.next')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
