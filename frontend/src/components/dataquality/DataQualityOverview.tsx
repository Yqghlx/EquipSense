import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useDataQualityOverview } from '../../hooks/useDataQuality';
import { DataQualityRadar } from './DataQualityRadar';

interface DataQualityOverviewProps {
  deviceId: string;
}

/**
 * 设备数据质量概览组件
 *
 * 展示设备综合数据质量雷达图和各指标评分条形图。
 * 用于设备详情页中嵌入。
 */
export function DataQualityOverviewCard({ deviceId }: DataQualityOverviewProps) {
  const { t } = useTranslation();
  const { data, isLoading } = useDataQualityOverview(deviceId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>{t('dataquality.title')}</CardTitle></CardHeader>
        <CardContent><div className="py-8 text-center text-muted-foreground">{t('common.loading')}</div></CardContent>
      </Card>
    );
  }

  if (!data || !Array.isArray(data.metrics) || data.metrics.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>{t('dataquality.title')}</CardTitle></CardHeader>
        <CardContent><div className="py-8 text-center text-muted-foreground">{t('dataquality.noData')}</div></CardContent>
      </Card>
    );
  }

  /** 综合评分对应的颜色 */
  const scoreColor = (score: number) =>
    score >= 0.8 ? 'bg-green-500' : score >= 0.6 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <Card>
      <CardHeader><CardTitle>{t('dataquality.title')}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {/* 综合评分雷达图（取第一个有维度数据的指标） */}
        {data.metrics[0]?.dimensions && (
          <DataQualityRadar dimensions={data.metrics[0].dimensions} overallScore={data.overallScore} />
        )}

        {/* 各指标评分条形图 */}
        <div className="space-y-2">
          {data.metrics.map((m) => (
            <div key={m.metric} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{m.metric}</span>
                <span className="text-muted-foreground">{Math.round(m.score * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${scoreColor(m.score)}`}
                  style={{ width: `${Math.round(m.score * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
