<template>
  <div class="users-view">
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
      <a-button type="primary" @click="openCreateModal">
        <template #icon><PlusOutlined /></template>
        新增用户
      </a-button>
    </div>

    <!-- 筛选区 -->
    <div class="filter-bar">
      <a-input-search
        v-model:value="keyword"
        placeholder="搜索用户名/姓名/手机号"
        style="width: 280px"
        allow-clear
        @search="fetchUsers"
      />
      <a-select
        v-model:value="roleFilter"
        placeholder="角色筛选"
        style="width: 160px"
        allow-clear
        @change="fetchUsers"
      >
        <a-select-option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </a-select-option>
      </a-select>
    </div>

    <a-table
      :columns="columns"
      :data-source="users"
      :loading="loading"
      row-key="id"
      :pagination="{ pageSize: 10, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'role'">
          <a-tag :color="roleColorMap[record.role] || 'default'">
            {{ roleLabelMap[record.role] || record.role }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'phone'">
          <span>{{ record.phone || '-' }}</span>
        </template>
        <template v-else-if="column.key === 'isActive'">
          <a-switch
            :checked="record.isActive"
            checked-children="启用"
            un-checked-children="禁用"
            @change="(checked: boolean) => handleToggleActive(record, checked)"
          />
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="openEditModal(record)">编辑</a-button>
            <a-popconfirm
              title="确定要删除该用户吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleDelete(record)"
            >
              <a-button type="link" size="small" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 新增/编辑弹窗 -->
    <a-modal
      :open="modalVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      :confirm-loading="submitting"
      :mask-closable="false"
      ok-text="保存"
      cancel-text="取消"
      @ok="handleSubmit"
      @cancel="modalVisible = false"
    >
      <a-form
        ref="formRef"
        :model="form"
        :rules="rules"
        layout="vertical"
        class="user-form"
      >
        <a-form-item v-if="!isEdit" label="用户名" name="username">
          <a-input v-model:value="form.username" placeholder="请输入用户名" :maxlength="30" />
        </a-form-item>
        <a-form-item label="姓名" name="name">
          <a-input v-model:value="form.name" placeholder="请输入姓名" :maxlength="30" />
        </a-form-item>
        <a-form-item label="角色" name="role">
          <a-select v-model:value="form.role" placeholder="请选择角色">
            <a-select-option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="手机号" name="phone">
          <a-input v-model:value="form.phone" placeholder="请输入手机号" :maxlength="11" />
        </a-form-item>
        <a-form-item v-if="isEdit" label="状态" name="isActive">
          <a-switch
            v-model:checked="form.isActive"
            checked-children="启用"
            un-checked-children="禁用"
          />
        </a-form-item>
        <a-form-item
          :label="isEdit ? '重置密码（留空不修改）' : '密码'"
          name="password"
        >
          <a-input-password v-model:value="form.password" :placeholder="isEdit ? '留空则不修改密码' : '请输入密码（至少6位）'" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { message, type FormInstance } from 'ant-design-vue';
import { usersApi } from '../../api/users';
import { UserRole, USER_ROLE_LABELS } from '@campus-work-order/shared';

const columns = [
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '角色', key: 'role', width: 100 },
  { title: '手机号', dataIndex: 'phone', key: 'phone', width: 140 },
  { title: '状态', key: 'isActive', width: 100 },
  { title: '操作', key: 'action', width: 160 },
];

const roleOptions = [
  { value: UserRole.ADMIN, label: USER_ROLE_LABELS[UserRole.ADMIN] },
  { value: UserRole.WORKER, label: USER_ROLE_LABELS[UserRole.WORKER] },
  { value: UserRole.STUDENT, label: USER_ROLE_LABELS[UserRole.STUDENT] },
  { value: UserRole.TEACHER, label: USER_ROLE_LABELS[UserRole.TEACHER] },
];

const roleColorMap: Record<string, string> = {
  [UserRole.ADMIN]: 'red',
  [UserRole.WORKER]: 'blue',
  [UserRole.STUDENT]: 'green',
  [UserRole.TEACHER]: 'orange',
};

const roleLabelMap: Record<string, string> = USER_ROLE_LABELS;

const users = ref<any[]>([]);
const loading = ref(false);
const keyword = ref('');
const roleFilter = ref<string | undefined>(undefined);
const modalVisible = ref(false);
const submitting = ref(false);
const isEdit = ref(false);
const editingId = ref<number | null>(null);
const formRef = ref<FormInstance>();

const form = reactive({
  username: '',
  name: '',
  role: undefined as string | undefined,
  phone: '',
  isActive: true,
  password: '',
});

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: [
    {
      required: false,
      validator: (_rule: any, value: string) => {
        if (isEdit.value) {
          // 编辑时留空不校验
          if (!value) return Promise.resolve();
          if (value.length < 6) return Promise.reject('密码至少6位');
          return Promise.resolve();
        }
        // 新增时必填
        if (!value) return Promise.reject('请输入密码');
        if (value.length < 6) return Promise.reject('密码至少6位');
        return Promise.resolve();
      },
      trigger: 'blur',
    },
  ],
};

const resetForm = () => {
  form.username = '';
  form.name = '';
  form.role = undefined;
  form.phone = '';
  form.isActive = true;
  form.password = '';
};

const fetchUsers = async () => {
  loading.value = true;
  try {
    const params: { role?: string; keyword?: string } = {};
    if (roleFilter.value) params.role = roleFilter.value;
    if (keyword.value.trim()) params.keyword = keyword.value.trim();
    const res: any = await usersApi.findAll(params);
    users.value = Array.isArray(res) ? res : res.items || [];
  } catch {
    // 错误已在拦截器中处理
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => {
  isEdit.value = false;
  editingId.value = null;
  resetForm();
  modalVisible.value = true;
};

const openEditModal = (record: any) => {
  isEdit.value = true;
  editingId.value = record.id;
  form.username = record.username;
  form.name = record.name;
  form.role = record.role;
  form.phone = record.phone || '';
  form.isActive = record.isActive;
  form.password = '';
  modalVisible.value = true;
};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    submitting.value = true;

    if (isEdit.value && editingId.value !== null) {
      const payload: any = {
        name: form.name,
        role: form.role,
        phone: form.phone || null,
        isActive: form.isActive,
      };
      if (form.password) {
        payload.password = form.password;
      }
      await usersApi.update(editingId.value, payload);
      message.success('用户更新成功');
    } else {
      const payload: any = {
        username: form.username,
        password: form.password,
        name: form.name,
        role: form.role,
        phone: form.phone || null,
      };
      await usersApi.create(payload);
      message.success('用户创建成功');
    }

    modalVisible.value = false;
    fetchUsers();
  } catch (err: any) {
    if (err?.errorFields) return; // 表单校验错误
    // API 错误已在拦截器中处理
  } finally {
    submitting.value = false;
  }
};

const handleToggleActive = async (record: any, checked: boolean) => {
  try {
    await usersApi.update(record.id, { isActive: checked });
    record.isActive = checked;
    message.success(checked ? '已启用' : '已禁用');
  } catch {
    // 错误已在拦截器中处理
  }
};

const handleDelete = async (record: any) => {
  try {
    await usersApi.remove(record.id);
    message.success('用户删除成功');
    fetchUsers();
  } catch {
    // 错误已在拦截器中处理
  }
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped lang="scss">
.users-view {
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

  .filter-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .user-form {
    margin-top: 16px;
  }
}
</style>
