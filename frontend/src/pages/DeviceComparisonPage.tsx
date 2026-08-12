import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, RefreshCw, Search } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useAlertRules } from '../hooks/useAlertRules';
import { useDeviceComparison } from '../hooks/useDeviceComparison';
import { useDeviceTemplates } from '../hooks/useDeviceConfig';
import { useDevices } from '../hooks/useDevices';
import { usePermission } from '../hooks/usePermission';

const WINDOW_OPTIONS = [
  { value: 24, labelKey: 'deviceComparison.window.24h' },
  { value: 72, labelKey: 'deviceComparison.window.72h' },
  { value: 168, labelKey: 'deviceComparison.window.7d' },
  { value: 720, labelKey: 'deviceComparison.window.30d' },
] as const;

function formatMetricValue(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '-';
}

/**
 * 设备对比页
 *
 * 页面本身只做只读筛选和展示；真正的数据请求放在有权限的子组件中，
 * 避免无权限用户仍触发设备/规则/对比查询。
 */
export default function DeviceComparisonPage() {
  const { t } = useTranslation();
  const permission = usePermission('device');

  if (!permission.canRead) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{t('deviceComparison.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('deviceComparison.description')}</p>
        </div>

        <Card>
          <CardContent className="flex items-center gap-3 py-8">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <p role="alert" className="text-sm text-foreground">
              {t('deviceComparison.state.noPermission')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <DeviceComparisonPageContent />;
}

function DeviceComparisonPageContent() {
  const { t } = useTranslation();
  const metricSuggestionListId = useId();
  const [selectedType, setSelectedType] = useState('');
  const [metric, setMetric] = useState('');
  const [keyword, setKeyword] = useState('');
  const [hours, setHours] = useState(24);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);

  const deviceTemplatesQuery = useDeviceTemplates();
  const deviceTypesQuery = useDevices({ page: 1, pageSize: 100 });
  const candidateDevicesQuery = useDevices(
    {
      page: 1,
      pageSize: 100,
      deviceType: selectedType || undefined,
      keyword: keyword.trim() || undefined,
    },
    { enabled: Boolean(selectedType) },
  );
  const alertRulesQuery = useAlertRules({ page: 1, pageSize: 100 });
  const comparisonQuery = useDeviceComparison({
    deviceType: selectedType || undefined,
    metric: metric.trim() || undefined,
    hours,
    deviceIds: selectedDeviceIds,
  });

  const deviceTypeOptions = useMemo(() => {
    const types = new Set<string>();

    deviceTemplatesQuery.data?.forEach((template) => {
      if (template.name) types.add(template.name);
    });

    deviceTypesQuery.data?.items.forEach((device) => {
      if (device.type) types.add(device.type);
    });

    return [...types].sort((a, b) => a.localeCompare(b));
  }, [deviceTemplatesQuery.data, deviceTypesQuery.data]);

  const candidateDevices = useMemo(
    () => candidateDevicesQuery.data?.items ?? [],
    [candidateDevicesQuery.data],
  );
  const metricSuggestions = useMemo(() => {
    const metrics = new Set<string>();
    alertRulesQuery.data?.items.forEach((rule) => {
      if (rule.metric) metrics.add(rule.metric);
    });
    return [...metrics].sort((a, b) => a.localeCompare(b));
  }, [alertRulesQuery.data]);

  const comparisonRows = useMemo(() => {
    if (!comparisonQuery.data?.devices) return [];

    return [...comparisonQuery.data.devices].sort((left, right) => {
      if (left.isOutlier !== right.isOutlier) {
        return left.isOutlier ? -1 : 1;
      }

      return Math.abs(right.zScore) - Math.abs(left.zScore);
    });
  }, [comparisonQuery.data]);

  const handleToggleDevice = (deviceId: string, checked: boolean) => {
    setSelectedDeviceIds((currentIds) => {
      if (checked) {
        if (currentIds.includes(deviceId) || currentIds.length >= 5) {
          return currentIds;
        }

        return [...currentIds, deviceId];
      }

      return currentIds.filter((currentId) => currentId !== deviceId);
    });
  };

  const comparisonMessage = comparisonQuery.data?.message;
  const showInitialComparisonError = comparisonQuery.isError && !comparisonQuery.data;
  const showRefreshComparisonError = comparisonQuery.isError && Boolean(comparisonQuery.data);
  const showInsufficientData = Boolean(comparisonMessage) && comparisonRows.length === 0;
  const showCandidateOverflow = Boolean(
    selectedType
      && candidateDevicesQuery.data
      && candidateDevicesQuery.data.total > candidateDevices.length
      && !keyword.trim(),
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{t('deviceComparison.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('deviceComparison.description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('common.filter')}</CardTitle>
          <CardDescription>{t('deviceComparison.description')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="device-comparison-type">{t('deviceComparison.filters.deviceType')}</Label>
            <select
              id="device-comparison-type"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedType}
              onChange={(event) => {
                setSelectedType(event.target.value);
                setSelectedDeviceIds([]);
                setKeyword('');
              }}
            >
              <option value="">{t('common.select')}</option>
              {deviceTypeOptions.map((deviceType) => (
                <option key={deviceType} value={deviceType}>
                  {deviceType}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="device-comparison-metric">{t('deviceComparison.filters.metric')}</Label>
            <Input
              id="device-comparison-metric"
              value={metric}
              list={metricSuggestionListId}
              placeholder={t('deviceComparison.filters.metricPlaceholder')}
              onChange={(event) => setMetric(event.target.value)}
            />
            <datalist id={metricSuggestionListId}>
              {metricSuggestions.map((metricSuggestion) => (
                <option key={metricSuggestion} value={metricSuggestion}>
                  {metricSuggestion}
                </option>
              ))}
            </datalist>
            <p className="text-xs text-muted-foreground">{t('deviceComparison.filters.metricSuggestions')}</p>
            {alertRulesQuery.isError ? (
              <p className="text-xs text-amber-600">{t('deviceComparison.state.rulesFailed')}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="device-comparison-window">{t('deviceComparison.filters.window')}</Label>
            <select
              id="device-comparison-window"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={String(hours)}
              onChange={(event) => setHours(Number(event.target.value))}
            >
              {WINDOW_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="device-comparison-search">{t('deviceComparison.filters.search')}</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="device-comparison-search"
                value={keyword}
                className="pl-9"
                placeholder={t('deviceComparison.filters.searchPlaceholder')}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('deviceComparison.list.title')}</CardTitle>
          <CardDescription>{t('deviceComparison.filters.selectHint')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showCandidateOverflow ? (
            <p className="text-sm text-muted-foreground">{t('deviceComparison.list.tooMany')}</p>
          ) : null}

          {selectedType && candidateDevicesQuery.isLoading ? (
            <div role="status" className="py-6 text-sm text-muted-foreground">
              {t('common.loading')}
            </div>
          ) : null}

          {selectedType && candidateDevicesQuery.isError ? (
            <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-amber-300 p-4">
              <p role="alert" className="text-sm text-foreground">
                {t('common.loadFailed')}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => candidateDevicesQuery.refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('common.retry')}
              </Button>
            </div>
          ) : null}

          {selectedType && !candidateDevicesQuery.isLoading && !candidateDevicesQuery.isError && candidateDevices.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('deviceComparison.state.noCandidates')}</p>
          ) : null}

          {candidateDevices.length > 0 ? (
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {candidateDevices.map((device) => {
                const isChecked = selectedDeviceIds.includes(device.id);
                const isDisabled = !isChecked && selectedDeviceIds.length >= 5;
                const label = device.name || device.deviceCode;

                return (
                  <li key={device.id}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 transition-colors hover:bg-accent/40">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isDisabled}
                        aria-label={label}
                        onChange={(event) => handleToggleDevice(device.id, event.target.checked)}
                      />
                      <div className="min-w-0">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-muted-foreground">{device.deviceCode}</p>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <section className="space-y-4" aria-live="polite">
        {comparisonQuery.isLoading && !comparisonQuery.data ? (
          <Card>
            <CardContent className="py-8">
              <div role="status" className="text-sm text-muted-foreground">
                {t('deviceComparison.state.loading')}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {showInitialComparisonError ? (
          <Card>
            <CardContent className="flex flex-col items-start gap-3 py-8">
              <p role="alert" className="text-sm text-foreground">
                {t('deviceComparison.state.loadFailed')}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => comparisonQuery.refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('deviceComparison.state.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {showRefreshComparisonError ? (
          <Card>
            <CardContent className="py-4">
              <p role="alert" className="text-sm text-amber-700">
                {t('deviceComparison.state.refreshFailed')}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {showInsufficientData ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-sm text-muted-foreground">
                {comparisonMessage ?? t('deviceComparison.state.insufficientData')}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {!comparisonQuery.isLoading && !comparisonQuery.isError && !comparisonQuery.data && selectedType && selectedDeviceIds.length < 2 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-sm text-muted-foreground">{t('deviceComparison.state.notEnoughDevices')}</p>
            </CardContent>
          </Card>
        ) : null}

        {comparisonQuery.data && comparisonRows.length > 0 ? (
          <>
            <div>
              <h2 className="text-lg font-semibold">{t('deviceComparison.result.summary')}</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>{t('deviceComparison.result.groupMean')}</CardTitle>
                  <CardDescription>{comparisonQuery.data.deviceType}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{formatMetricValue(comparisonQuery.data.groupMean)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('deviceComparison.result.groupStdDev')}</CardTitle>
                  <CardDescription>{comparisonQuery.data.metric}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{formatMetricValue(comparisonQuery.data.groupStdDev)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('deviceComparison.filters.window')}</CardTitle>
                  <CardDescription>{comparisonQuery.data.metric}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{t(`deviceComparison.window.${hours === 168 ? '7d' : hours === 720 ? '30d' : `${hours}h`}`)}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('deviceComparison.result.table.device')}</TableHead>
                      <TableHead>{t('deviceComparison.result.table.code')}</TableHead>
                      <TableHead>{t('deviceComparison.result.table.average')}</TableHead>
                      <TableHead>{t('deviceComparison.result.table.latest')}</TableHead>
                      <TableHead>{t('deviceComparison.result.table.minimum')}</TableHead>
                      <TableHead>{t('deviceComparison.result.table.maximum')}</TableHead>
                      <TableHead>{t('deviceComparison.result.table.samples')}</TableHead>
                      <TableHead>{t('deviceComparison.result.table.zScore')}</TableHead>
                      <TableHead>{t('deviceComparison.result.table.outlier')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonRows.map((row) => (
                      <TableRow key={row.deviceId}>
                        <TableCell>
                          <Link to={`/devices/${row.deviceId}`} className="font-medium text-primary hover:underline">
                            {row.deviceName || row.deviceCode}
                          </Link>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{row.deviceCode}</TableCell>
                        <TableCell>{formatMetricValue(row.averageValue)}</TableCell>
                        <TableCell>{formatMetricValue(row.latestValue)}</TableCell>
                        <TableCell>{formatMetricValue(row.minValue)}</TableCell>
                        <TableCell>{formatMetricValue(row.maxValue)}</TableCell>
                        <TableCell>{row.dataPointCount}</TableCell>
                        <TableCell>{formatMetricValue(row.zScore)}</TableCell>
                        <TableCell>
                          {row.isOutlier ? (
                            <Badge variant="destructive">{t('deviceComparison.result.outlierBadge')}</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : null}
      </section>
    </div>
  );
}
