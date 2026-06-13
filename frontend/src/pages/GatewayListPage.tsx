/**
 * 网关列表页面
 *
 * 展示当前租户所有已注册的边缘网关，支持查看在线状态和跳转监控。
 */
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Network, Loader2, Wifi, WifiOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useGateways } from '../hooks/useGateways';
import { formatDate } from '../lib/utils';

export default function GatewayListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: gateways, isLoading, refetch } = useGateways();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('gateway.listTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('gateway.listDescription')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          刷新
        </Button>
      </div>

      {!gateways?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Network className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-sm text-muted-foreground">{t('gateway.noGateways')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('gateway.noGatewaysHint')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gateways.map((gw) => (
            <Card key={gw.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">{gw.name}</CardTitle>
                  <GatewayStatusBadge status={gw.status} />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Network className="h-3.5 w-3.5" />
                  <span className="font-mono text-xs">{gw.gatewayId}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('gateway.deviceCount')}</p>
                    <p className="font-medium">{gw.deviceCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('gateway.version')}</p>
                    <p className="font-medium">{gw.version ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('gateway.address')}</p>
                    <p className="font-medium text-xs">{gw.host}:{gw.healthPort}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('gateway.lastHeartbeat')}</p>
                    <p className="font-medium text-xs">{gw.lastHeartbeatAt ? formatDate(gw.lastHeartbeatAt) : '-'}</p>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/gateways/${gw.gatewayId}`)}
                    disabled={gw.status === 'offline'}
                  >
                    {gw.status === 'online' ? <Wifi className="mr-1 h-4 w-4" /> : <WifiOff className="mr-1 h-4 w-4" />}
                    {t('gateway.monitor')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/** 网关状态徽标 */
function GatewayStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    online: { label: '在线', variant: 'default' },
    offline: { label: '离线', variant: 'secondary' },
    disabled: { label: '已禁用', variant: 'destructive' },
  };
  const { label, variant } = config[status] ?? { label: status, variant: 'secondary' as const };
  return <Badge variant={variant}>{label}</Badge>;
}
