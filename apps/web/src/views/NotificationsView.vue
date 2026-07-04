<template>
  <div class="notifications-view">
    <div class="page-header">
      <h2 class="page-title">通知中心</h2>
      <a-button
        :disabled="notificationsStore.unreadCount === 0"
        :loading="markingAll"
        @click="handleMarkAllRead"
      >
        <template #icon><CheckOutlined /></template>
        全部标记已读
      </a-button>
    </div>

    <a-list
      :data-source="notificationsStore.notifications"
      :loading="notificationsStore.loading"
      item-layout="vertical"
      size="large"
      class="notification-list"
    >
      <template #renderItem="{ item }">
        <a-list-item
          class="notification-item"
          :class="{ unread: !item.isRead }"
          @click="handleClickNotification(item)"
        >
          <a-list-item-meta>
            <template #title>
              <div class="item-title">
                <a-badge v-if="!item.isRead" status="processing" text="未读" />
                <span :class="{ 'title-unread': !item.isRead }">{{ item.title }}</span>
              </div>
            </template>
            <template #description>
              <p class="item-content">{{ item.content }}</p>
              <span class="item-time">{{ formatTime(item.createdAt) }}</span>
            </template>
          </a-list-item-meta>
        </a-list-item>
      </template>

      <template #emptyText>
        <a-empty description="暂无通知" />
      </template>
    </a-list>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { CheckOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { useNotificationsStore } from '../stores/notifications';
import { notificationsApi } from '../api/notifications';
import { useAuthStore } from '../stores/auth';
import { UserRole } from '@campus-work-order/shared';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const router = useRouter();
const notificationsStore = useNotificationsStore();
const authStore = useAuthStore();

const markingAll = ref(false);

const formatTime = (time: string) => {
  const target = dayjs(time);
  const now = dayjs();
  // 7天内显示相对时间，否则显示完整日期
  if (now.diff(target, 'day') < 7) {
    return target.fromNow();
  }
  return target.format('YYYY-MM-DD HH:mm');
};

const getWorkOrderPath = (id: number) => {
  const role = authStore.role;
  if (role === UserRole.ADMIN) {
    return `/admin/work-orders/${id}`;
  } else if (role === UserRole.WORKER) {
    return `/worker/work-orders/${id}`;
  }
  return `/work-orders/${id}`;
};

const handleClickNotification = async (item: any) => {
  // 标记为已读
  if (!item.isRead) {
    try {
      await notificationsStore.markAsRead(item.id);
    } catch {
      // 错误已在拦截器中处理
    }
  }
  // 跳转到关联工单详情
  if (item.workOrderId) {
    router.push(getWorkOrderPath(item.workOrderId));
  } else {
    message.info('该通知未关联具体工单');
  }
};

const handleMarkAllRead = async () => {
  markingAll.value = true;
  try {
    await notificationsStore.markAllAsRead();
    message.success('已全部标记为已读');
  } catch {
    // 错误已在拦截器中处理
  } finally {
    markingAll.value = false;
  }
};

onMounted(() => {
  notificationsStore.fetchNotifications();
});
</script>

<style scoped lang="scss">
.notifications-view {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .page-title {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
  }

  .notification-list {
    background: #fff;
    border-radius: 8px;
  }

  .notification-item {
    cursor: pointer;
    transition: background 0.3s;
    border-bottom: 1px solid #f0f0f0 !important;

    &:hover {
      background: #fafafa;
    }

    &.unread {
      border-left: 4px solid #1677ff;
      background: #f0f7ff;

      &:hover {
        background: #e6f1ff;
      }
    }
  }

  .item-title {
    display: flex;
    align-items: center;
    gap: 8px;

    .title-unread {
      font-weight: 600;
    }
  }

  .item-content {
    margin: 4px 0 8px;
    color: #666;
    font-size: 14px;
  }

  .item-time {
    font-size: 12px;
    color: #999;
  }
}
</style>
