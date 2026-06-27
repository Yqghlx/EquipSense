import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  type NotificationPreferences,
  type ChannelPreference,
} from '../../hooks/useNotificationPreferences';

/** 通知类型定义 */
const notifTypes = [
  { key: 'alert' as const, label: '告警通知', desc: '设备告警触发、告警状态变更' },
  { key: 'workorder' as const, label: '工单通知', desc: '工单创建、派工、状态变更' },
  { key: 'system' as const, label: '系统通知', desc: '系统配置变更、订阅到期提醒' },
];

/** 通知渠道定义 */
const channels = [
  { key: 'signalr' as const, label: '实时推送', desc: '页面内即时弹出通知' },
  { key: 'push' as const, label: '浏览器推送', desc: '浏览器未打开时推送通知' },
  { key: 'email' as const, label: '邮件通知', desc: '发送到注册邮箱（需配置 SMTP）' },
];

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
        <CardTitle className="text-base">通知偏好设置</CardTitle>
        <CardDescription>按通知类型和渠道自定义接收方式</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">加载中...</p>
        ) : prefs ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">通知类型</TableHead>
                {channels.map((ch) => (
                  <TableHead key={ch.key} className="text-center">{ch.label}</TableHead>
                ))}
                <TableHead className="w-[80px] text-center">全部</TableHead>
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
                        <p className="text-sm font-medium">{nt.label}</p>
                        <p className="text-xs text-muted-foreground">{nt.desc}</p>
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
                            onCheckedChange={() => toggleChannel(nt.key, ch.key)}
                          />
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center">
                      <Switch
                        checked={allOn}
                        disabled={updateMutation.isPending}
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
            <p className="text-sm text-muted-foreground">当前浏览器不支持推送通知，浏览器推送渠道不可用</p>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">浏览器推送订阅</p>
                <p className="text-xs text-muted-foreground">
                  {isSubscribed ? '已订阅，浏览器推送渠道可正常工作' : '未订阅，请开启以启用浏览器推送'}
                </p>
              </div>
              <Switch
                checked={isSubscribed}
                disabled={permission === 'denied'}
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
              通知权限已被拒绝，请在浏览器设置中手动开启
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
