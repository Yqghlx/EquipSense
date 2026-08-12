import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { useTranslation } from 'react-i18next';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  type NotificationPreferences,
  type ChannelPreference,
} from '../../hooks/useNotificationPreferences';

/** 通知类型定义 */
const notifTypes = [
  { key: 'alert' as const, labelKey: 'notifications.preferences.types.alert', descKey: 'notifications.preferences.types.alertDescription' },
  { key: 'workorder' as const, labelKey: 'notifications.preferences.types.workorder', descKey: 'notifications.preferences.types.workorderDescription' },
  { key: 'system' as const, labelKey: 'notifications.preferences.types.system', descKey: 'notifications.preferences.types.systemDescription' },
] as const;

/** 通知渠道定义 */
const channels = [
  { key: 'signalr' as const, labelKey: 'notifications.preferences.channels.signalr', descKey: 'notifications.preferences.channels.signalrDescription' },
  { key: 'push' as const, labelKey: 'notifications.preferences.channels.push', descKey: 'notifications.preferences.channels.pushDescription' },
  { key: 'email' as const, labelKey: 'notifications.preferences.channels.email', descKey: 'notifications.preferences.channels.emailDescription' },
] as const;

/**
 * 通知偏好设置卡片
 *
 * 以矩阵形式展示「通知类型 × 通知渠道」的开关组合，
 * 用户可按需启用/禁用每个组合。浏览器推送依赖 Web Push API，
 * 额外提供浏览器级别的订阅开关。
 */
export function NotificationPreferenceCard({
  pushSupported,
  isSubscribed,
  permission,
  onSubscribe,
  onUnsubscribe,
}: {
  pushSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | 'default';
  onSubscribe: () => Promise<unknown>;
  onUnsubscribe: () => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const { data: prefs, isLoading } = useNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();

  /** 切换单个渠道开关 */
  const toggleChannel = (type: keyof NotificationPreferences, channel: keyof ChannelPreference) => {
    if (!prefs) return;
    const updated = { ...prefs };
    updated[type] = { ...updated[type], [channel]: !updated[type][channel] };
    updateMutation.mutate(updated);
  };

  /** 切换整行（通知类型）所有渠道 */
  const toggleRow = (type: keyof NotificationPreferences) => {
    if (!prefs) return;
    const current = prefs[type];
    const allOn = current.signalr && current.push && current.email;
    const updated = { ...prefs };
    updated[type] = { signalr: !allOn, push: !allOn, email: !allOn };
    updateMutation.mutate(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('notifications.preferences.title')}</CardTitle>
        <CardDescription>{t('notifications.preferences.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{t('notifications.preferences.loading')}</p>
        ) : prefs ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">{t('notifications.preferences.table.type')}</TableHead>
                {channels.map((ch) => (
                  <TableHead key={ch.key} className="text-center">{t(ch.labelKey)}</TableHead>
                ))}
                <TableHead className="w-[80px] text-center">{t('notifications.preferences.table.all')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifTypes.map((nt) => {
                const rowPrefs = prefs[nt.key];
                const allOn = rowPrefs.signalr && rowPrefs.push && rowPrefs.email;
                return (
                  <TableRow key={nt.key}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{t(nt.labelKey)}</p>
                        <p className="text-xs text-muted-foreground">{t(nt.descKey)}</p>
                      </div>
                    </TableCell>
                    {channels.map((ch) => {
                      const isPush = ch.key === 'push';
                      const disabled = isPush ? !pushSupported || permission === 'denied' : false;
                      return (
                        <TableCell key={ch.key} className="text-center">
                          <Switch
                            checked={rowPrefs[ch.key]}
                            disabled={disabled || updateMutation.isPending}
                            aria-label={t('notifications.preferences.toggleChannel', {
                              type: t(nt.labelKey),
                              channel: t(ch.labelKey),
                            })}
                            onCheckedChange={() => toggleChannel(nt.key, ch.key)}
                          />
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center">
                      <Switch
                        checked={allOn}
                        disabled={updateMutation.isPending}
                        aria-label={t('notifications.preferences.toggleAll', { type: t(nt.labelKey) })}
                        onCheckedChange={() => toggleRow(nt.key)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : null}

        <Separator />

        {/* 浏览器推送订阅状态 */}
        <div>
          {!pushSupported ? (
            <p className="text-sm text-muted-foreground">{t('notifications.preferences.push.unsupported')}</p>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('notifications.preferences.push.title')}</p>
                <p className="text-xs text-muted-foreground">
                  {isSubscribed
                    ? t('notifications.preferences.push.subscribed')
                    : t('notifications.preferences.push.notSubscribed')}
                </p>
              </div>
              <Switch
                checked={isSubscribed}
                disabled={permission === 'denied'}
                aria-label={t('notifications.preferences.push.title')}
                onCheckedChange={async (checked) => {
                  if (checked) {
                    await onSubscribe();
                  } else {
                    await onUnsubscribe();
                  }
                }}
              />
            </div>
          )}
          {permission === 'denied' && (
            <p className="text-xs text-orange-600 mt-1">
              {t('notifications.preferences.push.permissionDenied')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
