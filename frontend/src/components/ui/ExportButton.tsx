import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './button';

/** 导出按钮支持的视觉变体。 */
type ExportButtonVariant = 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';

/** 导出按钮支持的尺寸。 */
type ExportButtonSize = 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg';

/**
 * 统一的文件导出按钮属性。
 */
export interface ExportButtonProps {
  /** 执行导出请求及浏览器下载。 */
  onExport: () => Promise<void>;
  /** 非忙碌状态显示的按钮文案。 */
  label: ReactNode;
  /** 请求执行期间显示的按钮文案。 */
  exportingLabel: ReactNode;
  /** 导出失败时显示的本地化提示，不应包含原始异常内容。 */
  errorMessage: string;
  /** 页面额外的业务禁用条件。 */
  disabled?: boolean;
  /** 可选的页面级忙碌状态同步，用于多个导出按钮共享禁用状态。 */
  onBusyChange?: (busy: boolean) => void;
  /** 按钮视觉变体。 */
  variant?: ExportButtonVariant;
  /** 按钮尺寸。 */
  size?: ExportButtonSize;
  /** 追加到按钮的样式类。 */
  className?: string;
  /** 浏览器悬停提示。 */
  title?: string;
}

/**
 * 统一处理导出操作的忙碌状态、失败反馈和重复点击保护。
 */
export default function ExportButton({
  onExport,
  label,
  exportingLabel,
  errorMessage,
  disabled = false,
  onBusyChange,
  variant = 'outline',
  size = 'sm',
  className,
  title,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const inFlightRef = useRef(false);

  /**
   * 使用引用作为单飞闸门，避免状态更新尚未反映到 DOM 时的连续点击重复发请求。
   */
  const handleClick = () => {
    if (disabled || inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    onBusyChange?.(true);
    setIsExporting(true);

    void (async () => {
      try {
        await onExport();
      } catch {
        // 只展示本地化业务提示，避免把后端异常、响应体或凭据相关信息泄露给用户。
        toast.error(errorMessage);
      } finally {
        inFlightRef.current = false;
        onBusyChange?.(false);
        setIsExporting(false);
      }
    })();
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      title={title}
      onClick={handleClick}
      disabled={disabled || isExporting}
      aria-busy={isExporting}
    >
      {isExporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {isExporting ? exportingLabel : label}
    </Button>
  );
}
