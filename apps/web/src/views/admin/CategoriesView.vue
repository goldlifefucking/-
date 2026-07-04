<template>
  <div class="categories-view">
    <div class="page-header">
      <h2 class="page-title">分类管理</h2>
      <a-button type="primary" @click="openCreateModal">
        <template #icon><PlusOutlined /></template>
        新增分类
      </a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="categories"
      :loading="loading"
      row-key="id"
      :pagination="false"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'icon'">
          <span v-if="record.icon" class="category-icon">{{ record.icon }}</span>
          <span v-else class="text-muted">-</span>
        </template>
        <template v-else-if="column.key === 'description'">
          <span>{{ record.description || '-' }}</span>
        </template>
        <template v-else-if="column.key === 'sortOrder'">
          <a-tag color="blue">{{ record.sortOrder }}</a-tag>
        </template>
        <template v-else-if="column.key === 'isActive'">
          <a-tag :color="record.isActive ? 'green' : 'default'">
            {{ record.isActive ? '启用' : '禁用' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button type="link" size="small" @click="openEditModal(record)">编辑</a-button>
            <a-popconfirm
              title="确定要删除该分类吗？"
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
      :title="isEdit ? '编辑分类' : '新增分类'"
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
        class="category-form"
      >
        <a-form-item label="分类名称" name="name">
          <a-input v-model:value="form.name" placeholder="请输入分类名称" :maxlength="30" />
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea
            v-model:value="form.description"
            placeholder="请输入分类描述"
            :rows="3"
            :maxlength="200"
          />
        </a-form-item>
        <a-form-item label="图标" name="icon">
          <a-input v-model:value="form.icon" placeholder="请输入图标（Emoji 或文字）" :maxlength="10" />
        </a-form-item>
        <a-form-item label="排序" name="sortOrder">
          <a-input-number v-model:value="form.sortOrder" :min="0" :max="9999" style="width: 100%" />
        </a-form-item>
        <a-form-item v-if="isEdit" label="状态" name="isActive">
          <a-switch
            v-model:checked="form.isActive"
            checked-children="启用"
            un-checked-children="禁用"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { message, type FormInstance } from 'ant-design-vue';
import { categoriesApi } from '../../api/categories';

interface CategoryForm {
  name: string;
  description: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

const columns = [
  { title: '分类名称', dataIndex: 'name', key: 'name' },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: '图标', dataIndex: 'icon', key: 'icon', width: 80 },
  { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 100 },
  { title: '状态', key: 'isActive', width: 100 },
  { title: '操作', key: 'action', width: 160 },
];

const categories = ref<any[]>([]);
const loading = ref(false);
const modalVisible = ref(false);
const submitting = ref(false);
const isEdit = ref(false);
const editingId = ref<number | null>(null);
const formRef = ref<FormInstance>();

const form = reactive<CategoryForm>({
  name: '',
  description: '',
  icon: '',
  sortOrder: 0,
  isActive: true,
});

const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  sortOrder: [{ required: true, message: '请输入排序值', type: 'number' as const }],
};

const resetForm = () => {
  form.name = '';
  form.description = '';
  form.icon = '';
  form.sortOrder = 0;
  form.isActive = true;
};

const fetchCategories = async () => {
  loading.value = true;
  try {
    const res: any = await categoriesApi.findAllAdmin();
    categories.value = Array.isArray(res) ? res : res.items || [];
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
  form.name = record.name;
  form.description = record.description || '';
  form.icon = record.icon || '';
  form.sortOrder = record.sortOrder;
  form.isActive = record.isActive;
  modalVisible.value = true;
};

const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    submitting.value = true;

    const payload: any = {
      name: form.name,
      description: form.description || null,
      icon: form.icon || null,
      sortOrder: form.sortOrder,
    };

    if (isEdit.value && editingId.value !== null) {
      payload.isActive = form.isActive;
      await categoriesApi.update(editingId.value, payload);
      message.success('分类更新成功');
    } else {
      await categoriesApi.create(payload);
      message.success('分类创建成功');
    }

    modalVisible.value = false;
    fetchCategories();
  } catch (err: any) {
    if (err?.errorFields) return; // 表单校验错误
    // API 错误已在拦截器中处理
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async (record: any) => {
  try {
    await categoriesApi.remove(record.id);
    message.success('分类删除成功');
    fetchCategories();
  } catch {
    // 错误已在拦截器中处理
  }
};

onMounted(() => {
  fetchCategories();
});
</script>

<style scoped lang="scss">
.categories-view {
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

  .category-icon {
    font-size: 20px;
  }

  .text-muted {
    color: #ccc;
  }

  .category-form {
    margin-top: 16px;
  }
}
</style>
