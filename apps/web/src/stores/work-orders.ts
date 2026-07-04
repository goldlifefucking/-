import { defineStore } from 'pinia';
import { ref } from 'vue';
import { workOrdersApi } from '../api/work-orders';

export const useWorkOrdersStore = defineStore('workOrders', () => {
  const workOrders = ref<any[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const currentWorkOrder = ref<any>(null);

  const fetchWorkOrders = async (params?: any) => {
    loading.value = true;
    try {
      const res: any = await workOrdersApi.findAll(params);
      workOrders.value = res.items;
      total.value = res.total;
    } finally {
      loading.value = false;
    }
  };

  const fetchWorkOrder = async (id: number) => {
    currentWorkOrder.value = await workOrdersApi.findOne(id);
    return currentWorkOrder.value;
  };

  /**
   * 根据实时事件更新工单列表
   */
  const upsertFromRealtime = (updatedOrder: any) => {
    const index = workOrders.value.findIndex((o) => o.id === updatedOrder.id);
    if (index !== -1) {
      workOrders.value[index] = { ...workOrders.value[index], ...updatedOrder };
    } else {
      workOrders.value.unshift(updatedOrder);
    }
    // 如果当前查看的工单被更新，也更新详情
    if (currentWorkOrder.value?.id === updatedOrder.id) {
      currentWorkOrder.value = { ...currentWorkOrder.value, ...updatedOrder };
    }
  };

  return {
    workOrders,
    total,
    loading,
    currentWorkOrder,
    fetchWorkOrders,
    fetchWorkOrder,
    upsertFromRealtime,
  };
});
