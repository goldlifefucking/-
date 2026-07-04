<template>
  <a-layout class="layout-wrapper">
    <a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible breakpoint="lg">
      <div class="logo">
        <span v-if="!collapsed">校园工单系统</span>
        <span v-else>工单</span>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        @click="onMenuClick"
      >
        <a-menu-item key="/my-work-orders">
          <template #icon><UnorderedListOutlined /></template>
          <span>我的报修</span>
        </a-menu-item>
        <a-menu-item key="/submit">
          <template #icon><PlusOutlined /></template>
          <span>提交报修</span>
        </a-menu-item>
        <a-menu-item key="/notifications">
          <template #icon><BellOutlined /></template>
          <span>通知中心</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="header">
        <div class="header-left">
          <component
            :is="collapsed ? MenuUnfoldOutlined : MenuFoldOutlined"
            class="trigger"
            @click="collapsed = !collapsed"
          />
        </div>
        <div class="header-right">
          <NotificationBell />
          <a-dropdown>
            <div class="user-info">
              <a-avatar :size="32" style="background-color: #1677ff">
                {{ authStore.user?.name?.charAt(0) }}
              </a-avatar>
              <span class="user-name">{{ authStore.user?.name }}</span>
            </div>
            <template #overlay>
              <a-menu>
                <a-menu-item @click="handleLogout">退出登录</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UnorderedListOutlined,
  PlusOutlined,
  BellOutlined,
} from '@ant-design/icons-vue';
import { useAuthStore } from '../stores/auth';
import { useSocketStore } from '../stores/socket';
import { useNotificationsStore } from '../stores/notifications';
import NotificationBell from '../components/NotificationBell.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const socketStore = useSocketStore();
const notificationsStore = useNotificationsStore();

const collapsed = ref(false);
const selectedKeys = ref<string[]>([route.path]);

watch(
  () => route.path,
  (newPath) => {
    selectedKeys.value = [newPath];
  },
);

const onMenuClick = ({ key }: { key: string }) => {
  router.push(key);
};

const handleLogout = () => {
  socketStore.disconnect();
  authStore.logout();
  router.push('/login');
};

onMounted(() => {
  socketStore.connect();
  notificationsStore.fetchUnreadCount();
});

onUnmounted(() => {
  socketStore.disconnect();
});
</script>

<style scoped lang="scss">
.layout-wrapper {
  height: 100vh;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.1);
}

.header {
  background: #fff;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.trigger {
  font-size: 18px;
  cursor: pointer;
  transition: color 0.3s;
  &:hover {
    color: #1677ff;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-name {
  font-size: 14px;
}

.content {
  margin: 24px;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .content {
    margin: 12px;
    padding: 12px;
  }
}
</style>
