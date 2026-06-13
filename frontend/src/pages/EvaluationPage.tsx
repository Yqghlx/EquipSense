import { useTranslation } from 'react-i18next';
import { CheckCircle2, AlertTriangle, XCircle, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useEvaluation } from '../hooks/useEvaluation';

/** 简易进度条（项目无 shadcn Progress 组件，用内联 div 实现） */
function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`h-2 w-full rounded-full bg-muted overflow-hidden ${className}`}>
      <div
        className="h-full bg-primary transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/**
 * AI 诊断评估页面
 *
 * 展示模拟器故障注入的标准答案与 AI 实际诊断的对比结果：
 * - 总体命中率
 * - 命中/误诊/漏报分布
 * - 按故障类型分类
 * - 每条故障的详细对比
 */
export default function EvaluationPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useEvaluation();

  if (isLoading) {
    return <div className="py-20 text-center text-muted-foreground">{t('common.loading')}</div>;
  }

  if (!data || data.totalFaults === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{t('evaluation.title', 'AI 诊断评估')}</h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('evaluation.noData', '暂无评估数据。运行模拟器并带上 --api-url 参数上报标准答案后，此处会显示诊断命中率。')}
          </CardContent>
        </Card>
      </div>
    );
  }

  const hitRatePercent = Math.round(data.hitRate * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('evaluation.title', 'AI 诊断评估')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('evaluation.description', '对比模拟器故障注入的标准答案与 AI 实际诊断结果，量化诊断准确率')}
        </p>
      </div>

      {/* 总览统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('evaluation.hitRate', '命中率')}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{hitRatePercent}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.matchedCount} / {data.totalFaults}
            </p>
            <ProgressBar value={hitRatePercent} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('evaluation.matched', '诊断命中')}
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{data.matchedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('evaluation.mismatched', '诊断有误')}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{data.mismatchedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('evaluation.missed', '漏报')}
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{data.missedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* 按故障类型分类 */}
      {data.byFaultType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('evaluation.byFaultType', '按故障类型分类')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.byFaultType.map((stat) => {
              const rate = stat.total === 0 ? 0 : Math.round((stat.hit / stat.total) * 100);
              return (
                <div key={stat.faultType} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stat.faultType}</span>
                    <span className="text-muted-foreground">
                      {stat.hit}/{stat.total} ({rate}%)
                    </span>
                  </div>
                  <ProgressBar value={rate} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* 详情对比表 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('evaluation.details', '诊断详情对比')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('evaluation.faultType', '故障类型')}</TableHead>
                <TableHead>{t('evaluation.expectedRootCause', '预期诊断')}</TableHead>
                <TableHead>{t('evaluation.aiRootCause', 'AI 诊断')}</TableHead>
                <TableHead>{t('evaluation.confidence', '置信度')}</TableHead>
                <TableHead>{t('evaluation.result', '结果')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.details.map((detail, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-sm">{detail.faultType}</TableCell>
                  <TableCell className="text-sm">{detail.expectedRootCause}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {detail.aiRootCause || '-'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {detail.confidence != null ? `${Math.round(detail.confidence * 100)}%` : '-'}
                  </TableCell>
                  <TableCell>
                    {detail.matched === true && (
                      <Badge variant="default" className="bg-green-600">
                        {t('evaluation.match', '命中')}
                      </Badge>
                    )}
                    {detail.matched === false && detail.aiRootCause && (
                      <Badge variant="destructive">
                        {t('evaluation.mismatch', '误诊')}
                      </Badge>
                    )}
                    {detail.matched === null && (
                      <Badge variant="secondary">
                        {t('evaluation.miss', '漏报')}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
