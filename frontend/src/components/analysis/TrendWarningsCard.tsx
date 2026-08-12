import { AlertTriangle, ArrowRight, Loader2, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { useTrendWarnings, type TrendAnalysisResult } from '../../hooks/useTrendAnalysis';

const MAX_VISIBLE_WARNINGS = 5;

type RiskLevel = 'critical' | 'warning' | 'info' | 'noEstimate';
type DirectionKey = 'up' | 'down' | 'stable' | 'unknown';
type ValidTrendWarning = TrendAnalysisResult & { deviceId: string; metric: string };

const riskStyles: Record<RiskLevel, { row: string; badge: string }> = {
  critical: {
    row: 'border-l-red-500 bg-red-500/[0.04] hover:border-red-500/70 hover:bg-red-500/[0.08]',
    badge: 'border-red-300 bg-red-500/10 text-red-700 dark:border-red-800 dark:text-red-300',
  },
  warning: {
    row: 'border-l-amber-500 bg-amber-500/[0.04] hover:border-amber-500/70 hover:bg-amber-500/[0.08]',
    badge: 'border-amber-300 bg-amber-500/10 text-amber-700 dark:border-amber-800 dark:text-amber-300',
  },
  info: {
    row: 'border-l-blue-500 bg-blue-500/[0.04] hover:border-blue-500/70 hover:bg-blue-500/[0.08]',
    badge: 'border-blue-300 bg-blue-500/10 text-blue-700 dark:border-blue-800 dark:text-blue-300',
  },
  noEstimate: {
    row: 'border-l-slate-400 bg-slate-500/[0.03] hover:border-slate-400/80 hover:bg-slate-500/[0.06]',
    badge: 'border-slate-300 bg-slate-500/10 text-slate-700 dark:border-slate-700 dark:text-slate-300',
  },
};

/** 只格式化有限数字，避免异常接口数据把 NaN/Infinity 展示给运维人员。 */
function formatNumber(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : '—';
}

/** 统一设备标识的视觉长度，同时保留完整值供无障碍名称和 title 使用。 */
function formatDeviceId(deviceId: string): string {
  return deviceId.length > 14 ? `${deviceId.slice(0, 12)}…` : deviceId;
}

function getRiskLevel(daysToThreshold: number | null): RiskLevel {
  if (typeof daysToThreshold === 'number' && Number.isFinite(daysToThreshold)) {
    if (daysToThreshold <= 1) return 'critical';
    if (daysToThreshold <= 3) return 'warning';
    return 'info';
  }
  return 'noEstimate';
}

function getDirectionKey(direction: string | null | undefined): DirectionKey {
  const normalized = direction?.trim().toLowerCase();
  if (direction === '上升' || normalized === 'up' || normalized === 'rising') return 'up';
  if (direction === '下降' || normalized === 'down' || normalized === 'falling') return 'down';
  if (direction === '平稳' || normalized === 'stable' || normalized === 'steady') return 'stable';
  return 'unknown';
}

function getFiniteDays(warning: TrendAnalysisResult): number {
  return typeof warning.daysToThreshold === 'number' && Number.isFinite(warning.daysToThreshold)
    ? warning.daysToThreshold
    : Number.POSITIVE_INFINITY;
}

/** 运行时接口数据不可信，先过滤掉无法安全导航和展示的记录。 */
function isValidWarning(warning: unknown): warning is ValidTrendWarning {
  if (typeof warning !== 'object' || warning === null) return false;

  const candidate = warning as { deviceId?: unknown; metric?: unknown };
  return typeof candidate.deviceId === 'string'
    && candidate.deviceId.trim().length > 0
    && typeof candidate.metric === 'string'
    && candidate.metric.trim().length > 0;
}

function getDirectionLabel(t: ReturnType<typeof useTranslation>['t'], directionKey: DirectionKey): string {
  switch (directionKey) {
    case 'up':
      return t('dashboard.trendWarnings.direction.up');
    case 'down':
      return t('dashboard.trendWarnings.direction.down');
    case 'stable':
      return t('dashboard.trendWarnings.direction.stable');
    default:
      return t('dashboard.trendWarnings.direction.unknown');
  }
}

function getRiskLabel(t: ReturnType<typeof useTranslation>['t'], riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'critical':
      return t('dashboard.trendWarnings.risk.critical');
    case 'warning':
      return t('dashboard.trendWarnings.risk.warning');
    case 'info':
      return t('dashboard.trendWarnings.risk.info');
    default:
      return t('dashboard.trendWarnings.risk.noEstimate');
  }
}

function getExactDaysLabel(
  t: ReturnType<typeof useTranslation>['t'],
  daysToThreshold: number | null,
): string {
  if (typeof daysToThreshold !== 'number' || !Number.isFinite(daysToThreshold)) {
    return t('dashboard.trendWarnings.noEstimate');
  }

  return daysToThreshold === 1
    ? t('dashboard.trendWarnings.oneDay')
    : t('dashboard.trendWarnings.days', { count: daysToThreshold });
}

/**
 * 仪表盘趋势预警卡片。
 *
 * 该组件只展示后端已经筛选出的 7 天预警，不把预测结果当成新的告警写回系统，
 * 避免用户在仪表盘看到的摘要和告警中心产生重复事件。
 */
export default function TrendWarningsCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useTrendWarnings();
  const warnings = Array.isArray(data)
    ? data
      .filter(isValidWarning)
      .map((warning) => ({
        ...warning,
        deviceId: warning.deviceId.trim(),
        metric: warning.metric.trim(),
      }))
    : [];
  const sortedWarnings = [...warnings].sort((a, b) => getFiniteDays(a) - getFiniteDays(b));
  const visibleWarnings = sortedWarnings.slice(0, MAX_VISIBLE_WARNINGS);
  const remainingCount = Math.max(0, sortedWarnings.length - visibleWarnings.length);

  return (
    <Card aria-labelledby="dashboard-trend-warnings-title">
      <CardHeader className="border-b border-border/60">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle
              id="dashboard-trend-warnings-title"
              role="heading"
              aria-level={2}
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
              {t('dashboard.trendWarnings.title')}
            </CardTitle>
            <CardDescription>{t('dashboard.trendWarnings.description')}</CardDescription>
          </div>
          <Badge variant="outline" className="shrink-0">
            {t('dashboard.trendWarnings.count', { count: sortedWarnings.length })}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {isLoading && (
          <div role="status" aria-live="polite" className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {t('common.loading')}
          </div>
        )}

        {!isLoading && isError && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t('dashboard.trendWarnings.loadFailed')}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              {t('dashboard.trendWarnings.retry')}
            </Button>
          </div>
        )}

        {!isLoading && !isError && sortedWarnings.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('dashboard.trendWarnings.empty')}
          </p>
        )}

        {!isLoading && sortedWarnings.length > 0 && (
          <div className="space-y-2">
            {visibleWarnings.map((warning) => {
              const riskLevel = getRiskLevel(warning.daysToThreshold);
              const directionKey = getDirectionKey(warning.trendDirection);
              const riskLabel = getRiskLabel(t, riskLevel);
              const exactDays = getExactDaysLabel(t, warning.daysToThreshold);
              const directionLabel = getDirectionLabel(t, directionKey);

              return (
                <button
                  key={`${warning.deviceId}-${warning.metric}`}
                  type="button"
                  className={`group flex w-full items-stretch gap-3 rounded-lg border border-border/70 border-l-4 p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${riskStyles[riskLevel].row}`}
                  aria-label={t('dashboard.trendWarnings.openDevice', {
                    deviceId: warning.deviceId,
                    metric: warning.metric,
                  })}
                  onClick={() => navigate(`/devices/${warning.deviceId}`)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{warning.metric}</span>
                      <Badge variant="outline" className="text-xs">
                        {directionLabel}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate font-mono text-xs text-muted-foreground" title={warning.deviceId}>
                      {formatDeviceId(warning.deviceId)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        {t('dashboard.trendWarnings.currentValue')}: {formatNumber(warning.currentValue)}
                      </span>
                      <span>
                        {t('dashboard.trendWarnings.threshold')}: {formatNumber(warning.threshold)}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end justify-between gap-2">
                    <Badge variant="outline" className={riskStyles[riskLevel].badge}>
                      {riskLabel}
                    </Badge>
                    <span className="text-xs font-medium text-muted-foreground">{exactDays}</span>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </button>
              );
            })}
            {remainingCount > 0 && (
              <p className="pt-1 text-center text-xs text-muted-foreground">
                {t('dashboard.trendWarnings.more', { count: remainingCount })}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
