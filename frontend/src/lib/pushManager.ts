import api from './api';

/** VAPID 公钥响应 */
interface VapidKeyResponse {
  publicKey: string;
}

/** 浏览器 PushSubscription 转换为可传输格式 */
function subscriptionToServer(subscription: PushSubscription) {
  const json = subscription.toJSON();
  return {
    endpoint: json.endpoint!,
    p256dh: json.keys!.p256dh!,
    auth: json.keys!.auth!,
  };
}

/**
 * 获取后端 VAPID 公钥
 */
export async function getVapidPublicKey(): Promise<string> {
  const { data } = await api.get<VapidKeyResponse>('/push/vapid-public-key');
  return data.publicKey;
}

/**
 * 注册浏览器推送订阅
 *
 * 流程：请求通知权限 → 获取 VAPID 公钥 → 向 PushManager 注册 → 发送到后端保存
 */
export async function registerPushSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('浏览器不支持 Web Push');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('用户拒绝了通知权限');
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const vapidKey = await getVapidPublicKey();
    const applicationServerKey = urlBase64ToUint8Array(vapidKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    await api.post('/push/subscribe', subscriptionToServer(subscription));

    return subscription;
  } catch (error) {
    console.error('注册推送订阅失败:', error);
    return null;
  }
}

/**
 * 注销浏览器推送订阅
 */
export async function unregisterPushSubscription(
  subscription: PushSubscription,
): Promise<void> {
  try {
    await subscription.unsubscribe();
    await api.delete('/push/subscribe', {
      data: { endpoint: subscription.endpoint },
    });
  } catch (error) {
    console.error('注销推送订阅失败:', error);
  }
}

/**
 * 将 URL-safe Base64 字符串转换为 Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
