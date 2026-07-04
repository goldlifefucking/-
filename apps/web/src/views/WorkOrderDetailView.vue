<template>
  <div class="work-order-detail" v-if="workOrder">
    <!-- 返回按钮 -->
    <a-button type="link" @click="goBack" style="padding: 0 0 16px 0">
      <ArrowLeftOutlined /> 返回列表
    </a-button>

    <a-row :gutter="24">
      <!-- 左侧：工单信息 -->
      <a-col :xs="24" :lg="16">
        <a-card title="工单信息" class="info-card">
          <a-descriptions :column="{ xs: 1, sm: 2 }" bordered size="small">
            <a-descriptions-item label="标题" :span="2">{{ workOrder.title }}</a-descriptions-item>
            <a-descriptions-item label="状态">
              <WorkOrderStatusTag :status="workOrder.status" />
            </a-descriptions-item>
            <a-descriptions-item label="优先级">
              <a-tag :color="priorityColors[workOrder.priority]">
                {{ priorityLabels[workOrder.priority] }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="分类">{{ workOrder.category?.name }}</a-descriptions-item>
            <a-descriptions-item label="位置">{{ workOrder.location || '未填写' }}</a-descriptions-item>
            <a-descriptions-item label="报修人">{{ workOrder.reporter?.name }}</a-descriptions-item>
            <a-descriptions-item label="维修人员">{{ workOrder.worker?.name || '未指派' }}</a-descriptions-item>
            <a-descriptions-item label="创建时间">{{ formatDate(workOrder.createdAt) }}</a-descriptions-item>
            <a-descriptions-item label="更新时间">{{ formatDate(workOrder.updatedAt) }}</a-descriptions-item>
            <a-descriptions-item label="问题描述" :span="2">
              <div class="description-text">{{ workOrder.description }}</div>
            </a-descriptions-item>
            <a-descriptions-item v-if="workOrder.resolution" label="处理结果" :span="2">
              <div class="description-text">{{ workOrder.resolution }}</div>
            </a-descriptions-item>
            <a-descriptions-item v-if="workOrder.feedback" label="反馈内容" :span="2">
              <div class="description-text feedback-text">{{ workOrder.feedback }}</div>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <!-- 附件区域 -->
        <a-card title="附件" class="info-card" v-if="beforeAttachments.length > 0 || afterAttachments.length > 0">
          <div v-if="beforeAttachments.length > 0" class="attachment-section">
            <h4 class="attachment-title">报修图片</h4>
            <a-image-preview-group>
              <a-space wrap>
                <a-image
                  v-for="att in beforeAttachments"
                  :key="att.id"
                  :src="att.url"
                  :width="120"
                  :height="120"
                  style="object-fit: cover; border-radius: 4px"
                />
              </a-space>
            </a-image-preview-group>
          </div>
          <div v-if="afterAttachments.length > 0" class="attachment-section">
            <h4 class="attachment-title">处理后图片</h4>
            <a-image-preview-group>
              <a-space wrap>
                <a-image
                  v-for="att in afterAttachments"
                  :key="att.id"
                  :src="att.url"
                  :width="120"
                  :height="120"
                  style="object-fit: cover; border-radius: 4px"
                />
              </a-space>
            </a-image-preview-group>
          </div>
        </a-card>

        <!-- 操作日志 -->
        <a-card title="操作日志" class="info-card">
          <a-timeline>
            <a-timeline-item v-for="log in workOrder.logs" :key="log.id">
              <div class="log-item">
                <span class="log-action">{{ actionLabels[log.action] || log.action }}</span>
                <span class="log-user">{{ log.user?.name }}</span>
                <span class="log-detail" v-if="log.detail">{{ log.detail }}</span>
                <span class="log-time">{{ formatDate(log.createdAt) }}</span>
              </div>
            </a-timeline-item>
          </a-timeline>
        </a-card>
      </a-col>

      <!-- 右侧：操作面板 -->
      <a-col :xs="24" :lg="8">
        <a-card title="操作" class="action-card">
          <div class="action-list">
            <a-button
              v-if="canAccept"
              type="primary"
              block
              @click="handleAccept"
              style="margin-bottom: 8px"
            >
              受理工单
            </a-button>

            <a-button
              v-if="canAssign"
              type="primary"
              block
              @click="handleAssign"
              style="margin-bottom: 8px"
            >
              派单
            </a-button>

            <a-button
              v-if="canStart"
              type="primary"
              block
              @click="handleStart"
              style="margin-bottom: 8px"
            >
              开始处理
            </a-button>

            <a-button
              v-if="canResolve"
              type="primary"
              block
              @click="handleResolve"
              style="margin-bottom: 8px"
            >
              提交处理结果
            </a-button>

            <a-button
              v-if="canConfirm"
              type="primary"
              block
              @click="handleConfirm"
              style="margin-bottom: 8px"
            >
              确认完成
            </a-button>

            <a-button
              v-if="canUnresolve"
              danger
              block
              @click="handleUnresolve"
              style="margin-bottom: 8px"
            >
              反馈未解决
            </a-button>

            <a-button
              v-if="canCancel"
              danger
              block
              @click="handleCancel"
            >
              取消工单
            </a-button>

            <div v-if="!hasAnyAction" class="no-action">
              <a-empty description="当前状态暂无可执行操作" />
            </div>
          </div>
        </a-card>

        <!-- 时间线 -->
        <a-card title="工单进度" class="info-card">
          <a-steps
            :current="currentStep"
            :status="stepStatus"
            direction="vertical"
            size="small"
          >
            <a-step title="提交报修" :description="formatDate(workOrder.createdAt)" />
            <a-step title="已受理" :description="workOrder.acceptedAt ? formatDate(workOrder.acceptedAt) : ''" />
            <a-step title="已派单" :description="workOrder.assignedAt ? formatDate(workOrder.assignedAt) : ''" />
            <a-step title="处理中" :description="workOrder.startedAt ? formatDate(workOrder.startedAt) : ''" />
            <a-step title="待确认" :description="workOrder.resolvedAt ? formatDate(workOrder.resolvedAt) : ''" />
            <a-step title="已完成" :description="workOrder.confirmedAt ? formatDate(workOrder.confirmedAt) : ''" />
          </a-steps>
        </a-card>
      </a-col>
    </a-row>

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
          <a-textarea v-model:value="resolveForm.resolution" :rows="4" placeholder="请描述处理过程和结果" />
        </a-form-item>
        <a-form-item label="处理后图片">
          <FileUpload v-model="resolveForm.attachments" :max-count="6" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 反馈未解决弹窗 -->
    <a-modal v-model:open="unresolveModalVisible" title="反馈未解决" @ok="confirmUnresolve">
      <a-form layout="vertical">
        <a-form-item label="反馈内容" required>
          <a-textarea v-model:value="unresolveForm.feedback" :rows="4" placeholder="请描述未解决的问题" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 取消工单弹窗 -->
    <a-modal v-model:open="cancelModalVisible" title="取消工单" @ok="confirmCancel">
      <a-form layout="vertical">
        <a-form-item label="取消原因">
          <a-textarea v-model:value="cancelForm.reason" :rows="3" placeholder="请输入取消原因（选填）" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import { ArrowLeftOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import { useAuthStore } from '../stores/auth';
import { workOrdersApi } from '../api/work-orders';
import { usersApi } from '../api/users';
import { WorkOrderStatus, Priority, AttachmentType } from '@campus-work-order/shared';
import WorkOrderStatusTag from '../components/WorkOrderStatusTag.vue';
import FileUpload from '../components/FileUpload.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const workOrder = ref<any>(null);
const workers = ref<any[]>([]);

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

const actionLabels: Record<string, string> = {
  CREATE: '创建工单',
  ACCEPT: '受理',
  ASSIGN: '派单',
  START: '开始处理',
  RESOLVE: '提交处理结果',
  CONFIRM: '确认完成',
  UNRESOLVE: '反馈未解决',
  CANCEL: '取消工单',
  REASSIGN: '重新派单',
};

const formatDate = (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss');

const beforeAttachments = computed(() =>
  workOrder.value?.attachments?.filter((a: any) => a.type === AttachmentType.BEFORE) || [],
);
const afterAttachments = computed(() =>
  workOrder.value?.attachments?.filter((a: any) => a.type === AttachmentType.AFTER) || [],
);

// 步骤条
const currentStep = computed(() => {
  if (!workOrder.value) return 0;
  const status = workOrder.value.status;
  const map: Record<string, number> = {
    [WorkOrderStatus.PENDING]: 0,
    [WorkOrderStatus.ACCEPTED]: 1,
    [WorkOrderStatus.ASSIGNED]: 2,
    [WorkOrderStatus.PROCESSING]: 3,
    [WorkOrderStatus.PENDING_CONFIRM]: 4,
    [WorkOrderStatus.COMPLETED]: 5,
    [WorkOrderStatus.UNRESOLVED]: 4,
    [WorkOrderStatus.CANCELLED]: 0,
  };
  return map[status] ?? 0;
});

const stepStatus = computed(() => {
  if (!workOrder.value) return 'process';
  const status = workOrder.value.status;
  if (status === WorkOrderStatus.COMPLETED) return 'finish';
  if (status === WorkOrderStatus.UNRESOLVED) return 'error';
  if (status === WorkOrderStatus.CANCELLED) return 'error';
  return 'process';
});

// 权限判断
const canAccept = computed(
  () => authStore.isAdmin && workOrder.value?.status === WorkOrderStatus.PENDING,
);
const canAssign = computed(
  () =>
    authStore.isAdmin &&
    (workOrder.value?.status === WorkOrderStatus.ACCEPTED ||
      workOrder.value?.status === WorkOrderStatus.UNRESOLVED),
);
const canStart = computed(
  () =>
    authStore.isWorker &&
    workOrder.value?.status === WorkOrderStatus.ASSIGNED &&
    workOrder.value?.workerId === authStore.user?.id,
);
const canResolve = computed(
  () =>
    authStore.isWorker &&
    workOrder.value?.status === WorkOrderStatus.PROCESSING &&
    workOrder.value?.workerId === authStore.user?.id,
);
const canConfirm = computed(
  () =>
    authStore.isReporter &&
    workOrder.value?.status === WorkOrderStatus.PENDING_CONFIRM &&
    workOrder.value?.reporterId === authStore.user?.id,
);
const canUnresolve = computed(
  () =>
    authStore.isReporter &&
    workOrder.value?.status === WorkOrderStatus.PENDING_CONFIRM &&
    workOrder.value?.reporterId === authStore.user?.id,
);
const canCancel = computed(
  () =>
    authStore.isAdmin &&
    [
      WorkOrderStatus.PENDING,
      WorkOrderStatus.ACCEPTED,
      WorkOrderStatus.ASSIGNED,
      WorkOrderStatus.PROCESSING,
    ].includes(workOrder.value?.status),
);

const hasAnyAction = computed(
  () => canAccept.value || canAssign.value || canStart.value || canResolve.value ||
    canConfirm.value || canUnresolve.value || canCancel.value,
);

const goBack = () => router.back();

const fetchDetail = async () => {
  const id = +route.params.id;
  workOrder.value = await workOrdersApi.findOne(id);
};

// 受理
const handleAccept = () => {
  Modal.confirm({
    title: '确认受理工单',
    content: `确定要受理工单「${workOrder.value.title}」吗？`,
    onOk: async () => {
      await workOrdersApi.accept(workOrder.value.id);
      message.success('已受理');
      fetchDetail();
    },
  });
};

// 派单
const assignModalVisible = ref(false);
const assignForm = reactive({ workerId: undefined as number | undefined });

const handleAssign = async () => {
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
  await workOrdersApi.assign(workOrder.value.id, { workerId: assignForm.workerId });
  message.success('已派单');
  assignModalVisible.value = false;
  fetchDetail();
};

// 开始处理
const handleStart = () => {
  Modal.confirm({
    title: '确认开始处理',
    content: `确定要开始处理工单「${workOrder.value.title}」吗？`,
    onOk: async () => {
      await workOrdersApi.start(workOrder.value.id);
      message.success('已开始处理');
      fetchDetail();
    },
  });
};

// 提交结果
const resolveModalVisible = ref(false);
const resolveForm = reactive({ resolution: '', attachments: [] as string[] });

const handleResolve = () => {
  resolveForm.resolution = '';
  resolveForm.attachments = [];
  resolveModalVisible.value = true;
};

const confirmResolve = async () => {
  if (resolveForm.resolution.length < 5) {
    message.warning('处理说明至少5个字符');
    return;
  }
  await workOrdersApi.resolve(workOrder.value.id, {
    resolution: resolveForm.resolution,
    attachments: resolveForm.attachments.length > 0 ? resolveForm.attachments : undefined,
  });
  message.success('已提交处理结果');
  resolveModalVisible.value = false;
  fetchDetail();
};

// 确认完成
const handleConfirm = () => {
  Modal.confirm({
    title: '确认完成工单',
    content: `确定工单「${workOrder.value.title}」已完成吗？`,
    okText: '确认完成',
    onOk: async () => {
      await workOrdersApi.confirm(workOrder.value.id);
      message.success('工单已完成');
      fetchDetail();
    },
  });
};

// 反馈未解决
const unresolveModalVisible = ref(false);
const unresolveForm = reactive({ feedback: '' });

const handleUnresolve = () => {
  unresolveForm.feedback = '';
  unresolveModalVisible.value = true;
};

const confirmUnresolve = async () => {
  if (unresolveForm.feedback.length < 5) {
    message.warning('反馈内容至少5个字符');
    return;
  }
  await workOrdersApi.unresolve(workOrder.value.id, { feedback: unresolveForm.feedback });
  message.success('已反馈未解决');
  unresolveModalVisible.value = false;
  fetchDetail();
};

// 取消工单
const cancelModalVisible = ref(false);
const cancelForm = reactive({ reason: '' });

const handleCancel = () => {
  cancelForm.reason = '';
  cancelModalVisible.value = true;
};

const confirmCancel = async () => {
  await workOrdersApi.cancel(workOrder.value.id, { reason: cancelForm.reason });
  message.success('工单已取消');
  cancelModalVisible.value = false;
  fetchDetail();
};

onMounted(fetchDetail);
</script>

<style scoped lang="scss">
.info-card {
  margin-bottom: 16px;
}

.description-text {
  white-space: pre-wrap;
  word-break: break-all;
}

.feedback-text {
  color: #ff4d4f;
}

.attachment-section {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.attachment-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #666;
}

.log-item {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .log-action {
    font-weight: 600;
  }

  .log-user {
    font-size: 13px;
    color: #1677ff;
  }

  .log-detail {
    font-size: 13px;
    color: #666;
  }

  .log-time {
    font-size: 12px;
    color: #999;
  }
}

.action-card {
  position: sticky;
  top: 24px;
}

.no-action {
  padding: 24px 0;
}

@media (max-width: 768px) {
  .action-card {
    position: static;
  }
}
</style>
