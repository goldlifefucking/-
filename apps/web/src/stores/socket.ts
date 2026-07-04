import { defineStore } from 'pinia';
import { ref } from 'vue';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from './auth';
import { useWorkOrdersStore } from './work-orders';
import { useNotificationsStore } from './notifications';
import { message } from 'ant-design-vue';

export const useSocketStore = defineStore('socket', () => {
  const socket = ref<Socket | null>(null);
  const isConnected = ref(false);

  const connect = () => {
    const authStore = useAuthStore();
    if (!authStore.token) return;

    // 断开旧连接
    disconnect();

    const socketUrl = import.meta.env.VITE_SOCKET_URL || '/api/socket';
    socket.value = io(socketUrl, {
      auth: { token: authStore.token },
      transports: ['websocket', 'polling'],
    });

    socket.value.on('connect', () => {
      isConnected.value = true;
      console.log('[Socket] 已连接');
    });

    socket.value.on('disconnect', () => {
      isConnected.value = false;
      console.log('[Socket] 已断开');
    });

    socket.value.on('connect_error', (err) => {
      console.error('[Socket] 连接错误:', err.message);
    });

    // 监听工单更新事件
    socket.value.on('work_order.updated', (workOrder: any) => {
      const workOrdersStore = useWorkOrdersStore();
      workOrdersStore.upsertFromRealtime(workOrder);
    });

    // 监听通知创建事件
    socket.value.on('notification.created', (notification: any) => {
      const notificationsStore = useNotificationsStore();
      notificationsStore.addNotification(notification);
      message.info({
        content: notification.title,
        duration: 4,
      });
    });
  };

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
      isConnected.value = false;
    }
  };

  return {
    socket,
    isConnected,
    connect,
    disconnect,
  };
});
