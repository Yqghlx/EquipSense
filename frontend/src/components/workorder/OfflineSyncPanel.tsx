import { useState, useEffect } from 'react';
import { RefreshCw, CloudOff, Check, AlertTriangle, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import type { PendingOperation } from '../../types';

/** 操作类型的中文标签映射 */
const operationTypeLabels: Record<string, string> = {
  'work-order-complete': '完成工单',
  'work-order-accept': '验收通过',
  'work-order-reject': '验收驳回',
  'device-note': '设备备注',
};

/**
 * 离线同步面板
 *
 * 展示待同步操作列表，提供手动同步和取消操作的能力。
 * 离线时显示橙色边框提示，在线时提供立即同步按钮。
 */
export function OfflineSyncPanel() {
  const { isOffline } = useOfflineStatus();
  const { pendingCount, isSyncing, lastSyncResult, syncNow, getPending, removePending } = useOfflineQueue();
  const [pendingOps, setPendingOps] = useState<PendingOperation[]>([]);

  useEffect(() => {
    const loadPending = async () => {
      const ops = await getPending();
      setPendingOps(ops);
    };
    loadPending();

    // 每 5 秒刷新待同步操作列表
    const timer = setInterval(loadPending, 5000);
    return () => clearInterval(timer);
  }, [getPending, pendingCount]);

  const handleSync = async () => {
    await syncNow();
    const ops = await getPending();
    setPendingOps(ops);
  };

  // 无待同步且在线时不显示面板
  if (pendingCount === 0 && !isOffline) return null;

  return (
    <Card className={isOffline ? 'border-orange-300 bg-orange-50' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {isOffline ? (
            <CloudOff className="h-4 w-4 text-orange-500" />
          ) : (
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          )}
          {isOffline ? '离线操作队列' : '待同步操作'}
          {pendingCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-white">
              {pendingCount}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 最近一次同步结果摘要 */}
        {lastSyncResult && (
          <div className="space-y-1 text-sm">
            {lastSyncResult.succeeded.length > 0 && (
              <p className="flex items-center gap-1 text-green-600">
                <Check className="h-3 w-3" />
                {lastSyncResult.succeeded.length} 项操作已同步成功
              </p>
            )}
            {lastSyncResult.conflicts.length > 0 && (
              <p className="flex items-center gap-1 text-orange-600">
                <AlertTriangle className="h-3 w-3" />
                {lastSyncResult.conflicts.length} 项操作存在冲突
              </p>
            )}
            {lastSyncResult.failed.length > 0 && (
              <p className="flex items-center gap-1 text-red-600">
                <X className="h-3 w-3" />
                {lastSyncResult.failed.length} 项操作同步失败
              </p>
            )}
          </div>
        )}

        {/* 待同步操作列表 */}
        {pendingOps.length > 0 ? (
          <div className="space-y-2">
            {pendingOps.map((op) => (
              <div
                key={op.id}
                className="flex items-center justify-between rounded border bg-background p-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {operationTypeLabels[op.type] ?? op.type}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(op.timestamp).toLocaleTimeString()}
                  </span>
                  {op.retryCount > 0 && (
                    <span className="text-xs text-orange-500">
                      已重试 {op.retryCount} 次
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePending(op.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">暂无待同步操作</p>
        )}

        {/* 在线且有待同步操作时显示立即同步按钮 */}
        {!isOffline && pendingCount > 0 && (
          <Button onClick={handleSync} disabled={isSyncing} className="w-full">
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? '同步中...' : '立即同步'}
          </Button>
        )}

        {/* 离线时显示提示信息 */}
        {isOffline && (
          <p className="text-xs text-muted-foreground">
            网络恢复后将自动同步所有操作
          </p>
        )}
      </CardContent>
    </Card>
  );
}
