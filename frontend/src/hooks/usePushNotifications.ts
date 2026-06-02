import { useState, useEffect, useCallback } from 'react';
import {
  registerPushSubscription,
  unregisterPushSubscription,
} from '../lib/pushManager';

/**
 * 推送通知 Hook
 *
 * 提供推送通知的订阅状态管理、注册和注销能力。
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied',
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  /** 浏览器是否支持推送通知 */
  const isSupported = typeof navigator !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window;

  /** 检查当前订阅状态 */
  const checkSubscription = useCallback(async () => {
    if (!isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSub = await registration.pushManager.getSubscription();
      setSubscription(existingSub);
      setIsSubscribed(!!existingSub);
    } catch {
      // Service Worker 未就绪，忽略
    }
  }, [isSupported]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  /**
   * 注册推送订阅
   */
  const subscribe = useCallback(async () => {
    if (!isSupported) return false;

    if (Notification.permission === 'denied') {
      console.warn('通知权限已被拒绝，请在浏览器设置中手动开启');
      return false;
    }

    const sub = await registerPushSubscription();
    if (sub) {
      setSubscription(sub);
      setIsSubscribed(true);
      setPermission(Notification.permission);
      return true;
    }

    return false;
  }, [isSupported]);

  /**
   * 注销推送订阅
   */
  const unsubscribe = useCallback(async () => {
    if (!subscription) return;

    await unregisterPushSubscription(subscription);
    setSubscription(null);
    setIsSubscribed(false);
  }, [subscription]);

  return {
    permission,
    isSupported,
    isSubscribed,
    subscribe,
    unsubscribe,
    checkSubscription,
  };
}
