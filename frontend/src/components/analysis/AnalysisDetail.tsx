import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { ConfidenceMeter } from './ConfidenceMeter';
import type { Analysis } from '../../types';

interface AnalysisDetailProps {
  /** 分析结果数据 */
  analysis: Analysis;
}

/** 分析级别对应的翻译键映射 */
const levelLabelKeys: Record<string, string> = {
  L1: 'analysis.levelOptions.l1',
  L2: 'analysis.levelOptions.l2',
  L3: 'analysis.levelOptions.l3',
};

/** 分析状态对应的翻译键映射 */
const statusLabelKeys: Record<string, string> = {
  pending: 'analysis.status.pending',
  running: 'analysis.status.running',
  completed: 'analysis.status.completed',
  failed: 'analysis.status.failed',
};

/**
 * 分析详情展开面板组件
 *
 * 展示分析结果的完整信息，包括：
 * - 级别和状态徽章
 * - 置信度仪表盘 + 数据质量评分
 * - 根因分析结论
 * - 建议措施
 */
export function AnalysisDetail({ analysis }: AnalysisDetailProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* 级别、状态、耗时 */}
      <div className="flex items-center gap-2">
        <Badge variant="outline">{levelLabelKeys[analysis.level] ? t(levelLabelKeys[analysis.level]) : analysis.level}</Badge>
        <Badge variant="outline">{statusLabelKeys[analysis.status] ? t(statusLabelKeys[analysis.status]) : analysis.status}</Badge>
        {analysis.processingTimeMs && (
          <span className="text-xs text-muted-foreground">{t('analysis.durationMs', { ms: analysis.processingTimeMs })}</span>
        )}
      </div>

      {/* 置信度仪表盘 */}
      {analysis.confidence != null && (
        <Card>
          <CardContent className="flex items-center gap-6 p-4">
            <ConfidenceMeter confidence={analysis.confidence} size="sm" />
            <div>
              <p className="text-sm font-medium">{t('analysis.confidence')}</p>
              <p className="text-2xl font-bold">{Math.round(analysis.confidence * 100)}%</p>
              {analysis.dataQualityScore != null && (
                <p className="text-xs text-muted-foreground">{t('analysis.dataQualityScore')}: {Math.round(analysis.dataQualityScore * 100)}%</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 根因分析 */}
      {analysis.rootCause && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-2 text-sm font-medium">{t('analysis.rootCauseAnalysis')}</p>
            <p className="text-sm whitespace-pre-wrap">{analysis.rootCause}</p>
          </CardContent>
        </Card>
      )}

      {/* 建议措施 */}
      {analysis.suggestion && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-2 text-sm font-medium">{t('analysis.suggestedActions')}</p>
            <p className="text-sm whitespace-pre-wrap">{analysis.suggestion}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
