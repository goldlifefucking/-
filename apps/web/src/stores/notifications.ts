import { defineStore } from 'pinia';
import { ref } from 'vue';
import { notificationsApi } from '../api/notifications';

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<any[]>([]);
  const unreadCount = ref(0);
  const loading = ref(false);

  const fetchUnreadCount = async () => {
    try {
      const res: any = await notificationsApi.getUnreadCount();
      unreadCount.value = res.count;
    } catch {
      // ignore
    }
  };

  const fetchNotifications = async (params?: { isRead?: boolean; page?: number; pageSize?: number }) => {
    loading.value = true;
    try {
      const res: any = await notificationsApi.findAll(params);
      notifications.value = res.items;
    } finally {
      loading.value = false;
    }
  };

  const addNotification = (notification: any) => {
    notifications.value.unshift(notification);
    unreadCount.value++;
  };

  const markAsRead = async (id: number) => {
    await notificationsApi.markAsRead(id);
    const item = notifications.value.find((n) => n.id === id);
    if (item && !item.isRead) {
      item.isRead = true;
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }
  };

  const markAllAsRead = async () => {
    await notificationsApi.markAllAsRead();
    notifications.value.forEach((n) => (n.isRead = true));
    unreadCount.value = 0;
  };

  return {
    notifications,
    unreadCount,
    loading,
    fetchUnreadCount,
    fetchNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
  };
});
