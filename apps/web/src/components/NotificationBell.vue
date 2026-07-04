<template>
  <a-badge :count="notificationsStore.unreadCount" :offset="[-2, 2]">
    <BellOutlined class="bell-icon" @click="goToNotifications" />
  </a-badge>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { BellOutlined } from '@ant-design/icons-vue';
import { useNotificationsStore } from '../stores/notifications';
import { useSocketStore } from '../stores/socket';

const router = useRouter();
const notificationsStore = useNotificationsStore();
const socketStore = useSocketStore();

const goToNotifications = () => {
  router.push('/notifications');
};

onMounted(() => {
  notificationsStore.fetchUnreadCount();

  // Socket 连接后监听通知
  if (socketStore.isConnected) {
    // 已连接，无需额外操作
  } else {
    // 等待连接
    setTimeout(() => notificationsStore.fetchUnreadCount(), 2000);
  }
});
</script>

<style scoped lang="scss">
.bell-icon {
  font-size: 20px;
  cursor: pointer;
  transition: color 0.3s;

  &:hover {
    color: #1677ff;
  }
}
</style>
