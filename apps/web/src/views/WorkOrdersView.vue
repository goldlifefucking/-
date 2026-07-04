<template>
  <div class="work-orders-view">
    <div class="page-header">
      <h2 class="page-title">{{ pageTitle }}</h2>
      <a-button
        v-if="authStore.isReporter"
        type="primary"
        @click="$router.push('/submit')"
      >
        <template #icon><PlusOutlined /></template>
        提交报修
      </a-button>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <a-select
        v-model:value="filters.status"
        placeholder="状态筛选"
        allowClear
        style="width: 140px"
        @change="fetchData"
      >
        <a-select-option value="">全部状态</a-select-option>
        <a-select-option v-for="(label, key) in statusOptions" :key="key" :value="key">
          {{ label }}
        </a-select-option>
      </a-select>

      <a-select
        v-if="authStore.isAdmin"
        v-model:value="filters.categoryId"
        placeholder="分类筛选"
        allowClear
        style="width: 140px"
        @change="fetchData"
      >
        <a-select-option value="">全部分类</a-select-option>
        <a-select-option v-for="cat in categories" :key="cat.id" :value="cat.id">
          {{ cat.name }}
        </a-select-option>
      </a-select>

      <a-input-search
        v-model:value="filters.keyword"
        placeholder="搜索标题或描述"
        allowClear
        style="width: 250px"
        @search="fetchData"
      />

      <a-button @click="resetFilters">重置</a-button>
    </div>

    <!-- 工单表格 -->
    <a-table
      :columns="columns"
      :data-source="workOrdersStore.workOrders"
      :loading="workOrdersStore.loading"
      :pagination="pagination"
      row-key="id"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'title'">
          <a @click="goToDetail(record.id)">{{ record.title }}</a>
        </template>

        <template v-else-if="column.key === 'status'">
          <WorkOrderStatusTag :status="record.status" />
        </template>

        <template v-else-if="column.key === 'priority'">
          <a-tag :color="priorityColors[record.priority]">
            {{ priorityLabels[record.priority] }}
          </a-tag>
        </template>

        <template v-else-if="column.key === 'category'">
          {{ record.category?.name || '-' }}
        </template>

        <template v-else-if="column.key === 'reporter'">
          {{ record.reporter?.name || '-' }}
        </template>

        <template v-else-if="column.key === 'worker'">
          {{ record.worker?.name || '未指派' }}
        </template>

        <template v-else-if="column.key === 'createdAt'">
          {{ formatDate(record.createdAt) }}
        </template>

        <template v-else-if="column.key === 'action'">
          <div class="action-buttons">
            <a-button type="link" size="small" @click="goToDetail(record.id)">
              查看详情
            </a-button>
            <a-button
              v-if="canAccept(record)"
              type="link"
              size="small"
              @click="handleAccept(record)"
            >
              受理
            </a-button>
            <a-button
              v-if="canAssign(record)"
              type="link"
              size="small"
              @click="handleAssign(record)"
            >
              派单
            </a-button>
            <a-button
              v-if="canStart(record)"
              type="link"
              size="small"
              @click="handleStart(record)"
            >
              开始处理
            </a-button>
            <a-button
              v-if="canResolve(record)"
              type="link"
              size="small"
              @click="handleResolve(record)"
            >
              提交结果
            </a-button>
            <a-button
              v-if="canConfirm(record)"
              type="link"
              size="small"
              @click="handleConfirm(record)"
            >
              确认完成
            </a-button>
            <a-button
              v-if="canCancel(record)"
              type="link"
              size="small"
              danger
              @click="handleCancel(record)"
            >
              取消
            </a-button>
          </div>
        </template>
      </template>
    </a-table>

    <!-- 派单弹窗 -->
    <a-modal v-model:open="assignModalVisible" title="派单" @ok="confirmAssign">
      <a-form layout="vertical">
        <a-form-item label="选择维修人员" required>
          <a-select
            v-model:value="assignForm.workerId"
            placeholder="请选择维修人员"
            style="width: 100%"
          >
            <a-select-option v-for="w in workers" :key="w.id" :value="w.id">
              {{ w.name }}{{ w.phone ? ` (${w.phone})` : '' }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 提交结果弹窗 -->
    <a-modal v-model:open="resolveModalVisible" title="提交处理结果" @ok="confirmResolve" width="600px">
      <a-form layout="vertical">
        <a-form-item label="处理说明" required>
          <a-textarea
            v-model:value="resolveForm.resolution"
            :rows="4"
            placeholder="请描述处理过程和结果"
          />
        </a-form-item>
        <a-form-item label="处理后图片">
          <FileUpload v-model="resolveForm.attachments" :max-count="6" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 取消工单弹窗 -->
    <a-modal v-model:open="cancelModalVisible" title="取消工单" @ok="confirmCancel">
      <a-form layout="vertical">
        <a-form-item label="取消原因">
          <a-textarea
            v-model:value="cancelForm.reason"
            :rows="3"
            placeholder="请输入取消原因（选填）"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { useAuthStore } from '../stores/auth';
import { useWorkOrdersStore } from '../stores/work-orders';
import { workOrdersApi } from '../api/work-orders';
import { categoriesApi } from '../api/categories';
import { usersApi } from '../api/users';
import { WorkOrderStatus, Priority, UserRole } from '@campus-work-order/shared';
import WorkOrderStatusTag from '../components/WorkOrderStatusTag.vue';
import FileUpload from '../components/FileUpload.vue';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const router = useRouter();
const authStore = useAuthStore();
const workOrdersStore = useWorkOrdersStore();

const categories = ref<any[]>([]);
const workers = ref<any[]>([]);

const filters = reactive({
  status: '' as string,
  categoryId: '' as string | number,
  keyword: '',
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const statusOptions: Record<string, string> = {
  [WorkOrderStatus.PENDING]: '待受理',
  [WorkOrderStatus.ACCEPTED]: '待派单',
  [WorkOrderStatus.ASSIGNED]: '待处理',
  [WorkOrderStatus.PROCESSING]: '处理中',
  [WorkOrderStatus.PENDING_CONFIRM]: '待确认',
  [WorkOrderStatus.COMPLETED]: '已完成',
  [WorkOrderStatus.UNRESOLVED]: '未解决',
  [WorkOrderStatus.CANCELLED]: '已取消',
};

const priorityColors: Record<string, string> = {
  [Priority.LOW]: 'default',
  [Priority.MEDIUM]: 'blue',
  [Priority.HIGH]: 'orange',
  [Priority.URGENT]: 'red',
};

const priorityLabels: Record<string, string> = {
  [Priority.LOW]: '低',
  [Priority.MEDIUM]: '中',
  [Priority.HIGH]: '高',
  [Priority.URGENT]: '紧急',
};

const pageTitle = computed(() => {
  if (authStore.isAdmin) return '工单管理';
  if (authStore.isWorker) return '我的维修工单';
  return '我的报修';
});

const columns = computed(() => {
  const cols: any[] = [
    { title: '标题', key: 'title', dataIndex: 'title', ellipsis: true, width: 200 },
    { title: '状态', key: 'status', dataIndex: 'status', width: 100 },
    { title: '优先级', key: 'priority', dataIndex: 'priority', width: 80 },
    { title: '分类', key: 'category', width: 100 },
  ];

  if (authStore.isAdmin) {
    cols.push({ title: '报修人', key: 'reporter', width: 100 });
    cols.push({ title: '维修人员', key: 'worker', width: 100 });
  }

  cols.push({ title: '创建时间', key: 'createdAt', dataIndex: 'createdAt', width: 160, sorter: true });
  cols.push({ title: '操作', key: 'action', width: 200, fixed: 'right' });

  return cols;
});

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

// 权限判断
const canAccept = (record: any) => authStore.isAdmin && record.status === WorkOrderStatus.PENDING;
const canAssign = (record: any) =>
  authStore.isAdmin && (record.status === WorkOrderStatus.ACCEPTED || record.status === WorkOrderStatus.UNRESOLVED);
const canStart = (record: any) =>
  authStore.isWorker && record.status === WorkOrderStatus.ASSIGNED && record.workerId === authStore.user?.id;
const canResolve = (record: any) =>
  authStore.isWorker && record.status === WorkOrderStatus.PROCESSING && record.workerId === authStore.user?.id;
const canConfirm = (record: any) =>
  authStore.isReporter && record.status === WorkOrderStatus.PENDING_CONFIRM && record.reporterId === authStore.user?.id;
const canCancel = (record: any) =>
  authStore.isAdmin &&
  [WorkOrderStatus.PENDING, WorkOrderStatus.ACCEPTED, WorkOrderStatus.ASSIGNED, WorkOrderStatus.PROCESSING].includes(
    record.status,
  );

const fetchData = async () => {
  await workOrdersStore.fetchWorkOrders({
    status: filters.status || undefined,
    categoryId: filters.categoryId || undefined,
    keyword: filters.keyword || undefined,
    page: pagination.current,
    pageSize: pagination.pageSize,
  });
  pagination.total = workOrdersStore.total;
};

const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
};

const resetFilters = () => {
  filters.status = '';
  filters.categoryId = '';
  filters.keyword = '';
  pagination.current = 1;
  fetchData();
};

const goToDetail = (id: number) => {
  const prefix = authStore.isAdmin ? '/admin/work-orders' : authStore.isWorker ? '/worker/work-orders' : '/work-orders';
  router.push(`${prefix}/${id}`);
};

// 受理
const handleAccept = async (record: any) => {
  Modal.confirm({
    title: '确认受理工单',
    content: `确定要受理工单「${record.title}」吗？`,
    onOk: async () => {
      await workOrdersApi.accept(record.id);
      message.success('已受理');
      fetchData();
    },
  });
};

// 派单
const assignModalVisible = ref(false);
const assignForm = reactive({ workerId: undefined as number | undefined });
let currentAssignId = 0;

const handleAssign = async (record: any) => {
  currentAssignId = record.id;
  if (workers.value.length === 0) {
    workers.value = await usersApi.findWorkers();
  }
  assignForm.workerId = undefined;
  assignModalVisible.value = true;
};

const confirmAssign = async () => {
  if (!assignForm.workerId) {
    message.warning('请选择维修人员');
    return;
  }
  await workOrdersApi.assign(currentAssignId, { workerId: assignForm.workerId });
  message.success('已派单');
  assignModalVisible.value = false;
  fetchData();
};

// 开始处理
const handleStart = async (record: any) => {
  Modal.confirm({
    title: '确认开始处理',
    content: `确定要开始处理工单「${record.title}」吗？`,
    onOk: async () => {
      await workOrdersApi.start(record.id);
      message.success('已开始处理');
      fetchData();
    },
  });
};

// 提交结果
const resolveModalVisible = ref(false);
const resolveForm = reactive({ resolution: '', attachments: [] as string[] });
let currentResolveId = 0;

const handleResolve = (record: any) => {
  currentResolveId = record.id;
  resolveForm.resolution = '';
  resolveForm.attachments = [];
  resolveModalVisible.value = true;
};

const confirmResolve = async () => {
  if (resolveForm.resolution.length < 5) {
    message.warning('处理说明至少5个字符');
    return;
  }
  await workOrdersApi.resolve(currentResolveId, {
    resolution: resolveForm.resolution,
    attachments: resolveForm.attachments.length > 0 ? resolveForm.attachments : undefined,
  });
  message.success('已提交处理结果');
  resolveModalVisible.value = false;
  fetchData();
};

// 确认完成
const handleConfirm = async (record: any) => {
  Modal.confirm({
    title: '确认完成工单',
    content: `确定工单「${record.title}」已完成吗？`,
    okText: '确认完成',
    onOk: async () => {
      await workOrdersApi.confirm(record.id);
      message.success('工单已完成');
      fetchData();
    },
  });
};

// 取消工单
const cancelModalVisible = ref(false);
const cancelForm = reactive({ reason: '' });
let currentCancelId = 0;

const handleCancel = (record: any) => {
  currentCancelId = record.id;
  cancelForm.reason = '';
  cancelModalVisible.value = true;
};

const confirmCancel = async () => {
  await workOrdersApi.cancel(currentCancelId, { reason: cancelForm.reason });
  message.success('工单已取消');
  cancelModalVisible.value = false;
  fetchData();
};

onMounted(async () => {
  if (authStore.isAdmin) {
    categories.value = await categoriesApi.findAll();
  }
  fetchData();
});
</script>

<style scoped lang="scss">
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0;

  .ant-btn {
    padding: 0 4px;
  }
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;

    .ant-select,
    .ant-input-search {
      width: 100% !important;
    }
  }
}
</style>
