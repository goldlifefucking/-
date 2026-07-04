<template>
  <a-tag :color="color">{{ label }}</a-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { WorkOrderStatus } from '@campus-work-order/shared';

const props = defineProps<{
  status: WorkOrderStatus;
}>();

const STATUS_CONFIG: Record<WorkOrderStatus, { color: string; label: string }> = {
  [WorkOrderStatus.PENDING]: { color: 'orange', label: '待受理' },
  [WorkOrderStatus.ACCEPTED]: { color: 'gold', label: '待派单' },
  [WorkOrderStatus.ASSIGNED]: { color: 'cyan', label: '待处理' },
  [WorkOrderStatus.PROCESSING]: { color: 'blue', label: '处理中' },
  [WorkOrderStatus.PENDING_CONFIRM]: { color: 'purple', label: '待确认' },
  [WorkOrderStatus.COMPLETED]: { color: 'green', label: '已完成' },
  [WorkOrderStatus.UNRESOLVED]: { color: 'red', label: '未解决' },
  [WorkOrderStatus.CANCELLED]: { color: 'default', label: '已取消' },
};

const color = computed(() => STATUS_CONFIG[props.status]?.color || 'default');
const label = computed(() => STATUS_CONFIG[props.status]?.label || props.status);
</script>
