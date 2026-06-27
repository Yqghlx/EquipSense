import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

/**
 * 系统信息卡片
 *
 * 调用 GET /api/v1/system/info 展示后端版本、运行环境和启动时间。
 */
export function SystemInfoCard() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['system', 'info'],
    queryFn: async () => {
      const { data } = await api.get('/system/info');
      return data as { version: string; environment: string; uptime: string };
    },
    staleTime: 60_000,
  });

  /** 将 ISO 8601 duration 或 TimeSpan 字符串格式化为可读文本 */
  const formatUptime = (raw: string): string => {
    // 后端返回 .NET TimeSpan.ToString() 格式：
    //   - 不足 1 天：HH:MM:SS.fffffff（如 "01:23:45.6789000"）
    //   - 超过 1 天：d.HH:MM:SS.fffffff（如 "1.02:03:04.5670000"）
    // 关键区分：d.HH:MM:SS 中第一个 '.' 出现在第一个 ':' 之前；而 HH:MM:SS.fffffff 中 '.' 在最后一个 ':' 之后
    if (!raw || !/^\d/.test(raw)) return raw ?? '—';

    const firstDot = raw.indexOf('.');
    const firstColon = raw.indexOf(':');

    let days = 0;
    let timePart = raw;

    // 只有当 '.' 在 ':' 之前时，才把 '.' 前视为天数
    if (firstDot > 0 && firstColon > 0 && firstDot < firstColon) {
      days = parseInt(raw.substring(0, firstDot), 10);
      timePart = raw.substring(firstDot + 1);
    }

    // 去掉秒的小数部分（如果有）
    const cleaned = timePart.split('.')[0];
    const [h, m, s] = cleaned.split(':').map(x => parseInt(x, 10) || 0);

    if (days > 0) return `${days}天 ${h}小时 ${m}分钟`;
    if (h > 0) return `${h}小时 ${m}分钟`;
    if (m > 0) return `${m}分钟 ${s}秒`;
    return `${s}秒`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('settings.systemInfo')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        ) : data ? (
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{t('settings.version')}</p>
              <p className="font-medium">{data.version}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('settings.environment')}</p>
              <p className="font-medium">{data.environment}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('settings.uptime')}</p>
              <p className="font-medium">{formatUptime(data.uptime)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">—</p>
        )}
      </CardContent>
    </Card>
  );
}
