import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * PWA 安装提示 Hook
 *
 * 监听浏览器的 beforeinstallprompt 事件，提供安装状态和触发安装的能力。
 * - isInstallable: 浏览器已准备好安装提示（用户尚未安装）
 * - isInstalled: 应用已经以 standalone 模式运行
 * - install: 触发浏览器原生安装弹窗
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  // 使用初始化函数避免在渲染阶段调用 matchMedia（副作用）
  const [isInstalled, setIsInstalled] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(display-mode: standalone)').matches : false,
  );

  useEffect(() => {
    // 拦截浏览器默认安装提示，延迟到用户主动触发
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // 安装完成后更新状态
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  /** 触发浏览器原生安装弹窗 */
  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return { isInstallable, isInstalled, install };
}
