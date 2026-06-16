import { Badge } from '../ui/badge';
import { useTranslation } from 'react-i18next';

/** 设备状态对应的样式映射 */
const statusStyles: Record<string, string> = {
  online: 'bg-green-500/10 text-green-500 border-green-500/20',
  offline: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  maintenance: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
};

interface DeviceStatusBadgeProps {
  /** 设备状态（online / offline / maintenance） */
  status: string;
}

/**
 * 设备状态徽章组件
 *
 * 根据设备在线状态显示不同颜色的标签，颜色映射：
 * - online → 绿色
 * - offline → 灰色
 * - maintenance → 黄色
 */
export function DeviceStatusBadge({ status }: DeviceStatusBadgeProps) {
  const { t } = useTranslation();
  // 后端返回 PascalCase（Online/Offline/Maintenance），i18n 键用小写
  const label = t(`device.${status.toLowerCase()}` as 'device.online' | 'device.offline' | 'device.maintenance');
  return (
    <Badge variant="outline" className={statusStyles[status] ?? ''}>
      {label}
    </Badge>
  );
}
