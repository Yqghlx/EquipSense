import { usePWAInstall } from '../../hooks/usePWA';
import { Download } from 'lucide-react';
import { Button } from '../ui/button';

/**
 * PWA 安装提示横幅
 *
 * 当浏览器支持 PWA 安装且用户尚未安装时，在页面底部居中显示提示横幅。
 * 用户点击"安装"按钮后触发浏览器原生安装流程。
 */
export function InstallPrompt() {
  const { isInstallable, install } = usePWAInstall();

  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border bg-background p-3 shadow-lg">
      <Download className="h-5 w-5 text-primary" />
      <span className="text-sm">安装 EquipSense 到桌面，获得更好体验</span>
      <Button size="sm" onClick={install}>
        安装
      </Button>
    </div>
  );
}
