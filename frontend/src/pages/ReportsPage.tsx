/**
 * 运营报表页面
 *
 * 提供本月快捷导出和自定义日期范围导出。报表由后端按租户聚合生成，
 * 页面只负责收集日期、提前校验边界并触发浏览器下载。
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarRange, Download, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { usePermission } from '../hooks/usePermission';
import { downloadCurrentMonthReport, downloadOperationsReport } from '../hooks/useReports';
import ExportButton from '../components/ui/ExportButton';

/** 后端运营报表允许的最大日期跨度。 */
const MAX_REPORT_RANGE_DAYS = 366;

/** 将日期格式化为原生 date input 使用的本地日期字符串。 */
function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** 返回当前月份第一天，避免把时区转换交给 Date.parse。 */
function getCurrentMonthStart(): string {
  const now = new Date();
  return toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
}

/** 将 YYYY-MM-DD 转成 UTC 日序号，避免夏令时导致跨度计算出现小数天。 */
function toUtcDay(value: string): number {
  const [year, month, day] = value.split('-').map(Number);
  return Date.UTC(year, month - 1, day) / (24 * 60 * 60 * 1000);
}

/** 返回日期范围校验错误的翻译键。 */
function getRangeError(startDate: string, endDate: string): string | undefined {
  if (!startDate || !endDate) return 'reports.rangeRequired';

  if (toUtcDay(startDate) >= toUtcDay(endDate)) {
    return 'reports.rangeStartBeforeEnd';
  }

  // 结束日期包含当天全天，因此首尾相差 365 天时实际查询 366 天；首尾相差 366 天则超出后端上限。
  if (toUtcDay(endDate) - toUtcDay(startDate) + 1 > MAX_REPORT_RANGE_DAYS) {
    return 'reports.rangeTooLong';
  }

  return undefined;
}

/** 报表页面导出操作。 */
export default function ReportsPage() {
  const { t } = useTranslation();
  const permission = usePermission('report');
  const [startDate, setStartDate] = useState(getCurrentMonthStart);
  const [endDate, setEndDate] = useState(() => toDateInputValue(new Date()));
  const [isExporting, setIsExporting] = useState(false);

  const rangeError = useMemo(
    () => getRangeError(startDate, endDate),
    [endDate, startDate],
  );

  if (!permission.canRead) {
    return (
      <Card>
        <CardContent className="flex min-h-64 items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">{t('reports.noReadPermission')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <FileText className="h-6 w-6" />
          {t('reports.title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('reports.description')}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <Card className="border-primary/30 bg-primary/[0.04]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="h-4 w-4 text-primary" />
              {t('reports.currentMonthTitle')}
            </CardTitle>
            <CardDescription>{t('reports.currentMonthDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ExportButton
              className="w-full sm:w-auto"
              variant="default"
              size="lg"
              onExport={downloadCurrentMonthReport}
              label={t('reports.currentMonth')}
              exportingLabel={t('reports.exporting')}
              errorMessage={t('reports.exportFailed')}
              disabled={isExporting}
              onBusyChange={setIsExporting}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarRange className="h-4 w-4" />
              {t('reports.customTitle')}
            </CardTitle>
            <CardDescription>{t('reports.customDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="report-start-date">{t('reports.startDate')}</Label>
                <Input
                  id="report-start-date"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  aria-invalid={Boolean(rangeError && startDate && endDate)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="report-end-date">{t('reports.endDate')}</Label>
                <Input
                  id="report-end-date"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  aria-invalid={Boolean(rangeError && startDate && endDate)}
                />
              </div>
            </div>

            <p
              className={rangeError === 'reports.rangeRequired' ? 'text-xs text-muted-foreground' : 'min-h-4 text-xs text-destructive'}
              role={rangeError && rangeError !== 'reports.rangeRequired' ? 'alert' : undefined}
            >
              {rangeError ? t(rangeError) : t('reports.rangeHint')}
            </p>

            <ExportButton
              variant="outline"
              className="w-full sm:w-auto"
              onExport={() => downloadOperationsReport(startDate, endDate)}
              label={t('reports.download')}
              exportingLabel={t('reports.exporting')}
              errorMessage={t('reports.exportFailed')}
              disabled={Boolean(rangeError) || isExporting}
              onBusyChange={setIsExporting}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
