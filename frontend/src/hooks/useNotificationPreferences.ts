/**
 * 通知偏好设置 hook
 *
 * 提供获取和更新通知偏好的 TanStack Query 操作。
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

/** 渠道偏好 */
export interface ChannelPreference {
  signalr: boolean;
  push: boolean;
  email: boolean;
}

/** 通知偏好 */
export interface NotificationPreferences {
  alert: ChannelPreference;
  workorder: ChannelPreference;
  system: ChannelPreference;
}

/** 获取通知偏好 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const { data } = await api.get<NotificationPreferences>('/notifications/preferences');
      return data;
    },
  });
}

/** 更新通知偏好 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prefs: NotificationPreferences) => {
      const { data } = await api.put<NotificationPreferences>('/notifications/preferences', prefs);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });
}
