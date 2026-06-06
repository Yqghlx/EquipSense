import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { SeverityBadge } from './SeverityBadge';
import type { Alert } from '../../types';

interface AlertDetailDrawerProps {
  /** 当前查看的告警，为 null 时隐藏 */
  alert: Alert | null;
  /** 是否打开抽屉 */
  open: boolean;
  /** 关闭抽屉回调 */
  onClose: () => void;
  /** 确认告警回调 */
  onAcknowledge?: (id: string) => void;
  /** 解决告警回调 */
  onResolve?: (id: string) => void;
}

/**
 * 告警详情抽屉组件
 *
 * 以侧边抽屉形式展示告警的完整信息，包括严重级别、状态、
 * 关联设备、触发指标、数值以及时间线。
 * 根据 alert.status 动态显示"确认"和"解决"操作按钮。
 */
export function AlertDetailDrawer({ alert, open, onClose, onAcknowledge, onResolve }: AlertDetailDrawerProps) {
  const { t } = useTranslation();

  if (!alert) return null;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <SheetContent className="w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{alert.alertCode}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          {/* 严重级别与状态标签 */}
          <div className="flex items-center gap-2">
            <SeverityBadge severity={alert.severity} />
            <Badge variant="outline">{t(`alert.${alert.status}` as 'alert.active' | 'alert.acknowledged' | 'alert.resolved')}</Badge>
          </div>
          <Separator />

          {/* 告警详情信息网格 */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">{t('device.name')}</p>
              <p className="font-medium">{alert.deviceName ?? '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('alert.metric')}</p>
              <p className="font-medium">{alert.metric}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('alert.value')}</p>
              <p className="font-medium">{alert.value}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('alert.triggeredAt')}</p>
              <p className="font-medium">{new Date(alert.occurredAt).toLocaleString()}</p>
            </div>
            {alert.acknowledged && (
              <div>
                <p className="text-muted-foreground">{t('alert.triggeredAt')}</p>
                <p className="font-medium">{new Date(alert.occurredAt).toLocaleString()}</p>
              </div>
            )}
            {alert.resolved && (
              <div>
                <p className="text-muted-foreground">{t('alert.resolved')}</p>
                <p className="font-medium">{new Date(alert.occurredAt).toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* active 状态：显示确认和解决按钮 */}
          {alert.status === 'active' && (
            <div className="flex gap-2 pt-2">
              {onAcknowledge && (
                <Button size="sm" variant="outline" onClick={() => onAcknowledge(alert.id)}>
                  {t('alert.acknowledge')}
                </Button>
              )}
              {onResolve && (
                <Button size="sm" onClick={() => onResolve(alert.id)}>
                  {t('alert.resolve')}
                </Button>
              )}
            </div>
          )}

          {/* acknowledged 状态：仅显示解决按钮 */}
          {alert.status === 'acknowledged' && onResolve && (
            <div className="pt-2">
              <Button size="sm" onClick={() => onResolve(alert.id)}>
                {t('alert.resolve')}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
